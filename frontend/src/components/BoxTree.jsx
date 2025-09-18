// src/components/BoxTree.jsx
import React from 'react';
import * as S from '../styles/BoxTree.styles';
import ItemRow from './ItemRow';

/* ---- safe getters ---- */
function itemsOf(node) {
  const a = node?.items ?? node?.box_items ?? node?.contents ?? [];
  return Array.isArray(a) ? a : [];
}
function kidsOf(node) {
  const a = node?.childBoxes ?? node?.children ?? node?.boxes ?? [];
  return Array.isArray(a) ? a : [];
}

/* ---- one titled section per box (root included) ---- */
function BoxSection(props) {
  const {
    node,
    depth,
    openItemId,
    onOpenItem,
    modeFor,
    accent,
    pulsing,
    collapseDurMs,
    effectsById,
  } = props;

  const parentBoxLabel = node.label ?? node.name ?? 'Box';
  const parentBoxId = node.box_id ?? node.shortId ?? '';

  const items = itemsOf(node);
  const kids = kidsOf(node);

  return (
    <S.SectionGroup>
      {/* title … */}

      {items.length > 0 && (
        <S.List>
          {items.map((it, idx) => {
            const id = String(it?._id ?? it?.id ?? '');
            const key = id || `noid-${depth}-${idx}`;
            const annotated = { ...it, parentBoxLabel, parentBoxId };

            // per-row overrides (if any)
            const eff = id ? effectsById?.[id] : null;
            const rowAccent = eff?.accent ?? accent;
            const rowPulsing = eff?.pulsing ?? pulsing;

            return (
              <ItemRow
                key={key}
                item={annotated}
                isOpen={id ? openItemId === id : false}
                onOpen={id ? () => onOpenItem?.(id) : undefined}
                mode={id && modeFor ? modeFor(id) : 'default'}
                accent={rowAccent}
                pulsing={rowPulsing}
                collapseDurMs={collapseDurMs}
              />
            );
          })}
        </S.List>
      )}

      {/* recurse; pass effects through */}
      {kids.map((child, i) => {
        const childKey =
          String(
            child?._id ?? child?.id ?? child?.box_id ?? child?.shortId ?? ''
          ) || `child-${depth}-${i}`;

        return (
          <S.Nest key={childKey} $depth={depth + 1}>
            <BoxSection
              node={child}
              depth={depth + 1}
              openItemId={openItemId}
              onOpenItem={onOpenItem}
              modeFor={modeFor}
              accent={accent}
              pulsing={pulsing}
              collapseDurMs={collapseDurMs}
              effectsById={effectsById}
            />
          </S.Nest>
        );
      })}
    </S.SectionGroup>
  );
}

export default function BoxTree({
  tree,
  items,
  openItemId,
  onOpenItem,
  modeFor,
  accent,
  pulsing = false,
  collapseDurMs = 520,
  effectsById = {},
  onFlash, // if you bubble it into ItemDetails inside
}) {
  if (!tree) return null;

  return (
    <S.Container>
      <BoxSection
        node={tree}
        depth={0}
        openItemId={openItemId}
        onOpenItem={onOpenItem}
        modeFor={modeFor}
        accent={accent}
        pulsing={pulsing}
        collapseDurMs={collapseDurMs}
      />
    </S.Container>
  );
}
