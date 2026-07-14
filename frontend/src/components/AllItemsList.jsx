import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useLocation,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom';
import { API_BASE } from '../api/API_BASE';
import { ITEM_CATEGORIES, formatItemCategory } from '../util/itemCategories';
import AllItemsToolbar from './AllItemsList/AllItemsToolbar';
import AllItemsDesktopTable from './AllItemsList/AllItemsDesktopTable';
import AllItemsMobileCards from './AllItemsList/AllItemsMobileCards';
import AllItemsSelectionPanel from './AllItemsList/AllItemsSelectionPanel';
import RetrievalImageLightbox from './Retrieval/RetrievalImageLightbox';
import * as S from './AllItemsList/AllItemsList.styles';
import {
  filterAndSortItems,
  normalizeColorBy,
  normalizeItemFilter,
  normalizeSortBy,
  normalizeStatusFilter,
  prepareItemForList,
} from './AllItemsList/allItemsList.utils';
import useAllItemsBatchProcessing from './AllItemsList/useAllItemsBatchProcessing.jsx';
import useAllItemsDeclutterSessions from './AllItemsList/useAllItemsDeclutterSessions.jsx';
import useAllItemsItemSelection from './AllItemsList/useAllItemsItemSelection.jsx';
import { getBoxGroupColorTones } from './Retrieval/boxColors';

