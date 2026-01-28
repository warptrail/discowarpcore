import React, { useState, useRef, useMemo, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../api/API_BASE';
import { useContext } from 'react';
import { ToastContext } from './Toast';

// Components
import BoxControlBar from './BoxControlBar';
import NestBoxSection from './NestBoxSection';
import EditBoxDetailsForm from './EditBoxDetailsForm';
import DestroyBoxSection from './DestroyBoxSection';
import ItemEditForm from './ItemEditForm';
import MiniOrphanedList from './MiniOrphanedList';
import AddItemToThisBoxForm from './AddItemToThisBoxForm';

export default function BoxActionPanel({
  boxTree,
  boxMongoId,
  onItemUpdated,
  refreshBox,
  orphanedItems,
  fetchOrphanedItems,
  onItemAssigned,
  onBoxMetaUpdated,
  onBoxSaved,
  busy,
  onDeleted,
  onRequestDelete,
}) {
  // ? STATE
  const [openItemId, setOpenItemId] = useState(null);
  const [visibleItemId, setVisibleItemId] = useState(null);
  const [itemEditHeight, setItemEditHeight] = useState('0px');
  // const [movePrompt, setMovePrompt] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [zippingItemId, setZippingItemId] = useState(null);
  const [zippingIds, setZippingIds] = useState(() => new Set());
  const [justReturnedIds, setJustReturnedIds] = useState(() => new Set());
  const [isUndoing, setIsUndoing] = useState(false);
  const [justReturnedItemId, setJustReturnedItemId] = useState(null);
  const [itemsUI, setItemsUI] = useState(() =>
    Array.isArray(boxTree?.items) ? boxTree.items : [],
  );
  const [showBoxDetails, setShowBoxDetails] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [detailsHeight, setDetailsHeight] = useState(0);

  // Panel mode flags
  const isDestroyMode = activePanel === 'destroy';
  const isEmptyMode = activePanel === 'empty';

  //? CONTEXT
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;

  // ? REF
  const timeoutRef = useRef(null);
  const itemEditRef = useRef(null);
  const moveTimersRef = useRef({ pre: null, zip: null });
  const undoFlashTimerRef = useRef(null);
  const enterFlashTimerRef = useRef(null);
  const enteringIdsRef = useRef(new Set()); // items queued to enter invisibly first
  // Full item snapshots by id to support optimistic undo/re-add
  const itemSnapshotRef = useRef(new Map()); // Map<string, Item>
  const detailsInnerRef = useRef(null);
  const lastEmptiedRef = useRef({ boxId: null, items: [], at: 0 });
  // Guard: true while an empty operation is in flight, to prevent UI resync from stale props
  const isEmptyingRef = useRef(false);

  // ? Navigate
  const navigate = useNavigate();
  const { shortId: routeShortId } = useParams();
  const ANIM_LEAVE_MS = 1000; // must match zipAway duration
  // Direct items only (no child box items)
  const directItems = useMemo(
    () => (Array.isArray(boxTree?.items) ? boxTree.items : []),
    [boxTree],
  );

  // For toggling the activePanel state from BoxControlBar
  const togglePanel = (boxCtrlBtn) =>
    setActivePanel((prev) => {
      const next = prev === boxCtrlBtn ? null : boxCtrlBtn;
      // If we are leaving Empty mode, cancel its confirmation toast
      if (prev === 'empty' && next !== 'empty') {
        hideToast?.();
      }
      return next;
    });
  // Dedicated handler for Empty tab: toggles empty mode and shows confirm toast
  const handleEmptyTab = () => {
    setActivePanel((prev) => {
      if (prev === 'empty') {
        // Toggle off = cancel
        hideToast?.();
        return null;
      }
      // Enter empty mode and show confirm toast
      requestEmptyConfirm();
      return 'empty';
    });
  };

  // Snapshot cache helpers
  const getItemFromUIById = (id) =>
    (itemsUI || []).find((it) => (it?._id ?? it?.id) === id);

  /** Capture a deep-ish snapshot of an item before we remove it from this box */
  const snapshotItem = (id) => {
    const it = getItemFromUIById(id);
    if (!it) return null;
    // shallow clone is usually fine; deep clone if nested fields matter
    const snap = { ...it };
    itemSnapshotRef.current.set(id, snap);
    return snap;
  };

  const getSnapshotOrFallback = (id) =>
    itemSnapshotRef.current.get(id) || getItemFromUIById(id) || null;

  const getItemName = (id) => {
    const snap = getSnapshotOrFallback(id);
    return snap?.name || '(Unnamed Item)';
  };

  // Set Helpers
  const addAll = (setObj, ids) => new Set([...setObj, ...ids]);
  const removeAll = (setObj, ids) => {
    const next = new Set(setObj);
    ids.forEach((id) => next.delete(id));
    return next;
  };

  // Animation helpers
  const preEnterBatch = (ids) =>
    ids.forEach((id) => enteringIdsRef.current.add(id));
  const startBatchEntered = async (ids, { undo = false } = {}) => {
    // wait two frames so rows exist before we animate
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    setJustReturnedIds((curr) => addAll(curr, ids));
    if (undo) setIsUndoing(true);
    // zip-in (≈280ms) + 2 flashes (≈2×600ms) + small buffer
    setTimeout(() => {
      setJustReturnedIds((curr) => removeAll(curr, ids));
      if (undo) setIsUndoing(false);
      ids.forEach((id) => enteringIdsRef.current.delete(id));
    }, 1600);
  };
  const markBatchLeaving = (ids) => setZippingIds((curr) => addAll(curr, ids));
  const clearBatchLeaving = (ids) =>
    setZippingIds((curr) => removeAll(curr, ids));

  const handleToggle = (itemId) => {
    if (openItemId === itemId) {
      setOpenItemId(null); // begin closing
      timeoutRef.current = setTimeout(() => {
        setVisibleItemId(null); // unmount after slide-up finishes
      }, 300); // must match animation time
    } else {
      clearTimeout(timeoutRef.current); // cancel any previous close
      setVisibleItemId(itemId); // mount immediately
      // wait until it's rendered, then animate open on the next frame
      requestAnimationFrame(() => {
        setOpenItemId(itemId);
      });
    }
  };

  // --- shared tiny helpers (put near the other handlers) ---
  const nextTwoFrames = () =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const handleFormSaved = async (updated) => {
    const navigated = onBoxSaved?.(updated) === true;
    if (navigated) {
      // parent navigated to /boxes/:newShortId; this panel will unmount
      return;
    }

    // shortId unchanged → finish local edit UX here
    setActivePanel(null); // close “Edit Details” section
    await refreshBox?.(); // reconcile latest data
    // TODO(toast): show Box updated via ToastContext
  };

  const handleMoveRequest = async ({
    itemId,
    itemName, // may be undefined; we’ll fall back to snapshot
    itemQuantity, // may be undefined; we’ll fall back to snapshot
    sourceBoxId,
    destBoxId,
    destLabel,
    destShortId, // may be undefined; we’ll display gracefully
  }) => {
    if (isMoving) return;
    setIsMoving(true);

    // 🔸 Snapshot BEFORE we mutate or animate (so we can show name/qty in toast + undo)
    const snap = snapshotItem(itemId);
    const nameForToast = itemName ?? snap?.name ?? '(Unnamed Item)';
    const qtyForToast = itemQuantity ?? snap?.quantity ?? null;

    try {
      // 1) Close the editor
      setOpenItemId(null);

      // 2) Let the close commit visually (2 RAFs)
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      // 3) Trigger zip-out
      setZippingItemId(itemId);

      // 4) Wait for the animation duration (1s to match your CSS)
      await new Promise((r) => setTimeout(r, 1000));

      // 5) Perform the move
      const res = await fetch(
        'http://localhost:5002/api/boxed-items/moveItem',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, sourceBoxId, destBoxId }),
        },
      );
      if (!res.ok) throw new Error('Move failed');

      // 6) Refresh canonical data once
      await refreshBox();

      // 7) Clear the zip flag if this item is gone from this list
      clearZipIfMatches(itemId);

      // 8) Toast: show name, quantity (if known), and destination label/short id
      // TODO(toast): show Item moved via ToastContext
    } catch (e) {
      console.error('[handleMoveRequest] failed:', e);
      // Roll back the zip so the row doesn’t stay ghosted
      setZippingItemId(null);
    } finally {
      setIsMoving(false);
    }
  };

  const undoOrphan = async ({ boxMongoId, itemId, itemName }) => {
    try {
      // 1) Optimistic re-insert + pre-enter (no first-frame flicker)
      enteringIdsRef.current.add(itemId);
      setItemsUI((prev) => {
        const exists = prev.some((x) => (x?._id ?? x) === itemId);
        if (exists) return prev;
        // minimal placeholder; your refresh will hydrate real fields
        return [...prev, { _id: itemId, name: itemName }];
      });

      // 2) Flag undo + trigger zip-in + yellow flash immediately
      setIsUndoing(true);
      // ensure the row is mounted before we mark it as "returned"
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      setJustReturnedItemId(itemId);

      // 3) Fire backend (re-attach)
      const res = await fetch(
        `http://localhost:5002/api/boxed-items/${boxMongoId}/addItem`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        },
      );
      if (!res.ok) throw new Error('Undo orphan failed');

      // 4) Reconcile with server
      await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);
    } catch (err) {
      console.error('[undoOrphan] failed:', err);
      // Roll back optimistic insert if it was only a placeholder
      setItemsUI((prev) => prev.filter((x) => (x?._id ?? x) !== itemId));
    } finally {
      // clear undo flags after the yellow flash completes (~2×600ms)
      setTimeout(() => {
        setIsUndoing(false);
        setJustReturnedItemId((curr) => (curr === itemId ? null : curr));
        enteringIdsRef.current.delete(itemId);
      }, 1200);
    }
  };

  const undoMove = async ({ itemId, itemName, sourceBoxId, destBoxId }) => {
    try {
      // Optimistic re-insert
      enteringIdsRef.current.add(itemId);
      setItemsUI((prev) => {
        const exists = prev.some((x) => (x?._id ?? x) === itemId);
        if (exists) return prev;
        return [...prev, { _id: itemId, name: itemName }];
      });

      // Kick yellow zip-in immediately
      setIsUndoing(true);
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      setJustReturnedItemId(itemId);

      // Reverse the move: dest -> source
      const res = await fetch(
        'http://localhost:5002/api/boxed-items/moveItem',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId,
            sourceBoxId: destBoxId,
            destBoxId: sourceBoxId,
          }),
        },
      );
      if (!res.ok) throw new Error('Undo move failed');

      await refreshBox?.();
    } catch (e) {
      console.error('[undoMove] failed:', e);
      setItemsUI((prev) => prev.filter((x) => (x?._id ?? x) !== itemId));
    } finally {
      setTimeout(() => {
        setIsUndoing(false);
        setJustReturnedItemId((curr) => (curr === itemId ? null : curr));
        enteringIdsRef.current.delete(itemId);
      }, 1200);
    }
  };

  const handleOrphanRequest = async ({ itemId, boxMongoId }) => {
    if (isMoving) return;
    setIsMoving(true);

    // 🔸 take snapshot before we zip out / mutate lists
    const snap = snapshotItem(itemId);
    // const itemName = snap?.name || getItemName(itemId);

    try {
      setOpenItemId(null);
      await nextTwoFrames();
      setZippingItemId(itemId);
      await sleep(1000);

      const res = await fetch(
        `http://localhost:5002/api/boxed-items/${boxMongoId}/removeItem`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Orphan failed');

      await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);
      clearZipIfMatches(itemId);

      // TODO(toast): show Item orphaned via ToastContext
    } catch (e) {
      console.error('[handleOrphanRequest] failed:', e);
      setZippingItemId(null);
    } finally {
      setIsMoving(false);
    }
  };

  // ENTER (green): zip-in (280ms) + 2 flashes @ 300ms → ~880ms + buffer
  const markEntered = async (itemId) => {
    if (!itemId) return;
    if (enterFlashTimerRef.current) {
      clearTimeout(enterFlashTimerRef.current);
      enterFlashTimerRef.current = null;
    }

    await nextTwoFrames(); // ensure <li> is mounted
    enteringIdsRef.current.delete(itemId); // no longer pre-enter; it can animate now
    setJustReturnedItemId(itemId); // zip-in + green flash kicks in

    enterFlashTimerRef.current = setTimeout(() => {
      setJustReturnedItemId((curr) => (curr === itemId ? null : curr));
      enterFlashTimerRef.current = null;
    }, 1000); // ~280 (zip) + 2*300 (flashes) + buffer
  };

  // UNDO (yellow): flashes twice @ 300ms; total ~600ms + buffer
  const markJustReturned = (itemId) => {
    // clear any prior undo timer
    if (undoFlashTimerRef.current) {
      clearTimeout(undoFlashTimerRef.current);
      undoFlashTimerRef.current = null;
    }
    setJustReturnedItemId(itemId);

    undoFlashTimerRef.current = setTimeout(() => {
      setJustReturnedItemId(null);
      undoFlashTimerRef.current = null;
    }, 800); // your existing buffer (~600ms + 200ms)
  };

  const handleItemAdded = (newItem) => {
    const id = newItem?._id ?? newItem?.id;
    // const name = newItem?.name ?? '(Unnamed Item)';
    // const qty = newItem?.quantity;
    if (id) enteringIdsRef.current.add(id); // pre-enter mask

    setItemsUI((prev) => (id ? [...prev, newItem] : prev));
    resetItemUIState?.();

    // Start the entrance animation (zip-in + green flash)
    markEntered(id);
    // TODO(toast): show Item added via ToastContext

    // Keep server state in sync
    fetchOrphanedItems?.();
    refreshBox?.();
  };

  const handleItemAssigned = async (itemId) => {
    if (itemId) enteringIdsRef.current.add(itemId); // pre-enter mask

    await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);

    if (itemId) {
      // Animate entrance
      markEntered(itemId);
      // TODO(toast): show Item added via ToastContext
    }

    onItemAssigned?.(itemId);
  };

  // Snapshot helpers
  const snapshotBoxItems = () => (itemsUI || []).map((it) => ({ ...it })); // full objects (for immediate form data)
  const idsOf = (items) => items.map((it) => it?._id ?? it?.id).filter(Boolean);

  // Backend helper (reattach one item)
  const attachOne = async (itemId) => {
    const res = await fetch(
      `http://localhost:5002/api/boxed-tiems/${boxMongoId}/addItem`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      },
    );
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || 'Attach failed');
    }
  };

  const attachMany = async (itemIds) => {
    const res = await fetch(
      `http://localhost:5002/api/boxed-items/${boxMongoId}/addItems`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Attach many failed');
    return data;
  };

  // ---------- HANDLE: Empty the box (batch zip-out + red, toast with Undo) ----------
  const handleEmptyBox = async () => {
    // 1) Take a full snapshot (so undo has complete item data for forms/toasts)
    const snapshot = snapshotBoxItems();
    const ids = idsOf(snapshot);
    if (!ids.length) return;

    // Save snapshot for undo
    lastEmptiedRef.current = {
      boxId: boxMongoId,
      items: snapshot,
      at: Date.now(),
    };
    isEmptyingRef.current = true;

    // 2) Kick batch zip-out animation
    markBatchLeaving(ids);

    try {
      // 2) Kick backend in parallel
      const req = fetch(
        `http://localhost:5002/api/boxed-items/${boxMongoId}/empty`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        },
      ).then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || 'Failed to empty');
        return body;
      });

      // 3) Guarantee at least 1s of animation before we reconcile
      const [, body] = await Promise.all([
        new Promise((r) => setTimeout(r, ANIM_LEAVE_MS)),
        req,
      ]);

      const count = body?.orphanedCount ?? ids.length;

      // 4) Now reconcile (this is when rows actually disappear from data)
      await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);
      // Commit local UI to the emptied state immediately (prevents stale directItems from repopulating)
      setItemsUI([]);

      // 5) Clear leaving flags
      clearBatchLeaving(ids);
      isEmptyingRef.current = false;

      // 6) Toast with Undo
      showToast?.({
        variant: 'success',
        title: 'Box emptied',
        message: `Orphaned ${count} item${count === 1 ? '' : 's'}.`,
        sticky: true,
        actions: [
          {
            id: `undo-empty-${boxMongoId}-${lastEmptiedRef.current.at}`,
            label: 'Undo',
            kind: 'primary',
            onClick: async () => {
              hideToast?.();
              await undoEmpty();
            },
          },
        ],
      });
    } catch (e) {
      console.error('[handleEmptyBox] failed:', e);
      // Roll back leaving flags
      clearBatchLeaving(ids);
      isEmptyingRef.current = false;
      showToast?.({
        variant: 'danger',
        title: 'Empty failed',
        message: e?.message || 'Failed to empty this box.',
        sticky: true,
        actions: [
          {
            id: 'dismiss-empty-failed',
            label: 'Dismiss',
            kind: 'ghost',
            onClick: () => hideToast?.(),
          },
        ],
      });
    }
  };

  // ---------- CONFIRM: Empty box (warning toast) ----------
  const requestEmptyConfirm = () => {
    console.log('[BoxActionPanel] Empty clicked → requestEmptyConfirm');
    console.log('[BoxActionPanel] toastCtx:', toastCtx);
    console.log('[BoxActionPanel] typeof showToast:', typeof showToast);

    // TEMP DEBUG: force a simple toast so we can verify Header wiring
    if (typeof showToast === 'function') {
      showToast({
        variant: 'warning',
        title: 'Toast pipe test',
        message: 'If you see this in the header, Context is flowing. 🖖',
        timeoutMs: 3000,
      });
    } else {
      console.warn(
        '[BoxActionPanel] showToast is not a function — ToastProvider or exports may be miswired',
      );
    }

    const snapshot = snapshotBoxItems();
    const ids = idsOf(snapshot);

    if (!ids.length) {
      showToast?.({
        variant: 'info',
        title: 'Nothing to empty',
        message: 'This box is already empty.',
        timeoutMs: 2200,
      });
      return;
    }

    showToast?.({
      variant: 'warning',
      title: 'Empty this box?',
      message: `This will orphan ${ids.length} item${ids.length === 1 ? '' : 's'}. You can undo right after.`,
      sticky: true,
      actions: [
        {
          id: 'cancel-empty',
          label: 'Cancel',
          kind: 'ghost',
          onClick: () => {
            hideToast?.();
            setActivePanel((prev) => (prev === 'empty' ? null : prev));
          },
        },
        {
          id: 'confirm-empty',
          label: 'Empty',
          kind: 'danger',
          onClick: async () => {
            hideToast?.();
            setActivePanel((prev) => (prev === 'empty' ? null : prev));
            await handleEmptyBox();
          },
        },
      ],
    });
  };

  // ---- Bulk attach helper (matches your API style)

  // ---- Undo the last "empty box" (optimistic restore + batch animations) ------
  const undoEmpty = async () => {
    // 0) Read the snapshot we saved during handleEmptyBox()
    //    lastEmptiedRef.current = { boxId, items: [full item objects], at }
    const { boxId, items } = lastEmptiedRef.current || {};

    // Guard: if there’s no snapshot (or it’s for a different box), bail nicely.
    if (!items?.length || boxId !== boxMongoId) {
      // TODO(toast): show Nothing to undo via ToastContext
      isEmptyingRef.current = false;
      return;
    }

    // 1) We’ll work with just the IDs for animation/attachMany
    const ids = idsOf(items); // e.g., ['64f…', '68a…', ...]

    try {
      // 2) PRE-ENTER MASK — avoid first-frame flicker on newly inserted rows.
      //    We add all ids to a Set tracked by enteringIdsRef so the ItemRow
      //    initially renders "invisible at frame 0 of zip-in".
      preEnterBatch(ids);

      // 3) OPTIMISTIC REINSERT — show the items immediately in the UI so the
      //    app feels snappy and forms have data if the user expands one.
      //    We only add items that aren’t already present locally.
      setItemsUI((prev) => {
        const existing = new Set((prev || []).map((x) => x?._id ?? x?.id));
        const add = items.filter((it) => !existing.has(it._id));
        return [...prev, ...add];
      });

      // 4) START ANIMATION — zip-in + yellow “undo” flash (batch).
      //    startBatchEntered waits two RAFs to ensure rows are mounted, then:
      //      - puts all ids into justReturnedIds (→ $zip='in')
      //      - if undo=true, sets isUndoing (→ $flash='yellow')
      //      - clears both after ~1.6s (zip + two flashes + small buffer)
      await startBatchEntered(ids, { undo: true });

      // 5) BACKEND — tell the server to attach ALL items back to this box.
      //    This is the key change: one bulk API instead of N sequential PATCHes.
      await attachMany(ids);

      // 6) RECONCILE — refresh canonical state (box + orphan list)
      await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);
      isEmptyingRef.current = false;

      // (Optional) You could clear lastEmptiedRef here so it’s a one-shot undo:
      // lastEmptiedRef.current = { boxId: null, items: [], at: 0 };
    } catch (e) {
      console.error('[undoEmpty] failed:', e);

      // 7) ROLLBACK — if the server operation failed, remove the items we
      //    optimistically reinserted so the UI isn’t lying to the user.
      setItemsUI((prev) => prev.filter((x) => !ids.includes(x?._id ?? x?.id)));

      // Clear animation flags so nothing remains in a “returning” state.
      setJustReturnedIds((curr) => removeAll(curr, ids));
      ids.forEach((id) => enteringIdsRef.current.delete(id));
      setIsUndoing(false);
      isEmptyingRef.current = false;

      // TODO(toast): show Undo failed via ToastContext
    }
  };

  // todo
  const handleNestBox = () => {
    console.log('chirp chirp chirp');
  };

  const resetItemUIState = () => {
    setOpenItemId(null);
    setVisibleItemId(null);
    setItemEditHeight('0px');
    setIsMoving(false);
    setZippingItemId(null);
    setIsUndoing(false);
    setJustReturnedItemId(null);
  };

  // use when a specific item left this box successfully
  const clearZipIfMatches = (itemId) => {
    setZippingItemId((curr) => (curr === itemId ? null : curr));
  };

  // ! ================ USE EFFECTS ===================

  // 1) Auto-measure the edit panel height when a row opens/closes
  useEffect(() => {
    if (openItemId && itemEditRef.current) {
      setItemEditHeight(`${itemEditRef.current.scrollHeight}px`);
    } else {
      setItemEditHeight('0px');
    }
  }, [openItemId]);

  // 2) Keep local UI list in sync with incoming direct items (this box only)
  useEffect(() => {
    // During a batch empty, directItems can temporarily lag behind backend truth.
    // Avoid rehydrating the UI from stale props; only accept updates once the box
    // actually reports empty (or we're not emptying).
    const next = directItems || [];
    if (isEmptyingRef.current && next.length > 0) return;
    setItemsUI(next);
    // console.log(next, 'direct items'); // optional: remove noisy logs in prod
  }, [directItems]);

  // 3) On mount: fetch the orphaned list once
  useEffect(() => {
    fetchOrphanedItems?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) Safety: if an item is zipping out and disappears from itemsUI after a refresh,
  //    clear the animation flag so it doesn't "stick" and affect future renders.
  useEffect(() => {
    if (!zippingItemId) return;
    const present = (itemsUI || []).some(
      (it) => (it?._id ?? it) === zippingItemId,
    );
    if (!present) setZippingItemId(null);
  }, [itemsUI, zippingItemId]);

  // 5) Unified unmount cleanup for ALL timers/refs related to animations and toasts.
  //    This replaces the multiple duplicated cleanup effects.
  useEffect(() => {
    return () => {
      // clear single-timeout refs (if set)
      [timeoutRef, undoFlashTimerRef, enterFlashTimerRef].forEach((ref) => {
        if (ref?.current) {
          clearTimeout(ref.current);
          ref.current = null;
        }
      });

      // clear move animation timers (object with { pre, zip })
      if (moveTimersRef?.current) {
        const { pre, zip } = moveTimersRef.current;
        if (pre) clearTimeout(pre);
        if (zip) clearTimeout(zip);
        moveTimersRef.current = { pre: null, zip: null };
      }

      // clear the pre-enter queue
      if (enteringIdsRef?.current?.clear) {
        enteringIdsRef.current.clear();
      }
    };
    // empty deps: run once on unmount
  }, []);

  useEffect(() => {
    if (showBoxDetails) {
      // measure on open (and after content changes if you add deps)
      const h = detailsInnerRef.current?.scrollHeight ?? 0;
      setDetailsHeight(h);
    }
  }, [showBoxDetails]); // add other deps if the form’s size can change while open

  return (
    <PanelContainer>
      {/* TODO(toast): Toast UI handled via ToastContext */}
      {/* // ? {Box Actions switch bar } */}
      <BoxControlBar
        active={activePanel}
        onClickEmpty={handleEmptyTab} // confirm via toast + enter empty mode
        onClickNest={() => togglePanel('nest')}
        onClickEdit={() => togglePanel('edit')}
        onClickDestroy={() => togglePanel('destroy')}
        busy={isMoving}
      />

      {/* Nest inline section */}
      <NestBoxSection
        open={activePanel === 'nest'}
        onClose={() => setActivePanel(null)}
        onConfirm={(dest) => {
          // dest = { mongoId, label, shortId }
          // call backend here, then refreshBox()
        }}
        sourceBoxMongoId={boxMongoId}
        sourceBoxLabel={boxTree?.label}
        boxTree={boxTree} // Option A
        busy={busy || isMoving}
      />

      {/* Edit details collapsible panel */}
      <DetailsPanel $open={activePanel === 'edit'} $maxHeight={420}>
        {activePanel === 'edit' && (
          <EditBoxDetailsForm
            boxMongoId={boxMongoId}
            initial={boxTree}
            onSaved={handleFormSaved}
            onCancel={() => setActivePanel(null)}
          />
        )}
      </DetailsPanel>

      {/* Destroy box confirmation panel (inline) */}
      <DestroyBoxSection
        open={activePanel === 'destroy'}
        onCancel={() => setActivePanel(null)}
        shortId={routeShortId} // <-- the human-friendly ID
        boxMongoId={boxMongoId} // <-- the actual Mongo ObjectId
        onRequestDelete={onRequestDelete}
        busy={busy}
      />

      {/* Items map and related UI, only shown when not in destroy mode */}
      {!isDestroyMode && (
        <>
          {/* {Items map} */}
          {itemsUI.length === 0 ? (
            <EmptyMessage>
              This box is empty. Add some items below.
            </EmptyMessage>
          ) : (
            <ItemList>
              {itemsUI.map((item) => {
                const id = item._id;
                const isOpen = openItemId === id;
                const isVisible = visibleItemId === id;
                const leavingByBatch = zippingIds.has(id);
                const leavingBySingle = zippingItemId === id;
                const enteringByBatch = justReturnedIds.has(id);
                const enteringBySingle = justReturnedItemId === id;
                const isLeaving = leavingByBatch || leavingBySingle;
                const isUndo =
                  isUndoing && (enteringByBatch || enteringBySingle);
                const isEntering = enteringByBatch || enteringBySingle; // includes undo
                const isPreEnter = enteringIdsRef.current.has(id); // 👈 first paint mask
                const zipProp = isLeaving
                  ? 'out'
                  : isEntering
                    ? 'in'
                    : undefined;
                const flashProp = isUndo
                  ? 'yellow'
                  : isEntering
                    ? 'green'
                    : isLeaving
                      ? 'red'
                      : undefined;

                return (
                  <div key={item._id}>
                    <ItemRow
                      onClick={() => handleToggle(item._id)}
                      $isOpen={isOpen}
                      $zip={zipProp}
                      $flash={flashProp}
                      $flashDelay={isEntering ? 280 : 0} // flash after zip-in; immediate for undo/leave
                      $preEnter={isPreEnter}
                    >
                      <BoxLabel>{item.name || '(Unnamed Item)'}</BoxLabel>
                    </ItemRow>

                    {isVisible && (
                      <ItemEditWrapper
                        $isOpen={isOpen}
                        $maxHeight={itemEditHeight}
                      >
                        <div ref={itemEditRef}>
                          <ItemEditForm
                            key={item.item_id}
                            initialItem={item}
                            boxId={routeShortId}
                            boxMongoId={boxMongoId}
                            sourceBoxId={boxMongoId}
                            sourceBoxLabel={boxTree?.label}
                            sourceBoxShortId={routeShortId}
                            onClose={() => handleToggle(item._id)}
                            onItemUpdated={onItemUpdated}
                            onMoveRequest={handleMoveRequest}
                            onOrphanRequest={handleOrphanRequest}
                            refreshBox={refreshBox}
                          />
                        </div>
                      </ItemEditWrapper>
                    )}
                  </div>
                );
              })}
            </ItemList>
          )}
        </>
      )}
      {!isDestroyMode && (
        <MiniOrphanedList
          boxMongoId={boxMongoId}
          onItemAssigned={handleItemAssigned}
          onItemUpdated={onItemUpdated}
          orphanedItems={orphanedItems}
          fetchOrphanedItems={fetchOrphanedItems}
        />
      )}
      {!isDestroyMode && !isEmptyMode && (
        <AddItemToThisBoxForm
          boxMongoId={boxMongoId}
          onAdded={handleItemAdded}
          boxShortId={routeShortId}
        />
      )}
    </PanelContainer>
  );
}

