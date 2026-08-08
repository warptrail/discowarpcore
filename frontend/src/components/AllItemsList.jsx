import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useLocation,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom';
import { ITEM_CATEGORIES, formatItemCategory } from '../util/itemCategories';
import useIsMobile from '../hooks/useIsMobile';
import AllItemsToolbar from './AllItemsList/AllItemsToolbar';
import AllItemsDesktopTable from './AllItemsList/AllItemsDesktopTable';
import AllItemsMobileCards from './AllItemsList/AllItemsMobileCards';
import AllItemsSelectionPanel from './AllItemsList/AllItemsSelectionPanel';
import RetrievalImageLightbox from './Retrieval/RetrievalImageLightbox';
import * as S from './AllItemsList/AllItemsList.styles';
import {
  getDefaultSortDirection,
  normalizeColorBy,
  normalizeItemFilter,
  normalizeSortBy,
  normalizeSortDirection,
  normalizeStatusFilter,
  prepareItemForList,
} from './AllItemsList/allItemsList.utils';
import useAllItemsBatchProcessing from './AllItemsList/useAllItemsBatchProcessing.jsx';
import useAllItemsDeclutterDeck from './AllItemsList/useAllItemsDeclutterDeck.js';
import useAllItemsItemSelection from './AllItemsList/useAllItemsItemSelection.jsx';
import usePaginatedAllItems from './AllItemsList/usePaginatedAllItems';
import { getBoxTheme, getItemTheme } from '../util/inventoryColorTheme';
import AllItemsInsightsModal from './AllItemsList/AllItemsInsightsModal';
import {
  ALL_ITEMS_INSIGHTS_OPEN_EVENT,
  ALL_ITEMS_INSIGHTS_STATE_EVENT,
  ALL_ITEMS_DETAIL_OPEN_EVENT,
} from '../constants/inventoryFinderEvents';

const ALL_ITEMS_SCROLL_STORAGE_PREFIX = 'all-items:scroll:';
const SCROLL_RESTORE_MAX_FRAMES = 240;
const SECONDARY_ACCENTS = [
  '#67D9D3',
  '#E8B15C',
  '#A7B6FF',
  '#F08A7B',
  '#9BE564',
  '#7FD7FF',
  '#E056FD',
  '#4D96FF',
];

function getSecondaryAccent(value) {
  const source = String(value || '').trim().toLowerCase();
  if (!source) return '';

  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  }
  return SECONDARY_ACCENTS[Math.abs(hash) % SECONDARY_ACCENTS.length];
}

function readSearchQueryParam(searchParams) {
  return String(searchParams.get('q') || '');
}

