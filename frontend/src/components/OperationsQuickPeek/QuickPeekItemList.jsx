import React, { useEffect, useState } from 'react';
import {
  getItemMicroThumbnailCandidates,
} from '../../util/itemImage';
import * as S from './OperationsQuickPeek.styles';

function quantityLabel(item) {
  const quantity = Number(item?.quantity);
  return Number.isFinite(quantity) ? quantity : 1;
}

function QuickPeekItemThumbnail({ item }) {
  const candidates = getItemMicroThumbnailCandidates(item);
  const candidateKey = candidates.join('\n');
  const [candidateIndex, setCandidateIndex] = useState(0);
  const source = candidates[candidateIndex] || '';

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidateKey]);

  if (!source) {
    return <S.ItemThumbnailFallback aria-hidden="true" />;
  }

  return (
    <S.ItemThumbnail
      src={source}
      alt=""
      width="30"
      height="30"
      loading="lazy"
      decoding="async"
      onError={() => setCandidateIndex((current) => current + 1)}
    />
  );
}

export default function QuickPeekItemList({
  items = [],
  emptyMessage = 'No direct items in this box.',
  onSelectItem,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return <S.EmptyItems>{emptyMessage}</S.EmptyItems>;
  }

  return (
    <S.ItemList aria-label="Direct items in this box">
      {items.map((item, index) => {
        const itemId = String(item?._id || item?.id || index);
        const name = String(item?.name || item?.label || 'Untitled item').trim();
        const category = String(item?.category || '').trim();

        return (
          <S.ItemRow key={itemId}>
            <S.ItemRowButton
              type="button"
              aria-label={`Preview ${name}`}
              onClick={() => onSelectItem?.(item)}
            >
              <QuickPeekItemThumbnail item={item} />
              <S.ItemName>{name}</S.ItemName>
              {category ? <S.ItemCategory>{category}</S.ItemCategory> : null}
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
