import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ToastContext } from '../Toast';

const VALID_PANELS = new Set(['empty', 'nest', 'edit', 'export', 'destroy']);
const normalizePanelState = (value) => (VALID_PANELS.has(value) ? value : null);

function parseJsonSafe(response) {
  return response.json().catch(() => ({}));
}

export default function useBoxActionPanelController({
  boxTree,
  boxMongoId,
  onBoxSaved,
  refreshBox,
  initialActivePanel = null,
}) {
  const [activePanel, setActivePanel] = useState(() =>
    normalizePanelState(initialActivePanel),
  );
  const [isMoving, setIsMoving] = useState(false);

  const isEmptyMode = activePanel === 'empty';

  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;

  const lastEmptiedRef = useRef({ boxId: null, items: [], at: 0 });
  const { shortId: routeShortId } = useParams();

  const directItems = useMemo(
    () => (Array.isArray(boxTree?.items) ? boxTree.items : []),
    [boxTree],
  );

  const togglePanel = useCallback(
    (boxCtrlBtn) =>
      setActivePanel((prev) => {
        const next = prev === boxCtrlBtn ? null : boxCtrlBtn;
        if (prev === 'empty' && next !== 'empty') {
          hideToast?.();
        }
        return next;
      }),
    [hideToast],
  );

  const clearActivePanel = useCallback(
    () =>
      setActivePanel((prev) => {
        if (prev === 'empty') {
          hideToast?.();
        }
        return null;
      }),
    [hideToast],
  );

  const idsOf = useCallback(
    (items) =>
      (Array.isArray(items) ? items : [])
        .map((it) => it?._id ?? it?.id)
        .filter(Boolean),
    [],
  );

  const snapshotDirectItems = useCallback(
    () => directItems.map((it) => ({ ...it })),
    [directItems],
  );

  const attachMany = useCallback(
    async (itemIds) => {
      const res = await fetch(
        `/api/boxed-items/${boxMongoId}/addItems`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemIds }),
        },
      );
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data?.message || 'Attach many failed');
      return data;
    },
    [boxMongoId],
  );

  const handleFormSaved = useCallback(
    async (updated) => {
      const navigated = onBoxSaved?.(updated) === true;
      if (navigated) return;

      setActivePanel(null);
      try {
        await refreshBox?.();
      } catch (error) {
        console.error('[BoxActionPanel] refresh after save failed:', error);
      }

      const resolvedShortId = String(
        updated?.box_id || updated?.shortId || routeShortId || '',
      ).trim();
      const resolvedLabel = String(updated?.label || '').trim();
      const detail = resolvedShortId
        ? `Box #${resolvedShortId} updated.`
        : resolvedLabel
          ? `Box "${resolvedLabel}" updated.`
          : 'Changes saved.';

      showToast?.({
        variant: 'success',
        title: 'Box updated',
        message: detail,
      });
    },
    [onBoxSaved, refreshBox, routeShortId, showToast],
  );

  const undoEmpty = useCallback(async () => {
    const { boxId, items } = lastEmptiedRef.current || {};
    if (!items?.length || boxId !== boxMongoId) return;

    const ids = idsOf(items);
    if (!ids.length) return;

    setIsMoving(true);
    try {
      await attachMany(ids);
      await refreshBox?.();
      showToast?.({
        variant: 'success',
        title: 'Empty undone',
        message: `Restored ${ids.length} item${ids.length === 1 ? '' : 's'} to box #${routeShortId}.`,
        timeoutMs: 3600,
      });
    } catch (error) {
      console.error('[undoEmpty] failed:', error);
      showToast?.({
        variant: 'danger',
        title: 'Undo failed',
        message: error?.message || 'Could not restore items to this box.',
        timeoutMs: 4200,
      });
    } finally {
      setIsMoving(false);
    }
  }, [attachMany, boxMongoId, idsOf, refreshBox, routeShortId, showToast]);

  const handleEmptyBox = useCallback(async () => {
    if (isMoving) return;

    const snapshot = snapshotDirectItems();
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

    lastEmptiedRef.current = {
      boxId: boxMongoId,
      items: snapshot,
      at: Date.now(),
    };

    setIsMoving(true);
    try {
      const res = await fetch(`/api/boxed-items/${boxMongoId}/empty`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const body = await parseJsonSafe(res);
      if (!res.ok) throw new Error(body?.message || 'Failed to empty this box.');

      const count = body?.orphanedCount ?? ids.length;
      await refreshBox?.();

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
    } catch (error) {
      console.error('[handleEmptyBox] failed:', error);
      showToast?.({
        variant: 'danger',
        title: 'Empty failed',
        message: error?.message || 'Failed to empty this box.',
        timeoutMs: 4200,
      });
    } finally {
      setIsMoving(false);
    }
  }, [
    boxMongoId,
    hideToast,
    idsOf,
    isMoving,
    refreshBox,
    showToast,
    snapshotDirectItems,
    undoEmpty,
  ]);

  const requestEmptyConfirm = useCallback(() => {
    const snapshot = snapshotDirectItems();
    const ids = idsOf(snapshot);

    if (!ids.length) {
      showToast?.({
        variant: 'info',
        title: 'Nothing to empty',
        message: 'This box is already empty.',
        timeoutMs: 2200,
      });
      setActivePanel((prev) => (prev === 'empty' ? null : prev));
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
  }, [handleEmptyBox, hideToast, idsOf, showToast, snapshotDirectItems]);

  const handleEmptyTab = useCallback(() => {
    setActivePanel((prev) => {
      if (prev === 'empty') {
        hideToast?.();
        return null;
      }
      requestEmptyConfirm();
      return 'empty';
    });
  }, [hideToast, requestEmptyConfirm]);

  useEffect(() => {
    const nextPanel = normalizePanelState(initialActivePanel);
    setActivePanel((prev) => {
      if (prev === nextPanel) return prev;
      if (prev === 'empty' && nextPanel !== 'empty') {
        hideToast?.();
      }
      return nextPanel;
    });
  }, [hideToast, initialActivePanel]);

  return {
    activePanel,
    isEmptyMode,
    isMoving,
    routeShortId,
    setActivePanel,
    clearActivePanel,
    togglePanel,
    handleEmptyTab,
    handleFormSaved,
  };
}
