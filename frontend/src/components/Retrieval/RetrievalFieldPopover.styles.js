import styled, { css, keyframes } from 'styled-components';
import { controlStyles } from '../../styles/primitives';
import * as Editor from '../../styles/ItemFieldEditor.styles';
import { frameCorners } from './RetrievalFrame.styles';
import * as Tags from '../../styles/TagContainer.styles';
import * as Chip from '../../styles/TagChip.styles';

const arrive = keyframes`from { opacity: 0; translate: 0 6px; } to { opacity: 1; translate: 0 0; }`;

export const Scrim = styled.div`
  position: fixed; inset: 0; z-index: 600; background: rgba(3, 6, 10, .16);
`;
export const Dialog = styled.section`
  position: fixed; z-index: 601; width: min(420px, calc(100vw - 24px));
  display: flex; flex-direction: column; min-width: 0; overflow: hidden;
  max-height: min(560px, calc(100dvh - 24px));
  border: 1px solid var(--retrieval-panel-accent, var(--dw-cyan)); border-radius: 12px;
  color: var(--dw-text); background: var(--prism-sheet-surface, var(--dw-background));
  box-shadow: inset 0 0 0 1px rgba(var(--box-primary-rgb), .1), 0 0 18px rgba(var(--box-primary-rgb), .18), 0 16px 48px rgba(0,0,0,.65);
  animation: ${arrive} 180ms ease-out both;
  &:focus { outline: none; }
  ${frameCorners}
  &::before { inset: 7px; opacity: .4; }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
export const Header = styled.header`
  display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0;
  min-height: 48px; padding: 2px 4px 2px 14px;
  border-bottom: 1px solid var(--prism-sheet-divider);
  background: var(--prism-sheet-header-surface, var(--dw-background));
  h3 { min-width: 0; margin: 0; color: var(--retrieval-panel-accent, var(--dw-cyan));
    font: 750 1rem/1.3 var(--dw-font-ui); overflow-wrap: anywhere; }
  @media (max-width: 600px) { min-height: 44px; padding-block: 0; h3 { font-size: .9rem; } }
`;
export const Close = styled.button`
  width: 44px; height: 44px; padding: 0; border: 0; border-radius: 8px;
  color: var(--dw-text-secondary); background: transparent; font: 500 1.15rem/1 var(--dw-font-ui); cursor: pointer;
  &:hover { color: var(--retrieval-panel-accent, var(--dw-cyan)); background: rgba(var(--box-primary-rgb),.08); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export const Body = styled.div`
  min-height: 0; min-width: 0; overflow: auto; overscroll-behavior: contain; padding: 12px;
  scrollbar-width: thin; scrollbar-color: rgba(var(--box-primary-rgb),.3) transparent;
  > fieldset { min-width: 0; margin: 0; border: 0; padding: 0; }
  ${Editor.EditorShell} { padding: 0; border: 0; background: transparent; animation: none; }
  ${Editor.EditorShell}::before, ${Editor.EditorShell}::after { display: none; }
  ${Editor.EditorHeader} { margin-bottom: 6px; }
  ${Editor.EditorKicker}, ${Editor.EditorTitle} { display: none; }
  ${Editor.EditorState} { font-size: .7rem; }
  ${Tags.TagList} { gap: 4px; }
  ${Chip.Chip} {
    gap: 2px; padding: 0 2px 0 6px; min-height: 28px; box-sizing: border-box;
    border-radius: 6px; border: 1px solid rgba(var(--box-primary-rgb), .24);
    background: #152232; color: var(--dw-text-secondary);
    font: 400 .75rem/1.3 var(--dw-font-ui); letter-spacing: normal;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
    &:hover, &:focus-within { border-color: var(--retrieval-panel-accent); background: rgba(var(--box-primary-rgb), .09); }
    &[data-tag-status='new'] { border-color: var(--dw-teal); }
    &[data-tag-status='deleted'] { border-color: var(--dw-coral); opacity: 1; }
  }
  ${Chip.Text} { max-width: 220px; }
  ${Chip.Chip}[data-tag-status='deleted'] ${Chip.Text} { color: var(--dw-coral); }
  && ${Chip.RemoveButton} {
    min-width: 24px; min-height: 26px; width: 24px; height: 26px;
    border-radius: 4px; font-weight: 400; font-size: .85rem;
  }
  ${Tags.InputChip} {
    gap: 0; padding: 0 0 0 6px; box-sizing: border-box; min-height: 30px;
    border: 1px solid var(--prism-sheet-divider); border-radius: 6px;
    background: #152232; width: 170px; max-width: 100%;
  }
  && ${Tags.Input} {
    min-height: 28px; height: 28px; padding: 0 4px; border: 0; border-radius: 3px; outline: none;
    background: transparent; font: 400 .8rem/1.4 var(--dw-font-ui);
    &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  }
  && ${Tags.AddButton} { min-height: 28px; min-width: 30px; color: var(--retrieval-panel-accent); border-left-color: var(--prism-sheet-divider); }
  input:not([type='checkbox']):not([type='radio']):not([type='hidden']), textarea, select, [contenteditable='true'] {
    border-color: rgba(var(--box-primary-rgb), .32); border-radius: 8px;
    background: var(--dw-background); color: var(--dw-text);
  }
  input[aria-invalid='true'], textarea[aria-invalid='true'] { border-color: var(--dw-coral); }
  ${Editor.NotesTextArea} { min-height: 150px; max-height: 250px; border-radius: 8px; }
  textarea { min-height: 110px; max-height: 250px; }
  @media (max-width: 600px) {
    padding: 8px 10px; max-height: min(360px, 48dvh);
    ${Editor.EditorShell} { gap: 8px; }
    ${Editor.EditorHeader} { margin-bottom: 2px; }
    input:not([type='checkbox']):not([type='radio']):not([type='hidden']), textarea, select, [contenteditable='true'] { font-size: 1rem; }
    ${Editor.NotesTextArea} { min-height: 110px; max-height: 180px; }
    textarea { min-height: 96px; max-height: 180px; }
  }
`;
export const Actions = styled.div`
  flex-shrink: 0; display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px;
  padding: 8px 12px; border-top: 1px solid var(--prism-sheet-divider); background: var(--dw-background);
  p { width: 100%; margin: 0; color: var(--dw-text-secondary); font-size: .8rem; }
  @media (max-width: 600px) { gap: 6px; padding: 6px 10px max(6px, env(safe-area-inset-bottom)); }
`;
export const Button = styled.button`
  ${controlStyles} min-height: 44px; border-radius: 8px; font-weight: 650;
  border-color: rgba(var(--box-primary-rgb), .28); background: rgba(var(--box-primary-rgb), .045);
  ${({ $primary }) => $primary && css`
    color: var(--dw-background); border-color: var(--retrieval-panel-accent, var(--dw-cyan));
    background: var(--retrieval-panel-accent, var(--dw-cyan));
    &:not(:disabled) { box-shadow: 0 0 10px rgba(var(--box-primary-rgb), .2); }
  `}
  @media (max-width: 600px) { padding: 6px 10px; font-size: .8rem; }
`;
