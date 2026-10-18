import styled, { css } from 'styled-components';

const focus = css`&:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 3px; }`;
const nodeButton = css`
  appearance: none; width: 100%; min-width: 0; min-height: 52px; margin: 0;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px; text-align: left; font-family: var(--dw-font-ui); color: var(--dw-text);
  border: 1px solid transparent; border-radius: 8px; cursor: pointer;
  background: transparent; transition: background 140ms ease, border-color 140ms ease;
  &:hover { background: rgba(var(--branch-rgb, var(--box-primary-rgb)), .08); border-color: rgba(var(--branch-rgb, var(--box-primary-rgb)), .55); }
  &[aria-pressed='true'] { background: rgba(var(--branch-rgb, var(--box-primary-rgb)), .12); border-color: var(--branch-color, var(--box-primary)); box-shadow: inset 3px 0 var(--branch-color, var(--box-primary)); }
  ${focus}
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
export const Map = styled.div`
  min-width: 0; --atlas-spine-x: 20.5px;
  @media (max-width: 560px) { --atlas-spine-x: 16.5px; }
  dialog:modal & { display: flex; flex-direction: column; flex: 1; min-height: 0; }
`;
export const RootHeader = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px 12px; padding: 12px 16px;
  position: relative; flex-shrink: 0;
  &::after { content: ''; position: absolute; bottom: -2px; left: calc(var(--atlas-spine-x) - 1.5px); height: 22px; width: 3px; background: var(--box-primary); opacity: .8; z-index: 2; pointer-events: none; }
  @media (max-width: 560px) { padding: 10px 12px; }
`;
export const HeaderFacts = styled.div`
  display: grid; gap: 4px; margin-left: auto; min-width: 0; text-align: right;
  @media (max-width: 560px) { order: 3; width: 100%; margin: 0; text-align: left; padding-left: 10px; }
`;
export const FullscreenButton = styled.button`
  appearance: none; min-height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 8px 10px; border: 1px solid #45576a; border-radius: 8px; background: #142334; color: #e6edf3; cursor: pointer;
  font: 600 .8rem/1.3 var(--dw-font-ui);
  svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.5; }
  &:hover { border-color: var(--box-primary); }
  ${focus}
  @media (max-width: 560px) { span { display: none; } margin-left: auto; }
`;

