import React from 'react';
import * as S from './AllItemsList.styles';

export default function AllItemsItemCell({
  item,
  itemHref,
  batchFocused = false,
  selected = false,
  onToggleSelection,
  onFocusBatch,
  onOpenItem,
}) {
  const meta = item?._allItems;
  const itemName = String(item?.name || 'Unnamed item');
  const owner = meta?.ownerLabel || '';
  const keepPriorityLabel = meta?.keepPriorityLabel || '';
  const batchLabel = meta?.sourceBatchLabel || meta?.sourceBatchId || 'No Batch';
  const hasBatch = Boolean(meta?.hasSourceBatch);
  const thumbnailUrl = meta?.thumbnailUrl || '';
  const selectable = Boolean(meta?.isBatchProcessable);
  const selectionTitle = meta?.isAlreadyProcessed
    ? 'Already processed'
    : meta?.isProcessingInFlight
      ? 'Already processing'
      : !meta?.hasProcessableImage
        ? 'No source image available'
        : selected
          ? `Deselect ${itemName}`
          : `Select ${itemName}`;

  return (
    <S.ItemCellLayout>
      {batchFocused ? (
        <S.ItemSelectionToggle
          type="button"
          aria-pressed={selected}
          aria-label={selectionTitle}
          title={selectionTitle}
          $selected={selected}
          disabled={!selectable}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleSelection?.();
          }}
        >
          {selected ? '✓' : !selectable ? '—' : ''}
        </S.ItemSelectionToggle>
      ) : null}

      {thumbnailUrl ? (
        <S.ItemThumbFrame aria-hidden="true">
          <S.ItemThumbImage src={thumbnailUrl} alt="" loading="lazy" />
        </S.ItemThumbFrame>
      ) : null}

      <S.ItemCellBody>
        <S.NameRow>
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
                onOpenItem?.();
              }}
            >
              ↗
            </S.ItemOpenButton>
          ) : null}
        </S.NameRow>

        {owner ? <S.NameMeta>{`Owner: ${owner}`}</S.NameMeta> : null}
        {keepPriorityLabel || !batchFocused ? (
          <S.MetaBadgeRow>
            {keepPriorityLabel ? (
              <S.KeepPriorityBadge $tone={meta?.keepPriorityTone}>
                Keep: {keepPriorityLabel}
              </S.KeepPriorityBadge>
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
          </S.MetaBadgeRow>
        ) : null}
      </S.ItemCellBody>
    </S.ItemCellLayout>
  );
}
