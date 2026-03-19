import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../api/API_BASE';
import { ToastContext } from './Toast';
import {
  deleteItemPermanently,
  markItemGone,
  restoreItemToActive,
} from '../api/itemLifecycle';
import ItemDetails from './ItemDetails';
import ItemPageBreadcrumb from './ItemPageBreadcrumb';
import EditItemDetailsForm from './EditItemDetailsForm';
import ItemContainerSection from './ItemContainerSection';
import {
  ItemHardDeleteConsolePanel,
  ItemMarkGoneConsolePanel,
  ItemReclaimConsolePanel,
} from './ItemLifecycleConsolePanels';
import { getItemOwnershipContext } from '../util/itemOwnership';
import * as S from '../styles/ItemPage.styles';

const getBoxName = (box, fallback = 'Box') => {
  if (!box) return fallback;
  return box.label || (box.box_id ? `Box #${box.box_id}` : fallback);
};

const getItemName = (item) => item?.name || 'Item';

export default function ItemPage() {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const urlWantsEdit = searchParams.get('mode') === 'edit';
  const navigate = useNavigate();

  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(urlWantsEdit);
  const [containerPending, setContainerPending] = useState(false);
  const [containerError, setContainerError] = useState('');
  const [lifecycleDialog, setLifecycleDialog] = useState(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  const undoInFlightRef = useRef(new Set());

  useEffect(() => {
    setIsEditing(urlWantsEdit);
  }, [itemId, urlWantsEdit]);

  const parseErrorMessage = useCallback(async (res, fallback) => {
    const raw = await res.text().catch(() => '');
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw);
      return parsed?.message || parsed?.error || fallback;
    } catch {
      return raw;
    }
  }, []);

  const loadItem = useCallback(async ({ signal, preserveLoading = false } = {}) => {
    if (!itemId) {
      setLoading(false);
      setNotFound(false);
      setItem(null);
      setError('Missing item id.');
      return null;
    }

    try {
      if (!preserveLoading) setLoading(true);
      setError(null);
      setNotFound(false);

      const url = `${API_BASE}/api/items/${encodeURIComponent(itemId)}`;
      const res = await fetch(url, {
        signal,
        headers: { Accept: 'application/json' },
      });

      if (res.status === 404) {
        setItem(null);
        setNotFound(true);
        return null;
      }

      if (!res.ok) {
        const message = await parseErrorMessage(res, `Request failed (${res.status})`);
        throw new Error(message);
      }

      const json = await res.json().catch(() => ({}));
      const nextItem = json?.data ?? null;
      if (!nextItem) {
        setItem(null);
        setNotFound(true);
        return null;
      }

      setItem(nextItem);
      return nextItem;
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('fetch item failed:', err);
        setItem(null);
        setError(err?.message || 'Failed to load item.');
      }
      return null;
    } finally {
      if (!preserveLoading) setLoading(false);
    }
  }, [itemId, parseErrorMessage]);

  useEffect(() => {
    const abort = new AbortController();
    loadItem({ signal: abort.signal });
    return () => {
      abort.abort();
    };
  }, [loadItem]);

  const requestMoveMutation = useCallback(
    async ({ movingItemId, sourceBoxId, destBoxId }) => {
      const res = await fetch(`${API_BASE}/api/boxed-items/moveItem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: movingItemId,
          sourceBoxId,
          destBoxId,
        }),
      });

      if (!res.ok) {
        const message = await parseErrorMessage(res, 'Could not move item.');
        throw new Error(message);
      }
    },
    [parseErrorMessage]
  );

  const requestRemoveFromBoxMutation = useCallback(
    async ({ movingItemId, boxMongoId }) => {
      const url = `${API_BASE}/api/boxed-items/${encodeURIComponent(boxMongoId)}/removeItem`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: movingItemId }),
      });

      if (!res.ok) {
        const message = await parseErrorMessage(
          res,
          'Could not remove item from box.'
        );
        throw new Error(message);
      }
    },
    [parseErrorMessage]
  );

  const handleUndoAction = useCallback(
    async (undoPayload) => {
      const undoKey = `${undoPayload?.type || 'undo'}:${undoPayload?.itemId || 'unknown'}:${undoPayload?.at || 0}`;
      if (undoInFlightRef.current.has(undoKey)) return;
      undoInFlightRef.current.add(undoKey);

      hideToast?.();

      try {
        setContainerPending(true);
        setContainerError('');

        if (undoPayload.type === 'move') {
          await requestMoveMutation({
            movingItemId: undoPayload.itemId,
            sourceBoxId: undoPayload.toBoxId,
            destBoxId: undoPayload.fromBoxId,
          });
        } else if (undoPayload.type === 'remove') {
          await requestMoveMutation({
            movingItemId: undoPayload.itemId,
            sourceBoxId: undoPayload.fromBoxId,
            destBoxId: undoPayload.originalBoxId,
          });
        } else if (undoPayload.type === 'place') {
          await requestRemoveFromBoxMutation({
            movingItemId: undoPayload.itemId,
            boxMongoId: undoPayload.placedBoxId,
          });
        }

        await loadItem({ preserveLoading: true });

        showToast?.({
          variant: 'success',
          title: 'Undo complete',
          message: undoPayload.undoSuccessMessage || 'Containment restored.',
          timeoutMs: 3800,
        });
      } catch (err) {
        console.error('[ItemPage] undo failed:', err);
        setContainerError(err?.message || 'Undo failed.');
        showToast?.({
          variant: 'danger',
          title: 'Undo failed',
          message: err?.message || 'Could not restore the previous container state.',
          timeoutMs: 5200,
        });
      } finally {
        setContainerPending(false);
        undoInFlightRef.current.delete(undoKey);
      }
    },
    [hideToast, loadItem, requestMoveMutation, requestRemoveFromBoxMutation, showToast]
  );

  const showUndoToast = useCallback(
    ({ title, message, undoPayload }) => {
      showToast?.({
        variant: 'success',
        title,
        message,
        sticky: true,
        actions: [
          {
            id: `undo-item-container-${undoPayload.type}-${undoPayload.itemId}-${undoPayload.at}`,
            label: 'Undo',
            kind: 'primary',
            onClick: async () => {
              await handleUndoAction(undoPayload);
            },
          },
        ],
      });
    },
    [handleUndoAction, showToast]
  );

  const handleMoveItem = useCallback(
    async ({ destBoxId, destLabel, destShortId, sourceBoxId }) => {
      if (!item?._id || !destBoxId) return false;
      if (String(item?.item_status || '').toLowerCase() === 'gone') {
        showToast?.({
          variant: 'warning',
          title: 'Item is marked gone',
          message: 'Restore this item to active inventory before placing it in a box.',
          timeoutMs: 4200,
        });
        return false;
      }

      const beforeItem = item;
      const beforeBox = beforeItem?.box ?? null;
      const isPlaceAction = !beforeBox;

      try {
        setContainerPending(true);
        setContainerError('');

        await requestMoveMutation({
          movingItemId: beforeItem._id,
          sourceBoxId,
          destBoxId,
        });

        const refreshed = await loadItem({ preserveLoading: true });
        const afterBox = refreshed?.box ?? null;
        const destinationName =
          getBoxName(afterBox, '') || destLabel || (destShortId ? `Box #${destShortId}` : 'destination box');
        const itemName = getItemName(refreshed || beforeItem);

        if (isPlaceAction) {
          showUndoToast({
            title: 'Item placed',
            message: `Placed "${itemName}" in "${destinationName}".`,
            undoPayload: {
              type: 'place',
              at: Date.now(),
              itemId: beforeItem._id,
              originalState: 'orphaned',
              placedBoxId: afterBox?._id || destBoxId,
              placedBoxName: destinationName,
              undoSuccessMessage: `Restored "${itemName}" to orphaned state.`,
            },
          });
        } else {
          const sourceName = getBoxName(beforeBox, 'source box');
          showUndoToast({
            title: 'Item moved',
            message: `Moved "${itemName}" to "${destinationName}".`,
            undoPayload: {
              type: 'move',
              at: Date.now(),
              itemId: beforeItem._id,
              fromBoxId: beforeBox?._id,
              fromBoxName: sourceName,
              toBoxId: afterBox?._id || destBoxId,
              toBoxName: destinationName,
              undoSuccessMessage: `Moved "${itemName}" back to "${sourceName}".`,
            },
          });
        }

        return true;
      } catch (err) {
        setContainerError(err?.message || 'Could not move item.');
        showToast?.({
          variant: 'danger',
          title: 'Container update failed',
          message: err?.message || 'Could not move item.',
          timeoutMs: 4600,
        });
        return false;
      } finally {
        setContainerPending(false);
      }
    },
    [item, loadItem, requestMoveMutation, showToast, showUndoToast]
  );

  const handleRemoveFromBox = useCallback(
    async ({ boxMongoId }) => {
      if (!item?._id || !boxMongoId) return false;
      if (String(item?.item_status || '').toLowerCase() === 'gone') {
        showToast?.({
          variant: 'warning',
          title: 'Item is marked gone',
          message: 'This item is already outside active inventory.',
          timeoutMs: 3600,
        });
        return false;
      }

      const beforeItem = item;
      const sourceBox = beforeItem?.box ?? null;
      const sourceName = getBoxName(sourceBox, 'source box');

      try {
        setContainerPending(true);
        setContainerError('');

        await requestRemoveFromBoxMutation({
          movingItemId: beforeItem._id,
          boxMongoId,
        });

        const refreshed = await loadItem({ preserveLoading: true });
        const itemName = getItemName(refreshed || beforeItem);

        showUndoToast({
          title: 'Item removed from box',
          message: `Removed "${itemName}" from "${sourceName}".`,
          undoPayload: {
            type: 'remove',
            at: Date.now(),
            itemId: beforeItem._id,
            originalBoxId: sourceBox?._id || boxMongoId,
            originalBoxName: sourceName,
            fromBoxId: sourceBox?._id || boxMongoId,
            fromBoxName: sourceName,
            undoSuccessMessage: `Restored "${itemName}" to "${sourceName}".`,
          },
        });

        return true;
      } catch (err) {
        setContainerError(err?.message || 'Could not remove item from box.');
        showToast?.({
          variant: 'danger',
          title: 'Container update failed',
          message: err?.message || 'Could not remove item from box.',
          timeoutMs: 4600,
        });
        return false;
      } finally {
        setContainerPending(false);
      }
    },
    [item, loadItem, requestRemoveFromBoxMutation, showToast, showUndoToast]
  );

  const dismissLifecycleDialog = useCallback(() => {
    setLifecycleDialog(null);
    hideToast?.();
  }, [hideToast]);

  const handleConfirmMarkGone = useCallback(
    async ({ disposition, dispositionNotes }) => {
      if (!item?._id || lifecycleBusy) return false;

      try {
        setLifecycleBusy(true);
        await markItemGone(item._id, {
          disposition,
          dispositionNotes,
        });
        await loadItem({ preserveLoading: true });

        setLifecycleDialog(null);
        hideToast?.();

        const readableDisposition = String(disposition || '').trim().toLowerCase();
        showToast?.({
          variant: 'success',
          title: 'Item marked gone',
          message: `"${getItemName(item)}" moved to No Longer Have (${readableDisposition}).`,
          timeoutMs: 4600,
        });
        return true;
      } catch (err) {
        showToast?.({
          variant: 'danger',
          title: 'Mark Gone failed',
          message: err?.message || 'Could not mark this item as gone.',
          timeoutMs: 5200,
        });
        return false;
      } finally {
        setLifecycleBusy(false);
      }
    },
    [hideToast, item, lifecycleBusy, loadItem, showToast]
  );

  const handleConfirmReclaim = useCallback(async () => {
    if (!item?._id || lifecycleBusy) return false;

    try {
      setLifecycleBusy(true);
      await restoreItemToActive(item._id);
      const refreshed = await loadItem({ preserveLoading: true });

      setLifecycleDialog(null);
      hideToast?.();

      const restoredBox = refreshed?.box ?? null;
      const restoredLabel = getBoxName(restoredBox, '');
      showToast?.({
        variant: 'success',
        title: 'Item reclaimed',
        message: restoredLabel
          ? `Item is active again and restored to "${restoredLabel}".`
          : 'Item is active again and currently orphaned.',
        timeoutMs: 4600,
      });
      return true;
    } catch (err) {
      showToast?.({
        variant: 'danger',
        title: 'Reclaim failed',
        message: err?.message || 'Could not reclaim this item.',
        timeoutMs: 5200,
      });
      return false;
    } finally {
      setLifecycleBusy(false);
    }
  }, [hideToast, item, lifecycleBusy, loadItem, showToast]);

  const handleConfirmDeletePermanently = useCallback(async () => {
    if (!item?._id || lifecycleBusy) return false;

    const ownership = getItemOwnershipContext(item);
    const fallbackHref = ownership?.boxId
      ? `/boxes/${encodeURIComponent(ownership.boxId)}`
      : '/all-items';

    try {
      setLifecycleBusy(true);
      await deleteItemPermanently(item._id);

      setLifecycleDialog(null);
      hideToast?.();
      showToast?.({
        variant: 'success',
        title: 'Item permanently deleted',
        message: `"${getItemName(item)}" was removed from the database.`,
        timeoutMs: 2200,
      });

      setTimeout(() => {
        navigate(fallbackHref, { replace: true });
      }, 220);

      return true;
    } catch (err) {
      showToast?.({
        variant: 'danger',
        title: 'Delete failed',
        message: err?.message || 'Could not permanently delete this item.',
        timeoutMs: 5200,
      });
      return false;
    } finally {
      setLifecycleBusy(false);
    }
  }, [hideToast, item, lifecycleBusy, navigate, showToast]);

  useEffect(() => {
    if (!lifecycleDialog || !item?._id) return;

    const ownership = getItemOwnershipContext(item);
    const previousBoxLabel = ownership?.boxLabel
      ? ownership.boxLabel
      : ownership?.boxId
        ? `Box #${ownership.boxId}`
        : '';

    if (lifecycleDialog === 'delete') {
      showToast?.({
        variant: 'danger',
        title: `Delete ${getItemName(item)}`,
        message: 'Permanent action. Confirm carefully.',
        sticky: true,
        content: (
          <ItemHardDeleteConsolePanel
            busy={lifecycleBusy}
            itemName={item?.name}
            onCancel={dismissLifecycleDialog}
            onConfirm={handleConfirmDeletePermanently}
          />
        ),
        onClose: dismissLifecycleDialog,
      });
      return;
    }

    if (lifecycleDialog === 'markGone') {
      showToast?.({
        variant: 'warning',
        title: `Mark ${getItemName(item)} Gone`,
        message: 'Provide lifecycle details before confirming.',
        sticky: true,
        content: (
          <ItemMarkGoneConsolePanel
            busy={lifecycleBusy}
            itemName={item?.name}
            onCancel={dismissLifecycleDialog}
            onConfirm={handleConfirmMarkGone}
          />
        ),
        onClose: dismissLifecycleDialog,
      });
      return;
    }

    if (lifecycleDialog === 'reclaim') {
      showToast?.({
        variant: 'info',
        title: `Reclaim ${getItemName(item)}`,
        message: 'Return this item to active inventory.',
        sticky: true,
        content: (
          <ItemReclaimConsolePanel
            busy={lifecycleBusy}
            itemName={item?.name}
            previousBoxLabel={previousBoxLabel}
            onCancel={dismissLifecycleDialog}
            onConfirm={handleConfirmReclaim}
          />
        ),
        onClose: dismissLifecycleDialog,
      });
    }
  }, [
    dismissLifecycleDialog,
    handleConfirmDeletePermanently,
    handleConfirmMarkGone,
    handleConfirmReclaim,
    item,
    lifecycleBusy,
    lifecycleDialog,
    showToast,
  ]);

  useEffect(() => {
    if (isEditing) return;
    if (!lifecycleDialog) return;
    dismissLifecycleDialog();
  }, [dismissLifecycleDialog, isEditing, lifecycleDialog]);

  if (loading) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard>Loading item details…</S.StateCard>
      </S.Page>
    );
  }

  if (error) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard $tone="error">{error}</S.StateCard>
      </S.Page>
    );
  }

  if (notFound || !item) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard $tone="error">Item not found.</S.StateCard>
      </S.Page>
    );
  }

  return (
    <S.Page>
      <ItemPageBreadcrumb item={item} itemId={itemId} />

      <S.TitleBar>
        <S.TitleRow>
          <S.TitleInfo>
            <S.Title>{item?.name || 'Unnamed Item'}</S.Title>
            <S.Meta>Item ID {item?._id || itemId}</S.Meta>
          </S.TitleInfo>

          <S.ModeToggle
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
          >
            {isEditing ? 'View' : 'Edit'}
          </S.ModeToggle>
        </S.TitleRow>
      </S.TitleBar>

      <ItemContainerSection
        item={item}
        pending={containerPending}
        error={containerError}
        onMoveItem={handleMoveItem}
        onRemoveFromBox={handleRemoveFromBox}
      />

      {isEditing ? (
        <EditItemDetailsForm
          item={item}
          lifecycleBusy={lifecycleBusy}
          onMarkGoneRequest={() => setLifecycleDialog('markGone')}
          onDeletePermanentlyRequest={() => setLifecycleDialog('delete')}
          onReclaimRequest={() => setLifecycleDialog('reclaim')}
          onItemImageUpdated={({ image, imagePath }) => {
            setItem((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                image: image || null,
                imagePath: imagePath || '',
              };
            });
          }}
          onCancel={() => {
            setIsEditing(false);
            loadItem({ preserveLoading: true });
          }}
          onSaved={(updated) => {
            if (!updated) return;
            setItem(updated);
            setIsEditing(false);
          }}
        />
      ) : (
        <ItemDetails itemId={itemId} itemData={item} />
      )}
    </S.Page>
  );
}
