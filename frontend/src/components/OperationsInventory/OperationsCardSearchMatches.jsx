import styled from 'styled-components';
import InventorySearchMatches from '../InventorySearchMatches';

const MatchStrip = styled.div`
  position: relative; z-index: 1; min-width: 0; min-height: 0; margin-inline: 6px;
  border-top: 1px solid rgba(var(--box-primary-rgb), .18);
  > ul { height: 100%; }
`;

export default function OperationsCardSearchMatches({ items, query, boxId }) {
  return <MatchStrip data-operations-card-matches>
    <InventorySearchMatches compact items={items} query={query} boxId={boxId} label={`Matching items in box ${boxId}`} />
  </MatchStrip>;
}
