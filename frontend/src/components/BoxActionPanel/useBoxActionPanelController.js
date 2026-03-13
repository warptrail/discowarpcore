import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ToastContext } from '../Toast';

export default function useBoxActionPanelController({
  boxTree,
  boxMongoId,
  onBoxSaved,
  refreshBox,
  fetchOrphanedItems,
  onItemAssigned,
}) {
  const [isMoving, setIsMoving] = useState(false);
  const [zippingItemId, setZippingItemId] = useState(null);
  const [zippingIds, setZippingIds] = useState(() => new Set());
  const [justReturnedIds, setJustReturnedIds] = useState(() => new Set());
  const [isUndoing, setIsUndoing] = useState(false);
  const [justReturnedItemId, setJustReturnedItemId] = useState(null);
  const [itemsUI, setItemsUI] = useState(() =>
    Array.isArray(boxTree?.items) ? boxTree.items : [],
  );
  const [activePanel, setActivePanel] = useState(null);

  const isEmptyMode = activePanel === 'empty';

  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;

  const enterFlashTimerRef = useRef(null);
  const enteringIdsRef = useRef(new Set());
  const itemSnapshotRef = useRef(new Map());
  const lastEmptiedRef = useRef({ boxId: null, items: [], at: 0 });
  const isEmptyingRef = useRef(false);

  const { shortId: routeShortId } = useParams();
  const ANIM_LEAVE_MS = 1000;

  const directItems = useMemo(
    () => (Array.isArray(boxTree?.items) ? boxTree.items : []),
    [boxTree],
  );

  const togglePanel = (boxCtrlBtn) =>
    setActivePanel((prev) => {
      const next = prev === boxCtrlBtn ? null : boxCtrlBtn;
      if (prev === 'empty' && next !== 'empty') {
        hideToast?.();
      }
      return next;
    });

  const clearActivePanel = () =>
    setActivePanel((prev) => {
      if (prev === 'empty') {
        hideToast?.();
      }
      return null;
    });

  const handleEmptyTab = () => {
    setActivePanel((prev) => {
      if (prev === 'empty') {
        hideToast?.();
        return null;
      }
      requestEmptyConfirm();
      return 'empty';
    });
  };

  const getItemFromUIById = (id) =>
    (itemsUI || []).find((it) => (it?._id ?? it?.id) === id);

  const snapshotItem = (id) => {
    const it = getItemFromUIById(id);
    if (!it) return null;
    const snap = { ...it };
    itemSnapshotRef.current.set(id, snap);
    return snap;
  };

  const addAll = (setObj, ids) => new Set([...setObj, ...ids]);
  const removeAll = (setObj, ids) => {
    const next = new Set(setObj);
    ids.forEach((id) => next.delete(id));
    return next;
  };

  const preEnterBatch = (ids) =>
    ids.forEach((id) => enteringIdsRef.current.add(id));

  const startBatchEntered = async (ids, { undo = false } = {}) => {
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    setJustReturnedIds((curr) => addAll(curr, ids));
    if (undo) setIsUndoing(true);
    setTimeout(() => {
      setJustReturnedIds((curr) => removeAll(curr, ids));
      if (undo) setIsUndoing(false);
      ids.forEach((id) => enteringIdsRef.current.delete(id));
    }, 1600);
  };

  const markBatchLeaving = (ids) => setZippingIds((curr) => addAll(curr, ids));
  const clearBatchLeaving = (ids) =>
    setZippingIds((curr) => removeAll(curr, ids));

  const nextTwoFrames = () =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const handleFormSaved = async (updated) => {
    const navigated = onBoxSaved?.(updated) === true;
    if (navigated) return;

    setActivePanel(null);
    await refreshBox?.();
  };

  const clearZipIfMatches = (itemId) => {
    setZippingItemId((curr) => (curr === itemId ? null : curr));
  };

  const handleMoveRequest = async ({
    itemId,
    sourceBoxId,
    destBoxId,
  }) => {
    if (isMoving) return;
    setIsMoving(true);

    snapshotItem(itemId);

    try {
      await nextTwoFrames();
      setZippingItemId(itemId);
      await new Promise((r) => setTimeout(r, 1000));

      const res = await fetch('http://localhost:5002/api/boxed-items/moveItem', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, sourceBoxId, destBoxId }),
      });
      if (!res.ok) throw new Error('Move failed');

      await refreshBox?.();
      clearZipIfMatches(itemId);
    } catch (e) {
      console.error('[handleMoveRequest] failed:', e);
      setZippingItemId(null);
    } finally {
      setIsMoving(false);
    }
  };

  const handleOrphanRequest = async ({ itemId, boxMongoId: sourceBoxId }) => {
    if (isMoving) return;
    setIsMoving(true);

    snapshotItem(itemId);

    try {
      await nextTwoFrames();
      setZippingItemId(itemId);
      await sleep(1000);

      const res = await fetch(
        `http://localhost:5002/api/boxed-items/${sourceBoxId}/removeItem`,
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
    } catch (e) {
      console.error('[handleOrphanRequest] failed:', e);
      setZippingItemId(null);
    } finally {
      setIsMoving(false);
    }
  };

  const markEntered = async (itemId) => {
    if (!itemId) return;
    if (enterFlashTimerRef.current) {
      clearTimeout(enterFlashTimerRef.current);
      enterFlashTimerRef.current = null;
    }

    await nextTwoFrames();
    enteringIdsRef.current.delete(itemId);
    setJustReturnedItemId(itemId);

    enterFlashTimerRef.current = setTimeout(() => {
      setJustReturnedItemId((curr) => (curr === itemId ? null : curr));
      enterFlashTimerRef.current = null;
    }, 1000);
  };

  const resetItemUIState = () => {
    setIsMoving(false);
    setZippingItemId(null);
    setIsUndoing(false);
    setJustReturnedItemId(null);
  };

  const handleItemAdded = (newItem) => {
    const id = newItem?._id ?? newItem?.id;
    if (id) enteringIdsRef.current.add(id);

    setItemsUI((prev) => (id ? [...prev, newItem] : prev));
    resetItemUIState?.();
    markEntered(id);

    fetchOrphanedItems?.();
    refreshBox?.();
  };

  const handleItemAssigned = async (itemId) => {
    if (itemId) enteringIdsRef.current.add(itemId);

    await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);

    if (itemId) {
      markEntered(itemId);
    }

    onItemAssigned?.(itemId);
  };

  const snapshotBoxItems = () => (itemsUI || []).map((it) => ({ ...it }));
  const idsOf = (items) => items.map((it) => it?._id ?? it?.id).filter(Boolean);

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

  const handleEmptyBox = async () => {
    const snapshot = snapshotBoxItems();
    const ids = idsOf(snapshot);
    if (!ids.length) return;

    lastEmptiedRef.current = {
      boxId: boxMongoId,
      items: snapshot,
      at: Date.now(),
    };
    isEmptyingRef.current = true;

    markBatchLeaving(ids);

    try {
      const req = fetch(`http://localhost:5002/api/boxed-items/${boxMongoId}/empty`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      }).then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || 'Failed to empty');
        return body;
      });

      const [, body] = await Promise.all([
        new Promise((r) => setTimeout(r, ANIM_LEAVE_MS)),
        req,
      ]);

      const count = body?.orphanedCount ?? ids.length;

      await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);
      setItemsUI([]);

      clearBatchLeaving(ids);
      isEmptyingRef.current = false;

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

  const requestEmptyConfirm = () => {
    console.log('[BoxActionPanel] Empty clicked → requestEmptyConfirm');
    console.log('[BoxActionPanel] toastCtx:', toastCtx);
    console.log('[BoxActionPanel] typeof showToast:', typeof showToast);

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

  const undoEmpty = async () => {
    const { boxId, items } = lastEmptiedRef.current || {};

    if (!items?.length || boxId !== boxMongoId) {
      isEmptyingRef.current = false;
      return;
    }

    const ids = idsOf(items);

    try {
      preEnterBatch(ids);

      setItemsUI((prev) => {
        const existing = new Set((prev || []).map((x) => x?._id ?? x?.id));
        const add = items.filter((it) => !existing.has(it._id));
        return [...prev, ...add];
      });

      await startBatchEntered(ids, { undo: true });
      await attachMany(ids);

      await Promise.all([refreshBox?.(), fetchOrphanedItems?.()]);
      isEmptyingRef.current = false;
    } catch (e) {
      console.error('[undoEmpty] failed:', e);

      setItemsUI((prev) => prev.filter((x) => !ids.includes(x?._id ?? x?.id)));
      setJustReturnedIds((curr) => removeAll(curr, ids));
      ids.forEach((id) => enteringIdsRef.current.delete(id));
      setIsUndoing(false);
      isEmptyingRef.current = false;
    }
  };

  useEffect(() => {
    const next = directItems || [];
    if (isEmptyingRef.current && next.length > 0) return;
    setItemsUI(next);
  }, [directItems]);

  useEffect(() => {
    fetchOrphanedItems?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!zippingItemId) return;
    const present = (itemsUI || []).some(
      (it) => (it?._id ?? it) === zippingItemId,
    );
    if (!present) setZippingItemId(null);
  }, [itemsUI, zippingItemId]);

  useEffect(() => {
    const enteringIds = enteringIdsRef.current;
    return () => {
      if (enterFlashTimerRef.current) {
        clearTimeout(enterFlashTimerRef.current);
        enterFlashTimerRef.current = null;
      }

      if (enteringIds?.clear) {
        enteringIds.clear();
      }
    };
  }, []);

  return {
    activePanel,
    isEmptyMode,
    isMoving,
    routeShortId,
    itemsUI,
    zippingIds,
    zippingItemId,
    justReturnedIds,
    justReturnedItemId,
    isUndoing,
    enteringIdsRef,
    setActivePanel,
    clearActivePanel,
    togglePanel,
    handleEmptyTab,
    handleFormSaved,
    handleMoveRequest,
    handleOrphanRequest,
    handleItemAdded,
    handleItemAssigned,
  };
}
