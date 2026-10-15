import styled from 'styled-components';
import { Divider } from './QuickPeekItemControls.styles';

const Bar = styled.div`
  order: 3;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 2px 4px calc(2px + env(safe-area-inset-bottom));
  background: var(--dw-surface-raised);
  border-top: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
  @media (max-width: 360px) { gap: 0; padding-inline: 0; }
  @media (min-width: 768px) {
    order: 1;
    padding: 2px 4px;
    border-top: 0;
    border-bottom: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.12);
  }
`;

const Action = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 44px;
  min-width: 44px;
  flex: 0 0 auto;
  padding: 0 6px;
  border: 0;
  border-radius: 2px;
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
  svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
const Count = styled.span`font-size: 0.65rem; opacity: 0.7;
  @media (max-width: 360px) { position: absolute; top: 3px; right: 2px; }
`;
const ItemsAction = styled(Action)`position: relative;`;
const ItemsText = styled.span`@media (max-width: 360px) { display: none; }`;
const ItemsIcon = styled.svg`display: none; @media (max-width: 360px) { display: block; }`;
const OpenAction = styled(Action)`margin-left: auto;`;

export default function QuickPeekControlCenter({ notesOpen, count, onViewChange, sortLabel, sortSymbol, onSort, onOpenFullBox, isAdrift, navigationControls, addItemsControl }) {
  return (
    <Bar role="group" aria-label="Quick Peek views and actions">
      <ItemsAction type="button" aria-label={`Items ${count}`} title="Box items" aria-pressed={!notesOpen} aria-controls="quick-peek-view" onClick={() => onViewChange(false)}>
        <ItemsIcon viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1" /></ItemsIcon>
        <ItemsText>Items</ItemsText> <Count aria-hidden="true">{count}</Count>
      </ItemsAction>
      <Action type="button" aria-label="Notes" title="Box notes" aria-pressed={notesOpen} aria-controls="quick-peek-view" onClick={() => onViewChange(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4M3 6h3M3 12h3M3 18h3" /></svg>
      </Action>
      <Action type="button" aria-label={`Sort items by ${sortLabel}`} title={`Sort: ${sortLabel}`} disabled={notesOpen} onClick={onSort}>{sortSymbol}</Action>
      {addItemsControl}
      <Divider aria-hidden="true" />
      {!isAdrift ? (
        <OpenAction type="button" aria-label="Open full box"
          title="Open full box" onClick={onOpenFullBox}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M10 4H4v16h16v-6" /></svg>
        </OpenAction>
      ) : null}
      {navigationControls}
    </Bar>
  );
}
