// src/views/BoxList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styledComponents as S } from '../styles/BoxList.styles';
import InventoryGridHeader from './InventoryGridHeader';
import BoxLocatorInspectorPanel from './BoxLocatorInspectorPanel';
import { normalizeItemCategory } from '../util/itemCategories';
import { fetchBoxTreeByShortId } from '../api/boxes';
import {
  compareNumericBoxIds,
  matchesBoxIdPrefix,
  normalizeBoxId,
} from '../util/boxLocator';

const ORPHANED_CONTAINER_ID = '__system-orphaned-items__';
const ORPHANED_CONTAINER_ROUTE = '/all-items?filter=orphaned';
const ITEM_CHIP_LIMIT = 25;
const ITEM_CHIP_OVERFLOW_LABEL = 'more items';

/**
 * boxes: [{
 *   _id, box_id, label, location, description, notes,
 *   tags: string[], items: [{ _id, name, quantity }],
 *   childBoxes: same[]
 * }]
 */
export default function BoxList({
  boxes = [],
  groups = [],
  orphanedCount = 0,
  orphanedItems = [],
  locations = [],
  pagination = {},
  onPageChange,
  onInventoryQueryChange,
}) {
  const [quickCreatedBoxes, setQuickCreatedBoxes] = useState([]);
  const [quickOrphanedDelta, setQuickOrphanedDelta] = useState(0);
  const [showOrphanedVirtual, setShowOrphanedVirtual] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [boxLocatorQuery, setBoxLocatorQuery] = useState('');
  const [boxLocatorSelection, setBoxLocatorSelection] = useState(null);
  const [boxLocatorDetails, setBoxLocatorDetails] = useState(null);
  const [boxLocatorLoading, setBoxLocatorLoading] = useState(false);
  const [boxLocatorError, setBoxLocatorError] = useState('');
  const [sortBy, setSortBy] = useState('boxId');
  const [filterBy, setFilterBy] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const currentPage = Math.max(1, Number(pagination?.page) || 1);
  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1);
  const totalCount = Number.isFinite(Number(pagination?.total))
    ? Number(pagination.total)
    : 0;

  const mergedBoxes = useMemo(
    () => mergeQuickCreatedBoxes(boxes, quickCreatedBoxes),
    [boxes, quickCreatedBoxes],
  );
  const ownerOptions = useMemo(() => collectOwnerOptions(mergedBoxes), [mergedBoxes]);
  const groupOptions = useMemo(
    () => collectGroupOptions(mergedBoxes, groups),
    [mergedBoxes, groups],
  );
  const effectiveOrphanedCount = Number(orphanedCount || 0) + quickOrphanedDelta;

  const telemetry = useMemo(
    () => summarizeTree(mergedBoxes, effectiveOrphanedCount),
    [mergedBoxes, effectiveOrphanedCount],
  );

  const orphanedContainer = useMemo(
    () =>
      buildOrphanedContainerNode({
        orphanedItems,
        orphanedCount: effectiveOrphanedCount,
      }),
    [orphanedItems, effectiveOrphanedCount],
  );

  const boxLocatorIndex = useMemo(
    () => buildBoxLocatorIndex(mergedBoxes),
    [mergedBoxes],
  );

  const boxLocatorMatches = useMemo(
    () => findBoxLocatorMatches(boxLocatorIndex, boxLocatorQuery),
    [boxLocatorIndex, boxLocatorQuery],
  );

  const visibleBoxes = useMemo(
    () =>
      applyTreeControls(mergedBoxes, {
        searchQuery,
        sortBy,
        filterBy,
        categoryFilter,
        locationFilter,
        groupFilter,
        ownerFilter,
      }),
    [
      mergedBoxes,
      searchQuery,
      sortBy,
      filterBy,
      categoryFilter,
      locationFilter,
      groupFilter,
      ownerFilter,
    ],
  );

  const orphanedMatchesControls = useMemo(
    () =>
      matchesNodeControls(orphanedContainer, {
        query: normalize(searchQuery),
        filterBy,
        categoryFilter,
        locationFilter,
        groupFilter,
        ownerFilter,
      }),
    [
      orphanedContainer,
      searchQuery,
      filterBy,
      categoryFilter,
      locationFilter,
      groupFilter,
      ownerFilter,
    ],
  );

  useEffect(() => {
    if (groupFilter === 'all') return;

    const hasActiveGroup = groupOptions.some(
      (option) => normalize(option?.value) === normalize(groupFilter),
    );
    if (!hasActiveGroup) {
      setGroupFilter('all');
    }
  }, [groupFilter, groupOptions]);

  useEffect(() => {
    onInventoryQueryChange?.({
      q: searchQuery,
      group: groupFilter,
      sortBy,
    });
  }, [searchQuery, groupFilter, sortBy, onInventoryQueryChange]);

  const showOrphanedContainer = showOrphanedVirtual && orphanedMatchesControls;
  const hasAnyData = totalCount > 0 || effectiveOrphanedCount > 0;
  const noData = !hasAnyData;
  const hasNoMatches =
    hasAnyData &&
    visibleBoxes.length === 0 &&
    !showOrphanedContainer &&
    !orphanedMatchesControls;

  const handleQuickBoxCreated = (createdBox) => {
    const nextId = String(createdBox?._id || '').trim();
    if (!nextId) return;

    setQuickCreatedBoxes((prev) => {
      const byId = new Map();

      for (const entry of prev) {
        const key = String(entry?._id || '').trim();
        if (key) byId.set(key, entry);
      }

      byId.set(nextId, {
        ...createdBox,
        items: Array.isArray(createdBox?.items) ? createdBox.items : [],
        childBoxes: Array.isArray(createdBox?.childBoxes)
          ? createdBox.childBoxes
          : [],
      });

      return [...byId.values()];
    });
  };

  const handleQuickOrphanCreated = () => {
    setQuickOrphanedDelta((prev) => prev + 1);
  };

  const handleBoxLocatorSelect = (entry) => {
    const nextBoxId = normalizeBoxId(entry?.boxId);
    if (!nextBoxId) return;

    setBoxLocatorQuery(String(entry?.boxId || ''));
    setBoxLocatorSelection({
      boxId: nextBoxId,
      label: String(entry?.label || '').trim(),
    });
    setBoxLocatorLoading(true);
    setBoxLocatorDetails(null);
    setBoxLocatorError('');
  };

  useEffect(() => {
    const selectedId = normalizeBoxId(boxLocatorSelection?.boxId);
    if (!selectedId) return;

    const stillExists = boxLocatorIndex.some((entry) => {
      return normalizeBoxId(entry?.boxId) === selectedId;
    });

    if (!stillExists) {
      setBoxLocatorSelection(null);
      setBoxLocatorDetails(null);
      setBoxLocatorError('');
    }
  }, [boxLocatorIndex, boxLocatorSelection]);

  useEffect(() => {
    const selectedId = normalizeBoxId(boxLocatorSelection?.boxId);
    if (!selectedId || !boxLocatorQuery) return;

    const queryId = normalizeBoxId(boxLocatorQuery);
    if (queryId && selectedId === queryId) return;

    setBoxLocatorSelection(null);
    setBoxLocatorDetails(null);
    setBoxLocatorError('');
  }, [boxLocatorQuery, boxLocatorSelection]);

  useEffect(() => {
    const selectedId = normalizeBoxId(boxLocatorSelection?.boxId);
    if (!selectedId) {
      setBoxLocatorLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadInspector = async () => {
      try {
        setBoxLocatorLoading(true);
        setBoxLocatorError('');
        const detail = await fetchBoxTreeByShortId(selectedId, {
          signal: controller.signal,
        });
        if (!active) return;
        setBoxLocatorDetails(detail || null);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!active) return;
        setBoxLocatorDetails(null);
        setBoxLocatorError(error?.message || 'Failed to load box contents.');
      } finally {
        if (active) {
          setBoxLocatorLoading(false);
        }
      }
    };

    loadInspector();

    return () => {
      active = false;
      controller.abort();
    };
  }, [boxLocatorSelection]);

  useEffect(() => {
    onPageChange?.(1);
  }, [
    searchQuery,
    sortBy,
    filterBy,
    categoryFilter,
    locationFilter,
    groupFilter,
    ownerFilter,
    onPageChange,
  ]);

  const handleClearBoxLocatorResult = () => {
    setBoxLocatorSelection(null);
    setBoxLocatorDetails(null);
    setBoxLocatorError('');
  };

  return (
    <S.Container>
      <InventoryGridHeader
        totalBoxes={telemetry.totalBoxes}
        totalItems={telemetry.totalItems}
        orphanedCount={telemetry.orphanedCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        boxLocatorQuery={boxLocatorQuery}
        onBoxLocatorQueryChange={setBoxLocatorQuery}
        boxLocatorMatches={boxLocatorMatches}
        onBoxLocatorSelect={handleBoxLocatorSelect}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterBy={filterBy}
        onFilterChange={setFilterBy}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        groups={groupOptions}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        owners={ownerOptions}
        showOrphanedVirtual={showOrphanedVirtual}
        onToggleOrphanedVirtual={() =>
          setShowOrphanedVirtual((prev) => !prev)
        }
        onQuickBoxCreated={handleQuickBoxCreated}
        onQuickOrphanCreated={handleQuickOrphanCreated}
        locations={locations}
      />

      <BoxLocatorInspectorPanel
        selection={boxLocatorSelection}
        details={boxLocatorDetails}
        loading={boxLocatorLoading}
        error={boxLocatorError}
        onClearSelection={handleClearBoxLocatorResult}
      />

      {noData ? (
        <S.EmptyMessage>No boxes yet.</S.EmptyMessage>
      ) : hasNoMatches ? (
        <S.EmptyMessage>No boxes match the current search/filter.</S.EmptyMessage>
      ) : (
        <>
          {orphanedMatchesControls ? (
            <S.OrphanedRevealShell $open={showOrphanedContainer}>
              <Branch key={orphanedContainer._id} node={orphanedContainer} depth={0} />
            </S.OrphanedRevealShell>
          ) : null}
          {visibleBoxes.map((node) => (
            <Branch key={node._id || node.box_id} node={node} depth={0} />
          ))}
        </>
      )}

      {totalCount > 0 ? (
        <S.PaginationBar>
          <S.PaginationButton
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </S.PaginationButton>

          <S.PaginationInfo>
            Page {currentPage} of {totalPages}
            {Number.isFinite(totalCount) ? ` // ${totalCount} total boxes` : ''}
          </S.PaginationInfo>

          <S.PaginationButton
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </S.PaginationButton>
        </S.PaginationBar>
      ) : null}
    </S.Container>
  );
}

