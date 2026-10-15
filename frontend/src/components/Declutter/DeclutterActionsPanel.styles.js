import styled from 'styled-components';

const routeColor = (route) => ({
  discard: 'var(--dw-coral)', donate: 'var(--dw-violet)', sell: 'var(--dw-amber)', gift: '#ff79c6',
}[route] || 'var(--dw-cyan)');

export const Console = styled.section`
  min-width:0; border:1px solid var(--dw-border-soft); border-radius:14px;
  background:var(--dw-background); overflow:hidden; box-shadow:inset 0 1px 0 rgba(255,255,255,.04);
`;
export const Header = styled.header`
  display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:14px 16px;
  border-bottom:1px solid var(--dw-border-soft);
  h2 { margin:2px 0 4px; color:var(--dw-text); font:800 clamp(1.25rem,2.5vw,1.6rem)/1.2 var(--dw-font-ui); letter-spacing:-.025em; }
  p { margin:0; color:var(--dw-text-muted); font:400 .75rem/1.45 var(--dw-font-ui); }
  > span { flex-shrink:0; color:var(--dw-text-secondary); font:500 .85rem/1.5 var(--dw-font-data); padding-top:3px; }
`;
export const Grid = styled.div`
  display:grid; grid-template-columns:minmax(0,1fr); gap:10px; padding:12px; align-items:start;
  @media(min-width:1100px) { grid-template-columns:repeat(2,minmax(0,1fr)); }
  @media(max-width:540px) { padding:8px; gap:8px; }
`;
export const Card = styled.article`
  min-width:0; display:grid; gap:10px; padding:12px;
  border:1px solid rgba(var(--box-primary-rgb),.3); border-radius:12px;
  background:linear-gradient(125deg,rgba(var(--box-primary-rgb),.035),transparent 65%),var(--dw-background);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
`;
export const Identity = styled.div`
  display:flex; align-items:start; justify-content:space-between; gap:10px;
  > div { min-width:0; display:grid; gap:4px; }
  a,strong { color:var(--dw-text); font:750 .95rem/1.25 var(--dw-font-ui); letter-spacing:-.02em; overflow-wrap:anywhere; }
  a:hover { color:var(--box-neon); }
  small { color:var(--dw-text-muted); font:400 .7rem/1.4 var(--dw-font-ui); }
`;
export const RouteBadge = styled.span`
  flex-shrink:0; padding:3px 6px; border-radius:5px; color:${({ $route })=>routeColor($route)};
  background:color-mix(in srgb,currentColor 8%,var(--dw-background)); font:500 .7rem/1.4 var(--dw-font-ui);
`;
export const Location = styled.div`
  min-width:0; color:var(--dw-text-secondary); font:400 .75rem/1.4 var(--dw-font-ui); overflow-wrap:anywhere;
  span { color:var(--box-neon); font-family:var(--dw-font-data); margin-right:5px; }
`;
export const Controls = styled.div`display:grid; gap:8px; min-width:0;`;
export const RouteRail = styled.div`
  display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:2px;
  border-block:1px solid var(--dw-border-soft); padding-block:4px;
`;
export const RouteChoice = styled.button`
  min-width:0; min-height:54px; display:grid; align-content:center; justify-items:center; gap:4px;
  border:0; border-radius:7px; padding:5px 2px; background:transparent;
  color:var(--dw-text-secondary); font:500 .75rem/1.2 var(--dw-font-ui); cursor:pointer;
  svg { width:18px; height:18px; }
  &[aria-pressed='true'] { color:${({ $route })=>routeColor($route)};
    background:color-mix(in srgb,currentColor 8%,var(--dw-background)); box-shadow:inset 0 -2px 0 currentColor; }
  &:hover:not(:disabled) { color:${({ $route })=>routeColor($route)}; }
  &:focus-visible { outline:2px solid var(--dw-cyan); outline-offset:-2px; }
  &:disabled { opacity:.5; cursor:not-allowed; }
`;
export const Destinations = styled.div`
  display:grid; gap:6px; min-width:0;
  > span { color:var(--dw-text-secondary); font:400 .75rem/1.4 var(--dw-font-ui); }
  > div { display:flex; flex-wrap:wrap; gap:4px; }
`;
export const Destination = styled.button`
  min-height:44px; min-width:0; max-width:100%; display:flex; align-items:center; gap:6px;
  padding:7px 10px; border:1px solid var(--dw-border-soft); border-radius:8px;
  color:var(--dw-text-secondary); background:var(--dw-background); font:400 .75rem/1.35 var(--dw-font-ui);
  overflow-wrap:anywhere; text-align:left; cursor:pointer;
  svg { width:15px; height:15px; flex-shrink:0; }
  > span { min-width:0; }
  &[aria-pressed='true'] { border-color:rgba(var(--box-primary-rgb),.6); color:var(--box-neon);
    background:rgba(var(--box-primary-rgb),.075); box-shadow:inset 0 1px 0 rgba(255,255,255,.035); }
  &:hover:not(:disabled) { border-color:var(--box-neon); }
  &:disabled { opacity:.5; cursor:not-allowed; }
  &:focus-visible { outline:2px solid var(--dw-cyan); outline-offset:-2px; }
`;
export const Commands = styled.div`
  display:grid; grid-template-columns:minmax(0,1.3fr) repeat(2,minmax(0,1fr)); gap:4px; align-items:stretch;
`;
export const Command = styled.button`
  min-width:0; min-height:44px; display:flex; align-items:center; justify-content:center; gap:5px;
  padding:6px 4px; border:1px solid transparent; border-radius:7px; color:var(--dw-text-secondary);
  background:transparent; font:500 .73rem/1.3 var(--dw-font-ui); cursor:pointer;
  svg { width:16px; height:16px; flex-shrink:0; }
  &:hover:not(:disabled) { color:var(--dw-text); background:var(--dw-surface); }
  &:focus-visible { outline:2px solid var(--dw-cyan); outline-offset:-2px; }
  &:disabled { opacity:.5; cursor:not-allowed; }
  @media(max-width:360px) { flex-direction:column; gap:3px; }
`;
export const Complete = styled(Command)`
  color:${({ $route })=>routeColor($route)}; border-color:color-mix(in srgb,currentColor 50%,transparent);
  background:color-mix(in srgb,currentColor 10%,var(--dw-background));
  &:hover:not(:disabled) { color:${({ $route })=>routeColor($route)};
    background:color-mix(in srgb,currentColor 18%,var(--dw-background)); }
`;
// One contained edit rail keeps the draft distinct from the saved exit commands.
export const Draft = styled.div`
  display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px;
  padding:6px 8px; border:1px solid var(--dw-border-soft); border-radius:8px;
  background:linear-gradient(110deg,rgba(126,215,255,.035),transparent),var(--dw-background);
  > div:first-child { min-width:0; display:grid; gap:3px; }
  small { color:var(--dw-text-secondary); font:400 .75rem/1.3 var(--dw-font-ui); }
  strong { color:var(--dw-text); font:500 .75rem/1.35 var(--dw-font-ui); overflow-wrap:anywhere; }
  > div:last-child { display:flex; gap:4px; }
  @media(max-width:380px) { grid-template-columns:minmax(0,1fr);
    > div:last-child { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); } }
`;
export const CancelPlan = styled(Command)`
  padding-inline:8px; font-size:.75rem;
  @media(max-width:360px) { flex-direction:row; }
`;
export const Apply = styled(CancelPlan)`
  padding-inline:10px; color:var(--dw-cyan); font-weight:600;
  border:1px solid color-mix(in srgb,var(--dw-cyan) 60%,var(--dw-background));
  background:color-mix(in srgb,var(--dw-cyan) 13%,var(--dw-background));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
  &:hover:not(:disabled) { color:var(--dw-cyan);
    background:color-mix(in srgb,var(--dw-cyan) 21%,var(--dw-background)); }
`;
export const ScopeNote = styled.p`margin:0; color:var(--dw-text-muted); font:400 .7rem/1.4 var(--dw-font-ui);`;
