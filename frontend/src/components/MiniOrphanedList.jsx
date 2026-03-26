import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
  MOBILE_NARROW_BREAKPOINT,
} from '../styles/tokens';

import { API_BASE } from '../api/API_BASE';
import { getItemHomeHref } from '../api/itemDetails';
import { ToastContext } from './Toast';

const DEFAULT_PAGE_SIZE = 20;

const DEFAULT_SORT_OPTIONS = [
  { value: 'recent', label: 'Date Orphaned (Newest)' },
  { value: 'oldest', label: 'Date Orphaned (Oldest)' },
  { value: 'alpha', label: 'Alphabetical (A-Z)' },
];

const Panel = styled.section`
  margin-top: 0.9rem;
  border: 1px solid #2b3430;
  border-radius: 10px;
  background: linear-gradient(180deg, #141817 0%, #101312 100%);
  overflow: hidden;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: 0.62rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.5rem 0.68rem;
  border-bottom: 1px solid #25302b;
  background: linear-gradient(90deg, rgba(78, 199, 123, 0.12) 0%, transparent 48%);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.42rem 0.5rem;
  }
`;

const Title = styled.h4`
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d9e5de;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;
  }
`;

const Count = styled.span`
  font-size: 0.72rem;
  color: #a5b3ab;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Body = styled.div`
  display: grid;
  gap: 0.35rem;
  padding: 0.5rem 0.55rem 0.56rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.3rem;
    padding: 0.42rem;
  }
`;

const ListViewport = styled.div`
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  min-height: 0;
  ${({ $fixedHeight }) => ($fixedHeight ? `
    height: ${$fixedHeight};
    overflow: auto;
    overscroll-behavior: contain;
  ` : '')}
`;

const ControlsRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 0.38rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(90, 128, 110, 0.52);
  background: rgba(12, 16, 14, 0.9);
  color: #dcede4;
  font-size: 0.8rem;
  padding: 0 0.56rem;

  &:focus {
    outline: none;
    border-color: rgba(116, 194, 146, 0.78);
    box-shadow: 0 0 0 2px rgba(75, 142, 101, 0.18);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const SortSelect = styled.select`
  width: 100%;
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(90, 128, 110, 0.52);
  background: rgba(12, 16, 14, 0.9);
  color: #dcede4;
  font-size: 0.77rem;
  padding: 0 0.52rem;

  &:focus {
    outline: none;
    border-color: rgba(116, 194, 146, 0.78);
    box-shadow: 0 0 0 2px rgba(75, 142, 101, 0.18);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  min-height: 34px;
  padding: 0.28rem 0.42rem 0.28rem 0.52rem;
  border-radius: 7px;
  border: 1px solid #2a332f;
  background: #171b1a;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    min-height: 0;
    gap: 0.3rem;
    padding: 0.32rem 0.4rem;
  }
`;

const Identity = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.38rem;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    grid-template-columns: 1fr;
    justify-items: start;
    gap: 0.18rem;
  }
`;

const Name = styled.span`
  min-width: 0;
  color: #e4ece8;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const NameLink = styled(Link)`
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  color: #e4ece8;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: rgba(78, 199, 123, 0.86);
  }
`;

const Meta = styled.span`
  font-size: 0.7rem;
  color: #a3b0a8;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const AssignBtn = styled.button`
  border: 1px solid #3f6f55;
  border-radius: 7px;
  min-height: 26px;
  padding: 0 0.58rem;
  background: #1b2c23;
  color: #def2e7;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:hover:not(:disabled) {
    border-color: #4ec77b;
    background: #244031;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-height: 34px;
    font-size: ${MOBILE_FONT_XS};
  }
`;

const StateText = styled.div`
  font-size: 0.75rem;
  color: ${({ $error }) => ($error ? '#f2b8b8' : '#9faea6')};
  padding: 0.1rem 0.12rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.08rem 0.08rem;
  }
`;

const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  border: 1px solid #3f6f55;
  border-radius: 8px;
  min-height: 34px;
  padding: 0 0.7rem;
  background: #1b2c23;
  color: #def2e7;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const PaginationInfo = styled.span`
  font-size: 0.72rem;
  color: #a5b3ab;
`;

const LoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
`;