function Branch({ node, depth = 0 }) {
  const navigate = useNavigate();
  const childBoxes = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const tags = getRenderableBoxTags(node);
  const items = Array.isArray(node.items) ? node.items : [];
  const group = String(node?.group || '').trim();
  const isSystemContainer = !!node?.isSystemContainer;
  const isOrphanedContainer = node?.systemType === 'orphaned';
  const isRoot = depth === 0;

  const itemQtyTotal = getNodeItemCount(node);
  const itemChips = buildItemPreviewChips(items, {
    limit: ITEM_CHIP_LIMIT,
    totalCount: node?.itemCountOverride,
  });

  const go = () => {
    if (isOrphanedContainer) {
      navigate(ORPHANED_CONTAINER_ROUTE);
      return;
    }
    navigate(`/boxes/${node.box_id}`);
  };

  return (
    <S.NodeSection $isRoot={isRoot} $depth={depth}>
      <S.RailBack aria-hidden="true" $isRoot={isRoot} $depth={depth} />
      <S.RailFront $isRoot={isRoot} $depth={depth}>
        <S.BoxCard
          onClick={go}
          $isRoot={isRoot}
          $depth={depth}
          $isSystem={isSystemContainer}
        >
          <S.BoxHeader>
            <S.ShortId $isRoot={isRoot} $depth={depth} $isSystem={isSystemContainer}>
              {isSystemContainer ? 'SYS' : `#${node.box_id}`}
            </S.ShortId>
            <S.BoxTitle $isRoot={isRoot} $depth={depth} $isSystem={isSystemContainer}>
              {node.label || node.name || 'Untitled'}
            </S.BoxTitle>
          </S.BoxHeader>

          {group && (
            <S.FieldGroup>
              <S.FieldLabel>Group</S.FieldLabel>
              <S.FieldValue>{group}</S.FieldValue>
            </S.FieldGroup>
          )}

          {node.location && (
            <S.FieldGroup>
              <S.FieldLabel>Location</S.FieldLabel>
              <S.FieldValue>{node.location}</S.FieldValue>
            </S.FieldGroup>
          )}

          {node.description && (
            <S.FieldGroup>
              <S.FieldLabel>Description</S.FieldLabel>
              <S.FieldValue>{node.description}</S.FieldValue>
            </S.FieldGroup>
          )}

          {isSystemContainer ? (
            <S.FieldGroup>
              <S.FieldLabel>Container Type</S.FieldLabel>
              <S.FieldValue>Virtual system container</S.FieldValue>
            </S.FieldGroup>
          ) : null}

          {node.notes && (
            <S.FieldGroup>
              <S.FieldLabel>Notes</S.FieldLabel>
              <S.FieldValue>{node.notes}</S.FieldValue>
            </S.FieldGroup>
          )}

          {tags.length > 0 && (
            <>
              <S.FieldGroup>
                <S.FieldLabel>Tags</S.FieldLabel>
                <S.FieldValue />
              </S.FieldGroup>
              <S.TagRow>
                {tags.map((t, i) => (
                  <S.TagBubble
                    $isRoot={isRoot}
                    $depth={depth}
                    key={`${node._id || node.box_id}-tag-${i}`}
                  >
                    {t}
                  </S.TagBubble>
                ))}
              </S.TagRow>
            </>
          )}

          <S.BoxFooter>
            <S.StatPill $variant="boxes" $isRoot={isRoot} $depth={depth}>
              {isOrphanedContainer
                ? 'virtual'
                : `${childBoxes.length} ${childBoxes.length === 1 ? 'box' : 'boxes'}`}
            </S.StatPill>
            <S.StatPill $variant="items" $isRoot={isRoot} $depth={depth}>
              {itemQtyTotal} {itemQtyTotal === 1 ? 'item' : 'items'}
            </S.StatPill>
            {isOrphanedContainer ? (
              <S.StatPill $isRoot={isRoot} $depth={depth}>
                unassigned
              </S.StatPill>
            ) : null}
          </S.BoxFooter>

          {itemChips.length > 0 && (
            <>
              <S.FieldGroup>
                <S.FieldLabel>Items</S.FieldLabel>
                <S.FieldValue />
              </S.FieldGroup>
              <S.TagRow>
                {itemChips.map((name, i) => (
                  <S.TagBubble
                    $tiny
                    $isRoot={isRoot}
                    $depth={depth}
                    $isSystem={isSystemContainer}
                    key={`${node._id || node.box_id}-chip-${i}`}
                  >
                    {name}
                  </S.TagBubble>
                ))}
              </S.TagRow>
            </>
          )}
        </S.BoxCard>

        {childBoxes.length > 0 && (
          <S.NodeChildren $depth={depth + 1}>
            {childBoxes.map((child) => (
              <Branch key={child._id || child.box_id} node={child} depth={depth + 1} />
            ))}
          </S.NodeChildren>
        )}
      </S.RailFront>
    </S.NodeSection>
  );
}

