import styled, { keyframes } from 'styled-components';

const boxAddressClockBlink = keyframes`
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.28; }
`;

// Shared idle address hint, matching the Retrieval console's digital clock.
const BoxAddressClockHint = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--dw-text-secondary);
  font: 850 0.92rem/1 var(--dw-font-data);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  animation: ${boxAddressClockBlink} 2s steps(2, end) infinite;
  @media (prefers-reduced-motion: reduce) { animation: none; opacity: 0.85; }
`;
export default BoxAddressClockHint;
