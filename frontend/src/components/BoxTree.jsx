// src/components/BoxTree.jsx
import React, { useEffect, useMemo, useState } from 'react';
import * as S from '../styles/BoxTree.styles';
import BoxDetailActionSection from './BoxDetailView/BoxDetailActionSection';
import CondensedBoxItemList from './CondensedBoxItemList';
import CondensedBatchMovePanel from './CondensedBatchMovePanel';
import CondensedBatchDispositionPanel from './CondensedBatchDispositionPanel';
import {
  compareItemsByMode,
  matchesItemQuery,
  normalizeItemQuery,
} from '../util/itemBrowse';

const DEFAULT_SORT = 'recentlyAdded';

function formatBoxChipId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '#???';
  if (/^\d+$/.test(raw)) return `#${raw.padStart(3, '0')}`;
  return `#${raw}`;
}

function AsciiTreeNode({ node, depth = 0, prefix = '', onOpenItem, openItemId }) {
  if (!node) return null;

  const items = Array.isArray(node.items) ? node.items : [];
  const children = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const entries = [
    ...items.map((item, index) => ({ kind: 'item', value: item, key: `item-${index}` })),
    ...children.map((child, index) => ({ kind: 'box', value: child, key: `box-${index}` })),
  ];

  return (
    <>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const branch = `${prefix}${isLast ? '└── ' : '├── '}`;

        if (entry.kind === 'item') {
          const item = entry.value;
          const itemId = String(item?._id ?? item?.id ?? '').trim();
          const itemName = String(item?.name || 'Unnamed item').trim();
          const quantity = Number(item?.quantity ?? 0);

          return (
            <S.AsciiLine key={entry.key} $depth={depth}>
              <S.AsciiItemButton
                type="button"
                $active={itemId && openItemId === itemId}
                onClick={() => onOpenItem?.(itemId)}
                disabled={!itemId}
                aria-label={`Open item ${itemName}`}
              >
                <S.AsciiPrefix aria-hidden="true">{branch}</S.AsciiPrefix>
                <S.AsciiLabel>{itemName}</S.AsciiLabel>
                {quantity > 0 ? <S.AsciiMeta>×{quantity}</S.AsciiMeta> : null}
              </S.AsciiItemButton>
            </S.AsciiLine>
          );
        }

        const child = entry.value;
        const childId = child?.box_id ?? child?.shortId ?? '';
        const childLabel = child?.label ?? child?.name ?? 'Box';
        const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`;

        return (
          <React.Fragment key={entry.key}>
            <S.AsciiLine $depth={depth}>
              <S.AsciiPrefix aria-hidden="true">{branch}</S.AsciiPrefix>
              <S.AsciiBoxLabel>
                {formatBoxChipId(childId)} {childLabel}
              </S.AsciiBoxLabel>
            </S.AsciiLine>
            <AsciiTreeNode
              node={child}
              depth={depth + 1}
              prefix={childPrefix}
              onOpenItem={onOpenItem}
              openItemId={openItemId}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

function AsciiTree({ node, onOpenItem, openItemId }) {
  const label = node?.label ?? node?.name ?? 'Box';
  const boxId = node?.box_id ?? node?.shortId ?? '';

  return (
    <S.AsciiTree role="tree" aria-label={`${label} box tree`}>
      <S.AsciiLine>
        <S.AsciiPrefix aria-hidden="true">. </S.AsciiPrefix>
        <S.AsciiBoxLabel>{formatBoxChipId(boxId)} {label}</S.AsciiBoxLabel>
      </S.AsciiLine>
      <S.AsciiBranch>
        <AsciiTreeNode node={node} onOpenItem={onOpenItem} openItemId={openItemId} />
      </S.AsciiBranch>
    </S.AsciiTree>
  );
}

export default function BoxTree({
  node,
  openItemId,
  onOpenItem,
  refreshBox,
  searchQuery: controlledSearchQuery,
  sortMode: controlledSortMode,
  viewMode = 'full',
  scopeLabel = 'Tree',
  onManageBox,
}) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localSortMode, setLocalSortMode] = useState(DEFAULT_SORT);
  const searchQuery = controlledSearchQuery ?? localSearchQuery;
  const sortMode = controlledSortMode ?? localSortMode;
  const [condensedSelectionEnabled, setCondensedSelectionEnabled] = useState(false);
  const [selectedCondensedItemIds, setSelectedCondensedItemIds] = useState(() => new Set());
  const [condensedMovePickerOpen, setCondensedMovePickerOpen] = useState(false);
  const [condensedDispositionOpen, setCondensedDispositionOpen] = useState(false);
  const rootKey = String(node?._id ?? node?.box_id ?? node?.shortId ?? '');

  useEffect(() => {
    setLocalSearchQuery('');
    setLocalSortMode(DEFAULT_SORT);
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
      <BoxDetailActionSection
        title={scopeLabel}
        count={visibleItemCount}
        box={node}
        onItemsChanged={refreshBox}
        onManageBox={onManageBox}
      >
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
          <AsciiTree
            node={displayTree}
            openItemId={openItemId}
            onOpenItem={onOpenItem}
          />
        )}
      </BoxDetailActionSection>
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