const ALL_ITEMS_SCROLL_STORAGE_PREFIX = 'all-items:scroll:';
const SCROLL_RESTORE_MAX_FRAMES = 240;

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
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState(() =>
    readSearchQueryParam(searchParams),
  );
  const [sortBy, setSortBy] = useState(() => normalizeSortBy(searchParams.get('sort')));
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pendingScrollRestoreRef = useRef();

  const loadItems = useCallback(async ({ signal, silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const apiRoot = String(API_BASE || '').replace(/\/+$/, '');
      const requestUrl = `${apiRoot}/api/items?status=all&view=list`;
      const res = await fetch(requestUrl, { signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch items (${res.status})`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      if (fetchError?.name === 'AbortError') return;
      setError(fetchError?.message || 'Failed to load items');
      if (!silent) {
        setItems([]);
      }
    } finally {
      if (!signal?.aborted && !silent) {
        setLoading(false);
      }
    }
  }, []);

  if (pendingScrollRestoreRef.current === undefined) {
    pendingScrollRestoreRef.current = readPersistedScrollY({
      key: location.key,
      navigationType,
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadItems({ signal: controller.signal });

    return () => controller.abort();
  }, [loadItems]);

  useEffect(() => {
    const queryStatus = normalizeStatusFilter(searchParams.get('status'));
    const queryFilter = normalizeItemFilter(searchParams.get('filter'));
    const querySortBy = normalizeSortBy(searchParams.get('sort'));
    const querySearch = readSearchQueryParam(searchParams);
    setSearchQuery((current) => (current === querySearch ? current : querySearch));
    setFilter((current) => (current === queryFilter ? current : queryFilter));
    setSortBy((current) => (current === querySortBy ? current : querySortBy));
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

    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [filter, searchParams, searchQuery, setSearchParams, sortBy, statusFilter]);

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

  const baseVisibleItems = useMemo(
    () =>
      filterAndSortItems(preparedItems, {
        statusFilter: batchFocused ? 'all' : statusFilter,
        filter,
        sortBy,
        searchQuery,
        batchFocused,
      }),
    [batchFocused, preparedItems, searchQuery, statusFilter, filter, sortBy],
  );

  const batchProcessing = useAllItemsBatchProcessing({
    enabled: batchModeEnabled,
    visibleItems: baseVisibleItems,
    onRefreshItems: () => loadItems({ silent: true }),
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
    onRefreshItems: () => loadItems({ silent: true }),
    onExit: () => setItemSelectionModeEnabled(false),
  });
  const declutterSelection = useAllItemsDeclutterSessions({
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
      setFilter('all');
    }
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
    setFilter('all');
    batchProcessing.focusBatch(normalizedBatchId);
  }, [batchProcessing]);

  const handleOpenImagePreview = useCallback((nextImage) => {
    const src = String(nextImage?.src || '').trim();
    if (!src) return;

    setLightboxImage({
      src,
      name: String(nextImage?.name || '').trim(),
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

  const rowAccentByItemId = useMemo(() => {
    const next = new Map();

    for (const item of visibleItems) {
      const itemId = String(item?._id || '').trim();
      const meta = item?._allItems || {};
      if (!itemId) continue;

      if (colorBy === 'none') {
        next.set(itemId, '');
        continue;
      }

      if (colorBy === 'status') {
        const statusTone = meta?.isGone
          ? '#f08a7b'
          : meta?.isOrphaned
            ? '#e8b15c'
            : '#4cc6c1';
        next.set(itemId, statusTone);
        continue;
      }

      const key =
        colorBy === 'batch'
          ? String(meta?.sourceBatchId || meta?.sourceBatchLabel || '').trim()
          : colorBy === 'location'
            ? String(meta?.locationLabel || '').trim().toLowerCase()
            : String(meta?.boxId || meta?.boxLabel || '').trim();

      if (!key) {
        next.set(itemId, '');
        continue;
      }

      next.set(itemId, getBoxGroupColorTones(key, meta?.boxId).muted);
    }

    return next;
  }, [colorBy, visibleItems]);

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

  const counts = useMemo(() => {
    let active = 0;
    let gone = 0;
    let orphaned = 0;

    for (const item of preparedItems) {
      const meta = item?._allItems;
      if (!meta) continue;
      if (meta.isGone) {
        gone += 1;
      } else {
        active += 1;
      }
      if (meta.isOrphaned) orphaned += 1;
    }

    return {
      total: preparedItems.length,
      active,
      gone,
      orphaned,
    };
  }, [preparedItems]);

  const categoryOptions = useMemo(
    () =>
      ITEM_CATEGORIES.map((category) => ({
        value: `category:${category}`,
        label: `Category: ${formatItemCategory(category)}`,
      })),
    [],
  );

  const batchOptions = useMemo(() => {
    const seen = new Set();
    return preparedItems
      .map((item) => item?._allItems)
      .filter((meta) => meta?.hasSourceBatch && meta?.sourceBatchId)
      .sort((left, right) =>
        String(left?.sourceBatchSortKey || '').localeCompare(String(right?.sourceBatchSortKey || ''), undefined, {
          sensitivity: 'base',
        })
      )
      .flatMap((meta) => {
        const batchId = String(meta?.sourceBatchId || '').trim();
        if (!batchId || seen.has(batchId)) return [];
        seen.add(batchId);
        const label = String(meta?.sourceBatchLabel || batchId).trim();
        const archiveSuffix =
          String(meta?.sourceBatchArchiveStatus || '').trim().toLowerCase() === 'archived'
            ? ' (Archived)'
            : '';
        return [{
          value: `batch:${batchId}`,
          label: `Batch: ${label}${archiveSuffix}`,
        }];
      });
  }, [preparedItems]);

  return (
    <S.PageShell>
      <AllItemsToolbar
        statusFilter={statusFilter}
        filter={filter}
        sortBy={sortBy}
        searchQuery={searchQuery}
        colorBy={colorBy}
        onStatusChange={handleStatusChange}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
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
        />
      ) : null}

      <S.ContentPanel>
        {loading && !preparedItems.length ? (
          <S.EmptyState>Loading inventory…</S.EmptyState>
        ) : visibleItems.length ? (
          <>
            <S.DesktopWrap>
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
            </S.DesktopWrap>
            <S.MobileWrap>
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
              />
            </S.MobileWrap>
          </>
        ) : (
          <S.EmptyState>No items match the current view.</S.EmptyState>
        )}
      </S.ContentPanel>

      <RetrievalImageLightbox
        isOpen={Boolean(lightboxImage?.src)}
        imageSrc={lightboxImage?.src || ''}
        itemName={lightboxImage?.name || ''}
        onClose={handleCloseImagePreview}
      />
    </S.PageShell>
  );
}