function summarizeTree(nodes, orphanedCount = 0) {
  const safeOrphaned = Number.isFinite(Number(orphanedCount))
    ? Number(orphanedCount)
    : 0;

  const summary = {
    totalBoxes: 0,
    totalItems: 0,
    orphanedCount: safeOrphaned,
  };

  const walk = (list) => {
    for (const node of list || []) {
      summary.totalBoxes += 1;
      summary.totalItems += sumItemQty(node.items);
      walk(node.childBoxes || []);
    }
  };

  walk(nodes);
  return summary;
}

function applyTreeControls(
  nodes,
  {
    searchQuery = '',
    sortBy = 'boxId',
    filterBy = 'all',
    categoryFilter = 'all',
    locationFilter = 'all',
    groupFilter = 'all',
    ownerFilter = 'all',
  },
) {
  const query = normalize(searchQuery);

  const processNode = (node) => {
    if (!node || typeof node !== 'object') return null;

    const children = (node.childBoxes || [])
      .map(processNode)
      .filter(Boolean);

    const include =
      matchesNodeControls(node, {
        query,
        filterBy,
        categoryFilter,
        locationFilter,
        groupFilter,
        ownerFilter,
      }) || children.length > 0;
    if (!include) return null;

    return {
      ...node,
      childBoxes: sortNodes(children, sortBy),
    };
  };

  const mapped = (nodes || []).map(processNode).filter(Boolean);
  return sortNodes(mapped, sortBy);
}

