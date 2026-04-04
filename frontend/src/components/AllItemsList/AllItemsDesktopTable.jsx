import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemHomeHref } from '../../api/itemDetails';
import * as S from './AllItemsList.styles';
import { getVisibleTags } from './allItemsList.utils';
import AllItemsItemCell from './AllItemsItemCell';

function shouldSkipRowNavigation(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, input, select, textarea, [role="button"]'));
}

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

function renderBoxCell(meta) {
  if (!meta) return <S.Subtle>—</S.Subtle>;

  if (meta.isBoxed) {
    const title = [meta.boxId, meta.boxLabel].filter(Boolean).join(' • ');
    return (
      <>
        {meta.boxHref ? <S.BoxLink to={meta.boxHref}>{title}</S.BoxLink> : <S.BoxLabel>{title}</S.BoxLabel>}
        {meta.boxDescription ? <S.ContextLine>{meta.boxDescription}</S.ContextLine> : null}
        {meta.locationLabel ? <S.ContextLine>Location: {meta.locationLabel}</S.ContextLine> : null}
      </>
    );
  }

  if (meta.isOrphaned) {
    return (
      <>
        <S.Subtle>No box assigned</S.Subtle>
        {meta.orphanedAtLabel && meta.orphanedAtLabel !== '—' ? (
          <S.ContextLine>Orphaned at: {meta.orphanedAtLabel}</S.ContextLine>
        ) : null}
        {meta.locationLabel ? <S.ContextLine>Location: {meta.locationLabel}</S.ContextLine> : null}
      </>
    );
  }

  if (meta.isGone) {
    return (
      <>
        {meta.hasHistoricalBox ? (
          <S.BoxLabel>
            Last box: {[meta.boxId, meta.boxLabel].filter(Boolean).join(' • ')}
          </S.BoxLabel>
        ) : (
          <S.Subtle>Historical state</S.Subtle>
        )}
        {meta.locationLabel ? <S.ContextLine>Location snapshot: {meta.locationLabel}</S.ContextLine> : null}
      </>
    );
  }

  return <S.Subtle>Unassigned</S.Subtle>;
}

function renderLifecycleCell(meta) {
  if (!meta) return <S.Subtle>—</S.Subtle>;

  if (!meta.isGone) {
    return <S.Subtle>Active inventory item</S.Subtle>;
  }

  return (
    <>
      <S.LifecycleText>Gone at: {meta.dispositionAtLabel}</S.LifecycleText>
      {meta.hasDispositionNotes && meta.dispositionNotesPreview ? (
        <S.NotesPreview>{meta.dispositionNotesPreview}</S.NotesPreview>
      ) : (
        <S.Subtle>No disposition notes</S.Subtle>
      )}
    </>
  );
}

