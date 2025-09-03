import { useEffect, useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import flattenBoxes from '../util/flattenBoxes';
import BoxMetaPanel from './BoxMetaPanel';
import BoxEditPanel from './BoxEditPanel';
import ItemDetails from './ItemDetails';

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

// Top-level nested boxes list (for child boxes)
const TreeList = styled.ul`
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
`;

const TreeNode = styled.li`
  list-style: none;
  margin: 10px 0;
  border: 1px solid #222;
  border-radius: 14px;
  overflow: hidden;
  background: #161818; /* boxes: solid background */
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: #2b2b2b;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.24);
  }
`;

const ItemList = styled.ul`
  list-style: none;
  margin: 8px 0;
  padding: 0;
`;

const ItemNode = styled.li`
  /* card look + alternation */
  border: 1px solid #222;
  border-radius: 14px;
  overflow: hidden;
  transition: background-color 0.15s ease, border-color 0.15s ease,
    box-shadow 0.15s ease;
  margin: 10px 0;

  &:nth-child(odd) {
    background-color: #272b2bff;
  }
  &:nth-child(even) {
    background-color: #191b1a;
  }

  &:hover {
    border-color: #2b2b2b;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.24);
  }
`;

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);

  /* subtle glow when hovering over box header */
  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const NodeChildren = styled.div`
  margin-left: 1rem;
  margin-top: 0.5rem;

  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  /* Subtle left border line for hierarchy */
  border-left: 1px dashed rgba(255, 255, 255, 0.1);
  padding-left: 1rem;
`;

const NodeTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  font-size: 1rem;
  font-weight: 600;
  color: #f0f0f0;

  /* Allow long labels but gracefully cut them off */
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BoxLabelText = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: #e6ffe6;

  /* Ensure long labels don’t break layout */
  max-width: 240px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    color: #9eff9e;
  }
`;

const Meta = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);

  /* Keeps the numbers/items aligned nicely */
  display: inline-flex;
  align-items: center;

  &:first-of-type {
    margin-left: 1rem; /* extra gap from the label text */
  }
`;

/* the rest are divs/spans (not li) */
const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 6px;
  min-height: 40px;
  cursor: pointer;
`;

const ItemTitle = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  color: #f0f0f0;
  font-size: 15px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemQuantity = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #e0e0e0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 2px 8px;
  line-height: 1.4;
  white-space: nowrap;
`;

const NotePreview = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 6px 14px 8px;

  /* one-line clamp with ellipsis */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* reserve height even when empty */
  line-height: 1.2;
  min-height: 1.2em;
`;

const RowDivider = styled.div`
  height: 1px;
  margin: 0 10px;
  background: linear-gradient(
    90deg,
    transparent,
    #202020 25%,
    #202020 75%,
    transparent
  );
  opacity: 0.9;
`;

const TagRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px 10px;
  min-height: 28px;
`;

const TagBubble = styled.span`
  display: inline-block;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #d0d0d0;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
  padding: 2px 10px;
  white-space: nowrap;
  user-select: none;
`;

