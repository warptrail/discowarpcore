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

const PAGE_SIZE = 20;

const Wrap = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const Controls = styled.div`
  display: grid;
  gap: 0.42rem;
  grid-template-columns: 1fr 150px 150px 170px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(189, 153, 96, 0.56);
  background: rgba(19, 14, 10, 0.9);
  color: #f7e8d1;
  font-size: 0.9rem;
  padding: 0 0.66rem;

  &:focus {
    outline: none;
    border-color: rgba(235, 193, 121, 0.92);
    box-shadow: 0 0 0 2px rgba(214, 155, 68, 0.22);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Select = styled.select`
  width: 100%;
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(189, 153, 96, 0.56);
  background: rgba(19, 14, 10, 0.9);
  color: #f7e8d1;
  font-size: 0.86rem;
  padding: 0 0.62rem;

  &:focus {
    outline: none;
    border-color: rgba(235, 193, 121, 0.92);
    box-shadow: 0 0 0 2px rgba(214, 155, 68, 0.22);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Viewport = styled.div`
  max-height: min(42vh, 360px);
  overflow: auto;
  border: 1px solid rgba(184, 147, 89, 0.44);
  border-radius: 10px;
  background: rgba(24, 17, 11, 0.58);
  padding: 0.44rem;
  display: grid;
  gap: 0.4rem;
`;

const Row = styled.div`
  border: 1px solid rgba(175, 140, 85, 0.46);
  border-radius: 9px;
  background: rgba(22, 16, 10, 0.86);
  padding: 0.45rem;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 0.48rem;
  align-items: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 48px minmax(0, 1fr);
  }
`;

const Thumb = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 8px;
  border: 1px solid rgba(179, 146, 89, 0.44);
  overflow: hidden;
  background: rgba(20, 14, 9, 0.95);
  display: grid;
  place-items: center;
  color: #c3a980;
  font-size: 0.62rem;
  text-transform: uppercase;
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
  border-radius: 999px;
  border: 1px solid rgba(170, 135, 86, 0.56);
  background: rgba(34, 22, 10, 0.9);
  color: #e6d2b1;
  font-size: 0.64rem;
  padding: 0.18rem 0.38rem;
  line-height: 1;
`;

const MoveButton = styled.button`
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(219, 173, 99, 0.72);
  background: rgba(94, 62, 19, 0.95);
  color: #fff1dc;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 0.62rem;
  cursor: pointer;
  align-self: center;

  &:disabled {
    opacity: 0.54;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-column: 1 / -1;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_XS};
  }
`;

const LoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
`;

const LoadMoreButton = styled.button`
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(219, 173, 99, 0.72);
  background: rgba(74, 49, 18, 0.95);
  color: #ffeccf;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 0.78rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
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
  return (
    item?.image?.thumb?.url ||
    item?.image?.display?.url ||
    item?.image?.original?.url ||
    item?.image?.url ||
    item?.imagePath ||
    ''
  );
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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, tags, category…"
        />

        <Select
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
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
          placeholder="Filter tag"
        />

        <Select
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