//? Styled Components

const ItemEditWrapper = styled.div`
  overflow: hidden;
  max-height: ${({ $isOpen }) => ($isOpen ? '800px' : '0')};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  transform: ${({ $isOpen }) =>
    $isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease,
    transform 0.3s ease;
`;

const PanelContainer = styled.div`
  background-color: #121212;
  padding: 1rem;
  border-radius: 12px;
`;

const zipIn = keyframes`
  from { transform: translateX(-40%) scale(.98); opacity: 0; }
  to   { transform: translateX(0)      scale(1);  opacity: 1; }
`;

const zipAway = keyframes`
  to { transform: translateX(40%) scale(.96); opacity: 0; }
`;

// 2 blinks; we’ll color via CSS vars so we can switch colors per prop
const flashBorder = keyframes`
  0%   { box-shadow: 0 0 0 0 var(--flash-shadow, transparent); }
  50%  { box-shadow: 0 0 0 3px var(--flash-shadow, transparent); }
  100% { box-shadow: 0 0 0 0 var(--flash-shadow, transparent); }
`;

const FLASH_MAP = {
  green: { border: '#4bd17a', shadow: 'rgba(75, 209, 122, .45)' },
  yellow: { border: '#ffd400', shadow: 'rgba(255, 212,   0, .45)' },
  red: { border: '#ff6b6b', shadow: 'rgba(255, 107, 107, .45)' },
};

