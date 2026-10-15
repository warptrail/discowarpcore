import styled from 'styled-components';
import { panelStyles, Control, Field } from '../../styles/primitives';
import * as Controls from '../OperationsQuickPeek/QuickPeekItemControls.styles';

export const Page = styled.div`display: grid; gap: 16px; min-width: 0; font-family: var(--dw-font-ui);`;
export const Hero = styled.header`
  display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 4px 6px;
  h1 { margin: 3px 0 6px; font: 700 clamp(1.45rem, 4vw, 1.9rem)/1.15 var(--dw-font-ui); letter-spacing: -.025em; }
  p { margin: 0; color: var(--dw-text-muted); font: 400 .8rem/1.45 var(--dw-font-ui); }
  > div { min-width: 0; }
  button { flex-shrink: 0; }
  @media (max-width: 700px) { align-items: flex-start; padding: 12px 12px 0; }
`;
export const Eyebrow = styled.span`color: var(--dw-cyan); font: 500 .68rem/1.3 var(--dw-font-data); letter-spacing: .08em;`;
export const Panel = styled.section`${panelStyles} padding: 16px; display: grid; gap: 12px;`;
export const PanelHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  h2 { margin: 0; font-size: .98rem; font-weight: 650; }
`;
export const Text = styled.p`margin: 0; color: var(--dw-text-secondary); line-height: 1.5; font-size: .8rem;`;
export const Actions = styled.div`display: flex; flex-wrap: wrap; align-items: center; gap: 8px;`;
export const Layout = styled.div`min-width: 0;`;
export const Form = styled.form`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px;
  > :not(label) { grid-column: 1 / -1; }
  @media (max-width: 380px) { grid-template-columns: minmax(0, 1fr); }
`;
export const Label = styled.label`
  display: grid; align-content: start; gap: 6px; min-width: 0; color: var(--dw-text-secondary); font-size: .78rem;
  small { color: var(--dw-text-muted); font-size: .72rem; line-height: 1.5; }
`;
export const Input = styled(Field)`
  width: 100%; box-sizing: border-box; min-height: 44px;
  border: 0; border-bottom: 1px solid var(--dw-border); border-radius: 0;
  background: var(--dw-surface-raised);
  &:focus-visible { outline: 0; border-bottom: 2px solid var(--dw-cyan); }
`;
export const Select = styled.select`
  border: 1px solid var(--dw-border); border-radius: var(--dw-radius-sm); min-height: 44px;
  background: var(--dw-surface-raised); color: var(--dw-text); padding: 8px; max-width: 100%; width: 100%;
  font: inherit; color-scheme: dark;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export const Button = styled(Control)`
  min-height: 44px;
  ${({ $danger }) => $danger && 'color: var(--dw-coral);'}
`;
export const List = styled.ul`display: grid; gap: 0; margin: 0; padding: 0; list-style: none;`;
export const Row = styled.li`
  display: grid; grid-template-columns: minmax(0, 1fr) 44px; align-items: center; gap: 6px;
  padding-block: 6px; border-bottom: 1px solid var(--dw-border-soft); min-width: 0;
`;
export const EditPath = styled.button`
  min-width: 0; min-height: 56px; padding: 6px 4px; text-align: left; border: 0; border-radius: 3px;
  color: var(--dw-text); background: transparent; font: inherit; cursor: pointer;
  strong { display: block; margin-bottom: 5px; font: 500 .85rem/1.4 var(--dw-font-ui); overflow-wrap: anywhere; }
  small { color: var(--dw-text-muted); font-size: .72rem; }
  &:hover, &[aria-pressed='true'] { background: var(--dw-surface-raised); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export const DeleteButton = styled(Controls.Button)`color: var(--dw-coral);`;
export const Message = styled.p`
  margin: 0; line-height: 1.5; font-size: .82rem; color: ${({ $error }) => $error ? 'var(--dw-coral)' : 'var(--dw-teal)'};
`;
export const DesktopLayout = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start;
  @media (min-width: 1100px) { grid-template-columns: minmax(0, 1fr) 360px; }
`;
export const Empty = styled.p`margin: 0; padding: 32px 16px; color: var(--dw-text-muted); font-size: .85rem;`;
export const Search = styled(Input)`font-size: .82rem;`;
export const Registry = styled(Panel)`
  padding: 12px; gap: 10px;
  ${List} { max-height: min(72dvh, 800px); overflow: auto; overscroll-behavior-y: auto; scrollbar-width: thin; }
  @media (max-width: 700px) { ${List} { max-height: none; overflow: visible; } }
`;
export const SheetContent = styled.div`
  ${Panel} { padding: 0; border: 0; background: transparent; }
`;
export const SheetActions = styled(Actions)`padding: 12px;`;
