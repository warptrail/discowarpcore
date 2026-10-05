import { Link } from 'react-router-dom';
import styled from 'styled-components';

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`;

const BoxCard = styled.div`
  border: 1px solid rgba(230, 237, 243, 0.14);
  border-left: 3px solid var(--dw-teal);
  border-radius: var(--dw-radius);
  padding: 1rem;
  background-color: var(--dw-surface);
  color: var(--dw-text);
`;

const BoxTitle = styled.h2`
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: var(--dw-text);
`;

const ItemList = styled.ul`
  margin-left: 1rem;
`;

const Item = styled.li`
  margin: 0.25rem 0;
`;

function BoxItem({ box }) {
  return (
    <StyledLink to={`/box/${box.box_id}`}>
      <BoxCard>
        <BoxTitle>
          {box.label} (#{box.box_id})
        </BoxTitle>
        <ItemList>
          {box.items.map((item) => (
            <Item key={item.id}>
              {item.name} (x{item.quantity})
            </Item>
          ))}
        </ItemList>
      </BoxCard>
    </StyledLink>
  );
}

export default BoxItem;
