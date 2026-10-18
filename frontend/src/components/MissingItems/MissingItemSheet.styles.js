import styled from 'styled-components';
import ObsidianPrismSheet from '../Sheets/ObsidianPrismSheet';
import * as Sheet from '../Sheets/ObsidianPrismSheet.styles';
import { Button, Form } from './MissingItems.styles';
import { frameCorners } from '../Retrieval/RetrievalFrame.styles';

export const ReportSheet = styled(ObsidianPrismSheet)`
  &&& { width: min(520px, calc(100vw - 24px)); height: auto; max-height: calc(100dvh - 32px);
    border-radius: 18px 18px 14px 14px; }
  ${frameCorners}
  ${Sheet.Header} { padding: 10px 10px 10px 18px; min-height: 64px; align-items: center; }
  ${Sheet.Title} { font: 750 1.2rem/1.25 var(--dw-font-ui); overflow-wrap: anywhere; }
  ${Sheet.Eyebrow} { color: var(--box-primary); font: 600 .72rem/1.4 var(--dw-font-ui); letter-spacing: .04em; }
  ${Sheet.Body} { min-height: 0; padding: 16px 18px; overflow: auto; overscroll-behavior: contain; }
  @media (max-width: 430px) {
    ${Sheet.Header} { padding-left: 14px; }
    ${Sheet.Body} { padding: 12px 14px; }
    ${Sheet.Title} { font-size: 1.1rem; }
  }
`;
export const ReportForm = styled(Form)`
  gap: 16px;
  textarea { min-height: 72px; max-height: 180px; resize: vertical; background: var(--dw-background); }
  label { color: var(--dw-text-secondary); }
`;
export const Placement = styled.div`
  padding: 10px 12px; border-left: 2px solid rgba(var(--box-primary-rgb), .6);
  background: rgba(var(--box-primary-rgb), .045); border-radius: 4px;
  display: grid; gap: 4px; font: 500 .85rem/1.4 var(--dw-font-ui);
  small { color: var(--dw-text-secondary); font-size: .78rem; }
`;
export const QuantityGroup = styled.div`display: grid; gap: 8px; min-width: 0;`;
export const QuantityHeading = styled.div`
  display: flex; justify-content: space-between; gap: 8px; font-size: .85rem;
  > span:last-child { color: var(--box-primary); font-family: var(--dw-font-data); }
`;
export const QuantityControls = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 6px; min-width: 0;
  > div { width: 100%; min-width: 0; padding: 0; border: 0; background: transparent; }
`;
export const Preset = styled(Button)`
  min-height: 44px; padding: 6px 10px; background: transparent;
  border-color: rgba(var(--box-primary-rgb), .25);
  &[aria-pressed='true'] { color: var(--box-primary); background: rgba(var(--box-primary-rgb), .09); }
`;
export const Footer = styled.div`
  display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px;
  padding: 10px 14px max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--prism-sheet-divider); background: var(--dw-background);
  p { flex-basis: 100%; margin: 0; font-size: .85rem; color: var(--dw-text-secondary); }
`;
export const Cancel = styled(Button)`border-color: transparent; background: transparent;`;
export const Submit = styled(Button)`
  color: var(--dw-background); background: var(--box-primary); border-color: var(--box-primary); font-weight: 700;
`;
