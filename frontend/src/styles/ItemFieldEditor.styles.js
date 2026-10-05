import { controlStyles } from './primitives';
import styled, { keyframes } from 'styled-components';

import * as FormS from './EditItemDetailsForm.styles';
import { MOBILE_BREAKPOINT, MOBILE_CONTROL_MIN_HEIGHT } from './tokens';

const uiFont = 'var(--dw-font-ui)';

const reveal = keyframes`
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const EditorShell = styled.section`
  position: relative;
  display: grid;
  gap: 0.7rem;
  min-width: 0;
  padding: 0.72rem 0.74rem 0.78rem 0.9rem;
  overflow: visible;
  border: 1px solid rgba(230, 237, 243, 0.16);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  box-shadow: none;
  animation: ${reveal} 160ms ease-out both;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--dw-amber);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0.9rem;
    width: min(34%, 190px);
    height: 2px;
    background: var(--item-accent, #7fd7ff);
    opacity: 0.82;
  }

  &:focus {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.56rem;
    padding: 0.62rem 0.52rem 0.64rem 0.72rem;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const EditorHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
  min-width: 0;
`;

export const EditorHeadingGroup = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

export const EditorKicker = styled.span`
  color: var(--item-secondary, #a7b6ff);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const EditorTitle = styled.h3`
  margin: 0;
  color: var(--dw-text);
  font: 700 0.82rem/1.2 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const EditorState = styled.span`
  flex: 0 0 auto;
  color: ${({ $dirty, $saving }) =>
    $saving
      ? 'var(--box-neon, #c5f4f1)'
      : $dirty
        ? 'var(--item-accent, #7fd7ff)'
        : 'rgba(214, 226, 241, 0.44)'};
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const EditorBody = styled.div`
  display: grid;
  gap: 0.55rem;
  min-width: 0;

  ${FormS.Field} {
    border-radius: var(--dw-radius-sm);
    border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.24);
    background: var(--dw-surface);
  }

  ${FormS.Input}, ${FormS.TextArea}, ${FormS.Select} {
    border-radius: var(--dw-radius-sm);
    border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.42);
    background: var(--dw-surface);
  }
`;

export const NotesTextArea = styled(FormS.TextArea)`
  min-height: 16rem;
  padding: 0.82rem 0.9rem;
  font-size: 1rem;
  line-height: 1.62;
  resize: vertical;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 12rem;
    padding: 0.7rem;
    font-size: 0.92rem;
  }
`;

export const NotesWorkspace = styled.section`
  display: grid;
  gap: 0.38rem;
  min-width: 0;
`;

export const NotesModeBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  min-width: 0;
`;

export const NotesModeLabel = styled.span`
  color: var(--dw-text-secondary);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
`;

export const NotesModeButton = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  padding: 0.22rem 0.52rem;
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.52);
  border-radius: var(--dw-radius);
  background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.1);
  color: var(--item-accent, #7fd7ff);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: var(--item-accent, #7fd7ff);
    background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.18);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding-inline: 0.62rem;
  }
`;

export const NotesReader = styled.div`
  min-height: 8rem;
  max-height: clamp(240px, 48dvh, 560px);
  overflow: auto;
  padding: 0.78rem 0.86rem;
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.42);
  border-left: 3px solid var(--item-accent, #7fd7ff);
  border-radius: var(--dw-radius);
  background: var(--dw-surface-raised);
  color: #e8f1f8;
  font-size: 0.94rem;
  font-weight: 560;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  scrollbar-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.5) rgba(2, 8, 13, 0.5);

  &:focus-visible {
    outline: 1px solid var(--item-accent, #7fd7ff);
    outline-offset: 2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 7rem;
    max-height: min(46dvh, 390px);
    padding: 0.68rem;
    font-size: 0.9rem;
    line-height: 1.55;
  }

  @media (min-width: 980px) {
    max-height: min(54dvh, 620px);
    padding: 1rem 1.1rem;
    font-size: 1rem;
    line-height: 1.68;
    columns: 1;
  }
`;

export const MoneyShell = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: stretch;
  overflow: hidden;
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.42);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);

  &:focus-within {
    border-color: var(--item-accent, #7fd7ff);
    box-shadow: 0 0 0 2px rgba(var(--item-accent-rgb, 127, 215, 255), 0.18);
  }

  ${FormS.Input} {
    border: 0;
    box-shadow: none;
  }
`;

export const MoneyPrefix = styled.span`
  display: grid;
  place-items: center;
  min-width: 42px;
  border-right: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.24);
  color: var(--item-accent, #7fd7ff);
  background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.09);
  font: 700 0.75rem/1 ${uiFont};
`;

export const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.28rem;
`;

export const ChoiceButton = styled.button`
  ${controlStyles}
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  padding: 0.5rem 0.62rem;
  border: 1px solid ${({ $active }) =>
    $active
      ? 'var(--item-accent, #7fd7ff)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.28)'};
  border-radius: var(--dw-radius-sm);
  color: ${({ $active }) => ($active ? '#f4fdff' : 'rgba(226, 238, 245, 0.7)')};
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.18)'
      : 'rgba(4, 10, 16, 0.72)'};
  font: 780 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: var(--item-accent, #7fd7ff);
    box-shadow: none;
  }
`;

export const EditorHint = styled.p`
  margin: 0;
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  line-height: 1.4;
`;

export const EditorError = styled.div`
  padding: 0.5rem 0.58rem;
  border-left: 4px solid #f08a7b;
  color: #ffd2cc;
  background: rgba(107, 31, 31, 0.34);
  font-size: 0.76rem;
  line-height: 1.4;
`;

export const HistoryEmpty = styled.div`
  padding: 0.62rem;
  border: 1px dashed rgba(var(--item-accent-rgb, 127, 215, 255), 0.28);
  color: var(--dw-text-secondary);
  text-align: center;
  font: 700 0.75rem/1.4 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;
