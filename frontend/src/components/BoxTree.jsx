// src/components/BoxTree.jsx
import React from 'react';
import * as S from '../styles/BoxTree.styles';
import ItemRow from './ItemRow';

<<<<<<< HEAD
/* ---- one titled section per box (root included) ---- */
function BoxSection({
  node,
  depth,
  openItemId,
  onOpenItem,
  accent,
  pulsingItems,
  onTogglePulse,
  collapseDurMs,
}) {
  if (!node) return null;
=======
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
>>>>>>> 3123b55bb2392bac94571c9ff3fca80901946793

  const parentBoxLabel = node.label ?? node.name ?? 'Box';
  const parentBoxId = node.box_id ?? node.shortId ?? '';

  const items = Array.isArray(node.items) ? node.items : [];
  const kids = Array.isArray(node.childBoxes) ? node.childBoxes : [];

  return (
    <S.SectionGroup>
<<<<<<< HEAD
      <S.SectionTitle>
        {parentBoxLabel} <S.ShortId>({parentBoxId || '?'})</S.ShortId>
      </S.SectionTitle>
=======
      {/* title … */}
>>>>>>> 3123b55bb2392bac94571c9ff3fca80901946793

      {items.length > 0 && (
        <S.List>
          {items.map((it, idx) => {
            const id = String(it?._id ?? it?.id ?? '');
            const key = id || `noid-${depth}-${idx}`;
            const annotated = { ...it, parentBoxLabel, parentBoxId };

<<<<<<< HEAD
=======
            // per-row overrides (if any)
            const eff = id ? effectsById?.[id] : null;
            const rowAccent = eff?.accent ?? accent;
            const rowPulsing = eff?.pulsing ?? pulsing;

>>>>>>> 3123b55bb2392bac94571c9ff3fca80901946793
            return (
              <ItemRow
                key={key}
                item={annotated}
                isOpen={id ? openItemId === id : false}
                onOpen={id ? () => onOpenItem?.(id) : undefined}
<<<<<<< HEAD
                accent={accent}
                collapseDurMs={collapseDurMs}
                pulsing={pulsingItems.includes(id)}
                onTogglePulse={id ? () => onTogglePulse?.(id) : undefined}
=======
                mode={id && modeFor ? modeFor(id) : 'default'}
                accent={rowAccent}
                pulsing={rowPulsing}
                collapseDurMs={collapseDurMs}
>>>>>>> 3123b55bb2392bac94571c9ff3fca80901946793
              />
            );
          })}
        </S.List>
      )}

<<<<<<< HEAD
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
            pulsingItems={pulsingItems} // ✅ forwarded
            onTogglePulse={onTogglePulse} // ✅ forwarded
            collapseDurMs={collapseDurMs}
          />
        </S.Nest>
      ))}
=======
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
>>>>>>> 3123b55bb2392bac94571c9ff3fca80901946793
    </S.SectionGroup>
  );
}

export default function BoxTree({
  tree,
<<<<<<< HEAD
  openItemId,
  onOpenItem,
  accent,
  pulsingItems = [],
  onTogglePulse,
  collapseDurMs,
=======
  items,
  openItemId,
  onOpenItem,
  modeFor,
  accent,
  pulsing = false,
  collapseDurMs = 520,
  effectsById = {},
  onFlash, // if you bubble it into ItemDetails inside
>>>>>>> 3123b55bb2392bac94571c9ff3fca80901946793
}) {
  if (!tree) return null;

  return (
    <S.Container>
      <BoxSection
        node={tree}
        depth={0}
        openItemId={openItemId}
        onOpenItem={onOpenItem}
<<<<<<< HEAD
        accent={accent}
        pulsingItems={pulsingItems}
        onTogglePulse={onTogglePulse}
=======
        modeFor={modeFor}
        accent={accent}
        pulsing={pulsing}
>>>>>>> 3123b55bb2392bac94571c9ff3fca80901946793
        collapseDurMs={collapseDurMs}
      />
    </S.Container>
  );
}
