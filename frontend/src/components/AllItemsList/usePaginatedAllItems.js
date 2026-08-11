import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../../api/API_BASE.js';

export const ALL_ITEMS_PAGE_SIZE = 60;

const EMPTY_COUNTS = {
  total: 0,
  active: 0,
  gone: 0,
  orphaned: 0,
  boxed: 0,
  consumableCount: 0,
  imageCount: 0,
  tagCount: 0,
  totalQuantity: 0,
  categoryCount: 0,
  locationCount: 0,
};

const EMPTY_FACETS = { categories: [], batches: [] };

function useDebouncedValue(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

export function buildRequestParams({
  searchQuery,
  sortBy,
  sortDirection,
  randomSeed,
  filter,
  statusFilter,
  offset,
  limit = ALL_ITEMS_PAGE_SIZE,
}) {
  const params = new URLSearchParams({
    view: 'list',
    limit: String(limit),
    offset: String(offset),
    status: statusFilter === 'batch' ? 'all' : statusFilter,
    sort: statusFilter === 'batch' ? 'batch' : sortBy,
    direction: sortDirection,
  });
  if (statusFilter === 'batch') params.set('scope', 'batched');
  if (sortBy === 'random' && randomSeed) params.set('seed', String(randomSeed));
  const query = String(searchQuery || '').trim();
  if (query) params.set('q', query);

  const normalizedFilter = String(filter || 'all').trim();
  if (normalizedFilter.startsWith('category:')) {
    params.set('category', normalizedFilter.slice('category:'.length));
  } else if (normalizedFilter.startsWith('batch:')) {
    params.set('sourceBatchId', normalizedFilter.slice('batch:'.length));
  } else if (normalizedFilter !== 'all') {
    params.set('scope', normalizedFilter);
  }

  return params;
}

export function mergeUniqueItems(currentItems, nextItems) {
  const byId = new Map();
  for (const item of [...currentItems, ...nextItems]) {
    const itemId = String(item?._id || '').trim();
    if (itemId) byId.set(itemId, item);
  }
  return [...byId.values()];
}

export default function usePaginatedAllItems({
  searchQuery,
  sortBy,
  sortDirection,
  randomSeed,
  filter,
  statusFilter,
}) {
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [facets, setFacets] = useState(EMPTY_FACETS);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const activeControllerRef = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const queryState = useMemo(() => ({
    searchQuery: debouncedSearchQuery,
    sortBy,
    sortDirection,
    randomSeed,
    filter,
    statusFilter,
  }), [debouncedSearchQuery, filter, randomSeed, sortBy, sortDirection, statusFilter]);

  const requestPage = useCallback(async ({ offset, limit, signal }) => {
    const apiRoot = String(API_BASE || '').replace(/\/+$/, '');
    const params = buildRequestParams({ ...queryState, offset, limit });
    const response = await fetch(`${apiRoot}/api/items?${params}`, { signal });
    if (!response.ok) throw new Error(`Failed to fetch items (${response.status})`);
    const body = await response.json();
    return {
      items: Array.isArray(body?.items) ? body.items : [],
      counts: body?.counts && typeof body.counts === 'object' ? body.counts : EMPTY_COUNTS,
      facets: body?.facets && typeof body.facets === 'object' ? body.facets : EMPTY_FACETS,
      total: Number(body?.total || 0),
      hasMore: Boolean(body?.hasMore),
    };
  }, [queryState]);

  useEffect(() => {
    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;
    setLoading(true);
    setLoadingMore(false);
    setError('');

    void requestPage({ offset: 0, limit: ALL_ITEMS_PAGE_SIZE, signal: controller.signal })
      .then((page) => {
        if (controller.signal.aborted) return;
        setItems(page.items);
        setCounts({ ...EMPTY_COUNTS, ...page.counts });
        setFacets({ ...EMPTY_FACETS, ...page.facets });
        setTotal(page.total);
        setHasMore(page.hasMore);
      })
      .catch((requestError) => {
        if (requestError?.name === 'AbortError') return;
        setItems([]);
        setTotal(0);
        setHasMore(false);
        setError(requestError?.message || 'Failed to load items');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [requestPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setLoadingMore(true);
    setError('');
    try {
      const page = await requestPage({
        offset: itemsRef.current.length,
        limit: ALL_ITEMS_PAGE_SIZE,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setItems((current) => mergeUniqueItems(current, page.items));
      setCounts({ ...EMPTY_COUNTS, ...page.counts });
      setFacets({ ...EMPTY_FACETS, ...page.facets });
      setTotal(page.total);
      setHasMore(page.hasMore);
    } catch (requestError) {
      if (requestError?.name !== 'AbortError') {
        setError(requestError?.message || 'Failed to load more items');
      }
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, requestPage]);

  const refresh = useCallback(async () => {
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const loadedTarget = Math.max(ALL_ITEMS_PAGE_SIZE, itemsRef.current.length);
    setError('');

    try {
      const pages = [];
      for (let offset = 0; offset < loadedTarget; offset += ALL_ITEMS_PAGE_SIZE) {
        pages.push(await requestPage({
          offset,
          limit: ALL_ITEMS_PAGE_SIZE,
          signal: controller.signal,
        }));
        if (!pages.at(-1)?.hasMore) break;
      }
      if (controller.signal.aborted || !pages.length) return;
      const lastPage = pages.at(-1);
      setItems(mergeUniqueItems([], pages.flatMap((page) => page.items)));
      setCounts({ ...EMPTY_COUNTS, ...lastPage.counts });
      setFacets({ ...EMPTY_FACETS, ...lastPage.facets });
      setTotal(lastPage.total);
      setHasMore(lastPage.hasMore);
    } catch (requestError) {
      if (requestError?.name !== 'AbortError') {
        setError(requestError?.message || 'Failed to refresh items');
      }
    }
  }, [requestPage]);

  return {
    items,
    counts,
    facets,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
  };
}
