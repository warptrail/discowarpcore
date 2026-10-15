import styled, { css } from 'styled-components';
import { controlStyles, inputStyles } from '../../styles/primitives';
import ObsidianPrismSheet from '../Sheets/ObsidianPrismSheet';

export const Page = styled.div`
  padding: clamp(16px, 3vw, 28px) 0 32px;
  min-width: 0;
  @media (max-width: 700px) { padding-inline: 16px; }
  @media (max-width: 560px) { padding: 18px 12px 32px; }
  h1, h2, h3, p { margin: 0; }
  h1 { font-size: clamp(1.6rem, 4vw, 2rem); font-weight: 800; letter-spacing: -.025em; }
  h2 { font-size: 1.2rem; font-weight: 750; }
  h3 { font-size: 1.05rem; font-weight: 750; }
  a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline: 2px solid var(--dw-cyan); outline-offset: 3px;
  }
`;
export const Heading = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px;
  & > div { min-width: 0; }
  p { margin-top: 6px; color: var(--dw-text-secondary); line-height: 1.5; font-size: .9rem; }
  @media (max-width: 430px) { align-items: flex-start; flex-direction: column; gap: 12px; }
`;
export const Button = styled.button`
  ${controlStyles}
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; white-space: normal; text-decoration: none;
  ${({ $primary }) => $primary && css`
    color: #080e17; background: var(--loadout-accent, var(--dw-cyan));
    border-color: var(--loadout-accent, var(--dw-cyan));
    &:hover:not(:disabled) { background: var(--loadout-secondary, var(--dw-cyan)); }
  `}
  ${({ $quiet }) => $quiet && css`background: transparent; border-color: transparent; color: var(--dw-text-secondary);`}
  ${({ $danger }) => $danger && css`color: var(--dw-coral);`}
  svg { width: 20px; height: 20px; }
`;
export const Eyebrow = styled.div`
  color: var(--loadout-accent, var(--dw-cyan)); font: 600 .72rem/1.5 var(--dw-font-data);
  letter-spacing: .045em; margin-bottom: 6px;