function matchesNodeControls(
  node,
  {
    query = '',
    filterBy = 'all',
    categoryFilter = 'all',
    locationFilter = 'all',
    groupFilter = 'all',
    ownerFilter = 'all',
  } = {},
) {
  const matchesSearch = !query || matchesQuery(node, query);
  const qty = getNodeItemCount(node);
  const normalizedCategoryFilter =
    categoryFilter === 'all'
      ? 'all'
      : normalizeItemCategory(categoryFilter);
  const matchesFilter =
    filterBy === 'all' ||
    (filterBy === 'withItems' && qty > 0) ||
    (filterBy === 'empty' && qty === 0) ||
    (filterBy === 'inGroups' && normalize(node?.group) !== '');
  const matchesCategory =
    normalizedCategoryFilter === 'all' ||
    hasItemWithCategory(node?.items, normalizedCategoryFilter);
  const nodeLocationId = String(getLocationId(node) || '');
  const matchesLocation =
    locationFilter === 'all' ||
    (nodeLocationId && nodeLocationId === String(locationFilter));
  const normalizedGroupFilter = normalize(groupFilter);
  const matchesGroup =
    normalizedGroupFilter === 'all' ||
    normalize(node?.group) === normalizedGroupFilter;
  const normalizedOwnerFilter = normalize(ownerFilter);
  const matchesOwner =
    normalizedOwnerFilter === 'all' ||
    hasItemWithOwner(node?.items, normalizedOwnerFilter);

  return (
    matchesSearch &&
    matchesFilter &&
    matchesCategory &&
    matchesLocation &&
    matchesGroup &&
    matchesOwner
  );
}

