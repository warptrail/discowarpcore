import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  if (pendingScrollRestoreRef.current === undefined) {
    pendingScrollRestoreRef.current = readPersistedScrollY({
      key: location.key,
      navigationType,
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetch(`${API_BASE}/api/items?status=all`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch items (${res.status})`);
        }
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((fetchError) => {
        if (fetchError?.name === 'AbortError') return;
        setError(fetchError?.message || 'Failed to load items');
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

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

  const visibleItems = useMemo(
    () =>
      filterAndSortItems(preparedItems, {
        statusFilter,
        filter,
        sortBy,
        searchQuery,
      }),
    [preparedItems, searchQuery, statusFilter, filter, sortBy],
  );

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

  return (
    <S.PageShell>
      <AllItemsToolbar
        statusFilter={statusFilter}
        filter={filter}
        sortBy={sortBy}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
        onSearchChange={setSearchQuery}
        categoryOptions={categoryOptions}
        visibleCount={visibleItems.length}
        totalCount={counts.total}
        activeCount={counts.active}
        goneCount={counts.gone}
        orphanedCount={counts.orphaned}
      />

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      <S.ContentPanel>
        {loading && !preparedItems.length ? (
          <S.EmptyState>Loading inventory…</S.EmptyState>
        ) : visibleItems.length ? (
          <>
            <S.DesktopWrap>
              <AllItemsDesktopTable items={visibleItems} />
            </S.DesktopWrap>
            <S.MobileWrap>
              <AllItemsMobileCards items={visibleItems} />
            </S.MobileWrap>
          </>
        ) : (
          <S.EmptyState>No items match the current view.</S.EmptyState>
        )}
      </S.ContentPanel>
    </S.PageShell>
  );
}
