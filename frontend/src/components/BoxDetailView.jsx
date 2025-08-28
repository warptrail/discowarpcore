import { useEffect, useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import flattenBoxes from '../util/flattenBoxes';
import BoxEditPanel from './BoxEditPanel';
import ItemTags from './ItemTags';

const flashBorder = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(78,199,123,0.0); }
  50%  { box-shadow: 0 0 0 3px rgba(78,199,123,0.35); }
  100% { box-shadow: 0 0 0 0 rgba(78,199,123,0.0); }
`;

const Container = styled.div`
  padding: 1.5rem 1rem;
  color: #f0f0f0;
  background-color: #0f0f0f;
  font-family: 'Helvetica Neue', sans-serif;
`;

const Heading = styled.h2`
  /* keep your existing styles */
  ${({ $flash }) =>
    $flash &&
    css`
      display: inline-block;
      padding: 2px 6px;
      border-radius: 8px;
      animation: ${flashBorder} 600ms ease-out 0ms 2;
      background: #19231d;
    `}
`;

const TabToggle = styled.div`
  display: flex;
  border-bottom: 2px solid #333;
  margin-bottom: 1.5rem;
  justify-content: space-around;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 1rem;
  font-size: 1rem;
  background: ${({ $active }) => ($active ? '#111' : 'transparent')};
  color: ${({ $active }) => ($active ? '#f0f0f0' : '#aaa')};
  border: none;
  border-bottom: ${({ $active }) =>
    $active ? '2px solid #00ffcc' : '2px solid transparent'};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #1a1a1a;
  }

  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

const TreeWrapper = styled.div`
  margin-left: 1.5rem;
  border-left: 2px solid #444;
  padding-left: 1rem;
`;

const Subheading = styled.h3`
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  color: #ccc;
`;

const TreeItemList = styled.ul`
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.5rem 0;
`;

const TreeItem = styled.li`
  margin-bottom: 0.25rem;
  color: #aaa;
`;

// Styled empty message (dark-mode friendly)
const EmptyMessage = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-size: 0.95rem;
  margin-top: 0.5rem;
`;

const ViewGrid = styled.ul`
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr; /* mobile-first */
  gap: 10px;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Card = styled.li`
  background: #181818;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 140px; /* uniform feel */
  transition: border-color 0.15s ease, transform 0.05s ease;

  &:active {
    transform: translateY(1px);
  }
  &:hover {
    border-color: #3a3a3a;
  }
`;

const ClickWrap = styled.button`
  all: unset;
  cursor: pointer;
  display: contents; /* let inner layout drive size */
`;

const CardBody = styled.div`
  padding: 10px 12px 8px 12px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const ItemName = styled.div`
  font-weight: 700;
  color: #eaeaea;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Qty = styled.span`
  font-size: 12px;
  color: #bdbdbd;
  background: #0f0f0f;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  padding: 2px 6px;
  flex-shrink: 0;
`;

const Desc = styled.p`
  margin: 6px 0 0;
  color: #bdbdbd;
  font-size: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* truncate to 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6em; /* keeps rows uniform */
`;

const TagBar = styled.div`
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  border-top: 1px solid #222;
  overflow-x: auto;
`;

const TagChip = styled.span`
  white-space: nowrap;
  font-size: 11px;
  color: #d7d7d7;
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 999px;
  padding: 4px 8px;
`;

const EmptyState = styled.div`
  margin: 14px 0 0;
  padding: 14px 12px;
  border-radius: 10px;
  border: 1px dashed #2a2a2a;
  background: #101010;
  color: #bdbdbd;
  font-size: 14px;
