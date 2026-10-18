import styled from 'styled-components';
import { controlStyles } from '../../styles/primitives';

export const Cabinet = styled.dialog`
  position: static; width: 100%; max-width: none; max-height: none;
  margin: 1rem 0; min-width: 0; padding: 0;
  border: 1px solid rgba(var(--box-primary-rgb), .4); border-radius: 18px 18px 14px 14px;
  background: #0e1925; color: var(--dw-text);
  box-shadow: 0 0 26px rgba(var(--box-primary-rgb), .05), inset 0 1px rgba(255,255,255,.05), 0 10px 24px rgba(0,0,0,.15);
  &::backdrop { background: #080e17; }
  &:modal {
    position: fixed; inset: 0; margin: 0; width: 100%; height: 100dvh;
    display: flex; flex-direction: column; border-radius: 0; overflow: hidden;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    --dw-header-height: 0px;
  }
  h2 { margin: 0; font: 700 1.05rem/1.35 var(--dw-font-ui); }
  p { margin: 0; color: #b9c9d7; font-size: .8rem; }
  > p { padding: 8px 16px; }
  button, input, select { font: inherit; min-height: 44px; }
  button { cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: .55; }
  input, select { color: var(--dw-text); background: var(--dw-background); border: 1px solid var(--dw-border); border-radius: var(--dw-radius); padding: .5rem; min-width: 0; }
  input:focus-visible, select:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
`;
export const SupportingControls = styled.div`
  padding: 0 16px 8px; border-top: 1px solid #253648;
  details { border-bottom: 1px solid #253648; }
  details:last-child { border-bottom: 0; }
  summary { min-height: 44px; padding: 12px 0; color: #b9c9d7; cursor: pointer; font: 500 .8rem/1.4 var(--dw-font-ui); }
  summary:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 1px; }
  form { display: grid; gap: 10px; padding: 6px 0 12px; }
`;
export const Drawer = styled.button`
  ${controlStyles}
  width: ${({ $shelf }) => $shelf ? 'calc(100% - 0.75rem)' : '100%'};
  margin-left: ${({ $shelf }) => $shelf ? '0.75rem' : '0'};
  min-width: 0;
  border: 1px solid ${({ $active }) => $active ? 'var(--dw-cyan)' : 'rgba(230, 237, 243, 0.14)'};
  border-radius: var(--dw-radius); padding: 0.85rem 1rem; color: var(--dw-text);
  background: var(--dw-surface-raised);
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  strong { display: block; text-align: left; }
  small { display: block; margin-top: 0.25rem; color: var(--dw-text-secondary); text-align: left; overflow-wrap: anywhere; }
`;
export const Row = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(90px, 0.5fr);
  align-items: center; gap: 0.65rem; margin: 0.4rem 0;
  span { overflow-wrap: anywhere; }
  @media (max-width: 420px) { grid-template-columns: minmax(0, 1fr); }
`;

