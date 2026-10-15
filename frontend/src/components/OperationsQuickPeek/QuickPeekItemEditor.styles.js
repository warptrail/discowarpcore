import styled, { css, keyframes } from 'styled-components';
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
  ${({ $boxNumber }) => $boxNumber && css`
    && { width: calc(3ch + 2rem); min-width: 0; min-height: 64px; padding: .6rem .9rem;
      justify-self: center; margin: 8px 0;
      font-family: var(--dw-font-data); font-size: 1.8rem; font-weight: 600; font-variant-numeric: tabular-nums;
      color: var(--box-primary, var(--dw-text));
      border: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), .65);
      box-shadow: inset 0 1px 0 rgba(var(--box-primary-rgb, 76, 198, 193), .12), 0 0 14px rgba(var(--box-primary-rgb, 76, 198, 193), .1);
      text-align: center; letter-spacing: 0; }
  `}
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

export const AttributeEditor = styled.div`
  display: grid; gap: 0.3rem; width: 100%; min-width: 0;
  padding: 0.4rem; box-sizing: border-box;
  border: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.35);
  border-radius: 6px; background: var(--dw-surface-raised);
  color: var(--dw-text); font: 400 0.8rem/1.4 var(--dw-font-ui);
`;
export const AttributeCancel = styled.button`
  justify-self: end; min-height: 44px; padding: 0 0.5rem;
  border: 0; background: transparent; color: var(--dw-text-secondary);
  font: 400 0.75rem var(--dw-font-ui); cursor: pointer;
  &:focus-visible { outline: 2px solid var(--dw-cyan); }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const plasmaDrift = keyframes`
  0%, 100% { transform: translate(-4%, 2%) rotate(-8deg) scale(1); }
  50% { transform: translate(5%, -3%) rotate(9deg) scale(1.12, .94); }
`;
export const EditorOverlay = styled.div`
  position: absolute; inset: 0; z-index: 250;
  display: grid; align-items: center; padding: 0.8rem;
  background: #101923;
  isolation: isolate; overflow: hidden;
  border-radius: inherit;
  &::before, &::after {
    content: ''; position: absolute; inset: -20%; z-index: -1; pointer-events: none;
    background: radial-gradient(ellipse at 25% 35%, rgba(var(--box-primary-rgb, 76, 198, 193), .18), transparent 55%), radial-gradient(ellipse at 75% 68%, rgba(var(--box-secondary-rgb, 103, 239, 200), .12), transparent 56%);
    filter: blur(30px); animation: ${plasmaDrift} 28s ease-in-out infinite;
  }
  &::after { opacity: .6; animation-duration: 37s; animation-direction: reverse; }
  @media (prefers-reduced-motion: reduce) { &::before, &::after { animation: none; } }
`;
export const EditorHeading = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin: 0 0 8px; color: var(--dw-text); font: 650 .95rem/1.3 var(--dw-font-ui);
  ${({ $centered }) => $centered && css`
    position: relative; justify-content: center; min-height: 44px;
    padding: 0 44px; text-align: center; font-size: 1.05rem;
    > button { position: absolute; right: 0; top: 0; }
  `}
`;
export const EditorDialog = styled.div`
  min-width: 0; max-height: calc(100dvh - 180px); overflow-y: auto; padding: 1rem; color: var(--dw-text);
  border: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), .55); border-radius: 12px;
  background: #101923; box-shadow: 0 8px 22px #0004, 0 0 16px rgba(var(--box-primary-rgb, 76, 198, 193), .1), inset 0 1px 0 #ffffff08;
  input, textarea, select { border-radius: 6px; font-size: .9rem; }
  ${Actions} { grid-template-columns: 1fr 1fr; margin-top: 12px; }
  ${Button} { min-height: 44px; border-radius: 6px; }
  ${Button}[type='button'] { border-color: transparent; background: transparent; }
  textarea { resize: none; max-height: 32dvh; }
`;
export const CancelEdit = styled.button`
  ${controlStyles}
  width: 44px; height: 44px; padding: 0;
  border: 0; border-radius: 6px;
  color: var(--box-primary, #4cc6c1); background: transparent;
  font: 700 1rem var(--dw-font-ui); cursor: pointer;
`;
