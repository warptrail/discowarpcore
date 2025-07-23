import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import flattenBoxes from '../util/flattenBoxes';
import BoxEditPanel from './BoxEditPanel';
import ItemTags from './ItemTags';

const Container = styled.div`
  padding: 1.5rem 1rem;
  color: #f0f0f0;
  background-color: #0f0f0f;
  font-family: 'Helvetica Neue', sans-serif;
`;

const Heading = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #ffffff;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 2rem;
    text-align: left;
  }
`;

const ItemList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const Item = styled.li`
  padding: 1rem;
  border-bottom: 1px solid #222;
  font-size: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  word-wrap: break-word;
  background-color: #111; /* default background */

  &:nth-child(even) {
    background-color: #191919; /* slightly lighter for contrast */
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 0.75rem 0;
  }
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

function BoxDetailView() {
  const { boxId } = useParams();
  console.log('🧪 boxId from useParams:', boxId);
  const [box, setBox] = useState(null);
  const [items, setItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [orphanedItems, setOrphanedItems] = useState([]);

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
    setItems((prevItems) =>
      prevItems.map((item) =>
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  // ♻️ Reusable Fetch with full error handling
  const fetchBox = async () => {
    try {
      const res = await fetch(`http://localhost:5002/api/boxes/${boxId}/tree`, {
        headers: { Accept: 'application/json' },
      });

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
    if (!boxId || !/^\d{3}$/.test(boxId)) {
      console.warn('⛔️ Invalid boxId:', boxId);
      return;
    }
    fetchBox(); // 🔁 Use the shared fetch function
  }, [boxId]);

  useEffect(() => {
    if (box) {
      const flat = flattenBoxes(box);
      setItems(flat); // ← make sure `items` and `setItems` are defined at top level
      console.log('🧩 Flattened items:', flat);
    }
  }, [box]);

  if (!box) return <p>Loading box #{boxId}...</p>;

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
      <Heading>
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
          items={items}
          boxId={boxId}
          refreshBox={refreshBox}
          orphanedItems={orphanedItems}
          fetchOrphanedItems={fetchOrphanedItems}
          onItemUpdated={handleItemUpdated}
        />
      ) : (
        renderBoxTree(box)
      )}
    </Container>
  );
}

export default BoxDetailView;
