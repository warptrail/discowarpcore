import styled from 'styled-components';
import IntakeBatchList from '../BulkImport/IntakeBatchList';
import IntakeBatchDetailsPanel from '../BulkImport/IntakeBatchDetailsPanel';
import { Control } from '../../styles/primitives';

const Wrap = styled.div`
  display: grid;
  gap: 1rem;
  min-width: 0;
`;
const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  h2 { margin: 0; font-size: 1.1rem; }
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(230px, 0.65fr) minmax(0, 1.35fr);
  gap: 0.85rem;
  min-width: 0;
  > * { min-width: 0; }
  @media (max-width: 1100px) { grid-template-columns: minmax(0, 1fr); }
`;
export default function ConfigurationBatches({ manager }) {
  const { listProps, detailProps, createPanelProps } = manager;
  return (
    <Wrap>
      <Header><h2>Existing batches</h2>
        <Control onClick={createPanelProps.onRefresh} disabled={createPanelProps.loading}>
          {createPanelProps.loading ? 'Refreshing…' : 'Refresh'}
        </Control>
      </Header>
      <Grid><IntakeBatchList {...listProps} /><IntakeBatchDetailsPanel {...detailProps} /></Grid>
    </Wrap>
  );
}
