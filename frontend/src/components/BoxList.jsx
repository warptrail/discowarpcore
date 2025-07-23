import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

/**
 * Styled Components
 */
const BoxListWrapper = styled.div`
  padding: 1rem;
`;

const BoxContainer = styled.div`
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  margin: 0.75rem 0;
  background-color: #1f1f1f;
`;

const BoxHeader = styled.h2`
  font-size: 1.2rem;
  margin: 0 0 0.5rem;
  color: #fff;
`;

const BoxText = styled.p`
  margin: 0.25rem 0;
  color: #ccc;
`;

const BoxNote = styled.p`
  font-style: italic;
  color: #999;
`;

const ItemList = styled.ul`
  padding-left: 1.25rem;
  margin: 0.5rem 0;
`;

const ItemEntry = styled.li`
  margin-bottom: 0.25rem;
  color: #aaa;
`;

const ChildBoxesWrapper = styled.div`
  margin-left: 1.25rem;
  padding-left: 1rem;
  border-left: 2px solid #333;
`;

const StyledLinkContainer = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;

  &:hover {
    outline: 2px solid #666;
    background-color: #2a2a2a;
  }
`;

const StyledBoxHeaderLink = styled(Link)`
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  text-decoration: none;
  display: block;
  margin-bottom: 0.5rem;

  &:hover {
    text-decoration: underline;
    color: #88f;
  }
`;

/**
 * Recursive Tree Component
 * Renders one box and recursively calls itself for each childBox.
 */

function BoxTreeNode({ box }) {
  return (
    <BoxContainer>
      <StyledBoxHeaderLink to={`/boxes/${box.box_id}`}>
        {box.label} ({box.box_id})
      </StyledBoxHeaderLink>

      {box.location && (
        <BoxText>
          <strong>Location:</strong> {box.location}
        </BoxText>
      )}
      {box.description && <BoxText>{box.description}</BoxText>}
      {box.notes && <BoxNote>{box.notes}</BoxNote>}

      {box.items?.length > 0 && (
        <>
          <BoxText>
            <strong>Items:</strong>
          </BoxText>
          <ItemList>
            {box.items.map((item) => (
              <ItemEntry key={item._id}>
                {item.name} (x{item.quantity})
              </ItemEntry>
            ))}
          </ItemList>
        </>
      )}

      {box.childBoxes?.length > 0 && (
        <ChildBoxesWrapper>
          {box.childBoxes.map((child) => (
            <BoxTreeNode key={child._id} box={child} />
          ))}
        </ChildBoxesWrapper>
      )}
    </BoxContainer>
  );
}

/**
 * Top-level list of boxes (i.e., top-level tree roots).
 * This component gets the data from App and renders each top-level box using the recursive BoxTreeNode.
 */
export default function BoxList({ boxes }) {
  return (
    <BoxListWrapper>
      {boxes.map((box) => (
        <BoxTreeNode key={box._id} box={box} />
      ))}
    </BoxListWrapper>
  );
}
