import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  border-top: 1px solid #333;
  animation: ${fadeSlideIn} 0.4s ease-out;
`;

const ListTitle = styled.h4`
  color: #ccc;
  margin-bottom: 1rem;
`;

const ItemList = styled.ul`
  list-style: none;
  padding: 0;
`;

const Item = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 6px;
`;

const ItemText = styled.span`
  color: #eee;
`;

const AssignButton = styled.button`
  background-color: #00cc99;
  color: #000;
  font-weight: bold;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #00e6aa;
  }

  &:active {
    background-color: #00cc99;
    transform: scale(0.98);
  }
`;

const EmptyMessage = styled.p`
  color: #666;
  font-style: italic;
`;

export default function MiniOrphanedList({
  boxMongoId,
  onItemAssigned,
  orphanedItems,
  fetchOrphanedItems,
}) {
  useEffect(() => {
    fetchOrphanedItems();
  }, []);

  const handleAssign = async (itemId) => {
    try {
      await fetch(`http://localhost:5002/api/boxItem/${boxMongoId}/additem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      onItemAssigned(); // parent can re-fetch box
      fetchOrphanedItems(); // refresh this list
    } catch (err) {
      console.error('❌ Failed to assign item:', err);
    }
  };

  return (
    <Container>
      <ListTitle>🧺 Recently Orphaned Items</ListTitle>

      {!Array.isArray(orphanedItems) || orphanedItems.length === 0 ? (
        <EmptyMessage>
          No orphaned items - everything in it's right place 🧼
        </EmptyMessage>
      ) : (
        <ItemList>
          {orphanedItems.map((item) => (
            <Item key={item._id}>
              <ItemText>
                {item.name} (qty: {item.quantity})
              </ItemText>
              <AssignButton onClick={() => handleAssign(item._id)}>
                Assign to This Box
              </AssignButton>
            </Item>
          ))}
        </ItemList>
      )}
    </Container>
  );
}
