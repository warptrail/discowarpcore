import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemHomeHref } from '../../api/itemDetails';
import * as S from './AllItemsList.styles';
import { getBatchActionEligibility, getVisibleTags } from './allItemsList.utils';

function getItemHref(itemId) {
  if (!itemId) return '';
  try {
    return getItemHomeHref(itemId);
  } catch {
    return '';
  }
}

function groupItemsByBatch(items, batchToneMap) {
  const groups = [];
  const lookup = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const meta = item?._allItems || {};
    const batchId = String(meta?.sourceBatchId || '').trim();
    const groupKey = batchId || '__no_batch__';

    if (!lookup.has(groupKey)) {
      const group = {
        key: groupKey,
        batchId,
        label: String(meta?.sourceBatchLabel || batchId || 'No Batch').trim() || 'No Batch',
        archiveStatus: String(meta?.sourceBatchArchiveStatus || '').trim().toLowerCase(),
        tone: batchId ? batchToneMap.get(batchId) || '' : '',
        items: [],
      };
      lookup.set(groupKey, group);
      groups.push(group);
    }

    lookup.get(groupKey).items.push(item);
  }

  return groups;
}

function resolveCardProcessingState({
  itemId,
  meta,
  itemProcessingById,
}) {
  const normalizedItemId = String(itemId || '').trim();
  const tracked = normalizedItemId ? itemProcessingById?.[normalizedItemId] : null;

  if (tracked?.status) {
    return {
      status: String(tracked.status || '').trim().toLowerCase(),
      progressPercent:
        typeof tracked.progressPercent === 'number' ? tracked.progressPercent : null,
      message: String(tracked.message || '').trim(),
    };
  }

  const processingStatus = String(meta?.processingStatus || '').trim().toLowerCase();
  if (processingStatus === 'queued' || processingStatus === 'processing') {
    return {
      status: processingStatus,
      progressPercent: null,
      message: '',
    };
  }

  if (processingStatus === 'failed') {
    return {
      status: 'error',
      progressPercent: null,
      message: '',
    };
  }

  if (String(meta?.activeVariant || '').trim().toLowerCase() === 'processed') {
    return {
      status: 'done',
      progressPercent: 100,
      message: '',
    };
  }

  return null;
}

