import styled from 'styled-components';
import * as A from './DeclutterActionsPanel.styles';

const decisionColor = (choice) => ({
  keep: 'var(--dw-teal)', toss: 'var(--dw-coral)', donate: 'var(--dw-violet)',
  sell: 'var(--dw-amber)', gift: '#ff79c6', unsure: 'var(--dw-cyan)',
}[choice] || 'var(--dw-text-secondary)');

export const Identity = styled.div`
  display:grid; grid-template-columns:56px minmax(0,1fr); gap:10px; align-items:start;
  > div:last-child { min-width:0; display:grid; gap:4px; }
  > div:last-child > a, > div:last-child > strong { color:var(--dw-text); font:750 .95rem/1.25 var(--dw-font-ui); letter-spacing:-.02em; overflow-wrap:anywhere; }
  > div:last-child > a:hover { color:var(--box-neon); }
  small { color:var(--dw-text-muted); font:400 .7rem/1.4 var(--dw-font-ui); }
`;
export const Photo = styled.div`
  width:56px; height:56px; border:1px solid rgba(var(--box-primary-rgb),.22); border-radius:8px;
  background:var(--dw-background); display:grid; place-items:center; overflow:hidden; color:var(--box-neon);
  img { width:100%; height:100%; object-fit:contain; }
  svg { opacity:.6; }
`;
export const Context = styled.div`
  min-width:0; font:400 .72rem/1.4 var(--dw-font-ui); color:var(--dw-text-secondary); overflow-wrap:anywhere;
  a { color:var(--dw-text-secondary); text-decoration:none; }
  a:hover { color:var(--box-neon); }
  span { color:var(--box-neon); font-family:var(--dw-font-data); margin-right:5px; }
`;
export const Votes = styled.div`
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; min-width:0;
`;
export const Vote = styled.div`
  min-width:0; display:flex; align-items:center; gap:7px; padding:8px; border-radius:7px;
  border:1px solid var(--dw-border-soft); background:var(--dw-background);
  > span { font-size:1rem; flex-shrink:0; }
  > div { min-width:0; display:grid; gap:3px; }
  small { color:var(--dw-text-secondary); font:400 .7rem/1.2 var(--dw-font-ui); }
  strong { color:${({ $tone })=>decisionColor($tone)}; font:600 .8rem/1.2 var(--dw-font-ui); overflow-wrap:anywhere; }
`;
export const Resolve = styled(A.Command)`
  justify-content:space-between; padding-inline:10px; color:var(--box-neon);
  border-top:1px solid rgba(var(--box-primary-rgb),.2); border-radius:0 0 6px 6px;
  &:hover:not(:disabled) { color:var(--box-neon); background:rgba(var(--box-primary-rgb),.06); }
  svg { width:18px; height:18px; }
`;
export const NotesDisclosure = styled.details`
  color:var(--dw-text-secondary); font:400 .75rem/1.45 var(--dw-font-ui); overflow-wrap:anywhere;
  summary { cursor:pointer; min-height:44px; display:flex; align-items:center; }
  p { margin:0 0 6px; white-space:pre-wrap; }
`;
export const Scrim = styled.div`
  position:fixed; inset:0; z-index:1200; display:grid; place-items:center; padding:16px;
  background:rgba(3,8,14,.8);
  @media(max-width:540px) { padding:8px; }
`;
export const Sheet = styled.section`
  width:min(100%,620px); max-height:calc(100dvh - 32px); min-width:0;
  display:flex; flex-direction:column; overflow:hidden; border-radius:16px;
  background:var(--dw-background); border:1px solid rgba(var(--box-primary-rgb),.7);
  box-shadow:0 0 24px rgba(var(--box-primary-rgb),.16),inset 0 1px 0 rgba(255,255,255,.08);
  &:focus { outline:none; }
  button:focus-visible,textarea:focus-visible { outline:2px solid var(--dw-cyan); outline-offset:-2px; }
  @media(max-width:540px) { max-height:calc(100dvh - 16px); }
`;
export const SheetHeader = styled.header`
  display:flex; justify-content:space-between; align-items:start; gap:8px; padding:14px 16px;
  border-bottom:1px solid rgba(var(--box-primary-rgb),.22); flex-shrink:0;
  > div { min-width:0; }
  h2 { margin:6px 0; color:var(--dw-text); font:800 clamp(1.1rem,3vw,1.5rem)/1.2 var(--dw-font-ui); letter-spacing:-.025em; overflow-wrap:anywhere; }
  p { margin:0; color:var(--dw-text-muted); font:400 .75rem/1.4 var(--dw-font-ui); overflow-wrap:anywhere; }
`;
export const Kicker = styled.span`
  color:var(--box-neon); font:500 .7rem/1.4 var(--dw-font-data); letter-spacing:.04em;
`;
export const Close = styled(A.Command)`flex-shrink:0; width:44px; font-size:1.5rem;`;
export const Body = styled.div`
  display:grid; gap:14px; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:14px 16px;
`;
export const Recommendation = styled.div`
  display:grid; gap:4px; padding:10px 12px; border-left:2px solid var(--box-neon);
  background:rgba(var(--box-primary-rgb),.045); border-radius:0 8px 8px 0;
  small,span { color:var(--dw-text-muted); font:400 .72rem/1.45 var(--dw-font-ui); }
  strong { color:var(--dw-text); font:600 .85rem/1.3 var(--dw-font-ui); }
`;
export const Section = styled.div`
  display:grid; gap:6px; min-width:0;
  > span { color:var(--dw-text-secondary); font:500 .8rem/1.4 var(--dw-font-ui); }
  > p { margin:0; color:var(--dw-text-muted); font:400 .73rem/1.4 var(--dw-font-ui); }
`;
export const Choices = styled.div`
  display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:2px;
  padding-block:4px; border-block:1px solid var(--dw-border-soft);
`;
export const Choice = styled(A.RouteChoice)`
  &[aria-pressed='true'] { color:${({ $tone })=>decisionColor($tone)}; }
  &:hover:not(:disabled) { color:${({ $tone })=>decisionColor($tone)}; }
`;
export const Notes = styled.label`
  display:grid; gap:6px; color:var(--dw-text-secondary); font:500 .8rem/1.4 var(--dw-font-ui);
  small { font-weight:400; color:var(--dw-text-muted); }
  textarea { width:100%; box-sizing:border-box; min-height:74px; resize:vertical; padding:10px;
    color:var(--dw-text); font:400 .8rem/1.5 var(--dw-font-ui); background:var(--dw-background);
    border:1px solid var(--dw-border-soft); border-radius:8px; }
`;
export const Error = styled.div`
  display:grid; gap:4px; padding:10px; border:1px solid var(--dw-coral); border-radius:8px;
  color:var(--dw-coral); font:400 .8rem/1.4 var(--dw-font-ui);
`;
export const Footer = styled.footer`
  display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:6px; padding:10px 16px;
  border-top:1px solid rgba(var(--box-primary-rgb),.22); background:var(--dw-background); flex-shrink:0;
  @media(max-width:380px) { grid-template-columns:minmax(0,1fr); }
`;
export const Confirm = styled(A.Command)`
  color:${({ $tone })=>decisionColor($tone)}; border:1px solid currentColor;
  background:color-mix(in srgb,currentColor 8%,var(--dw-background)); font-weight:650;
  &:hover:not(:disabled) { color:${({ $tone })=>decisionColor($tone)}; background:color-mix(in srgb,currentColor 14%,var(--dw-background)); }
`;
export const Reopen = styled(A.Command)`border:1px solid var(--dw-border-soft);`;