function DesktopItemRow({
  item,
  batchFocused,
  batchTone,
  isSelected,
  onToggleItemSelection,
  onFocusBatch,
}) {
  const navigate = useNavigate();
  const meta = item?._allItems;
  const itemId = item?._id;
  const itemHref = getItemHref(itemId);
  const { visible, overflow } = getVisibleTags(meta?.tags, 4);
  const itemName = String(item?.name || 'Unnamed item');

  const handleRowOpen = (event) => {
    if (batchFocused) return;
    if (!itemId || shouldSkipRowNavigation(event.target)) return;
    navigate(getItemHref(itemId));
  };

  const handleRowKeyDown = (event) => {
    if (batchFocused) return;
    if (!itemId) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    navigate(getItemHref(itemId));
  };

  return (
    <S.TR
      tabIndex={itemId && !batchFocused ? 0 : -1}
      role={itemId && !batchFocused ? 'link' : undefined}
      $interactive={!batchFocused}
      $selected={isSelected}
      $batchFocused={batchFocused}
      $batchTone={batchTone}
      onClick={handleRowOpen}
      onKeyDown={handleRowKeyDown}
    >
      <S.TD $batchFocused={batchFocused} $batchTone={batchTone}>
        <AllItemsItemCell
          item={item}
          itemHref={itemHref}
          batchFocused={batchFocused}
          selected={isSelected}
          onToggleSelection={() => onToggleItemSelection?.(item)}
          onFocusBatch={onFocusBatch}
          onOpenItem={() => {
            if (itemHref) navigate(itemHref);
          }}
        />
      </S.TD>

      <S.TD $batchFocused={batchFocused} $batchTone={batchTone}>
        <S.QtyPill>{meta?.quantityLabel || '—'}</S.QtyPill>
      </S.TD>

      <S.TD $batchFocused={batchFocused} $batchTone={batchTone}>
        <S.Category>{meta?.categoryLabel || 'Uncategorized'}</S.Category>
        {item?.isConsumable ? <S.ContextLine>Consumable</S.ContextLine> : null}
        {visible.length ? (
          <S.TagRow>
            {visible.map((tag) => (
              <S.TagChip key={`${itemId || itemName}-${tag}`}>{tag}</S.TagChip>
            ))}
            {overflow > 0 ? <S.OverflowTag>+{overflow}</S.OverflowTag> : null}
          </S.TagRow>
        ) : (
          <S.Subtle>No tags</S.Subtle>
        )}
      </S.TD>

      <S.TD $batchFocused={batchFocused} $batchTone={batchTone}>
        <S.PillRow>
          <S.Pill $tone={meta?.statusTone}>{meta?.statusLabel || '—'}</S.Pill>
          {meta?.isGone && meta?.disposition ? (
            <S.Pill $tone={meta?.dispositionTone}>{meta?.dispositionLabel}</S.Pill>
          ) : null}
          {meta?.hasDispositionNotes ? <S.NotesFlag>Notes</S.NotesFlag> : null}
        </S.PillRow>
        {!batchFocused ? renderLifecycleCell(meta) : null}
      </S.TD>

      <S.TD $batchFocused={batchFocused} $batchTone={batchTone}>
        {renderBoxCell(meta)}
      </S.TD>
    </S.TR>
  );
}

export default function AllItemsDesktopTable({
  items = [],
  batchFocused = false,
  batchToneMap = new Map(),
  selectedItemIds = [],
  onToggleItemSelection,
  onSelectBatch,
  onFocusBatch,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const selectedIds = new Set(Array.isArray(selectedItemIds) ? selectedItemIds : []);

  if (!batchFocused) {
    return (
      <S.TableScroll>
        <S.Table>
          <thead>
            <tr>
              <S.TH>Item</S.TH>
              <S.TH>Qty</S.TH>
              <S.TH>Category + Tags</S.TH>
              <S.TH>Status + Lifecycle</S.TH>
              <S.TH>Box / Location</S.TH>
            </tr>
          </thead>
          <tbody>
            {safeItems.map((item, index) => (
              <DesktopItemRow
                key={item?._id || `${item?.name || 'item'}-${item?._allItems?.createdAtMs || index}`}
                item={item}
                batchFocused={false}
                batchTone=""
                isSelected={selectedIds.has(String(item?._id || '').trim())}
                onToggleItemSelection={onToggleItemSelection}
                onFocusBatch={onFocusBatch}
              />
            ))}
          </tbody>
        </S.Table>
      </S.TableScroll>
    );
  }

  const groups = groupItemsByBatch(safeItems, batchToneMap);

  return (
    <S.BatchSectionsDesktop>
      {groups.map((group) => {
        const isBatchSelected =
          Boolean(group.batchId) && isBatchFullySelected(group.items, selectedIds);
        const selectableCount = getSelectableBatchItemCount(group.items);

        return (
          <S.BatchTableSection
            key={group.key}
            $tone={group.tone || 'root'}
            $selected={isBatchSelected}
          >
            <S.BatchGroupHeader>
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
            </S.BatchGroupHeader>

            <S.TableScroll>
              <S.Table>
                <thead>
                  <tr>
                    <S.TH>Item</S.TH>
                    <S.TH>Qty</S.TH>
                    <S.TH>Category + Tags</S.TH>
                    <S.TH>Status</S.TH>
                    <S.TH>Box / Location</S.TH>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, index) => (
                    <DesktopItemRow
                      key={item?._id || `${item?.name || 'item'}-${item?._allItems?.createdAtMs || index}`}
                      item={item}
                      batchFocused
                      batchTone={group.tone}
                      isSelected={selectedIds.has(String(item?._id || '').trim())}
                      onToggleItemSelection={onToggleItemSelection}
                      onFocusBatch={onFocusBatch}
                    />
                  ))}
                </tbody>
              </S.Table>
            </S.TableScroll>
          </S.BatchTableSection>
        );
      })}
    </S.BatchSectionsDesktop>
  );
}