`;

// ! BoxDetailView COMPONENT START =======================
function BoxDetailView() {
  const { shortId } = useParams();

  // ? State
  const [box, setBox] = useState(null);
  const [items, setItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [orphanedItems, setOrphanedItems] = useState([]);
  const [flashHeader, setFlashHeader] = useState(false);

  // ? Ref
  const abortRef = useRef(null);

  // ? Router helpers
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const goToItem = (item) => {
    if (!item?._id) return;
    navigate(`/items/${item._id}?from=${box.box_id}`, {
      state: {
        fromBox: { _id: box._id, shortId: box.box_id, label: box.label },
      },
    });
  };

  // BoxDetailView.jsx
  const handleBoxMetaUpdated = (partial) => {
    setBox((prev) => ({ ...prev, ...partial })); // label, box_id, tags, etc.
  };

  const handleBoxSaved = (updated) => {
    const oldShortId = box?.box_id;
    const newShortId = updated?.box_id;

    // optimistic header update
    handleBoxMetaUpdated({
      label: updated?.label,
      box_id: newShortId,
      tags: updated?.tags,
    });

    // if shortId changed → navigate; tell child we navigated
    if (newShortId && newShortId !== oldShortId) {
      navigate(`/boxes/${newShortId}?open=edit`, {
        state: { flash: 'renumber' },
        replace: true,
      });
      return true; // <-- signal: navigated
    }

    return false; // <-- signal: no navigation
  };

  const fetchOrphanedItems = async () => {
    try {
      const res = await fetch(
        'http://localhost:5002/api/items/orphaned?sort=recent&limit=20'
      );
      const data = await res.json();
      setOrphanedItems(data);
    } catch (err) {
      console.error('❌ Failed to fetch orphaned items:', err);
    }
  };

  const handleItemUpdated = (updatedItem) => {
    console.log('testing handleItemUpdated');
    setItems((prevItems) =>
      prevItems.map((item) =>
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  // ♻️ Reusable Fetch with full error handling
  const fetchBox = async () => {
    try {
      const res = await fetch(
        `http://localhost:5002/api/boxes/${shortId}/tree`,
        {
          headers: { Accept: 'application/json' },
        }
      );

      const contentType = res.headers.get('content-type');

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }

      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(
          `Unexpected content type: ${contentType || 'unknown'}\n${text}`
        );
      }

      const data = await res.json();
      setBox(data);
      console.log('📦 Box fetched:', data);
    } catch (err) {
      console.error('❌ Error fetching box tree:', err);
    }
  };

  // Refresh the box after updates
  const refreshBox = async () => {
    console.log('🔁 Refreshing full box...');
    await fetchBox(); // gets current box data
    await fetchOrphanedItems();
  };

  const isTreeEmpty = (node) => {
    if (!node) return true;
    const itemCount = Array.isArray(node.items) ? node.items.length : 0;

    // Support a few possible child fields: children, childBoxes, boxes
    const kids = node.children || node.childBoxes || node.boxes || [];
    if (itemCount > 0) return false;

    if (Array.isArray(kids) && kids.length) {
      return kids.every(isTreeEmpty);
    }
    return true;
  };

  useEffect(() => {
    if (!shortId || !/^\d{3}$/.test(shortId)) {
      console.warn('⛔️ Invalid shortId:', shortId);
      return;
    }
    fetchBox(); // 🔁 Use the shared fetch function
  }, [shortId]);

  useEffect(() => {
    if (box) {
      const flat = flattenBoxes(box);
      setItems(flat);
    }
  }, [box]);

  // one-time parse to auto-open edit and flash after renumber-nav
  useEffect(() => {
    const open = params.get('open');
    if (open === 'edit') setEditMode?.(true);

    if (location.state?.flash === 'renumber') {
      setFlashHeader(true);
      setTimeout(() => setFlashHeader(false), 1400);
    }

    if (open) {
      const cleaned = new URLSearchParams(params);
      cleaned.delete('open');
      navigate({ search: cleaned.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!box) return <p>Loading box #{shortId}...</p>;

  function renderBoxTree(boxNode) {
    return (
      <div key={boxNode._id}>
        <Subheading>
          {boxNode.label} (#{boxNode.box_id})
        </Subheading>

        <TreeItemList>
          {boxNode.items.map((item) => (
            <TreeItem key={item._id}>
              {item.name} (x{item.quantity}) — {item.notes}
              <ItemTags tags={item.tags} />
            </TreeItem>
          ))}
        </TreeItemList>

        {boxNode.childBoxes?.length > 0 && (
          <TreeWrapper>
            {boxNode.childBoxes.map((child) => renderBoxTree(child))}
          </TreeWrapper>
        )}
      </div>
    );
  }

  return (
    <Container>
      <Heading $flash={flashHeader}>
        {box.label} (#{box.box_id})
      </Heading>
      <TabToggle>
        <TabButton $active={!editMode} onClick={() => setEditMode(false)}>
          View Mode
        </TabButton>
        <TabButton $active={editMode} onClick={() => setEditMode(true)}>
          Edit Mode
        </TabButton>
      </TabToggle>

      {editMode ? (
        <BoxEditPanel
          flatItems={items}
          shortId={shortId}
          boxMongoId={box._id}
          boxTree={box}
          onItemAssigned={refreshBox}
          orphanedItems={orphanedItems}
          fetchOrphanedItems={fetchOrphanedItems}
          onItemUpdated={handleItemUpdated}
          refreshBox={refreshBox}
          onBoxSaved={handleBoxSaved}
        />
      ) : (
        <>
          {Array.isArray(items) && items.length > 0 ? (
            <ViewGrid>
              {items.map((it) => {
                const id = it?._id ?? it?.id;
                const name = it?.name || '(Unnamed Item)';
                const qty = it?.quantity ?? it?.qty ?? 1;
                const desc = it?.description || it?.desc || '';
                const tags = Array.isArray(it?.tags) ? it.tags : [];

                return (
                  <Card key={id}>
                    <ClickWrap
                      onClick={() => goToItem(it)}
                      aria-label={`Open ${name}`}
                    >
                      <CardBody>
                        <TitleRow>
                          <ItemName title={name}>{name}</ItemName>
                          <Qty>x{qty}</Qty>
                        </TitleRow>
                        {desc ? (
                          <Desc title={desc}>{desc}</Desc>
                        ) : (
                          <Desc>&nbsp;</Desc>
                        )}
                      </CardBody>

                      <TagBar>
                        {tags.length ? (
                          tags
                            .slice(0, 6)
                            .map((t) => (
                              <TagChip key={`${id}-${t}`}>#{t}</TagChip>
                            ))
                        ) : (
                          <TagChip>no-tags</TagChip>
                        )}
                      </TagBar>
                    </ClickWrap>
                  </Card>
                );
              })}
            </ViewGrid>
          ) : (
            <EmptyState>This box is empty. Add some items below.</EmptyState>
          )}
        </>
      )}
    </Container>
  );
}

export default BoxDetailView;
