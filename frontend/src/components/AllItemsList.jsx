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
import * as S from './AllItemsList/AllItemsList.styles';
import {
  filterAndSortItems,
  normalizeItemFilter,
  normalizeSortBy,
  normalizeStatusFilter,
  prepareItemForList,
} from './AllItemsList/allItemsList.utils';
import useAllItemsBatchProcessing from './AllItemsList/useAllItemsBatchProcessing.jsx';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pendingScrollRestoreRef = useRef();

  const loadItems = useCallback(async ({ signal, silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/items?status=all`, { signal });
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

  const visibleItems = useMemo(
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
    enabled: batchFocused,
    visibleItems,
    onRefreshItems: () => loadItems({ silent: true }),
  });

  const handleStatusChange = useCallback((nextStatus) => {
    const normalizedStatus = normalizeStatusFilter(nextStatus);
    setStatusFilter(normalizedStatus);

    if (normalizedStatus === 'batch') {
      setSortBy('batch');
      setFilter('all');
    }
  }, []);

  const handleFocusBatch = useCallback((batchId) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) return;
    setStatusFilter('batch');
    setSortBy('batch');
    setFilter('all');
    batchProcessing.focusBatch(normalizedBatchId);
  }, [batchProcessing]);

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
        onStatusChange={handleStatusChange}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
        onSearchChange={setSearchQuery}
        categoryOptions={categoryOptions}
        batchOptions={batchOptions}
        visibleCount={visibleItems.length}
        totalCount={counts.total}
        activeCount={counts.active}
        goneCount={counts.gone}
        orphanedCount={counts.orphaned}
        batchFocused={batchFocused}
      />

      {batchFocused ? (
        <S.BatchSelectionPanel>
          <S.BatchSelectionSummary>
            <S.BatchSelectionTitle>Batch Processing Console</S.BatchSelectionTitle>
            <S.BatchSelectionText>
              {batchProcessing.selectedItemIds.length
                ? `${batchProcessing.selectedItemIds.length} selected across ${batchProcessing.selectedBatchCount || 1} batch${batchProcessing.selectedBatchCount === 1 ? '' : 'es'} on this page.`
                : 'Open the console to manage visible selection and run image processing from this page.'}
            </S.BatchSelectionText>
          </S.BatchSelectionSummary>
          <S.BatchSelectionActions>
            <S.BatchActionButton
              type="button"
              $tone={batchProcessing.processingModeEnabled ? 'ghost' : 'primary'}
              onClick={
                batchProcessing.processingModeEnabled
                  ? () => batchProcessing.hideConsole()
                  : () => batchProcessing.showConsole()
              }
            >
              {batchProcessing.processingModeEnabled ? 'Close Batch Console' : 'Open Batch Console'}
            </S.BatchActionButton>
          </S.BatchSelectionActions>
        </S.BatchSelectionPanel>
      ) : null}

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

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
                selectedItemIds={batchProcessing.selectedItemIds}
                selectedBatchId={batchProcessing.selectedBatchId}
                onToggleItemSelection={batchProcessing.toggleItemSelection}
                onSelectBatch={batchProcessing.selectBatch}
                onFocusBatch={handleFocusBatch}
              />
            </S.DesktopWrap>
            <S.MobileWrap>
              <AllItemsMobileCards
                items={visibleItems}
                batchFocused={batchFocused}
                batchToneMap={batchToneMap}
                selectedItemIds={batchProcessing.selectedItemIds}
                selectedBatchId={batchProcessing.selectedBatchId}
                onToggleItemSelection={batchProcessing.toggleItemSelection}
                onSelectBatch={batchProcessing.selectBatch}
                onFocusBatch={handleFocusBatch}
              />
            </S.MobileWrap>
          </>
        ) : (
          <S.EmptyState>No items match the current view.</S.EmptyState>
        )}
      </S.ContentPanel>
    </S.PageShell>
  );
}
