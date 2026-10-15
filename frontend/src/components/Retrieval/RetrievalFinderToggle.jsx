import styled, { keyframes } from 'styled-components';
import useRetrievalFinderInvitation from './useRetrievalFinderInvitation';
import { getRetrievalFinderCue } from './retrievalFinderCue';

const invitationTurn = keyframes`
  0% { transform: rotate(0deg); }
  20%, 100% { transform: rotate(360deg); }
`;
const filteredPulse = keyframes`
  0%, 100% {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dw-violet) 8%, transparent),
      0 0 4px color-mix(in srgb, var(--dw-violet) 8%, transparent);
  }
  50% {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dw-violet) 28%, transparent),
      0 0 8px color-mix(in srgb, var(--dw-violet) 30%, transparent);
  }
`;
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid ${({ $open }) => $open ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: ${({ $open }) => $open ? 'var(--dw-amber)' : 'var(--dw-cyan)'};
  cursor: pointer;
  transition: color 140ms ease, border-color 140ms ease;
  > span { display: inline-flex; transform-origin: center; }
  svg { width: 21px; height: 21px; }
  &[data-cue='invite'] > span { animation: ${invitationTurn} 18s ease-in-out infinite; }
  &[data-cue='filtered'] {
    border-color: var(--dw-violet);
    color: var(--dw-violet);
    animation: ${filteredPulse} 3.2s ease-in-out infinite;
  }
  @media (hover: hover) {
    &:hover { animation: none; border-color: currentColor; }
    &:hover > span { animation: none; }
  }
  &:focus-visible { animation: none; border-color: currentColor; }
  &:focus-visible > span { animation: none; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    &, &[data-cue], &[data-cue] > span { animation: none; transition: none; }
  }
`;

export function RetrievalFinderToggleButton({ minimized = false, filtersActive = false, inviting = false, onClick, children }) {
  const cue = getRetrievalFinderCue({ minimized, filtersActive, inviting });
  const title = `${minimized ? 'Show' : 'Hide'} retrieval controls${filtersActive ? ' · Filters active' : ''}`;
  return <Button type="button" id="retrieval-finder-toggle" $open={!minimized} onClick={onClick}
    aria-label="Toggle retrieval search" aria-controls="retrieval-controls-panel retrieval-search-panel" aria-expanded={!minimized}
    title={title} data-cue={cue} data-filters-active={filtersActive ? 'true' : 'false'}>
    <span aria-hidden="true">{children}</span>
  </Button>;
}

export default function RetrievalFinderToggle(props) {
  const inviting = useRetrievalFinderInvitation();
  return <RetrievalFinderToggleButton {...props} inviting={inviting} />;
}
