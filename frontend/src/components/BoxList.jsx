// src/views/BoxList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { styledComponents as S } from '../styles/BoxList.styles';
import InventoryGridHeader from './InventoryGridHeader';
import BoxLocatorInspectorPanel from './BoxLocatorInspectorPanel';
import { normalizeItemCategory } from '../util/itemCategories';
import { fetchBoxTreeByShortId } from '../api/boxes';
import {
  filterBoxTreeByPrefix,
  normalizeBoxPrefix,
} from '../util/boxPrefixFilter';
import {
  compareNumericBoxIds,
  matchesBoxIdPrefix,
  normalizeBoxId,
} from '../util/boxLocator';

const ORPHANED_CONTAINER_ID = '__system-orphaned-items__';
const ORPHANED_CONTAINER_ROUTE = '/all-items?filter=orphaned';

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
  onOperationsDataRefreshRequest,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [quickCreatedBoxes, setQuickCreatedBoxes] = useState([]);
  const [quickOrphanedDelta, setQuickOrphanedDelta] = useState(0);
  const [showOrphanedVirtual, setShowOrphanedVirtual] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const density = 'compact';
  const [boxPrefix, setBoxPrefix] = useState(() =>
    normalizeBoxPrefix(searchParams.get('boxPrefix')),
  );
  const [boxLocatorQuery, setBoxLocatorQuery] = useState('');
  const [boxLocatorSelection, setBoxLocatorSelection] = useState(null);
  const [boxLocatorDetails, setBoxLocatorDetails] = useState(null);
  const [boxLocatorLoading, setBoxLocatorLoading] = useState(false);
  const [boxLocatorError, setBoxLocatorError] = useState('');
  const [sortBy, setSortBy] = useState('boxId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const currentPage = Math.max(1, Number(pagination?.page) || 1);
  const totalCount = Number.isFinite(Number(pagination?.total))
    ? Number(pagination.total)
    : 0;
  const pageLimit = Math.max(1, Number(pagination?.limit) || 50);

  const mergedBoxes = useMemo(
    () => mergeQuickCreatedBoxes(boxes, quickCreatedBoxes),
    [boxes, quickCreatedBoxes],
  );
  const quickCreatedCountDelta = useMemo(
    () => countMissingQuickCreatedBoxes(boxes, quickCreatedBoxes),
    [boxes, quickCreatedBoxes],
  );
  const effectiveTotalCount = Math.max(0, totalCount + quickCreatedCountDelta);
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

  const prefixFilteredBoxes = useMemo(
    () => filterBoxTreeByPrefix(mergedBoxes, boxPrefix),
    [mergedBoxes, boxPrefix],
  );

  const controlledBoxes = useMemo(
    () =>
      applyTreeControls(prefixFilteredBoxes, {
        searchQuery,
        searchScope,
        sortBy,
        sortDirection,
        filterBy,
        categoryFilter,
        locationFilter,
        groupFilter,
        ownerFilter,
      }),
    [
      prefixFilteredBoxes,
      searchQuery,
      searchScope,
      sortBy,
      sortDirection,
      filterBy,
      categoryFilter,
      locationFilter,
      groupFilter,
      ownerFilter,
    ],
  );

  const visibleBoxCount = useMemo(
    () => summarizeTree(controlledBoxes).totalBoxes,
    [controlledBoxes],
  );
  const visibleTopLevelCount = controlledBoxes.length;
  const filteredTotalPages = Math.max(
    1,
    Math.ceil(visibleTopLevelCount / pageLimit),
  );
  const safeCurrentPage = Math.min(currentPage, filteredTotalPages);
  const pagedVisibleBoxes = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageLimit;
    return controlledBoxes.slice(start, start + pageLimit);
  }, [controlledBoxes, pageLimit, safeCurrentPage]);

  const orphanedMatchesControls = useMemo(
    () =>
      matchesNodeControls(orphanedContainer, {
        query: normalize(searchQuery),
        searchScope,
        filterBy,
        categoryFilter,
        locationFilter,
        groupFilter,
        ownerFilter,
      }),
    [
      orphanedContainer,
      searchQuery,
      searchScope,
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
    const rawParam = searchParams.get('boxPrefix');
    const normalizedParam = normalizeBoxPrefix(rawParam);
    if (rawParam && normalizedParam === 'all') {
      const next = new URLSearchParams(searchParams);
      next.delete('boxPrefix');
      setSearchParams(next, { replace: true });
      return;
    }

    if (normalizedParam !== boxPrefix) {
      setBoxPrefix(normalizedParam);
    }
  }, [boxPrefix, searchParams, setSearchParams]);

  useEffect(() => {
    onInventoryQueryChange?.({
      q: searchQuery,
      group: groupFilter,
      sortBy,
    });
  }, [searchQuery, groupFilter, sortBy, onInventoryQueryChange]);

  const showOrphanedContainer = showOrphanedVirtual && orphanedMatchesControls;
  const hasAnyData = effectiveTotalCount > 0 || effectiveOrphanedCount > 0;
  const noData = !hasAnyData;
  const hasNoMatches =
    hasAnyData &&
    pagedVisibleBoxes.length === 0 &&
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

    onOperationsDataRefreshRequest?.();
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
    sortDirection,
    filterBy,
    boxPrefix,
    categoryFilter,
    locationFilter,
    groupFilter,
    ownerFilter,
    onPageChange,
  ]);

  useEffect(() => {
    if (currentPage <= filteredTotalPages) return;
    onPageChange?.(filteredTotalPages);
  }, [currentPage, filteredTotalPages, onPageChange]);

  const handleClearBoxLocatorResult = () => {
    setBoxLocatorSelection(null);
    setBoxLocatorDetails(null);
    setBoxLocatorError('');
  };

  const handleBoxPrefixChange = (nextPrefix) => {
    const normalizedPrefix = normalizeBoxPrefix(nextPrefix);
    setBoxPrefix(normalizedPrefix);

    const next = new URLSearchParams(searchParams);
    if (normalizedPrefix === 'all') {
      next.delete('boxPrefix');
    } else {
      next.set('boxPrefix', normalizedPrefix);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <S.Container>
      <InventoryGridHeader
        totalBoxes={telemetry.totalBoxes}
        totalItems={telemetry.totalItems}
        orphanedCount={telemetry.orphanedCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchScope={searchScope}
        onSearchScopeChange={setSearchScope}
        boxLocatorQuery={boxLocatorQuery}
        onBoxLocatorQueryChange={setBoxLocatorQuery}
        boxLocatorMatches={boxLocatorMatches}
        onBoxLocatorSelect={handleBoxLocatorSelect}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        filterBy={filterBy}
        onFilterChange={setFilterBy}
        boxPrefix={boxPrefix}
        onBoxPrefixChange={handleBoxPrefixChange}
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        density={density}
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
          {viewMode === 'terminal' ? (
            <S.TerminalTable role="tree" aria-label="Condensed box tree">
              <S.TerminalHeader role="row">
                <S.TerminalHeadCell>Box</S.TerminalHeadCell>
                <S.TerminalHeadCell>Location</S.TerminalHeadCell>
                <S.TerminalHeadCell>Signal</S.TerminalHeadCell>
                <S.TerminalHeadCell>Children</S.TerminalHeadCell>
                <S.TerminalHeadCell>Items</S.TerminalHeadCell>
              </S.TerminalHeader>
              {orphanedMatchesControls ? (
                <S.OrphanedRevealShell $open={showOrphanedContainer}>
                  <CompactBranch
                    key={orphanedContainer._id}
                    node={orphanedContainer}
                    depth={0}
                    searchQuery={searchQuery}
                    searchScope={searchScope}
                    density={density}
                  />
                </S.OrphanedRevealShell>
              ) : null}
              {pagedVisibleBoxes.map((node) => (
                <CompactBranch
                  key={node._id || node.box_id}
                  node={node}
                  depth={0}
                  searchQuery={searchQuery}
                  searchScope={searchScope}
                  density={density}
                />
              ))}
            </S.TerminalTable>
          ) : (
            <>
              {orphanedMatchesControls ? (
                <S.OrphanedRevealShell $open={showOrphanedContainer}>
                  <Branch
                    key={orphanedContainer._id}
                    node={orphanedContainer}
                    depth={0}
                    searchQuery={searchQuery}
                    searchScope={searchScope}
                    density={density}
                  />
                </S.OrphanedRevealShell>
              ) : null}
              {pagedVisibleBoxes.map((node) => (
                <Branch
                  key={node._id || node.box_id}
                  node={node}
                  depth={0}
                  searchQuery={searchQuery}
                  searchScope={searchScope}
                  density={density}
                />
              ))}
            </>
          )}
        </>
      )}

      {effectiveTotalCount > 0 ? (
        <S.PaginationBar>
          <S.PaginationButton
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </S.PaginationButton>

          <S.PaginationInfo>
            Page {safeCurrentPage} of {filteredTotalPages}
            {` // ${visibleTopLevelCount} matching top-level boxes`}
            {` // ${visibleBoxCount} / ${telemetry.totalBoxes} boxes shown`}
          </S.PaginationInfo>

          <S.PaginationButton
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={safeCurrentPage >= filteredTotalPages}
          >
            Next
          </S.PaginationButton>
        </S.PaginationBar>
      ) : null}
    </S.Container>
  );
}

