import { inputStyles, controlStyles } from '../../styles/primitives';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { API_BASE } from '../../api/API_BASE';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import {
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../../util/itemCategories';
import { getItemThumbnailUrl } from '../../util/itemImage';

const PAGE_SIZE = 20;

const Wrap = styled.div`
  display: grid;
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
`;

const Controls = styled.div`
  display: grid;
  gap: 0.42rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-width: 0;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 42px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  color: #f7e8d1;
  font-size: 0.9rem;
  padding: 0 0.66rem;

  &:focus {
    outline: none;
    border-color: rgba(235, 193, 121, 0.92);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }

  ${inputStyles}
`;

const Select = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 42px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  color: #f7e8d1;
  font-size: 0.86rem;
  padding: 0 0.62rem;

  &:focus {
    outline: none;
    border-color: rgba(235, 193, 121, 0.92);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }

  ${inputStyles}
`;

const Viewport = styled.div`
  max-height: min(42vh, 360px);
  overflow: auto;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  padding: 0.44rem;
  display: grid;
  gap: 0.4rem;
`;

const Row = styled.div`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  padding: 0.45rem;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) minmax(0, 148px);
  gap: 0.48rem;
  align-items: start;
  min-width: 0;
  width: 100%;

  @media (max-width: 1280px) {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 48px minmax(0, 1fr);
  }
`;

const Thumb = styled.div`
  width: 52px;
  height: 52px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  overflow: hidden;
  background: var(--dw-surface-raised);
  display: grid;
  place-items: center;
  color: #c3a980;
  font-size: 0.75rem;
  text-transform: none;

  @media (max-width: 1280px) {
    width: 48px;
    height: 48px;
  }
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Body = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.22rem;
`;

const Name = styled.div`
  color: #f6ead8;
  font-size: 0.88rem;
  font-weight: 700;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Meta = styled.div`
  color: #ceb895;
  font-size: 0.72rem;
  line-height: 1.3;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.24rem;
`;

const Tag = styled.span`
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  color: #e6d2b1;
  font-size: 0.75rem;
  padding: 0.18rem 0.38rem;
  line-height: 1;
`;

const MoveButton = styled.button`
  width: 100%;
  min-height: 34px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  color: #fff1dc;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;
  padding: 0.2rem 0.54rem;
  cursor: pointer;
  align-self: center;
  text-align: center;
  line-height: 1.2;
  white-space: normal;

  &:disabled {
    opacity: 0.54;
    cursor: not-allowed;
  }

  @media (max-width: 1280px) {
    grid-column: 1 / -1;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-column: 1 / -1;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_XS};
  }

  ${controlStyles}
  color: var(--dw-cyan);
  border-color: var(--dw-cyan);
`;

const LoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
`;

const LoadMoreButton = styled.button`
  min-height: 36px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  color: #ffeccf;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;
  padding: 0 0.78rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  ${controlStyles}
`;

const CountMeta = styled.div`
  color: #d4bf9f;
  font-size: 0.72rem;
  text-align: center;
`;

const StateText = styled.div`
  color: ${({ $error }) => ($error ? '#f4bcbc' : '#d4bf9f')};
  font-size: 0.76rem;
  padding: 0.1rem 0.1rem;
