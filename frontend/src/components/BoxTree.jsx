// src/components/BoxTree.jsx
import React, { useEffect, useMemo, useState } from 'react';
import * as S from '../styles/BoxTree.styles';
import ItemRow from './ItemRow';
import ItemBrowseControlPanel from './ItemBrowseControlPanel';
import CondensedBoxItemList from './CondensedBoxItemList';
import CondensedBatchMovePanel from './CondensedBatchMovePanel';
import CondensedBatchDispositionPanel from './CondensedBatchDispositionPanel';
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

function formatBoxChipId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '#???';
  if (/^\d+$/.test(raw)) return `#${raw.padStart(3, '0')}`;
  return `#${raw}`;
}

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
  refreshBox,
}) {
  if (!node) return null;

  const parentBoxLabel = node.label ?? node.name ?? 'Box';
  const parentBoxId = node.box_id ?? node.shortId ?? '';
  const parentBoxMongoId = node._id ?? node.id ?? '';
  const items = Array.isArray(node.items) ? node.items : [];
  const kids = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const isRootSection = depth === 0;

  return (
    <S.SectionGroup $isRoot={isRootSection} $depth={depth}>
      <S.RailBack aria-hidden="true" $isRoot={isRootSection} $depth={depth} />

      <S.RailFront $isRoot={isRootSection} $depth={depth}>
        <S.TreeSectionTitle $isRoot={isRootSection} $depth={depth}>
          <S.TreeBoxIdChip>{formatBoxChipId(parentBoxId)}</S.TreeBoxIdChip>
          <S.TreeBoxLabel>{parentBoxLabel}</S.TreeBoxLabel>
        </S.TreeSectionTitle>

        {items.length > 0 && (
          <S.List>
            {items.map((it, idx) => {
              const id = String(it?._id ?? it?.id ?? '');
              const key = id || `noid-${depth}-${idx}`;
              const annotated = {
                ...it,
                parentBoxLabel,
                parentBoxId,
                parentBoxMongoId,
              };
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
                  refreshBox={refreshBox}
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
              refreshBox={refreshBox}
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
  refreshBox,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState(DEFAULT_SORT);
  const [viewMode, setViewMode] = useState('full');
  const [condensedSelectionEnabled, setCondensedSelectionEnabled] = useState(false);
  const [selectedCondensedItemIds, setSelectedCondensedItemIds] = useState(() => new Set());
  const [condensedMovePickerOpen, setCondensedMovePickerOpen] = useState(false);
  const [condensedDispositionOpen, setCondensedDispositionOpen] = useState(false);
  const rootKey = String(node?._id ?? node?.box_id ?? node?.shortId ?? '');

  useEffect(() => {
    setSearchQuery('');
    setSortMode(DEFAULT_SORT);
    setCondensedSelectionEnabled(false);
    setSelectedCondensedItemIds(new Set());
    setCondensedMovePickerOpen(false);
    setCondensedDispositionOpen(false);
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
  const condensedItems = useMemo(() => flattenItemsInTree(displayTree), [displayTree]);
  const visibleCondensedItemIds = useMemo(
    () =>
      condensedItems
        .map((item) => String(item?._id ?? item?.id ?? '').trim())
        .filter(Boolean),
    [condensedItems],
  );
  const selectedCondensedItems = useMemo(() => {
    if (!selectedCondensedItemIds.size) return [];
    return condensedItems.filter((item) => {
      const id = String(item?._id ?? item?.id ?? '').trim();
      return id && selectedCondensedItemIds.has(id);
    });
  }, [condensedItems, selectedCondensedItemIds]);

  useEffect(() => {
    if (viewMode !== 'condensed') {
      setCondensedSelectionEnabled(false);
      setSelectedCondensedItemIds(new Set());
      setCondensedMovePickerOpen(false);
      setCondensedDispositionOpen(false);
    }
  }, [viewMode]);

  useEffect(() => {
    setSelectedCondensedItemIds((current) => {
      if (!current.size) return current;
      const visibleIds = new Set(visibleCondensedItemIds);
      const next = new Set([...current].filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [visibleCondensedItemIds]);

  useEffect(() => {
    if (!selectedCondensedItems.length) {
      setCondensedMovePickerOpen(false);
      setCondensedDispositionOpen(false);
    }
  }, [selectedCondensedItems.length]);

  const handleCondensedItemSelectionChange = (itemId, isSelected) => {
    setSelectedCondensedItemIds((current) => {
      const next = new Set(current);
      if (isSelected) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const handleSelectAllCondensedItems = () => {
    setSelectedCondensedItemIds(new Set(visibleCondensedItemIds));
  };

  const handleClearCondensedSelection = () => {
    setSelectedCondensedItemIds(new Set());
    setCondensedMovePickerOpen(false);
    setCondensedDispositionOpen(false);
  };

  const handleCondensedBatchMoved = async () => {
    handleClearCondensedSelection();
    await refreshBox?.();
  };

  const handleCondensedBatchDisposed = async () => {
    handleClearCondensedSelection();
    await refreshBox?.();
  };

  const handleCondensedSelectionEnabledChange = (isEnabled) => {
    setCondensedSelectionEnabled(isEnabled);
    if (!isEnabled) {
      handleClearCondensedSelection();
    }
  };

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

      <S.ViewModeBar>
        <S.ViewModeLabel htmlFor="box-tree-condensed-view">
          <S.ViewModeLabelText>Full view</S.ViewModeLabelText>
          <S.ViewModeSwitch>
            <S.ViewModeCheckbox
              id="box-tree-condensed-view"
              type="checkbox"
              checked={viewMode === 'condensed'}
              onChange={(event) =>
                setViewMode(event.target.checked ? 'condensed' : 'full')
              }
            />
            <S.ViewModeSlider aria-hidden="true" />
          </S.ViewModeSwitch>
          <S.ViewModeLabelText>Condensed</S.ViewModeLabelText>
        </S.ViewModeLabel>
      </S.ViewModeBar>

      {viewMode === 'condensed' ? (
        <S.CondensedControlsPanel>
          <S.ViewModeLabel htmlFor="box-tree-condensed-selection">
            <S.ViewModeLabelText>Select items</S.ViewModeLabelText>
            <S.ViewModeSwitch>
              <S.ViewModeCheckbox
                id="box-tree-condensed-selection"
                type="checkbox"
                checked={condensedSelectionEnabled}
                onChange={(event) =>
                  handleCondensedSelectionEnabledChange(event.target.checked)
                }
              />
              <S.ViewModeSlider aria-hidden="true" />
            </S.ViewModeSwitch>
          </S.ViewModeLabel>

          <S.SelectionCount>
            {selectedCondensedItems.length} selected
          </S.SelectionCount>

          <S.SelectionActions>
            <S.SelectionButton
              type="button"
              onClick={handleSelectAllCondensedItems}
              disabled={!condensedSelectionEnabled || !visibleCondensedItemIds.length}
            >
              Select shown
            </S.SelectionButton>
            <S.SelectionButton
              type="button"
              $tone="move"
              onClick={() => {
                setCondensedMovePickerOpen((current) => !current);
                setCondensedDispositionOpen(false);
              }}
              disabled={!condensedSelectionEnabled || !selectedCondensedItems.length}
            >
              {condensedMovePickerOpen ? 'Hide destinations' : 'Move selected'}
            </S.SelectionButton>
            <S.SelectionButton
              type="button"
              $tone="dispose"
              onClick={() => {
                setCondensedDispositionOpen((current) => !current);
                setCondensedMovePickerOpen(false);
              }}
              disabled={!condensedSelectionEnabled || !selectedCondensedItems.length}
            >
              {condensedDispositionOpen ? 'Hide dispose' : 'Dispose selected'}
            </S.SelectionButton>
            <S.SelectionButton
              type="button"
              onClick={handleClearCondensedSelection}
              disabled={!selectedCondensedItemIds.size}
            >
              Clear
            </S.SelectionButton>
          </S.SelectionActions>
        </S.CondensedControlsPanel>
      ) : null}

      {viewMode !== 'condensed' && displayTree && visibleItemCount === 0 && normalizedQuery ? (
        <S.MetaRow>
          <S.Count>No items match the current search.</S.Count>
        </S.MetaRow>
      ) : null}

      {viewMode === 'condensed' ? (
        <>
          <CondensedBatchMovePanel
            selectedItems={selectedCondensedItems}
            isOpen={condensedMovePickerOpen}
            onOpenChange={setCondensedMovePickerOpen}
            onMoved={handleCondensedBatchMoved}
          />

          <CondensedBatchDispositionPanel
            selectedItems={selectedCondensedItems}
            isOpen={condensedDispositionOpen}
            onOpenChange={setCondensedDispositionOpen}
            onDisposed={handleCondensedBatchDisposed}
          />

          <CondensedBoxItemList
            items={condensedItems}
            emptyMessage={
              normalizedQuery
                ? 'No items match the current search.'
                : 'This box has no items.'
            }
            selectionEnabled={condensedSelectionEnabled}
            selectedItemIds={selectedCondensedItemIds}
            onSelectionChange={handleCondensedItemSelectionChange}
          />
        </>
      ) : (
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
          refreshBox={refreshBox}
        />
      )}
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

function flattenItemsInTree(node) {
  if (!node || typeof node !== 'object') return [];

  const parentBoxLabel = node.label ?? node.name ?? 'Box';
  const parentBoxId = node.box_id ?? node.shortId ?? '';
  const parentBoxMongoId = node._id ?? node.id ?? '';
  const localItems = (Array.isArray(node.items) ? node.items : []).map((item) => ({
    ...item,
    parentBoxLabel,
    parentBoxId,
    parentBoxMongoId,
  }));
  const childItems = (Array.isArray(node.childBoxes) ? node.childBoxes : []).flatMap(
    (child) => flattenItemsInTree(child),
  );

  return [...localItems, ...childItems];
}
