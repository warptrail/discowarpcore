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

function renderBoxValue(meta, { accentColor = '', accentActive = false } = {}) {
  if (!meta) return <S.CompactValue>—</S.CompactValue>;

  if (meta.isBoxed) {
    const title = [meta.boxId, meta.boxLabel].filter(Boolean).join(' • ') || 'Assigned';
    return meta.boxHref
      ? (
        <S.CompactLink to={meta.boxHref} $accent={accentActive} $accentColor={accentColor}>
          {title}
        </S.CompactLink>
      )
      : (
        <S.CompactValue $accent={accentActive} $accentColor={accentColor}>
          {title}
        </S.CompactValue>
      );
  }

  if (meta.isOrphaned) return <S.CompactValue>No box assigned</S.CompactValue>;

  if (meta.isGone) {
    if (meta.hasHistoricalBox) {
      return (
        <S.CompactValue>
          {[meta.boxId, meta.boxLabel].filter(Boolean).join(' • ')}
        </S.CompactValue>
      );
    }
    return <S.CompactValue>Historical state</S.CompactValue>;
  }

  return <S.CompactValue>Unassigned</S.CompactValue>;
}

function renderStatusDetails(meta) {
  if (!meta) return <S.CompactValue>—</S.CompactValue>;
  if (!meta.isGone) return <S.CompactValue>Active inventory item</S.CompactValue>;

  const disposition = meta.dispositionLabel && meta.dispositionLabel !== '—'
    ? ` / ${meta.dispositionLabel}`
    : '';
  const goneAt = meta.dispositionAtLabel && meta.dispositionAtLabel !== '—'
    ? `Gone at ${meta.dispositionAtLabel}`
    : 'Gone item';
  const notes = meta.hasDispositionNotes && meta.dispositionNotesPreview
    ? meta.dispositionNotesPreview
    : 'No disposition notes';

  return (
    <>
      <S.CompactValue>{`${goneAt}${disposition}`}</S.CompactValue>
      <S.CompactSubValue>{notes}</S.CompactSubValue>
    </>
  );
}

