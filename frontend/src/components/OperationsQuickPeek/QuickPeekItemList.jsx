import MissingStatus from '../MissingItems/MissingStatus';
import React from 'react';
import ItemThumbnailMedia from '../ItemThumbnailMedia';
import * as S from './OperationsQuickPeek.styles';

const DATE_FIELDS = {
  boxAdded: ['addedToBoxAt', 'boxAddedAt', 'assignedAt', 'movedAt', 'updatedAt'],
  inventoryAdded: ['createdAt', 'created_at'],
};

function textValue(value) {
  return String(value || '').trim();
}

function tagsValue(item) {
  return (Array.isArray(item?.tags) ? item.tags : [item?.tags])
    .map((tag) => (tag && typeof tag === 'object' ? tag.value : tag))
    .map(textValue)
    .filter(Boolean)
    .join(', ');
}

function dateValue(item, fields) {
  for (const field of fields) {
    const timestamp = Date.parse(item?.[field]);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return null;
}

function compareItems(a, b, sortMode) {
  if (sortMode === 'name') {
    return textValue(a?.name || a?.label).localeCompare(
      textValue(b?.name || b?.label),
      undefined,
      { sensitivity: 'base' },
    );
  }

  if (sortMode === 'tags') {
    return tagsValue(a).localeCompare(tagsValue(b), undefined, { sensitivity: 'base' })
      || textValue(a?.name || a?.label).localeCompare(textValue(b?.name || b?.label), undefined, { sensitivity: 'base' });
  }

  const fields = DATE_FIELDS[sortMode] || DATE_FIELDS.inventoryAdded;
  const aDate = dateValue(a, fields);
  const bDate = dateValue(b, fields);
  if (aDate == null && bDate != null) return 1;
  if (aDate != null && bDate == null) return -1;
  if (aDate != null && bDate != null && aDate !== bDate) return bDate - aDate;
  return textValue(a?.name || a?.label).localeCompare(textValue(b?.name || b?.label), undefined, { sensitivity: 'base' });
}

function quantityLabel(item) {
  const quantity = Number(item?.quantity);
  return Number.isFinite(quantity) ? quantity : 1;
}

export default function QuickPeekItemList({
  items = [],
  matchingItems = [],
  sortMode = 'inventoryAdded',
  emptyMessage = 'No direct items in this box.',
  onSelectItem,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return <S.EmptyItems>{emptyMessage}</S.EmptyItems>;
  }

  const matches = new Set(matchingItems);
  const orderedItems = [
    ...items.filter((item) => matches.has(item)).sort((a, b) => compareItems(a, b, sortMode)),
    ...items.filter((item) => !matches.has(item)).sort((a, b) => compareItems(a, b, sortMode)),
  ];

  return (
    <S.ItemList aria-label="Direct items in this box">
      {orderedItems.map((item, index) => {
        const itemId = String(item?._id || item?.id || index);
        const name = String(item?.name || item?.label || 'Untitled item').trim();
        const category = String(item?.category || '').trim();

        return (
          <S.ItemRow key={itemId}>
            <S.ItemRowButton
              type="button"
              $matched={matches.has(item)}
              aria-label={`Preview ${name}`}
              onClick={() => onSelectItem?.(item)}
            >
              <S.ItemThumbnail as="span"><ItemThumbnailMedia item={item} /></S.ItemThumbnail>
              <S.ItemName>{name}</S.ItemName><MissingStatus item={item} />
              {category || matches.has(item) ? (
                <S.ItemCategory>
                  {matches.has(item) ? <S.ItemMatchLabel>Keyword match</S.ItemMatchLabel> : null}
                  {matches.has(item) && category ? ' · ' : ''}{category}
                </S.ItemCategory>
              ) : null}
              {item.ownerBoxId ? <S.ItemCategory title={item.placementTrail}>#{item.placementLabel}</S.ItemCategory> : null}
              <S.ItemQuantity aria-label={`Quantity ${quantityLabel(item)}`}>
                ×{quantityLabel(item)}
              </S.ItemQuantity>
            </S.ItemRowButton>
          </S.ItemRow>
        );
      })}
    </S.ItemList>
  );
}
