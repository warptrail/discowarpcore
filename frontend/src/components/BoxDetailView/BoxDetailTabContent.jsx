import React, { useEffect, useMemo, useState } from 'react';

import BoxTree from '../BoxTree';
import ItemsFlatList from '../ItemsFlatList';
import BoxActionPanel from '../BoxActionPanel';
import ItemBrowseControlPanel from '../ItemBrowseControlPanel';
import {
  compareItemsByMode,
  matchesItemQuery,
  normalizeItemQuery,
} from '../../util/itemBrowse';
import * as S from './BoxDetailTabContent.styles';

const FLAT_SORT_OPTIONS = [
  { value: 'treeOrder', label: 'Tree Order' },
  { value: 'recentlyAdded', label: 'Recently Added' },
  { value: 'oldestAdded', label: 'Oldest Added' },
  { value: 'recentlyUpdated', label: 'Recently Updated' },
  { value: 'nameAsc', label: 'Name A-Z' },
  { value: 'nameDesc', label: 'Name Z-A' },
  { value: 'valueDesc', label: 'Value High-Low' },
  { value: 'valueAsc', label: 'Value Low-High' },
];

export default function BoxDetailTabContent({
  activeTab,
  loading,
  error,
  tree,
  flatItems,
  openItemId,
  handleOpen,
  accent,
  pulsing,
  collapseDurMs,
  effectsById,
  triggerFlash,
  startPulse,
  stopPulse,
  handleFlash,
  handleItemSaved,
}) {
  const [flatSearchQuery, setFlatSearchQuery] = useState('');
  const [flatSortMode, setFlatSortMode] = useState('treeOrder');
  const flatRootKey = String(tree?._id ?? tree?.box_id ?? tree?.shortId ?? '');

  useEffect(() => {
    setFlatSearchQuery('');
    setFlatSortMode('treeOrder');
  }, [flatRootKey]);

  const normalizedFlatQuery = normalizeItemQuery(flatSearchQuery);
  const visibleFlatItems = useMemo(() => {
    const source = Array.isArray(flatItems) ? flatItems : [];
    const filtered = normalizedFlatQuery
      ? source.filter((item) =>
          matchesItemQuery(item, normalizedFlatQuery, {
            boxLabel: item?.parentBoxLabel,
            boxId: item?.parentBoxId,
            pathLabels: item?.parentBoxLabel ? [item.parentBoxLabel] : [],
          }),
        )
      : [...source];

    if (flatSortMode !== 'treeOrder') {
      filtered.sort((a, b) => compareItemsByMode(a, b, flatSortMode));
    }

    return filtered;
  }, [flatItems, normalizedFlatQuery, flatSortMode]);

  if (loading || error || !tree) return null;

  if (activeTab === 'tree') {
    return (
      <S.TreeTabScope>
        <BoxTree
          node={tree}
          openItemId={openItemId}
          onOpenItem={handleOpen}
          accent={accent}
          pulsing={pulsing}
          collapseDurMs={collapseDurMs}
          effectsById={effectsById}
          triggerFlash={triggerFlash}
          startPulse={startPulse}
          stopPulse={stopPulse}
          onItemSaved={handleItemSaved}
        />
      </S.TreeTabScope>
    );
  }

  if (activeTab === 'flat') {
    return (
      <S.FlatTabScope>
        <ItemBrowseControlPanel
          idPrefix="flat-item-browse"
          title="Flat Items"
          searchValue={flatSearchQuery}
          searchPlaceholder="Search items..."
          searchAriaLabel="Search flat-view items"
          onSearchChange={setFlatSearchQuery}
          sortValue={flatSortMode}
          sortOptions={FLAT_SORT_OPTIONS}
          sortAriaLabel="Sort flat-view items"
          onSortChange={setFlatSortMode}
          statusText={`${visibleFlatItems.length} ${
            visibleFlatItems.length === 1 ? 'item' : 'items'
          } shown`}
        />

        {visibleFlatItems.length === 0 && normalizedFlatQuery ? (
          <S.FlatEmpty>No items match the current search.</S.FlatEmpty>
        ) : null}

        <ItemsFlatList
          items={visibleFlatItems}
          openItemId={openItemId}
          onOpenItem={handleOpen}
          accent={accent}
          pulsing={pulsing}
          collapseDurMs={collapseDurMs}
          effectsById={effectsById}
          onFlash={handleFlash}
          showHeader={false}
        />
      </S.FlatTabScope>
    );
  }

  if (activeTab === 'edit') {
    return <BoxActionPanel box={tree} boxTree={tree} boxMongoId={tree._id} />;
  }

  return null;
}
