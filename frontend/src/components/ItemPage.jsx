import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { API_BASE } from '../api/API_BASE';
import { ToastContext } from './Toast';
import {
  markItemGone,
  restoreItemToActive,
} from '../api/itemLifecycle';
import { completeDeclutterAction } from '../api/declutterDeck';
import ItemPageConsoleView from './ItemPageConsoleView';
import ItemPageImageHero from './ItemPageImageHero';
import ItemPageBreadcrumb from './ItemPageBreadcrumb';
import ItemLifecyclePanel from './ItemLifecyclePanel';
import ItemButtonBar from './ItemButtonBar';
import ItemPageConsoleDetails from './ItemPageConsoleDetails';
import ItemImageField from './ImageFields/ItemImageField';
import useItemFieldEditor from './ItemFieldEditor/useItemFieldEditor';
import { getItemFieldDescriptor } from './ItemFieldEditor/itemFieldRegistry';
import useItemTimestampActions from '../hooks/useItemTimestampActions';
import useItemImageProcessing from '../hooks/useItemImageProcessing';
import useItemDeclutterDeck from '../hooks/useItemDeclutterDeck';
import {
  ItemMarkGoneConsolePanel,
  ItemReclaimConsolePanel,
} from './ItemLifecycleConsolePanels';
import ImageProcessingToastContent from './Processing/ImageProcessingToastContent';
import {
  getImageProcessingToastSignature,
  isImageProcessingInFlight,
} from './Processing/imageProcessingToastUtils';
import { getItemOwnershipContext } from '../util/itemOwnership';
import {
  getItemDepartureRoute,
  isItemPendingDeparture,
} from '../util/itemDeparture';
import {
  getBoxTheme,
  getBoxThemeCssVars,
  getItemTheme,
  getItemThemeCssVars,
} from '../util/inventoryColorTheme';
import * as S from '../styles/ItemPage.styles';
import * as ConsoleS from '../styles/ItemPageConsoleView.styles';

const getBoxName = (box, fallback = 'Box') => {
  if (!box) return fallback;
  return box.label || (box.box_id ? `Box #${box.box_id}` : fallback);
};

const getItemName = (item) => item?.name || 'Item';

const DISPOSITION_BY_DEPARTURE_ROUTE = {
  discard: 'trashed',
  donate: 'donated',
  sell: 'sold',
  gift: 'gifted',
};

const getItemConsoleThemeStyle = (item) => {
  const ownership = getItemOwnershipContext(item);
  const itemId = String(item?._id || item?.id || '');

  const themeStyle = {
    ...getBoxThemeCssVars(getBoxTheme(ownership.boxId)),
    ...getItemThemeCssVars(getItemTheme(ownership.boxId, itemId, {
      selected: true,
      varied: true,
    })),
  };
  if (String(item?.item_status || '').trim().toLowerCase() !== 'gone') {
    return themeStyle;
  }
  return {
    ...themeStyle,
    '--box-primary': '#D9444E',
    '--box-secondary': '#FF9B9B',
    '--box-neon': '#FF7078',
    '--box-muted': '#8A2E36',
    '--box-primary-rgb': '217, 68, 78',
    '--box-secondary-rgb': '255, 155, 155',
    '--box-neon-rgb': '255, 112, 120',
    '--box-muted-rgb': '138, 46, 54',
    '--item-accent': '#FF747C',
    '--item-accent-rgb': '255, 116, 124',
    '--item-secondary': '#FFB0B0',
    '--item-secondary-rgb': '255, 176, 176',
  };
};

