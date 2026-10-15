import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { APP_VISUAL_THEME as theme } from '../../styles/tokens';

const slideDown = keyframes`from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: translateY(0); }`;
export const Scrim = styled.div`
  position: fixed; inset: 0; z-index: 1100; background: rgba(4, 9, 16, .72);
`;
export const Panel = styled.section`
  position: fixed; z-index: 1101; display: flex; flex-direction: column; min-width: 0;
  overflow: hidden; color: ${theme.text}; background: ${theme.surface};
  border: 1px solid ${theme.border}; border-radius: 4px 8px 4px 4px;
  box-shadow: inset 0 1px 0 rgba(223, 243, 255, .1), 0 18px 48px rgba(0, 0, 0, .7);
  animation: ${slideDown} 240ms ease-out both;
  &:focus { outline: none; }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
export const ItemTitle = styled.h2`
  margin: 2px 0 5px; text-align: center; font: 700 1.15rem/1.25 var(--dw-font-ui); overflow-wrap: anywhere;
`;
export const BasicFacts = styled.div`
  display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;
  color: ${theme.textMuted}; font: 400 .75rem/1.3 var(--dw-font-ui);
`;
export const IconButton = styled.button`
  display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; padding: 0;
  border: 0; border-radius: 3px; color: ${theme.textSecondary}; background: transparent; cursor: pointer;
  svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  &:hover { background: #24384a; }
  &[aria-pressed='true'] { color: ${theme.cyan}; background: rgba(113, 210, 255, .1); box-shadow: inset 0 -2px 0 ${theme.cyan}; }
  &:focus-visible { outline: 2px solid ${theme.cyan}; outline-offset: -2px; }
  &:disabled { opacity: .35; cursor: default; }
`;
export const Body = styled.div`
  min-height: 0; height: 100%; container-type: inline-size;
  overflow: auto; overscroll-behavior: contain; scrollbar-width: none; padding: 8px 4px 12px;
  &::-webkit-scrollbar { display: none; }
  ${({ $notes }) => $notes && css`
    display: flex; flex-direction: column; overflow: hidden;
    > :not(:last-child) { flex-shrink: 0; }
  `}
`;
export const Placement = styled.section`
  margin: 0;
  h3 { margin: 0 0 8px; color: ${theme.cyan}; font: 600 .7rem/1.3 var(--dw-font-data); letter-spacing: .06em; text-transform: uppercase; }
`;
export const BoxIdentity = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 12px; text-align: center;
  strong { color: var(--box-primary, ${theme.cyan}); font: 750 1.35rem/1.1 var(--dw-font-data); }
  span { color: var(--box-secondary, ${theme.text}); font-size: .85rem; font-weight: 600; overflow-wrap: anywhere; }
`;
export const Tiers = styled.dl`
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 0;
  > div { padding: 6px 8px; background: ${theme.surfaceRaised}; min-width: 0; border-radius: 3px; }
  dt { color: ${theme.textMuted}; font-size: .67rem; margin-bottom: 3px; }
  dd { margin: 0; color: ${theme.text}; font-size: .88rem; line-height: 1.3; overflow-wrap: anywhere; }
  dd[data-missing='true'] { color: ${theme.textMuted}; font-weight: 400; font-size: .77rem; }
  @media (max-width: 600px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @container (max-width: 600px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
export const DetailGrid = styled.div`
  display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); align-items: start; gap: 16px;
  @media (max-width: 600px) { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  @container (max-width: 600px) { grid-template-columns: minmax(0, 1fr); gap: 12px; }
`;
export const Photo = styled.figure`
  margin: 0; display: grid; place-items: center; height: 280px; overflow: hidden;
  grid-template-rows: minmax(0, 1fr); grid-template-columns: minmax(0, 1fr);
  background: ${theme.background}; border-radius: 4px; color: ${theme.textMuted};
  img { display: block; min-width: 0; min-height: 0; width: 100%; height: 100%; object-fit: contain; }
  figcaption { font-size: .8rem; }
  @media (max-width: 600px) { height: 200px; }
  @container (max-width: 600px) { height: 200px; }
`;
export const PhotoButton = styled(Photo).attrs({ as: 'button' })`
  width: 100%; padding: 0; border: 0; cursor: zoom-in;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export const Metadata = styled.div`
  min-width: 0;
  h3 { margin: 0 0 5px; color: ${theme.textMuted}; font: 500 .7rem/1.3 var(--dw-font-ui); }
  p { margin: 0 0 12px; color: ${theme.textSecondary}; font: 400 .87rem/1.5 var(--dw-font-ui); white-space: pre-wrap; overflow-wrap: anywhere; }
`;
export const Tags = styled.ul`
  display: flex; flex-wrap: wrap; list-style: none; margin: 0 0 12px; padding: 0; gap: 5px;
  li { padding: 3px 6px; border-radius: 3px; background: ${theme.surfaceRaised}; color: ${theme.textSecondary}; font-size: .78rem; overflow-wrap: anywhere; }
`;
export const RecordedNote = styled.p`
  margin: 8px 0 0; color: ${theme.textSecondary}; font: 400 .78rem/1.4 var(--dw-font-ui); overflow-wrap: anywhere;
`;
export const NotesPane = styled.section`
  display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0;
`;
export const NotesTitle = styled.h3`
  flex-shrink: 0; margin: 0 0 6px; color: ${theme.textMuted}; font: 500 .7rem/1.3 var(--dw-font-ui);
`;
export const NotesHeading = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 8px;`;
export const NoteWindow = styled.div`
  flex: 0 1 auto; min-height: 0; max-height: 360px; overflow: auto; overscroll-behavior: contain;
  padding: 8px 10px; border-radius: 3px; background: ${theme.background};
  scrollbar-width: thin; scrollbar-color: ${theme.border} transparent;
  &::-webkit-scrollbar { width: 4px; height: 4px; }
  &::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }
  &:focus-visible { outline: 2px solid ${theme.cyan}; outline-offset: -2px; }
`;
export const Footer = styled.div`
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; gap: 2px; padding: 5px 4px;
  border-top: 1px solid ${theme.borderSoft}; background: ${theme.surface};
  box-shadow: inset 0 -1px 0 rgba(223, 243, 255, .09);
`;
export const ViewControls = styled.div`
  display: flex; gap: 0; padding-right: 4px; margin-right: 2px; border-right: 1px solid ${theme.borderSoft};
`;
export const ActionLink = styled(Link)`
  display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; padding: 0;
  color: ${theme.cyan}; text-decoration: none; border-radius: 3px;
  svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  &:hover { background: ${theme.surfaceRaised}; }
  &:focus-visible { outline: 2px solid ${theme.cyan}; }
`;
