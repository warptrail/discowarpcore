import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemHomeHref } from '../../api/itemDetails';
import * as S from './AllItemsList.styles';
import { getVisibleTags } from './allItemsList.utils';

function getItemHref(itemId) {
  if (!itemId) return '';
  try {
    return getItemHomeHref(itemId);
  } catch {
    return '';
  }
}

function openFromKeyboard(event, onOpen) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOpen?.();
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

function isBatchFullySelected(items, selectedIds) {
  const batchItemIds = (Array.isArray(items) ? items : [])
    .filter((item) => item?._allItems?.isBatchProcessable)
    .map((item) => String(item?._id || '').trim())
    .filter(Boolean);

  return batchItemIds.length > 0 && batchItemIds.every((itemId) => selectedIds.has(itemId));
}

function getSelectableBatchItemCount(items) {
  return (Array.isArray(items) ? items : []).filter(
    (item) => item?._allItems?.isBatchProcessable,
  ).length;
}

function MobileItemCard({
  item,
  batchFocused,
  batchTone,
  isSelected,
  isBatchSelected,
  onToggleItemSelection,
  onSelectBatch,
  onFocusBatch,
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
  const selectable = Boolean(meta?.isBatchProcessable);
  const selectionTitle = meta?.isAlreadyProcessed
    ? 'Already processed'
    : meta?.isProcessingInFlight
      ? 'Already processing'
      : !meta?.hasProcessableImage
        ? 'No source image available'
        : isSelected
          ? `Deselect ${name}`
          : `Select ${name}`;

  return (
    <S.MobileCard $batchFocused={batchFocused} $batchTone={batchTone} $selected={isSelected}>
      <S.MobileCardSurface
        role={itemHref && !batchFocused ? 'button' : undefined}
        tabIndex={itemHref && !batchFocused ? 0 : -1}
        $interactive={!batchFocused && Boolean(itemHref)}
        $selected={isSelected}
        aria-disabled={!itemHref || batchFocused}
        onClick={() => {
          if (itemHref && !batchFocused) navigate(itemHref);
        }}
        onKeyDown={(event) =>
          openFromKeyboard(event, () => {
            if (itemHref && !batchFocused) navigate(itemHref);
          })
        }
      >
        <S.MobileTop>
          {batchFocused ? (
            <S.MobileSelectionToggle
              type="button"
              aria-pressed={isSelected}
              aria-label={selectionTitle}
              title={selectionTitle}
              disabled={!selectable}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleItemSelection?.(item);
              }}
              $selected={isSelected}
            >
              {isSelected ? '✓' : !selectable ? '—' : ''}
            </S.MobileSelectionToggle>
          ) : null}
          <S.MobileNameBlock>
            <S.NameRow>
              {itemHref && !batchFocused ? (
                <S.MobileNameLink to={itemHref} onClick={(event) => event.stopPropagation()}>
                  {name}
                </S.MobileNameLink>
              ) : (
                <S.MobileNameText>{name}</S.MobileNameText>
              )}
              {batchFocused && itemHref ? (
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

            <S.MobileMeta>{meta?.categoryLabel || 'Uncategorized'}</S.MobileMeta>
          </S.MobileNameBlock>

          <S.QtyPill>{meta?.quantityLabel || '—'}</S.QtyPill>
        </S.MobileTop>

        <S.MobileFacts>
          <S.MobileLine>
            <S.Pill $tone={meta?.statusTone}>{meta?.statusLabel || '—'}</S.Pill>
            {meta?.isGone && meta?.disposition ? (
              <S.Pill $tone={meta?.dispositionTone}>{meta?.dispositionLabel}</S.Pill>
            ) : null}
            {meta?.keepPriorityLabel ? (
              <S.Pill $tone={meta?.keepPriorityTone}>Keep: {meta.keepPriorityLabel}</S.Pill>
            ) : null}
            {!batchFocused ? (
              hasBatch ? (
                <S.BatchFocusChip
                  type="button"
                  $archived={meta?.sourceBatchArchiveStatus === 'archived'}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onFocusBatch?.(meta?.sourceBatchId);
                  }}
                >
                  Batch: {batchLabel}
                </S.BatchFocusChip>
              ) : (
                <S.SourceBatchBadge $archived={false}>
                  Batch: {batchLabel}
                </S.SourceBatchBadge>
              )
            ) : null}
            {meta?.hasDispositionNotes ? <S.NotesFlag>Notes</S.NotesFlag> : null}
          </S.MobileLine>

          {visible.length ? (
            <S.MobileLine>
              {visible.map((tag) => (
                <S.TagChip key={`${itemId || name}-${tag}`}>{tag}</S.TagChip>
              ))}
              {overflow > 0 ? <S.OverflowTag>+{overflow}</S.OverflowTag> : null}
            </S.MobileLine>
          ) : null}

          <S.MobileLine>
            {meta?.isBoxed ? (
              meta?.boxHref ? (
                <S.BoxLink to={meta.boxHref} onClick={(event) => event.stopPropagation()}>
                  {[meta.boxId, meta.boxLabel].filter(Boolean).join(' • ')}
                </S.BoxLink>
              ) : (
                <S.BoxLabel>{[meta?.boxId, meta?.boxLabel].filter(Boolean).join(' • ')}</S.BoxLabel>
              )
            ) : meta?.isOrphaned ? (
              <S.Subtle>No box assigned</S.Subtle>
            ) : meta?.hasHistoricalBox ? (
              <S.BoxLabel>
                Last box: {[meta.boxId, meta.boxLabel].filter(Boolean).join(' • ')}
              </S.BoxLabel>
            ) : (
              <S.Subtle>Unassigned</S.Subtle>
            )}
          </S.MobileLine>

          {meta?.isOrphaned && meta?.orphanedAtLabel && meta?.orphanedAtLabel !== '—' ? (
            <S.MobileLine>
              <S.Subtle>Orphaned at: {meta.orphanedAtLabel}</S.Subtle>
            </S.MobileLine>
          ) : null}

          {meta?.locationLabel ? (
            <S.MobileLine>
              <S.Subtle>Location: {meta.locationLabel}</S.Subtle>
            </S.MobileLine>
          ) : null}

          {batchFocused ? (
            <S.MobileBatchBlock $tone={batchTone || 'root'}>
              <S.MobileBatchLine>
                <S.MobileBatchLabel>
                  {batchId ? `Batch: ${meta?.sourceBatchLabel || batchId}` : 'No batch'}
                </S.MobileBatchLabel>
                {batchId ? (
                  <S.BatchSelectButton
                    type="button"
                    $selected={isBatchSelected}
                    disabled={!selectable}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelectBatch?.(batchId);
                    }}
                  >
                    {isBatchSelected ? 'Selected Batch' : 'Select Batch'}
                  </S.BatchSelectButton>
                ) : null}
              </S.MobileBatchLine>
              {batchId ? <S.Subtle>Batch ID: {batchId}</S.Subtle> : null}
            </S.MobileBatchBlock>
          ) : null}

          {meta?.isGone ? (
            <S.MobileLine>
              <S.Subtle>Gone at: {meta.dispositionAtLabel}</S.Subtle>
            </S.MobileLine>
          ) : null}

          {meta?.hasDispositionNotes && meta?.dispositionNotesPreview ? (
            <S.MobileNotes>{meta.dispositionNotesPreview}</S.MobileNotes>
          ) : null}
        </S.MobileFacts>
      </S.MobileCardSurface>
    </S.MobileCard>
  );
}

