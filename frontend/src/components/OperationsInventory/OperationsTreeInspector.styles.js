import styled from 'styled-components';

export const Panel = styled.aside`
  position: fixed;
  z-index: 1;
  left: var(--operations-dock-left);
  top: var(--operations-dock-top);
  bottom: 24px;
  width: 384px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dw-border);
  border-top: 3px solid var(--dw-cyan);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: var(--dw-text);
  &[aria-hidden='true'] { visibility: hidden; pointer-events: none; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px; border-bottom: 1px solid var(--dw-border); }
  h2 { font-size: .95rem; margin: 0; }
  header p { font-size: .75rem; color: var(--dw-text-secondary); margin: 4px 0 0; }
  button { cursor: pointer; font-family: var(--dw-font-ui); }
  button:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export const Close = styled.button`
  flex: 0 0 40px;
  height: 40px;
  background: transparent;
  border: 0;
  color: var(--dw-text-secondary);
  font-size: 1.25rem;
`;
export const Tabs = styled.div`
  display: flex;
  flex-shrink: 0;
  overflow-x: auto;
  border-bottom: 1px solid var(--dw-border);
  button { height: 40px; padding: 0 12px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--dw-text-secondary); font-size: .75rem; }
  button[aria-selected='true'] { color: var(--box-primary); border-bottom-color: var(--box-primary); }
`;
export const Body = styled.div`
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 12px;
  ul { list-style: none; padding: 0; margin: 0; }
  li > ul > li { position: relative; }
  li > ul > li::before { content: ''; position: absolute; left: -8px; top: 24px; width: 8px; border-top: 1px solid var(--dw-border); }
  li > ul { margin-left: 15px; padding-left: 8px; border-left: 1px solid var(--dw-border); }
`;
export const Row = styled.div`
  display: flex;
  align-items: center;
  min-height: 48px;
  border-bottom: 1px solid var(--dw-border);
  > button:first-child { width: 32px; height: 40px; flex: 0 0 32px; border: 0; background: transparent; color: var(--box-primary); }
`;
export const Select = styled.button`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  min-height: 48px;
  text-align: left;
  padding: 6px 4px;
  border: 0;
  background: transparent;
  color: var(--dw-text);
  code { color: var(--box-primary); font: 400 .75rem var(--dw-font-data); }
  strong { font-size: .8rem; font-weight: 550; overflow-wrap: anywhere; }
  span { color: var(--dw-text-secondary); font-size: .7rem; opacity: .65; white-space: nowrap; }
  &:hover { background: rgba(var(--box-primary-rgb), .07); }
`;

export const Edit = styled.button`
  flex: 0 0 32px;
  width: 32px;
  height: 40px;
  border: 0;
  background: transparent;
  color: var(--dw-text-secondary);
  font-size: 1.25rem;
`;
export const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 4px 0 4px 32px;
  button { min-height: 40px; padding: 4px 8px; border: 0; border-radius: var(--dw-radius-sm); background: var(--dw-surface-raised); color: var(--dw-cyan); font-size: .75rem; }
`;
