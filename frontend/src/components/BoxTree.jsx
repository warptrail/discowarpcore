// frontend/src/components/BoxTree.jsx
import React from 'react';
// import { styledComponents as S } from '../styles/BoxTree.styles';
import * as S from '../styles/BoxTree.styles';
import ItemRow from './ItemRow';

export default function BoxTree({
  tree,
  openItemId,
  onOpenItem,
  onNavigateBox,
}) {
  if (!tree) return null;
  const items = Array.isArray(tree.items) ? tree.items : [];
  const kids = Array.isArray(tree.childBoxes) ? tree.childBoxes : [];

  return (
    <S.Container>
      <S.HeaderRow>
        <S.Title>
          {tree.label} <S.ShortId>({tree.box_id})</S.ShortId>
        </S.Title>
      </S.HeaderRow>

      {kids.length > 0 && (
        <>
          <S.SectionTitle>Child boxes</S.SectionTitle>
          <S.TagRow>
            {kids.map((c) => (
              <S.TagBubble
                key={c._id}
                onClick={() => onNavigateBox?.(c.box_id)}
              >
                {c.box_id}
              </S.TagBubble>
            ))}
          </S.TagRow>
        </>
      )}

      <S.SectionTitle>Items</S.SectionTitle>
      <S.List>
        {items.map((it) => {
          const id = String(it?._id ?? it?.id ?? '');
          if (!id) return null;
          return (
            <ItemRow
              key={id}
              item={it}
              isOpen={openItemId === id}
              onOpen={() => onOpenItem?.(id)}
            />
          );
        })}
      </S.List>
    </S.Container>
  );
}
