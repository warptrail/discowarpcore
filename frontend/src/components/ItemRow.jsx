import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import * as S from '../styles/ItemRow.styles';
import ItemDetails from './ItemDetails';
import EditItemDetailsForm from './EditItemDetailsForm';
import MoveItemToOtherBox from './MoveItemToOtherBox';
import { getItemHomeHref } from '../api/itemDetails';
import { moveBoxedItem, orphanBoxedItem } from '../api/boxedItems';
import useIsMobile from '../hooks/useIsMobile';
import { API_BASE } from '../api/API_BASE';
import { ToastContext } from './Toast';
import { getItemOwnershipContext } from '../util/itemOwnership';
import useItemTimestampActions from '../hooks/useItemTimestampActions';
import useItemImageProcessing from '../hooks/useItemImageProcessing';
import AddItemToDeclutterSessionToastContent from './Declutter/AddItemToDeclutterSessionToastContent';
import { fetchDeclutterSessionsForItem } from '../api/declutterSessions';
import ImageProcessingToastContent from './Processing/ImageProcessingToastContent';
import {
  getImageProcessingToastSignature,
  isImageProcessingInFlight,
} from './Processing/imageProcessingToastUtils';

export default function ItemRow({
  item,
  isOpen = false,
  onOpen,
  onSaved,
  accent = 'blue',
  pulsing = [],
  collapseDurMs = 300,
  flashing = false,
  flashColor = 'blue',
  triggerFlash,
  refreshBox,
}) {
  const isMobile = useIsMobile(768);
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const {
    _id,
    name,
    tags = [],
    description,
  } = item;
  const hasQuantity =
    item?.quantity !== null && item?.quantity !== undefined && item?.quantity !== '';
  const quantityLabel = hasQuantity ? `Qty ${item.quantity}` : '';
  const ownership = getItemOwnershipContext(item);
  const sourceBoxMongoId = String(
    ownership?.boxMongoId ||
      item?.parentBoxMongoId ||
      item?.sourceBoxId ||
      item?.parentBox ||
      ''
  ).trim();
  const collapsedTagLimit = isMobile ? 3 : 4;
  const normalizedTags = Array.isArray(tags)
    ? tags
        .map((tag) => String(tag || '').trim())
        .filter(Boolean)
    : [];
  const visibleCollapsedTags = normalizedTags.slice(0, collapsedTagLimit);
  const hiddenCollapsedTagCount = Math.max(
    0,
    normalizedTags.length - visibleCollapsedTags.length
  );
  const collapsedDescription = String(description || '').trim();
  const hasCollapsedDescription = collapsedDescription.length > 0;
  const hasCollapsedTags = visibleCollapsedTags.length > 0;
  const showCollapsedTags = !isMobile && hasCollapsedTags;
  const showCollapsedDescription = !isMobile && hasCollapsedDescription;
  const showCollapsedFallback =
    !isMobile && !showCollapsedTags && !showCollapsedDescription;
  const showMobileCollapsedDescription = isMobile && hasCollapsedDescription;
  const hasCollapsedQuickContent = isMobile
    ? showMobileCollapsedDescription
    : showCollapsedTags || showCollapsedDescription || showCollapsedFallback;
  const [localImage, setLocalImage] = useState(item?.image || null);
  const [localImagePath, setLocalImagePath] = useState(item?.imagePath || '');
  const [expandedMode, setExpandedMode] = useState('overview');
  const [movePending, setMovePending] = useState(false);
  const [activeDeclutterSessions, setActiveDeclutterSessions] = useState([]);
  const [declutterMembershipLoading, setDeclutterMembershipLoading] = useState(false);
  const [imageRefreshToken, setImageRefreshToken] = useState(0);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState('');
  const lastImageLifecycleStatusRef = useRef('');
  const collapsedThumbUrl =
    localImage?.thumb?.url ||
    localImage?.display?.url ||
    localImage?.original?.url ||
    localImage?.url ||
    localImagePath ||
    '';
  const itemForView = useMemo(
    () => ({
      ...item,
      image: localImage,
      imagePath: localImagePath,
    }),
    [item, localImage, localImagePath]
  );

  const [targetHeight, setTargetHeight] = useState(0);
  const contentRef = useRef(null);
  const itemHomeHref = _id ? getItemHomeHref(_id) : null;
  const rowIsOpen = isOpen;
  const showExpandedMoveAction = true;
  const showItemNameLink = Boolean(itemHomeHref) && (!isMobile || rowIsOpen);
  const { actions: timestampActions } = useItemTimestampActions({
    item,
    onSaved,
    showToast,
    hideToast,
  });
  const activeDeclutterSessionCount = activeDeclutterSessions.length;
  const declutterButtonDisabled =
    !_id || declutterMembershipLoading || activeDeclutterSessionCount > 0;
  const declutterButtonTitle = declutterMembershipLoading
    ? 'Checking active declutter sessions...'
    : activeDeclutterSessionCount > 0
      ? `Already in active Declutter Session: ${
          activeDeclutterSessions
            .map((session) => session?.name || 'Declutter Session')
            .join(', ')
        }`
      : 'Add this item to a Declutter Session';

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

  // ---- measure helpers
  const measureNow = () => {
    const el = contentRef.current;
    if (!el) return;
    setTargetHeight(el.scrollHeight);
  };

  // Re-measure on open/mode/item switch (double rAF ensures subtree has swapped)
  useLayoutEffect(() => {
    if (!rowIsOpen) {
      setTargetHeight(0);
      return;
    }
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(measureNow);
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, [rowIsOpen, expandedMode, _id]); // depend on id (or item) to catch item changes

  // Track content growth (e.g., ItemDetails finishes loading)
  useEffect(() => {
    if (!rowIsOpen || !contentRef.current || typeof ResizeObserver === 'undefined')
      return;

    const ro = new ResizeObserver(() => {
      // Only adjust while open
      if (contentRef.current) setTargetHeight(contentRef.current.scrollHeight);
    });

    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [rowIsOpen]);

  useEffect(() => {
    setLocalImage(item?.image || null);
    setLocalImagePath(item?.imagePath || '');
  }, [_id, item?.image, item?.imagePath]);

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
    let alive = true;

    if (!rowIsOpen || !_id) {
      setActiveDeclutterSessions([]);
      setDeclutterMembershipLoading(false);
      return () => {
        alive = false;
      };
    }

    setDeclutterMembershipLoading(true);
    fetchDeclutterSessionsForItem(_id, { status: 'active' })
      .then((sessions) => {
        if (!alive) return;
        setActiveDeclutterSessions(Array.isArray(sessions) ? sessions : []);
      })
      .catch(() => {
        if (!alive) return;
        setActiveDeclutterSessions([]);
      })
      .finally(() => {
        if (alive) setDeclutterMembershipLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [_id, rowIsOpen]);

  useEffect(() => {
    setExpandedMode('overview');
  }, [_id]);

  const handleRowClick = () => {
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
        onSaved?.(updated);
      }

      void refreshBox?.();
    },
    [onSaved, refreshBox]
  );

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

  const handleAddToDeclutterSession = useCallback(
    (event) => {
      event?.stopPropagation?.();
      if (!_id) return;

      showToast?.({
        variant: 'info',
        sticky: true,
        title: 'Add to Declutter Session',
        message: `Choose a review queue for "${name || 'item'}".`,
        content: (
          <AddItemToDeclutterSessionToastContent
            itemId={_id}
            itemName={name || 'Item'}
            onCancel={() => hideToast?.()}
            onAdded={({ message, sessionId, sessionName }) => {
              setActiveDeclutterSessions((current) =>
                current.length
                  ? current
                  : [
                      {
                        id: sessionId || 'active',
                        name: sessionName || 'Declutter Session',
                      },
                    ]
              );
              hideToast?.();
              showToast?.({
                variant: 'success',
                title: 'Review queue updated',
                message,
                timeoutMs: 3600,
              });
            }}
          />
        ),
        onClose: () => hideToast?.(),
      });
    },
    [_id, hideToast, name, showToast]
  );

  return (
    <S.Wrapper
      $accent={accent}
      $open={rowIsOpen}
      $pulsing={pulsing}
      $flashing={flashing}
      $flashColor={flashColor}
      $collapseDurMs={collapseDurMs}
      $height={targetHeight}
    >
      <S.Row onClick={handleRowClick} $open={rowIsOpen}>
        <S.RowHeader $open={rowIsOpen}>
          <S.RowMain $showThumb={!rowIsOpen}>
            {!rowIsOpen && (
              <S.RowThumb>
                {collapsedThumbUrl ? (
                  <S.RowThumbImage src={collapsedThumbUrl} alt={`${name || 'Item'} thumbnail`} />
                ) : (
                  <S.RowThumbPlaceholder aria-hidden="true" />
                )}
              </S.RowThumb>
            )}

            <S.TitleGroup $mobileCollapsed={!rowIsOpen}>
              {showItemNameLink ? (
                <S.ItemNameChip
                  $mobileCollapsed={!rowIsOpen}
                  to={itemHomeHref}
                  onClick={(e) => e.stopPropagation()}
                >
                  {name}
                </S.ItemNameChip>
              ) : (
                <S.Title $mobileCollapsed={!rowIsOpen}>{name}</S.Title>
              )}
              {!rowIsOpen && quantityLabel ? (
                <S.QuantitySubtext>{quantityLabel}</S.QuantitySubtext>
              ) : null}
            </S.TitleGroup>
          </S.RowMain>

          <S.RowChevron aria-hidden="true" $open={rowIsOpen}>
            ▾
          </S.RowChevron>
        </S.RowHeader>

        {hasCollapsedQuickContent ? (
          <S.QuickView $collapsed={rowIsOpen}>
            {isMobile ? (
              <S.QuickMetaRow>
                <S.QuickSummaryDescription>
                  {collapsedDescription}
                </S.QuickSummaryDescription>
              </S.QuickMetaRow>
            ) : (
              <S.QuickDesktopStack>
                {showCollapsedTags ? (
                  <S.QuickTagLane>
                    {visibleCollapsedTags.map((tag) => (
                      <S.QuickTag key={tag}>{tag}</S.QuickTag>
                    ))}
                    {hiddenCollapsedTagCount > 0 ? (
                      <S.QuickTagOverflow>
                        +{hiddenCollapsedTagCount}
                      </S.QuickTagOverflow>
                    ) : null}
                  </S.QuickTagLane>
                ) : null}

                {showCollapsedDescription ? (
                  <S.QuickSummaryDescription>
                    {collapsedDescription}
                  </S.QuickSummaryDescription>
                ) : null}

                {showCollapsedFallback ? (
                  <S.QuickSummaryFallback>No details</S.QuickSummaryFallback>
                ) : null}
              </S.QuickDesktopStack>
            )}
          </S.QuickView>
        ) : null}
      </S.Row>

      <S.Collapse
        $open={rowIsOpen}
        $collapseDurMs={collapseDurMs}
        $height={targetHeight}
      >
        <div ref={contentRef}>
          <S.DetailsCard>
            {expandedMode !== 'move' && (
              <S.ExpandedActionStrip>
                <S.ExpandedActionCluster>
                  <S.QuickActionButton
                    type="button"
                    $tone="edit"
                    $active={expandedMode === 'edit'}
                    onClick={handleEditModeToggle}
                  >
                    {expandedMode === 'edit' ? 'View' : 'Edit'}
                  </S.QuickActionButton>
                  {showExpandedMoveAction ? (
                    <S.QuickActionButton
                      type="button"
                      $tone="move"
                      onClick={handleMoveModeToggle}
                    >
                      Move
                    </S.QuickActionButton>
                  ) : null}
                  {timestampActions.map((action) => (
                    <S.QuickActionButton
                      key={action.id}
                      type="button"
                      $tone={action.tone}
                      disabled={action.disabled}
                      onClick={action.onClick}
                    >
                      {action.label}
                    </S.QuickActionButton>
                  ))}
                  <S.QuickActionButton
                    type="button"
                    $tone="declutter"
                    disabled={declutterButtonDisabled}
                    title={declutterButtonTitle}
                    onClick={handleAddToDeclutterSession}
                  >
                    Declutter
                  </S.QuickActionButton>
                </S.ExpandedActionCluster>
              </S.ExpandedActionStrip>
            )}

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
            ) : expandedMode === 'edit' ? (
              <S.EditWorkspace>
                <S.MoveWorkspaceHeader>
                  <S.MoveWorkspaceTitle>
                    Editing {name || '(Unnamed Item)'}
                  </S.MoveWorkspaceTitle>
                  <S.MoveWorkspaceClose
                    type="button"
                    onClick={() => setExpandedMode('overview')}
                  >
                    View
                  </S.MoveWorkspaceClose>
                </S.MoveWorkspaceHeader>
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
              </S.EditWorkspace>
            ) : (
              <ItemDetails
                itemId={_id}
                itemData={itemForView}
                enableImageLightbox
                variant="operationsOverview"
                imageUrlOverride={processedPreviewUrl}
                imageRefreshToken={imageRefreshToken}
              />
            )}
          </S.DetailsCard>
        </div>
      </S.Collapse>
    </S.Wrapper>
  );
}