export default function ItemPage() {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const legacyEditRequested = searchParams.get('mode') === 'edit';
  const requestedEditKey = String(searchParams.get('edit') || '')
    .trim()
    .toLocaleLowerCase();
  const locatorActive = false;
  const obsoleteLocatorRequested = requestedEditKey === 'choose';
  const activeFieldKey = obsoleteLocatorRequested ? '' : requestedEditKey;
  const viewMode = searchParams.get('view') === 'hierarchy' ? 'hierarchy' : 'all';
  const navigate = useNavigate();
  const retrievalReturn = location.state?.retrievalReturn;
  const hasRetrievalItemReturn = retrievalReturn?.kind === 'retrieval-item';
  const hasRetrievalBoxReturn = retrievalReturn?.kind === 'boxes-item';
  const retrievalReturnBoxId = String(retrievalReturn?.boxId || '').trim();
  const boxReturn = location.state?.boxReturn;
  const hasBoxDetailReturn = boxReturn?.kind === 'box-detail-item';
  const boxReturnId = String(boxReturn?.boxId || '').trim();
  const allItemsReturn = location.state?.allItemsReturn;
  const hasAllItemsReturn = allItemsReturn?.kind === 'all-items-inline-detail';

  const handleRetrievalReturn = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleAllItemsReturn = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleBoxReturn = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const toastCtx = useContext(ToastContext);
  const activeToastId = toastCtx?.toast?.id ?? '';
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [containerPending, setContainerPending] = useState(false);
  const [containerError, setContainerError] = useState('');
  const [lifecycleDialog, setLifecycleDialog] = useState(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [mediaEditorOpen, setMediaEditorOpen] = useState(false);
  const [pendingFieldSuccess, setPendingFieldSuccess] = useState(null);
  const [imageRefreshToken, setImageRefreshToken] = useState(0);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState('');
  const lastImageLifecycleStatusRef = useRef('');

  const {
    declutterPending,
    inDeclutterDeck,
    toggleDeclutterDeck,
  } = useItemDeclutterDeck({ item, showToast, hideToast });

  const undoInFlightRef = useRef(new Set());
  const activeLoadIdRef = useRef(0);

  const updateEditRoute = useCallback((nextFieldKey, { replace = false } = {}) => {
    const params = new URLSearchParams(location.search);
    const normalized = String(nextFieldKey || '').trim().toLocaleLowerCase();

    params.delete('mode');
    if (normalized) {
      params.set('edit', normalized);
      params.delete('view');
    } else {
      params.delete('edit');
    }

    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
        hash: location.hash,
      },
      { replace },
    );
  }, [location.hash, location.pathname, location.search, navigate]);

  const restoreFieldTriggerFocus = useCallback((fieldKey) => {
    const normalized = String(fieldKey || '').trim();
    if (!normalized) return;

    window.requestAnimationFrame(() => {
      const trigger = document.querySelector(`[data-item-field="${normalized}"]`);
      trigger?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (!legacyEditRequested && !obsoleteLocatorRequested) return;

    const params = new URLSearchParams(location.search);
    params.delete('mode');
    params.delete('view');
    params.delete('edit');
    navigate(
      {
        pathname: location.pathname,
        search: `?${params.toString()}`,
        hash: location.hash,
      },
      { replace: true },
    );
  }, [
    legacyEditRequested,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    obsoleteLocatorRequested,
  ]);

  useEffect(() => {
    setProcessedPreviewUrl('');
    setImageRefreshToken(0);
    setMediaEditorOpen(false);
    setPendingFieldSuccess(null);
    lastImageLifecycleStatusRef.current = '';
  }, [itemId]);

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
    const loadId = activeLoadIdRef.current + 1;
    activeLoadIdRef.current = loadId;
    const isCurrentLoad = () => activeLoadIdRef.current === loadId;

    if (!itemId) {
      if (isCurrentLoad()) {
        setLoading(false);
        setNotFound(false);
        setItem(null);
        setError('Missing item id.');
      }
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
        if (!isCurrentLoad()) return null;
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
        if (!isCurrentLoad()) return null;
        setItem(null);
        setNotFound(true);
        return null;
      }

      if (!isCurrentLoad()) return null;
      setItem(nextItem);
      return nextItem;
    } catch (err) {
      if (err?.name !== 'AbortError') {
        if (!isCurrentLoad()) return null;
        console.error('fetch item failed:', err);
        setItem(null);
        setNotFound(false);
        setError(err?.message || 'Failed to load item.');
      }
      return null;
    } finally {
      if (!preserveLoading && isCurrentLoad()) setLoading(false);
    }
  }, [itemId, parseErrorMessage]);

  useEffect(() => {
    const abort = new AbortController();
    loadItem({ signal: abort.signal });
    return () => {
      abort.abort();
    };
  }, [loadItem]);

  const handleFieldSaved = useCallback(async ({
    descriptor,
    fieldKey,
    itemId: savedItemId,
    undoPayload,
    updated,
  }) => {
    if (!updated) return;

    setItem(updated);
    setMediaEditorOpen(false);
    updateEditRoute('', { replace: true });
    restoreFieldTriggerFocus(fieldKey);
    setPendingFieldSuccess({
      descriptor,
      fieldKey,
      itemId: savedItemId,
      undoPayload,
      updated,
    });
  }, [restoreFieldTriggerFocus, updateEditRoute]);

  const fieldEditor = useItemFieldEditor({
    item,
    fieldKey: activeFieldKey,
    onSaved: handleFieldSaved,
  });

  const requestDiscardBefore = useCallback((nextAction) => {
    if (fieldEditor.saving) return false;

    if (!fieldEditor.isDirty) {
      fieldEditor.reset();
      nextAction?.();
      return true;
    }

    // Closing an editor commits its draft. Keep errors in the editor so the
    // user can correct them without an extra confirmation step in the header.
    void fieldEditor.save().then((updated) => {
      if (updated) nextAction?.();
    });
    return false;
  }, [fieldEditor]);

  const handleRequestField = useCallback((fieldKey) => {
    const normalized = String(fieldKey || '').trim().toLocaleLowerCase();
    if (!normalized) return;

    if (normalized === fieldEditor.descriptor?.key) {
      requestDiscardBefore(() => {
        updateEditRoute('', { replace: true });
        restoreFieldTriggerFocus(normalized);
      }, 'Choose whether to keep editing or discard this draft before closing the field.');
      return;
    }

    const openField = () => {
      setMediaEditorOpen(false);
      updateEditRoute(normalized, {
        replace: locatorActive || fieldEditor.isActive,
      });
    };

    requestDiscardBefore(openField, 'Choose whether to keep editing or discard this draft before opening another field.');
  }, [fieldEditor, locatorActive, requestDiscardBefore, restoreFieldTriggerFocus, updateEditRoute]);

  const handleRequestCloseField = useCallback(() => {
    const closingFieldKey = fieldEditor.descriptor?.key || activeFieldKey;
    requestDiscardBefore(() => {
      updateEditRoute('', { replace: true });
      restoreFieldTriggerFocus(closingFieldKey);
    });
  }, [activeFieldKey, fieldEditor.descriptor?.key, requestDiscardBefore, restoreFieldTriggerFocus, updateEditRoute]);

  const setViewMode = useCallback((nextMode) => {
    requestDiscardBefore(() => {
      const params = new URLSearchParams(location.search);
      params.delete('mode');
      params.delete('edit');
      if (nextMode === 'hierarchy') params.set('view', 'hierarchy');
      else params.delete('view');
      setMediaEditorOpen(false);
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : '',
          hash: location.hash,
        },
      );
    }, 'The current field draft must be resolved before changing item views.');
  }, [location.hash, location.pathname, location.search, navigate, requestDiscardBefore]);

  const handleToggleMediaEditor = useCallback(() => {
    requestDiscardBefore(() => {
      updateEditRoute('', { replace: Boolean(requestedEditKey) });
      setMediaEditorOpen((current) => !current);
    }, 'The field draft must be resolved before opening image management.');
  }, [requestDiscardBefore, requestedEditKey, updateEditRoute]);

  const handleOpenLifecycleDialog = useCallback((nextDialog) => {
    requestDiscardBefore(() => {
      setMediaEditorOpen(false);
      updateEditRoute('', { replace: Boolean(requestedEditKey) });
      setLifecycleDialog(nextDialog);
    }, 'The field draft must be resolved before opening lifecycle commands.');
  }, [requestDiscardBefore, requestedEditKey, updateEditRoute]);

  useEffect(() => {
    if (!item?._id || legacyEditRequested) return;
    if (requestedEditKey && viewMode === 'hierarchy') {
      updateEditRoute(requestedEditKey, { replace: true });
      return;
    }
    if (
      requestedEditKey &&
      requestedEditKey !== 'choose' &&
      !getItemFieldDescriptor(requestedEditKey, item)
    ) {
      updateEditRoute('', { replace: true });
    }
  }, [item, legacyEditRequested, requestedEditKey, updateEditRoute, viewMode]);

  useEffect(() => {
    if (!pendingFieldSuccess || fieldEditor.isActive) return;

    const {
      descriptor,
      fieldKey,
      itemId: savedItemId,
      updated,
    } = pendingFieldSuccess;

    showToast?.({
      id: `item-field-saved:${savedItemId}:${fieldKey}:${Date.now()}`,
      variant: 'success',
      title: 'UPDATED',
      message: `${descriptor.label} updated for "${getItemName(updated)}".`,
      presentation: 'item-field',
      themeStyle: getItemConsoleThemeStyle(updated),
      timeoutMs: 1600,
    });
    setPendingFieldSuccess(null);
  }, [fieldEditor.isActive, pendingFieldSuccess, showToast]);

  useEffect(() => {
    if (!fieldEditor.isDirty) return undefined;

    const guardedRoute = `${location.pathname}${location.search}${location.hash}`;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const handleDocumentClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = event.target instanceof Element
        ? event.target.closest('a[href]')
        : null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.href === currentUrl.href) return;

      event.preventDefault();
      requestDiscardBefore(() => {
        if (nextUrl.origin === currentUrl.origin) {
          navigate(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        } else {
          window.location.assign(nextUrl.href);
        }
      }, 'Discard the current field draft before following this link.');
    };

    const handlePopState = () => {
      const intendedRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (intendedRoute === guardedRoute) return;

      navigate(guardedRoute, { replace: true });
      requestDiscardBefore(
        () => navigate(intendedRoute, { replace: true }),
        'Discard the current field draft before using browser history.',
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [fieldEditor.isDirty, location.hash, location.pathname, location.search, navigate, requestDiscardBefore]);

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

  const handleTimestampSaved = useCallback(
    async (updated) => {
      if (updated && typeof updated === 'object') {
        setItem((prev) => ({
          ...(prev || {}),
          ...updated,
        }));
      }
      await loadItem({ preserveLoading: true });
    },
    [loadItem]
  );

  const isGoneItem = String(item?.item_status || '').toLowerCase() === 'gone';
  const { actions: timestampActions } = useItemTimestampActions({
    item,
    onSaved: handleTimestampSaved,
    showToast,
    hideToast,
  });

  useEffect(() => {
    if (loading || error || notFound || !item?._id) return undefined;
    if (fieldEditor.isActive) return undefined;
    if (
      activeToastId &&
      activeToastId !== 'item-page-actions'
    ) {
      return undefined;
    }

    showToast?.({
      id: 'item-page-actions',
      variant: 'command',
      title: getItemName(item),
      titleDetails: <ItemPageConsoleDetails item={item} viewMode={viewMode} />,
      titleAlign: 'start',
      titleSize: 'hero',
      presentation: 'item-page',
      themeStyle: getItemConsoleThemeStyle(item),
      content: hasBoxDetailReturn ? (
        <S.RetrievalReturnButton
          type="button"
          onClick={handleBoxReturn}
          aria-label={`Return to box${boxReturnId ? ` ${boxReturnId}` : ''}`}
        >
          <span aria-hidden="true">←</span>
          <span>Box{boxReturnId ? ` · #${boxReturnId}` : ''} · previous view</span>
        </S.RetrievalReturnButton>
      ) : hasRetrievalItemReturn ? (
        <S.RetrievalReturnButton
          type="button"
          onClick={handleRetrievalReturn}
          aria-label="Return to Retrieval previous view"
        >
          <span aria-hidden="true">←</span>
          <span>Retrieval · previous view</span>
        </S.RetrievalReturnButton>
      ) : hasRetrievalBoxReturn ? (
        <S.RetrievalReturnButton
          type="button"
          onClick={handleRetrievalReturn}
          aria-label={`Return to Retrieval${retrievalReturnBoxId ? ` box ${retrievalReturnBoxId}` : ''}`}
        >
          <span aria-hidden="true">←</span>
          <span>Retrieval{retrievalReturnBoxId ? ` · #${retrievalReturnBoxId}` : ''}</span>
        </S.RetrievalReturnButton>
      ) : hasAllItemsReturn ? (
        <S.RetrievalReturnButton
          type="button"
          onClick={handleAllItemsReturn}
          aria-label="Return to the previous All Items view"
        >
          <span aria-hidden="true">←</span>
          <span>All Items · previous view</span>
        </S.RetrievalReturnButton>
      ) : null,
      sticky: true,
    });

    return () => {
      hideToast?.('item-page-actions');
    };
  }, [
    activeToastId,
    boxReturnId,
    error,
    fieldEditor.isActive,
    handleBoxReturn,
    hideToast,
    handleAllItemsReturn,
    handleRetrievalReturn,
    hasAllItemsReturn,
    hasBoxDetailReturn,
    hasRetrievalItemReturn,
    hasRetrievalBoxReturn,
    item,
    loading,
    notFound,
    retrievalReturnBoxId,
    showToast,
    viewMode,
  ]);

  const handleImageProcessingCompleted = useCallback(async ({ state } = {}) => {
    const nextPreviewUrl = String(
      state?.preferredImageUrl ||
      state?.displayUrl ||
      state?.thumbUrl ||
      state?.processedUrl ||
      ''
    ).trim();

    if (nextPreviewUrl) {
      setProcessedPreviewUrl(nextPreviewUrl);
    }

    await loadItem({ preserveLoading: true });
    setImageRefreshToken(Date.now());
    showToast?.({
      variant: 'success',
      title: 'Image processing complete',
      message: 'Updated processed image is ready.',
      sticky: true,
    });
  }, [loadItem, showToast]);

  const handleImageProcessingFailed = useCallback(({ error }) => {
    showToast?.({
      variant: 'danger',
      title: 'Image processing failed',
      message: error || 'Could not process this image.',
      sticky: true,
    });
  }, [showToast]);

  const {
    processingStatus: processImageStatus,
    processingState: processImageState,
    processingError: processImageError,
    jobProgressLabel: processImageProgressLabel,
    jobProgressPercent: processImageProgressPercent,
    jobId: processImageJobId,
    isBusy: processImageBusy,
    activeVariant,
    hasProcessedVariant,
    isSwitchingVariant,
    variantSwitchError,
    refreshMediaState,
    switchActiveVariant,
    startProcessing: startItemImageProcessing,
  } = useItemImageProcessing({
    itemId: item?._id || itemId,
    onCompleted: handleImageProcessingCompleted,
    onFailed: handleImageProcessingFailed,
  });

  const handleItemImageUpdated = useCallback(({ image, imagePath }) => {
    setProcessedPreviewUrl('');
    setItem((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        image: image || null,
        imagePath: imagePath || '',
      };
    });
    void refreshMediaState().catch(() => {
      // Media state may not exist yet after image mutation.
    });
  }, [refreshMediaState]);

  useEffect(() => {
    const normalizedVariant = String(processImageState?.activeVariant || '').trim().toLowerCase();
    const nextPreviewUrl = String(
      processImageState?.preferredImageUrl ||
      processImageState?.displayUrl ||
      processImageState?.thumbUrl ||
      processImageState?.processedUrl ||
      ''
    ).trim();

    if (normalizedVariant === 'processed' && nextPreviewUrl) {
      setProcessedPreviewUrl((current) => (current === nextPreviewUrl ? current : nextPreviewUrl));
      return;
    }

    if (normalizedVariant === 'original') {
      setProcessedPreviewUrl((current) => (current ? '' : current));
    }
  }, [
    processImageState?.activeVariant,
    processImageState?.preferredImageUrl,
    processImageState?.displayUrl,
    processImageState?.thumbUrl,
    processImageState?.processedUrl,
  ]);

  const handleProcessItemImage = useCallback(async (renderTokens) => {
    try {
      const queued = await startItemImageProcessing({ renderTokens });
      showToast?.({
        variant: 'info',
        title: 'Image processing queued',
        message: queued?.jobId
          ? `Queued job ${queued.jobId}.`
          : 'Image processing request accepted.',
        sticky: true,
      });
      return queued;
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: 'Image processing start failed',
        message: error?.message || 'Failed to enqueue image processing.',
        sticky: true,
      });
      throw error;
    }
  }, [showToast, startItemImageProcessing]);

  useEffect(() => {
    const nextStatus = String(processImageStatus || '').trim().toLowerCase();
    if (!isImageProcessingInFlight(nextStatus)) return;

    const signature = getImageProcessingToastSignature({
      status: nextStatus,
      label: processImageProgressLabel,
      progressPercent: processImageProgressPercent,
      entityLabel: getItemName(item),
      jobId: processImageJobId,
    });
    if (signature === lastImageLifecycleStatusRef.current) return;
    lastImageLifecycleStatusRef.current = signature;

    showToast?.({
      variant: 'info',
      title: 'Image processing',
      message: processImageProgressLabel || 'ObjectGlow/media processing is running.',
      content: (
        <ImageProcessingToastContent
          status={nextStatus}
          label={processImageProgressLabel}
          progressPercent={processImageProgressPercent}
          entityLabel={getItemName(item)}
          jobId={processImageJobId}
        />
      ),
      loading: true,
      sticky: true,
    });
  }, [
    item,
    processImageJobId,
    processImageProgressLabel,
    processImageProgressPercent,
    processImageStatus,
    showToast,
  ]);

  const handleSwitchItemVariant = useCallback(async (nextVariant) => {
    try {
      const updatedState = await switchActiveVariant(nextVariant);
      const latestState = updatedState || await refreshMediaState().catch(() => null);
      const normalizedVariant = String(
        latestState?.activeVariant || nextVariant || ''
      ).trim().toLowerCase();
      const nextPreviewUrl = String(
        latestState?.preferredImageUrl ||
        latestState?.displayUrl ||
        latestState?.thumbUrl ||
        latestState?.processedUrl ||
        ''
      ).trim();

      setProcessedPreviewUrl(normalizedVariant === 'processed' ? (nextPreviewUrl || '') : '');

      await loadItem({ preserveLoading: true });
      setImageRefreshToken(Date.now());

      showToast?.({
        variant: 'success',
        title: 'Active variant updated',
        message: `Switched to ${nextVariant} variant.`,
        timeoutMs: 3000,
      });

      return latestState;
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: 'Variant switch failed',
        message: error?.message || 'Could not switch active variant.',
        timeoutMs: 5000,
      });
      throw error;
    }
  }, [loadItem, refreshMediaState, showToast, switchActiveVariant]);

  const handleConfirmMarkGone = useCallback(
    async ({ disposition, dispositionNotes }) => {
      if (!item?._id || lifecycleBusy) return false;

      const candidateId = String(item?.declutterCandidate?.id || '').trim();
      const isPendingDeclutterAction = item?.declutterCandidate?.deckState === 'action'
        && Boolean(candidateId);

      try {
        setLifecycleBusy(true);
        if (isPendingDeclutterAction) {
          await completeDeclutterAction(candidateId, {
            disposition,
            notes: dispositionNotes,
          });
        } else {
          await markItemGone(item._id, {
            disposition,
            dispositionNotes,
          });
        }
        setLifecycleDialog(null);
        hideToast?.();

        navigate('/', {
          replace: true,
          state: {
            departureFlow: 'completed',
            at: Date.now(),
            toastHandoff: {
              id: `item-lifecycle-completed:${item._id}`,
              variant: 'success',
              title: `${getItemName(item)} was destroyed`,
              message: 'The item was logged in the No Longer Have archive and the system log.',
              timeoutMs: 7000,
            },
          },
        });
        return true;
      } catch (err) {
        showToast?.({
          id: `item-lifecycle-error:${item._id}`,
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
    [hideToast, item, lifecycleBusy, navigate, showToast]
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
        id: `item-lifecycle-reclaimed:${item._id}`,
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
        id: `item-lifecycle-reclaim-error:${item._id}`,
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

  useEffect(() => {
    if (!lifecycleDialog || !item?._id) return;

    const ownership = getItemOwnershipContext(item);
    const previousBoxLabel = ownership?.boxLabel
      ? ownership.boxLabel
      : ownership?.boxId
        ? `Box #${ownership.boxId}`
        : '';

    if (lifecycleDialog === 'markGone') {
      const departureRoute = getItemDepartureRoute(item);
      const suggestedDisposition = DISPOSITION_BY_DEPARTURE_ROUTE[departureRoute] || '';
      const isPendingDeclutterAction = item?.declutterCandidate?.deckState === 'action';
      showToast?.({
        id: `item-lifecycle-confirm-gone:${item._id}`,
        variant: 'warning',
        title: `Confirm ${getItemName(item)} Is Gone`,
        message: 'Verification required before this item enters the archive.',
        sticky: true,
        content: (
          <ItemMarkGoneConsolePanel
            busy={lifecycleBusy}
            itemName={item?.name}
            initialDisposition={suggestedDisposition}
            lockDisposition={isPendingDeclutterAction}
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
        id: `item-lifecycle-reclaim:${item._id}`,
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
    handleConfirmMarkGone,
    handleConfirmReclaim,
    item,
    lifecycleBusy,
    lifecycleDialog,
    showToast,
  ]);

  if (loading) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard>Loading item...</S.StateCard>
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

  if (notFound) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard $tone="error">Item not found.</S.StateCard>
      </S.Page>
    );
  }

  if (!item) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard>Loading item...</S.StateCard>
      </S.Page>
    );
  }

  const ownership = getItemOwnershipContext(item);
  const pageThemeStyle = {
    ...getBoxThemeCssVars(getBoxTheme(ownership.boxId)),
    ...getItemThemeCssVars(getItemTheme(ownership.boxId, item?._id, {
      selected: true,
      varied: true,
    })),
  };
  const itemPendingDeparture = isItemPendingDeparture(item);
  const lifecyclePanel = (
    <ItemLifecyclePanel
      item={item}
      disabled={containerPending || fieldEditor.isActive || lifecycleBusy}
      onMoveItem={handleMoveItem}
      onMarkGoneRequest={() => handleOpenLifecycleDialog('markGone')}
      onReclaimRequest={() => handleOpenLifecycleDialog('reclaim')}
    />
  );

  return (
    <S.Page style={pageThemeStyle}>
      <S.PageMainGrid>
        <S.PageVisualColumn>
          <ItemPageImageHero
            item={item}
            imageUrlOverride={processedPreviewUrl}
            imageRefreshToken={imageRefreshToken}
            imageEditorOpen={mediaEditorOpen}
            onEditImage={handleToggleMediaEditor}
          />

          {mediaEditorOpen ? (
        <ConsoleS.MediaEditorPanel id="item-page-media-editor">
          <ConsoleS.MediaEditorHeader>
            <strong>MEDIA CHANNEL // IMAGE</strong>
            <span>Dedicated asset workflow</span>
          </ConsoleS.MediaEditorHeader>
          <ItemImageField
            item={item}
            disabled={fieldEditor.saving}
            onItemImageUpdated={handleItemImageUpdated}
            onProcessImage={handleProcessItemImage}
            processImageStatus={processImageStatus}
            processImageBusy={processImageBusy}
            processImageError={processImageError}
            processImageProgressLabel={processImageProgressLabel}
            processImageProgressPercent={processImageProgressPercent}
            persistedRenderTokens={processImageState?.renderTokens || null}
            activeVariant={activeVariant}
            hasProcessedVariant={hasProcessedVariant}
            onSwitchActiveVariant={handleSwitchItemVariant}
            switchVariantBusy={isSwitchingVariant}
            switchVariantError={variantSwitchError}
            processedPreviewUrl={processedPreviewUrl}
            imageRefreshToken={imageRefreshToken}
          />
        </ConsoleS.MediaEditorPanel>
          ) : null}

          {itemPendingDeparture ? lifecyclePanel : null}

          <ItemButtonBar
        item={item}
        pending={containerPending || fieldEditor.isActive}
        error={containerError}
        onMoveItem={handleMoveItem}
        onRemoveFromBox={handleRemoveFromBox}
        timestampActions={isGoneItem ? [] : timestampActions}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        mediaEditorOpen={mediaEditorOpen}
        onToggleMedia={handleToggleMediaEditor}
        inDeclutterDeck={inDeclutterDeck}
        declutterPending={declutterPending}
        onDeclutter={toggleDeclutterDeck}
          />
        </S.PageVisualColumn>

        <S.PageDataColumn>
          <ItemPageConsoleView
            fieldEditor={fieldEditor.isActive ? fieldEditor : null}
            item={item}
            itemId={itemId}
            locatorActive={locatorActive}
            onRequestDiscard={handleRequestCloseField}
            onRequestEdit={handleRequestField}
            onSave={fieldEditor.save}
            viewMode={viewMode}
          />
        </S.PageDataColumn>
      </S.PageMainGrid>

      {!itemPendingDeparture ? lifecyclePanel : null}

    </S.Page>
  );
}
