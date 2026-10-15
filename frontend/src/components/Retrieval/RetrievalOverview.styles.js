import styled from 'styled-components';
import * as Finder from '../InventoryQuickAnswer/FinderItemFocus.styles';
import FinderItemPhoto from '../InventoryQuickAnswer/FinderItemPhoto';
import { frameCorners } from './RetrievalFrame.styles';

export const Identity = styled.section`
  min-width: 0; margin-bottom: 24px; padding-inline: 12px;
  @container (max-width: 520px) { padding-inline: 0; }
`;
export const Name = styled.h2`
  margin: 0; color: var(--dw-text); font: 800 clamp(1.6rem, 5.5cqw, 3rem)/1.13 var(--dw-font-ui);
  letter-spacing: -.025em; overflow-wrap: anywhere;
`;
export const Facts = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; margin: 4px 0 16px;
  color: var(--box-neon, var(--dw-cyan)); font: 400 clamp(.85rem, 2.6cqw, 1.375rem)/1.4 var(--dw-font-ui);
`;
export const FactSeparator = styled.span`color: var(--box-primary);`;
export const Description = styled.span`
  display: block; color: var(--dw-text-secondary);
  font: 400 clamp(.88rem, 2.6cqw, 1.375rem)/1.5 var(--dw-font-ui); white-space: pre-wrap;
`;
export const Tags = styled.ul`
  display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin: 12px 0 0; padding: 0;
  min-width: 0; color: var(--dw-text-secondary); font: 400 clamp(.75rem, 2.2cqw, 1.2rem)/1.25 var(--dw-font-ui);
  li { min-width: 0; }
  button, a {
    display: inline-flex; align-items: center; min-height: 40px; padding: 5px 10px;
    border: 1px solid rgba(var(--box-primary-rgb), .32); border-radius: 8px;
    color: inherit; background: linear-gradient(120deg, rgba(var(--box-primary-rgb), .06), transparent);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.025); text-decoration: none;
  }
  a:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @container (max-width: 520px) {
    gap: 5px;
    button, a { min-height: 28px; padding: 4px 6px; border-radius: 6px; }
  }
  @media (pointer: coarse) { button, a { min-height: 32px; } }
`;
export const Grid = styled.div`
  display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); gap: 18px; align-items: stretch;
  @container (max-width: 520px) { grid-template-columns: minmax(88px, .8fr) minmax(0, 1.2fr); gap: 12px; }
`;
export const Photo = styled(FinderItemPhoto)`
  && {
    position: relative; width: 100%; height: auto; min-height: 0; aspect-ratio: 1; align-self: start;
    border-radius: 12px; border: 1px solid rgba(var(--box-primary-rgb), .36);
    background: radial-gradient(ellipse at 50% 45%, rgba(var(--box-primary-rgb), .18), transparent 68%), var(--dw-background);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.025), 0 4px 16px rgba(0,0,0,.18);
    img { object-fit: contain; padding: 12px; }
  }
  ${frameCorners}
`;
export const EmptyPhoto = styled.figcaption`
  && { display: grid; justify-items: center; gap: 14px; padding: 20px;
    color: color-mix(in srgb, var(--dw-text-muted) 75%, var(--box-neon));
    font: 400 clamp(.8rem, 2.4cqw, 1.25rem)/1.45 var(--dw-font-ui); text-align: center;
    svg { width: 76px; height: 76px; fill: none; stroke: var(--box-primary); stroke-width: 1.4; opacity: .75; }
  }
  @container (max-width: 520px) {
    && { gap: 8px; padding: 12px; font-size: .75rem; }
    && svg { width: 36px; height: 36px; }
  }
`;
export const Placement = styled.div`
  min-width: 0; padding: clamp(14px, 3cqw, 28px);
  border: 1px solid rgba(var(--box-primary-rgb), .32); border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--box-primary-rgb), .025), transparent);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
  ${Finder.BoxIdentity} {
    align-items: flex-start; text-align: left; gap: 6px; margin-bottom: 20px; padding-bottom: 20px;
    border-bottom: 1px solid var(--prism-sheet-divider);
    strong { font-size: clamp(1.6rem, 5.5cqw, 3rem); }
    span { color: var(--dw-text); font-size: clamp(.88rem, 2.8cqw, 1.5rem); }
  }
  ${Finder.Placement} > h3 { margin-bottom: 12px; font-size: 1rem; letter-spacing: .08em; }
  ${Finder.RecordedNote} { font: 400 clamp(.82rem, 2.4cqw, 1.3rem)/1.45 var(--dw-font-ui); }
  ${Finder.RecordedNote} strong { color: inherit; font-weight: 400; }
  ${Finder.RecordedNote}:first-of-type {
    padding: 12px 14px; margin-top: 0; border: 1px solid rgba(var(--box-primary-rgb), .3); border-radius: 9px;
  }
  ${Finder.RecordedNote} + ${Finder.RecordedNote} {
    padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--prism-sheet-divider);
  }
  ${Finder.Tiers} { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @container (max-width: 520px) {
    padding: 12px;
    ${Finder.BoxIdentity} { gap: 4px; margin-bottom: 12px; padding-bottom: 12px; }
    ${Finder.Placement} > h3 { font-size: .7rem; margin-bottom: 8px; }
    ${Finder.RecordedNote} { font-size: .75rem; }
    ${Finder.RecordedNote}:first-of-type { padding: 8px; }
    ${Finder.RecordedNote} + ${Finder.RecordedNote} { padding-top: 10px; margin-top: 10px; }
    ${Finder.Tiers} { grid-template-columns: minmax(0, 1fr); }
  }
`;