`;
export const Muted = styled.p`color: var(--dw-text-secondary); font-size: .85rem; line-height: 1.6;`;
export const Grid = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;
  @media (max-width: 1250px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 560px) { grid-template-columns: minmax(0, 1fr); }
`;
export const Card = styled.button`
  position: relative; isolation: isolate; min-width: 0; overflow: hidden;
  display: flex; flex-direction: column; align-items: flex-start; gap: 9px;
  padding: 20px; min-height: 172px; border: 1px solid rgba(var(--loadout-rgb), .28);
  border-radius: 14px 14px 10px 10px; color: var(--dw-text); text-align: left;
  background: radial-gradient(ellipse at 100% 0%, rgba(var(--loadout-rgb), .085), transparent 65%), var(--dw-surface);
  font-family: var(--dw-font-ui); text-decoration: none; cursor: pointer;
  h2 { max-width: 90%; font-size: 1.08rem; overflow-wrap: anywhere; }
  p { max-width: 90%; font-size: .85rem; line-height: 1.5; color: var(--dw-text-secondary); }
  &:hover { border-color: var(--loadout-accent); background-color: var(--dw-surface-raised); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 3px; }
  .scene { position: absolute; width: 100px; height: 100px; right: -10px; bottom: 20px; color: var(--loadout-accent); opacity: .075; z-index: -1; }
  .badge { width: 32px; height: 32px; color: var(--loadout-accent); }
`;
export const CardFoot = styled.div`
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  width: 100%; margin-top: auto; padding-top: 10px; color: var(--loadout-accent); font-size: .8rem;
  small { color: var(--dw-text-muted); font-size: .76rem; }
`;
export const Empty = styled.div`
  padding: 20px; border: 1px dashed var(--dw-border); border-radius: 12px;
  p { color: var(--dw-text-secondary); font-size: .9rem; line-height: 1.6; }
`;
export const Workspace = styled.section`
  --loadout-accent: var(--dw-cyan); --loadout-secondary: var(--dw-violet); --loadout-rgb: 128, 223, 255;
  min-width: 0; border: 1px solid rgba(var(--loadout-rgb), .48); border-radius: 18px 18px 14px 14px;
  background: radial-gradient(ellipse at 100% 0%, rgba(var(--loadout-rgb), .06), transparent 45%), var(--dw-surface);
  box-shadow: 0 0 20px rgba(var(--loadout-rgb), .07), inset 0 1px 0 rgba(255,255,255,.05), 0 16px 32px #0003;
  overflow: hidden;
`;
export const Hero = styled.div`
  display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 16px; padding: 24px;
  & > svg { width: 64px; height: 64px; padding: 10px; color: var(--loadout-accent); background: rgba(var(--loadout-rgb), .07); border-radius: 12px; }
  h2 { font-size: clamp(1.3rem, 3vw, 1.7rem); font-weight: 800; overflow-wrap: anywhere; }
  p { margin-top: 8px; overflow-wrap: anywhere; white-space: pre-wrap; }
  @media (max-width: 430px) { padding: 18px 14px; gap: 12px; grid-template-columns: 44px minmax(0, 1fr); & > svg { width: 44px; height: 44px; padding: 6px; } }
`;
export const Toolbar = styled.div`
  display: flex; gap: 4px; flex-wrap: wrap; align-items: center; justify-content: space-between;
  padding: 0 20px 12px; border-bottom: 1px solid var(--dw-border-soft);
`;
export const Actions = styled.div`display: flex; flex-wrap: wrap; align-items: center; gap: 6px;`;
export const Body = styled.div`padding: 20px; @media (max-width: 430px) { padding: 16px 12px; }`;
export const Progress = styled.div`
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
  color: var(--dw-text-secondary); font-size: .82rem; line-height: 1.5;
  strong { color: var(--loadout-accent); font-weight: 700; }
`;
export const List = styled.ul`list-style: none; padding: 0; margin: 0;`;
export const Entry = styled.li`
  display: grid; grid-template-columns: minmax(0, 1fr) auto;
  align-items: start; gap: 12px; padding: 14px 0; border-top: 1px solid var(--dw-border-soft); min-width: 0;
  &:first-child { border-top: 0; }
  @media (max-width: 700px) { grid-template-columns: minmax(0, 1fr); gap: 6px; }
`;
export const EntryName = styled.div`
  font-size: .96rem; font-weight: 700; line-height: 1.45; overflow-wrap: anywhere;
  a { color: var(--dw-text); text-decoration: none; }
  a:hover { text-decoration: underline; text-underline-offset: 3px; }
`;
export const Placement = styled.div`
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; margin-top: 4px;
  font-size: .8rem; line-height: 1.6; color: var(--dw-text-secondary); overflow-wrap: anywhere;
  a { color: var(--box-neon, var(--dw-cyan)); text-decoration: none; font: 700 .82rem var(--dw-font-data); }
  a:hover { text-decoration: underline; }
`;
export const ItemChecks = styled.div`display: flex; align-items: center; flex-wrap: wrap; gap: 6px 16px;`;
export const CheckTarget = styled.label`
  display: flex; align-items: center; gap: 8px; min-height: 44px; cursor: pointer;
  color: var(--dw-text-secondary); font-size: .8rem;
  input { width: 20px; height: 20px; margin: 0; accent-color: var(--loadout-accent); cursor: pointer; }
  input:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 3px; }
  input:disabled { cursor: not-allowed; opacity: .5; }
`;
export const RowActions = styled(Actions)`margin-top: 8px; gap: 2px; button { font-size: .78rem; padding: .35rem .6rem; }`;
export const Status = styled.span`color: ${({ $warning }) => $warning ? 'var(--dw-coral)' : 'var(--dw-text-muted)'}; font-size: .78rem;`;
export const Footer = styled.div`
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px;
  border-top: 1px solid var(--dw-border-soft); padding: 12px 20px; font-size: .78rem; color: var(--dw-text-muted);
`;
export const Error = styled.div`
  padding: 14px; margin-bottom: 16px; border: 1px solid var(--dw-coral); border-radius: 8px;
  color: var(--dw-coral); background: var(--dw-surface); line-height: 1.5; font-size: .85rem;
`;
export const Sheet = styled(ObsidianPrismSheet)`
  --prism-sheet-top-edge: var(--loadout-accent); --prism-sheet-border: rgba(var(--loadout-rgb), .5);
  --prism-sheet-glow: 0 0 28px rgba(var(--loadout-rgb), .12);
  border-radius: 18px 18px 14px 14px;
`;
export const Label = styled.label`
  display: grid; gap: 7px; color: var(--dw-text-secondary); font-size: .86rem; font-weight: 600;
  span { color: var(--dw-text-muted); font-weight: 400; font-size: .8rem; }
`;
export const Input = styled.input`${inputStyles} min-height: 44px; width: 100%; border-color: #61758a; border-radius: 8px;`;
export const PickerResult = styled(Button)`
  width: 100%; justify-content: space-between; gap: 16px; text-align: left; background: transparent;
  border: 0; border-bottom: 1px solid var(--dw-border-soft); border-radius: 0; padding: 12px 2px;
  div { min-width: 0; overflow-wrap: anywhere; } strong { font-size: .9rem; }
  small { display: block; margin-top: 5px; color: var(--dw-text-secondary); font-weight: 400; line-height: 1.5; }
  & > span { color: var(--dw-cyan); font-size: .82rem; flex-shrink: 0; }
`;
export const InlineForm = styled.form`
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; align-items: end;
  label { flex: 1 1 180px; }
`;
