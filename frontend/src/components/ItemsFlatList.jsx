// frontend/src/components/ItemsFlatList.jsx
import React from 'react';
import * as S from '../styles/ItemsFlatList.styles';
import ItemRow from './ItemRow';

export default function ItemsFlatList({
  items,
  openItemId,
  onOpenItem,
  title = 'Items',
  accent,
  pulsingItems,
  onTogglePulse,
  collapseDurMs,
}) {
  const list = Array.isArray(items) ? items : [];
  return (
    <S.Container>
      <S.HeaderRow>
        <S.Title>{title}</S.Title>
        <S.Count>{list.length} items</S.Count>
      </S.HeaderRow>

      <S.List>
        {list.map((it) => {
          const id = String(it?._id ?? it?.id ?? '');
          if (!id) return null;
          return (
            <ItemRow
              key={id}
              item={it}
              isOpen={openItemId === id}
              onOpen={() => onOpenItem?.(id)}
              accent={accent}
              pulsing={pulsingItems.includes(it._id)}
              onTogglePulse={() => onTogglePulse(it._id)}
              collapseDurMs={collapseDurMs}
            />
          );
        })}
      </S.List>
    </S.Container>
  );
}
