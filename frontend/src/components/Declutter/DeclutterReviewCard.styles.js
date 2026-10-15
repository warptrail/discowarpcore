import styled from 'styled-components';
import * as S from './Declutter.styles';

export const Shell = styled(S.ReviewShell)`
  position: relative; min-width: 0; gap: 0; padding: 0; overflow: hidden;
  border: 1px solid rgba(var(--box-primary-rgb),.68); border-radius: 18px 18px 14px 14px;
  background: radial-gradient(ellipse at 0 0,rgba(var(--box-primary-rgb),.065),transparent 65%),var(--dw-background);
  box-shadow: 0 0 10px rgba(var(--box-primary-rgb),.14), 0 0 30px rgba(var(--box-primary-rgb),.07),
    inset 0 1px 0 rgba(255,255,255,.1),inset 0 -2px 0 rgba(0,0,0,.5),0 12px 30px rgba(0,0,0,.18);
  &::before { content:''; position:absolute; inset:10px; pointer-events:none; opacity:.5;
    background: linear-gradient(var(--box-primary),var(--box-primary)) left top/10px 1px no-repeat,
      linear-gradient(var(--box-primary),var(--box-primary)) left top/1px 10px no-repeat,
      linear-gradient(var(--box-primary),var(--box-primary)) right bottom/10px 1px no-repeat,
      linear-gradient(var(--box-primary),var(--box-primary)) right bottom/1px 10px no-repeat; }
`;
export const Utility = styled(S.UtilityRow)`
  min-height: 52px; padding: 4px 16px; border-bottom: 1px solid rgba(var(--box-primary-rgb),.2);
  ${S.ProgressText} { color: var(--box-neon); font: 500 .75rem/1.4 var(--dw-font-data); }
`;
export const QuietButton = styled.button`
  display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:44px;
  padding:0 8px; border:0; border-radius:6px; color:var(--dw-text-secondary); background:transparent;
  font:500 .8rem/1.3 var(--dw-font-ui); cursor:pointer;
  svg { width:16px; height:16px; }
  &:hover { color:var(--dw-text); background:rgba(var(--box-primary-rgb),.06); }
  &:disabled { opacity:.5; cursor:wait; }
  &:focus-visible { outline:2px solid var(--dw-cyan); outline-offset:-2px; }
`;
export const Card = styled(S.ReviewCard)`
  grid-template-columns:minmax(0,1fr); gap:0;
  @media (prefers-reduced-motion:reduce) { transform:none; transition:none; }
`;
export const Identity = styled.div`
  display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:20px 20px 16px;
  > div { min-width:0; }
  ${S.DecisionPill} { flex-shrink:0; margin-top:4px; font-weight:500; border-color:var(--dw-border-soft);
    background:var(--dw-surface); color:var(--dw-text-muted); }
  @media(max-width:540px) { padding:16px 16px 12px; gap:8px; }
`;
export const Title = styled.h2`
  margin:0; color:var(--dw-text); font:800 clamp(1.5rem,2.8vw,2.1rem)/1.14 var(--dw-font-ui);
  letter-spacing:-.025em; overflow-wrap:anywhere;
`;
export const Facts = styled.div`
  display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; color:var(--box-neon);
  font:400 .8rem/1.4 var(--dw-font-ui);
`;
export const Attribution = styled.p`
  margin:6px 0 0; color:var(--dw-text-muted); font:400 .75rem/1.4 var(--dw-font-ui);
`;
export const Context = styled.div`
  display:grid; grid-template-columns:minmax(120px,220px) minmax(0,1fr); gap:16px; padding:0 20px 20px;
  @media(max-width:540px) { padding:0 16px 16px; gap:12px; grid-template-columns:88px minmax(0,1fr); }
`;
export const Photo = styled.div`
  display:grid; align-content:center; justify-items:center; gap:12px; min-width:0;
  align-self:start; width:100%; aspect-ratio:1; overflow:hidden; padding:14px; border-radius:12px;
  border:1px solid rgba(var(--box-primary-rgb),.3);
  background:radial-gradient(ellipse at center,rgba(var(--box-primary-rgb),.12),transparent 70%),var(--dw-background);
  color:var(--dw-text-muted); font:400 .75rem/1.5 var(--dw-font-ui); text-align:center;
  svg { width:38px; height:38px; color:var(--box-neon); }
  img { width:100%; height:100%; object-fit:contain; min-height:0; }
  @media(max-width:540px) { padding:8px; gap:6px; border-radius:10px; font-size:.7rem;
    svg { width:24px; height:24px; } }
`;
export const Placement = styled.div`
  min-width:0; padding:14px; border:1px solid rgba(var(--box-primary-rgb),.28); border-radius:12px;
  background:linear-gradient(135deg,rgba(var(--box-primary-rgb),.025),transparent);
  @media(max-width:540px) { padding:10px; }
`;
export const BoxIdentity = styled.div`
  display:grid; gap:3px; padding-bottom:10px; border-bottom:1px solid rgba(var(--box-primary-rgb),.18);
  strong { color:var(--box-neon); font:650 clamp(1.2rem,2vw,1.6rem)/1.2 var(--dw-font-data); overflow-wrap:anywhere; }
  span { color:var(--dw-text); font:500 .8rem/1.4 var(--dw-font-ui); overflow-wrap:anywhere; }
`;
export const Location = styled.div`
  display:grid; gap:4px; padding-top:10px; font:400 .8rem/1.45 var(--dw-font-ui); overflow-wrap:anywhere;
  small { color:var(--box-neon); font:500 .7rem/1.4 var(--dw-font-data); }
  span { color:var(--dw-text-secondary); }
`;
export const Details = styled.div`
  display:grid; gap:12px; padding:0 20px 20px;
  @media(max-width:540px) { padding:0 16px 16px; }
`;
export const Metadata = styled.dl`
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin:0;
  > div { min-width:0; }
  dt { color:var(--dw-text-muted); font:400 .75rem/1.4 var(--dw-font-ui); }
  dd { margin:3px 0 0; color:var(--dw-text-secondary); font:400 .85rem/1.45 var(--dw-font-ui); overflow-wrap:anywhere; }
`;
export const Tags = styled.div`
  display:flex; flex-wrap:wrap; gap:6px; color:var(--dw-text-secondary); font:400 .75rem/1.4 var(--dw-font-ui);
  span { padding:3px 6px; border:1px solid rgba(var(--box-primary-rgb),.25); border-radius:6px; overflow-wrap:anywhere; }
`;
export const Description = styled.p`
  margin:0; color:var(--dw-text-secondary); font:400 .85rem/1.55 var(--dw-font-ui); white-space:pre-wrap; overflow-wrap:anywhere;
`;
export const Decisions = styled.div`
  display:grid; gap:8px; padding:16px 20px 12px; border-top:1px solid rgba(var(--box-primary-rgb),.2);
  background:var(--dw-background);
  @media(max-width:540px) { padding:14px 16px 10px; }
`;
export const Prompt = styled.h3`
  margin:0 0 4px; color:var(--dw-text); font:600 .9rem/1.4 var(--dw-font-ui);
`;
export const Decision = styled(S.DecisionButton)`
  && { min-height:${({ $primary }) => $primary ? '54px' : '44px'}; padding:8px;
    border:1px solid ${({ $primary }) => $primary ? 'currentColor' : 'transparent'};
    border-radius:9px; font:600 ${({ $primary }) => $primary ? '.95rem' : '.8rem'}/1.3 var(--dw-font-ui);
    background:${({ $primary }) => $primary ? 'color-mix(in srgb,currentColor 9%,var(--dw-background))' : 'transparent'};
    box-shadow:none;
    svg { width:${({ $primary }) => $primary ? '22px' : '18px'}; height:22px; flex-shrink:0; }
    &:hover:not(:disabled) { background:color-mix(in srgb,currentColor 16%,var(--dw-background)); }
    &:focus-visible { outline:2px solid var(--dw-cyan); outline-offset:2px; }
  }
`;
export const Secondary = styled(S.SecondaryDecisionGrid)`
  grid-template-columns:repeat(4,minmax(0,1fr)); gap:2px;
  @media(max-width:360px) { grid-template-columns:repeat(2,minmax(0,1fr)); }
`;
export const Note = styled(S.NoteDisclosure)`
  margin:0 20px; padding:0 0 12px; border-top:1px solid var(--dw-border-soft);
  summary { display:flex; align-items:center; min-height:44px; color:var(--dw-text-secondary); font-size:.8rem;
    &::before { content:'+'; margin-right:8px; color:var(--box-neon); font-size:1rem; } }
  &[open] summary::before { content:'−'; }
  @media(max-width:540px) { margin-inline:16px; }
`;
export const Partner = styled(S.PartnerWaiting)`
  margin:12px 16px 0; padding:10px 12px; border-color:var(--dw-border-soft); border-radius:8px;
  background:var(--dw-surface); strong { color:var(--dw-violet); } svg { color:var(--dw-violet); }
`;