function sortNodes(nodes, sortBy) {
  const list = [...(nodes || [])];

  list.sort((a, b) => {
    const aName = normalize(a?.label || a?.name || '');
    const bName = normalize(b?.label || b?.name || '');

    if (sortBy === 'group') {
      const aGroup = normalize(a?.group || '');
      const bGroup = normalize(b?.group || '');
      const aEmpty = !aGroup;
      const bEmpty = !bGroup;
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;

      const diff = compareText(aGroup, bGroup);
      if (diff !== 0) return diff;
      const nameDiff = compareText(aName, bName);
      if (nameDiff !== 0) return nameDiff;
      return compareNodeBoxId(a, b);
    }

    if (sortBy === 'location') {
      const diff = compareText(normalize(a?.location || ''), normalize(b?.location || ''));
      if (diff !== 0) return diff;
      const nameDiff = compareText(aName, bName);
      if (nameDiff !== 0) return nameDiff;
      return compareNodeBoxId(a, b);
    }

    if (sortBy === 'itemCount') {
      const diff = sumItemQty(b?.items) - sumItemQty(a?.items);
      if (diff !== 0) return diff;
      const nameDiff = compareText(aName, bName);
      if (nameDiff !== 0) return nameDiff;
      return compareNodeBoxId(a, b);
    }

    if (sortBy === 'boxId') {
      const diff = compareNodeBoxId(a, b);
      if (diff !== 0) return diff;
      return compareText(aName, bName);
    }

    const diff = compareText(aName, bName);
    if (diff !== 0) return diff;
    return compareNodeBoxId(a, b);
  });

  return list;
}

