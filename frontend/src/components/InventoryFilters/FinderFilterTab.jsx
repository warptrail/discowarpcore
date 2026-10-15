import styled from 'styled-components';
import MoreFilters from './MoreFilters';

const Tab = styled(MoreFilters)`
  > summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .35rem;
    width: 7.5rem;
    box-sizing: border-box;
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    list-style: none;
    border: 0;
    background: transparent;
    min-height: 32px;
    line-height: 32px;
    font-size: .75rem;
    color: var(--dw-text-muted);
    font-weight: 350;
  }
  > summary::-webkit-details-marker { display: none; }
  > summary svg { width: 12px; height: 12px; flex-shrink: 0; }
  &[open] > summary svg { transform: rotate(180deg); }
  &[open] > :not(summary) { margin-top: .35rem; }
  &[data-filters-active='true']:not([open]) > summary {
    color: var(--retrieval-mode-accent, var(--dw-violet));
    text-shadow: 0 0 8px color-mix(in srgb, var(--retrieval-mode-accent, var(--dw-violet)) 55%, transparent);
  }
  @media (pointer: coarse) { > summary { min-height: 32px; line-height: 32px; } }
`;

export default function FinderFilterTab({ active, children }) {
  return <Tab data-filters-active={Boolean(active)}>
    <summary>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      More filters
    </summary>
    {children}
  </Tab>;
}
