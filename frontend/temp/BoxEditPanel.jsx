//! July 19, 2025 at 5:09:20 PM PDT

import React, { useState } from 'react';
import styled from 'styled-components';
// ? Sub Component imports:
import ItemEditForm from './ItemEditForm';

// Styled components

const PanelContainer = styled.div`
  background-color: #121212;
  padding: 1rem;
  border-radius: 12px;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ItemRow = styled.div`
  background-color: #1e1e1e;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2a2a2a;
  }
`;

const BoxLabel = styled.h3`
  margin: 2rem 0 1rem;
  font-size: 1.1rem;
  color: #aaa;
  border-top: 1px solid #333;
  padding-top: 0.5rem;
`;

function BoxEditPanel({ box }) {
  // State
  const [items, setItems] = useState(box.items || []);
  const [openItemId, setOpenItemId] = useState(null);

  const handleToggle = (itemId) => {
    setOpenItemId((prev) => (prev === itemId ? null : itemId));
  };

  // 🔁 Called by the child when it successfully saves
  const handleItemUpdated = (updatedItem) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  const flattenBoxes = (box) => {
    const result = [{ box_id: box.box_id, items: box.items }];

    for (const child of box.childBoxes || []) {
      result.push(...flattenBoxes(child));
    }

    return result;
  };

  const flattened = flattenBoxes(box);

  // Render
  return (
    <PanelContainer>
      {flattened.map(({ box_id, items }) => (
        <div key={box_id}>
          <BoxLabel>📦 Box {box_id}</BoxLabel>
          <ItemList>
            {items.map((item) => (
              <div key={item._id}>
                <ItemRow onClick={() => handleToggle(item._id)}>
                  {item.name || '(Unnamed Item)'}
                </ItemRow>
                {openItemId === item._id && (
                  <ItemEditForm
                    item={item}
                    onClose={() => setOpenItemId(null)}
                  />
                )}
              </div>
            ))}
          </ItemList>
        </div>
      ))}
    </PanelContainer>
  );
}

export default BoxEditPanel;
