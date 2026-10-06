import styled from 'styled-components';

const Bar = styled.div`
  order: 3;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  min-width: 0;
  padding: 3px 6px calc(3px + env(safe-area-inset-bottom));
  background: var(--dw-surface);
  border-top: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
  @media (min-width: 768px) {
    order: 1;
    padding: 4px 8px;
    background: rgba(12, 21, 32, 0.65);
    border-top: 0;
    border-bottom: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.12);
  }
`;

const Action = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 38px;
  min-width: 0;
  padding: 0 0.55rem;
  border: 0;
  border-radius: 5px;
  color: var(--dw-text-secondary);
  background: transparent;
  font: 600 0.75rem/1 var(--dw-font-ui);
  white-space: nowrap;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
  &[aria-pressed='true'] {
    color: var(--box-primary, var(--dw-cyan));
    background: linear-gradient(160deg, rgba(var(--box-primary-rgb, 127, 215, 255), 0.17), rgba(var(--box-primary-rgb, 127, 215, 255), 0.04));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  &:hover { color: var(--dw-text); background-color: rgba(223, 243, 255, 0.06); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  &:disabled { opacity: 0.35; cursor: default; }
  svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
const Count = styled.span`font-size: 0.65rem; opacity: 0.7;`;
const OpenAction = styled(Action)`margin-left: auto; padding-inline: 0.4rem;`;

export default function QuickPeekControlCenter({ notesOpen, count, onViewChange, sortLabel, sortSymbol, onSort, onOpenFullBox, isAdrift }) {
  return (
    <Bar role="group" aria-label="Quick Peek views and actions">
      <Action type="button" aria-pressed={!notesOpen} aria-controls="quick-peek-view" onClick={() => onViewChange(false)}>
        Items <Count>{count}</Count>
      </Action>
      <Action type="button" aria-pressed={notesOpen} aria-controls="quick-peek-view" onClick={() => onViewChange(true)}>Notes</Action>
      <Action type="button" aria-label={`Sort items by ${sortLabel}`} title={`Sort: ${sortLabel}`} disabled={notesOpen} onClick={onSort}>{sortSymbol}</Action>
      <OpenAction type="button" onClick={onOpenFullBox}>
        {isAdrift ? 'Open all items' : 'Open full box'}
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6M8 6h6v6" /></svg>
      </OpenAction>
    </Bar>
  );
}