function CompactBranch({
  node,
  depth = 0,
  searchQuery = '',
  searchScope = 'all',
  density = 'compact',
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [childrenExpanded, setChildrenExpanded] = useState(false);
  const childBoxes = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const tags = getRenderableBoxTags(node);
  const group = String(node?.group || '').trim();
  const description = String(node?.description || '').trim();
  const notes = String(node?.notes || '').trim();
  const isSystemContainer = !!node?.isSystemContainer;
  const isOrphanedContainer = node?.systemType === 'orphaned';
  const itemQtyTotal = getNodeItemCount(node);
  const title = node.label || node.name || 'Untitled';
  const route = isOrphanedContainer ? ORPHANED_CONTAINER_ROUTE : `/boxes/${node.box_id}`;
  const autoExpandChildren = hasMatchingDescendant(node, searchQuery, searchScope);
  const showChildren =
    childBoxes.length > 0 &&
    (depth < 2 || childrenExpanded || autoExpandChildren);
  const nestedCount = countDescendants(node);
  const hasMoreInfo =
    !!group || !!description || !!notes || tags.length > 0 || isSystemContainer;

  const go = () => {
    navigate(route);
  };

  const stopAndToggle = (event) => {
    event.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const toggleChildren = (event) => {
    event.stopPropagation();
    setChildrenExpanded((prev) => !prev);
  };

  return (
    <S.TerminalBranch $depth={depth}>
      <S.TerminalRow
        role="treeitem"
        aria-expanded={hasMoreInfo ? expanded : undefined}
        $depth={depth}
        $isSystem={isSystemContainer}
        $density={density}
        onClick={go}
      >
        <S.TerminalBoxCell $depth={depth}>
          <S.TreeGlyph aria-hidden="true" $depth={depth}>
            {childBoxes.length > 0 ? '>' : '-'}
          </S.TreeGlyph>
          <S.TerminalShortId $depth={depth} $isSystem={isSystemContainer}>
            {isSystemContainer ? 'SYS' : `#${node.box_id}`}
          </S.TerminalShortId>
          <S.TerminalTitle>{title}</S.TerminalTitle>
        </S.TerminalBoxCell>
        <S.TerminalCell>{node.location || '-'}</S.TerminalCell>
        <S.TerminalCell>{group || description || '-'}</S.TerminalCell>
        <S.TerminalMetric>{isOrphanedContainer ? 'virtual' : childBoxes.length}</S.TerminalMetric>
        <S.TerminalMetric>{itemQtyTotal}</S.TerminalMetric>
        <S.TerminalMoreButton
          type="button"
          disabled={!hasMoreInfo}
          aria-label={`${expanded ? 'Hide' : 'Show'} details for ${title}`}
          aria-expanded={expanded}
          onClick={stopAndToggle}
        >
          {expanded ? '-' : '+'}
        </S.TerminalMoreButton>
      </S.TerminalRow>

      <S.TerminalDetailPanel $open={expanded}>
        <S.TerminalDetailInner>
          {isSystemContainer ? (
            <S.TerminalDetailText>Virtual system container.</S.TerminalDetailText>
          ) : null}
          {description ? (
            <S.TerminalDetailText>{description}</S.TerminalDetailText>
          ) : null}
          {notes ? (
            <S.TerminalDetailNote>
              <S.TerminalDetailLabel>Notes</S.TerminalDetailLabel>
              {notes}
            </S.TerminalDetailNote>
          ) : null}
          {tags.length > 0 ? (
            <S.TerminalTagRow>
              {tags.map((tag, index) => (
                <S.TagBubble
                  $tiny
                  $depth={depth}
                  $isSystem={isSystemContainer}
                  key={`${node._id || node.box_id}-terminal-tag-${index}`}
                >
                  {tag}
                </S.TagBubble>
              ))}
            </S.TerminalTagRow>
          ) : null}
          <S.TerminalLink to={route}>Open box page</S.TerminalLink>
        </S.TerminalDetailInner>
      </S.TerminalDetailPanel>

      {childBoxes.length > 0 && depth >= 2 ? (
        <S.TerminalChildrenToggle
          type="button"
          aria-expanded={showChildren}
          onClick={toggleChildren}
        >
          {showChildren ? 'Hide' : 'Show'} {nestedCount} nested {nestedCount === 1 ? 'box' : 'boxes'}
        </S.TerminalChildrenToggle>
      ) : null}

      {showChildren ? (
        <S.TerminalChildren>
          {childBoxes.map((child) => (
            <CompactBranch
              key={child._id || child.box_id}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
              searchScope={searchScope}
              density={density}
            />
          ))}
        </S.TerminalChildren>
      ) : null}
    </S.TerminalBranch>
  );
}

function Branch({
  node,
  depth = 0,
  searchQuery = '',
  searchScope = 'all',
  density = 'compact',
}) {
  const navigate = useNavigate();
  const [childrenExpanded, setChildrenExpanded] = useState(false);
  const childBoxes = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const tags = getRenderableBoxTags(node);
  const group = String(node?.group || '').trim();
  const description = String(node?.description || '').trim();
  const notes = String(node?.notes || '').trim();
  const boxImageUrl = getBoxImageUrl(node);
  const isSystemContainer = !!node?.isSystemContainer;
  const isOrphanedContainer = node?.systemType === 'orphaned';
  const isRoot = depth === 0;

  const itemQtyTotal = getNodeItemCount(node);
  const matchingItems = getMatchingItemNames(node, searchQuery, searchScope);
  const visibleTags = density === 'roomy' ? tags : tags.slice(0, 3);
  const hiddenTagCount = Math.max(0, tags.length - visibleTags.length);
  const autoExpandChildren = hasMatchingDescendant(node, searchQuery, searchScope);
  const showChildren =
    childBoxes.length > 0 &&
    (depth < 2 || childrenExpanded || autoExpandChildren);
  const nestedCount = countDescendants(node);

  const go = () => {
    if (isOrphanedContainer) {
      navigate(ORPHANED_CONTAINER_ROUTE);
      return;
    }
    navigate(`/boxes/${node.box_id}`);
  };

  const toggleChildren = (event) => {
    event.stopPropagation();
    setChildrenExpanded((prev) => !prev);
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
          $density={density}
        >
          <S.BoxBodyRow $density={density}>
            <S.BoxImageFrame $density={density}>
              {boxImageUrl ? (
                <S.BoxImage
                  src={boxImageUrl}
                  alt={`${node.label || node.name || `Box ${node.box_id || ''}`} image`}
                />
              ) : (
                <S.BoxImagePlaceholder>No image</S.BoxImagePlaceholder>
              )}
            </S.BoxImageFrame>

            <S.BoxContent>
              <S.BoxHeader>
                <S.ShortId $isRoot={isRoot} $depth={depth} $isSystem={isSystemContainer}>
                  {isSystemContainer ? (
                    'SYS'
                  ) : (
                    <>
                      <S.ShortIdMarker>#</S.ShortIdMarker>
                      <S.ShortIdDigits>{node.box_id}</S.ShortIdDigits>
                    </>
                  )}
                </S.ShortId>
                <S.BoxTitle
                  $isRoot={isRoot}
                  $depth={depth}
                  $isSystem={isSystemContainer}
                  $density={density}
                >
                  {node.label || node.name || 'Untitled'}
                </S.BoxTitle>
              </S.BoxHeader>

              {group || node.location ? (
                <S.BoxMetaRow>
                  {node.location ? (
                    <S.LocationMeta>
                      <S.LocationMetaLabel>Location</S.LocationMetaLabel>
                      <S.LocationMetaValue>{node.location}</S.LocationMetaValue>
                    </S.LocationMeta>
                  ) : null}
                  {group ? (
                    <S.SecondaryMeta>Group · {group}</S.SecondaryMeta>
                  ) : null}
                </S.BoxMetaRow>
              ) : null}

              {description && (
                <S.BoxSummary $density={density}>{description}</S.BoxSummary>
              )}

              {isSystemContainer ? (
                <S.BoxSummary $density={density}>Virtual system container</S.BoxSummary>
              ) : null}

              {visibleTags.length > 0 && (
                <>
                  <S.TagRow>
                    {visibleTags.map((t, i) => (
                      <S.TagBubble
                        $isRoot={isRoot}
                        $depth={depth}
                        key={`${node._id || node.box_id}-tag-${i}`}
                      >
                        {t}
                      </S.TagBubble>
                    ))}
                    {hiddenTagCount > 0 ? (
                      <S.TagBubble $isRoot={isRoot} $depth={depth}>
                        +{hiddenTagCount}
                      </S.TagBubble>
                    ) : null}
                  </S.TagRow>
                </>
              )}

              {matchingItems.length > 0 ? (
                <S.MatchSummary>
                  Matches: {matchingItems.join(', ')}
                </S.MatchSummary>
              ) : null}

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

              {notes ? (
                  <S.NotesPreviewArea $density={density}>
                  <S.NotesPreviewLabel>Notes</S.NotesPreviewLabel>
                  <S.NotesPreviewText>{notes}</S.NotesPreviewText>
                </S.NotesPreviewArea>
              ) : null}
            </S.BoxContent>
          </S.BoxBodyRow>
        </S.BoxCard>

        {childBoxes.length > 0 && depth >= 2 ? (
          <S.NestedChildrenToggle
            type="button"
            aria-expanded={showChildren}
            onClick={toggleChildren}
          >
            <span>{showChildren ? 'Hide' : 'Show'} {nestedCount} nested {nestedCount === 1 ? 'box' : 'boxes'}</span>
            <S.NestedChildrenIcon aria-hidden="true">{showChildren ? '−' : '+'}</S.NestedChildrenIcon>
          </S.NestedChildrenToggle>
        ) : null}

        {showChildren && (
          <S.NodeChildren $depth={depth + 1} $density={density}>
            {childBoxes.map((child) => (
              <Branch
                key={child._id || child.box_id}
                node={child}
                depth={depth + 1}
                searchQuery={searchQuery}
                searchScope={searchScope}
                density={density}
              />
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
    searchScope = 'all',
    sortBy = 'boxId',
    sortDirection = 'asc',
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
        searchScope,
        filterBy,
        categoryFilter,
        locationFilter,
        groupFilter,
        ownerFilter,
      }) || children.length > 0;
    if (!include) return null;

    return {
      ...node,
      childBoxes: sortNodes(children, sortBy, sortDirection),
    };
  };

  const mapped = (nodes || []).map(processNode).filter(Boolean);
  return sortNodes(mapped, sortBy, sortDirection);
}

function matchesNodeControls(
  node,
  {
    query = '',
    searchScope = 'all',
    filterBy = 'all',
    categoryFilter = 'all',
    locationFilter = 'all',
    groupFilter = 'all',
    ownerFilter = 'all',
  } = {},
) {
  const matchesSearch = !query || matchesQuery(node, query, searchScope);
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

function sortNodes(nodes, sortBy, sortDirection = 'asc') {
  const list = [...(nodes || [])];
  const directionFactor = sortDirection === 'desc' ? -1 : 1;

  list.sort((a, b) => {
    const aName = normalize(a?.label || a?.name || '');
    const bName = normalize(b?.label || b?.name || '');
    let diff = 0;

    if (sortBy === 'group') {
      const aGroup = normalize(a?.group || '');
      const bGroup = normalize(b?.group || '');
      const aEmpty = !aGroup;
      const bEmpty = !bGroup;
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;

      diff = compareText(aGroup, bGroup) * directionFactor;
      if (diff !== 0) return diff;
      const nameDiff = compareText(aName, bName) * directionFactor;
      if (nameDiff !== 0) return nameDiff;
      return compareNodeBoxId(a, b) * directionFactor;
    }

    if (sortBy === 'location') {
      diff =
        compareText(normalize(a?.location || ''), normalize(b?.location || '')) *
        directionFactor;
      if (diff !== 0) return diff;
      const nameDiff = compareText(aName, bName) * directionFactor;
      if (nameDiff !== 0) return nameDiff;
      return compareNodeBoxId(a, b) * directionFactor;
    }

    if (sortBy === 'itemCount') {
      diff = (sumItemQty(a?.items) - sumItemQty(b?.items)) * directionFactor;
      if (diff !== 0) return diff;
      const nameDiff = compareText(aName, bName) * directionFactor;
      if (nameDiff !== 0) return nameDiff;
      return compareNodeBoxId(a, b) * directionFactor;
    }

    if (sortBy === 'boxId') {
      diff = compareNodeBoxId(a, b) * directionFactor;
      if (diff !== 0) return diff;
      return compareText(aName, bName) * directionFactor;
    }

    diff = compareText(aName, bName) * directionFactor;
    if (diff !== 0) return diff;
    return compareNodeBoxId(a, b) * directionFactor;
  });

  return list;
}

function matchesQuery(node, query, searchScope = 'all') {
  const tags = Array.isArray(node?.tags) ? node.tags.join(' ') : '';
  const boxHaystack = [
    node?.box_id,
    node?.label,
    node?.name,
    node?.group,
    node?.location,
    node?.description,
    node?.notes,
    tags,
  ];
  const itemHaystack = (Array.isArray(node?.items) ? node.items : []).flatMap(
    (item) => [
      item?.name,
      item?.label,
      item?.description,
      item?.notes,
      item?.category,
      item?.primaryOwnerName,
      ...(Array.isArray(item?.tags) ? item.tags : []),
    ],
  );
  const haystack = normalize(
    (searchScope === 'items'
      ? itemHaystack
      : searchScope === 'boxes'
        ? boxHaystack
        : [...boxHaystack, ...itemHaystack]
    )
      .filter(Boolean)
      .join(' '),
  );

  return haystack.includes(query);
}

function getMatchingItemNames(node, query, searchScope = 'all') {
  if (!query || searchScope === 'boxes') return [];
  const normalizedQuery = normalize(query);
  const items = Array.isArray(node?.items) ? node.items : [];

  return items
    .filter((item) => {
      const haystack = normalize(
        [
          item?.name,
          item?.label,
          item?.description,
          item?.notes,
          item?.category,
          item?.primaryOwnerName,
          ...(Array.isArray(item?.tags) ? item.tags : []),
        ]
          .filter(Boolean)
          .join(' '),
      );
      return haystack.includes(normalizedQuery);
    })
    .map((item) => String(item?.name || item?.label || '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function hasMatchingDescendant(node, searchQuery, searchScope) {
  if (!searchQuery) return false;
  return (node?.childBoxes || []).some(
    (child) =>
      matchesQuery(child, normalize(searchQuery), searchScope) ||
      hasMatchingDescendant(child, searchQuery, searchScope),
  );
}

function countDescendants(node) {
  return (node?.childBoxes || []).reduce(
    (total, child) => total + 1 + countDescendants(child),
    0,
  );
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

function getBoxImageUrl(box) {
  return (
    box?.image?.thumb?.url ||
    box?.image?.display?.url ||
    box?.image?.original?.url ||
    box?.image?.url ||
    box?.imagePath ||
    ''
  );
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

function countMissingQuickCreatedBoxes(baseNodes, quickCreatedBoxes) {
  const base = Array.isArray(baseNodes) ? baseNodes : [];
  const quick = Array.isArray(quickCreatedBoxes) ? quickCreatedBoxes : [];

  if (quick.length === 0) return 0;

  const baseIds = new Set(
    base
      .map((node) => String(node?._id || '').trim())
      .filter(Boolean),
  );
  let missing = 0;

  for (const entry of quick) {
    const nextId = String(entry?._id || '').trim();
    if (!nextId) continue;
    if (baseIds.has(nextId)) continue;
    missing += 1;
  }

  return missing;
}

function getLocationId(node) {
  return node?.locationId?._id ?? node?.locationId ?? null;
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
