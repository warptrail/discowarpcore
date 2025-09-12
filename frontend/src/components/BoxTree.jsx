// src/components/BoxTree.jsx
import React from 'react';
import * as S from '../styles/BoxTree.styles';
import ItemRow from './ItemRow';

/* ---- safe getters for slightly wobbly API shapes ---- */
function itemsOf(node) {
  // try multiple keys; always return an array
  const a = node?.items ?? node?.box_items ?? node?.contents ?? [];
  return Array.isArray(a) ? a : [];
}

function kidsOf(node) {
  const a = node?.childBoxes ?? node?.children ?? node?.boxes ?? [];
  return Array.isArray(a) ? a : [];
}

/* ---- one titled section per box (root included) ---- */
function BoxSection({ node, depth, openItemId, onOpenItem }) {
  if (!node) return null;

  const parentBoxLabel = node.label ?? node.name ?? 'Box';
  const parentBoxId = node.box_id ?? node.shortId ?? '';

  const items = itemsOf(node);
  const kids = kidsOf(node);

  return (
    <S.SectionGroup>
      {/* header for this box at every depth */}
      <S.SectionTitle>
        {parentBoxLabel} <S.ShortId>({parentBoxId || '?'})</S.ShortId>
      </S.SectionTitle>

      {/* items in this box */}
      {items.length > 0 && (
        <S.List>
          {items.map((it, idx) => {
            const id = String(it?._id ?? it?.id ?? '');
            // If somehow there is no id, still render (no toggle) so we can see the data
            const key = id || `noid-${depth}-${idx}`;
            const annotated = { ...it, parentBoxLabel, parentBoxId };
            return (
              <ItemRow
                key={key}
                item={annotated}
                isOpen={id ? openItemId === id : false}
                onOpen={id ? () => onOpenItem?.(id) : undefined}
              />
            );
          })}
        </S.List>
      )}

      {/* recurse into children, with LCARS bracket rails via S.Nest */}
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
          />
        </S.Nest>
      ))}
    </S.SectionGroup>
  );
}

export default function BoxTree({ tree, openItemId, onOpenItem }) {
  // ---- sanity logs: comment these after confirming once ----
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[BoxTree] has tree?', !!tree, tree && Object.keys(tree));
    if (tree) {
      // eslint-disable-next-line no-console
      console.log(
        '[BoxTree] root items/kids:',
        itemsOf(tree).length,
        kidsOf(tree).length
      );
    }
  }

  if (!tree) return null;

  return (
    <S.Container>
      {/* Only the grouped/nested listing lives here now */}
      <BoxSection
        node={tree}
        depth={0}
        openItemId={openItemId}
        onOpenItem={onOpenItem}
      />
    </S.Container>
  );
}