function MobileItemCard({
  item,
  batchModeEnabled,
  simpleSelectionModeEnabled,
  batchActionMode,
  batchFocused,
  batchTone,
  colorBy,
  accentColor,
  itemProcessingById,
  isSelected,
  onToggleItemSelection,
  onFocusBatch,
  onOpenImagePreview,
}) {
  const navigate = useNavigate();
  const meta = item?._allItems;
  const itemId = item?._id;
  const itemHref = getItemHref(itemId);
  const name = String(item?.name || 'Unnamed item');
  const { visible, overflow } = getVisibleTags(meta?.tags, 4);
  const batchId = String(meta?.sourceBatchId || '').trim();
  const batchLabel = meta?.sourceBatchLabel || batchId || 'No Batch';
  const hasBatch = Boolean(meta?.hasSourceBatch);
  const thumbnailUrl = String(meta?.thumbnailUrl || '').trim();
  const lightboxImageUrl = String(meta?.lightboxImageUrl || '').trim();
  const accentActive = Boolean(accentColor);
  const imageEligibility = getBatchActionEligibility(meta, batchActionMode);
  const eligibility = simpleSelectionModeEnabled
    ? {
      selectable: !meta?.isGone,
      reason: meta?.isGone ? 'No-longer-have items cannot be moved' : '',
    }
    : imageEligibility;
  const selectable = eligibility.selectable;
  const selectionTitle = isSelected
    ? `Deselect ${name}`
    : eligibility.reason || `Select ${name}`;
  const compactBatchMode = Boolean(batchModeEnabled);
  const imageProcessingState = resolveCardProcessingState({
    itemId,
    meta,
    itemProcessingById,
  });
  const boxValue = meta?.isBoxed
    ? [meta?.boxId, meta?.boxLabel].filter(Boolean).join(' • ')
    : meta?.isOrphaned
      ? 'No box assigned'
      : meta?.hasHistoricalBox
        ? `Last box: ${[meta?.boxId, meta?.boxLabel].filter(Boolean).join(' • ')}`
        : 'Unassigned';
  const tagsValue = visible.length
    ? `${visible.join(', ')}${overflow > 0 ? ` +${overflow}` : ''}`
    : '—';
  return (
    <S.MobileCard
      $batchFocused={batchFocused}
      $batchTone={batchTone}
      $selected={isSelected}
      $unavailable={compactBatchMode && !selectable}
      $accentColor={accentColor}
      $accentActive={accentActive}
    >
      <S.MobileCardSurface
        $interactive={false}
        $selected={isSelected}
        $unavailable={compactBatchMode && !selectable}
      >
        <S.MobileTop>
          {compactBatchMode ? (
            <S.MobileSelectionToggle
              type="button"
              aria-pressed={isSelected}
              aria-label={selectionTitle}
              title={selectionTitle}
              disabled={!selectable}
              $accentColor={accentColor}
              $accentActive={accentActive}
              $selected={isSelected}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleItemSelection?.(item);
              }}
            >
              {isSelected ? '✓' : !selectable ? '—' : ''}
            </S.MobileSelectionToggle>
          ) : null}
          {thumbnailUrl ? (
            <S.MobileThumbButton
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpenImagePreview?.({
                  src: lightboxImageUrl || thumbnailUrl,
                  name,
                });
              }}
              aria-label={`Preview image for ${name}`}
              title={`Preview image for ${name}`}
            >
              <S.MobileThumbFrame $accentColor={accentColor} $accentActive={accentActive}>
                <S.MobileThumbImage src={thumbnailUrl} alt="" loading="lazy" />
              </S.MobileThumbFrame>
            </S.MobileThumbButton>
          ) : (
            <S.MobileThumbFrame $accentColor={accentColor} $accentActive={accentActive}>
              <S.MobileThumbPlaceholder aria-hidden="true">∅</S.MobileThumbPlaceholder>
            </S.MobileThumbFrame>
          )}
          <S.MobileNameBlock>
            <S.NameRow>
              {itemHref && !batchFocused ? (
                <S.MobileNameLink to={itemHref} onClick={(event) => event.stopPropagation()}>
                  {name}
                </S.MobileNameLink>
              ) : (
                <S.MobileNameText>{name}</S.MobileNameText>
              )}
              {batchFocused && itemHref && !compactBatchMode ? (
                <S.ItemOpenButton
                  type="button"
                  aria-label={`Open ${name}`}
                  title={`Open ${name}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    navigate(itemHref);
                  }}
                >
                  ↗
                </S.ItemOpenButton>
              ) : null}
            </S.NameRow>
          </S.MobileNameBlock>

          {!compactBatchMode ? <S.MobileQty>{meta?.quantityLabel || '—'}</S.MobileQty> : null}
        </S.MobileTop>

        <S.MobileFacts>
          {compactBatchMode ? (
            <S.MobileMetaLine>
              <S.MobileMetaLabel>box:</S.MobileMetaLabel>
              {meta?.isBoxed ? (
                meta?.boxHref ? (
                  <S.MobileMetaLink
                    to={meta.boxHref}
                    $accent={colorBy === 'box'}
                    $accentColor={accentColor}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {boxValue}
                  </S.MobileMetaLink>
                ) : (
                  <S.MobileMetaValue $accent={colorBy === 'box'} $accentColor={accentColor}>
                    {boxValue}
                  </S.MobileMetaValue>
                )
              ) : (
                <S.MobileMetaValue>{boxValue}</S.MobileMetaValue>
              )}
            </S.MobileMetaLine>
          ) : (
            <>
          <S.MobileMetaLine>
            <S.MobileMetaLabel>category:</S.MobileMetaLabel>
            <S.MobileMetaValue>{meta?.categoryLabel || 'Uncategorized'}</S.MobileMetaValue>
          </S.MobileMetaLine>

          {!batchFocused ? (
            <S.MobileMetaLine>
              <S.MobileMetaLabel>batch:</S.MobileMetaLabel>
              {hasBatch ? (
                <S.MobileMetaAction
                  type="button"
                  $accent={colorBy === 'batch'}
                  $accentColor={accentColor}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onFocusBatch?.(meta?.sourceBatchId);
                  }}
                >
                  {batchLabel}
                </S.MobileMetaAction>
              ) : (
                <S.MobileMetaValue>{batchLabel}</S.MobileMetaValue>
              )}
            </S.MobileMetaLine>
          ) : null}

          <S.MobileMetaLine>
            <S.MobileMetaLabel>tags:</S.MobileMetaLabel>
            <S.MobileMetaValue>{tagsValue}</S.MobileMetaValue>
          </S.MobileMetaLine>

          <S.MobileMetaLine>
            <S.MobileMetaLabel>box:</S.MobileMetaLabel>
            {meta?.isBoxed ? (
              meta?.boxHref ? (
                <S.MobileMetaLink
                  to={meta.boxHref}
                  $accent={colorBy === 'box'}
                  $accentColor={accentColor}
                  onClick={(event) => event.stopPropagation()}
                >
                  {boxValue}
                </S.MobileMetaLink>
              ) : (
                <S.MobileMetaValue $accent={colorBy === 'box'} $accentColor={accentColor}>
                  {boxValue}
                </S.MobileMetaValue>
              )
            ) : (
              <S.MobileMetaValue>{boxValue}</S.MobileMetaValue>
            )}
          </S.MobileMetaLine>

          {meta?.locationLabel ? (
            <S.MobileMetaLine>
              <S.MobileMetaLabel>location:</S.MobileMetaLabel>
              <S.MobileMetaValue $accent={colorBy === 'location'} $accentColor={accentColor}>
                {meta.locationLabel}
              </S.MobileMetaValue>
            </S.MobileMetaLine>
          ) : null}

          {batchFocused ? (
            <S.MobileBatchBlock $tone={batchTone || 'root'}>
              <S.MobileBatchLine>
                <S.MobileBatchLabel>
                  {batchId ? `Batch: ${meta?.sourceBatchLabel || batchId}` : 'No batch'}
                </S.MobileBatchLabel>
              </S.MobileBatchLine>
              {batchId ? <S.Subtle>Batch ID: {batchId}</S.Subtle> : null}
            </S.MobileBatchBlock>
          ) : null}

          {meta?.isGone ? (
            <S.MobileMetaLine>
              <S.MobileMetaLabel>gone:</S.MobileMetaLabel>
              <S.MobileMetaValue>{meta.dispositionAtLabel}</S.MobileMetaValue>
            </S.MobileMetaLine>
          ) : null}

          {imageProcessingState ? (
            <S.MobileMetaLine>
              <S.MobileMetaLabel>image:</S.MobileMetaLabel>
              <S.MobileMetaValue>
                {imageProcessingState.status}
                {typeof imageProcessingState.progressPercent === 'number'
                  ? ` ${Math.max(0, Math.min(100, Math.round(imageProcessingState.progressPercent)))}%`
                  : ''}
              </S.MobileMetaValue>
              {imageProcessingState.message ? (
                <S.MobileMetaSubValue>{imageProcessingState.message}</S.MobileMetaSubValue>
              ) : null}
            </S.MobileMetaLine>
          ) : null}

          {meta?.hasDispositionNotes && meta?.dispositionNotesPreview ? (
            <S.MobileNotes>{meta.dispositionNotesPreview}</S.MobileNotes>
          ) : null}
            </>
          )}
        </S.MobileFacts>
      </S.MobileCardSurface>
    </S.MobileCard>
  );
}

export default function AllItemsMobileCards({
  items = [],
  batchFocused = false,
  batchModeEnabled = false,
  simpleSelectionModeEnabled = false,
  batchActionMode = 'process',
  batchToneMap = new Map(),
  colorBy = 'none',
  rowAccentByItemId = new Map(),
  itemProcessingById = {},
  selectedItemIds = [],
  onToggleItemSelection,
  onSelectBatch,
  onFocusBatch,
  onOpenImagePreview,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const selectedIds = new Set(Array.isArray(selectedItemIds) ? selectedItemIds : []);
  const selectionModeEnabled = Boolean(batchModeEnabled || simpleSelectionModeEnabled);

  if (!batchFocused) {
    return (
      <S.MobileList>
        {safeItems.map((item, index) => (
          <MobileItemCard
            key={item?._id || `${item?.name || 'item'}-${item?._allItems?.createdAtMs || index}`}
            item={item}
            batchModeEnabled={selectionModeEnabled}
            simpleSelectionModeEnabled={simpleSelectionModeEnabled}
            batchActionMode={batchActionMode}
            batchFocused={false}
            batchTone=""
            colorBy={colorBy}
            accentColor={rowAccentByItemId.get(String(item?._id || '').trim()) || ''}
            itemProcessingById={itemProcessingById}
            isSelected={selectedIds.has(String(item?._id || '').trim())}
            onToggleItemSelection={onToggleItemSelection}
            onFocusBatch={onFocusBatch}
            onOpenImagePreview={onOpenImagePreview}
          />
        ))}
      </S.MobileList>
    );
  }

  const groups = groupItemsByBatch(safeItems, batchToneMap);

  return (
    <S.BatchSectionsMobile>
      {groups.map((group) => {
        return (
          <S.MobileBatchSection
            key={group.key}
            $tone={group.tone || 'root'}
            $selected={false}
          >
            <S.MobileBatchSectionHeader>
              <S.BatchGroupTitleRow>
                <S.BatchGroupTitle>{group.label}</S.BatchGroupTitle>
                {group.archiveStatus === 'archived' ? (
                  <S.SourceBatchBadge $archived>Archived</S.SourceBatchBadge>
                ) : null}
                <S.BatchGroupCount>{group.items.length} items</S.BatchGroupCount>
                {simpleSelectionModeEnabled && group.batchId ? (
                  <S.BatchSelectButton
                    type="button"
                    onClick={() => onSelectBatch?.(group.batchId)}
                  >
                    Select Batch
                  </S.BatchSelectButton>
                ) : null}
              </S.BatchGroupTitleRow>
              <S.BatchGroupMeta>
                <S.BatchGroupMetaLine>
                  {group.batchId ? `Batch ID: ${group.batchId}` : 'No source batch'}
                </S.BatchGroupMetaLine>
              </S.BatchGroupMeta>
            </S.MobileBatchSectionHeader>

            <S.MobileList>
              {group.items.map((item, index) => (
                <MobileItemCard
                  key={item?._id || `${item?.name || 'item'}-${item?._allItems?.createdAtMs || index}`}
                  item={item}
                  batchModeEnabled={selectionModeEnabled}
                  simpleSelectionModeEnabled={simpleSelectionModeEnabled}
                  batchActionMode={batchActionMode}
                  batchFocused
                  batchTone={group.tone}
                  colorBy={colorBy}
                  accentColor={rowAccentByItemId.get(String(item?._id || '').trim()) || ''}
                  itemProcessingById={itemProcessingById}
                  isSelected={selectedIds.has(String(item?._id || '').trim())}
                  onToggleItemSelection={onToggleItemSelection}
                  onFocusBatch={onFocusBatch}
                  onOpenImagePreview={onOpenImagePreview}
                />
              ))}
            </S.MobileList>
          </S.MobileBatchSection>
        );
      })}
    </S.BatchSectionsMobile>
  );
}
