import styled, { keyframes } from 'styled-components';

const readTip = keyframes`
  0%, 15% { transform: translateX(0); }
  90%, 100% { transform: translateX(calc(-1 * var(--tip-distance, 0px))); }
`;

export const Row = styled.div`
  display: flex; align-items: center; gap: .4rem; height: 32px; min-width: 0;
  color: var(--dw-text-muted); font: 400 .75rem/1.3 var(--dw-font-ui);
  &:has(:focus-visible) [data-console-scroll] { animation-play-state: paused; }
`;
export const Window = styled.div`
  flex: 1; min-width: 0; overflow: hidden;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @media (prefers-reduced-motion: reduce) {
    overflow-x: auto; scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`;
export const Copy = styled.span`
  display: inline-block; white-space: nowrap;
  animation: ${readTip} var(--tip-duration, 14000ms) linear both;
  animation-play-state: ${({ $paused }) => $paused ? 'paused' : 'running'};
  @media (prefers-reduced-motion: reduce) { animation: none; transform: none; }
`;
export const Kind = styled.span`color: var(--dw-text-secondary);`;
export const Button = styled.button`
  display: grid; place-items: center; flex: 0 0 32px; width: 32px; height: 32px; padding: 0;
  border: 0; border-radius: 2px; background: transparent; color: var(--dw-text-muted);
  cursor: pointer; touch-action: manipulation;
  svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
  &:hover, &[aria-pressed='true'] { color: var(--dw-cyan); }
  &&:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @media (prefers-reduced-motion: reduce) { &[data-tip-pause] { display: none; } }
`;