const LoadMoreBtn = styled.button`
  border: 1px solid #3f6f55;
  border-radius: 8px;
  min-height: 34px;
  padding: 0 0.82rem;
  background: #1b2c23;
  color: #def2e7;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

function formatOrphanedTime(raw) {
  if (!raw) return '—';
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return '—';
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
    if (!key) continue;
    if (seen.has(key)) continue;
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
  title = 'Orphaned Items',
  emptyText = 'No orphaned items.',
  showControls = false,
  paginationMode = 'loadMore',
  pageSize = DEFAULT_PAGE_SIZE,
  searchPlaceholder = 'Search orphaned items...',
  defaultSort = 'recent',
  sortOptions = DEFAULT_SORT_OPTIONS,
  fixedViewportHeight = '',
  assignSuccessMessage,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const requestSeqRef = useRef(0);

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
  const [sortBy, setSortBy] = useState(defaultSort);
  const [currentPage, setCurrentPage] = useState(1);

  const usesParentItems = Array.isArray(orphanedItems);
  const sourceItems = usesParentItems ? orphanedItems : localItems;
  const visibleItems = useMemo(
    () => (Array.isArray(sourceItems) ? sourceItems : []),
    [sourceItems],
  );

  useEffect(() => {
    if (!showControls) {
      setSearchQuery('');
      return;
    }

    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 180);

    return () => clearTimeout(timer);
  }, [searchInput, showControls]);

  useEffect(() => {
    if (!isPagedMode) return;
    setCurrentPage(1);
  }, [boxMongoId, refreshKey, isPagedMode, searchQuery, sortBy]);

  const fetchLocalOrphanedItems = useCallback(async ({ offset = 0, append = false } = {}) => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const params = new URLSearchParams({
        sort: String(sortBy || 'recent'),
        limit: String(safePageSize),
        offset: String(Math.max(0, Number(offset) || 0)),
        paginated: '1',
      });
      if (showControls && searchQuery) {
        params.set('q', searchQuery);
      }

      const res = await fetch(`${API_BASE}/api/items/orphaned?${params.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (requestSeqRef.current !== requestSeq) return;
      if (!res.ok) {
        throw new Error(body?.error || body?.message || 'Failed to load orphaned items');
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
        append ? mergeUniqueById(prev, pageItems) : (Array.isArray(pageItems) ? pageItems : [])
      ));
    } catch (e) {
      if (requestSeqRef.current !== requestSeq) return;
      setError(e?.message || 'Failed to load orphaned items');
      if (!append) {
        setLocalItems([]);
        setHasMore(false);
        setTotalCount(0);
      }
    } finally {
      if (requestSeqRef.current !== requestSeq) return;
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [safePageSize, searchQuery, showControls, sortBy]);

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
  }, [
    currentPage,
    fetchLocalOrphanedItems,
    fetchOrphanedItems,
    isPagedMode,
    safePageSize,
  ]);

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

      setLocalItems((prev) => prev.filter((it) => String(it?._id) !== String(itemId)));

      await Promise.all([
        onItemAssigned?.(itemId, { item, boxMongoId }),
        refreshOrphaned(),
      ]);

      const resolvedAssignMessage =
        typeof assignSuccessMessage === 'function'
          ? assignSuccessMessage(item)
          : String(assignSuccessMessage || '').trim() ||
            `Assigned "${item?.name || 'Item'}" to this box.`;

      showToast?.({
        variant: 'success',
        title: 'Item assigned',
        message: resolvedAssignMessage,
        timeoutMs: 2600,
      });
    } catch (e) {
      const msg = e?.message || 'Failed to assign item';
      setError(msg);
      showToast?.({
        variant: 'danger',
        title: 'Assign failed',
        message: msg,
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

  return (
    <Panel>
      <Header>
        <Title>{title}</Title>
        <Count>{resolvedTotal}</Count>
      </Header>

      <Body>
        {showControls && !usesParentItems ? (
          <ControlsRow>
            <SearchInput
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search orphaned items"
            />

            <SortSelect
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort orphaned items"
            >
              {(Array.isArray(sortOptions) ? sortOptions : DEFAULT_SORT_OPTIONS).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SortSelect>
          </ControlsRow>
        ) : null}

        <ListViewport $fixedHeight={fixedViewportHeight}>
          {showInitialLoading ? <StateText>Loading orphaned items…</StateText> : null}
          {showUpdatingState ? <StateText>Updating results…</StateText> : null}
          {!loading && error ? <StateText $error>{error}</StateText> : null}
          {!loading && !error && visibleItems.length === 0 ? (
            <StateText>{emptyText}</StateText>
          ) : null}

          {!error &&
            visibleItems.map((item) => (
              <Row key={item?._id || `${item?.name}-${item?.orphanedAt || 'none'}`}>
                <Identity>
                  {item?._id ? (
                    <NameLink
                      to={getItemHomeHref(item._id)}
                      title={item?.name || '(Unnamed Item)'}
                    >
                      {item?.name || '(Unnamed Item)'}
                    </NameLink>
                  ) : (
                    <Name title={item?.name || '(Unnamed Item)'}>
                      {item?.name || '(Unnamed Item)'}
                    </Name>
                  )}
                  <Meta>qty {item?.quantity ?? 1}</Meta>
                  <Meta>{formatOrphanedTime(item?.orphanedAt)}</Meta>
                </Identity>

                <AssignBtn
                  type="button"
                  onClick={() => handleAssign(item)}
                  disabled={!boxMongoId || assigningId === item?._id}
                >
                  {assigningId === item?._id ? 'Assigning…' : assignLabel}
                </AssignBtn>
              </Row>
            ))}

          {!usesParentItems && !loading && !error && isPagedMode && totalPages > 1 ? (
            <PaginationRow>
              <PaginationButton
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || loadingMore || !!assigningId}
              >
                Previous
              </PaginationButton>

              <PaginationInfo>
                Page {currentPage} of {totalPages}
              </PaginationInfo>

              <PaginationButton
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || loadingMore || !!assigningId}
              >
                Next
              </PaginationButton>
            </PaginationRow>
          ) : null}

          {!usesParentItems && !loading && !error && !isPagedMode && hasMore ? (
            <LoadMoreWrap>
              <LoadMoreBtn
                type="button"
                onClick={() => fetchLocalOrphanedItems({ offset: visibleItems.length, append: true })}
                disabled={loadingMore || !!assigningId}
              >
                {loadingMore ? 'Loading…' : 'Load More'}
              </LoadMoreBtn>
            </LoadMoreWrap>
          ) : null}
        </ListViewport>
      </Body>
    </Panel>
  );
}
