import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import * as S from '../styles/ItemRow.styles';
import { getItemThumbnailUrl } from '../util/itemImage';
import ItemDetails from './ItemDetails';
import EditItemDetailsForm from './EditItemDetailsForm';
import MoveItemToOtherBox from './MoveItemToOtherBox';
import { moveBoxedItem, orphanBoxedItem } from '../api/boxedItems';
import { API_BASE } from '../api/API_BASE';
import { editItem } from '../api/editItem';
import { ToastContext } from './Toast';
import { getItemOwnershipContext } from '../util/itemOwnership';
import useItemTimestampActions from '../hooks/useItemTimestampActions';
import useItemImageProcessing from '../hooks/useItemImageProcessing';
import {
  nominateDeclutterCandidates,
  removeDeclutterCandidateByItem,
} from '../api/declutterDeck';
import ImageProcessingToastContent from './Processing/ImageProcessingToastContent';
import ObsidianPrismSheet from './Sheets/ObsidianPrismSheet';
import {
  getImageProcessingToastSignature,
  isImageProcessingInFlight,
} from './Processing/imageProcessingToastUtils';
import {
  getItemTheme,
  getItemThemeCssVars,
} from '../util/inventoryColorTheme';

export default function ItemRow({
  item,
  isOpen = false,
  onOpen,
  onSaved,
  accent = 'blue',
  pulsing = [],
  collapseDurMs = 520,
  flashing = false,
  flashColor = 'blue',
  triggerFlash,
  refreshBox,
  selectionMode = false,
  selected = false,
  onSelectionChange,
  showBoxContext = false,
}) {
  const rowRef = useRef(null);
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const {
    _id,
    name,
    description,
  } = item;
  const hasQuantity =
    item?.quantity !== null && item?.quantity !== undefined && item?.quantity !== '';
  const quantityLabel = hasQuantity ? `×${item.quantity}` : '';
  const ownership = getItemOwnershipContext(item);
  const sourceBoxMongoId = String(
    ownership?.boxMongoId ||
      item?.parentBoxMongoId ||
      item?.sourceBoxId ||
      item?.parentBox ||
      ''
  ).trim();
  const collapsedDescription = String(description || '').trim();
  const hasCollapsedDescription = collapsedDescription.length > 0;
  const [localImage, setLocalImage] = useState(item?.image || null);
  const [localImagePath, setLocalImagePath] = useState(item?.imagePath || '');
  const [expandedMode, setExpandedMode] = useState('overview');
  const [movePending, setMovePending] = useState(false);
  const [declutterNominating, setDeclutterNominating] = useState(false);
  const [isInDeclutterDeck, setIsInDeclutterDeck] = useState(
    item?.declutterReadiness === 'in_deck'
  );
  const isMarkedForDestruction = item?.declutterExitState === 'marked_for_destruction';
  const [imageRefreshToken, setImageRefreshToken] = useState(0);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState('');
  const [localIsConsumable, setLocalIsConsumable] = useState(Boolean(item?.isConsumable));
  const [consumablePending, setConsumablePending] = useState(false);
  const lastImageLifecycleStatusRef = useRef('');
  const collapsedThumbUrl = getItemThumbnailUrl({
    ...item,
    image: localImage,
    imagePath: localImagePath,
  });
  const itemForView = useMemo(
    () => ({
      ...item,
      image: localImage,
      imagePath: localImagePath,
      isConsumable: localIsConsumable,
    }),
    [item, localImage, localImagePath, localIsConsumable]
  );
  const editSheetContext = useMemo(
    () => [
      ownership.boxId ? `BOX ${ownership.boxId}` : 'NO BOX',
      ownership.boxLabel,
      ownership.effectiveLocation ? `LOCATION ${ownership.effectiveLocation}` : '',
    ].filter(Boolean).join('  ·  '),
    [ownership.boxId, ownership.boxLabel, ownership.effectiveLocation],
  );

  const rowIsOpen = isOpen;
  const itemColorTheme = useMemo(
    () =>
      getItemTheme(ownership.boxId, _id, {
        // Sibling variation stays inside the owning box's palette; item identity
        // must not introduce a competing hue into a box workspace.
        selected: true,
        varied: false,
      }),
    [_id, ownership.boxId],
  );
  const itemThemeStyle = useMemo(
    () => getItemThemeCssVars(itemColorTheme),
    [itemColorTheme],
  );
  const { actions: timestampActions } = useItemTimestampActions({
    item: itemForView,
    onSaved,
    showToast,
    hideToast,
  });
  useEffect(() => {
    setIsInDeclutterDeck(item?.declutterReadiness === 'in_deck');
  }, [item?._id, item?.declutterReadiness]);
  const declutterButtonDisabled = !_id || declutterNominating;

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

    await refreshBox?.();
    setImageRefreshToken(Date.now());
    showToast?.({
      variant: 'success',
      title: 'Image processing complete',
      message: 'Updated processed image is ready.',
      sticky: true,
    });
  }, [refreshBox, showToast]);

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
    itemId: _id,
    onCompleted: handleImageProcessingCompleted,
    onFailed: handleImageProcessingFailed,
  });

  useEffect(() => {
    setLocalImage(item?.image || null);
    setLocalImagePath(item?.imagePath || '');
    setLocalIsConsumable(Boolean(item?.isConsumable));
  }, [_id, item?.image, item?.imagePath, item?.isConsumable]);

  useEffect(() => {
    setProcessedPreviewUrl('');
    setImageRefreshToken(0);
    lastImageLifecycleStatusRef.current = '';
  }, [_id]);

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

  useEffect(() => {
    const nextStatus = String(processImageStatus || '').trim().toLowerCase();
    if (!isImageProcessingInFlight(nextStatus)) return;

    const signature = getImageProcessingToastSignature({
      status: nextStatus,
      label: processImageProgressLabel,
      progressPercent: processImageProgressPercent,
      entityLabel: name || 'Item',
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
          entityLabel={name || 'Item'}
          jobId={processImageJobId}
        />
      ),
      loading: true,
      sticky: true,
    });
  }, [
    name,
    processImageJobId,
    processImageProgressLabel,
    processImageProgressPercent,
    processImageStatus,
    showToast,
  ]);

  useEffect(() => {
    if (!rowIsOpen) {
      setExpandedMode('overview');
    }
  }, [rowIsOpen]);

  useEffect(() => {
    if (!rowIsOpen || selectionMode) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const row = rowRef.current;
      if (!row) return;
      const header = document.querySelector('#root header');
      const headerHeight = header?.getBoundingClientRect().height || 0;
      const top = Math.max(0, window.scrollY + row.getBoundingClientRect().top - headerHeight - 8);
      window.scrollTo({ top, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [rowIsOpen, selectionMode]);

  useEffect(() => {
    setExpandedMode('overview');
  }, [_id]);

  const handleRowClick = () => {
    if (selectionMode) {
      onSelectionChange?.(String(_id || ''), !selected);
      return;
    }
    if (!_id) return;
    if (!rowIsOpen) {
      setExpandedMode('overview');
    }

    onOpen?.(rowIsOpen ? null : _id);
  };

  const handleMoveModeToggle = useCallback(
    (event) => {
      event?.stopPropagation?.();
      if (!_id) return;
      if (!sourceBoxMongoId) {
        showToast?.({
          variant: 'warning',
          title: 'Move unavailable',
          message: 'Could not resolve the current box for this item.',
          timeoutMs: 3400,
        });
        return;
      }

      if (rowIsOpen && expandedMode === 'move') {
        setExpandedMode('overview');
        onOpen?.(null);
        return;
      }

      setExpandedMode('move');
      if (!rowIsOpen) {
        onOpen?.(_id);
      }
    },
    [_id, expandedMode, onOpen, rowIsOpen, showToast, sourceBoxMongoId]
  );

  const handleCloseMoveMode = useCallback((event) => {
    event?.stopPropagation?.();
    setExpandedMode('overview');
  }, []);

  const handleEditModeToggle = useCallback(
    (event) => {
      event?.stopPropagation?.();
      if (!_id) return;

      if (rowIsOpen && expandedMode === 'edit') {
        setExpandedMode('overview');
        return;
      }

      setExpandedMode('edit');
      if (!rowIsOpen) {
        onOpen?.(_id);
      }
    },
    [_id, expandedMode, onOpen, rowIsOpen]
  );

  const handleInlineEditSaved = useCallback(
    (updated) => {
      if (updated && typeof updated === 'object') {
        setLocalImage(updated?.image || null);
        setLocalImagePath(updated?.imagePath || '');
        setLocalIsConsumable(Boolean(updated?.isConsumable));
        onSaved?.(updated);
      }

      void refreshBox?.();
    },
    [onSaved, refreshBox]
  );

  const handleConsumableToggle = useCallback(async (event) => {
    event?.stopPropagation?.();
    if (!_id || consumablePending) return;

    const nextValue = !localIsConsumable;

    try {
      setConsumablePending(true);
      const updated = await editItem(_id, { isConsumable: nextValue });
      setLocalIsConsumable(Boolean(updated?.isConsumable ?? nextValue));
      onSaved?.(updated);
      await refreshBox?.();
      showToast?.({
        variant: 'success',
        title: nextValue ? 'Consumable tracking on' : 'Consumable tracking off',
        message: nextValue
          ? `"${name || 'Item'}" now uses consumable activity.`
          : `"${name || 'Item'}" now uses maintenance activity.`,
        timeoutMs: 3200,
      });
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: 'Consumable update failed',
        message: error?.message || 'Could not update consumable tracking.',
        timeoutMs: 4600,
      });
    } finally {
      setConsumablePending(false);
    }
  }, [
    _id,
    consumablePending,
    localIsConsumable,
    name,
    onSaved,
    refreshBox,
    showToast,
  ]);

  const handleInlineImageUpdated = useCallback(
    ({ image, imagePath } = {}) => {
      setProcessedPreviewUrl('');
      setLocalImage(image || null);
      setLocalImagePath(imagePath || '');
      void refreshBox?.();
      void refreshMediaState().catch(() => {
        // Media state may not exist yet after image mutation.
      });
    },
    [refreshBox, refreshMediaState]
  );

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

      await refreshBox?.();
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
  }, [refreshBox, refreshMediaState, showToast, switchActiveVariant]);

  const handleMoveToSelectedBox = useCallback(
    async ({
      destBoxId,
      destLabel,
      destShortId,
      isOrphanedDestination = false,
    }) => {
      if (!_id || movePending) return;
      if (!sourceBoxMongoId) {
        showToast?.({
          variant: 'danger',
          title: 'Move failed',
          message: 'Source box is missing.',
          timeoutMs: 3600,
        });
        return;
      }
      if (!isOrphanedDestination && !destBoxId) {
        showToast?.({
          variant: 'danger',
          title: 'Move failed',
          message: 'Destination box is missing.',
          timeoutMs: 3600,
        });
        return;
      }

      try {
        setMovePending(true);
        const payload = isOrphanedDestination
          ? await orphanBoxedItem({
              itemId: _id,
              sourceBoxId: sourceBoxMongoId,
              baseUrl: API_BASE,
            })
          : await moveBoxedItem({
              itemId: _id,
              sourceBoxId: sourceBoxMongoId,
              destBoxId,
              baseUrl: API_BASE,
            });

        const updated =
          payload?.data ?? payload?.item ?? payload?.updatedItem ?? null;
        if (updated && typeof updated === 'object') {
          onSaved?.(updated);
        }

        await refreshBox?.();
        setExpandedMode('overview');
        onOpen?.(null);
        showToast?.({
          variant: 'success',
          title: isOrphanedDestination ? 'Item orphaned' : 'Item moved',
          message: isOrphanedDestination
            ? `Moved "${name || 'item'}" to No Box (orphaned).`
            : `Moved "${name || 'item'}" to ${
                destLabel ||
                (destShortId ? `Box #${destShortId}` : 'destination box')
              }.`,
          timeoutMs: 3200,
        });
      } catch (err) {
        showToast?.({
          variant: 'danger',
          title: 'Move failed',
          message: err?.message || 'Could not move this item.',
          timeoutMs: 4200,
        });
      } finally {
        setMovePending(false);
      }
    },
    [
      _id,
      movePending,
      sourceBoxMongoId,
      showToast,
      onSaved,
      refreshBox,
      onOpen,
      name,
    ]
  );

  const runDeclutterChange = useCallback(
    async (nextInDeck) => {
      if (!_id) return null;

      if (!nextInDeck) {
        await removeDeclutterCandidateByItem(_id);
        setIsInDeclutterDeck(false);
        return null;
      }

      const [result] = await nominateDeclutterCandidates([_id]);
      setIsInDeclutterDeck(true);
      return result || null;
    },
    [_id]
  );

  const showDeclutterSuccess = useCallback(
    (nextInDeck, result) => {
      const undoTarget = !nextInDeck;
      showToast?.({
        variant: 'success',
        sticky: true,
        title: nextInDeck ? 'Declutter Deck updated' : 'Removed from Declutter Deck',
        message: nextInDeck
          ? result?.reopened
            ? `Reopened "${name || 'item'}" for a new round.`
            : `Added "${name || 'item'}" to the shared deck.`
          : `Removed "${name || 'item'}" from the shared deck.`,
        actions: [
          {
            id: `undo-declutter-${_id}-${nextInDeck ? 'add' : 'remove'}`,
            label: 'Undo',
            onClick: async () => {
              hideToast?.();
              try {
                setDeclutterNominating(true);
                await runDeclutterChange(undoTarget);
                showToast?.({
                  variant: 'success',
                  title: 'Declutter change undone',
                  message: undoTarget
                    ? `Returned "${name || 'item'}" to the shared deck.`
                    : `Removed "${name || 'item'}" from the shared deck.`,
                  timeoutMs: 3200,
                });
              } catch (err) {
                showToast?.({
                  variant: 'danger',
                  title: 'Undo failed',
                  message: err?.message || 'Could not restore the previous deck state.',
                  timeoutMs: 4200,
                });
              } finally {
                setDeclutterNominating(false);
              }
            },
          },
        ],
      });
    },
    [_id, hideToast, name, runDeclutterChange, showToast]
  );

  const handleDeclutterDeckToggle = useCallback(
    async (event) => {
      event?.stopPropagation?.();
      if (!_id) return;
      const nextInDeck = !isInDeclutterDeck;

      try {
        setDeclutterNominating(true);
        const result = await runDeclutterChange(nextInDeck);
        showDeclutterSuccess(nextInDeck, result);
      } catch (err) {
        showToast?.({
          variant: 'danger',
          title: nextInDeck ? 'Declutter add failed' : 'Declutter removal failed',
          message: err?.message || 'Could not update the item.',
          timeoutMs: 5200,
        });
      } finally {
        setDeclutterNominating(false);
      }
    },
    [_id, isInDeclutterDeck, runDeclutterChange, showDeclutterSuccess, showToast]
  );

  const presentationOpen = selectionMode ? false : rowIsOpen;

  return (
    <S.Wrapper
      ref={rowRef}
      style={itemThemeStyle}
      $accent={accent}
      $open={presentationOpen}
      $pulsing={pulsing}
      $flashing={flashing}
      $flashColor={flashColor}
      $collapseDurMs={collapseDurMs}
    >
      <S.RowShell>
        <S.Row
          type="button"
          onClick={handleRowClick}
          $open={presentationOpen}
          aria-expanded={selectionMode ? undefined : presentationOpen}
          aria-controls={`item-dossier-${_id}`}
          aria-label={
            selectionMode
              ? `${selected ? 'Deselect' : 'Select'} ${name || 'item'}`
              : presentationOpen
              ? `Roll up ${name || 'item'} item dossier`
              : `Open ${name || 'item'} item dossier`
          }
          aria-pressed={selectionMode ? selected : undefined}
        >
          <S.RowHeader $open={presentationOpen} $hasItemLink={presentationOpen}>
            {selectionMode ? <S.RowSelectionState aria-hidden="true" $selected={selected}>{selected ? '✓' : ''}</S.RowSelectionState> : null}
            <S.RowMain $showThumb={!presentationOpen}>
              {!presentationOpen && (
                <S.RowThumb>
                  {collapsedThumbUrl ? (
                    <S.RowThumbImage src={collapsedThumbUrl} alt={`${name || 'Item'} thumbnail`} />
                  ) : (
                    <S.RowThumbPlaceholder aria-hidden="true" />
                  )}
                  {quantityLabel ? <S.ThumbnailQuantity>{quantityLabel}</S.ThumbnailQuantity> : null}
                </S.RowThumb>
              )}

              <S.TitleGroup $mobileCollapsed={!presentationOpen}>
                <S.Title $mobileCollapsed={!presentationOpen} $expanded={presentationOpen}>
                  {name}
                </S.Title>
                {showBoxContext && !presentationOpen ? (
                  <S.RowBoxContext>#{ownership?.boxId || '???'} {ownership?.boxLabel || 'Box'}</S.RowBoxContext>
                ) : null}
                {!presentationOpen && hasCollapsedDescription ? (
                  <S.RowInlineDescription>{collapsedDescription}</S.RowInlineDescription>
                ) : null}
                {presentationOpen && isInDeclutterDeck ? (
                  <S.RowDeckState>In Declutter Deck</S.RowDeckState>
                ) : null}
                {isMarkedForDestruction ? (
                  <S.RowDestructionState>
                    Marked for destruction · still in this box
                  </S.RowDestructionState>
                ) : null}
              </S.TitleGroup>
            </S.RowMain>

            {!presentationOpen ? (
              <S.RowChevron aria-hidden="true" $open={false}>
                ▾
              </S.RowChevron>
            ) : null}
          </S.RowHeader>

        </S.Row>

        {presentationOpen && _id ? (
          <S.ItemHomeLink
            href={`/items/${encodeURIComponent(_id)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${name || 'item'} item page in a new tab`}
            title="Open item page in a new tab"
          >
            ↗
          </S.ItemHomeLink>
        ) : null}
      </S.RowShell>

      <S.Collapse
        id={`item-dossier-${_id}`}
        $open={presentationOpen}
        $collapseDurMs={collapseDurMs}
      >
        <div>
          <S.DetailsCard>
            {expandedMode === 'move' ? (
              <S.MoveWorkspace>
                <S.MoveWorkspaceHeader>
                  <S.MoveWorkspaceTitle>
                    Move {name || '(Unnamed Item)'} to another box
                  </S.MoveWorkspaceTitle>
                  <S.MoveWorkspaceClose
                    type="button"
                    onClick={handleCloseMoveMode}
                    disabled={movePending}
                  >
                    Close
                  </S.MoveWorkspaceClose>
                </S.MoveWorkspaceHeader>
                <MoveItemToOtherBox
                  itemId={_id}
                  currentBoxId={sourceBoxMongoId}
                  onBoxSelected={handleMoveToSelectedBox}
                />
              </S.MoveWorkspace>
            ) : (
              <ItemDetails
                itemId={_id}
                itemData={itemForView}
                enableImageLightbox
                variant="operationsOverview"
                operationsActions={{
                  inDeclutterDeck: isInDeclutterDeck,
                  declutterPending: declutterButtonDisabled,
                  onDeclutter: handleDeclutterDeckToggle,
                  onMove: handleMoveModeToggle,
                  onEdit: handleEditModeToggle,
                  consumablePending,
                  onConsumableToggle: handleConsumableToggle,
                  activityActions: timestampActions,
                  onDossierSaved: handleInlineEditSaved,
                }}
                imageUrlOverride={processedPreviewUrl}
                imageRefreshToken={imageRefreshToken}
              />
            )}
          </S.DetailsCard>
        </div>
      </S.Collapse>

      {presentationOpen && expandedMode === 'edit' ? (
        <ObsidianPrismSheet
          eyebrow="Edit item"
          title={name || '(Unnamed Item)'}
          context={editSheetContext}
          onBack={() => setExpandedMode('overview')}
          onClose={() => setExpandedMode('overview')}
        >
          <EditItemDetailsForm
            item={itemForView}
            triggerFlash={triggerFlash}
            onItemImageUpdated={handleInlineImageUpdated}
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
            onCancel={() => setExpandedMode('overview')}
            onSaved={handleInlineEditSaved}
          />
        </ObsidianPrismSheet>
      ) : null}
    </S.Wrapper>
  );
}
