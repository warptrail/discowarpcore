import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { API_BASE } from '../api/API_BASE';
import MiniOrphanedItemRow from './MiniOrphanedItemRow';
import MiniOrphanedListFilters from './MiniOrphanedListFilters';
import * as S from './MiniOrphanedList.styles';
import { ToastContext } from './Toast';

const DEFAULT_PAGE_SIZE = 20;

function parseInitialSort(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'alpha' || normalized === 'alphabetical' || normalized === 'name:asc') {
    return { field: 'name', direction: 'asc' };
  }
  if (normalized === 'name:desc') {
    return { field: 'name', direction: 'desc' };
  }
  if (normalized === 'oldest' || normalized === 'orphaned:asc') {
    return { field: 'orphaned', direction: 'asc' };
  }
  return { field: 'orphaned', direction: 'desc' };
}

function toSortQuery(field, direction) {
  if (field === 'name') return direction === 'desc' ? 'name:desc' : 'name:asc';
  return direction === 'asc' ? 'orphaned:asc' : 'orphaned:desc';
}

function formatOrphanedTime(raw) {
  if (!raw) return 'date unknown';
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return 'date unknown';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(ts);
}

function mergeUniqueById(existing, incoming) {
  const merged = [];
  const seen = new Set();

  for (const item of [...(existing || []), ...(incoming || [])]) {
    const key = String(item?._id || '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

export default function MiniOrphanedList({
  boxMongoId,
  onItemAssigned,
  orphanedItems,
  fetchOrphanedItems,
  refreshKey = 0,
  assignLabel = 'Assign',
  title = 'Items Adrift',
  contextId = '',
  contextLabel = '',
  emptyText = 'No items adrift.',
  showControls = false,
  paginationMode = 'loadMore',
  pageSize = DEFAULT_PAGE_SIZE,
  searchPlaceholder = 'Search name, notes, tags…',
  defaultSort = 'recent',
  fixedViewportHeight = '',
  assignSuccessMessage,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const requestSeqRef = useRef(0);
  const initialSort = useMemo(() => parseInitialSort(defaultSort), [defaultSort]);

  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const isPagedMode = paginationMode === 'paged';

  const [localItems, setLocalItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [sortField, setSortField] = useState(initialSort.field);
  const [sortDirection, setSortDirection] = useState(initialSort.direction);
  const [currentPage, setCurrentPage] = useState(1);

  const usesParentItems = Array.isArray(orphanedItems);
  const sourceItems = usesParentItems ? orphanedItems : localItems;
  const visibleItems = useMemo(
    () => (Array.isArray(sourceItems) ? sourceItems : []),
    [sourceItems],
  );
  const sortQuery = toSortQuery(sortField, sortDirection);
  const hasActiveFilters = Boolean(searchInput.trim() || categoryFilter || locationInput.trim());

  useEffect(() => {
    if (!showControls) {
      setSearchQuery('');
      setLocationQuery('');
      return undefined;
    }

    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setLocationQuery(locationInput.trim());
    }, 180);

    return () => clearTimeout(timer);
  }, [locationInput, searchInput, showControls]);

  useEffect(() => {
    if (!isPagedMode) return;
    setCurrentPage(1);
  }, [
    boxMongoId,
    categoryFilter,
    isPagedMode,
    locationQuery,
    refreshKey,
    searchQuery,
    sortDirection,
    sortField,
  ]);

  const fetchLocalOrphanedItems = useCallback(async ({ offset = 0, append = false } = {}) => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;

    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        sort: sortQuery,
        limit: String(safePageSize),
        offset: String(Math.max(0, Number(offset) || 0)),
        paginated: '1',
      });
      if (showControls && searchQuery) params.set('q', searchQuery);
      if (showControls && categoryFilter) params.set('category', categoryFilter);
      if (showControls && locationQuery) params.set('location', locationQuery);

      const res = await fetch(`${API_BASE}/api/items/orphaned?${params.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (requestSeqRef.current !== requestSeq) return;
      if (!res.ok) {
        throw new Error(body?.error || body?.message || 'Failed to load Items Adrift');
      }

      const pageItems = Array.isArray(body)
        ? body
        : Array.isArray(body?.items)
          ? body.items
          : [];
      const nextTotal = Number.isFinite(Number(body?.total))
        ? Number(body.total)
        : (append ? offset + pageItems.length : pageItems.length);
      const nextHasMore = typeof body?.hasMore === 'boolean'
        ? body.hasMore
        : (offset + pageItems.length < nextTotal);

      setTotalCount(nextTotal);
      setHasMore(nextHasMore);
      setLocalItems((prev) => (
        append ? mergeUniqueById(prev, pageItems) : pageItems
      ));
    } catch (loadError) {
      if (requestSeqRef.current !== requestSeq) return;
      setError(loadError?.message || 'Failed to load Items Adrift');
      if (!append) {
        setLocalItems([]);
        setHasMore(false);
        setTotalCount(0);
      }
    } finally {
      if (requestSeqRef.current === requestSeq) {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    }
  }, [categoryFilter, locationQuery, safePageSize, searchQuery, showControls, sortQuery]);

  useEffect(() => {
    if (usesParentItems) return;

    const offset = isPagedMode
      ? Math.max(0, (Number(currentPage) - 1) * safePageSize)
      : 0;

    fetchLocalOrphanedItems({ offset, append: false });
  }, [
    boxMongoId,
    currentPage,
    fetchLocalOrphanedItems,
    isPagedMode,
    refreshKey,
    safePageSize,
    usesParentItems,
  ]);

  const refreshOrphaned = useCallback(async () => {
    if (typeof fetchOrphanedItems === 'function') {
      await fetchOrphanedItems();
      return;
    }

    const offset = isPagedMode
      ? Math.max(0, (Number(currentPage) - 1) * safePageSize)
      : 0;

    await fetchLocalOrphanedItems({ offset, append: false });
  }, [currentPage, fetchLocalOrphanedItems, fetchOrphanedItems, isPagedMode, safePageSize]);

  const handleAssign = async (item) => {
    const itemId = item?._id;
    if (!itemId || !boxMongoId || assigningId) return;

    setAssigningId(itemId);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/boxed-items/${boxMongoId}/addItem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to assign item');
      }

      setLocalItems((prev) => prev.filter((entry) => String(entry?._id) !== String(itemId)));

      await Promise.all([
        onItemAssigned?.(itemId, { item, boxMongoId }),
        refreshOrphaned(),
      ]);

      const resolvedAssignMessage = typeof assignSuccessMessage === 'function'
        ? assignSuccessMessage(item)
        : String(assignSuccessMessage || '').trim() || `Assigned "${item?.name || 'Item'}" to this box.`;

      showToast?.({
        variant: 'success',
        title: 'Item assigned',
        message: resolvedAssignMessage,
        timeoutMs: 2600,
      });
    } catch (assignError) {
      const message = assignError?.message || 'Failed to assign item';
      setError(message);
      showToast?.({
        variant: 'danger',
        title: 'Assign failed',
        message,
        timeoutMs: 4200,
      });
    } finally {
      setAssigningId(null);
    }
  };

  const resolvedTotal = usesParentItems
    ? visibleItems.length
    : (Number.isFinite(Number(totalCount)) ? Number(totalCount) : visibleItems.length);
  const totalPages = Math.max(1, Math.ceil((resolvedTotal || 0) / safePageSize));
  const showInitialLoading = loading && visibleItems.length === 0;
  const showUpdatingState = loading && visibleItems.length > 0;

  useEffect(() => {
    if (!isPagedMode || currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, isPagedMode, totalPages]);

  const resetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setCategoryFilter('');
    setLocationInput('');
    setLocationQuery('');
  };

  return (
    <S.Panel>
      <S.Header>
        <S.HeadingBlock>
          <S.Eyebrow>{title}</S.Eyebrow>
          {contextId || contextLabel ? (
            <S.TargetLine aria-label={`Target ${contextId ? `box ${contextId}` : ''} ${contextLabel}`.trim()}>
              {contextId ? <S.TargetId>#{contextId}</S.TargetId> : null}
              {contextLabel ? <S.TargetLabel>{contextLabel}</S.TargetLabel> : null}
            </S.TargetLine>
          ) : null}
        </S.HeadingBlock>
        <S.Availability aria-live="polite">{resolvedTotal} available</S.Availability>
      </S.Header>

      <S.Body>
        {showControls && !usesParentItems ? (
          <MiniOrphanedListFilters
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            locationInput={locationInput}
            setLocationInput={setLocationInput}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            toggleSortDirection={() => setSortDirection((direction) => (
              direction === 'asc' ? 'desc' : 'asc'
            ))}
            resetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
            searchPlaceholder={searchPlaceholder}
          />
        ) : null}

        <S.ListViewport $maxHeight={fixedViewportHeight}>
          {showInitialLoading ? <S.StateText>Loading Items Adrift…</S.StateText> : null}
          {showUpdatingState ? <S.StateText>Updating results…</S.StateText> : null}
          {!loading && error ? <S.StateText $error>{error}</S.StateText> : null}
          {!loading && !error && visibleItems.length === 0 ? (
            <S.StateText>{emptyText}</S.StateText>
          ) : null}

          {!error && visibleItems.map((item) => (
            <MiniOrphanedItemRow
              key={item?._id || `${item?.name}-${item?.orphanedAt || 'none'}`}
              item={item}
              assigning={assigningId === item?._id}
              assignmentBusy={Boolean(assigningId)}
              assignLabel={assignLabel}
              boxMongoId={boxMongoId}
              formatOrphanedTime={formatOrphanedTime}
              onAssign={handleAssign}
            />
          ))}
        </S.ListViewport>

        {!usesParentItems && !loading && !error && isPagedMode && totalPages > 1 ? (
          <S.PaginationRow>
            <S.PaginationButton
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1 || loadingMore || Boolean(assigningId)}
            >
              Previous
            </S.PaginationButton>
            <S.PaginationInfo>Page {currentPage} / {totalPages}</S.PaginationInfo>
            <S.PaginationButton
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages || loadingMore || Boolean(assigningId)}
            >
              Next
            </S.PaginationButton>
          </S.PaginationRow>
        ) : null}

        {!usesParentItems && !loading && !error && !isPagedMode && hasMore ? (
          <S.LoadMoreWrap>
            <S.LoadMoreButton
              type="button"
              onClick={() => fetchLocalOrphanedItems({ offset: visibleItems.length, append: true })}
              disabled={loadingMore || Boolean(assigningId)}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </S.LoadMoreButton>
          </S.LoadMoreWrap>
        ) : null}
      </S.Body>
    </S.Panel>
  );
}
