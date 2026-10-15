import styled from 'styled-components';

// Shared, purely decorative wall lettering beneath interactive controls.
const PaintedControlLabel = styled.span`
  position: absolute;
  inset: 0 ${({ $hasEndControl }) => $hasEndControl ? '44px' : '0'} 0 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  z-index: 0;
  color: var(--dw-text-secondary);
  opacity: .075;
  font: 900 clamp(1.35rem, 6vw, 2.1rem)/1 var(--dw-font-data);
  letter-spacing: .18em;
  text-transform: uppercase;
  transform: rotate(-3deg);
  filter: blur(.18px);
  text-shadow: .6px -.4px 1px currentColor, -.5px .7px 1.5px currentColor;
`;

export default PaintedControlLabel;