function resolveRowProcessingState({
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

function DesktopItemRow({
  item,
  selectionModeEnabled,
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
  const { visible, overflow } = getVisibleTags(meta?.tags, 4);
  const itemName = String(item?.name || 'Unnamed item');
  const owner = String(meta?.ownerLabel || '').trim();
  const keepPriority = String(meta?.keepPriorityLabel || '').trim();
  const category = meta?.categoryLabel || 'Uncategorized';
  const tagsLabel = visible.join(', ');
  const tagsValue = tagsLabel
    ? `${tagsLabel}${overflow > 0 ? `, +${overflow}` : ''}`
    : '—';
  const statusValue = [meta?.statusLabel, meta?.isGone ? meta?.dispositionLabel : '']
    .filter(Boolean)
    .join(' / ') || '—';
  const imageProcessingState = resolveRowProcessingState({
    itemId,
    meta,
    itemProcessingById,
  });
  const batchLabel = meta?.sourceBatchLabel || meta?.sourceBatchId || 'No Batch';
  const hasBatch = Boolean(meta?.hasSourceBatch);
  const thumbnailUrl = meta?.thumbnailUrl || '';
  const lightboxImageUrl = meta?.lightboxImageUrl || '';
  const accentActive = Boolean(accentColor);
  const processingEligibility = getBatchActionEligibility(meta, batchActionMode);
  const selectable = simpleSelectionModeEnabled
    ? !meta?.isGone
    : processingEligibility.selectable;
  const selectionTitle = isSelected
    ? `Deselect ${itemName}`
    : simpleSelectionModeEnabled && meta?.isGone
      ? 'No-longer-have items cannot be moved'
      : processingEligibility.reason || `Select ${itemName}`;

  return (
    <S.TR
      $interactive={false}
      $selected={isSelected}
      $batchFocused={batchFocused}
      $batchTone={batchTone}
      $accentColor={accentColor}
      $accentActive={accentActive}
    >
      <S.TD
        colSpan={5}
        $batchFocused={batchFocused}
        $batchTone={batchTone}
        $accentColor={accentColor}
        $accentActive={accentActive}
      >
        <S.OperatorRowGrid>
          <S.OperatorThumbCell>
            {selectionModeEnabled ? (
              <S.ItemSelectionToggle
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
                {isSelected ? '✓' : ''}
              </S.ItemSelectionToggle>
            ) : null}
            {thumbnailUrl ? (
              <S.ItemThumbButton
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onOpenImagePreview?.({
                    src: lightboxImageUrl || thumbnailUrl,
                    name: itemName,
                  });
                }}
                aria-label={`Preview image for ${itemName}`}
                title={`Preview image for ${itemName}`}
              >
                <S.ItemThumbFrame $accentColor={accentColor} $accentActive={accentActive}>
                  <S.ItemThumbImage src={thumbnailUrl} alt="" loading="lazy" />
                </S.ItemThumbFrame>
              </S.ItemThumbButton>
            ) : (
              <S.ThumbPlaceholder aria-hidden="true">—</S.ThumbPlaceholder>
            )}
          </S.OperatorThumbCell>

          <S.OperatorItemCell>
            <S.OperatorItemNameRow>
              {itemHref && !batchFocused ? (
                <S.NameLink to={itemHref} onClick={(event) => event.stopPropagation()}>
                  {itemName}
                </S.NameLink>
              ) : (
                <S.NameText>{itemName}</S.NameText>
              )}
              {batchFocused && itemHref ? (
                <S.ItemOpenButton
                  type="button"
                  aria-label={`Open ${itemName}`}
                  title={`Open ${itemName}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    navigate(itemHref);
                  }}
                >
                  ↗
                </S.ItemOpenButton>
              ) : null}
            </S.OperatorItemNameRow>
            <S.CompactMetaRow>
              <S.CompactMetaEntry>
                <S.CompactLabel>owner</S.CompactLabel>
                <S.CompactValue>{owner || '—'}</S.CompactValue>
              </S.CompactMetaEntry>
              <S.CompactMetaEntry>
                <S.CompactLabel>keep</S.CompactLabel>
                <S.CompactValue>{keepPriority || '—'}</S.CompactValue>
              </S.CompactMetaEntry>
              <S.CompactMetaEntry>
                <S.CompactLabel>batch</S.CompactLabel>
                {hasBatch && !batchFocused ? (
                  <S.CompactActionButton
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
                  </S.CompactActionButton>
                ) : (
                  <S.CompactValue $accent={colorBy === 'batch'} $accentColor={accentColor}>
                    {batchLabel}
                  </S.CompactValue>
                )}
              </S.CompactMetaEntry>
            </S.CompactMetaRow>
          </S.OperatorItemCell>

          <S.OperatorQtyCell>{meta?.quantityLabel || '—'}</S.OperatorQtyCell>

          <S.OperatorMetaCell>
            <S.CompactMetaEntry>
              <S.CompactLabel>category</S.CompactLabel>
              <S.CompactValue>{category}</S.CompactValue>
            </S.CompactMetaEntry>
            <S.CompactMetaEntry>
              <S.CompactLabel>tags</S.CompactLabel>
              <S.CompactValue>{tagsValue}</S.CompactValue>
            </S.CompactMetaEntry>
          </S.OperatorMetaCell>

          <S.OperatorMetaCell>
            <S.CompactMetaEntry>
              <S.CompactLabel>status</S.CompactLabel>
              <S.CompactValue $accent={colorBy === 'status'} $accentColor={accentColor}>
                {statusValue}
              </S.CompactValue>
            </S.CompactMetaEntry>
            <S.CompactMetaEntry>
              <S.CompactLabel>lifecycle</S.CompactLabel>
              {renderStatusDetails(meta)}
            </S.CompactMetaEntry>
            {imageProcessingState ? (
              <S.CompactMetaEntry>
                <S.CompactLabel>image</S.CompactLabel>
                <S.CompactValue>
                  {imageProcessingState.status}
                  {typeof imageProcessingState.progressPercent === 'number'
                    ? ` ${Math.max(0, Math.min(100, Math.round(imageProcessingState.progressPercent)))}%`
                    : ''}
                </S.CompactValue>
                {imageProcessingState.message ? (
                  <S.CompactSubValue>{imageProcessingState.message}</S.CompactSubValue>
                ) : null}
              </S.CompactMetaEntry>
            ) : null}
          </S.OperatorMetaCell>

          <S.OperatorMetaCell>
            <S.CompactMetaEntry>
              <S.CompactLabel>box</S.CompactLabel>
              {renderBoxValue(meta, { accentActive: colorBy === 'box', accentColor })}
            </S.CompactMetaEntry>
            <S.CompactMetaEntry>
              <S.CompactLabel>location</S.CompactLabel>
              <S.CompactValue $accent={colorBy === 'location'} $accentColor={accentColor}>
                {meta?.locationLabel || '—'}
              </S.CompactValue>
            </S.CompactMetaEntry>
          </S.OperatorMetaCell>
        </S.OperatorRowGrid>
      </S.TD>
    </S.TR>
  );
}

export default function AllItemsDesktopTable({
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
      <S.TableScroll>
        <S.Table>
          <thead>
            <tr>
              <S.RowHeaderTH colSpan={5}>
                <S.OperatorRowGrid>
                  <S.OperatorHeaderCell>thumb</S.OperatorHeaderCell>
                  <S.OperatorHeaderCell>item</S.OperatorHeaderCell>
                  <S.OperatorHeaderCell>qty</S.OperatorHeaderCell>
                  <S.OperatorHeaderCell>category / tags</S.OperatorHeaderCell>
                  <S.OperatorHeaderCell>status / lifecycle</S.OperatorHeaderCell>
                  <S.OperatorHeaderCell>box / location</S.OperatorHeaderCell>
                </S.OperatorRowGrid>
              </S.RowHeaderTH>
            </tr>
          </thead>
          <tbody>
            {safeItems.map((item, index) => (
              <DesktopItemRow
                key={item?._id || `${item?.name || 'item'}-${item?._allItems?.createdAtMs || index}`}
                item={item}
                selectionModeEnabled={selectionModeEnabled}
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
          </tbody>
        </S.Table>
      </S.TableScroll>
    );
  }

  const groups = groupItemsByBatch(safeItems, batchToneMap);

  return (
    <S.BatchSectionsDesktop>
      {groups.map((group) => {
        return (
          <S.BatchTableSection
            key={group.key}
            $tone={group.tone || 'root'}
            $selected={false}
          >
            <S.BatchGroupHeader>
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
            </S.BatchGroupHeader>

            <S.TableScroll>
              <S.Table>
                <thead>
                  <tr>
                    <S.RowHeaderTH colSpan={5}>
                      <S.OperatorRowGrid>
                        <S.OperatorHeaderCell>thumb</S.OperatorHeaderCell>
                        <S.OperatorHeaderCell>item</S.OperatorHeaderCell>
                        <S.OperatorHeaderCell>qty</S.OperatorHeaderCell>
                        <S.OperatorHeaderCell>category / tags</S.OperatorHeaderCell>
                        <S.OperatorHeaderCell>status / lifecycle</S.OperatorHeaderCell>
                        <S.OperatorHeaderCell>box / location</S.OperatorHeaderCell>
                      </S.OperatorRowGrid>
                    </S.RowHeaderTH>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, index) => (
                    <DesktopItemRow
                      key={item?._id || `${item?.name || 'item'}-${item?._allItems?.createdAtMs || index}`}
                      item={item}
                      selectionModeEnabled={selectionModeEnabled}
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
                </tbody>
              </S.Table>
            </S.TableScroll>
          </S.BatchTableSection>
        );
      })}
    </S.BatchSectionsDesktop>
  );
}
