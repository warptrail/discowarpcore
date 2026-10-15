import styled from 'styled-components';
import * as Controls from '../OperationsQuickPeek/QuickPeekItemControls.styles';
import * as S from './Location.styles';

export const Atlas = styled(S.Panel)`
  padding: 0; gap: 0; overflow: hidden;
  box-shadow: inset 0 1px rgba(235, 245, 255, .04), 0 12px 32px rgba(0, 0, 0, .15);
`;
export const CommandRow = styled.div`
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--dw-border-soft);
`;
export const Views = styled(Controls.Toolbar)`
  justify-content: flex-start; flex-wrap: nowrap;
`;
export const ViewButton = styled(Controls.Button)`
  display: flex; gap: 6px; padding-inline: 10px;
  &[aria-selected='true'] { color: var(--dw-cyan); background: rgba(113, 210, 255, .1); }
`;
export const Tools = styled.div`display: flex; align-items: center; gap: 2px;`;
export const ToolButton = styled(Controls.Button)``;
export const LegendRow = styled.div`
  padding: 12px 16px; border-bottom: 1px solid var(--dw-border-soft);
`;
export const Viewport = styled.div`
  position: relative; min-width: 0; height: clamp(500px, 68dvh, 840px); overflow: auto;
  overscroll-behavior-x: contain; overscroll-behavior-y: auto; scrollbar-width: thin;
  scrollbar-color: var(--dw-border) transparent; container-type: inline-size;
  background: radial-gradient(circle, rgba(113, 210, 255, .09) .7px, transparent .9px) 0 0 / 20px 20px, var(--dw-background);
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @media (min-width: 1100px) { height: clamp(560px, 72dvh, 960px); }
`;
export const BranchViewport = styled(Viewport)`
  @media (max-width: 700px) { height: auto; overflow: visible; }
`;
export const House = styled.div`
  display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding: 4px 2px;
  color: var(--dw-text-secondary); font-size: .85rem;
  > svg { width: 28px; height: 28px; fill: none; stroke: var(--dw-text-secondary); stroke-width: 1.3; }
  strong { display: block; margin-bottom: 3px; color: var(--dw-text); font-size: 1rem; }
  span { color: var(--dw-text-muted); font-size: .75rem; }
  @media (max-width: 700px) { display: none; }
`;
export const Branches = styled.div`
  padding: 20px; min-width: 0;
  @media (max-width: 700px) { padding: 12px; }
`;
export const Rooms = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; align-items: start;
  @media (max-width: 700px) { grid-template-columns: minmax(0, 1fr); gap: 12px; }
`;
export const Room = styled.section`
  position: relative; min-width: 0; padding: 0 12px 12px;
  border: 1px solid var(--dw-border); border-radius: 3px 9px 3px 3px;
  background: var(--dw-surface); box-shadow: 0 4px 0 rgba(19, 32, 48, .7);
`;
export const RoomHeading = styled.div`
  display: flex; align-items: center; gap: 10px; min-height: 64px; padding-block: 8px;
  margin-bottom: 4px; border-bottom: 1px solid var(--dw-border-soft);
  > svg { flex-shrink: 0; width: 25px; height: 25px; color: var(--dw-cyan); }
  > div { flex: 1; min-width: 0; }
  h3 { margin: 0 0 3px; font: 600 .94rem/1.3 var(--dw-font-ui); overflow-wrap: anywhere; }
  small { color: var(--dw-text-muted); font-size: .72rem; }
  @media (max-width: 700px) { min-height: 56px; padding-block: 6px; small { font-size: .75rem; } }
`;
export const Tree = styled.ul`
  list-style: none; margin: 0; padding: 0;
  ul { margin-left: 10px; padding-left: 12px; border-left: 1px solid var(--dw-border); }
  li { position: relative; min-width: 0; }
  ul > li::before { content: ''; position: absolute; left: -12px; top: 25px; width: 8px; height: 1px; background: var(--dw-border); }
`;
export const Node = styled.div`
  display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 7px 0;
  > svg { flex-shrink: 0; width: 18px; height: 18px; color: var(--tier-color); }
  > div { min-width: 0; }
  small { display: block; margin-bottom: 3px; color: var(--tier-color); font-size: .68rem; }
  span { color: var(--dw-text-secondary); font: 400 .86rem/1.4 var(--dw-font-ui); overflow-wrap: anywhere; }
  @media (max-width: 700px) { min-height: 44px; small { font-size: .75rem; } }
`;
export const Footnote = styled.div`
  padding: 10px 16px; color: var(--dw-text-muted); font: 400 .75rem/1.45 var(--dw-font-ui);
  border-top: 1px solid var(--dw-border-soft);
`;
export const DiagramControls = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 2px; padding: 6px 12px;
  border-bottom: 1px solid var(--dw-border-soft);
  span { padding: 0 8px; color: var(--dw-text-secondary); font-size: .75rem; }
`;
export const Diagram = styled(Viewport)`
  svg { display: block; width: 100%; height: auto; max-width: none !important; }
  @media (max-width: 700px) { height: auto; overflow-x: auto; overflow-y: hidden; }
`;
export const DiagramHint = styled.small`
  display: none;
  @media (max-width: 700px) {
    display: flex; align-items: center; gap: 4px; margin-left: auto;
    color: var(--dw-text-muted); font-size: .75rem;
    svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; }
  }
`;
export const Source = styled.details`
  min-width: 0; padding: 0 16px;
  summary { display: flex; align-items: center; min-height: 44px; color: var(--dw-text-muted); font-size: .75rem; cursor: pointer; }
  pre { margin: 0 0 12px; padding: 12px; overflow: auto; max-height: 250px; font: .75rem/1.5 var(--dw-font-data); background: var(--dw-background); }
`;