const undoBorderFlash = keyframes`
  0%   { border-color: #ffd400; }
  50%  { border-color: transparent; }
  100% { border-color: #ffd400; }
`;

const ItemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ItemRow = styled.li`
  background-color: ${({ $isOpen }) => ($isOpen ? '#1b2a1f' : '#222')};
  color: ${({ $isOpen }) => ($isOpen ? '#d9f2e6' : '#e4e4e4')};
  padding: 0.75rem 1rem;
  border-radius: ${({ $isOpen }) => ($isOpen ? '8px 8px 0 0' : '8px')};
  cursor: pointer;
  border: ${({ $isOpen }) =>
    $isOpen ? '1px solid #3fa46a' : '1px solid #2f2f2f'};
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
  will-change: transform, opacity;

  /* Pre-enter pose to avoid first-frame flicker */
  ${({ $preEnter }) =>
    $preEnter &&
    css`
      transform: translateX(-40%) scale(0.98);
      opacity: 0;
    `}

  /* Zip animation */
  ${({ $zip }) =>
    $zip === 'in'
      ? css`
          animation: ${zipIn} 280ms ease-out both;
        `
      : $zip === 'out'
        ? css`
            animation: ${zipAway} 1000ms ease-in forwards;
            pointer-events: none;
          `
        : ''}

  /* Flash (uses outline so no layout shift) */
  ${({ $flash, $flashDelay = 0, $zip }) => {
    if (!$flash) return '';
    const c = FLASH_MAP[$flash] || FLASH_MAP.yellow;
    const base = css`
      outline: 2px dashed ${c.border};
      outline-offset: 0;
      box-shadow: 0 0 0 0 ${c.shadow};
    `;
    if ($zip === 'in') {
      return css`
        ${base};
        animation:
          ${zipIn} 280ms ease-out both,
          ${flashBorder} 600ms ease-out ${$flashDelay}ms 2;
      `;
    }
    if ($zip === 'out') {
      return css`
        ${base};
        animation:
          ${zipAway} 1000ms ease-in forwards,
          ${flashBorder} 600ms ease-out ${$flashDelay}ms 2;
      `;
    }
    return css`
      ${base};
      animation: ${flashBorder} 600ms ease-out ${$flashDelay}ms 2;
    `;
  }}


  &:hover {
    background-color: #2d3d31;
    border-color: #4ec77b;
    color: #e9fcee;
    box-shadow: 0 0 6px rgba(78, 199, 123, 0.4);
  }
`;

const BoxLabel = styled.h3`
  /* margin: 2rem 0 1rem; */
  font-size: 1.1rem;

  /* border-top: 1px solid #333; */
  padding-top: 0.2rem;
`;

const EmptyMessage = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-size: 0.95rem;
  margin-top: 0.5rem;
`;

const DetailsPanel = styled.div`
  overflow: hidden;
  background: #191919;
  border-radius: 10px;
  transition:
    max-height 220ms ease,
    margin-bottom 220ms ease,
    border-color 220ms ease;

  /* closed state */
  max-height: 0;
  margin-bottom: 0;
  border: 0;

  /* open state */
  ${({ $open, $maxHeight = 400 }) =>
    $open &&
    css`
      max-height: ${$maxHeight}px; /* use a fixed height OR pass a measured value */
      margin-bottom: 12px;
      border: 1px solid #2f2f2f;
    `}
`;
