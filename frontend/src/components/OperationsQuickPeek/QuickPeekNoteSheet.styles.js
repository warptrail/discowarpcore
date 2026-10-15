import styled from 'styled-components';
import { ItemNoteSheet, NoteItemsReturn } from './OperationsQuickPeek.styles';

export const Sheet = styled(ItemNoteSheet)`
  width: min(360px, calc(100vw - 1rem));
  box-sizing: border-box; padding: 0; gap: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden; border-radius: 12px 12px 10px 10px;
  background: #101923;
  max-width: calc(100vw - 1rem);
  ${({ $contained }) => $contained && `
    position: absolute; inset: 0; transform: none;
    width: 100%; max-width: 100%; height: 100%; max-height: none;
    border: 2px solid var(--box-primary); border-radius: 8px;
    box-shadow: inset 0 0 18px rgba(var(--box-primary-rgb), .12);
  `}
  box-shadow: 0 8px 22px #0006, inset 0 1px 0 #ffffff08;
  ${NoteItemsReturn} {
    min-width: 44px; min-height: 44px; padding: 0;
    border: 0; background: transparent; border-radius: 6px;
    &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -3px; }
  }
`;
export const Toolbar = styled.div`
  display: flex; align-items: center; gap: 6px; padding: 0 4px 0 12px; min-height: 44px;
  border-bottom: 1px solid rgba(var(--box-primary-rgb), .18);
`;
export const Identity = styled.div`
  min-width: 0; flex: 1;
  span { color: var(--box-primary); font: 500 .75rem/1.4 var(--dw-font-ui); }
  h2 { margin: 0; color: #e6edf3; font: 650 .9rem/1.35 var(--dw-font-ui); overflow-wrap: anywhere; }
`;
export const Body = styled.div`
  min-height: 0; overflow: auto; padding: 12px 14px;
  color: #c7d2de; font: 400 .85rem/1.5 var(--dw-font-ui);
  scrollbar-width: thin; scrollbar-color: var(--box-primary) transparent;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -3px; }
  p { margin: 0 0 8px; }
  > div { color: #c7d2de; }
  h1, h2, h3, h4, h5, h6 { margin-top: 10px; font-size: .9rem; }
  blockquote { color: #c7d2de; border-left-color: var(--box-secondary); }
`;
export const FullReader = styled.button`
  min-height: 44px; border: 0; border-top: 1px solid rgba(var(--box-primary-rgb), .18);
  background: transparent; color: var(--box-primary); cursor: pointer;
  padding: 0 14px; text-align: left; font: 500 .8rem var(--dw-font-ui);
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -3px; }
`;

export const Edit = styled.button`
  min-width: 44px; min-height: 44px; padding: 0 10px; border: 0;
  background: transparent; color: var(--box-primary); cursor: pointer;
  font: 400 .8rem var(--dw-font-ui);
  svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  &:disabled { opacity: .5; cursor: wait; }
`;
export const Save = styled(Edit)`background: rgba(var(--box-primary-rgb), .2); border-radius: 6px;`;
export const EditForm = styled.form`display: grid; gap: 8px; min-width: 0;`;
export const TextArea = styled.textarea`
  width: 100%; min-height: 140px; max-height: 40dvh; box-sizing: border-box; resize: vertical;
  border: 1px solid var(--box-primary); border-radius: 6px; padding: 8px;
  background: var(--dw-surface); color: #e6edf3; font: 400 .85rem/1.5 var(--dw-font-ui);
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 1px; }
`;
export const EditActions = styled.div`display: flex; justify-content: flex-end; gap: 8px;`;
export const EditHint = styled.span`font: 400 .75rem var(--dw-font-ui); color: #c7d2de;`;
export const EditError = styled.p`color: var(--dw-coral);`;