const DetailsWrap = styled.div`
  overflow: hidden;
  /* simple fade-in; height is handled by mount/unmount */
  animation: fadeIn 160ms ease;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const EmptyMessage = styled.div`
  padding: 16px;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#9aa6b2'};
  border: 1px dashed
    ${({ theme }) => theme?.colors?.border || 'rgba(120,130,155,0.35)'};
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
`;

const API_BASE = 'http://localhost:5002';

// ! BoxDetailView COMPONENT START =======================
function BoxDetailView() {
  const { shortId } = useParams();

  // ? State
  const [box, setBox] = useState(null);
  const [items, setItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [orphanedItems, setOrphanedItems] = useState([]);
  const [flashHeader, setFlashHeader] = useState(false);
  const [openItemIdView, setOpenItemIdView] = useState(null);

  // ? Ref
  const abortRef = useRef(null);

  // ? Router helpers
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ! Animation Helpers
  // smooth close → then navigate
  const nextTwoFrames = () =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const closeAndGoToItem = async (itemId) => {
    // 1) close the inline details panel
    setOpenItemIdView(null);

    // 2) let the collapse animation commit (2 RAFs is usually enough)
    await nextTwoFrames();

    // (optional) tiny buffer if your collapse uses transitions
    // await new Promise((r) => setTimeout(r, 120));

    // 3) navigate to the item page
    navigate(`/items/${itemId}`);
  };

  const toggleItemOpen = (id) =>
    setOpenItemIdView((prev) => (prev === id ? null : id));

  const goToItem = (item) => {
    const id = item?._id;
    if (!id) return;
    navigate(`/items/${id}?from=${box.box_id}`, {
      state: {
        fromBox: { _id: box._id, shortId: box.box_id, label: box.label },
      },
    });
  };

  const handleOpenItem = (itemId) => {
    // navigate to the item’s dedicated page
    navigate(`/items/${itemId}`);
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

  const renderTree = (node, { isRoot = false } = {}) => {
    if (!node) return null;

    const childBoxes = Array.isArray(node.children)
      ? node.children
      : node.boxes || [];
    const itemsHere = Array.isArray(node.items) ? node.items : [];

    return (
      <TreeNode key={node._id || node.box_id}>
        <NodeHeader>
          <NodeTitle>
            <BoxLabelText title={node.label || '(Unnamed Box)'}>
              {node.label || '(Unnamed Box)'}&nbsp;(#{node.box_id})
            </BoxLabelText>
            <Meta>
              {itemsHere.length} item{itemsHere.length === 1 ? '' : 's'}
            </Meta>
            {childBoxes.length ? (
              <Meta>
                {childBoxes.length} sub-box{childBoxes.length === 1 ? '' : 'es'}
              </Meta>
            ) : null}
          </NodeTitle>
        </NodeHeader>

        <NodeChildren>
          {/* Root-only empty message when no items */}
          {isRoot && itemsHere.length === 0 && (
            <EmptyMessage>
              This box is empty. Add some items below.
            </EmptyMessage>
          )}

          {/* Items */}
          {itemsHere.length > 0 && (
            <ItemList>
              {itemsHere.map((it) => {
                const id = it?._id ?? it?.id;
                const name = it?.name || '(Unnamed Item)';
                const qty = it?.quantity ?? it?.qty ?? 1;
                const notes = it?.notes || it?.description || it?.desc || '';
                const tags = Array.isArray(it?.tags) ? it.tags : [];
                const isOpen = openItemIdView === id;

                return (
                  <ItemNode key={id}>
                    {/* Header row */}
                    <ItemRow
                      onClick={() => toggleItemOpen(id)}
                      aria-expanded={isOpen}
                      aria-controls={isOpen ? `item-${id}-details` : undefined}
                    >
                      <ItemTitle title={name}>{name}</ItemTitle>
                      <ItemQuantity>x{qty}</ItemQuantity>
                    </ItemRow>

                    {/* always present, even if empty */}
                    <NotePreview title={notes || undefined}>
                      {notes || '\u00A0' /* non-breaking space keeps height */}
                    </NotePreview>

                    <RowDivider />

                    {/* Right-aligned tags (reserve space when collapsed) */}
                    {!isOpen && (
                      <TagRow>
                        {tags.length
                          ? tags
                              .slice(0, 8)
                              .map((t) => (
                                <TagBubble key={`${id}-${t}`}>#{t}</TagBubble>
                              ))
                          : null}
                      </TagRow>
                    )}

                    {/* ✅ Mount ItemDetails ONLY when open */}
                    {isOpen && (
                      <DetailsWrap $open id={`item-${id}-details`}>
                        <ItemDetails
                          item={it}
                          onOpenItem={() => closeAndGoToItem(it._id)}
                          onGoToTag={(t) =>
                            navigate(`/tags/${encodeURIComponent(t)}`)
                          }
                          onGoToItemsHome={() => navigate('/items')}
                        />
                      </DetailsWrap>
                    )}
                  </ItemNode>
                );
              })}
            </ItemList>
          )}

          {/* Child boxes (always open) */}
          {childBoxes.length > 0 && (
            <TreeList>{childBoxes.map((child) => renderTree(child))}</TreeList>
          )}

          {/* Child boxes (always open) */}
          {childBoxes.length ? (
            <TreeList>{childBoxes.map((child) => renderTree(child))}</TreeList>
          ) : null}
        </NodeChildren>
      </TreeNode>
    );
  };

  return (
    <Container>
      <BoxMetaPanel
        box={box} // your boxTree/root of the current view
        onGoToParent={
          box?.parentBox
            ? () => {
                // If you store parent as full object:
                const short =
                  typeof box.parentBox === 'object'
                    ? box.parentBox.box_id
                    : box.parentBox;
                navigate(`/boxes/${short}`); // keeps your rule: route is relative root
              }
            : undefined
        }
      />
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
          {box ? (
            <>
              <TreeList>{renderTree(box, { isRoot: true })}</TreeList>
            </>
          ) : null}
        </>
      )}
    </Container>
  );
}

export default BoxDetailView;