export const Root = styled.button`
  ${nodeButton}
  flex: 0 1 auto; width: auto; min-height: 68px; padding: 8px 10px;
  border-color: transparent; background: transparent;
  @media (max-width: 380px) { gap: 8px; }

`;
export const NodeIdentity = styled.span`display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1;`;
export const NodeText = styled.span`display: grid; gap: 4px; min-width: 0; flex: 1;`;
export const NodeName = styled.strong`color: #e6edf3; font: 700 .95rem/1.35 var(--dw-font-ui); overflow-wrap: anywhere;`;
export const Address = styled.span`color: var(--box-primary); font: 700 1.05rem/1.3 var(--dw-font-data); overflow-wrap: anywhere;`;
export const RootAddress = styled(Address)`font-size: 1.5rem; line-height: 1.2;`;
export const CabinetMark = styled.span`
  display: grid; place-items: center; flex: 0 0 30px; width: 30px; height: 34px;
  color: var(--branch-color); background: rgba(var(--branch-rgb), .09);
  border: 1px solid rgba(var(--branch-rgb), .48); border-radius: 4px 8px 4px 4px;
  font: 600 1.1rem/1 var(--dw-font-data);
`;
export const ShelfMark = styled.span`color: var(--branch-color); font: 500 .75rem/1 var(--dw-font-data); flex: 0 0 12px; text-align: center;`;
export const Count = styled.span`color: #b9c9d7; font: 400 .75rem/1.4 var(--dw-font-ui);`;
export const NodeFacts = styled.span`display: grid; gap: 4px; justify-items: end; flex: 0 0 auto; max-width: 42%; text-align: right;`;
export const Selected = styled.span`color: var(--branch-color, var(--box-primary)); font: 600 .75rem/1.4 var(--dw-font-ui); white-space: nowrap;`;
export const RootIcon = styled.span`color: var(--box-primary); flex: 0 0 28px; svg { width: 25px; height: 25px; display: block; }`;
export const Viewport = styled.div`
  min-width: 0; max-height: min(68dvh, calc(100dvh - var(--dw-header-height, 112px) - 32px), 720px); overflow: auto; scrollbar-width: thin;
  scrollbar-color: #45576a #0a121c; border-block: 1px solid #253648; padding: 18px 16px 16px;
  background: radial-gradient(circle, rgba(var(--box-primary-rgb), .12) .65px, transparent .9px) 0 0 / 18px 18px, #0a121c;
  ${focus}
  @media (max-width: 560px) { max-height: none; overflow: visible; padding: 16px 12px; }
  dialog:modal & { flex: 1; min-height: 0; max-height: none; overflow: auto; }
`;
export const Branches = styled.div`
  position: relative; isolation: isolate; padding: 14px 0 0 20px;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 22px 14px; align-items: start;
  @media (max-width: 560px) { grid-template-columns: minmax(0, 1fr); }
`;
export const Connections = styled.svg`
  position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible;
  z-index: 0; pointer-events: none; fill: none;
  path { stroke: var(--box-primary); stroke-width: 3; stroke-linejoin: round; stroke-linecap: butt; opacity: .8; vector-effect: non-scaling-stroke; }
`;
export const Branch = styled.section`
  position: relative; z-index: 1; min-width: 0; padding: 5px; border: 1px solid ${({ $active }) => $active ? 'rgba(var(--branch-rgb), .7)' : '#2c3e50'};
  border-top: 2px solid var(--branch-color); border-radius: 4px 12px 8px 8px; background: #101b28;
  box-shadow: ${({ $active }) => $active ? '0 0 16px rgba(var(--branch-rgb), .08), inset 0 1px rgba(255,255,255,.04)' : '0 4px 0 rgba(16,27,40,.5)'};
`;
export const CabinetButton = styled.button`${nodeButton} min-height: 64px;`;
export const BranchCaption = styled.div`
  display: flex; align-items: center; gap: 5px; padding: 7px 10px 8px; margin: 3px 5px 0;
  border-top: 1px solid #2c3e50; color: #b9c9d7; font: 400 .75rem/1.4 var(--dw-font-ui);
  svg { width: 14px; height: 14px; color: var(--branch-color); }
  span { margin-left: auto; font-size: .7rem; color: var(--branch-color); }
`;
export const Shelves = styled.ul`list-style: none; padding: 0 0 1px 19px; margin: 0 5px 5px;`;
export const Shelf = styled.li`
  position: relative; min-width: 0; padding: 3px 0 3px 12px;
  &::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 1px; background: rgba(var(--branch-rgb), .65); }
  &:last-child::before { bottom: 50%; }
  &::after { content: ''; position: absolute; left: 0; top: 50%; width: 12px; height: 1px; background: rgba(var(--branch-rgb), .65); }
`;
export const ShelfButton = styled.button`${nodeButton} min-height: 56px; padding: 8px 9px; gap: 6px;`;
export const SingleSpace = styled.div`
  display: flex; align-items: center; gap: 7px; margin: 3px 15px 5px; padding: 9px 0 6px;
  border-top: 1px solid #2c3e50; color: #b9c9d7; font: 400 .75rem/1.4 var(--dw-font-ui);
  svg { width: 15px; height: 15px; color: var(--branch-color); }
`;
export const Legend = styled.div`
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 5px 16px; padding: 10px 16px;
  color: #b9c9d7; font: 400 .75rem/1.5 var(--dw-font-ui);
  span { display: inline-flex; align-items: center; gap: 7px; }
  i { width: 6px; height: 6px; border-radius: 50%; background: var(--box-primary); }
`;
