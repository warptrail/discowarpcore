import { normalizeBoxAddress, parseBoxAddress } from '../util/boxAddress';
import { buildBoxViewTree, scopeBoxViews, findAddressView, viewAddress, compareFamilyViews } from '../util/boxAddressViews';
import { useMissingItems } from './MissingItems/MissingItemsContext';
import MissingBoxStatus from './MissingItems/MissingBoxStatus';
import MissingItemsLane from './MissingItems/MissingItemsLane';
// src/views/BoxList.jsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom';
import { styledComponents as S } from '../styles/BoxList.styles';
import InventoryGridHeader from './InventoryGridHeader';
import useIsMobile from '../hooks/useIsMobile';
import InspectorFrame from './DesktopWorkspace/InspectorFrame';
import OperationsInventoryGrid, { OperationsWorkspace } from './OperationsInventory/OperationsInventoryGrid';
import OrphanedAttentionPanel from './OrphanedAttentionPanel';
import { filterOrphanedItems } from '../util/operationsAdrift';
import InventorySearchMatches from './InventorySearchMatches';
import { normalizeItemCategory } from '../util/itemCategories';
import { matchesPrimaryOwner } from '../util/itemOwners';
import {
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
import OperationsArchivedItemsLane from './OperationsArchivedItems/OperationsArchivedItemsLane';
import OperationsBoxCard from './OperationsInventory/OperationsBoxCard';
import OperationsDesktopTree from './OperationsInventory/OperationsDesktopTree';
import OperationsInspectorIdle from './OperationsInventory/OperationsInspectorIdle';
import { getTreeNodeKey } from './OperationsInventory/operationsTreeLayout';
import { API_BASE } from '../api/API_BASE';
import { normalizeKeepPriority } from '../util/keepPriority';
import { resolveOperationsLocationFilter, matchesOperationsLocation } from '../util/operationsLocationFilter';
import { INVENTORY_QUICK_ANSWER_EVENT, OPERATIONS_QUICK_PEEK_CLOSE_EVENT } from '../constants/inventoryFinderEvents';
import { getBoxThumbnailUrl } from '../util/itemImage';
import { OPERATIONS_SCROLL_RESTORE_STATE } from '../util/operationsReturnPosition';

import { buildQuickAnswers } from './InventoryQuickAnswer/quickAnswerModel';
import { countMatchingInventoryBoxes, getMatchingInventoryItems, matchesInventoryQuery as matchesQuery } from '../util/inventorySearch';

const ORPHANED_CONTAINER_ROUTE = '/operations?peek=adrift';

/**
 * boxes: [{
 *   _id, box_id, label, location, description, notes,
 *   tags: string[], items: [{ _id, name, quantity }],
 *   childBoxes: same[]
 * }]
 */
export default function BoxList({
  boxes = [],
  dataLoading = false,
  dataError = '',
  orphanedCount = 0,
  orphanedItems = [],
  locations = [],
  pagination = {},
  onPageChange,
  onInventoryQueryChange,
  onOperationsDataRefreshRequest,
  onOrphanedItemCreated,
}) {
  const { items: missingItems } = useMissingItems();
  const desktop = !useIsMobile(1099);
  const [inspectorTarget, setInspectorTarget] = useState(null);
  const [boxFieldEdit, setBoxFieldEdit] = useState(null);
  const location = useLocation();
  const navigationType = useNavigationType();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quickCreatedBoxes, setQuickCreatedBoxes] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  const [searchQuery, setSearchQueryValue] = useState(() => searchParams.get('q') || '');
  const setSearchQuery = useCallback((value) => {
    setSearchQueryValue(value);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set('q', value);
      else next.delete('q');
      return next;
    }, { replace: true, state: location.state });
  }, [location.state, setSearchParams]);
  useEffect(() => {
    if (navigationType === 'POP') { setSearchQueryValue(searchParams.get('q') || ''); }
  }, [navigationType, searchParams]);
  const [searchScope, setSearchScope] = useState('all');
  const density = 'compact';
  const inventoryGridRef = useRef(null);
  const [expandedBoxKeys, setExpandedBoxKeys] = useState(() => new Set());
  const [branchConsole, setBranchConsole] = useState({ activeKey: null, dismissed: false });
  const toggleDesktopBranch = useCallback((node) => {
    const key = getTreeNodeKey(node);
    setExpandedBoxKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const isSearchExpanded = useCallback(
    (node) => hasMatchingDescendant(node, searchQuery, searchScope),
    [searchQuery, searchScope],
  );
  const boxLocatorQuery = normalizeBoxAddress(searchParams.get('addressScope') || searchParams.get('boxPrefix'));
  const setBoxLocatorQuery = useCallback(value => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      next.delete('boxPrefix');
      if (value) next.set('addressScope', value); else next.delete('addressScope');
      return next;
    }, { replace: true, state: location.state });
  }, [setSearchParams, location.state]);
  const [sortBy, setSortBy] = useState('boxId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const resolvedLocationFilter = useMemo(
    () => resolveOperationsLocationFilter(locationFilter, locations),
    [locationFilter, locations],
  );
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
  const effectiveOrphanedCount = Number(orphanedCount || 0);
  const showingArchivedItems = keepPriorityFilter === 'gone';

  const visibleOrphanedItems = useMemo(
    () =>
      filterOrphanedItems(orphanedItems, {
        searchQuery,
        boxLocatorQuery,
        categoryFilter,
        locationFilter: resolvedLocationFilter,
        ownerFilter,
        keepPriorityFilter,
        locations,
      }),
    [
      orphanedItems,
      searchQuery,
      boxLocatorQuery,
      categoryFilter,
      resolvedLocationFilter,
      ownerFilter,
      keepPriorityFilter,
      locations,
    ],
  );
  const visibleOrphanedCount = visibleOrphanedItems.length;

  const telemetry = useMemo(
    () => summarizeTree(mergedBoxes, effectiveOrphanedCount),
    [mergedBoxes, effectiveOrphanedCount],
  );

  const addressQuery = parseBoxAddress(searchQuery);
  const addressLikeQuery = /^#?\d{3}[a-z0-9]+$/i.test(searchQuery.trim());
  const effectiveAddressScope = boxLocatorQuery || (addressQuery?.complete || addressLikeQuery ? normalizeBoxAddress(searchQuery) : '');
  const effectiveTextQuery = addressQuery?.complete || addressLikeQuery ? '' : searchQuery;
  const boxViews = useMemo(() => buildBoxViewTree(mergedBoxes), [mergedBoxes]);
  const locatorFilteredBoxes = useMemo(() => scopeBoxViews(boxViews, effectiveAddressScope), [boxViews, effectiveAddressScope]);
  const boxLocatorActive = Boolean(effectiveAddressScope);

  const controlledBoxes = useMemo(
    () =>
      applyTreeControls(locatorFilteredBoxes, {
        searchQuery: effectiveTextQuery,
        searchScope,
        sortBy,
        sortDirection,
        categoryFilter,
        locationFilter: resolvedLocationFilter,
        ownerFilter,
        keepPriorityFilter,
      }),
    [
      locatorFilteredBoxes,
      effectiveTextQuery,
      searchScope,
      sortBy,
      sortDirection,
      categoryFilter,
      resolvedLocationFilter,
      ownerFilter,
      keepPriorityFilter,
    ],
  );

  const quickAnswers = useMemo(() => buildQuickAnswers({
    boxes: controlledBoxes, orphanedItems: visibleOrphanedItems, locations, query: searchQuery,
  }), [controlledBoxes, visibleOrphanedItems, locations, searchQuery]);
  const matchingBoxCount = useMemo(() => countMatchingInventoryBoxes(controlledBoxes, (node) => matchesNodeControls(node, {
    query: normalize(searchQuery), searchScope, categoryFilter, locationFilter: resolvedLocationFilter,
    ownerFilter, keepPriorityFilter,
  })), [controlledBoxes, searchQuery, searchScope, categoryFilter, resolvedLocationFilter, ownerFilter, keepPriorityFilter]);
  useEffect(() => {
    const query = boxLocatorActive || showingArchivedItems || searchScope === 'boxes' ? '' : searchQuery.trim();
    window.dispatchEvent(new CustomEvent(INVENTORY_QUICK_ANSWER_EVENT, {
      detail: { query, answers: quickAnswers, matchingBoxCount, loading: dataLoading, error: dataError },
    }));
  }, [boxLocatorActive, showingArchivedItems, searchScope, searchQuery, quickAnswers, matchingBoxCount, dataLoading, dataError]);
  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent(INVENTORY_QUICK_ANSWER_EVENT, {
      detail: { query: '', answers: [] },
    }));
  }, []);

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
      locationFilter: resolvedLocationFilter,
      ownerFilter,
      sortBy,
      sortDirection,
    }),
    [
      combinedArchivedItems,
      searchQuery,
      categoryFilter,
      resolvedLocationFilter,
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
  const boxLocatorExactMatch = useMemo(() => findAddressView(mergedBoxes, effectiveAddressScope), [effectiveAddressScope, mergedBoxes]);
  const filteredTotalPages = Math.max(
    1,
    Math.ceil(visibleTopLevelCount / pageLimit),
  );
  const safeCurrentPage = Math.min(currentPage, filteredTotalPages);
  const pagedVisibleBoxes = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageLimit;
    return controlledBoxes.slice(start, start + pageLimit);
  }, [controlledBoxes, pageLimit, safeCurrentPage]);
  const selectedMissingItem = missingItems.find(item => String(item._id) === searchParams.get('item'));
  const adriftCollection = useMemo(() => ({
    box_id: 'adrift',
    systemType: 'orphaned',
    label: 'Items Adrift',
    description: 'In transit or intentionally kept outside a box',
    items: selectedMissingItem && !selectedMissingItem.box && !visibleOrphanedItems.some(item => String(item._id) === String(selectedMissingItem._id))
      ? [...visibleOrphanedItems, selectedMissingItem] : visibleOrphanedItems,
    childBoxes: [],
  }), [visibleOrphanedItems, selectedMissingItem]);
  const quickPeekBoxes = useMemo(
    () => {
      const current = [adriftCollection, ...flattenPreviewBoxes(boxViews)];
      const exact = findAddressView(mergedBoxes, effectiveAddressScope);
      if (exact && !current.some(box => viewAddress(box) === viewAddress(exact))) current.push(exact);
      if (selectedMissingItem?.box && !current.some(box => String(box._id) === String(selectedMissingItem.box._id))) {
        const home = flattenPreviewBoxes(mergedBoxes).find(box => String(box._id) === String(selectedMissingItem.box._id));
        if (home) current.push(home);
      }
      return current;
    },
    [adriftCollection, boxViews, effectiveAddressScope, selectedMissingItem, mergedBoxes],
  );
  const quickPeek = useOperationsQuickPeek(quickPeekBoxes, {
    ready: effectiveTotalCount > 0 || mergedBoxes.length > 0 || orphanedItems.length > 0,
  });
  const {
    close: closeQuickPeek,
    dismiss: dismissQuickPeek,
    openBox: openQuickPeek,
  } = quickPeek;
  useEffect(() => {
    setBoxFieldEdit((current) => quickPeek.selectedBox?.kind === "cabinet" || (current && current.boxMongoId !== String(quickPeek.selectedBox?._id)) ? null : current);
  }, [quickPeek.selectedBox]);
  const [quickPeekSurface, setQuickPeekSurface] = useState('items');
  const lastAutoActivatedLocatorRef = useRef(searchParams.has('peek') ? effectiveAddressScope : '');
  const appliedScrollRestoreRef = useRef('');
  const pendingPrimaryFinderFocusRef = useRef(null);

  useLayoutEffect(() => {
    const restoreRequest = location.state?.[OPERATIONS_SCROLL_RESTORE_STATE];
    const targetY = Number(restoreRequest?.scrollY);
    if (!Number.isFinite(targetY) || targetY < 0) return undefined;
    const restoreKey = `${Number(restoreRequest?.savedAt) || 0}:${targetY}`;
    if (appliedScrollRestoreRef.current === restoreKey) return undefined;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    let frameId = 0;
    let attempts = 0;
    let settledFrames = 0;
    let cancelled = false;

    const finish = () => {
      appliedScrollRestoreRef.current = restoreKey;
      window.history.scrollRestoration = previousScrollRestoration;
    };

    const restore = () => {
      if (cancelled) return;
      attempts += 1;
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      window.scrollTo({ top: Math.min(targetY, maxScrollY), left: 0, behavior: 'auto' });

      const pageCanReachTarget = maxScrollY >= targetY - 2;
      const reachedTarget = Math.abs(window.scrollY - targetY) <= 2;
      settledFrames = pageCanReachTarget && reachedTarget ? settledFrames + 1 : 0;

      // Hold the coordinate through the header's 280ms layout transition and
      // Quick Peek mount so scroll anchoring cannot shift the final viewport.
      if (settledFrames >= 24 || attempts >= 300) {
        finish();
        return;
      }
      frameId = window.requestAnimationFrame(restore);
    };

    frameId = window.requestAnimationFrame(restore);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [location.state]);


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
    closeQuickPeek();
  }, [closeQuickPeek, showingArchivedItems, setBoxLocatorQuery]);

  useEffect(() => {
    if (!searchParams.has('boxPrefix')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('boxPrefix');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    onInventoryQueryChange?.({
      q: '',
      sortBy,
    });
  }, [
    boxLocatorActive,
    searchQuery,
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

  const handleQuickOrphanCreated = (payload) => {
    onOrphanedItemCreated?.(payload?.item);
    onOperationsDataRefreshRequest?.();
  };

  const handleOpenQuickPeek = useCallback(
    (box, triggerElement) => {
      setQuickPeekSurface('items');
      openQuickPeek(box, triggerElement);
    },
    [openQuickPeek],
  );

  const handleOpenPhotoQuickPeek = useCallback(
    (box, triggerElement) => {
      setQuickPeekSurface('photo');
      openQuickPeek(box, triggerElement, { forceOpen: true });
    },
    [openQuickPeek],
  );

  const handleEditBoxField = useCallback((box, field, triggerElement) => {
    setQuickPeekSurface('items');
    setBoxFieldEdit({ boxMongoId: String(box._id), field });
    openQuickPeek(box, triggerElement, { forceOpen: true });
  }, [openQuickPeek]);

  const handleCloseBoxField = useCallback(() => {
    const request = boxFieldEdit;
    setBoxFieldEdit(null);
    if (!request) return;
    // The original element may have unmounted when switching to mobile and back.
    window.requestAnimationFrame(() => {
      const target = document.querySelector(`[data-box-field-owner="${CSS.escape(request.boxMongoId)}"][data-box-field="${CSS.escape(request.field)}"]`)
        || document.getElementById('operations-box-quick-peek');
      target?.focus({ preventScroll: true });
    });
  }, [boxFieldEdit]);

  const handleCloseQuickPeek = useCallback(() => {
    setBoxFieldEdit(null);
    setQuickPeekSurface('items');
    closeQuickPeek();
  }, [closeQuickPeek]);

  const handleDismissQuickPeek = useCallback(() => {
    setBoxFieldEdit(null);
    setQuickPeekSurface('items');
    dismissQuickPeek();
  }, [dismissQuickPeek]);

  const handlePrimaryFinderInteraction = useCallback((input) => {
    if (desktop || !quickPeek.selectedBox || !(input instanceof HTMLInputElement)) return;
    pendingPrimaryFinderFocusRef.current = input;
    handleCloseQuickPeek();
  }, [desktop, handleCloseQuickPeek, quickPeek.selectedBox]);

  useEffect(() => {
    if (quickPeek.selectedBox || !pendingPrimaryFinderFocusRef.current) return undefined;

    const input = pendingPrimaryFinderFocusRef.current;
    pendingPrimaryFinderFocusRef.current = null;
    const frameId = window.requestAnimationFrame(() => {
      if (input.isConnected) input.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [quickPeek.selectedBox]);

  useEffect(() => {
    window.addEventListener(OPERATIONS_QUICK_PEEK_CLOSE_EVENT, handleCloseQuickPeek);
    return () => window.removeEventListener(
      OPERATIONS_QUICK_PEEK_CLOSE_EVENT,
      handleCloseQuickPeek,
    );
  }, [handleCloseQuickPeek]);

  const activateExactBox = useCallback((value) => {
    const exactMatch = typeof value === 'string' ? findAddressView(mergedBoxes, value) : boxLocatorExactMatch;
    const exactId = viewAddress(exactMatch);
    if (!exactId) return;
    lastAutoActivatedLocatorRef.current = exactId;
    const anchor = document.getElementById(getOperationsBoxAnchorId(exactId));
    anchor?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [boxLocatorExactMatch, mergedBoxes]);

  useEffect(() => {
    if (dataLoading || !parseBoxAddress(effectiveAddressScope)?.complete || !boxLocatorExactMatch) {
      lastAutoActivatedLocatorRef.current = '';
      return;
    }
    if (lastAutoActivatedLocatorRef.current === effectiveAddressScope) return;
    const timer = window.setTimeout(() => activateExactBox(effectiveAddressScope), 400);
    return () => window.clearTimeout(timer);
  }, [activateExactBox, boxLocatorExactMatch, dataLoading, effectiveAddressScope]);

  useEffect(() => {
    onPageChange?.(1);
  }, [
    searchQuery,
    sortBy,
    sortDirection,
    boxLocatorQuery,
    categoryFilter,
    locationFilter,
    ownerFilter,
    keepPriorityFilter,
    onPageChange,
  ]);

  useEffect(() => {
    if (currentPage <= filteredTotalPages) return;
    onPageChange?.(filteredTotalPages);
  }, [currentPage, filteredTotalPages, onPageChange]);

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
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        keepPriorityFilter={keepPriorityFilter}
        onKeepPriorityFilterChange={setKeepPriorityFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        density={density}
        onQuickBoxCreated={handleQuickBoxCreated}
        onQuickOrphanCreated={handleQuickOrphanCreated}
        onPrimaryFinderInteraction={handlePrimaryFinderInteraction}
        locations={locations}
      />

      <OperationsWorkspace>
      <OperationsInventoryGrid $lookupAddress={!quickPeek.selectedBox && boxLocatorExactMatch ? (boxLocatorExactMatch.scopedAddress || viewAddress(boxLocatorExactMatch)) : null} ref={inventoryGridRef} $cards={viewMode === 'cards' && !showingArchivedItems}>
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
            onOpen={(trigger) => handleOpenQuickPeek(adriftCollection, trigger)}
            selected={quickPeek.selectedBoxId === 'adrift'}
            count={visibleOrphanedCount}
            items={visibleOrphanedItems}
            searchQuery={searchQuery}
            ambientQuiet={!desktop && Boolean(quickPeek.selectedBox)}
            desktop={desktop && viewMode !== 'terminal'}
          />
        ) : null
      )}

      <MissingItemsLane searchQuery={searchQuery} searchScope={searchScope} />
      {showingArchivedItems ? null : noData ? (
        <S.EmptyMessage>No boxes yet.</S.EmptyMessage>
      ) : hasNoMatches ? (
        <S.EmptyMessage role={effectiveAddressScope ? 'alert' : undefined}>{effectiveAddressScope && (!parseBoxAddress(effectiveAddressScope) || (parseBoxAddress(effectiveAddressScope).complete && !boxLocatorExactMatch)) ? `Address #${effectiveAddressScope} is invalid or does not exist. Use a recorded cabinet and a shelf from 1 through 99.` : 'No inventory matches the current search/filter.'}</S.EmptyMessage>
      ) : (
        <>
          {viewMode === 'terminal' ? (
            <S.TerminalTable role="region" aria-label="Box directory">
              {pagedVisibleBoxes.map((node) => (
                <CompactBranch
                  key={node.resultKey || node._id || node.box_id}
                  node={node}
                  depth={0}
                  searchQuery={effectiveTextQuery}
                  searchScope={searchScope}
                  density={density}
                />
              ))}
            </S.TerminalTable>
          ) : desktop ? (
            <OperationsDesktopTree
              nodes={pagedVisibleBoxes}
              inspectorTarget={inspectorTarget}
              occupied={Boolean(quickPeek.selectedBox)}
              onInspect={handleOpenQuickPeek}
              onEditBoxField={handleEditBoxField}
              onShowTree={handleDismissQuickPeek}
              expandedKeys={expandedBoxKeys}
              consoleState={branchConsole}
              setConsoleState={setBranchConsole}
              isSearchExpanded={isSearchExpanded}
              onToggle={toggleDesktopBranch}
              renderBox={(node, treeControls) => (
                <Branch node={node} depth={treeControls.depth} desktop treeControls={treeControls}
                  searchQuery={effectiveTextQuery} searchScope={searchScope} density={density}
                  selectedBoxId={quickPeek.selectedBoxId}
                  onOpenQuickPeek={handleOpenQuickPeek} onOpenPhotoQuickPeek={handleOpenPhotoQuickPeek}
                  onEditBoxField={handleEditBoxField} />
              )}
            />
          ) : (
            <>
              {pagedVisibleBoxes.map((node) => (
                <Branch
                  key={node.resultKey || node._id || node.box_id}
                  node={node}
                  depth={0}
                  desktop={desktop}
                  searchQuery={effectiveTextQuery}
                  searchScope={searchScope}
                  density={density}
                  selectedBoxId={quickPeek.selectedBoxId}
                  onOpenQuickPeek={handleOpenQuickPeek}
                  onOpenPhotoQuickPeek={handleOpenPhotoQuickPeek}
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
            aria-label={`Page ${safeCurrentPage} of ${filteredTotalPages}. ${visibleTopLevelCount} matching box and section rows. ${visibleBoxCount} of ${telemetry.totalBoxes} boxes shown.`}
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

      </OperationsInventoryGrid>
      <InspectorFrame ref={setInspectorTarget} $open>
      <OperationsInspectorIdle target={inspectorTarget} occupied={Boolean(quickPeek.selectedBox) || (desktop && viewMode === 'cards' && !branchConsole.dismissed && pagedVisibleBoxes.some(node => node.childBoxes?.length && (expandedBoxKeys.has(getTreeNodeKey(node)) || isSearchExpanded(node))))} />
      {quickPeek.selectedBox ? <OperationsBoxQuickPeek
        locations={locations}
        portalTarget={inspectorTarget}
        presentation="dock"
        onItemSaved={onOperationsDataRefreshRequest}
        boxFieldEdit={boxFieldEdit}
        onCloseBoxField={handleCloseBoxField}
        onBoxSaved={(updated) => {
          onOperationsDataRefreshRequest?.();
          if (updated.box_id !== quickPeek.selectedBox?.box_id) handleDismissQuickPeek();
        }}
        onShelfChange={quickPeek.selectShelf}
        box={quickPeek.selectedBox}
        matchingItems={boxLocatorActive ? [] : getMatchingItems(quickPeek.selectedBox, searchQuery, searchScope)}
        position={quickPeek.selectedIndex + 1}
        total={quickPeek.totalBoxes}
        expanded={quickPeek.expanded}
        closing={quickPeek.closing}
        transitionDirection={quickPeek.transitionDirection}
        surface={quickPeekSurface}
        canSelectPrevious={quickPeek.canSelectPrevious}
        canSelectNext={quickPeek.canSelectNext}
        onPrevious={() => {
          setQuickPeekSurface('items');
          quickPeek.selectPrevious();
        }}
        onNext={() => {
          setQuickPeekSurface('items');
          quickPeek.selectNext();
        }}
        onToggleExpanded={() =>
          quickPeek.setExpanded((current) => !current)
        }
        onSetExpanded={quickPeek.setExpanded}
        onShowItems={() => {
          setQuickPeekSurface('items');
        }}
        onClose={handleCloseQuickPeek}
        onDismiss={handleDismissQuickPeek}
        onOpenFullBox={quickPeek.openFullBox}
      /> : null}
      </InspectorFrame>
      </OperationsWorkspace>
    </S.Container>
  );
}


export function CompactBranch({
  node,
  depth = 0,
  searchQuery = '',
  searchScope = 'all',
  density = 'compact',
}) {
  const [childrenExpanded, setChildrenExpanded] = useState(false);
  const childBoxes = Array.isArray(node.childBoxes) ? node.childBoxes : [];
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
  const title = node.label || node.name || 'Untitled';
  const autoExpandChildren = hasMatchingDescendant(node, searchQuery, searchScope);
  const showChildren =
    childBoxes.length > 0 &&
    (depth < 2 || childrenExpanded || autoExpandChildren);
  const nestedCount = countDescendants(node);
  const branchId = String(node?.resultKey || node?._id || node?.box_id || 'terminal-box');
  const headingId = `terminal-box-${branchId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const matchingItems = searchQuery.trim() ? getMatchingItems(node, searchQuery, searchScope) : node.items || [];

  const toggleChildren = (event) => {
    event.stopPropagation();
    setChildrenExpanded((prev) => !prev);
  };

  return (
    <S.TerminalBranch as="section" aria-labelledby={headingId} id={getOperationsBoxAnchorId(node.scopedAddress || viewAddress(node))} $depth={depth} style={boxThemeStyle}>
      <S.TerminalGroupHeader>
      <S.TerminalRow id={headingId} data-box-address={node.scopedAddress || viewAddress(node)}>
        <S.TerminalBoxCell $depth={depth}>
          <S.TerminalShortId $depth={depth} $isSystem={isSystemContainer}>
            {isSystemContainer ? 'SYS' : `#${viewAddress(node)}`}
          </S.TerminalShortId>
          <S.TerminalTitle>{title}{node.kind === "cabinet" ? ` · Section in #${node.box_id} · ${node.shelfCount} shelves` : node.isComplexBox ? " · Complex box" : ""}</S.TerminalTitle><MissingBoxStatus box={node} />
        </S.TerminalBoxCell>
      </S.TerminalRow>
      <S.TerminalOpenLink to={isOrphanedContainer ? ORPHANED_CONTAINER_ROUTE : `/boxes/${viewAddress(node)}`}
        aria-label={`Open full box page for ${title}`} title="Open full box">↗</S.TerminalOpenLink>
      </S.TerminalGroupHeader>

      {matchingItems.length > 0 ? (
        <InventorySearchMatches
          items={matchingItems}
          boxId={node.systemType === 'orphaned' ? 'adrift' : node.box_id}
          query={searchQuery}
          label={`Matching items in box ${node.box_id}`}
          terminal
          nested
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
              key={child.resultKey || child._id || child.box_id}
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
  desktop = false,
  treeControls = null,
  searchQuery = '',
  searchScope = 'all',
  density = 'compact',
  selectedBoxId = '',
  onOpenQuickPeek,
  onOpenPhotoQuickPeek,
  onEditBoxField,
}) {
  const [childrenExpanded, setChildrenExpanded] = useState(false);
  const childBoxes = Array.isArray(node.childBoxes) ? node.childBoxes : [];
  const tags = getRenderableBoxTags(node);
  const description = String(node?.description || '').trim();
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
  const matchingItems = getMatchingItems(node, searchQuery, searchScope);
  const matchingNotes = getMatchingNoteLabels(node, searchQuery, searchScope);
  const visibleTags = density === 'roomy' ? tags : tags.slice(0, 3);
  const hiddenTagCount = Math.max(0, tags.length - visibleTags.length);
  const autoExpandChildren = hasMatchingDescendant(node, searchQuery, searchScope);
  const showChildren = treeControls ? treeControls.expanded :
    childBoxes.length > 0 &&
    ((!desktop && depth < 2) || childrenExpanded || autoExpandChildren);
  const nestedCount = countDescendants(node);
  const isSelected =
    !isSystemContainer &&
    (viewAddress(node) === selectedBoxId || (node.kind === 'cabinet' && viewAddress(node) === `${parseBoxAddress(selectedBoxId)?.boxId}${parseBoxAddress(selectedBoxId)?.cabinet}`));

  const go = (event) => {
    if (
      event.target instanceof Element &&
      event.target !== event.currentTarget &&
      event.target.closest('button, a')
    ) {
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
          : getOperationsBoxAnchorId(node.scopedAddress || viewAddress(node))
      }
      $isRoot={isRoot}
      $depth={depth}
      data-nesting-expanded={treeControls?.expanded || undefined}
      style={boxThemeStyle}
    >
      <S.RailBack
        aria-hidden="true"
        $isRoot={isRoot}
        $depth={depth}
        $selected={isSelected}
      />
      <S.RailFront $isRoot={isRoot} $depth={depth}>
        <OperationsBoxCard model={{
          node, depth, density, isRoot, isSystemContainer, isOrphanedContainer,
          isSelected, boxImageUrl, go, handleCardKeyDown, openPhoto, itemQtyTotal,
          visibleTags, hiddenTagCount, description, matchingNotes, childBoxes,
          nestedToggle: childBoxes.length ? treeControls : null,
          matchingItems: treeControls ? matchingItems : undefined,
          searchQuery, onEditBoxField: node.kind === "cabinet" ? undefined : onEditBoxField,
        }} />
        {!treeControls && matchingItems.length > 0 ? (
          <InventorySearchMatches
            items={matchingItems}
            boxId={node.systemType === 'orphaned' ? 'adrift' : node.box_id}
            query={searchQuery}
            label={`Matching items in box ${node.box_id}`}
            nested
          />
        ) : null}

        {!treeControls && childBoxes.length > 0 && (desktop || depth >= 2) ? (
          <S.NestedChildrenToggle
            type="button"
            aria-expanded={showChildren}
            onClick={toggleChildren}
          >
            <span>{showChildren ? 'Hide' : 'Show'} {nestedCount} nested {nestedCount === 1 ? 'box' : 'boxes'}</span>
            <S.NestedChildrenIcon aria-hidden="true">{showChildren ? '−' : '+'}</S.NestedChildrenIcon>
          </S.NestedChildrenToggle>
        ) : null}

        {!treeControls && showChildren && (
          <S.NodeChildren $depth={depth + 1} $density={density}>
            {childBoxes.map((child) => (
              <Branch
                key={child.resultKey || child._id || child.box_id}
                node={child}
                depth={depth + 1}
                desktop={desktop}
                searchQuery={searchQuery}
                searchScope={searchScope}
                density={density}
                selectedBoxId={selectedBoxId}
                onOpenQuickPeek={onOpenQuickPeek}
                onOpenPhotoQuickPeek={onOpenPhotoQuickPeek}
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
      if (node.kind !== "cabinet") { summary.totalBoxes += 1; summary.totalItems += sumItemQty(node.items); }
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
    categoryFilter = 'all',
    locationFilter = 'all',
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
        categoryFilter,
        locationFilter,
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
    categoryFilter = 'all',
    locationFilter = 'all',
    ownerFilter = 'all',
    keepPriorityFilter = 'all',
  } = {},
) {
  const matchesSearch = !query || matchesQuery(node, query, searchScope);
  const normalizedCategoryFilter =
    categoryFilter === 'all'
      ? 'all'
      : normalizeItemCategory(categoryFilter);
  const matchesCategory =
    normalizedCategoryFilter === 'all' ||
    hasItemWithCategory(node?.items, normalizedCategoryFilter);
  const matchesLocation = matchesOperationsLocation(node, locationFilter);
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
    matchesCategory &&
    matchesLocation &&
    matchesOwner &&
    matchesKeepPriority
  );
}

function sortNodes(nodes, sortBy, sortDirection = 'asc') {
  const list = [...(nodes || [])];
  const directionFactor = sortDirection === 'desc' ? -1 : 1;

  list.sort((a, b) => {
    if (a.box_id === b.box_id) return compareFamilyViews(a, b, sortBy, sortDirection);
    const aFamily = a.ownerBox || a, bFamily = b.ownerBox || b;
    a = aFamily; b = bFamily;
    const aName = normalize(a?.label || a?.name || '');
    const bName = normalize(b?.label || b?.name || '');
    let diff = 0;


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

const getMatchingItems = getMatchingInventoryItems;

function getMatchingNoteLabels(node, query, searchScope = 'all') {
  if (!query) return [];
  const normalizedQuery = normalize(query);
  const labels = [];

  if (
    searchScope !== 'items' &&
    normalize(node?.notes).includes(normalizedQuery)
  ) {
    labels.push('Box notes');
  }

  if (searchScope === 'boxes') return labels;

  const matchingItemNames = (Array.isArray(node?.items) ? node.items : [])
    .filter((item) => normalize(item?.notes).includes(normalizedQuery))
    .map((item) => String(item?.name || item?.label || 'Untitled item').trim())
    .filter(Boolean)
    .slice(0, 2);

  labels.push(...matchingItemNames.map((name) => `Item · ${name}`));
  return labels;
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
    (total, child) => total + (child.kind === "cabinet" ? 0 : 1) + countDescendants(child),
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
  return getBoxThumbnailUrl(box);
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

  return items.some((item) => matchesPrimaryOwner(item?.primaryOwnerName, ownerFilter));
}

function hasItemWithKeepPriority(items, priorityFilter) {
  if (!priorityFilter) return true;
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.some(
    (item) => normalizeKeepPriority(item?.keepPriority) === priorityFilter,
  );
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
    ownerFilter = 'all',
    sortBy = 'boxId',
    sortDirection = 'asc',
  } = {},
) {
  const terms = normalize(searchQuery).split(/\s+/).filter(Boolean);
  const normalizedCategory =
    categoryFilter === 'all' ? 'all' : normalizeItemCategory(categoryFilter);
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
    ].filter(Boolean).join(' '));
    const matchesTerms = terms.every((term) => haystack.includes(term));
    const matchesCategory =
      normalizedCategory === 'all' ||
      normalizeItemCategory(item?.category) === normalizedCategory;
    const matchesLocation = matchesOperationsLocation(box, locationFilter);
    const matchesOwner =
      normalizedOwner === 'all' ||
      matchesPrimaryOwner(item?.primaryOwnerName, normalizedOwner);

    return matchesTerms && matchesCategory && matchesLocation && matchesOwner;
  });

  const direction = sortDirection === 'desc' ? -1 : 1;
  return filtered.sort((a, b) => {
    const aBox = a?.operationsBox || {};
    const bBox = b?.operationsBox || {};
    if (sortBy === 'location') {
      return compareText(aBox.location, bBox.location) * direction ||
        compareText(a?.name, b?.name) * direction;
    }
    if (sortBy === 'boxId') {
      return compareNodeBoxId(aBox, bBox) * direction ||
        compareText(a?.name, b?.name) * direction;
    }
    return compareText(a?.name, b?.name) * direction;
  });
}

function getRenderableBoxTags(node) {
  const sourceTags = Array.isArray(node?.tags) ? node.tags : [];
  if (!sourceTags.length) return [];

  const blockedValues = new Set(
    [normalize(node?.location)].filter(Boolean),
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
