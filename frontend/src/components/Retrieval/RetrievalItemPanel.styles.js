import styled from 'styled-components';
import { controlStyles } from '../../styles/primitives';
import * as Finder from '../InventoryQuickAnswer/FinderItemFocus.styles';

export const HeadingLine = styled.span`
  display: flex; align-items: center; gap: 10px; min-width: 0;
`;
export const HeadingName = styled.span`
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;
`;
export const HeadingBox = styled.span`
  flex-shrink: 0; padding-left: 10px;
  border-left: 1px solid rgba(var(--box-primary-rgb, 113, 210, 255), .22);
  color: var(--box-neon, var(--dw-cyan)); font: 650 .95rem/1.2 var(--dw-font-data);
  letter-spacing: 0;
`;
export const AttributeValue = styled.span`min-width: 0; overflow-wrap: anywhere;`;
export const DescriptionText = styled.span`display: block; color: var(--dw-text-secondary); font: 400 .87rem/1.5 var(--dw-font-ui); white-space: pre-wrap;`;
export const AttributeButton = styled.button`
  display: inline-flex; align-items: center; justify-content: space-between; gap: 8px;
  min-width: 0; min-height: 44px; padding: 4px 6px;
  border: 1px solid transparent; border-radius: 8px;
  color: inherit; background: transparent; font: inherit; text-align: inherit; cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
  &:hover { border-color: rgba(var(--box-primary-rgb),.28); background: rgba(var(--box-primary-rgb),.065); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  ${({ $variant }) => $variant === 'block' && 'display: flex; width: 100%; text-align: left; padding: 8px;'}
  ${({ $variant }) => $variant === 'action' && 'justify-content: center; font-size: .75rem;'}
  ${({ $variant }) => $variant === 'prose' && 'display: block; width: 100%; min-height: 32px; padding: 3px 0; text-align: left;'}
  ${({ $variant }) => $variant === 'compact' && 'min-height: 32px; padding: 2px 4px;'}
  ${({ $variant }) => $variant === 'chip' && `min-height: 28px; padding: 3px 6px; border-radius: 5px;
    border-color: rgba(var(--box-primary-rgb),.16); background: var(--dw-surface-raised);
    @media (pointer: coarse) { min-height: 32px; }`}
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
export const SectionHeading = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 32px;
  h3 { margin: 0; }
`;
export const InlineActions = styled.div`display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; font-size: .76rem;`;
export const InlineSelect = styled.div`
  min-width: 0; width: 100%;
  [role='combobox'] { min-height: 44px; font: 400 .85rem/1.4 var(--dw-font-ui); }
  small { display: block; margin: 4px 0; color: var(--dw-text-secondary); font: 400 .75rem/1.4 var(--dw-font-ui); }
  [role='alert'] { color: var(--dw-coral); }
  > button { min-height: 44px; border: 0; padding: 4px 8px; background: transparent; color: var(--dw-text); font: inherit; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export const Panel = styled.section`
  display: flex; flex-direction: column; height: 100%; min-height: 0; min-width: 0;
`;
export const Tabs = styled.div`
  display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); flex-shrink: 0;
  padding: 4px ${({ $overview }) => $overview ? '76px' : '4px'} 4px 4px;
  border-bottom: 1px solid var(--prism-sheet-divider);
  background: var(--dw-background);
  @media (max-width: 700px) { padding: 3px ${({ $overview }) => $overview ? '48px' : '4px'} 3px 4px; }
  ${({ $overview }) => $overview && `@media (max-width: 360px) {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, .95fr) minmax(0, .85fr) minmax(0, .85fr) minmax(0, 1.25fr);
  }`}
`;
export const Tab = styled(Finder.IconButton)`
  width: 100%; height: 72px; gap: 7px; align-content: center;
  color: color-mix(in srgb, var(--box-secondary) 65%, var(--dw-text-secondary)); font: 500 1rem/1.2 var(--dw-font-ui);
  border-radius: 10px;
  svg { width: 22px; height: 22px; }
  &[aria-selected='true'] {
    color: var(--retrieval-panel-accent, var(--dw-cyan));
    background: linear-gradient(to top, rgba(var(--box-primary-rgb), .16), rgba(var(--box-primary-rgb), .025));
    box-shadow: inset 0 -3px 0 var(--retrieval-panel-accent, var(--dw-cyan)), 0 4px 12px rgba(var(--box-primary-rgb), .2);
    svg { filter: drop-shadow(0 0 4px rgba(var(--box-primary-rgb),.35)); }
  }
  @media (max-width: 700px) { height: 48px; gap: 2px; font-size: .72rem;
    svg { width: 17px; height: 17px; } }
