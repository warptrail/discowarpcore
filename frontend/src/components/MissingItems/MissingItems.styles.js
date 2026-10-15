import styled from 'styled-components';
export const Status = styled.span`
  display: inline-block; color: var(--dw-amber); font: 500 .78rem/1.5 var(--dw-font-ui);
  overflow-wrap: anywhere; white-space: normal;
`;
export const Actions = styled.div`display:flex; gap:8px; flex-wrap:wrap; align-items:center; min-width:0;`;
export const Button = styled.button`
  min-height:44px; padding:8px 12px; border:1px solid var(--dw-border-soft); border-radius:8px;
  color:var(--dw-text); background:var(--dw-surface-raised); font:500 .85rem/1.3 var(--dw-font-ui); cursor:pointer;
  &:focus-visible {outline:2px solid var(--dw-cyan);outline-offset:2px;}
  &:disabled {opacity:.5;cursor:default;}
`;
export const Form = styled.form`
  display:grid; gap:16px; min-width:0; color:var(--dw-text); overflow-wrap:anywhere;
  label {display:grid;gap:6px;font-size:.85rem;}
  input:not([type='checkbox']), textarea, select {box-sizing:border-box;width:100%;min-height:44px;padding:10px;
    border:1px solid var(--dw-border);border-radius:8px;background:var(--dw-surface-raised);color:var(--dw-text);font:inherit;}
  input:focus-visible, textarea:focus-visible, select:focus-visible {outline:2px solid var(--dw-cyan);outline-offset:2px;}
  p {margin:0;line-height:1.5;} small {color:var(--dw-text-secondary);}
  label[data-check] {display:flex;align-items:flex-start;gap:10px;min-height:44px;}
  input[type='checkbox'] {width:20px;height:20px;flex-shrink:0;}
`;
export const ErrorText = styled.p`color:var(--dw-coral);`;
export const Lane = styled.section`
  margin:12px 0;padding:12px;border:1px solid var(--dw-border-soft);border-radius:12px;background:var(--dw-surface);
  color:var(--dw-text);min-width:0;
  h2 {margin:0;font-size:1rem;} p {font-size:.85rem;line-height:1.5;}
`;
export const Toggle = styled(Button)`width:100%;display:flex;justify-content:space-between;gap:12px;color:var(--dw-amber);text-align:left;`;
export const List = styled.ul`list-style:none;margin:12px 0;padding:0;`;
export const Row = styled.li`
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:12px 0;border-bottom:1px solid var(--dw-border-soft);
  min-width:0;@media(max-width:560px){grid-template-columns:1fr;}
`;
export const ItemLink = styled.a`
  display:flex;align-items:flex-start;gap:10px;min-height:44px;color:var(--dw-text);text-decoration:none;min-width:0;
  img {width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;}
  div {min-width:0;overflow-wrap:anywhere;} small {display:block;color:var(--dw-text-secondary);line-height:1.5;}
  &:focus-visible {outline:2px solid var(--dw-cyan);outline-offset:2px;}
`;
export const AlertLink = styled.a`
  display:inline-flex;align-items:center;gap:5px;min-height:44px;padding:0 6px;color:var(--dw-amber);text-decoration:none;
  font:500 .8rem/1.3 var(--dw-font-ui);white-space:nowrap;
  &:focus-visible {outline:2px solid var(--dw-cyan);outline-offset:2px;}
`;
