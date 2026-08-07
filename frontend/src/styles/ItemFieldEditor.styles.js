import styled, { keyframes } from 'styled-components';

import * as FormS from './EditItemDetailsForm.styles';
import { MOBILE_BREAKPOINT, MOBILE_CONTROL_MIN_HEIGHT } from './tokens';

const mono = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

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
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.64);
  border-radius: 2px 7px 4px 2px;
  background:
    linear-gradient(112deg, rgba(var(--item-accent-rgb, 127, 215, 255), 0.12), transparent 30%),
    linear-gradient(180deg, rgba(15, 24, 34, 0.98), rgba(5, 11, 17, 0.99));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 0 20px rgba(var(--item-accent-rgb, 127, 215, 255), 0.13);
  animation: ${reveal} 160ms ease-out both;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: linear-gradient(
      180deg,
      var(--item-accent, #7fd7ff),
      var(--item-secondary, #a7b6ff) 56%,
      var(--box-primary, #4cc6c1)
    );
    box-shadow: 0 0 14px rgba(var(--item-accent-rgb, 127, 215, 255), 0.42);
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
    outline: none;
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
  font: 800 0.55rem/1 ${mono};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const EditorTitle = styled.h3`
  margin: 0;
  color: #f1fbff;
  font: 820 0.82rem/1.2 ${mono};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const EditorState = styled.span`
  flex: 0 0 auto;
  color: ${({ $dirty, $saving }) =>
    $saving
      ? 'var(--box-neon, #c5f4f1)'
      : $dirty
        ? 'var(--item-accent, #7fd7ff)'
        : 'rgba(214, 226, 241, 0.44)'};
  font: 800 0.52rem/1 ${mono};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const EditorBody = styled.div`
  display: grid;
  gap: 0.55rem;
  min-width: 0;

  ${FormS.Field} {
    border-radius: 3px;
    border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.24);
    background: rgba(4, 10, 16, 0.56);
  }

  ${FormS.Input}, ${FormS.TextArea}, ${FormS.Select} {
    border-radius: 3px;
    border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.42);
    background: rgba(2, 8, 13, 0.9);
  }
`;

export const NotesTextArea = styled(FormS.TextArea)`
  min-height: clamp(320px, 58dvh, 680px);
  padding: 0.82rem 0.9rem;
  font-size: 1rem;
  line-height: 1.62;
  resize: vertical;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: clamp(300px, 54dvh, 520px);
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
  color: rgba(214, 226, 241, 0.52);
  font: 800 0.54rem/1 ${mono};
  letter-spacing: 0.11em;
`;

export const NotesModeButton = styled.button`
  min-height: 30px;
  padding: 0.22rem 0.52rem;
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.52);
  border-radius: 2px 5px 2px 2px;
  background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.1);
  color: var(--item-accent, #7fd7ff);
  font: 820 0.56rem/1 ${mono};
  letter-spacing: 0.09em;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: var(--item-accent, #7fd7ff);
    background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.18);
    box-shadow: 0 0 12px rgba(var(--item-accent-rgb, 127, 215, 255), 0.14);
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
  border-radius: 2px 6px 3px 2px;
  background:
    linear-gradient(90deg, rgba(var(--item-accent-rgb, 127, 215, 255), 0.055), transparent 24%),
    rgba(2, 8, 13, 0.9);
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
  border-radius: 3px;
  background: rgba(2, 8, 13, 0.9);

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
  font: 850 0.72rem/1 ${mono};
`;

export const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.28rem;
`;

export const ChoiceButton = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  padding: 0.5rem 0.62rem;
  border: 1px solid ${({ $active }) =>
    $active
      ? 'var(--item-accent, #7fd7ff)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.28)'};
  border-radius: 3px;
  color: ${({ $active }) => ($active ? '#f4fdff' : 'rgba(226, 238, 245, 0.7)')};
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.18)'
      : 'rgba(4, 10, 16, 0.72)'};
  font: 780 0.68rem/1 ${mono};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    border-color: var(--item-accent, #7fd7ff);
    box-shadow: 0 0 12px rgba(var(--item-accent-rgb, 127, 215, 255), 0.18);
  }
`;

export const EditorHint = styled.p`
  margin: 0;
  color: rgba(214, 226, 241, 0.58);
  font-size: 0.7rem;
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
  color: rgba(214, 226, 241, 0.52);
  text-align: center;
  font: 700 0.66rem/1.4 ${mono};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;