`;
export const Content = styled(Finder.Body)`
  flex: 1; height: auto; padding: 24px 28px 28px;
  ${({ $commands }) => $commands && 'overflow: visible; padding: 12px 16px;'}
  @media (max-width: 700px) { padding: 18px 16px; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  ${Finder.DetailGrid} { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  ${Finder.Placement} { order: -1; }
  ${Finder.Placement} > h3 { color: var(--retrieval-panel-accent); }
  ${Finder.Photo}, ${Finder.PhotoButton} { height: clamp(120px, 21dvh, 180px); border-radius: 10px;
    border: 1px solid rgba(var(--box-primary-rgb),.18); box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
  ${Finder.Tiers} > div { border-radius: 8px; border: 1px solid rgba(var(--box-primary-rgb),.14);
    background: linear-gradient(120deg, rgba(var(--box-primary-rgb),.035), transparent), var(--dw-surface-raised); }
  ${Finder.Metadata} { margin-top: 12px; border-radius: 10px; border: 1px solid rgba(var(--box-primary-rgb),.14); padding: 8px; }
  ${Finder.Metadata} p { margin-bottom: 0; }
  ${Finder.Tags} { margin-top: 10px; }
  ${Finder.Tags} li { border-radius: 8px; padding: 0; border: 1px solid rgba(var(--box-primary-rgb),.16); }
  ${Finder.Tags} a { display: inline-flex; align-items: center; min-height: 44px; padding: 4px 8px; color: inherit; text-decoration: none; }
  ${Finder.Tags} a:focus-visible { outline: 2px solid var(--dw-cyan); }
  ${Finder.NoteWindow} { border-radius: 10px; border: 1px solid rgba(var(--box-primary-rgb),.18); }
`;
export const Hint = styled.p`
  margin: 0 0 12px; color: var(--dw-text-muted); font: 400 .78rem/1.45 var(--dw-font-ui);
`;
export const Status = styled.div`
  color: var(--dw-text-secondary); font-size: .82rem; line-height: 1.5;
  button { margin-top: 8px; }
`;
export const Group = styled.section`
  min-width: 0; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(var(--box-primary-rgb),.14);
  border-radius: 10px; background: linear-gradient(110deg, rgba(var(--box-primary-rgb),.025), transparent);
  h3 { margin: 0 0 6px; color: color-mix(in srgb, var(--dw-text-secondary) 70%, var(--box-primary, var(--dw-text-secondary)) 30%); font: 600 .8rem/1.4 var(--dw-font-ui); }
`;
export const Fields = styled.dl`
  margin: 0; min-width: 0;
  > div { display: grid; grid-template-columns: minmax(80px, .8fr) minmax(0, 1.2fr); align-items: start; gap: 10px;
    padding-block: 8px; border-bottom: 1px solid rgba(var(--box-primary-rgb, 113, 210, 255), .12); }
  dt { color: var(--dw-text-muted); font: 400 .78rem/1.45 var(--dw-font-ui); }
  dd { margin: 0; color: var(--dw-text); font: 400 .85rem/1.45 var(--dw-font-ui); overflow-wrap: anywhere; white-space: pre-wrap; }
`;
export const Button = styled.button`${controlStyles} min-height: 44px;`;
export const Timeline = styled.ol`
  list-style: none; margin: 0; padding: 0;
  li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--dw-border-soft);
    font: 400 .85rem/1.4 var(--dw-font-ui); }
  time { color: var(--dw-text-muted); font-size: .78rem; }
`;
export const CommandGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-bottom: 20px;
  button { padding-inline: 4px; font-size: .8rem; }
`;
export const Footer = styled(Finder.Footer)`
  justify-content: flex-end; gap: 4px; padding: 10px 28px max(10px, env(safe-area-inset-bottom));
  min-height: 68px; border-top-color: var(--prism-sheet-divider); border-radius: 14px 14px 0 0;
  background: var(--dw-background);
  a { display: inline-flex; align-items: center; min-height: 44px; gap: 6px; padding-inline: 8px;
    color: var(--retrieval-panel-accent, var(--box-neon)); font: 500 1rem/1.3 var(--dw-font-ui); text-decoration: none; }
  a + a { border-left: 1px solid var(--prism-sheet-divider); padding-left: 12px; }
  svg { width: 18px; height: 18px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linejoin: round; stroke-linecap: round; }
  a:focus-visible { outline: 2px solid var(--dw-cyan); }
  @media (max-width: 700px) { min-height: 54px; padding: 5px 16px max(5px, env(safe-area-inset-bottom));
    a { font-size: .78rem; } }
`;
