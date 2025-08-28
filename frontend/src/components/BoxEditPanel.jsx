import React, { useState, useRef, useMemo, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Components
import BoxControlBar from './BoxControlBar';
import NestBoxSection from './NestBoxSection';
import EditBoxDetailsForm from './EditBoxDetailsForm';
import DestroyBoxSection from './DestroyBoxSection';
import ItemEditForm from './ItemEditForm';
import MiniOrphanedList from './MiniOrphanedList';
import AddItemToThisBoxForm from './AddItemToThisBoxForm';
import BoxActionToast from './BoxActionToast';

export default function BoxEditPanel({
  flatItems,
  boxTree,
  shortId,
  boxMongoId,
  onItemUpdated,
  refreshBox,
  orphanedItems,
  fetchOrphanedItems,
  onItemAssigned,
  onBoxMetaUpdated,
  onBoxSaved,
}) {
  // ? STATE
  const [openItemId, setOpenItemId] = useState(null);
  const [visibleItemId, setVisibleItemId] = useState(null);
  const [itemEditHeight, setItemEditHeight] = useState('0px');
  // const [movePrompt, setMovePrompt] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [zippingItemId, setZippingItemId] = useState(null);
  const [zippingIds, setZippingIds] = useState(() => new Set());
  const [justReturnedIds, setJustReturnedIds] = useState(() => new Set());
  const [isUndoing, setIsUndoing] = useState(false);
  const [justReturnedItemId, setJustReturnedItemId] = useState(null);
  const [itemsUI, setItemsUI] = useState(flatItems || []);
  const [showBoxDetails, setShowBoxDetails] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [detailsHeight, setDetailsHeight] = useState(0);

  // ? REF
  const timeoutRef = useRef(null);
  const itemEditRef = useRef(null);
  const clearToastTimerRef = useRef(null);
  const moveTimersRef = useRef({ pre: null, zip: null });
  const undoFlashTimerRef = useRef(null);
  const enterFlashTimerRef = useRef(null);
  const enteringIdsRef = useRef(new Set()); // items queued to enter invisibly first
  // Full item snapshots by id to support optimistic undo/re-add
  const itemSnapshotRef = useRef(new Map()); // Map<string, Item>
  const detailsInnerRef = useRef(null);
  const lastEmptiedRef = useRef({ boxId: null, items: [], at: 0 });

  // ? Navigate
  const navigate = useNavigate();
  const ANIM_LEAVE_MS = 1000; // must match zipAway duration

  // For toggling the activePanel state from BoxControlBar
  const togglePanel = (boxCtrlBtn) =>
    setActivePanel((prev) => (prev === boxCtrlBtn ? null : boxCtrlBtn));
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
      requestAnimationFrame(() => requestAnimationFrame(r))
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

  // Snapshot Helpers

  // Toast Controls

  const getItemNameById = (id) => {
    if (!id) return 'Item';
    // Try orphaned list first (assign flow)
    const o = orphanedItems?.find?.((x) => x?._id === id);
    if (o?.name) return o.name;

    // Try itemsUI next (added/after refresh)
    const i = itemsUI?.find?.((x) => (x?._id ?? x) === id);
    if (i?.name) return i.name;

    return 'Item';
  };

  // Utilities to build consistent labels
  const fmtQtyName = (name, qty) =>
    qty != null && qty !== undefined ? `${name} ×${qty}` : name;
  const fmtDest = (label, shortId) =>
    shortId ? `${label} (#${shortId})` : label;

  const showToast = (cfg) => {
    // cancel any previous auto-dismiss timer
    if (clearToastTimerRef.current) {
      clearTimeout(clearToastTimerRef.current);
      clearToastTimerRef.current = null;
    }

    const id = Date.now();
    setToast({ id, ...cfg });

    // schedule auto-dismiss unless sticky
    if (!cfg?.sticky) {
      clearToastTimerRef.current = setTimeout(() => {
        setToast(null);
        clearToastTimerRef.current = null;
      }, cfg?.timeoutMs ?? 4500);
    }
  };

  const closeToast = () => {
    if (clearToastTimerRef.current) {
      clearTimeout(clearToastTimerRef.current);
      clearToastTimerRef.current = null;
    }
    setToast(null);
  };

  /**
   * Move between boxes
   * cfg: { name, quantity, destLabel, destShortId, onGo, onUndo, sticky, timeoutMs }
   */
  const toastMoveSuccess = ({
    name,
    quantity,
    destLabel,
    destShortId,
    onGo,
    onUndo,
    sticky = true,
    timeoutMs, // optional override if you ever want auto-dismiss
  }) =>
    showToast({
      title: 'Item moved',
      message: `${fmtQtyName(name, quantity)} → ${fmtDest(
        destLabel,
        destShortId
      )}`,
      variant: 'info',
      sticky, // stays up by default so Undo/Go are usable
      timeoutMs,
      actions: [
        onUndo && { label: 'Undo', onClick: onUndo, kind: 'ghost' },
        onGo && { label: 'Go', onClick: onGo, kind: 'primary' },
      ].filter(Boolean),
    });

  /**
   * Orphaned (removed from this box)
   * cfg: { name, quantity, onUndo, sticky, timeoutMs }
   */
  const toastOrphaned = ({
    name,
    quantity,
    onUndo,
    sticky = false, // usually okay to auto-dismiss
    timeoutMs, // default will be 4500ms from showToast
  }) =>
    showToast({
      title: 'Item orphaned',
      message: `${fmtQtyName(name, quantity)} was removed from this box.`,
      variant: 'danger',
      sticky,
      timeoutMs,
      actions: onUndo
        ? [{ label: 'Undo', onClick: onUndo, kind: 'primary' }]
        : [],
    });

  // ✅ Item added / assigned to this box (usually auto-dismisses)
  const toastAdded = ({
    name,
    quantity,
    sticky = false, // add toasts typically fade out
    timeoutMs, // override if you want a shorter/longer lifetime
    onUndo, // optional: provide to quickly orphan it back
  }) =>
    showToast({
      title: 'Item added',
      message: `${fmtQtyName(name, quantity)} is now in this box.`,
      variant: 'success',
      sticky,
      timeoutMs,
      actions: onUndo
        ? [{ label: 'Undo', onClick: onUndo, kind: 'primary' }]
        : [],
    });

  // ✅ Box emptied → items moved to Orphaned
  const plural = (n, one, many) => (n === 1 ? one : many);

  const toastEmptied = ({
    count,
    sticky = true, // tends to be a big action; keep it up with Undo when available
    timeoutMs,
    onUndo, // optional: only if you support “restore last emptied set”
  }) =>
    showToast({
      title: 'Box emptied',
      message: `${count} ${plural(count, 'item', 'items')} moved to Orphaned.`,
      variant: 'warning',
      sticky,
      timeoutMs,
      actions: onUndo
        ? [{ label: 'Undo', onClick: onUndo, kind: 'primary' }]
        : [],
    });

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
      requestAnimationFrame(() => requestAnimationFrame(resolve))
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
    showToast?.({
      title: 'Box updated',
      message: 'Details saved.',
      variant: 'success',
    });
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
        }
      );
      if (!res.ok) throw new Error('Move failed');

      // 6) Refresh canonical data once
      await refreshBox();

      // 7) Clear the zip flag if this item is gone from this list
      clearZipIfMatches(itemId);

      // 8) Toast: show name, quantity (if known), and destination label/short id
      toastMoveSuccess({
        // e.g., “Widget ×2 → Kitchen (#A12)”
        itemName: qtyForToast
          ? `${nameForToast} ×${qtyForToast}`
          : nameForToast,
        destLabel: destShortId ? `${destLabel} (#${destShortId})` : destLabel,

        onGo: () => {
          // If you navigate by short id, wire it here.
          // navigate(`/boxes/${destShortId || destBoxId}`);
          closeToast();
        },

        onUndo: () => {
          closeToast();
          // Use the same metadata so undo can animate back with context
          undoMove({
            itemId,
            itemName: nameForToast,
            itemQuantity: qtyForToast ?? undefined,
            sourceBoxId, // original source
            destBoxId, // original dest
          });
        },
      });
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
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
      setJustReturnedItemId(itemId);

      // 3) Fire backend (re-attach)
      const res = await fetch(
        `http://localhost:5002/api/boxed-items/${boxMongoId}/addItem`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        }
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
        requestAnimationFrame(() => requestAnimationFrame(r))
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
        }
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
    const itemName = snap?.name || getItemName(itemId);

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
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Orphan failed');

      await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);
      clearZipIfMatches(itemId);

      // ✅ Toast uses the snapshot name, never "undefined"
      toastOrphaned({
        itemName, // stable
        onUndo: () => {
          closeToast();
          undoOrphan({ boxMongoId, itemId, itemName });
        },
      });
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
    const name = newItem?.name ?? '(Unnamed Item)';
    const qty = newItem?.quantity;
    if (id) enteringIdsRef.current.add(id); // pre-enter mask

    setItemsUI((prev) => (id ? [...prev, newItem] : prev));
    resetItemUIState?.();

    // Start the entrance animation (zip-in + green flash)
    markEntered(id);
    // ✅ toast
    toastAdded({ name, quantity: qty });

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

      // ✅ Toast: “Item added”
      const name = getItemNameById(itemId);
      showToast?.({
        title: 'Item added',
        message: `${name} is now in this box.`,
        variant: 'success',
      });
    }

    onItemAssigned?.(itemId);
  };
  // Walk the box tree and build a Map from itemId -> { boxId, label, shortId }.
  // Assumptions (rename to your real fields if needed):
  // - A "box node" looks like: { _id, label, box_id, items, childBoxes }
  // - `items` can be either an array of item objects ({ _id, ... }) or itemId strings.
  // - `childBoxes` is an array of nested box nodes (or undefined).

  // Build Map: itemId -> { boxId, label, shortId }
  function buildItemOwnershipIndex(rootBoxNode) {
    const index = new Map(); // Map<string, { boxId: string, label?: string, shortId?: string }>
    const toId = (x) => (x == null ? '' : String(x));

    function dfs(boxNode) {
      if (!boxNode) return;

      const items = Array.isArray(boxNode.items) ? boxNode.items : [];
      for (const it of items) {
        const rawId = typeof it === 'string' ? it : it && it._id;
        const itemId = toId(rawId);
        if (!itemId) continue;

        const prev = index.get(itemId);
        if (prev && prev.boxId !== toId(boxNode._id)) {
          // Optional: keep or remove this warning if you don't want console noise
          console.warn('[ownershipIndex] Item appears in multiple boxes:', {
            itemId,
            prevBoxId: prev.boxId,
            currentBoxId: toId(boxNode._id),
          });
        }

        index.set(itemId, {
          boxId: toId(boxNode._id),
          label: boxNode.label ?? '',
          shortId: toId(boxNode.box_id),
        });
      }

      const children = Array.isArray(boxNode.childBoxes)
        ? boxNode.childBoxes
        : [];
      for (const child of children) dfs(child);
    }

    dfs(rootBoxNode);
    return index;
  }

  // Recompute only when the box tree reference changes (after refreshBox, etc.)
  const ownershipIndex = useMemo(() => {
    if (!boxTree) return new Map();
    return buildItemOwnershipIndex(boxTree);
  }, [boxTree]);

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
      }
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
      }
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

    // 2) Kick batch zip-out animation
    markBatchLeaving(ids);

    try {
      // 2) Kick backend in parallel
      const req = fetch(
        `http://localhost:5002/api/boxed-items/${boxMongoId}/empty`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
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

      // 5) Clear leaving flags
      clearBatchLeaving(ids);

      // 6) Toast with Undo
      toastEmptied({
        count,
        onUndo: () => {
          closeToast();
          undoEmpty();
        },
      });
    } catch (e) {
      console.error('[handleEmptyBox] failed:', e);
      // Roll back leaving flags
      clearBatchLeaving(ids);
      showToast({
        title: 'Empty failed',
        message: e.message || 'Unable to empty this box.',
        variant: 'danger',
      });
    }
  };

  // ---- Bulk attach helper (matches your API style)

  // ---- Undo the last "empty box" (optimistic restore + batch animations) ------
  const undoEmpty = async () => {
    // 0) Read the snapshot we saved during handleEmptyBox()
    //    lastEmptiedRef.current = { boxId, items: [full item objects], at }
    const { boxId, items } = lastEmptiedRef.current || {};

    // Guard: if there’s no snapshot (or it’s for a different box), bail nicely.
    if (!items?.length || boxId !== boxMongoId) {
      showToast({
        title: 'Nothing to undo',
        message: 'No recent “empty box” snapshot found for this box.',
        variant: 'warning',
        timeoutMs: 3000,
      });
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

      // 8) ERROR TOAST — let the user know the undo didn’t stick.
      showToast({
        title: 'Undo failed',
        message: e.message || 'Could not restore items to this box.',
        variant: 'danger',
      });
    }
  };

  const handleNestBox = () => {
    console.log('chirp chirp chirp');
  };

  const handleBoxSaved = async (updated) => {
    // Old vs new short id
    const oldShortId = boxTree?.box_id;
    const newShortId = updated?.box_id;

    // Optimistically update local box meta so the heading updates immediately
    onBoxMetaUpdated?.({
      label: updated?.label,
      box_id: newShortId,
      tags: updated?.tags,
    });

    // Close panel
    setActivePanel(null);

    // Reconcile with backend
    await refreshBox?.();

    // Navigate only if the short id actually changed
    if (newShortId && newShortId !== oldShortId) {
      navigate(`boxes/${newShortId}?open=edit`, {
        state: { flash: 'renumber' }, // BoxDetailView will read this to flash the header
        replace: true, // optional: avoid leaving the old shortId in history
      });
      // No toast here—we're navigating and will land with Edit open + header flash
      return;
    }

    // If we didn't navigate (label/tags change only), show a toast
    showToast?.({
      title: 'Box updated',
      message: 'Details saved.',
      variant: 'success',
    });
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

  // const resetAnimState = () => {
  //   setZippingItemId(null);
  //   setIsMoving(false);
  //   setIsUndoing(false);
  // };

  // use when a specific item left this box successfully
  const clearZipIfMatches = (itemId) => {
    setZippingItemId((curr) => (curr === itemId ? null : curr));
  };

  // 1) Auto-measure the edit panel height when a row opens/closes
  useEffect(() => {
    if (openItemId && itemEditRef.current) {
      setItemEditHeight(`${itemEditRef.current.scrollHeight}px`);
    } else {
      setItemEditHeight('0px');
    }
  }, [openItemId]);

  // 2) Keep local UI list in sync with incoming flatItems
  useEffect(() => {
    setItemsUI(flatItems || []);
    // console.log(flatItems, 'flat items'); // optional: remove noisy logs in prod
  }, [flatItems]);

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
      (it) => (it?._id ?? it) === zippingItemId
    );
    if (!present) setZippingItemId(null);
  }, [itemsUI, zippingItemId]);

  // 5) Unified unmount cleanup for ALL timers/refs related to animations and toasts.
  //    This replaces the multiple duplicated cleanup effects.
  useEffect(() => {
    return () => {
      // clear single-timeout refs (if set)
      [
        timeoutRef,
        clearToastTimerRef,
        undoFlashTimerRef,
        enterFlashTimerRef,
      ].forEach((ref) => {
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
      <BoxActionToast
        open={!!toast}
        title={toast?.title}
        message={toast?.message}
        variant={toast?.variant}
        actions={toast?.actions ?? []}
        onClose={closeToast}
      />
      {/* // ? {Box Actions switch bar } */}
      <BoxControlBar
        active={activePanel}
        onClickEmpty={handleEmptyBox} // one-and-done, no panel
        onClickNest={() => togglePanel('nest')}
        onClickEdit={() => togglePanel('edit')}
        onClickDestroy={() => togglePanel('destroy')}
        busy={isMoving}
      />
      {/* Nest inline section */}
      <NestBoxSection
        open={activePanel === 'nest'}
        boxMongoId={boxMongoId}
        boxTree={boxTree}
        onConfirm={(destBoxId, destLabel, destShortId) => {
          // You can trigger a toast or start a backend call here
          showToast?.({
            title: 'Nest request',
            message: `Nest “${boxTree?.label}” into ${destLabel} (#${destShortId}).`,
            variant: 'info',
            timeoutMs: 3000,
          });
          // Keep panel open or close it—your call. Example: close after confirm
          setActivePanel(null);
        }}
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
        onConfirm={async () => {
          try {
            const res = await fetch(
              `http://localhost:5002/api/boxes/${boxMongoId}`,
              { method: 'DELETE' }
            );
            if (!res.ok) throw new Error('Failed to destroy box');
            showToast({
              title: 'Box destroyed',
              message: 'The box was deleted.',
              variant: 'success',
            });
            // navigate away or refresh parent view here
          } catch (e) {
            showToast({
              title: 'Delete failed',
              message: e.message || 'Unable to destroy this box.',
              variant: 'danger',
            });
          }
        }}
      />

      {/* {Items map} */}
      {itemsUI.length === 0 ? (
        <EmptyMessage>This box is empty. Add some items below.</EmptyMessage>
      ) : (
        <ItemList>
          {itemsUI.map((item) => {
            const id = item._id;
            const isOpen = openItemId === id;
            const isVisible = visibleItemId === id;
            const owner = ownershipIndex.get(id) || {};
            const leavingByBatch = zippingIds.has(id);
            const leavingBySingle = zippingItemId === id;
            const enteringByBatch = justReturnedIds.has(id);
            const enteringBySingle = justReturnedItemId === id;
            const isLeaving = leavingByBatch || leavingBySingle;
            const isUndo = isUndoing && (enteringByBatch || enteringBySingle);
            const isEntering = enteringByBatch || enteringBySingle; // includes undo
            const isPreEnter = enteringIdsRef.current.has(id); // 👈 first paint mask
            const zipProp = isLeaving ? 'out' : isEntering ? 'in' : undefined;
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
                  <ItemEditWrapper $isOpen={isOpen} $maxHeight={itemEditHeight}>
                    <div ref={itemEditRef}>
                      <ItemEditForm
                        key={item.item_id}
                        initialItem={item}
                        boxId={shortId}
                        boxMongoId={boxMongoId}
                        sourceBoxId={owner.boxId}
                        sourceBoxLabel={owner.label} // optional
                        sourceBoxShortId={owner.shortId} // optional
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
      <MiniOrphanedList
        boxMongoId={boxMongoId}
        onItemAssigned={handleItemAssigned}
        onItemUpdated={onItemUpdated}
        orphanedItems={orphanedItems}
        fetchOrphanedItems={fetchOrphanedItems}
      />
      <AddItemToThisBoxForm
        boxMongoId={boxMongoId}
        onAdded={handleItemAdded}
        boxShortId={shortId}
      />
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
  transition: max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
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
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease, box-shadow 0.2s ease;
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
        animation: ${zipIn} 280ms ease-out both,
          ${flashBorder} 600ms ease-out ${$flashDelay}ms 2;
      `;
    }
    if ($zip === 'out') {
      return css`
        ${base};
        animation: ${zipAway} 1000ms ease-in forwards,
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
  transition: max-height 220ms ease, margin-bottom 220ms ease,
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

// TODO
// 1. Alternating colors for ItemRows to differentiate items
// 2. Consolidate Wire up the toast message
// 3. Nested Boxes

// TEMP stub: remove once the real dialog is wired
function NestBoxDialog({ boxMongoId, currentBoxLabel, onClose, onConfirm }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: '#191919',
          border: '1px solid #2f2f2f',
          borderRadius: 10,
          padding: 16,
          width: 320,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Nest this box</h3>
        <p style={{ opacity: 0.85 }}>
          Box: <strong>{currentBoxLabel || boxMongoId}</strong>
        </p>
        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          (Placeholder dialog — wire real picker here)
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            onClick={() =>
              onConfirm?.('DEST_BOX_ID', 'Destination Label', 'A12')
            }
            style={{ flex: 1 }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
