// src/views/BoxList.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { styledComponents as S } from '../styles/BoxList.styles';
import InventoryGridHeader from './InventoryGridHeader';
import { normalizeItemCategory } from '../util/itemCategories';
import {
  filterBoxTreeByIdPrefix,
  normalizeBoxId,
} from '../util/boxLocator';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../util/inventoryColorTheme';
import OperationsBoxQuickPeek from './OperationsQuickPeek/OperationsBoxQuickPeek';
import useOperationsQuickPeek, {
  getOperationsBoxAnchorId,
} from './OperationsQuickPeek/useOperationsQuickPeek';
import TerminalItemTable from './OperationsTerminal/TerminalItemTable';
import OperationsArchivedItemsLane from './OperationsArchivedItems/OperationsArchivedItemsLane';
import { API_BASE } from '../api/API_BASE';
import { normalizeKeepPriority } from '../util/keepPriority';
import { OPERATIONS_QUICK_PEEK_CLOSE_EVENT } from '../constants/inventoryFinderEvents';

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
  const [viewMode, setViewMode] = useState('cards');
  const [expandedTerminalBoxId, setExpandedTerminalBoxId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const density = 'compact';
  const [boxLocatorQuery, setBoxLocatorQuery] = useState(() =>
    normalizeBoxId(searchParams.get('boxPrefix')).slice(0, 1),
  );
  const [sortBy, setSortBy] = useState('boxId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [keepPriorityFilter, setKeepPriorityFilter] = useState('all');
  const [archivedItems, setArchivedItems] = useState([]);
  const [archivedItemsLoading, setArchivedItemsLoading] = useState(false);
  const [archivedItemsError, setArchivedItemsError] = useState('');
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
  const showingArchivedItems = keepPriorityFilter === 'gone';

  const visibleOrphanedItems = useMemo(
    () =>
      filterOrphanedItems(orphanedItems, {
        searchQuery,
        boxLocatorQuery,
        filterBy,
        categoryFilter,
        locationFilter,
        groupFilter,
        ownerFilter,
        keepPriorityFilter,
        locations,
      }),
    [
      orphanedItems,
      searchQuery,
      boxLocatorQuery,
      filterBy,
      categoryFilter,
      locationFilter,
      groupFilter,
      ownerFilter,
      keepPriorityFilter,
      locations,
    ],
  );
  const orphanFiltersActive = Boolean(
    String(searchQuery || '').trim() ||
      normalizeBoxId(boxLocatorQuery) ||
      filterBy !== 'all' ||
      categoryFilter !== 'all' ||
      locationFilter !== 'all' ||
      groupFilter !== 'all' ||
      ownerFilter !== 'all' ||
      keepPriorityFilter !== 'all',
  );
  const visibleOrphanedCount =
    visibleOrphanedItems.length + (orphanFiltersActive ? 0 : quickOrphanedDelta);

  const telemetry = useMemo(
    () => summarizeTree(mergedBoxes, effectiveOrphanedCount),
    [mergedBoxes, effectiveOrphanedCount],
  );

  const locatorFilteredBoxes = useMemo(
    () => filterBoxTreeByIdPrefix(mergedBoxes, boxLocatorQuery),
    [mergedBoxes, boxLocatorQuery],
  );
  const boxLocatorActive = normalizeBoxId(boxLocatorQuery).length > 0;

  const controlledBoxes = useMemo(
    () =>
      applyTreeControls(locatorFilteredBoxes, {
        searchQuery: boxLocatorActive ? '' : searchQuery,
        searchScope: boxLocatorActive ? 'all' : searchScope,
        sortBy,
        sortDirection,
        filterBy: boxLocatorActive ? 'all' : filterBy,
        categoryFilter: boxLocatorActive ? 'all' : categoryFilter,
        locationFilter: boxLocatorActive ? 'all' : locationFilter,
        groupFilter: boxLocatorActive ? 'all' : groupFilter,
        ownerFilter: boxLocatorActive ? 'all' : ownerFilter,
        keepPriorityFilter: boxLocatorActive ? 'all' : keepPriorityFilter,
      }),
    [
      locatorFilteredBoxes,
      boxLocatorActive,
      searchQuery,
      searchScope,
      sortBy,
      sortDirection,
      filterBy,
      categoryFilter,
      locationFilter,
      groupFilter,
      ownerFilter,
      keepPriorityFilter,
    ],
  );

  const archivedItemsWithContext = useMemo(
    () => attachArchivedBoxContext(archivedItems, mergedBoxes),
    [archivedItems, mergedBoxes],
  );
  const legacyDecommissionedItems = useMemo(
    () => collectDecommissionedItemsFromBoxes(mergedBoxes),
    [mergedBoxes],
  );
  const combinedArchivedItems = useMemo(
    () => mergeItemsById(archivedItemsWithContext, legacyDecommissionedItems),
    [archivedItemsWithContext, legacyDecommissionedItems],
  );
  const visibleArchivedItems = useMemo(
    () => filterArchivedItems(combinedArchivedItems, {
      searchQuery,
      categoryFilter,
      locationFilter,
      groupFilter,
      ownerFilter,
      sortBy,
      sortDirection,
    }),
    [
      combinedArchivedItems,
      searchQuery,
      categoryFilter,
      locationFilter,
      groupFilter,
      ownerFilter,
      sortBy,
      sortDirection,
    ],
  );

  const visibleBoxCount = useMemo(
    () => summarizeTree(controlledBoxes).totalBoxes,
    [controlledBoxes],
  );
  const visibleTopLevelCount = controlledBoxes.length;
  const boxLocatorExactMatch = useMemo(() => {
    const query = normalizeBoxId(boxLocatorQuery);
    return query.length === 3 ? findBoxById(mergedBoxes, query) : null;
  }, [boxLocatorQuery, mergedBoxes]);
  const filteredTotalPages = Math.max(
    1,
    Math.ceil(visibleTopLevelCount / pageLimit),
  );
  const safeCurrentPage = Math.min(currentPage, filteredTotalPages);
  const pagedVisibleBoxes = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageLimit;
    return controlledBoxes.slice(start, start + pageLimit);
  }, [controlledBoxes, pageLimit, safeCurrentPage]);
  const quickPeekBoxes = useMemo(
    () => flattenPreviewBoxes(pagedVisibleBoxes),
    [pagedVisibleBoxes],
  );
  const quickPeek = useOperationsQuickPeek(quickPeekBoxes, {
    ready: effectiveTotalCount > 0 || mergedBoxes.length > 0,
  });
  const {
    close: closeQuickPeek,
    openBox: openQuickPeek,
    selectedBoxId: quickPeekSelectedBoxId,
  } = quickPeek;
  const [notesEmphasisBoxId, setNotesEmphasisBoxId] = useState('');
  const [quickPeekSurface, setQuickPeekSurface] = useState('items');
  const lastAutoActivatedLocatorRef = useRef('');
  const autoOpenedPeekIdRef = useRef('');

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
    if (!showingArchivedItems) return undefined;

    const controller = new AbortController();
    setArchivedItemsLoading(true);
    setArchivedItemsError('');

    const apiRoot = String(API_BASE || '').replace(/\/+$/, '');
    fetch(`${apiRoot}/api/items?status=gone&view=list`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load no longer have items (${response.status})`);
        }
        return response.json();
      })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setArchivedItems(Array.isArray(payload) ? payload : []);
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError' && !controller.signal.aborted) {
          setArchivedItemsError(error?.message || 'Could not load archived items.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setArchivedItemsLoading(false);
      });

    return () => controller.abort();
  }, [showingArchivedItems]);

  useEffect(() => {
    if (!showingArchivedItems) return;
    setBoxLocatorQuery('');
    setExpandedTerminalBoxId('');
    setNotesEmphasisBoxId('');
    closeQuickPeek();
  }, [closeQuickPeek, showingArchivedItems]);

  useEffect(() => {
    if (!searchParams.has('boxPrefix')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('boxPrefix');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    onInventoryQueryChange?.({
      q: boxLocatorActive ? '' : searchQuery,
      group: boxLocatorActive ? 'all' : groupFilter,
      sortBy,
    });
  }, [
    boxLocatorActive,
    searchQuery,
    groupFilter,
    sortBy,
    onInventoryQueryChange,
  ]);

  const hasAnyData = effectiveTotalCount > 0 || effectiveOrphanedCount > 0;
  const noData = !hasAnyData;
  const hasNoMatches =
    hasAnyData &&
    pagedVisibleBoxes.length === 0 &&
    visibleOrphanedCount === 0;

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

  const handleOpenQuickPeek = useCallback(
    (box, triggerElement) => {
      setNotesEmphasisBoxId('');
      setQuickPeekSurface('items');
      openQuickPeek(box, triggerElement);
    },
    [openQuickPeek],
  );

  const handleOpenPhotoQuickPeek = useCallback(
    (box, triggerElement) => {
      setNotesEmphasisBoxId('');
      setQuickPeekSurface('photo');
      openQuickPeek(box, triggerElement, { forceOpen: true });
    },
    [openQuickPeek],
  );

  const handleOpenNotesQuickPeek = useCallback(
    (box, triggerElement) => {
      const nextId = normalizeBoxId(box?.box_id);
      if (!nextId) return;

      setNotesEmphasisBoxId(nextId);
      setQuickPeekSurface('items');
      openQuickPeek(box, triggerElement, { forceOpen: true });
    },
    [openQuickPeek],
  );

  const handleCloseQuickPeek = useCallback(() => {
    setNotesEmphasisBoxId('');
    setQuickPeekSurface('items');
    closeQuickPeek();
  }, [closeQuickPeek]);

  useEffect(() => {
    window.addEventListener(OPERATIONS_QUICK_PEEK_CLOSE_EVENT, handleCloseQuickPeek);
    return () => window.removeEventListener(
      OPERATIONS_QUICK_PEEK_CLOSE_EVENT,
      handleCloseQuickPeek,
    );
  }, [handleCloseQuickPeek]);

  const activateExactBox = useCallback(() => {
    const exactId = normalizeBoxId(boxLocatorExactMatch?.box_id);
    if (!exactId) return;
    lastAutoActivatedLocatorRef.current = exactId;
    autoOpenedPeekIdRef.current = exactId;
    openQuickPeek(boxLocatorExactMatch);
  }, [boxLocatorExactMatch, openQuickPeek]);

  useEffect(() => {
    const query = normalizeBoxId(boxLocatorQuery);
    const autoPeekId = autoOpenedPeekIdRef.current;

    if (query.length !== 3 || !boxLocatorExactMatch) {
      lastAutoActivatedLocatorRef.current = '';
      if (autoPeekId && quickPeekSelectedBoxId === autoPeekId) {
        autoOpenedPeekIdRef.current = '';
        closeQuickPeek();
      } else if (autoPeekId) {
        autoOpenedPeekIdRef.current = '';
      }
      return;
    }

    if (lastAutoActivatedLocatorRef.current === query) return;
    activateExactBox();
  }, [
    activateExactBox,
    boxLocatorExactMatch,
    boxLocatorQuery,
    closeQuickPeek,
    quickPeekSelectedBoxId,
  ]);

  useEffect(() => {
    onPageChange?.(1);
  }, [
    searchQuery,
    sortBy,
    sortDirection,
    filterBy,
    boxLocatorQuery,
    categoryFilter,
    locationFilter,
    groupFilter,
    ownerFilter,
    keepPriorityFilter,
    onPageChange,
  ]);

  useEffect(() => {
    if (currentPage <= filteredTotalPages) return;
    onPageChange?.(filteredTotalPages);
  }, [currentPage, filteredTotalPages, onPageChange]);

  useEffect(() => {
    setExpandedTerminalBoxId('');
  }, [pagedVisibleBoxes, viewMode]);

  const toggleTerminalBox = useCallback((boxId) => {
    setExpandedTerminalBoxId((current) => (current === boxId ? '' : boxId));
  }, []);

  return (
    <S.Container $quickPeekOpen={Boolean(quickPeek.selectedBox)}>
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
        boxLocatorMatchingRootCount={locatorFilteredBoxes.length}
        boxLocatorVisibleBoxCount={visibleBoxCount}
        boxLocatorExactMatch={boxLocatorExactMatch}
        onBoxLocatorActivateExact={activateExactBox}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
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
        keepPriorityFilter={keepPriorityFilter}
        onKeepPriorityFilterChange={setKeepPriorityFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        density={density}
        onQuickBoxCreated={handleQuickBoxCreated}
        onQuickOrphanCreated={handleQuickOrphanCreated}
        locations={locations}
      />

      {showingArchivedItems ? (
        <OperationsArchivedItemsLane
          items={visibleArchivedItems}
          totalCount={combinedArchivedItems.length}
          loading={archivedItemsLoading}
          error={archivedItemsError}
        />
      ) : (
        visibleOrphanedCount > 0 ? (
          <OrphanedAttentionPanel
            count={visibleOrphanedCount}
            ambientQuiet={Boolean(quickPeek.selectedBox)}
          />
        ) : null
      )}

      {showingArchivedItems ? null : noData ? (
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
              {pagedVisibleBoxes.map((node) => (
                <CompactBranch
                  key={node._id || node.box_id}
                  node={node}
                  depth={0}
                  searchQuery={searchQuery}
                  searchScope={searchScope}
                  density={density}
                  expandedBoxId={expandedTerminalBoxId}
                  onToggleBox={toggleTerminalBox}
                />
              ))}
            </S.TerminalTable>
          ) : (
            <>
              {pagedVisibleBoxes.map((node) => (
                <Branch
                  key={node._id || node.box_id}
                  node={node}
                  depth={0}
                  searchQuery={searchQuery}
                  searchScope={searchScope}
                  density={density}
                  selectedBoxId={quickPeek.selectedBoxId}
                  onOpenQuickPeek={handleOpenQuickPeek}
                  onOpenPhotoQuickPeek={handleOpenPhotoQuickPeek}
                  onOpenNotesQuickPeek={handleOpenNotesQuickPeek}
                />
              ))}
            </>
          )}
        </>
      )}

      {!showingArchivedItems && effectiveTotalCount > 0 ? (
        <S.PaginationBar>
          <S.PaginationButton
            type="button"
            aria-label="Previous page"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <span aria-hidden="true">‹</span>
            <span className="pagination-label">Previous</span>
          </S.PaginationButton>

          <S.PaginationInfo
            aria-label={`Page ${safeCurrentPage} of ${filteredTotalPages}. ${visibleTopLevelCount} matching top-level boxes. ${visibleBoxCount} of ${telemetry.totalBoxes} boxes shown.`}
          >
            {safeCurrentPage} / {filteredTotalPages}
          </S.PaginationInfo>

          <S.PaginationButton
            type="button"
            aria-label="Next page"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={safeCurrentPage >= filteredTotalPages}
          >
            <span className="pagination-label">Next</span>
            <span aria-hidden="true">›</span>
          </S.PaginationButton>
        </S.PaginationBar>
      ) : null}

      <OperationsBoxQuickPeek
        box={quickPeek.selectedBox}
        position={quickPeek.selectedIndex + 1}
        total={quickPeek.totalBoxes}
        expanded={quickPeek.expanded}
        closing={quickPeek.closing}
        transitionDirection={quickPeek.transitionDirection}
        notesEmphasized={
          normalizeBoxId(quickPeek.selectedBox?.box_id) ===
          notesEmphasisBoxId
        }
        surface={quickPeekSurface}
        canSelectPrevious={quickPeek.canSelectPrevious}
        canSelectNext={quickPeek.canSelectNext}
        onPrevious={() => {
          setNotesEmphasisBoxId('');
          setQuickPeekSurface('items');
          quickPeek.selectPrevious();
        }}
        onNext={() => {
          setNotesEmphasisBoxId('');
          setQuickPeekSurface('items');
          quickPeek.selectNext();
        }}
        onToggleExpanded={() =>
          quickPeek.setExpanded((current) => !current)
        }
        onSetExpanded={quickPeek.setExpanded}
        onShowItems={() => {
          setNotesEmphasisBoxId('');
          setQuickPeekSurface('items');
        }}
        onClose={handleCloseQuickPeek}
        onOpenFullBox={quickPeek.openFullBox}
      />
    </S.Container>
  );
}

function OrphanedAttentionPanel({ count = 0, ambientQuiet = false }) {
  const resolvedCount = Math.max(0, Number(count) || 0);

  return (
    <S.NodeSection
      $isRoot
      $depth={0}
      $ambientQuiet={ambientQuiet}
      style={{
        '--box-primary': '#A7B6FF',
        '--box-primary-rgb': '167, 182, 255',
        '--box-secondary': '#67D9D3',
        '--box-secondary-rgb': '103, 217, 211',
      }}
    >
      <S.OrphanedRailBack aria-hidden="true" $isRoot $depth={0} />
      <S.RailFront $isRoot $depth={0}>
        <S.OrphanedAttentionLink
          to={ORPHANED_CONTAINER_ROUTE}
          aria-label={`Open ${resolvedCount} Items Adrift ${resolvedCount === 1 ? 'item' : 'items'}`}
          $isRoot
          $depth={0}
          $density="compact"
        >
          <S.BoxBodyRow $density="compact">
            <S.OrphanedSignal aria-hidden="true" $density="compact">
              <span>TRANSIT</span>
              <strong>◇</strong>
            </S.OrphanedSignal>
            <S.OrphanedAttentionCopy>
              <S.OrphanedAttentionKicker>
                UNASSIGNED // ATTENTION QUEUE
              </S.OrphanedAttentionKicker>
              <S.OrphanedAttentionTitle>Items Adrift</S.OrphanedAttentionTitle>
              <S.OrphanedAttentionMeta>
                In transit or intentionally kept outside a box
              </S.OrphanedAttentionMeta>
            </S.OrphanedAttentionCopy>
          </S.BoxBodyRow>
          <S.CardManifest aria-hidden="true" $isRoot $depth={0}>
            <span>
              {resolvedCount} {resolvedCount === 1 ? 'item' : 'items'}
            </span>
          </S.CardManifest>
        </S.OrphanedAttentionLink>
      </S.RailFront>
    </S.NodeSection>
  );
}

function CompactBranch({
  node,
  depth = 0,
  searchQuery = '',
  searchScope = 'all',
  density = 'compact',
  expandedBoxId = '',
  onToggleBox,
}) {
  const [childrenExpanded, setChildrenExpanded] = useState(false);
  const childBoxes = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const group = String(node?.group || '').trim();
  const description = String(node?.description || '').trim();
  const isSystemContainer = !!node?.isSystemContainer;
  const isOrphanedContainer = node?.systemType === 'orphaned';
  const boxTheme = getBoxTheme(node?.box_id, {
    kind: isSystemContainer
      ? isOrphanedContainer
        ? 'orphaned'
        : 'system'
      : undefined,
  });
  const boxThemeStyle = getBoxThemeCssVars(boxTheme);
  const itemQtyTotal = getNodeItemCount(node);
  const title = node.label || node.name || 'Untitled';
  const route = isOrphanedContainer ? ORPHANED_CONTAINER_ROUTE : `/boxes/${node.box_id}`;
  const autoExpandChildren = hasMatchingDescendant(node, searchQuery, searchScope);
  const showChildren =
    childBoxes.length > 0 &&
    (depth < 2 || childrenExpanded || autoExpandChildren);
  const nestedCount = countDescendants(node);
  const branchId = String(node?._id || node?.box_id || 'terminal-box');
  const expanded = expandedBoxId === branchId;
  const panelId = `terminal-items-${branchId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  const toggleChildren = (event) => {
    event.stopPropagation();
    setChildrenExpanded((prev) => !prev);
  };

  return (
    <S.TerminalBranch $depth={depth} style={boxThemeStyle}>
      <S.TerminalRow
        type="button"
        role="treeitem"
        aria-expanded={expanded}
        aria-controls={panelId}
        $depth={depth}
        $isSystem={isSystemContainer}
        $density={density}
        onClick={() => onToggleBox?.(branchId)}
      >
        <S.TerminalBoxCell $depth={depth}>
          <S.TreeGlyph aria-hidden="true" $depth={depth} $expanded={expanded}>
            ›
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
      </S.TerminalRow>

      {expanded ? (
        <TerminalItemTable
          boxTitle={title}
          boxHref={route}
          panelId={panelId}
          items={node.items}
        />
      ) : null}

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
              expandedBoxId={expandedBoxId}
              onToggleBox={onToggleBox}
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
  selectedBoxId = '',
  onOpenQuickPeek,
  onOpenPhotoQuickPeek,
  onOpenNotesQuickPeek,
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
  const boxTheme = getBoxTheme(node?.box_id, {
    kind: isSystemContainer
      ? isOrphanedContainer
        ? 'orphaned'
        : 'system'
      : undefined,
  });
  const boxThemeStyle = getBoxThemeCssVars(boxTheme);

  const itemQtyTotal = getNodeItemCount(node);
  const matchingItems = getMatchingItemNames(node, searchQuery, searchScope);
  const visibleTags = density === 'roomy' ? tags : tags.slice(0, 3);
  const hiddenTagCount = Math.max(0, tags.length - visibleTags.length);
  const autoExpandChildren = hasMatchingDescendant(node, searchQuery, searchScope);
  const showChildren =
    childBoxes.length > 0 &&
    (depth < 2 || childrenExpanded || autoExpandChildren);
  const nestedCount = countDescendants(node);
  const isSelected =
    !isSystemContainer &&
    normalizeBoxId(node?.box_id) === normalizeBoxId(selectedBoxId);

  const go = (event) => {
    if (
      event.target instanceof Element &&
      event.target !== event.currentTarget &&
      event.target.closest('button, a')
    ) {
      return;
    }
    if (isOrphanedContainer) {
      navigate(ORPHANED_CONTAINER_ROUTE);
      return;
    }
    onOpenQuickPeek?.(node, event.currentTarget);
  };

  const handleCardKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    go(event);
  };

  const openNotes = (event) => {
    event.stopPropagation();
    onOpenNotesQuickPeek?.(node, event.currentTarget);
  };

  const openPhoto = (event) => {
    event.stopPropagation();
    onOpenPhotoQuickPeek?.(node, event.currentTarget);
  };

  const toggleChildren = (event) => {
    event.stopPropagation();
    setChildrenExpanded((prev) => !prev);
  };

  return (
    <S.NodeSection
      id={
        isSystemContainer
          ? undefined
          : getOperationsBoxAnchorId(node?.box_id)
      }
      $isRoot={isRoot}
      $depth={depth}
      style={boxThemeStyle}
    >
      <S.RailBack
        aria-hidden="true"
        $isRoot={isRoot}
        $depth={depth}
        $selected={isSelected}
      />
      <S.RailFront $isRoot={isRoot} $depth={depth}>
        <S.BoxCard
          as="div"
          role="button"
          tabIndex={0}
          onClick={go}
          onKeyDown={handleCardKeyDown}
          aria-label={
            isOrphanedContainer
              ? 'Open Items Adrift'
              : `Preview box ${node.box_id}, ${
                  node.label || node.name || 'Untitled'
                }`
          }
          aria-expanded={isSystemContainer ? undefined : isSelected}
          aria-controls={
            isSystemContainer ? undefined : 'operations-box-quick-peek'
          }
          data-operations-box-preview-trigger={
            isSystemContainer ? undefined : 'true'
          }
          $isRoot={isRoot}
          $depth={depth}
          $isSystem={isSystemContainer}
          $density={density}
          $selected={isSelected}
        >
          <S.BoxBodyRow $density={density}>
            {boxImageUrl ? (
              <S.BoxImageTrigger
                $density={density}
                aria-label={`View box photo for ${node.label || node.name || `box ${node.box_id}`}`}
                title="Open box photo preview"
                data-operations-box-preview-trigger="true"
                onClick={openPhoto}
              >
                <S.BoxImage
                  src={boxImageUrl}
                  alt={`${node.label || node.name || `Box ${node.box_id || ''}`} image`}
                />
              </S.BoxImageTrigger>
            ) : (
              <S.BoxImageFrame $density={density}>
                <S.BoxImagePlaceholder>No image</S.BoxImagePlaceholder>
              </S.BoxImageFrame>
            )}

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
                  {isOrphanedContainer ? 'Items Adrift' : node.label || node.name || 'Untitled'}
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

              {description && density === 'roomy' ? (
                <S.BoxSummary $density={density}>{description}</S.BoxSummary>
              ) : null}

              {isSystemContainer ? (
                <S.BoxSummary $density={density}>Virtual system container</S.BoxSummary>
              ) : null}

              {(visibleTags.length > 0 || notes) && (
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
                  {notes ? (
                    <S.NotesSignal
                      type="button"
                      aria-label={`Show notes for ${node.label || node.name || `box ${node.box_id}`}`}
                      title="Open quick peek with notes"
                      onClick={openNotes}
                    >
                      N
                    </S.NotesSignal>
                  ) : null}
                </S.TagRow>
              )}

              {matchingItems.length > 0 ? (
                <S.MatchSummary>
                  Matches: {matchingItems.join(', ')}
                </S.MatchSummary>
              ) : null}

              <S.BoxFooter>
                {isOrphanedContainer || childBoxes.length > 0 ? (
                  <S.StatPill $variant="boxes" $isRoot={isRoot} $depth={depth}>
                    {isOrphanedContainer
                      ? 'virtual'
                      : `${childBoxes.length} ${childBoxes.length === 1 ? 'box' : 'boxes'}`}
                  </S.StatPill>
                ) : null}
                <S.StatPill $variant="items" $isRoot={isRoot} $depth={depth}>
                  {itemQtyTotal} {itemQtyTotal === 1 ? 'item' : 'items'}
                </S.StatPill>
                {isOrphanedContainer ? (
                  <S.StatPill $isRoot={isRoot} $depth={depth}>
                    unassigned
                  </S.StatPill>
                ) : null}
              </S.BoxFooter>

            </S.BoxContent>
          </S.BoxBodyRow>
          <S.CardManifest aria-hidden="true" $isRoot={isRoot} $depth={depth}>
            {isOrphanedContainer || childBoxes.length > 0 ? (
              <>
                <span>
                  {isOrphanedContainer
                    ? 'virtual'
                    : `${childBoxes.length} ${childBoxes.length === 1 ? 'box' : 'boxes'}`}
                </span>
                <S.CardManifestMuted>//</S.CardManifestMuted>
              </>
            ) : null}
            <span>{itemQtyTotal} {itemQtyTotal === 1 ? 'item' : 'items'}</span>
          </S.CardManifest>
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
                selectedBoxId={selectedBoxId}
                onOpenQuickPeek={onOpenQuickPeek}
                onOpenPhotoQuickPeek={onOpenPhotoQuickPeek}
                onOpenNotesQuickPeek={onOpenNotesQuickPeek}
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

function flattenPreviewBoxes(nodes) {
  const flattened = [];

  const walk = (list) => {
    for (const node of list || []) {
      if (!node?.isSystemContainer && normalizeBoxId(node?.box_id)) {
        flattened.push(node);
      }
      walk(node?.childBoxes);
    }
  };

  walk(nodes);
  return flattened;
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
    keepPriorityFilter = 'all',
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
        keepPriorityFilter,
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
    keepPriorityFilter = 'all',
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
  const normalizedPriorityFilter =
    keepPriorityFilter === 'all' ? '' : normalizeKeepPriority(keepPriorityFilter);
  const matchesKeepPriority =
    !normalizedPriorityFilter ||
    hasItemWithKeepPriority(node?.items, normalizedPriorityFilter);

  return (
    matchesSearch &&
    matchesFilter &&
    matchesCategory &&
    matchesLocation &&
    matchesGroup &&
    matchesOwner &&
    matchesKeepPriority
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

function hasItemWithKeepPriority(items, priorityFilter) {
  if (!priorityFilter) return true;
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.some(
    (item) => normalizeKeepPriority(item?.keepPriority) === priorityFilter,
  );
}

function filterOrphanedItems(
  items,
  {
    searchQuery = '',
    boxLocatorQuery = '',
    filterBy = 'all',
    categoryFilter = 'all',
    locationFilter = 'all',
    groupFilter = 'all',
    ownerFilter = 'all',
    keepPriorityFilter = 'all',
    locations = [],
  } = {},
) {
  if (normalizeBoxId(boxLocatorQuery)) return [];
  if (filterBy !== 'all' || groupFilter !== 'all') return [];
  if (keepPriorityFilter === 'gone') return [];

  const terms = normalize(searchQuery).split(/\s+/).filter(Boolean);
  const normalizedCategory =
    categoryFilter === 'all' ? 'all' : normalizeItemCategory(categoryFilter);
  const normalizedOwner = normalize(ownerFilter);
  const normalizedPriority =
    keepPriorityFilter === 'all' ? '' : normalizeKeepPriority(keepPriorityFilter);
  const selectedLocation = (locations || []).find(
    (location) => String(location?._id || '') === String(locationFilter),
  );
  const normalizedLocation = normalize(selectedLocation?.name || locationFilter);

  return (items || []).filter((item) => {
    const haystack = normalize(
      [
        item?.name,
        item?.label,
        item?.description,
        item?.notes,
        item?.category,
        item?.location,
        item?.primaryOwnerName,
        item?.keepPriority,
        ...(Array.isArray(item?.tags) ? item.tags : []),
      ]
        .filter(Boolean)
        .join(' '),
    );
    const matchesTerms = terms.every((term) => haystack.includes(term));
    const matchesCategory =
      normalizedCategory === 'all' ||
      normalizeItemCategory(item?.category) === normalizedCategory;
    const matchesLocation =
      locationFilter === 'all' || normalize(item?.location) === normalizedLocation;
    const matchesOwner =
      normalizedOwner === 'all' ||
      normalize(item?.primaryOwnerName) === normalizedOwner;
    const matchesPriority =
      !normalizedPriority ||
      normalizeKeepPriority(item?.keepPriority) === normalizedPriority;

    return (
      matchesTerms &&
      matchesCategory &&
      matchesLocation &&
      matchesOwner &&
      matchesPriority
    );
  });
}

function collectDecommissionedItemsFromBoxes(nodes, target = []) {
  for (const box of nodes || []) {
    for (const item of box?.items || []) {
      if (normalizeKeepPriority(item?.keepPriority) !== 'decommissioned') continue;
      target.push({
        ...item,
        operationsBox: box,
      });
    }
    collectDecommissionedItemsFromBoxes(box?.childBoxes, target);
  }
  return target;
}

function mergeItemsById(...collections) {
  const byId = new Map();
  let anonymousIndex = 0;

  for (const items of collections) {
    for (const item of items || []) {
      const id = String(item?._id || item?.id || '').trim();
      const key = id || `anonymous-${anonymousIndex++}`;
      byId.set(key, { ...byId.get(key), ...item });
    }
  }

  return [...byId.values()];
}

function flattenAllBoxes(nodes, target = []) {
  for (const node of nodes || []) {
    target.push(node);
    flattenAllBoxes(node?.childBoxes, target);
  }
  return target;
}

function attachArchivedBoxContext(items, boxes) {
  const byMongoId = new Map(
    flattenAllBoxes(boxes, []).map((box) => [String(box?._id || ''), box]),
  );

  return (items || []).map((item) => ({
    ...item,
    operationsBox:
      item?.box || byMongoId.get(String(item?.last_active_box || '')) || null,
  }));
}

function filterArchivedItems(
  items,
  {
    searchQuery = '',
    categoryFilter = 'all',
    locationFilter = 'all',
    groupFilter = 'all',
    ownerFilter = 'all',
    sortBy = 'boxId',
    sortDirection = 'asc',
  } = {},
) {
  const terms = normalize(searchQuery).split(/\s+/).filter(Boolean);
  const normalizedCategory =
    categoryFilter === 'all' ? 'all' : normalizeItemCategory(categoryFilter);
  const normalizedGroup = normalize(groupFilter);
  const normalizedOwner = normalize(ownerFilter);

  const filtered = (items || []).filter((item) => {
    const box = item?.operationsBox;
    const haystack = normalize([
      item?.name,
      item?.description,
      item?.notes,
      item?.disposition,
      item?.disposition_notes,
      item?.category,
      item?.primaryOwnerName,
      item?.keepPriority,
      ...(Array.isArray(item?.tags) ? item.tags : []),
      box?.box_id,
      box?.label,
      box?.location,
      box?.group,
    ].filter(Boolean).join(' '));
    const matchesTerms = terms.every((term) => haystack.includes(term));
    const matchesCategory =
      normalizedCategory === 'all' ||
      normalizeItemCategory(item?.category) === normalizedCategory;
    const matchesLocation =
      locationFilter === 'all' ||
      String(getLocationId(box) || '') === String(locationFilter);
    const matchesGroup =
      normalizedGroup === 'all' || normalize(box?.group) === normalizedGroup;
    const matchesOwner =
      normalizedOwner === 'all' ||
      normalize(item?.primaryOwnerName) === normalizedOwner;

    return matchesTerms && matchesCategory && matchesLocation && matchesGroup && matchesOwner;
  });

  const direction = sortDirection === 'desc' ? -1 : 1;
  return filtered.sort((a, b) => {
    const aBox = a?.operationsBox || {};
    const bBox = b?.operationsBox || {};
    if (sortBy === 'location') {
      return compareText(aBox.location, bBox.location) * direction ||
        compareText(a?.name, b?.name) * direction;
    }
    if (sortBy === 'group') {
      return compareText(aBox.group, bBox.group) * direction ||
        compareText(a?.name, b?.name) * direction;
    }
    if (sortBy === 'boxId') {
      return compareNodeBoxId(aBox, bBox) * direction ||
        compareText(a?.name, b?.name) * direction;
    }
    return compareText(a?.name, b?.name) * direction;
  });
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

function findBoxById(nodes, boxId) {
  const normalizedId = normalizeBoxId(boxId);
  if (!normalizedId) return null;

  for (const node of nodes || []) {
    if (normalizeBoxId(node?.box_id) === normalizedId) return node;
    const nestedMatch = findBoxById(node?.childBoxes, normalizedId);
    if (nestedMatch) return nestedMatch;
  }

  return null;
}