function matchesQuery(node, query) {
  const tags = Array.isArray(node?.tags) ? node.tags.join(' ') : '';
  const haystack = normalize(
    [
      node?.box_id,
      node?.label,
      node?.name,
      node?.group,
      node?.location,
      node?.description,
      node?.notes,
      tags,
    ]
      .filter(Boolean)
      .join(' '),
  );

  return haystack.includes(query);
}

function sumItemQty(items) {
  return (items || []).reduce((sum, it) => {
    const q = Number(it?.quantity);
    if (Number.isFinite(q)) return sum + q;
    return sum + 1;
  }, 0);
}

function getNodeItemCount(node) {
  if (Number.isFinite(Number(node?.itemCountOverride))) {
    return Math.max(0, Number(node.itemCountOverride));
  }
  return sumItemQty(node?.items);
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

function compareNodeBoxId(a, b) {
  const aNum = Number(a?.box_id);
  const bNum = Number(b?.box_id);
  const aValid = Number.isFinite(aNum);
  const bValid = Number.isFinite(bNum);
  if (aValid && bValid && aNum !== bNum) return aNum - bNum;
  return compareText(String(a?.box_id || ''), String(b?.box_id || ''));
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hasItemWithCategory(items, categoryFilter) {
  if (!categoryFilter) return true;
  if (!Array.isArray(items) || items.length === 0) return false;

  return items.some(
    (item) => normalizeItemCategory(item?.category) === categoryFilter
  );
}

function hasItemWithOwner(items, ownerFilter) {
  if (!ownerFilter) return true;
  if (!Array.isArray(items) || items.length === 0) return false;

  return items.some((item) => normalize(item?.primaryOwnerName) === ownerFilter);
}

function collectOwnerOptions(nodes) {
  const byKey = new Map();

  const walk = (list) => {
    for (const node of list || []) {
      const items = Array.isArray(node?.items) ? node.items : [];
      for (const item of items) {
        const label = String(item?.primaryOwnerName || '').trim();
        if (!label) continue;
        const key = normalize(label);
        if (!byKey.has(key)) byKey.set(key, label);
      }
      walk(node?.childBoxes);
    }
  };

  walk(nodes);

  return [...byKey.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => compareText(a.label, b.label));
}

function collectGroupOptions(nodes, providedGroups = []) {
  const byKey = new Map();

  const addLabel = (rawLabel) => {
    const label = String(rawLabel || '').trim();
    if (!label) return;
    const key = normalize(label);
    if (!key) return;
    if (!byKey.has(key)) byKey.set(key, label);
  };

  for (const option of Array.isArray(providedGroups) ? providedGroups : []) {
    if (typeof option === 'string') {
      addLabel(option);
      continue;
    }

    addLabel(option?.label || option?.value);
  }

  const walk = (list) => {
    for (const node of list || []) {
      addLabel(node?.group);
      walk(node?.childBoxes);
    }
  };

  walk(nodes);

  return [...byKey.values()]
    .sort((a, b) => compareText(a, b))
    .map((label) => ({ value: label, label }));
}

function getRenderableBoxTags(node) {
  const sourceTags = Array.isArray(node?.tags) ? node.tags : [];
  if (!sourceTags.length) return [];

  const blockedValues = new Set(
    [normalize(node?.location), normalize(node?.group)].filter(Boolean),
  );
  const seen = new Set();
  const tags = [];

  for (const entry of sourceTags) {
    const label = String(entry || '').trim();
    if (!label) continue;

    const key = normalize(label);
    if (!key) continue;
    if (blockedValues.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(label);
  }

  return tags;
}

function mergeQuickCreatedBoxes(baseNodes, quickCreatedBoxes) {
  const base = Array.isArray(baseNodes) ? baseNodes : [];
  const quick = Array.isArray(quickCreatedBoxes) ? quickCreatedBoxes : [];

  if (quick.length === 0) return base;

  const byId = new Map();
  for (const node of base) {
    const key = String(node?._id || '').trim();
    if (key) byId.set(key, node);
  }

  for (const node of quick) {
    const key = String(node?._id || '').trim();
    if (!key) continue;
    if (byId.has(key)) continue;
    byId.set(key, node);
  }

  return sortNodes([...byId.values()], 'boxId');
}

function getLocationId(node) {
  return node?.locationId?._id ?? node?.locationId ?? null;
}

function buildItemPreviewChips(items, { limit = ITEM_CHIP_LIMIT, totalCount } = {}) {
  const maxVisible = Math.max(1, Number(limit) || ITEM_CHIP_LIMIT);
  const names = (Array.isArray(items) ? items : [])
    .map((item) => String(item?.name || 'Untitled').trim() || 'Untitled')
    .filter(Boolean);
  const knownCount = names.length;
  const resolvedTotal = Number.isFinite(Number(totalCount))
    ? Math.max(Number(totalCount), knownCount)
    : knownCount;

  if (resolvedTotal <= maxVisible) {
    return names.slice(0, maxVisible);
  }

  const visibleCount = Math.max(0, maxVisible - 1);
  return [...names.slice(0, visibleCount), ITEM_CHIP_OVERFLOW_LABEL];
}

function buildOrphanedContainerNode({ orphanedItems = [], orphanedCount = 0 } = {}) {
  const items = Array.isArray(orphanedItems) ? orphanedItems : [];
  const resolvedCount = Number.isFinite(Number(orphanedCount))
    ? Math.max(0, Number(orphanedCount))
    : items.length;

  return {
    _id: ORPHANED_CONTAINER_ID,
    box_id: 'SYS',
    label: 'Orphaned Items',
    location: 'System',
    description: 'Virtual container for unassigned items.',
    notes: 'Items remain orphaned in the data model.',
    tags: ['system', 'virtual'],
    items,
    childBoxes: [],
    isSystemContainer: true,
    systemType: 'orphaned',
    itemCountOverride: resolvedCount,
  };
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? `${str.slice(0, n - 1)}...` : str;
}

function buildBoxLocatorIndex(nodes) {
  const found = [];
  const seen = new Set();

  const walk = (list) => {
    for (const node of list || []) {
      const boxId = normalizeBoxId(node?.box_id);
      if (boxId && !seen.has(boxId)) {
        seen.add(boxId);
        found.push({
          boxId,
          label: String(node?.label || node?.name || '').trim(),
          location: String(node?.location || '').trim(),
        });
      }
      walk(node?.childBoxes);
    }
  };

  walk(nodes);

  found.sort((a, b) => {
    const numericDiff = compareNumericBoxIds(a.boxId, b.boxId);
    if (numericDiff !== 0) return numericDiff;
    return compareText(a.label, b.label);
  });

  return found;
}

function findBoxLocatorMatches(index, prefix) {
  const normalizedPrefix = normalizeBoxId(prefix);
  if (!normalizedPrefix) return [];

  return (index || []).filter((entry) =>
    matchesBoxIdPrefix(entry?.boxId, normalizedPrefix),
  );
}
