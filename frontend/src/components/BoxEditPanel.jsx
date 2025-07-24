import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ItemEditForm from './ItemEditForm';

export default function BoxEditPanel({
  items,
  boxId,
  onItemUpdated,
  refreshBox,
}) {
  const [openItemId, setOpenItemId] = useState(null);
  const [visibleItemId, setVisibleItemId] = useState(null);
  const timeoutRef = useRef(null);

  const handleToggle = (itemId) => {
    if (openItemId === itemId) {
      setOpenItemId(null); // begin closing
      timeoutRef.current = setTimeout(() => {
        setVisibleItemId(null); // unmount after slide-up finishes
      }, 300); // must match animation time
    } else {
      clearTimeout(timeoutRef.current); // cancel any previous close
      setVisibleItemId(itemId); // mount immediately
      // wait until it's rendered, then animate open on the next frame
      requestAnimationFrame(() => {
        setOpenItemId(itemId);
      });
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  });

  return (
    <PanelContainer>
      <ItemList>
        {items.map((item) => {
          const isOpen = openItemId === item._id;
          const isVisible = visibleItemId === item._id;

          return (
            <div key={item._id}>
              <ItemRow isOpen={isOpen} onClick={() => handleToggle(item._id)}>
                <BoxLabel>{item.name || '(Unnamed Item)'}</BoxLabel>
              </ItemRow>

              {isVisible && (
                <ItemEditWrapper isOpen={isOpen}>
                  <ItemEditForm
                    item={item}
                    boxId={boxId}
                    onClose={() => handleToggle(item._id)}
                    onItemUpdated={onItemUpdated}
                    refreshBox={refreshBox}
                  />
                </ItemEditWrapper>
              )}
            </div>
          );
        })}
      </ItemList>
    </PanelContainer>
  );
}

//? Styled Components

const ItemEditWrapper = styled.div`
  overflow: hidden;
  max-height: ${({ isOpen }) => (isOpen ? '500px' : '0')};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transform: ${({ isOpen }) =>
    isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
`;

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
  background-color: ${({ isOpen }) => (isOpen ? '#646060' : '#363434')};

  padding: 0.75rem 1rem;
  border-radius: ${({ isOpen }) => (isOpen ? '8px 8px 0px 0px' : '8px')};
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: ${({ isOpen }) => (isOpen ? '1px solid #333' : 'none')};

  &:hover {
    background-color: #9f9c9c;
    color: ${({ isOpen }) => (isOpen ? '#010101' : '#2d2a2a')};
  }
`;

const BoxLabel = styled.h3`
  /* margin: 2rem 0 1rem; */
  font-size: 1.1rem;

  /* border-top: 1px solid #333; */
  padding-top: 0.2rem;
`;
