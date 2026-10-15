import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Control, StateMessage } from '../styles/primitives';

const Placeholder = styled(StateMessage)`
  max-width: 36rem;
  margin: clamp(1rem, 4vw, 2rem);
`;

export default function AllItemsPlaceholder() {
  return (
    <Placeholder as="section" aria-labelledby="all-items-placeholder-title">
      <h2 id="all-items-placeholder-title">All Items</h2>
      <p>
        This page is on hold for now. Use Retrieval to find items, boxes, and
        their locations.
      </p>
      <Control as={Link} to="/retrieval" $primary>
        Open Retrieval
      </Control>
    </Placeholder>
  );
}