export default function AllItemsMobileCards({
  items = [],
  batchFocused = false,
  batchToneMap = new Map(),
  selectedItemIds = [],
  onToggleItemSelection,
  onSelectBatch,
  onFocusBatch,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const selectedIds = new Set(selectedItemIds);

  if (!batchFocused) {
    return (
      <S.MobileList>
        {safeItems.map((item, index) => (
          <MobileItemCard
            key={item?._id || `${item?.name || 'item'}-${item?._allItems?.createdAtMs || index}`}
            item={item}
            batchFocused={false}
            batchTone=""
            isSelected={selectedIds.has(String(item?._id || '').trim())}
            isBatchSelected={false}
            onToggleItemSelection={onToggleItemSelection}
            onSelectBatch={onSelectBatch}
            onFocusBatch={onFocusBatch}
          />
        ))}
      </S.MobileList>
    );
  }

  const groups = groupItemsByBatch(safeItems, batchToneMap);

  return (
    <S.BatchSectionsMobile>
      {groups.map((group) => {
        const isBatchSelected =
          Boolean(group.batchId) && isBatchFullySelected(group.items, selectedIds);
        const selectableCount = getSelectableBatchItemCount(group.items);

        return (
          <S.MobileBatchSection
            key={group.key}
            $tone={group.tone || 'root'}
            $selected={isBatchSelected}
          >
            <S.MobileBatchSectionHeader>
              <S.BatchGroupTitleRow>
                <S.BatchGroupTitle>{group.label}</S.BatchGroupTitle>
                {group.archiveStatus === 'archived' ? (
                  <S.SourceBatchBadge $archived>Archived</S.SourceBatchBadge>
                ) : null}
                <S.BatchGroupCount>{group.items.length} items</S.BatchGroupCount>
              </S.BatchGroupTitleRow>
              <S.BatchGroupMeta>
                <S.BatchGroupMetaLine>
                  {group.batchId ? `Batch ID: ${group.batchId}` : 'No source batch'}
                </S.BatchGroupMetaLine>
              </S.BatchGroupMeta>
              <S.BatchGroupActions>
                {group.batchId ? (
                  <S.BatchSelectButton
                    type="button"
                    $selected={isBatchSelected}
                    disabled={!selectableCount}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelectBatch?.(group.batchId);
                    }}
                  >
                    {!selectableCount
                      ? 'No Selectable Items'
                      : isBatchSelected
                        ? 'Select None'
                        : 'Select All'}
                  </S.BatchSelectButton>
                ) : null}
              </S.BatchGroupActions>
            </S.MobileBatchSectionHeader>

            <S.MobileList>
              {group.items.map((item, index) => (
                <MobileItemCard
                  key={item?._id || `${item?.name || 'item'}-${item?._allItems?.createdAtMs || index}`}
                  item={item}
                  batchFocused
                  batchTone={group.tone}
                  isSelected={selectedIds.has(String(item?._id || '').trim())}
                  isBatchSelected={isBatchSelected}
                  onToggleItemSelection={onToggleItemSelection}
                  onSelectBatch={onSelectBatch}
                  onFocusBatch={onFocusBatch}
                />
              ))}
            </S.MobileList>
          </S.MobileBatchSection>
        );
      })}
    </S.BatchSectionsMobile>
  );
}
