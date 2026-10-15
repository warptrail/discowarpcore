import styled from 'styled-components';
import * as Panel from './RetrievalItemPanel.styles';
import * as Missing from '../MissingItems/MissingItems.styles';

export const Commands = styled.div`
  display: grid; gap: 10px; min-width: 0;
  ${Missing.Actions} { gap: 2px; }
`;
export const Rail = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; padding: 2px;
  border: 1px solid var(--prism-sheet-divider); border-radius: 6px; background: #152232;
  button { display: flex; align-items: center; justify-content: center; gap: 6px; min-width: 0;
    min-height: 44px; padding: 0 4px; border: 0; border-radius: 3px; background: transparent;
    color: var(--dw-text-secondary); font: 400 .8rem/1.4 var(--dw-font-ui);
    &:hover:enabled { color: var(--dw-text); background: rgba(var(--box-primary-rgb), .1); }
    &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  }
`;
export const ManagementRail = styled(Rail)`
  grid-template-columns: repeat(2, minmax(0, 1fr));
  ${Missing.Actions} { display: contents; }
  ${Missing.Button} { color: var(--dw-amber); }
  button { padding: 6px; white-space: normal; overflow-wrap: anywhere; }
  [data-declutter-command][aria-pressed='true'] {
    color: var(--dw-coral); background: rgba(255,141,142,.1); box-shadow: inset 0 -2px 0 var(--dw-coral);
  }
  svg { width: 16px; height: 16px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
`;
export const Summary = styled.section`
  min-width: 0; padding-top: 6px;
  h3 { margin: 0 0 4px; color: var(--dw-text-secondary); font: 500 .78rem/1.4 var(--dw-font-ui); }
  dl { margin: 0; }
  dl > div { display: grid; grid-template-columns: 86px minmax(0,1fr); align-items: center;
    border-top: 1px solid var(--prism-sheet-divider); min-width: 0; }
  dt { color: var(--dw-text-secondary); font: 400 .78rem/1.4 var(--dw-font-ui); }
  dd { margin: 0; min-width: 0; color: var(--dw-text); font: 400 .8rem/1.4 var(--dw-font-ui); }
  ${Panel.AttributeButton} { padding: 4px 6px; }
  ${Panel.AttributeValue} { width: 100%; }
`;
export const Value = styled.span`
  display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px;
  width: 100%; min-width: 0; overflow-wrap: anywhere;
  small { color: var(--dw-text-secondary); font: inherit; white-space: nowrap; }
`;
