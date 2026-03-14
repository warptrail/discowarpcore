import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import BoxControlBar from './BoxControlBar';
import NestBoxSection from './NestBoxSection';
import EditBoxDetailsForm from './EditBoxDetailsForm';
import DestroyBoxSection from './DestroyBoxSection';
import MiniOrphanedList from './MiniOrphanedList';
import AddItemToThisBoxForm from './AddItemToThisBoxForm';

import useBoxActionPanelController from './BoxActionPanel/useBoxActionPanelController';
import BoxActionItemList from './BoxActionPanel/BoxActionItemList';
import { DetailsPanel, PanelContainer } from './BoxActionPanel/BoxActionPanel.styles';
import { ToastContext } from './Toast';
import { destroyBoxById, releaseChildrenToFloor, updateBoxById } from '../api/boxes';
import { API_BASE } from '../api/API_BASE';

const DESTROY_CONFIRM_PHRASE = 'DESTROY';

export default function BoxActionPanel({
  boxTree,
  boxMongoId,
  onItemUpdated,
  refreshBox,
  orphanedItems,
  fetchOrphanedItems,
  onItemAssigned,
  onBoxSaved,
  busy,
  onRequestDelete,
  activePanelState = null,
  onActivePanelStateChange,
}) {
  const [localOrphanedItems, setLocalOrphanedItems] = useState([]);

  const fetchPanelOrphanedItems = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/items/orphaned?sort=recent&limit=10000`);
    const body = await res.json().catch(() => []);
    if (!res.ok) {
      throw new Error(body?.error || body?.message || 'Failed to fetch orphaned items');
    }
    setLocalOrphanedItems(Array.isArray(body) ? body : []);
    return body;
  }, []);

  const resolvedFetchOrphanedItems =
    typeof fetchOrphanedItems === 'function'
      ? fetchOrphanedItems
      : fetchPanelOrphanedItems;

  const resolvedOrphanedItems = Array.isArray(orphanedItems)
    ? orphanedItems
    : localOrphanedItems;

  const controller = useBoxActionPanelController({
    boxTree,
    boxMongoId,
    onBoxSaved,
    refreshBox,
    fetchOrphanedItems: resolvedFetchOrphanedItems,
    onItemAssigned,
    initialActivePanel: activePanelState,
  });

  const {
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
  } = controller;

  const [mode, setMode] = useState('default');
  const [destroyConfirmInput, setDestroyConfirmInput] = useState('');
  const destroyToastActiveRef = useRef(false);
  const undoNestBusyRef = useRef(false);
  const navigate = useNavigate();

  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;

  const isDestroyConfirmMode = mode === 'destroyConfirm';
  const isDestroyConfirmValid = destroyConfirmInput === DESTROY_CONFIRM_PHRASE;
  const isDestroyBusy = !!busy || isMoving;

  const resetDestroyConfirmState = useCallback(() => {
    setDestroyConfirmInput('');
    setMode('default');
  }, []);

  const handleEnterDestroyConfirm = useCallback(() => {
    clearActivePanel();
    setDestroyConfirmInput('');
    setMode('destroyConfirm');
  }, [clearActivePanel]);

  const handleCancelDestroyConfirm = useCallback(() => {
    clearActivePanel();
    resetDestroyConfirmState();
  }, [clearActivePanel, resetDestroyConfirmState]);

  const runDestroySequence = useCallback(
    async ({ boxId, shortId }) => {
      try {
        if (typeof onRequestDelete === 'function') {
          await onRequestDelete();
        } else {
          await releaseChildrenToFloor(boxId);
          await destroyBoxById(boxId);
        }

        showToast?.({
          variant: 'success',
          title: `Box #${shortId} destroyed`,
          message:
            'Direct items were orphaned and direct child boxes were released to floor level.',
          timeoutMs: 2800,
        });

        navigate('/', {
          replace: true,
          state: { destroyFlow: 'done', at: Date.now() },
        });
      } catch (error) {
        console.error('[BoxActionPanel] destroy failed:', error);
        showToast?.({
          variant: 'danger',
          title: 'Destroy failed',
          message: error?.message || 'Failed to destroy this box.',
          sticky: true,
        });
      }
    },
    [navigate, onRequestDelete, showToast],
  );

  const handleConfirmDestroy = useCallback(() => {
    if (isDestroyBusy || !isDestroyConfirmValid || !boxMongoId) {
      return;
    }

    clearActivePanel();
    resetDestroyConfirmState();
    destroyToastActiveRef.current = false;
    hideToast?.();

    // Per UX requirement: navigate home first, then perform backend mutation.
    navigate('/', {
      state: { destroyFlow: 'start', at: Date.now() },
    });

    setTimeout(() => {
      runDestroySequence({ boxId: boxMongoId, shortId: routeShortId });
    }, 0);
  }, [
    isDestroyBusy,
    isDestroyConfirmValid,
    boxMongoId,
    clearActivePanel,
    resetDestroyConfirmState,
    hideToast,
    navigate,
    runDestroySequence,
    routeShortId,
  ]);

  const handleEmptyTabClick = () => {
    if (isDestroyConfirmMode) resetDestroyConfirmState();
    handleEmptyTab();
  };

  const handleNestClick = () => {
    if (isDestroyConfirmMode) resetDestroyConfirmState();
    togglePanel('nest');
  };

  const handleEditClick = () => {
    if (isDestroyConfirmMode) resetDestroyConfirmState();
    togglePanel('edit');
  };

  const refreshAfterNestMutation = useCallback(async () => {
    try {
      await refreshBox?.();
    } catch (err) {
      console.error('[BoxActionPanel] refresh after nest mutation failed:', err);
      showToast?.({
        variant: 'danger',
        title: 'Refresh failed',
        message: 'Box hierarchy changed, but the panel failed to refresh.',
        timeoutMs: 4200,
      });
    }
  }, [refreshBox, showToast]);

  const handleDidNest = useCallback(async (nestEvent = {}) => {
    await refreshAfterNestMutation();
    const previousParentId = nestEvent?.previousParentId || null;
    const toLabel =
      nestEvent?.nextParentLabel ||
      (nestEvent?.nextParentShortId ? `Box #${nestEvent.nextParentShortId}` : 'selected parent');

    showToast?.({
      variant: 'success',
      title: 'Box nested',
      message: `Moved box #${routeShortId} under ${toLabel}.`,
      sticky: true,
      actions: [
        {
          id: `undo-nest-${boxMongoId}-${Date.now()}`,
          label: 'Undo',
          kind: 'primary',
          onClick: async () => {
            if (undoNestBusyRef.current) return;
            undoNestBusyRef.current = true;
            try {
              await updateBoxById(boxMongoId, {
                parentBox: previousParentId || null,
              });
              await refreshAfterNestMutation();
              hideToast?.();
              showToast?.({
                variant: 'success',
                title: 'Nest undone',
                message:
                  previousParentId
                    ? `Box #${routeShortId} returned to its previous parent.`
                    : `Box #${routeShortId} returned to floor level.`,
                timeoutMs: 3600,
              });
            } catch (err) {
              console.error('[BoxActionPanel] undo nest failed:', err);
              showToast?.({
                variant: 'danger',
                title: 'Undo failed',
                message: err?.message || 'Could not reverse this box move.',
                timeoutMs: 5200,
              });
            } finally {
              undoNestBusyRef.current = false;
            }
          },
        },
      ],
    });
  }, [
    refreshAfterNestMutation,
    showToast,
    routeShortId,
    boxMongoId,
    hideToast,
  ]);

  const handleDidUnnest = useCallback(async () => {
    await refreshAfterNestMutation();
    showToast?.({
      variant: 'success',
      title: 'Box moved to floor',
      message: `Box #${routeShortId} is now at floor level.`,
      timeoutMs: 3200,
    });
  }, [refreshAfterNestMutation, showToast, routeShortId]);

  const handleDidReleaseChildren = useCallback(
    async (modifiedCount = 0) => {
      await refreshAfterNestMutation();
      showToast?.({
        variant: 'success',
        title: 'Children released',
        message: `Released ${modifiedCount} direct child box${
          modifiedCount === 1 ? '' : 'es'
        } to floor level.`,
        timeoutMs: 3600,
      });
    },
    [refreshAfterNestMutation, showToast],
  );

  useEffect(() => {
    if (Array.isArray(orphanedItems) && typeof fetchOrphanedItems !== 'function') {
      return;
    }
    resolvedFetchOrphanedItems?.().catch((err) => {
      console.error('[BoxActionPanel] orphaned fetch failed:', err);
    });
  }, [orphanedItems, fetchOrphanedItems, resolvedFetchOrphanedItems]);

  useEffect(() => {
    if (!isDestroyConfirmMode) return;

    destroyToastActiveRef.current = true;
    showToast?.({
      variant: 'danger',
      title: `Destroy Box #${routeShortId}`,
      message: 'Permanent action. Confirm carefully.',
      sticky: true,
      content: (
        <DestroyBoxSection
          busy={isDestroyBusy}
          shortId={routeShortId}
          confirmText={destroyConfirmInput}
          onConfirmTextChange={setDestroyConfirmInput}
          isConfirmValid={isDestroyConfirmValid}
          onCancel={handleCancelDestroyConfirm}
          onConfirm={handleConfirmDestroy}
        />
      ),
      onClose: handleCancelDestroyConfirm,
    });
  }, [
    isDestroyConfirmMode,
    showToast,
    routeShortId,
    isDestroyBusy,
    destroyConfirmInput,
    isDestroyConfirmValid,
    handleCancelDestroyConfirm,
    handleConfirmDestroy,
  ]);

  useEffect(() => {
    if (isDestroyConfirmMode || !destroyToastActiveRef.current) return;
    destroyToastActiveRef.current = false;
    hideToast?.();
  }, [isDestroyConfirmMode, hideToast]);

  useEffect(
    () => () => {
      if (!destroyToastActiveRef.current) return;
      destroyToastActiveRef.current = false;
      hideToast?.();
    },
    [hideToast],
  );

  useEffect(() => {
    if (typeof onActivePanelStateChange !== 'function') return;
    onActivePanelStateChange(activePanel);
  }, [activePanel, onActivePanelStateChange]);

  return (
    <PanelContainer>
      <BoxControlBar
        active={isDestroyConfirmMode ? 'destroy' : activePanel}
        onClickEmpty={handleEmptyTabClick}
        onClickNest={handleNestClick}
        onClickEdit={handleEditClick}
        onClickDestroy={handleEnterDestroyConfirm}
        busy={isDestroyBusy}
      />

      <NestBoxSection
        open={!isDestroyConfirmMode && activePanel === 'nest'}
        onClose={() => setActivePanel(null)}
        onConfirm={() => {}}
        sourceBoxMongoId={boxMongoId}
        sourceBoxShortId={routeShortId}
        sourceBoxLabel={boxTree?.label}
        boxTree={boxTree}
        busy={busy || isMoving}
        onDidNest={handleDidNest}
        onDidUnnest={handleDidUnnest}
        onDidReleaseChildren={handleDidReleaseChildren}
      />

      <DetailsPanel $open={!isDestroyConfirmMode && activePanel === 'edit'} $maxHeight={420}>
        {!isDestroyConfirmMode && activePanel === 'edit' && (
          <EditBoxDetailsForm
            boxMongoId={boxMongoId}
            initial={boxTree}
            onSaved={handleFormSaved}
            onCancel={() => setActivePanel(null)}
          />
        )}
      </DetailsPanel>

      {!isDestroyConfirmMode && (
        <BoxActionItemList
          itemsUI={itemsUI}
          isBusy={isMoving}
          zippingIds={zippingIds}
          zippingItemId={zippingItemId}
          justReturnedIds={justReturnedIds}
          justReturnedItemId={justReturnedItemId}
          isUndoing={isUndoing}
          enteringIdsRef={enteringIdsRef}
          routeShortId={routeShortId}
          boxMongoId={boxMongoId}
          boxTree={boxTree}
          onItemUpdated={onItemUpdated}
          handleMoveRequest={handleMoveRequest}
          handleOrphanRequest={handleOrphanRequest}
          refreshBox={refreshBox}
        />
      )}

      {!isDestroyConfirmMode && (
        <MiniOrphanedList
          boxMongoId={boxMongoId}
          onItemAssigned={handleItemAssigned}
          orphanedItems={resolvedOrphanedItems}
          fetchOrphanedItems={resolvedFetchOrphanedItems}
        />
      )}

      {!isDestroyConfirmMode && !isEmptyMode && (
        <AddItemToThisBoxForm
          boxMongoId={boxMongoId}
          onAdded={handleItemAdded}
          boxShortId={routeShortId}
        />
      )}
    </PanelContainer>
  );
}
