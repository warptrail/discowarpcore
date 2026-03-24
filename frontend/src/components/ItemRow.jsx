import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  useContext,
} from 'react';
import * as S from '../styles/ItemRow.styles';
import ItemDetails from './ItemDetails';
import MoveItemToOtherBox from './MoveItemToOtherBox';
import { getItemHomeHref } from '../api/itemDetails';
import { moveBoxedItem, orphanBoxedItem } from '../api/boxedItems';
import useIsMobile from '../hooks/useIsMobile';
import { API_BASE } from '../api/API_BASE';
import { ToastContext } from './Toast';
import { markItemGone } from '../api/itemLifecycle';
import { getItemOwnershipContext } from '../util/itemOwnership';

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
  const showCollapsedFallback = !hasCollapsedTags && !hasCollapsedDescription;
  const [localImage, setLocalImage] = useState(item?.image || null);
  const [localImagePath, setLocalImagePath] = useState(item?.imagePath || '');
  const [consumedConfirmOpen, setConsumedConfirmOpen] = useState(false);
  const [expandedMode, setExpandedMode] = useState('overview');
  const [movePending, setMovePending] = useState(false);
  const collapsedThumbUrl =
    localImage?.thumb?.url ||
    localImage?.display?.url ||
    localImage?.original?.url ||
    localImage?.url ||
    localImagePath ||
    '';
  const itemForView = {
    ...item,
    image: localImage,
    imagePath: localImagePath,
  };

  const [targetHeight, setTargetHeight] = useState(0);
  const contentRef = useRef(null);
  const itemHomeHref = _id ? getItemHomeHref(_id) : null;
  const rowIsOpen = isOpen;

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
    if (!rowIsOpen) {
      setExpandedMode('overview');
    }
  }, [rowIsOpen]);

  useEffect(() => {
    setExpandedMode('overview');
  }, [_id]);

  const parseErrorMessage = useCallback(async (response, fallback) => {
    const raw = await response.text().catch(() => '');
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw);
      return parsed?.message || parsed?.error || fallback;
    } catch {
      return raw;
    }
  }, []);

  const appendNowToHistory = useCallback(
    async (field, successTitle) => {
      if (!_id) return;

      const existing = Array.isArray(item?.[field]) ? item[field] : [];
      const nowIso = new Date().toISOString();
      const payload = {
        [field]: [...existing, nowIso],
      };

      try {
        const response = await fetch(`${API_BASE}/api/items/${encodeURIComponent(_id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await parseErrorMessage(
            response,
            'Failed to update item lifecycle.'
          );
          throw new Error(message);
        }

        const json = await response.json().catch(() => ({}));
        const updated = json?.data ?? json;

        if (updated && typeof updated === 'object') {
          onSaved?.(updated);
        }

        showToast?.({
          variant: 'success',
          title: successTitle,
          message: 'Timestamp saved.',
          timeoutMs: 1800,
        });
      } catch (err) {
        showToast?.({
          variant: 'danger',
          title: 'Lifecycle update failed',
          message: err?.message || 'Could not save timestamp.',
          timeoutMs: 3600,
        });
      }
    },
    [_id, item, onSaved, parseErrorMessage, showToast]
  );

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

  const handleMarkUsed = useCallback(
    (event) => {
      event?.stopPropagation?.();
      appendNowToHistory('usageHistory', 'Used now');
    },
    [appendNowToHistory]
  );

  const handleMarkChecked = useCallback(
    (event) => {
      event?.stopPropagation?.();
      appendNowToHistory('checkHistory', 'Checked now');
    },
    [appendNowToHistory]
  );

  const handleMarkMaintained = useCallback(
    (event) => {
      event?.stopPropagation?.();
      appendNowToHistory('maintenanceHistory', 'Maintained now');
    },
    [appendNowToHistory]
  );

  const handleMarkConsumed = useCallback(
    (event) => {
      event?.stopPropagation?.();
      if (!_id) return;

      if (consumedConfirmOpen) {
        hideToast?.();
        setConsumedConfirmOpen(false);
        return;
      }

      setConsumedConfirmOpen(true);
      showToast?.({
        variant: 'warning',
        sticky: true,
        title: 'Mark this consumable as consumed?',
        message: 'Are you sure you want to mark this item as consumed?',
        actions: [
          {
            id: `confirm-consumed-${_id}`,
            label: 'Yes',
            kind: 'danger',
            onClick: async () => {
              try {
                const updated = await markItemGone(_id, {
                  disposition: 'consumed',
                });
                setConsumedConfirmOpen(false);
                onSaved?.(updated);
                showToast?.({
                  variant: 'warning',
                  title: 'Item marked consumed',
                  message:
                    'To unconsume this item, open the edit pane and click Reclaim Item.',
                  timeoutMs: 5600,
                });
              } catch (err) {
                setConsumedConfirmOpen(false);
                showToast?.({
                  variant: 'danger',
                  title: 'Consume action failed',
                  message: err?.message || 'Could not mark this item as consumed.',
                  timeoutMs: 4200,
                });
              }
            },
          },
          {
            id: `cancel-consumed-${_id}`,
            label: 'No',
            onClick: () => {
              hideToast?.();
              setConsumedConfirmOpen(false);
            },
          },
        ],
        onClose: () => {
          hideToast?.();
          setConsumedConfirmOpen(false);
        },
      });
    },
    [_id, consumedConfirmOpen, hideToast, onSaved, showToast]
  );

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

            <S.TitleGroup>
              {itemHomeHref ? (
                <S.ItemNameChip
                  to={itemHomeHref}
                  onClick={(e) => e.stopPropagation()}
                >
                  {name}
                </S.ItemNameChip>
              ) : (
                <S.Title>{name}</S.Title>
              )}
            </S.TitleGroup>
          </S.RowMain>

          <S.RowActions>
            <S.RowActionCluster>
              <S.QuickActionButton
                type="button"
                $tone="move"
                $active={rowIsOpen && expandedMode === 'move'}
                onClick={handleMoveModeToggle}
              >
                Move
              </S.QuickActionButton>
            </S.RowActionCluster>
          </S.RowActions>
        </S.RowHeader>

        <S.QuickView $collapsed={rowIsOpen}>
          <S.QuickMetaRow>
            {hasCollapsedTags ? (
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

            {hasCollapsedDescription ? (
              <S.QuickSummaryDescription $hasTags={hasCollapsedTags}>
                {collapsedDescription}
              </S.QuickSummaryDescription>
            ) : null}

            {showCollapsedFallback ? (
              <S.QuickSummaryFallback>No details</S.QuickSummaryFallback>
            ) : null}
          </S.QuickMetaRow>
        </S.QuickView>
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
                    $tone="used"
                    onClick={handleMarkUsed}
                  >
                    Used
                  </S.QuickActionButton>
                  <S.QuickActionButton
                    type="button"
                    $tone="checked"
                    onClick={handleMarkChecked}
                  >
                    Checked
                  </S.QuickActionButton>
                  {item?.isConsumable ? (
                    <S.QuickActionButton
                      type="button"
                      $tone="consumed"
                      onClick={handleMarkConsumed}
                    >
                      Consumed
                    </S.QuickActionButton>
                  ) : (
                    <S.QuickActionButton
                      type="button"
                      $tone="maintained"
                      onClick={handleMarkMaintained}
                    >
                      Maintained
                    </S.QuickActionButton>
                  )}
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
            ) : (
              <ItemDetails
                itemId={_id}
                itemData={itemForView}
                variant="operationsOverview"
              />
            )}
          </S.DetailsCard>
        </div>
      </S.Collapse>
    </S.Wrapper>
  );
}
