import styled from 'styled-components';
import IntakeBatchCreatePanel from './IntakeBatchCreatePanel';
import IntakeBatchList from './IntakeBatchList';
import IntakeBatchDetailsPanel from './IntakeBatchDetailsPanel';
import useIntakeBatchManager from './useIntakeBatchManager';

const Wrap = styled.section`
  display: grid;
  gap: 0.84rem;
  min-width: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(270px, 0.72fr) minmax(0, 1.28fr);
  gap: 0.84rem;
  align-items: start;
  min-width: 0;
  min-height: 0;

  > * {
    min-width: 0;
  }

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const Feedback = styled.div`
  border-radius: var(--dw-radius-sm);
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(104, 177, 141, 0.6)'
        : $tone === 'error'
          ? 'rgba(206, 114, 114, 0.62)'
          : 'rgba(105, 153, 196, 0.45)'};
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'rgba(16, 40, 31, 0.85)'
      : $tone === 'error'
        ? 'rgba(56, 18, 20, 0.85)'
        : 'rgba(14, 24, 35, 0.85)'};
  color: ${({ $tone }) =>
    $tone === 'success' ? '#c9f1dd' : $tone === 'error' ? '#f2c8c8' : '#bad2e8'};
  padding: 0.56rem 0.62rem;
  font-size: 0.8rem;
`;

export default function IntakeBatchManager(props) {
  const { createPanelProps, listProps, detailProps, feedback } = useIntakeBatchManager(props);
  return (
    <Wrap>
      <IntakeBatchCreatePanel {...createPanelProps} />
      <Grid>
        <IntakeBatchList {...listProps} />
        <IntakeBatchDetailsPanel {...detailProps} />
      </Grid>
      {feedback.message && <Feedback $tone={feedback.tone}>{feedback.message}</Feedback>}
    </Wrap>
  );
}
