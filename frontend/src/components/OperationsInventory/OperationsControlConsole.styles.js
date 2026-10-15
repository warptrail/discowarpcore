import styled, { keyframes } from 'styled-components';

const spectrumShift = keyframes`
  from, to { filter: hue-rotate(-6deg); }
  50% { filter: hue-rotate(6deg); }
`;

export const Console = styled.div`
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-areas: 'utility telemetry';
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px 20px;
  min-width: 0;
  padding: 10px 12px 12px;
  border: 1px solid var(--dw-border-soft);
  border-radius: 6px;
  background: linear-gradient(110deg, rgba(255, 187, 108, .045), transparent 65%), var(--dw-surface-raised);
  box-shadow: inset 0 1px 0 rgba(223, 243, 255, .035);

  @media (max-width: 560px) {
    grid-template-areas: 'utility';
    grid-template-columns: minmax(0, 1fr);
    padding: 6px 10px 8px;
  }
`;

export const Summary = styled.dl`
  grid-area: telemetry;
  justify-self: end;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: min(100%, 324px);
  min-width: 0;
  margin: 0;

  @media (max-width: 560px) { display: none; }
`;

export const Metric = styled.div`
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  gap: 3px;
  min-width: 0;
  padding-inline: 12px;
  &:not(:first-child) { border-left: 1px solid var(--dw-border-soft); }
  &:last-child { padding-right: 0; }

  dt {
    grid-row: 2;
    color: var(--dw-text-secondary);
    font: 500 .75rem/1.25 var(--dw-font-ui);
  }
  dd {
    grid-row: 1;
    margin: 0;
    color: ${({ $tone }) => `var(--dw-${$tone})`};
    font: 600 1.08rem/1.2 var(--dw-font-data);
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;

export const SpectrumRail = styled.div`
  position: absolute;
  inset: auto 8px 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 3px;
  height: 2px;
  opacity: .65;
  pointer-events: none;
  animation: ${spectrumShift} 28s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const SpectrumSegment = styled.span`
  background: ${({ $gradient }) => $gradient};
`;
