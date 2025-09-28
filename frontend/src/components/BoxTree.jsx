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
  collapseDurMs,
  effectsById,
  triggerFlash,
  onItemSaved,
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
            const isOpen = id && openItemId === id;
            const isPulsing = Array.isArray(pulsing) && pulsing.includes(id);
            const flashColor = effectsById?.[id]?.flash || 'blue'; // default to blue
            const isFlashing = !!effectsById?.[id]?.flash;

            return (
              <ItemRow
                key={key}
                item={annotated}
                isOpen={isOpen}
                onOpen={() => onOpenItem?.(id)}
                accent={accent}
                collapseDurMs={collapseDurMs}
                pulsing={isPulsing}
                flashing={isFlashing}
                flashColor={flashColor}
                triggerFlash={triggerFlash}
                onSaved={(updated) => {
                  // call back up to BoxDetailView
                  onItemSaved?.(updated);
                }}
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
            key={child._id}
            node={child}
            depth={depth + 1}
            openItemId={openItemId}
            onOpenItem={onOpenItem}
            accent={accent}
            pulsing={pulsing} // ✅ forwarded
            collapseDurMs={collapseDurMs}
            effectsById={effectsById} // 👈 forward it down
            triggerFlash={triggerFlash} // 👈 forward it down
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
  effectsById,
  collapseDurMs,
  triggerFlash,
  onItemSaved,
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
        effectsById={effectsById}
        collapseDurMs={collapseDurMs}
        triggerFlash={triggerFlash}
        onItemSaved={onItemSaved} // forward up directly
      />
    </S.TreeRoot>
  );
}
