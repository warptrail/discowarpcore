import styled from 'styled-components';
import { APP_VISUAL_THEME as theme } from '../../styles/tokens';

export const Content = styled.div`
  color: ${theme.textSecondary}; font: 400 .85rem/1.5 var(--dw-font-ui); overflow-wrap: anywhere;
  > :first-child { margin-top: 0; }
  > :last-child { margin-bottom: 0; }
  p { margin: 0 0 10px; white-space: pre-wrap; }
  h1, h2, h3, h4, h5, h6 { margin: 14px 0 6px; color: ${theme.text}; font: 650 .9rem/1.35 var(--dw-font-ui); }
  h1 { font-size: 1.05rem; }
  h2 { font-size: .95rem; }
  ul, ol { margin: 0 0 10px; padding-left: 20px; }
  li { margin: 2px 0; }
  li > p { margin-bottom: 4px; }
  strong { color: ${theme.text}; font-weight: 650; }
  a { color: ${theme.cyan}; text-underline-offset: 3px; }
  a:focus-visible { outline: 2px solid ${theme.cyan}; outline-offset: 2px; }
  blockquote { margin: 8px 0 10px; padding: 4px 10px; border-left: 2px solid ${theme.violet}; color: ${theme.textMuted}; }
  blockquote > :last-child { margin-bottom: 0; }
  code { font: 400 .78rem/1.5 var(--dw-font-data); background: ${theme.surfaceRaised}; padding: 1px 3px; border-radius: 2px; }
  pre { margin: 8px 0 10px; padding: 8px; background: ${theme.surfaceRaised}; border-radius: 3px; white-space: pre-wrap; }
  pre code { padding: 0; background: transparent; }
  hr { margin: 12px 0; border: 0; border-top: 1px solid ${theme.borderSoft}; }
  mark { color: #c4f6ff; background: rgba(113, 210, 255, .2); border-radius: 2px; box-shadow: inset 0 -1px 0 rgba(113, 210, 255, .65); font: inherit; }
  .note-table { max-width: 100%; overflow-x: auto; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: .78rem; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid ${theme.borderSoft}; }
  th { color: ${theme.text}; font-weight: 600; }
  .contains-task-list { list-style: none; padding-left: 0; }
  input[type='checkbox'] { accent-color: ${theme.cyan}; vertical-align: middle; margin-right: 6px; }
  .note-image { color: ${theme.textMuted}; font-style: italic; }
`;
