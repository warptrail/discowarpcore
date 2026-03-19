import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../api/API_BASE';
import { ITEM_CATEGORIES, formatItemCategory } from '../util/itemCategories';
import AllItemsToolbar from './AllItemsList/AllItemsToolbar';
import AllItemsDesktopTable from './AllItemsList/AllItemsDesktopTable';
import AllItemsMobileCards from './AllItemsList/AllItemsMobileCards';
import * as S from './AllItemsList/AllItemsList.styles';
import {
  filterAndSortItems,
  normalizeStatusFilter,
  prepareItemForList,
} from './AllItemsList/allItemsList.utils';

export default function AllItemsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState('alpha');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(() =>
    normalizeStatusFilter(searchParams.get('status')),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    setStatusFilter((current) => (current === queryStatus ? current : queryStatus));
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (statusFilter === 'active') {
      next.delete('status');
    } else {
      next.set('status', statusFilter);
    }

    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, statusFilter]);

  const preparedItems = useMemo(
    () => items.map((item) => prepareItemForList(item)),
    [items],
  );

  const visibleItems = useMemo(
    () => filterAndSortItems(preparedItems, { statusFilter, filter, sortBy }),
    [preparedItems, statusFilter, filter, sortBy],
  );

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
        onStatusChange={setStatusFilter}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
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
