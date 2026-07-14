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
  border: 1px solid rgba(76, 123, 98, 0.48);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(18, 26, 23, 0.98) 0%, rgba(9, 14, 12, 0.98) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(194, 238, 215, 0.04),
    0 16px 34px rgba(0, 0, 0, 0.24);
  overflow: hidden;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: 0.62rem;
    border-radius: calc(${MOBILE_PANEL_RADIUS} + 2px);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.62rem 0.78rem;
  border-bottom: 1px solid rgba(71, 103, 86, 0.46);
  background:
    linear-gradient(90deg, rgba(78, 199, 123, 0.16) 0%, rgba(78, 199, 123, 0.02) 38%, transparent 74%),
    linear-gradient(180deg, rgba(17, 27, 23, 0.98) 0%, rgba(11, 17, 15, 0.98) 100%);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.5rem 0.58rem;
  }
`;

const Title = styled.h4`
  margin: 0;
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #d8e8df;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.32);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.08em;
  }
`;

const Count = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.9rem;
  min-height: 1.55rem;
  padding: 0 0.48rem;
  border-radius: 999px;
  border: 1px solid rgba(97, 143, 117, 0.5);
  background: rgba(19, 33, 27, 0.82);
  font-size: 0.71rem;
  font-weight: 700;
  color: #b6cdc0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.58rem 0.6rem 0.62rem;
  min-height: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.38rem;
    padding: 0.46rem;
  }
`;

const ListViewport = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.46rem;
  min-width: 0;
  min-height: 0;
  ${({ $maxHeight }) => ($maxHeight ? `
    max-height: ${$maxHeight};
    overflow: auto;
    overscroll-behavior: contain;
    padding-right: 0.08rem;
  ` : '')}

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(92, 132, 108, 0.48);
  }
`;

const ControlsRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 0.46rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(86, 132, 104, 0.56);
  background:
    linear-gradient(180deg, rgba(15, 20, 18, 0.96) 0%, rgba(10, 14, 13, 0.98) 100%);
  color: #dfede6;
  font-size: 0.79rem;
  padding: 0 0.72rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);

  &:focus {
    outline: none;
    border-color: rgba(116, 194, 146, 0.84);
    box-shadow: 0 0 0 2px rgba(75, 142, 101, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const SortSelect = styled.select`
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(86, 132, 104, 0.56);
  background:
    linear-gradient(180deg, rgba(15, 20, 18, 0.96) 0%, rgba(10, 14, 13, 0.98) 100%);
  color: #dcede4;
  font-size: 0.75rem;
  padding: 0 0.7rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);

  &:focus {
    outline: none;
    border-color: rgba(116, 194, 146, 0.84);
    box-shadow: 0 0 0 2px rgba(75, 142, 101, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Row = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  align-content: center;
  gap: 0.68rem;
  flex: 0 0 auto;
  padding: 0.62rem 0.62rem 0.62rem 0.82rem;
  border-radius: 12px;
  border: 1px solid rgba(63, 87, 74, 0.7);
  background:
    linear-gradient(90deg, rgba(102, 190, 138, 0.1) 0%, rgba(102, 190, 138, 0.02) 16%, transparent 38%),
    linear-gradient(180deg, rgba(28, 33, 30, 0.98) 0%, rgba(20, 24, 22, 0.98) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 10px 18px rgba(0, 0, 0, 0.18);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 4px;
    border-radius: 0 999px 999px 0;
    background: linear-gradient(180deg, #7fd699 0%, #3f815a 100%);
    opacity: 0.92;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 0.58rem 0.58rem 0.58rem 0.78rem;
  }
`;

const IdentityTopRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.58rem;
  width: 100%;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    gap: 0.46rem;
  }
`;

const IdentityText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
`;

const ThumbFrame = styled.div`
  width: 46px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(92, 124, 107, 0.62);
  background:
    linear-gradient(180deg, rgba(16, 24, 21, 0.98) 0%, rgba(9, 13, 12, 0.98) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 4px 10px rgba(0, 0, 0, 0.18);
`;

const ThumbImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;

const ThumbPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(82, 110, 95, 0.18) 0%, rgba(38, 51, 45, 0.3) 100%);
`;

const Identity = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    gap: 0.34rem;
  }
`;

const Name = styled.span`
  min-width: 0;
  color: #e7efe9;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.25;
  white-space: normal;
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
  color: #e7efe9;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.25;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }

  &:hover {
    color: #f1fff6;
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: rgba(104, 212, 146, 0.92);
  }
`;

const MetaCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
`;

const Meta = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 1.35rem;
  padding: 0.1rem 0.44rem;
  border-radius: 999px;
  border: 1px solid rgba(91, 116, 103, 0.6);
  background: rgba(18, 24, 21, 0.9);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #a9b8af;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const AssignBtn = styled.button`
  min-width: 94px;
  border: 1px solid rgba(87, 145, 110, 0.78);
  border-radius: 999px;
  min-height: 34px;
  padding: 0 0.86rem;
  background:
    linear-gradient(180deg, rgba(34, 61, 46, 0.98) 0%, rgba(26, 45, 35, 0.98) 100%);
  color: #e4f5eb;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  &:hover:not(:disabled) {
    border-color: rgba(112, 201, 147, 0.92);
    background:
      linear-gradient(180deg, rgba(40, 72, 54, 1) 0%, rgba(28, 52, 39, 1) 100%);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_XS};
  }
`;

const StateText = styled.div`
  font-size: 0.75rem;
  color: ${({ $error }) => ($error ? '#f2b8b8' : '#9faea6')};
  padding: 0.34rem 0.42rem;
  border-radius: 10px;
  border: 1px dashed ${({ $error }) => ($error ? 'rgba(201, 96, 96, 0.42)' : 'rgba(95, 126, 109, 0.38)')};
  background: ${({ $error }) => ($error ? 'rgba(74, 24, 24, 0.22)' : 'rgba(16, 22, 19, 0.54)')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.28rem 0.32rem;
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

function getItemThumbUrl(item) {
  return String(
    item?.image?.thumb?.url ||
    item?.image?.display?.url ||
    ''
  ).trim();
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
      if (requestSeqRef.current === requestSeq) {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
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

        <ListViewport $maxHeight={fixedViewportHeight}>
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
                  <IdentityTopRow>
                    <ThumbFrame aria-hidden="true">
                      {getItemThumbUrl(item) ? (
                        <ThumbImage
                          src={getItemThumbUrl(item)}
                          alt=""
                        />
                      ) : (
                        <ThumbPlaceholder />
                      )}
                    </ThumbFrame>

                    <IdentityText>
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
                    </IdentityText>
                  </IdentityTopRow>

                  <MetaCluster>
                    <Meta>qty {item?.quantity ?? 1}</Meta>
                    <Meta>{formatOrphanedTime(item?.orphanedAt)}</Meta>
                  </MetaCluster>
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
