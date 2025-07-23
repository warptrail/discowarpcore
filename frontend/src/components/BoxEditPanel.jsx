import React, { useState } from 'react';
import styled from 'styled-components';
import ItemEditForm from './ItemEditForm';

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

export default function BoxEditPanel({
  items,
  boxId,
  onItemUpdated,
  refreshBox,
}) {
  const [openItemId, setOpenItemId] = useState(null);

  const handleToggle = (itemId) => {
    setOpenItemId((prev) => (prev === itemId ? null : itemId));
  };

  return (
    <PanelContainer>
      <ItemList>
        {items.map((item) => (
          <div key={item._id}>
            <ItemRow onClick={() => handleToggle(item._id)}>
              {item.name || '(Unnamed Item)'}
            </ItemRow>
            {openItemId === item._id && (
              <ItemEditForm
                item={item}
                boxId={boxId}
                onClose={() => setOpenItemId(null)}
                onItemUpdated={onItemUpdated} // 👈 send it into the form
                refreshBox={refreshBox}
              />
            )}
          </div>
        ))}
      </ItemList>
    </PanelContainer>
  );
}
