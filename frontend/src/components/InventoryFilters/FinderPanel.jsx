import styled from 'styled-components';
import FilterTab from './FinderFilterTab';
import { controlStyles } from '../../styles/primitives';

const Panel = styled.div`display: grid; gap: .25rem; min-width: 0;`;
const Footer = styled.div`
  background: ${({ $shuffled }) => $shuffled ? 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--dw-cyan) 7%, transparent), transparent)' : 'transparent'};
  display: grid;
  grid-template-columns: minmax(0, 1fr) 7.5rem minmax(0, 1fr);
  padding: 0;
  min-width: 0;
  > details { grid-column: 1 / -1; grid-row: 1; border-top: 0; }
  > button { grid-row: 1; align-self: start; z-index: 1; min-height: 32px; height: 32px; border: 0; background: transparent; padding: 0 .35rem; }
  > button:first-child { grid-column: 1; justify-self: end; margin-right: .35rem; }
  > button:last-child { grid-column: 3; justify-self: start; margin-left: .35rem; }
`;
const Reset = styled.button`
  ${controlStyles};
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0; gap: .3rem; padding-inline: .55rem;
  color: var(--dw-text-muted); font-size: .75rem; font-weight: 350; min-height: 32px;
  svg { width: 14px; height: 14px; }
`;
const IconActions = styled.div`
  display: flex; align-items: center; justify-content: flex-end; gap: 2px;
  &[hidden] { display: none; }
  button {
    ${controlStyles};
    display: grid; place-items: center; min-width: 32px; min-height: 32px; padding: 0;
    border: 0; background: transparent; color: var(--dw-text-muted);
    &[data-active='true'] { color: var(--dw-violet); filter: drop-shadow(0 0 4px rgba(167, 182, 255, .35)); }
    &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
    svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.4; }
  }
`;

// Shared visual composition; callers keep their own filter models and actions.
export default function FinderPanel({ children, secondaryFilters, secondaryActive = false,
  filtersActive = false, onReset, leadingAction, shuffled = false, actionsLabel = 'Inventory finder actions',
  compactActions = false, actionsTarget = null, actionsVisible = true }) {
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const secondaryId = useId();
  const iconActions = <IconActions role="group" aria-label={actionsLabel} hidden={!actionsVisible}>
    <button type="button" aria-label="More filters" title={secondaryActive ? 'More filters (filters active)' : 'More filters'} aria-expanded={secondaryOpen} aria-controls={secondaryId}
      data-active={secondaryActive || secondaryOpen} onClick={() => setSecondaryOpen((open) => !open)}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /><circle cx="7" cy="5" r="2" fill="var(--dw-surface)" /><circle cx="13" cy="10" r="2" fill="var(--dw-surface)" /><circle cx="8" cy="15" r="2" fill="var(--dw-surface)" /></svg>
    </button>
    <button type="button" aria-label="Reset all filters" title="Reset all filters" disabled={!filtersActive} onClick={onReset}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 7a5 5 0 1 1 1.2 4.2M3 3v4h4" /></svg>
    </button>
  </IconActions>;
  return <Panel role="group" aria-label="Find and filter inventory" data-shared-finder-panel="true">
    {children}
    {compactActions ? <>
      {actionsTarget ? createPortal(iconActions, actionsTarget) : iconActions}
      <div id={secondaryId} hidden={!secondaryOpen}>{secondaryFilters}</div>
    </> : <Footer $shuffled={shuffled} role="group" aria-label={actionsLabel} data-shuffled={shuffled}>
      {leadingAction}
      <FilterTab active={secondaryActive}>{secondaryFilters}</FilterTab>
      <Reset type="button" aria-label="Reset all filters" title="Reset all filters" disabled={!filtersActive} onClick={onReset}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 7a5 5 0 1 1 1.2 4.2M3 3v4h4" /></svg>
        Reset
      </Reset>
    </Footer>}
  </Panel>;
}
import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
