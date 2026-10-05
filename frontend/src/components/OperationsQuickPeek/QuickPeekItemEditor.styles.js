import styled, { css } from 'styled-components';
import { inputStyles, controlStyles } from '../../styles/primitives';

const control = css`
  ${inputStyles}
  width: 100%;
  box-sizing: border-box;
`;
export const Form = styled.form`
  min-height: 0; height: 100%; box-sizing: border-box; overflow: auto;
  padding: 0.65rem; background: var(--dw-surface); border-radius: 6px;
  scrollbar-width: thin; scrollbar-color: var(--box-primary, #4cc6c1) #080e14;
`;
export const Heading = styled.h3`
  margin: 0 0 0.8rem; font: 700 0.8rem/1.4 var(--dw-font-ui);
  color: var(--box-primary, #4cc6c1); text-transform: none;
  span { float: right; color: #97a7b6; font-size: 0.75rem; }
`;
export const Fields = styled.fieldset`display: grid; gap: 0.65rem; margin: 0; padding: 0; border: 0; min-width: 0;
`;
export const Identity = styled.div`display: grid; grid-template-columns: minmax(0, 1fr) 65px; gap: 0.5rem;
`;
export const Field = styled.label`display: grid; min-width: 0; gap: 0.25rem; color: #aebdca; font: 700 0.75rem/1.3 var(--dw-font-ui);
`;
export const Input = styled.input`${control}
`;
export const TextArea = styled.textarea`${control} resize: vertical; min-height: 52px;
`;
export const Select = styled.select`${control} color-scheme: dark;
`;
export const Hint = styled.span`font-weight: 400; font-size: 0.75rem; color: #8296a8;
`;
export const Error = styled.p`font-size: 0.75rem; color: #ff9d91; overflow-wrap: anywhere;
`;
export const Actions = styled.div`display: grid; grid-template-columns: 1fr 1.5fr; gap: 0.5rem; margin-top: 0.8rem;
`;
export const Button = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height); border-radius: 4px; cursor: pointer;
  border: 1px solid var(--box-primary, #4cc6c1); color: var(--dw-text);
  background: ${({ $primary }) => $primary ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.22)' : '#101923'};
  font: 700 0.75rem var(--dw-font-ui);
  &:disabled { opacity: 0.5; cursor: wait; }
  &:focus-visible { outline: 2px solid var(--box-secondary, #a7b6ff); outline-offset: 2px; }
`;
export const FieldTrigger = styled.button`
  display: block; width: 100%; min-width: 0; padding: 0.16rem 0;
  border: 0; border-radius: 2px; background: transparent;
  color: inherit; font: inherit; text-align: left; cursor: text;
  &:hover { background: rgba(var(--box-primary-rgb, 76, 198, 193), 0.09); }
  &:focus-visible { outline: 1px solid var(--box-primary, #4cc6c1); outline-offset: 2px; }
`;
export const InlineEditor = styled.div`width: 100%; min-width: 0; pointer-events: auto;
`;

export const EditorOverlay = styled.div`
  position: absolute; inset: 0; z-index: 250;
  display: grid; align-items: center; padding: 0.8rem;
  background: var(--dw-surface-raised); 
  border-radius: inherit;
`;
export const EditorDialog = styled.div`
  min-width: 0; padding: 1rem; color: var(--dw-text);
  border: 1px solid var(--box-primary, #4cc6c1); border-radius: 6px;
  background: var(--dw-surface); box-shadow: none;
  textarea { resize: none; max-height: 32dvh; }
`;
export const CancelEdit = styled.button`
  ${controlStyles}
  float: right; width: 40px; height: 40px; margin-top: -5px;
  border: 1px solid currentColor; border-radius: 3px;
  color: var(--box-primary, #4cc6c1); background: var(--dw-surface);
  font: 700 1rem var(--dw-font-ui); cursor: pointer;
`;
