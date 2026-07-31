import React, { useEffect, useState } from 'react';
import {
  getItemMicroThumbnailUrl,
  getItemThumbnailUrl,
} from '../../util/itemImage';
import * as S from './OperationsQuickPeek.styles';

function quantityLabel(item) {
  const quantity = Number(item?.quantity);
  return Number.isFinite(quantity) ? quantity : 1;
}

function QuickPeekItemThumbnail({ item }) {
  const microUrl = getItemMicroThumbnailUrl(item);
  const fallbackUrl = getItemThumbnailUrl(item);
  const [source, setSource] = useState(microUrl);

  useEffect(() => {
    setSource(microUrl);
  }, [microUrl]);

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
      onError={() => {
        if (fallbackUrl && source !== fallbackUrl) {
          setSource(fallbackUrl);
        } else {
          setSource('');
        }
      }}
    />
  );
}

export default function QuickPeekItemList({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <S.EmptyItems>No direct items in this box.</S.EmptyItems>;
  }

  return (
    <S.ItemList aria-label="Direct items in this box">
      {items.map((item, index) => {
        const itemId = String(item?._id || item?.id || index);
        const name = String(item?.name || item?.label || 'Untitled item').trim();
        const category = String(item?.category || '').trim();

        return (
          <S.ItemRow key={itemId}>
            <QuickPeekItemThumbnail item={item} />
            <S.ItemName>{name}</S.ItemName>
            {category ? <S.ItemCategory>{category}</S.ItemCategory> : null}
            <S.ItemQuantity aria-label={`Quantity ${quantityLabel(item)}`}>
              ×{quantityLabel(item)}
            </S.ItemQuantity>
          </S.ItemRow>
        );
      })}
    </S.ItemList>
  );
}
