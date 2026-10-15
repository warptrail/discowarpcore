import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { QuickCaptureButton, QuickCaptureComposer, QuickCaptureInput } from '../../styles/InventoryGridHeader.styles';
import { SelectButton } from '../../styles/CustomSelect.styles';

export const NameStage = styled.div`display: contents;`;
export const Action = styled(QuickCaptureButton)``;

export const Form = styled.form`
  display: grid;
  gap: .3rem;
  min-width: 0;
`;
export const Switches = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-width: 0;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
`;
export const Switch = styled.button`
  position: relative;
  min-width: 0;
  min-height: 40px;
  padding: .2rem;
  border: 0;
  border-radius: 3px;
  background: ${({ $active }) => $active ? 'rgba(113, 210, 255, .12)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--dw-cyan)' : 'var(--dw-text-secondary)'};
  font: 650 .75rem/1.2 var(--dw-font-ui);
  cursor: pointer;
  &:hover:not(:disabled) { background: rgba(113, 210, 255, .08); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  &:disabled { opacity: .5; cursor: not-allowed; }
  &[data-filled='true']::after {
    content: ''; position: absolute; right: 4px; top: 4px;
    width: 3px; height: 3px; border-radius: 50%; background: var(--dw-teal);
  }
  @media (pointer: coarse) { min-height: 44px; }
`;
export const Input = styled(QuickCaptureInput)`
  font-weight: 500;
  @media (max-width: 700px) { font-size: 16px; }
  @media (pointer: coarse) { min-height: 44px; }
`;
export const Note = styled(Input).attrs({ as: 'textarea', rows: 2 })`
  padding-block: .45rem;
  resize: vertical;
`;
export const Metadata = styled.div`min-width: 0;`;
export const TagRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: .25rem;
`;
export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .25rem;
  margin-top: .25rem;
`;
export const Tag = styled(QuickCaptureButton)`
  max-width: 100%;
  overflow-wrap: anywhere;
  font-weight: 500;
  color: var(--dw-teal);
`;
export const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: .3rem;
  min-width: 0;
`;
export const Actions = styled.div`display: flex; gap: .25rem; margin-left: auto;`;
export const IntakeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  color: var(--dw-cyan);
  font: 500 .75rem/1.3 var(--dw-font-ui);
  text-underline-offset: 3px;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  &[aria-disabled='true'] { opacity: .5; cursor: not-allowed; }
  @media (pointer: coarse) { min-height: 44px; }
`;

// Opt-in presentation for the nested Quick Peek workspace; shared drafts and
// handlers stay in the existing compact composer, and header capture is unchanged.
export const Composer = styled(QuickCaptureComposer)`
  ${({ $console }) => $console && css`
    ${Form} { gap: 8px; }
    svg { width: 18px; height: 18px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    ${NameStage} {
      display: flex; align-items: center; gap: 12px; min-width: 0; padding: 0 14px;
      background: var(--dw-background); border-bottom: 1px solid var(--dw-border);
      border-radius: 2px 12px 0 0; box-shadow: inset 0 2px 8px rgba(0, 0, 0, .25);
      color: var(--dw-cyan);
      &:focus-within { border-color: var(--dw-cyan); box-shadow: inset 0 2px 8px rgba(0, 0, 0, .25), 0 1px 0 var(--dw-cyan); }
      svg { width: 22px; height: 22px; }
    }
    && ${Input} {
      min-height: 44px; border: 0; border-bottom: 1px solid var(--dw-border);
      border-radius: 0; background: var(--dw-background); padding-inline: 10px;
      font-weight: 400; color: var(--dw-text);
      &::placeholder { color: var(--dw-text-secondary); }
      &:focus, &:focus-visible { outline: none; border-color: var(--dw-cyan); box-shadow: inset 0 -1px 0 var(--dw-cyan); }
      &[data-field='name'] {
        min-height: 56px; padding: 0; border: 0; background: transparent;
        font: 500 1.05rem/1.4 var(--dw-font-ui);
        &:focus, &:focus-visible { box-shadow: none; }
      }
    }
    ${Switches} { border: 0; border-radius: 0; padding: 0; gap: 0; background: transparent; }
    && ${Switch} {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
      min-height: 52px; padding: 4px 2px; border-radius: 0; font-weight: 400;
      background: transparent; border-bottom: 1px solid var(--dw-border);
      &[aria-expanded='true'] { border-color: var(--dw-cyan); box-shadow: inset 0 -1px 0 var(--dw-cyan); }
      &:hover:not(:disabled) { background: rgba(113, 210, 255, .05); }
      &:focus-visible { outline-offset: -2px; }
      &[data-filled='true']::after { right: 10px; top: 8px; }
    }
    ${Note} { min-height: 72px; max-height: 160px; overflow: auto; }
    && ${SelectButton} {
      min-height: 44px; border: 0; border-bottom: 1px solid var(--dw-border); border-radius: 0;
      background: var(--dw-background); font-weight: 400;
      &:focus-visible { outline-offset: -2px; }
      &[aria-expanded='true'] { border-color: var(--dw-cyan); }
    }
    ${Footer} { flex-wrap: nowrap; padding-top: 4px; gap: 6px; }
    ${Actions} { align-items: center; gap: 4px; }
    && ${IntakeLink} {
      min-height: 44px; min-width: 44px; gap: 8px; padding-inline: 4px 8px; text-decoration: none;
      color: var(--dw-text-secondary); white-space: nowrap;
      &:hover { color: var(--dw-cyan); }
      &:focus-visible { outline-offset: -2px; }
    }
    && ${Action} {
      display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      min-height: 44px; min-width: 44px; padding-inline: 12px; border: 0;
      border-radius: 2px; font-weight: 500; color: var(--dw-text-secondary); background: transparent;
      &:hover:not(:disabled) { background: rgba(113, 210, 255, .06); color: var(--dw-cyan); }
      &:focus-visible { outline-color: var(--dw-cyan); outline-offset: -2px; }
      &[type='submit'] {
        padding-inline: 16px 12px; color: var(--dw-background); background: var(--dw-cyan);
        border-radius: 2px 12px 2px 2px;
        &:hover:not(:disabled) { background: var(--dw-teal); color: var(--dw-background); }
        &:disabled { background: var(--dw-surface-raised); color: var(--dw-text-secondary); opacity: .7; }
        &:focus-visible { outline-color: var(--dw-cyan); outline-offset: 2px; box-shadow: inset 0 0 0 2px var(--dw-background); }
      }
    }
    @media (max-width: 360px) { ${IntakeLink} span { display: none; } }
  `}
`;