function readPersistedScrollY({ key, navigationType }) {
  if (typeof window === 'undefined') return null;
  if (!key || key === 'default') return null;
  if (navigationType !== 'POP') return null;

  try {
    const raw = window.sessionStorage.getItem(`${ALL_ITEMS_SCROLL_STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const scrollY = Number(parsed?.scrollY);
    if (!Number.isFinite(scrollY) || scrollY < 0) return null;
    return scrollY;
  } catch {
    return null;
  }
}

function writePersistedScrollY({ key }) {
  if (typeof window === 'undefined') return;
  if (!key || key === 'default') return;

  try {
    window.sessionStorage.setItem(
      `${ALL_ITEMS_SCROLL_STORAGE_PREFIX}${key}`,
      JSON.stringify({
        scrollY: window.scrollY,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // best-effort persistence only
  }
}

export default function AllItemsList() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() =>
    readSearchQueryParam(searchParams),
  );
  const [sortBy, setSortBy] = useState(() => normalizeSortBy(searchParams.get('sort')));
  const [sortDirection, setSortDirection] = useState(() => {
    const initialSort = normalizeSortBy(searchParams.get('sort'));
    return normalizeSortDirection(searchParams.get('direction'), initialSort);
  });
  const [filter, setFilter] = useState(() =>
    normalizeItemFilter(searchParams.get('filter')),
  );
  const [statusFilter, setStatusFilter] = useState(() =>
    normalizeStatusFilter(searchParams.get('status')),
  );
  const [colorBy, setColorBy] = useState('none');
  const [batchModeEnabled, setBatchModeEnabled] = useState(false);
  const [itemSelectionModeEnabled, setItemSelectionModeEnabled] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [mobileDetailItem, setMobileDetailItem] = useState(null);
  const pendingScrollRestoreRef = useRef();
  const loadMoreSentinelRef = useRef(null);
  const isMobileLayout = useIsMobile(900);
  const {
    items,
    counts,
    facets,
    total: filteredTotal,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh: refreshItems,
  } = usePaginatedAllItems({
    searchQuery,
    sortBy,
    sortDirection,
    filter,
    statusFilter,
  });

  if (pendingScrollRestoreRef.current === undefined) {
    pendingScrollRestoreRef.current = readPersistedScrollY({
      key: location.key,
      navigationType,
    });
  }

  useEffect(() => {
    const queryStatus = normalizeStatusFilter(searchParams.get('status'));
    const queryFilter = normalizeItemFilter(searchParams.get('filter'));
    const querySortBy = normalizeSortBy(searchParams.get('sort'));
    const querySortDirection = normalizeSortDirection(
      searchParams.get('direction'),
      querySortBy,
    );
    const querySearch = readSearchQueryParam(searchParams);
    setSearchQuery((current) => (current === querySearch ? current : querySearch));
    setFilter((current) => (current === queryFilter ? current : queryFilter));
    setSortBy((current) => (current === querySortBy ? current : querySortBy));
    setSortDirection((current) =>
      current === querySortDirection ? current : querySortDirection
    );
    setStatusFilter((current) => (current === queryStatus ? current : queryStatus));
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (searchQuery) {
      next.set('q', searchQuery);
    } else {
      next.delete('q');
    }

    if (statusFilter === 'active') {
      next.delete('status');
    } else {
      next.set('status', statusFilter);
    }

    if (filter === 'all') {
      next.delete('filter');
    } else {
      next.set('filter', filter);
    }

    if (sortBy === 'alpha') {
      next.delete('sort');
    } else {
      next.set('sort', sortBy);
    }

    if (sortDirection === getDefaultSortDirection(sortBy)) {
      next.delete('direction');
    } else {
      next.set('direction', sortDirection);
    }

    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [filter, searchParams, searchQuery, setSearchParams, sortBy, sortDirection, statusFilter]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore || typeof IntersectionObserver !== 'function') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    const persist = () => {
      writePersistedScrollY({ key: location.key });
    };

    const onPageHide = () => {
      persist();
    };

    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      persist();
    };
  }, [location.key]);

  const preparedItems = useMemo(
    () => items.map((item) => prepareItemForList(item)),
    [items],
  );

  const batchFocused = statusFilter === 'batch';

  const baseVisibleItems = preparedItems;

  const batchProcessing = useAllItemsBatchProcessing({
    enabled: batchModeEnabled,
    visibleItems: baseVisibleItems,
    onRefreshItems: refreshItems,
  });
  const { showConsole, hideConsole } = batchProcessing;
  const previousProcessingModeRef = useRef(false);
  const handleExitBatchMode = useCallback(() => {
    setBatchModeEnabled(false);
    hideConsole();
    batchProcessing.clearSelection();
  }, [batchProcessing, hideConsole]);
  const appliedBatchScopeId =
    batchModeEnabled
      ? String(batchProcessing.appliedSourceBatchId || '').trim()
      : '';
  const visibleItems = useMemo(() => {
    if (!appliedBatchScopeId) return baseVisibleItems;
    return baseVisibleItems.filter(
      (item) => String(item?._allItems?.sourceBatchId || '').trim() === appliedBatchScopeId
    );
  }, [appliedBatchScopeId, baseVisibleItems]);
  const itemSelection = useAllItemsItemSelection({
    enabled: itemSelectionModeEnabled,
    visibleItems,
    onRefreshItems: refreshItems,
    onExit: () => setItemSelectionModeEnabled(false),
  });
  const declutterSelection = useAllItemsDeclutterDeck({
    enabled: itemSelectionModeEnabled,
    selectedItemIds: itemSelection.selectedItemIds,
    onAdded: itemSelection.clearSelection,
  });

  useEffect(() => {
    if (!batchModeEnabled) {
      hideConsole();
      return;
    }
    showConsole();
  }, [batchModeEnabled, hideConsole, showConsole]);

  useEffect(() => {
    const wasProcessingModeEnabled = previousProcessingModeRef.current;
    const isProcessingModeEnabled = Boolean(batchProcessing.processingModeEnabled);

    if (batchModeEnabled && wasProcessingModeEnabled && !isProcessingModeEnabled) {
      handleExitBatchMode();
    }

    previousProcessingModeRef.current = isProcessingModeEnabled;
  }, [
    batchModeEnabled,
    batchProcessing.processingModeEnabled,
    handleExitBatchMode,
  ]);

  const handleStatusChange = useCallback((nextStatus) => {
    const normalizedStatus = normalizeStatusFilter(nextStatus);
    setStatusFilter(normalizedStatus);

    if (normalizedStatus === 'batch') {
      setSortBy('batch');
      setSortDirection(getDefaultSortDirection('batch'));
      setFilter('all');
    } else if (normalizedStatus === 'gone') {
      setSortBy('dispositionAt');
      setSortDirection('desc');
    }
  }, []);

  const handleSortChange = useCallback((nextSort) => {
    const normalizedSort = normalizeSortBy(nextSort);
    setSortBy(normalizedSort);
    setSortDirection(getDefaultSortDirection(normalizedSort));
  }, []);

  const handleToggleBatchMode = useCallback(() => {
    if (batchModeEnabled) {
      handleExitBatchMode();
      return;
    }
    itemSelection.exitSelectionMode();
    setBatchModeEnabled(true);
  }, [batchModeEnabled, handleExitBatchMode, itemSelection]);

  const handleToggleItemSelectionMode = useCallback(() => {
    if (itemSelectionModeEnabled) {
      itemSelection.exitSelectionMode();
      return;
    }
    handleExitBatchMode();
    setItemSelectionModeEnabled(true);
  }, [handleExitBatchMode, itemSelection, itemSelectionModeEnabled]);

  const handleFocusBatch = useCallback((batchId) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) return;
    setStatusFilter('batch');
    setSortBy('batch');
    setSortDirection(getDefaultSortDirection('batch'));
    setFilter('all');
    batchProcessing.focusBatch(normalizedBatchId);
  }, [batchProcessing]);

  const handleOpenImagePreview = useCallback((nextImage) => {
    const src = String(nextImage?.src || '').trim();
    if (!src) return;

    setLightboxImage({
      src,
      name: String(nextImage?.name || '').trim(),
      presentation: String(nextImage?.presentation || 'default'),
    });
  }, []);

  const handleCloseImagePreview = useCallback(() => {
    setLightboxImage(null);
  }, []);

  const batchToneMap = useMemo(() => {
    const toneKeys = [
      'root',
      'teal',
      'amber',
      'lilac',
      'coral',
      'rootSoft',
      'tealDeep',
      'amberSoft',
      'lilacDeep',
      'coralSoft',
      'rootDeep',
      'tealSoft',
    ];
    const next = new Map();
    let toneIndex = 0;

    for (const item of visibleItems) {
      const batchId = String(item?._allItems?.sourceBatchId || '').trim();
      if (!batchId || next.has(batchId)) continue;
      next.set(batchId, toneKeys[toneIndex % toneKeys.length]);
      toneIndex += 1;
    }

    return next;
  }, [visibleItems]);

  const activeSelectedItemIds = itemSelectionModeEnabled
    ? itemSelection.selectedItemIds
    : batchProcessing.selectedItemIds;

  const rowAccentByItemId = useMemo(() => {
    const next = new Map();
    const selectedIds = new Set(
      Array.isArray(activeSelectedItemIds) ? activeSelectedItemIds.map(String) : [],
    );

    for (const item of visibleItems) {
      const itemId = String(item?._id || '').trim();
      const meta = item?._allItems || {};
      if (!itemId) continue;
      const boxTheme = getBoxTheme(meta?.isBoxed ? meta?.boxId : null);

      if (meta?.isGone && colorBy === 'status') {
        next.set(itemId, '#F08A7B');
        continue;
      }

      if (colorBy === 'status') {
        const statusTone = meta?.isOrphaned ? '#E8B15C' : '#4CC6C1';
        next.set(itemId, statusTone);
        continue;
      }

      if (selectedIds.has(itemId)) {
        next.set(itemId, getItemTheme(meta?.boxId, itemId, { selected: true }).accent);
        continue;
      }

      if (colorBy === 'none') {
        next.set(itemId, boxTheme.muted);
        continue;
      }

      if (colorBy === 'box') {
        next.set(itemId, boxTheme.primary);
        continue;
      }

      const key =
        colorBy === 'batch'
          ? String(meta?.sourceBatchId || meta?.sourceBatchLabel || '').trim()
          : String(meta?.locationLabel || '').trim().toLowerCase();

      if (!key) {
        next.set(itemId, boxTheme.muted);
        continue;
      }

      next.set(itemId, getSecondaryAccent(key));
    }

    return next;
  }, [activeSelectedItemIds, colorBy, visibleItems]);

  useEffect(() => {
    const targetScrollY = pendingScrollRestoreRef.current;
    if (!Number.isFinite(targetScrollY)) return;
    if (loading) return;

    let frame = 0;
    let cancelled = false;

    const restore = () => {
      if (cancelled) return;

      window.scrollTo(0, targetScrollY);
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const reachableTarget = Math.min(targetScrollY, maxScrollY);
      const reached = Math.abs(window.scrollY - reachableTarget) <= 2;

      if (reached || frame >= SCROLL_RESTORE_MAX_FRAMES) {
        pendingScrollRestoreRef.current = null;
        return;
      }

      frame += 1;
      window.requestAnimationFrame(restore);
    };

    const startFrame = window.requestAnimationFrame(restore);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(startFrame);
    };
  }, [loading, visibleItems.length]);

  useEffect(() => {
    const handleInsightsOpen = () => setInsightsOpen(true);
    window.addEventListener(ALL_ITEMS_INSIGHTS_OPEN_EVENT, handleInsightsOpen);
    return () => window.removeEventListener(ALL_ITEMS_INSIGHTS_OPEN_EVENT, handleInsightsOpen);
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(ALL_ITEMS_INSIGHTS_STATE_EVENT, {
        detail: { ...counts, visible: visibleItems.length, loading },
      }),
    );
  }, [counts, loading, visibleItems.length]);

  useEffect(() => {
    const handleDetailOpen = (event) => {
      const itemId = String(event.detail?.itemId || '').trim();
      const item = preparedItems.find((entry) => String(entry?._id || '') === itemId);
      if (item) setMobileDetailItem(item);
    };
    window.addEventListener(ALL_ITEMS_DETAIL_OPEN_EVENT, handleDetailOpen);
    return () => window.removeEventListener(ALL_ITEMS_DETAIL_OPEN_EVENT, handleDetailOpen);
  }, [preparedItems]);

  const categoryOptions = useMemo(
    () =>
      (facets.categories.length ? facets.categories : ITEM_CATEGORIES).map((category) => ({
        value: `category:${category}`,
        label: `Category: ${formatItemCategory(category)}`,
      })),
    [facets.categories],
  );

  const batchOptions = useMemo(() => {
    return (Array.isArray(facets.batches) ? facets.batches : [])
      .filter((batch) => batch?.id)
      .sort((left, right) =>
        String(left?.batchId || left?.label || '').localeCompare(String(right?.batchId || right?.label || ''), undefined, {
          sensitivity: 'base',
          numeric: true,
        })
      )
      .map((batch) => ({
        value: `batch:${batch.id}`,
        label: `Batch: ${batch.label || batch.batchName || batch.batchId}${batch.isArchived ? ' (Archived)' : ''}`,
      }));
  }, [facets.batches]);

  return (
    <S.PageShell>
      <AllItemsToolbar
        statusFilter={statusFilter}
        filter={filter}
        sortBy={sortBy}
        sortDirection={sortDirection}
        searchQuery={searchQuery}
        colorBy={colorBy}
        onStatusChange={handleStatusChange}
        onFilterChange={setFilter}
        onSortChange={handleSortChange}
        onSortDirectionChange={setSortDirection}
        onColorByChange={(next) => setColorBy(normalizeColorBy(next))}
        onSearchChange={setSearchQuery}
        categoryOptions={categoryOptions}
        batchOptions={batchOptions}
        visibleCount={visibleItems.length}
        totalCount={counts.total}
        activeCount={counts.active}
        goneCount={counts.gone}
        orphanedCount={counts.orphaned}
        batchModeEnabled={batchModeEnabled}
        onToggleBatchMode={handleToggleBatchMode}
        itemSelectionModeEnabled={itemSelectionModeEnabled}
        onToggleItemSelectionMode={handleToggleItemSelectionMode}
      />

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      {itemSelectionModeEnabled ? (
        <AllItemsSelectionPanel
          selectedCount={itemSelection.selectedCount}
          selectableCount={itemSelection.selectableCount}
          sourceBatchOptions={itemSelection.sourceBatchOptions}
          pendingSourceBatchId={itemSelection.pendingSourceBatchId}
          destination={itemSelection.destination}
          destinationPickerOpen={itemSelection.destinationPickerOpen}
          moving={itemSelection.moving}
          onSelectAllVisible={itemSelection.selectAllVisible}
          onClearSelection={itemSelection.clearSelection}
          onPendingSourceBatchChange={itemSelection.setPendingSourceBatchId}
          onSelectSourceBatch={itemSelection.selectSourceBatch}
          onToggleDestinationPicker={() =>
            itemSelection.setDestinationPickerOpen((current) => !current)
          }
          onDestinationSelected={itemSelection.handleDestinationSelected}
          onMoveSelected={itemSelection.moveSelectedItems}
          onExit={itemSelection.exitSelectionMode}
          declutterControls={declutterSelection}
          hasMore={hasMore}
        />
      ) : null}

      <S.ContentPanel>
        {loading && !preparedItems.length ? (
          <S.EmptyState>Loading inventory…</S.EmptyState>
        ) : visibleItems.length ? (
          <>
            {isMobileLayout ? (
              <AllItemsMobileCards
                items={visibleItems}
                batchFocused={batchFocused}
                batchToneMap={batchToneMap}
                colorBy={colorBy}
                rowAccentByItemId={rowAccentByItemId}
                batchModeEnabled={batchModeEnabled && batchProcessing.isSelectionStepActive}
                simpleSelectionModeEnabled={itemSelectionModeEnabled}
                batchActionMode={batchProcessing.batchActionMode}
                itemProcessingById={batchProcessing.itemProcessingById}
                selectedItemIds={
                  itemSelectionModeEnabled
                    ? itemSelection.selectedItemIds
                    : batchProcessing.selectedItemIds
                }
                selectedBatchId={batchProcessing.selectedBatchId}
                onToggleItemSelection={
                  itemSelectionModeEnabled
                    ? itemSelection.toggleItemSelection
                    : batchProcessing.toggleItemSelection
                }
                onSelectBatch={
                  itemSelectionModeEnabled
                    ? itemSelection.selectSourceBatch
                    : batchProcessing.selectBatch
                }
                onFocusBatch={handleFocusBatch}
                onOpenImagePreview={handleOpenImagePreview}
                onOpenItemDetails={(item) =>
                  setMobileDetailItem((current) =>
                    String(current?._id || '') === String(item?._id || '') ? null : item,
                  )
                }
                detailItemId={mobileDetailItem?._id || ''}
                onCloseItemDetails={() => setMobileDetailItem(null)}
              />
            ) : (
              <AllItemsDesktopTable
                items={visibleItems}
                batchFocused={batchFocused}
                batchToneMap={batchToneMap}
                colorBy={colorBy}
                rowAccentByItemId={rowAccentByItemId}
                batchModeEnabled={batchModeEnabled && batchProcessing.isSelectionStepActive}
                simpleSelectionModeEnabled={itemSelectionModeEnabled}
                batchActionMode={batchProcessing.batchActionMode}
                itemProcessingById={batchProcessing.itemProcessingById}
                selectedItemIds={
                  itemSelectionModeEnabled
                    ? itemSelection.selectedItemIds
                    : batchProcessing.selectedItemIds
                }
                selectedBatchId={batchProcessing.selectedBatchId}
                onToggleItemSelection={
                  itemSelectionModeEnabled
                    ? itemSelection.toggleItemSelection
                    : batchProcessing.toggleItemSelection
                }
                onSelectBatch={
                  itemSelectionModeEnabled
                    ? itemSelection.selectSourceBatch
                    : batchProcessing.selectBatch
                }
                onFocusBatch={handleFocusBatch}
                onOpenImagePreview={handleOpenImagePreview}
              />
            )}
            <S.ProgressiveLoadRegion ref={loadMoreSentinelRef}>
              <S.ProgressiveLoadText>
                {loadingMore
                  ? 'Loading more items…'
                  : hasMore
                    ? `${visibleItems.length} of ${filteredTotal} matching items loaded`
                    : `${filteredTotal} matching items loaded`}
              </S.ProgressiveLoadText>
              {hasMore ? (
                <S.ToolbarButton type="button" disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore ? 'Loading…' : 'Load More'}
                </S.ToolbarButton>
              ) : null}
            </S.ProgressiveLoadRegion>
          </>
        ) : (
          <S.EmptyState>No items match the current view.</S.EmptyState>
        )}
      </S.ContentPanel>

      <RetrievalImageLightbox
        isOpen={Boolean(lightboxImage?.src)}
        imageSrc={lightboxImage?.src || ''}
        itemName={lightboxImage?.name || ''}
        presentation={lightboxImage?.presentation || 'default'}
        onClose={handleCloseImagePreview}
      />
      {insightsOpen ? (
        <AllItemsInsightsModal
          counts={counts}
          visibleCount={visibleItems.length}
          onClose={() => setInsightsOpen(false)}
        />
      ) : null}
    </S.PageShell>
  );
}
