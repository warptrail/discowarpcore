import styled, { css } from 'styled-components';
import * as Controls from '../OperationsQuickPeek/QuickPeekItemControls.styles';

export const Host = styled.div`
  min-width: 0; min-height: 48px;
  &:empty::before { content: 'Loading locations…'; display: block; padding: 14px 8px; color: var(--dw-text-muted); font-size: .8rem; }
`;
export const Console = styled.div`min-width: 0;`;
export const Row = styled.div`
  display: flex; align-items: center; gap: 6px; min-width: 0; height: 48px; padding: 2px 6px;
  > svg { flex: 0 0 18px; width: 18px; height: 18px; fill: none; stroke: var(--dw-cyan); stroke-width: 1.4; }
`;
export const Breadcrumbs = styled.nav`
  display: flex; align-items: center; flex: 1; gap: 3px; min-width: 0; height: 44px;
  overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;
export const Crumb = styled(Controls.Button)`
  display: flex; padding-inline: 4px; white-space: nowrap; font-size: .8rem; color: var(--dw-cyan);
  ${({ $current }) => $current && css`
    flex-direction: column; align-items: flex-start; justify-content: center; gap: 3px; max-width: 100%; color: var(--dw-text);
    span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
    small { color: var(--dw-text-muted); font: 400 .75rem/1.1 var(--dw-font-ui); }
    &&:disabled { opacity: 1; cursor: default; }
  `}
`;
export const Current = styled(Crumb).attrs({ $current: true })``;
export const Separator = styled.span`flex-shrink: 0; color: var(--dw-text-muted); font-size: .8rem;`;
export const Actions = styled(Controls.Toolbar)`flex-shrink: 0;`;
export const Button = styled(Controls.Button)``;
export const Add = styled(Button)`color: var(--dw-cyan);`;
export const Feedback = styled.div`
  min-width: 0; border-top: 1px solid var(--dw-border-soft); padding: 4px 6px;
`;
export const SearchField = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) 44px; align-items: center; gap: 4px;
`;
export const ResultsHeading = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin-block: 18px 4px;
  h3 { margin: 0; font-size: .9rem; }
  span { color: var(--dw-text-muted); font-size: .75rem; }
`;
export const ScopeDisclosure = styled.details`
  margin-top: 12px;
  summary { display: flex; align-items: center; min-height: 44px; cursor: pointer; color: var(--dw-text-secondary); font-size: .8rem; }
  summary::before { content: '›'; padding-right: 8px; color: var(--dw-cyan); }
  &[open] summary::before { content: '⌄'; }
`;
