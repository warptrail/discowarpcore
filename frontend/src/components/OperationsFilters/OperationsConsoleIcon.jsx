import styled, { css, keyframes } from 'styled-components';

const hueOrbit = keyframes`
  from { filter: hue-rotate(0deg) drop-shadow(0 0 3px currentColor); }
  to { filter: hue-rotate(360deg) drop-shadow(0 0 3px currentColor); }
`;
const Glyph = styled.span`
  display: inline-flex; flex: 0 0 14px; color: var(--dw-cyan); opacity: .75;
  svg { display: block; width: 14px; height: 14px; }
  ${({ $idle }) => $idle && css`animation: ${hueOrbit} 24s linear infinite;`}
  animation-play-state: ${({ $paused }) => $paused ? 'paused' : 'running'};
  @media (prefers-reduced-motion: reduce) { animation: none; filter: none; }
`;

export default function OperationsConsoleIcon({ idle = false, paused = false }) {
  return <Glyph $idle={idle} $paused={paused} data-console-scroll={idle || undefined} aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <path d="m1.5 7 6.5-5.5L14.5 7M3.5 5.5V14H12.5V5.5M6.5 14V9H9.5V14" />
    </svg>
  </Glyph>;
}
