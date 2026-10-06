import styled from 'styled-components';
import { panelStyles, Control, Field } from '../../styles/primitives';

export const Page = styled.div`display: grid; gap: 1rem; min-width: 0;`;
export const Hero = styled.header`
  display: grid; gap: 0.5rem;
  h1 { margin: 0; font-size: clamp(1.6rem, 4vw, 2.35rem); }
  p { margin: 0; max-width: 75ch; line-height: 1.6; color: var(--dw-text-secondary); }
`;
export const Panel = styled.section`${panelStyles} padding: 1rem; display: grid; gap: 0.8rem;`;
export const PanelHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;
  h2 { margin: 0; font-size: 1.05rem; }
`;
export const Text = styled.p`margin: 0; color: var(--dw-text-secondary); line-height: 1.6; font-size: 0.85rem;`;
export const Actions = styled.div`display: flex; flex-wrap: wrap; gap: 0.5rem;`;
export const Layout = styled.div`
  display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr); gap: 1rem; align-items: start;
  @media (max-width: 850px) { grid-template-columns: minmax(0, 1fr); }
`;
export const Form = styled.form`display: grid; gap: 0.8rem;`;
export const Label = styled.label`
  display: grid; gap: 0.35rem; font-size: 0.85rem;
  small { color: var(--dw-text-muted); font-size: 0.75rem; line-height: 1.5; }
`;
export const Input = styled(Field)`width: 100%; box-sizing: border-box;`;
export const Select = styled.select`
  border: 1px solid var(--dw-border); border-radius: var(--dw-radius-sm); min-height: 44px;
  background: var(--dw-surface-raised); color: var(--dw-text); padding: 0.5rem; max-width: 100%;
  font: inherit; &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
`;
export const Button = styled(Control)`
  ${({ $danger }) => $danger && 'color: var(--dw-coral);'}
`;
export const List = styled.ul`display: grid; gap: 0.65rem; margin: 0; padding: 0; list-style: none;`;
export const Row = styled.li`
  display: grid; gap: 0.6rem; padding: 0.75rem; border: 1px solid var(--dw-border-soft);
  border-left: 3px solid var(--dw-cyan); border-radius: var(--dw-radius-sm);
  strong { overflow-wrap: anywhere; } span { font-size: 0.8rem; color: var(--dw-text-secondary); overflow-wrap: anywhere; }
`;
export const Message = styled.p`
  margin: 0; line-height: 1.6; color: ${({ $error }) => $error ? 'var(--dw-coral)' : 'var(--dw-teal)'};
`;
