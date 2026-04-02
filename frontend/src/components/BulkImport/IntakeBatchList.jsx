import styled from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const Panel = styled.section`
  border: 1px solid rgba(96, 152, 189, 0.36);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(12, 20, 29, 0.95) 0%, rgba(8, 14, 22, 0.98) 100%);
  padding: 0.82rem;
  display: grid;
  gap: 0.64rem;
  align-content: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.68rem;
    gap: 0.6rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
`;

const HeaderText = styled.div`
  display: grid;
  gap: 0.2rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.88rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e2effc;
`;

const Text = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: #90aac1;
`;

const CountChip = styled.div`
  border-radius: 999px;
  border: 1px solid rgba(88, 143, 184, 0.36);
  background: rgba(10, 22, 33, 0.92);
  color: #bfdaee;
  padding: 0.22rem 0.5rem;
  font-size: 0.68rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const List = styled.div`
  display: grid;
  gap: 0.34rem;
  align-content: start;
`;

const QueueRow = styled.button`
  text-align: left;
  width: 100%;
  border-radius: 10px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'rgba(125, 193, 239, 0.78)' : 'rgba(87, 128, 160, 0.28)'};
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(180deg, rgba(24, 58, 81, 0.98) 0%, rgba(17, 38, 55, 0.98) 100%)'
      : 'linear-gradient(180deg, rgba(11, 21, 31, 0.96) 0%, rgba(8, 16, 24, 0.98) 100%)'};
  box-shadow: ${({ $selected }) =>
    $selected ? '0 0 0 1px rgba(118, 184, 228, 0.16)' : 'none'};
  color: #d9ebfb;
  padding: 0.62rem 0.68rem 0.62rem 0.82rem;
  display: grid;
  gap: 0.3rem;
  cursor: pointer;
  position: relative;
  transition:
    border-color 140ms ease,
    background 140ms ease,
    transform 140ms ease,
    box-shadow 140ms ease;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $selected }) => ($selected ? '6px' : '3px')};
    border-radius: 10px 0 0 10px;
    background: ${({ $selected }) =>
      $selected
        ? 'linear-gradient(180deg, #f3b56f 0%, #77d7bb 45%, #75b7f0 100%)'
        : 'rgba(81, 121, 151, 0.44)'};
  }

  &:hover {
    border-color: ${({ $selected }) =>
      $selected ? 'rgba(125, 193, 239, 0.84)' : 'rgba(102, 167, 212, 0.48)'};
    background: ${({ $selected }) =>
      $selected
        ? 'linear-gradient(180deg, rgba(27, 64, 89, 0.98) 0%, rgba(19, 42, 60, 0.98) 100%)'
        : 'linear-gradient(180deg, rgba(13, 25, 37, 0.98) 0%, rgba(10, 19, 29, 0.98) 100%)'};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(145, 187, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(91, 141, 236, 0.22);
  }
`;

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
`;

const BatchName = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: #e9f5ff;
  line-height: 1.2;
`;

const StatePill = styled.div`
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(104, 177, 141, 0.5)'
        : $tone === 'warning'
          ? 'rgba(201, 163, 97, 0.5)'
          : $tone === 'error'
            ? 'rgba(206, 114, 114, 0.5)'
            : 'rgba(88, 143, 184, 0.36)'};
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'rgba(16, 40, 31, 0.85)'
      : $tone === 'warning'
        ? 'rgba(51, 35, 16, 0.85)'
        : $tone === 'error'
          ? 'rgba(56, 18, 20, 0.85)'
          : 'rgba(14, 24, 35, 0.85)'};
  color: ${({ $tone }) =>
    $tone === 'success'
      ? '#c9f1dd'
      : $tone === 'warning'
        ? '#efd2a5'
        : $tone === 'error'
          ? '#f2c8c8'
          : '#c2d8ec'};
  padding: 0.14rem 0.42rem;
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const SelectedLine = styled.div`
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7fd3c6;
`;

const SecondaryLine = styled.div`
  font-size: 0.73rem;
  color: #b3cade;
  line-height: 1.35;
`;

const SubduedLine = styled.div`
  font-size: 0.68rem;
  color: #819cb4;
`;

const Empty = styled.div`
  border-radius: 10px;
  border: 1px dashed rgba(104, 155, 191, 0.46);
  background: rgba(8, 15, 23, 0.78);
  color: #9fb8cf;
  font-size: 0.8rem;
  padding: 0.78rem;
`;

function toDisplayDate(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
}

function statusTone(batch) {
  if (batch.importStatus === 'imported') return 'success';
  if (batch.validation?.ok) return 'success';
  if (batch.hasJsonFile && batch.hasCsvFile) return 'warning';
  return 'error';
}

function toQueueState(batch) {
  if (batch.importStatus === 'imported') {
    return { label: 'imported', tone: 'success' };
  }
  if (batch.validation?.ok) {
    return { label: 'ready', tone: 'success' };
  }
  if (batch.hasJsonFile && batch.hasCsvFile) {
    return { label: 'needs validation', tone: 'warning' };
  }
  return { label: 'needs assets', tone: 'error' };
}

function toAssetLine(batch) {
  if (batch.originalImagesCount || batch.stagedImagesCount) {
    return `${batch.originalImagesCount} original · ${batch.stagedImagesCount} staged`;
  }
  if (batch.hasJsonFile || batch.hasCsvFile) {
    return `JSON ${batch.hasJsonFile ? 'present' : 'missing'} · CSV ${batch.hasCsvFile ? 'present' : 'missing'}`;
  }
  return 'No assets attached yet';
}

export default function IntakeBatchList({ batches, selectedBatchId, onSelect }) {
  return (
    <Panel>
      <Header>
        <HeaderText>
          <Title>Existing Batches</Title>
          <Text>Select a batch to manage its assets and import status.</Text>
        </HeaderText>
        <CountChip>{batches.length} batch{batches.length === 1 ? '' : 'es'}</CountChip>
      </Header>

      {batches.length ? (
        <List role="listbox" aria-label="Intake batches">
          {batches.map((batch) => {
            const selected = batch.id === selectedBatchId;
            const queueState = toQueueState(batch);
            return (
              <QueueRow
                key={batch.id}
                type="button"
                role="option"
                aria-selected={selected}
                $selected={selected}
                onClick={() => onSelect(batch.id)}
              >
                <RowTop>
                  <BatchName>{batch.name}</BatchName>
                  <StatePill $tone={queueState.tone}>{queueState.label}</StatePill>
                </RowTop>

                <SecondaryLine>{toAssetLine(batch)}</SecondaryLine>
                <SubduedLine>Updated {toDisplayDate(batch.updatedAt || batch.createdAt)}</SubduedLine>
                {selected ? <SelectedLine>Active batch</SelectedLine> : null}
              </QueueRow>
            );
          })}
        </List>
      ) : (
        <Empty>No intake batches yet. Create one above to start a batch workflow.</Empty>
      )}
    </Panel>
  );
}
