import styled from 'styled-components';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 520;
  display: grid;
  place-items: center;
  padding: 0.75rem;
  background: rgba(2, 6, 10, 0.86);
  backdrop-filter: blur(12px);
`;

const Panel = styled.section`
  width: min(100%, 680px);
  max-height: calc(100dvh - 1.5rem);
  overflow: auto;
  padding: 1rem;
  border: 1px solid rgba(76, 198, 193, 0.68);
  border-radius: 12px;
  background:
    radial-gradient(circle at 90% 0%, rgba(127, 215, 255, 0.14), transparent 40%),
    #0c1218;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
`;

const Title = styled.h2`
  margin: 0;
  color: #e6edf3;
  font: 900 1rem/1.2 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Subtitle = styled.p`
  margin: 0.35rem 0 0;
  color: rgba(185, 195, 205, 0.7);
  font-size: 0.78rem;
`;

const Close = styled.button`
  width: 36px;
  height: 36px;
  border: 1px solid rgba(127, 215, 255, 0.42);
  border-radius: 7px;
  background: #101923;
  color: #e6edf3;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1rem;
`;

const Metric = styled.div`
  min-height: 112px;
  padding: 0.85rem;
  border: 1px solid ${({ $tone }) => $tone || 'rgba(127, 215, 255, 0.28)'};
  border-radius: 8px;
  background: rgba(16, 24, 32, 0.92);
`;

const Value = styled.div`
  color: #e6edf3;
  font: 900 clamp(1.65rem, 8vw, 2.5rem)/1 "SFMono-Regular", Consolas, monospace;
`;

const Label = styled.div`
  margin-top: 0.55rem;
  color: rgba(185, 195, 205, 0.72);
  font: 0.7rem/1.3 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export default function AllItemsInsightsModal({ counts, visibleCount, onClose }) {
  const metrics = [
    ['Shown now', visibleCount, '#7fd7ff'],
    ['Total history', counts.total, '#a78bfa'],
    ['Active', counts.active, '#4cc6c1'],
    ['Gone', counts.gone, '#f08a7b'],
    ['Orphaned', counts.orphaned, '#e8b15c'],
  ];

  return (
    <Backdrop role="presentation">
      <Panel role="dialog" aria-modal="true" aria-label="Inventory pulse" onClick={(event) => event.stopPropagation()}>
        <Header>
          <div>
            <Title>Inventory Pulse</Title>
            <Subtitle>A quick read of the All Items workspace.</Subtitle>
          </div>
          <Close type="button" onClick={onClose} aria-label="Close inventory pulse">×</Close>
        </Header>
        <Grid>
          {metrics.map(([label, value, tone]) => (
            <Metric key={label} $tone={tone}>
              <Value>{Number(value || 0).toLocaleString()}</Value>
              <Label>{label}</Label>
            </Metric>
          ))}
        </Grid>
      </Panel>
    </Backdrop>
  );
}
