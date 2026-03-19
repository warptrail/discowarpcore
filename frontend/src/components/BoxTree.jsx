// src/components/BoxTree.jsx
import React, { useEffect, useMemo, useState } from 'react';
import * as S from '../styles/BoxTree.styles';
import ItemRow from './ItemRow';
import ItemBrowseControlPanel from './ItemBrowseControlPanel';
import {
  compareItemsByMode,
  matchesItemQuery,
  normalizeItemQuery,
} from '../util/itemBrowse';

const SORT_OPTIONS = [
  { value: 'recentlyAdded', label: 'Recently Added' },
  { value: 'oldestAdded', label: 'Oldest Added' },
  { value: 'recentlyUpdated', label: 'Recently Updated' },
  { value: 'recentlyAcquired', label: 'Recently Acquired' },
  { value: 'oldestAcquired', label: 'Oldest Acquired' },
  { value: 'recentlyUsed', label: 'Recently Used' },
  { value: 'leastRecentlyUsed', label: 'Least Recently Used' },
  { value: 'nameAsc', label: 'Name A-Z' },
  { value: 'nameDesc', label: 'Name Z-A' },
  { value: 'categoryAsc', label: 'Category A-Z' },
  { value: 'categoryDesc', label: 'Category Z-A' },
  { value: 'ownerAsc', label: 'Owner A-Z' },
  { value: 'ownerDesc', label: 'Owner Z-A' },
  { value: 'valueDesc', label: 'Value High-Low' },
  { value: 'valueAsc', label: 'Value Low-High' },
];

const DEFAULT_SORT = 'recentlyAdded';

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
  const isRootSection = depth === 0;

  return (
    <S.SectionGroup $isRoot={isRootSection} $depth={depth}>
      <S.RailBack aria-hidden="true" $isRoot={isRootSection} $depth={depth} />

      <S.RailFront $isRoot={isRootSection} $depth={depth}>
        <S.SectionTitle $isRoot={isRootSection} $depth={depth}>
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
              const flashColor = effectsById?.[id]?.flash || 'blue';
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
                  onSaved={(updated) => onItemSaved?.(updated)}
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
                `child-${depth}-${i}`,
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
              pulsing={pulsing}
              collapseDurMs={collapseDurMs}
              effectsById={effectsById}
              triggerFlash={triggerFlash}
              onItemSaved={onItemSaved}
            />
          </S.Nest>
        ))}
      </S.RailFront>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState(DEFAULT_SORT);
  const rootKey = String(node?._id ?? node?.box_id ?? node?.shortId ?? '');

  useEffect(() => {
    setSearchQuery('');
    setSortMode(DEFAULT_SORT);
  }, [rootKey]);

  const normalizedQuery = normalizeItemQuery(searchQuery);
  const displayTree = useMemo(
    () =>
      mapTreeForDisplay(node, {
        query: normalizedQuery,
        sortMode,
        pathLabels: [],
        isRoot: true,
      }),
    [node, normalizedQuery, sortMode],
  );
  const visibleItemCount = useMemo(() => countItemsInTree(displayTree), [displayTree]);

  if (!node) return null;

  return (
    <S.TreeRoot>
      <ItemBrowseControlPanel
        idPrefix="box-tree-item-browse"
        searchValue={searchQuery}
        searchPlaceholder="Search items in this box tree..."
        searchAriaLabel="Search items in this box tree"
        onSearchChange={setSearchQuery}
        sortValue={sortMode}
        sortOptions={SORT_OPTIONS}
        sortAriaLabel="Sort items in this box tree"
        onSortChange={setSortMode}
        statusText={`${visibleItemCount} ${visibleItemCount === 1 ? 'item' : 'items'} shown`}
      />

      {displayTree && visibleItemCount === 0 && normalizedQuery ? (
        <S.MetaRow>
          <S.Count>No items match the current search.</S.Count>
        </S.MetaRow>
      ) : null}

      <BoxSection
        node={displayTree}
        depth={0}
        openItemId={openItemId}
        onOpenItem={onOpenItem}
        accent={accent}
        pulsing={pulsing}
        effectsById={effectsById}
        collapseDurMs={collapseDurMs}
        triggerFlash={triggerFlash}
        onItemSaved={onItemSaved}
      />
    </S.TreeRoot>
  );
}

function mapTreeForDisplay(node, { query, sortMode, pathLabels = [], isRoot = false }) {
  if (!node || typeof node !== 'object') return null;

  const boxLabel = String(node.label ?? node.name ?? '').trim();
  const boxId = String(node.box_id ?? node.shortId ?? '').trim();
  const nextPathLabels = boxLabel ? [...pathLabels, boxLabel] : pathLabels;

  const sortedItems = (Array.isArray(node.items) ? node.items : [])
    .filter((item) =>
      matchesItemQuery(item, query, {
        boxLabel,
        boxId,
        pathLabels: nextPathLabels,
      }),
    )
    .sort((a, b) => compareItemsByMode(a, b, sortMode));

  const sortedChildren = (Array.isArray(node.childBoxes) ? node.childBoxes : [])
    .map((child) =>
      mapTreeForDisplay(child, {
        query,
        sortMode,
        pathLabels: nextPathLabels,
        isRoot: false,
      }),
    )
    .filter(Boolean);

  if (!isRoot && query && sortedItems.length === 0 && sortedChildren.length === 0) {
    return null;
  }

  return {
    ...node,
    items: sortedItems,
    childBoxes: sortedChildren,
  };
}

function countItemsInTree(node) {
  if (!node || typeof node !== 'object') return 0;
  const localCount = Array.isArray(node.items) ? node.items.length : 0;
  const childCount = (Array.isArray(node.childBoxes) ? node.childBoxes : []).reduce(
    (sum, child) => sum + countItemsInTree(child),
    0,
  );
  return localCount + childCount;
}
