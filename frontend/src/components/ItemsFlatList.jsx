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
  pulsing,
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
          const isPulsing = !!pulsing?.includes?.(it._id); // ✅ boolean!
          const isOpen = openItemId === it._id;

          if (!id) return null;
          return (
            <ItemRow
              key={id}
              item={it}
              isOpen={isOpen}
              onOpen={() => onOpenItem?.(id)}
              accent={accent}
              pulsing={pulsing.includes(it._id)}
              onTogglePulse={() => onTogglePulse(it._id)}
              collapseDurMs={collapseDurMs}
            />
          );
        })}
      </S.List>
    </S.Container>
  );
}
