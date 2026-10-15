import styled from 'styled-components';
import * as Controls from '../OperationsQuickPeek/QuickPeekItemControls.styles';

export const Label = styled.button`
  display: flex; align-items: center; justify-content: flex-start; gap: 6px; min-width: 0; width: 100%; min-height: 44px;
  padding: 0; text-align: left; border: 0; border-radius: 2px; background: transparent; color: inherit; font: inherit; cursor: pointer;
  span { min-width: 0; overflow-wrap: anywhere; }
  svg { flex: 0 0 12px; width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.3; opacity: .4; }
  &:hover:not(:disabled) { color: var(--dw-cyan); svg { opacity: 1; } }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  &:disabled { cursor: default; }
`;
export const Command = styled(Controls.Button)`
  flex-shrink: 0; color: ${({ $danger }) => $danger ? 'var(--dw-coral)' : 'var(--dw-text-muted)'};
  &[aria-expanded='true'] { color: var(--dw-cyan); }
`;
export const Menu = styled(Controls.Toolbar)`
  justify-content: flex-start; flex-wrap: wrap; padding: 2px; margin: 2px 0 8px;
  ${Command} { display: flex; gap: 6px; font-size: .75rem; padding-inline: 8px; }
`;
export const NodeText = styled.div`flex: 1; min-width: 0;`;
export const Editor = styled.form`display: grid; gap: 6px; padding: 8px 0 10px; min-width: 0;`;
export const EditorRow = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) 44px 44px; align-items: center; gap: 2px; min-width: 0;
  input { font-size: .85rem; padding-inline: 8px; }
`;
export const Hint = styled.small`color: var(--dw-text-muted); font: 400 .75rem/1.4 var(--dw-font-ui);`;