`;

function getItemImageUrl(item) {
  return getItemThumbnailUrl(item);
}

function getCurrentBoxText(item) {
  const label = String(item?.box?.label || '').trim();
  const boxId = String(item?.box?.box_id || '').trim();
  if (label && boxId) return `${label} (Box #${boxId})`;
  if (label) return label;
  if (boxId) return `Box #${boxId}`;

  const crumb = Array.isArray(item?.breadcrumb) && item.breadcrumb.length
    ? item.breadcrumb[item.breadcrumb.length - 1]
    : null;
  const crumbLabel = String(crumb?.label || '').trim();
  const crumbBoxId = String(crumb?.box_id || '').trim();
  if (crumbLabel && crumbBoxId) return `${crumbLabel} (Box #${crumbBoxId})`;
  if (crumbLabel) return crumbLabel;
  if (crumbBoxId) return `Box #${crumbBoxId}`;

  return 'Orphaned';
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

export default function IntakeMoveExistingTab({
  currentBox,
  onItemMoved,
}) {
  const requestSeqRef = useRef(0);
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [movingId, setMovingId] = useState('');

  const loadPage = useCallback(async ({ offset = 0, append = false } = {}) => {
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
        status: 'active',
        limit: String(PAGE_SIZE),
        offset: String(Math.max(0, Number(offset) || 0)),
        sort: String(sortBy || 'alphabetical'),
      });
      if (search.trim()) params.set('q', search.trim());
      if (tagFilter.trim()) params.set('tag', tagFilter.trim());
      if (categoryFilter.trim()) params.set('category', normalizeItemCategory(categoryFilter));

      const res = await fetch(`${API_BASE}/api/items?${params.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || body?.message || `Failed to load items (${res.status})`);
      }

      if (requestSeqRef.current !== requestSeq) return;

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
      setItems((prev) => (
        append ? mergeUniqueById(prev, pageItems) : pageItems
      ));
    } catch (loadError) {
      if (requestSeqRef.current !== requestSeq) return;
      setError(loadError?.message || 'Failed to load items.');
      if (!append) {
        setItems([]);
        setTotalCount(0);
        setHasMore(false);
      }
    } finally {
      if (requestSeqRef.current === requestSeq) {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    }
  }, [categoryFilter, search, sortBy, tagFilter]);

  useEffect(() => {
    loadPage({ offset: 0, append: false });
  }, [loadPage, currentBox?._id]);

  const handleMoveToCurrentBox = async (item) => {
    const itemId = String(item?._id || '').trim();
    const destBoxId = String(currentBox?._id || '').trim();
    if (!itemId || !destBoxId || movingId) return;

    setMovingId(itemId);
    setError('');
    setStatus('');

    try {
      const response = await fetch(`${API_BASE}/api/boxed-items/moveItem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          destBoxId,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error || body?.message || `Move failed (${response.status})`);
      }

      const movedMessage = `Moved ${item?.name || 'item'} to box #${currentBox?.box_id || '---'}.`;
      const movedItem = {
        ...item,
        boxId: destBoxId,
        box: {
          _id: destBoxId,
          box_id: currentBox?.box_id,
          label: currentBox?.label,
        },
      };

      setItems((prev) =>
        (Array.isArray(prev) ? prev : []).map((entry) =>
          String(entry?._id || '') === itemId ? movedItem : entry,
        ),
      );
      setStatus(movedMessage);

      onItemMoved?.({
        itemId,
        destBoxId,
        sourceBoxId: String(item?.box?._id || item?.boxId || ''),
        sourceBox: item?.box
          ? {
              _id: item.box._id,
              box_id: item.box.box_id,
              label: item.box.label,
            }
          : null,
        item: movedItem,
        message: movedMessage,
      });
    } catch (moveError) {
      setError(moveError?.message || 'Failed to move item.');
    } finally {
      setMovingId('');
    }
  };

  return (
    <Wrap>
      <Controls>
        <Input
          type="text"
          aria-label="Search items to move"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, tags, category…"
        />

        <Select
          aria-label="Filter items by category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="">All Categories</option>
          {ITEM_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatItemCategory(category)}
            </option>
          ))}
        </Select>

        <Input
          type="text"
          aria-label="Filter items by tag"
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
          placeholder="Filter tag"
        />

        <Select
          aria-label="Sort items to move"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="alphabetical">Sort: Alphabetical</option>
          <option value="boxId">Sort: Box ID</option>
          <option value="created:desc">Sort: Created (Newest)</option>
          <option value="created:asc">Sort: Created (Oldest)</option>
          <option value="updated:desc">Sort: Updated (Newest)</option>
          <option value="updated:asc">Sort: Updated (Oldest)</option>
          <option value="acquired:desc">Sort: Acquired (Newest)</option>
          <option value="acquired:asc">Sort: Acquired (Oldest)</option>
          <option value="lastUsed:desc">Sort: Last Used (Newest)</option>
          <option value="lastUsed:asc">Sort: Last Used (Oldest)</option>
          <option value="orphaned:desc">Sort: Orphaned (Newest)</option>
          <option value="orphaned:asc">Sort: Orphaned (Oldest)</option>
        </Select>
      </Controls>

      <Viewport>
        {loading ? <StateText>Loading items…</StateText> : null}
        {!loading && error ? <StateText $error>{error}</StateText> : null}
        {!loading && !error && items.length === 0 ? (
          <StateText>No matching items found.</StateText>
        ) : null}

        {!loading &&
          !error &&
          items.map((item) => {
            const id = String(item?._id || '').trim();
            const imageUrl = getItemImageUrl(item);
            const tags = Array.isArray(item?.tags) ? item.tags : [];
            const itemAlreadyInCurrent =
              String(item?.box?._id || item?.boxId || '') === String(currentBox?._id || '');

            return (
              <Row key={id || `${item?.name || 'item'}-${item?.createdAt || ''}`}>
                <Thumb>
                  {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : 'No Img'}
                </Thumb>

                <Body>
                  <Name>{item?.name || 'Unnamed item'}</Name>
                  <Meta>Current: {getCurrentBoxText(item)}</Meta>
                  <Meta>Category: {formatItemCategory(item?.category)}</Meta>
                  {tags.length ? (
                    <TagRow>
                      {tags.slice(0, 5).map((tag) => (
                        <Tag key={`${id}-${tag}`}>{tag}</Tag>
                      ))}
                    </TagRow>
                  ) : null}
                </Body>

                <MoveButton
                  type="button"
                  disabled={!currentBox?._id || !id || !!movingId || itemAlreadyInCurrent}
                  onClick={() => handleMoveToCurrentBox(item)}
                >
                  {movingId === id ? 'Moving…' : itemAlreadyInCurrent ? 'Already Current' : 'Move To Current Box'}
                </MoveButton>
              </Row>
            );
          })}
      </Viewport>

      {totalCount > 0 ? (
        <CountMeta>Loaded {items.length} of {totalCount}</CountMeta>
      ) : null}

      {!loading && !error && hasMore ? (
        <LoadMoreWrap>
          <LoadMoreButton
            type="button"
            disabled={loadingMore || !!movingId}
            onClick={() => loadPage({ offset: items.length, append: true })}
          >
            {loadingMore ? 'Loading…' : 'Load More'}
          </LoadMoreButton>
        </LoadMoreWrap>
      ) : null}

      {status ? <StateText>{status}</StateText> : null}
    </Wrap>
  );
}
