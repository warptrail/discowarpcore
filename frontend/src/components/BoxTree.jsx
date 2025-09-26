// src/components/BoxTree.jsx
import React from 'react';
import * as S from '../styles/BoxTree.styles';
import ItemRow from './ItemRow';

/* ---- one titled section per box (root included) ---- */
function BoxSection({
  node,
  depth,
  openItemId,
  onOpenItem,
  accent,
  pulsing,
  onTogglePulse,
  collapseDurMs,
}) {
  if (!node) return null;

  const parentBoxLabel = node.label ?? node.name ?? 'Box';
  const parentBoxId = node.box_id ?? node.shortId ?? '';

  const items = Array.isArray(node.items) ? node.items : [];
  const kids = Array.isArray(node.childBoxes) ? node.childBoxes : [];

  return (
    <S.SectionGroup>
      <S.SectionTitle>
        {parentBoxLabel} <S.ShortId>({parentBoxId || '?'})</S.ShortId>
      </S.SectionTitle>

      {items.length > 0 && (
        <S.List>
          {items.map((it, idx) => {
            const id = String(it?._id ?? it?.id ?? '');
            const key = id || `noid-${depth}-${idx}`;
            const annotated = { ...it, parentBoxLabel, parentBoxId };

            return (
              <ItemRow
                key={key}
                item={annotated}
                isOpen={id ? openItemId === id : false}
                onOpen={id ? () => onOpenItem?.(id) : undefined}
                accent={accent}
                collapseDurMs={collapseDurMs}
                pulsing={!!id && pulsing.includes(id)} // ✅ now uses the item id
                onTogglePulse={id ? () => onTogglePulse?.(id) : undefined}
              />
            );
          })}
        </S.List>
      )}

      {kids.map((child, i) => (
        <S.Nest
          key={String(
            child?._id ??
              child?.id ??
              child?.box_id ??
              child?.shortId ??
              `child-${depth}-${i}`
          )}
          $depth={depth + 1}
        >
          <BoxSection
            node={child}
            depth={depth + 1}
            openItemId={openItemId}
            onOpenItem={onOpenItem}
            accent={accent}
            pulsing={pulsing} // ✅ forwarded
            onTogglePulse={onTogglePulse} // ✅ forwarded
            collapseDurMs={collapseDurMs}
          />
        </S.Nest>
      ))}
    </S.SectionGroup>
  );
}

export default function BoxTree({
  node,
  openItemId,
  onOpenItem,
  accent,
  pulsing,
  onTogglePulse,
  collapseDurMs,
  effectsById,
  onFlash,
}) {
  if (!node) return null;
  console.log('BoxTree debug:', {
    TreeRoot: S.TreeRoot,
    SectionGroup: S.SectionGroup,
    SectionTitle: S.SectionTitle,
    ShortId: S.ShortId,
    List: S.List,
    Nest: S.Nest,
    ItemRow,
  });
  return (
    <S.TreeRoot>
      <BoxSection
        node={node}
        depth={0}
        openItemId={openItemId}
        onOpenItem={onOpenItem}
        accent={accent}
        pulsing={pulsing}
        onTogglePulse={onTogglePulse}
        collapseDurMs={collapseDurMs}
      />
    </S.TreeRoot>
  );
}
