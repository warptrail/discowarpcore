import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';

const edgeHueDrift = keyframes`
  0%, 100% { background-position: 0 0, 0 0; }
  50% { background-position: 0 100%, 0 0; }
`;

export const Shell = styled.section`
  position: relative; display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px;
  grid-template-rows: 18px minmax(0, 1fr); align-items: center;
  width: 100%; min-width: 0; height: 104px; padding: 2px 0 4px;
  border: 0; border-radius: 0;
  background: linear-gradient(180deg, rgba(223, 243, 255, .035), transparent), var(--dw-surface);
  box-shadow: 0 14px 18px -7px rgba(0, 0, 0, .75), 0 5px 7px -4px rgba(0, 0, 0, .6);
  &::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 5px;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(113, 210, 255, .4), var(--dw-surface-raised) 35%, var(--dw-surface));
    box-shadow: inset 0 1px 0 rgba(223, 243, 255, .14), 0 3px 0 var(--dw-surface), 0 9px 12px rgba(0, 0, 0, .55);
  }
  ${({ $expanded }) => $expanded && css`
    flex: 1; min-height: 0; height: auto; grid-template-rows: 44px minmax(0, 1fr);
    padding: 0; background: transparent; box-shadow: none;
    &::after { display: none; }
  `}
`;
export const Heading = styled.div`
  grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between;
  gap: .5rem; padding: 0 .7rem; color: var(--dw-cyan);
  font: 650 .67rem/1.2 var(--dw-font-ui); letter-spacing: .08em; text-transform: uppercase;
`;
export const Arrow = styled.button`
  display: grid; place-items: center; width: 44px; min-height: 44px; padding: 0;
  border: 0; border-radius: 0; background: transparent; color: var(--dw-cyan);
  box-shadow: none; cursor: pointer;
  svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  &:hover:not(:disabled) { color: var(--dw-text); }
  &:active:not(:disabled) { color: var(--dw-text-secondary); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -3px; }
  &:disabled { opacity: .3; cursor: default; }
`;
export const CloseButton = styled(Arrow)`background: transparent; box-shadow: none;`;
// Fixed to the crop boundaries, outside the scrolling track and arrow targets.
export const CarouselEdges = styled.span`
  position: absolute; inset: 23px 44px 7px; z-index: 1; pointer-events: none;
  &::before, &::after {
    content: ''; position: absolute; top: 0; bottom: 0; width: 10px;
    background-image:
      linear-gradient(180deg, transparent, rgba(113, 210, 255, .45) 22%, rgba(183, 147, 255, .4) 48%, rgba(92, 218, 203, .36) 72%, transparent),
      linear-gradient(90deg, var(--dw-surface), transparent);
    background-size: 1px 180%, 100% 100%; background-repeat: no-repeat;
    animation: ${edgeHueDrift} 18s ease-in-out infinite;
  }
  &::before { left: 0; }
  &::after { right: 0; transform: scaleX(-1); animation-delay: -9s; }
  @media (prefers-reduced-motion: reduce) {
    &::before, &::after { animation: none; background-position: 0 50%, 0 0; }
  }
`;
export const Viewport = styled.div`
  width: 100%; min-width: 0; height: 100%; overflow-x: auto; overflow-y: hidden;
  container-type: inline-size;
  scroll-snap-type: x mandatory; overscroll-behavior-x: contain;
  scrollbar-width: none; touch-action: pan-x pan-y; user-select: none;
  cursor: grab; perspective: 900px;
  &::-webkit-scrollbar { display: none; }
  &:active { cursor: grabbing; }
`;
export const Track = styled.div`
  position: relative; display: flex; gap: 8px; width: max-content; height: 100%;
  padding-inline: ${({ $looping }) => $looping ? '0' : 'max(0px, calc((100cqi - min(360px, 96cqi)) / 2))'};
`;
export const Cycle = styled.div`
  position: relative; display: flex; gap: 8px; align-items: center;
`;
export const Card = styled.article`
  position: relative; flex: 0 0 min(360px, 96cqi); width: min(360px, 96cqi); height: 76px;
  border: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), .4);
  border-left: 2px solid var(--box-primary, var(--dw-violet)); border-radius: 5px;
  background: linear-gradient(100deg, rgba(var(--box-primary-rgb, 127, 215, 255), .15), transparent), var(--dw-surface-raised);
  box-shadow: inset 0 1px 0 rgba(223, 243, 255, .08), 0 3px 6px rgba(0, 0, 0, .3);
  transform: rotateY(var(--answer-angle, 0deg)) scale(var(--answer-scale, 1));
  opacity: var(--answer-opacity, 1); transform-origin: center;
  scroll-snap-align: center;
  &[data-centered='true'] { border-color: rgba(var(--box-primary-rgb, 127, 215, 255), .8); }
  @media (prefers-reduced-motion: reduce) { transform: none; opacity: 1; }
`;
export const ItemLink = styled(Link)`
  display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: .5rem;
  height: 100%; padding: 3px; color: var(--dw-text); text-decoration: none; cursor: pointer;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; border-radius: 4px; }
`;
export const Thumbnail = styled.span`
  display: grid; place-items: center; width: 58px; height: 68px; overflow: hidden;
  border-radius: 3px; background: var(--dw-surface); color: var(--dw-text-muted);
  img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
  svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.4; }
`;
export const Details = styled.span`
  display: grid; align-content: center; gap: .1rem; min-width: 0; padding-right: .3rem;
  > span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
`;
export const Name = styled.span`
  font-size: .85rem; font-weight: 750; line-height: 1.2; padding-right: 3rem;
  && { display: -webkit-box; -webkit-line-clamp: ${({ $hasHint }) => $hasHint ? 1 : 2}; -webkit-box-orient: vertical; white-space: normal; }
  @container (max-width: 260px) {
    padding-right: 0; font-size: .8rem; line-height: 1.2;
  }
`;
export const BoxName = styled.span`font-size: .75rem; line-height: 1.35; color: var(--box-secondary, var(--dw-text-secondary));`;
export const Path = styled.span`font-size: .75rem; line-height: 1.35; color: var(--box-location, var(--dw-text-secondary));`;
export const MatchHint = styled.span`
  font: 400 .7rem/1.2 var(--dw-font-ui); color: var(--dw-text-secondary);
  b { font-weight: 500; color: var(--dw-cyan); }
`;
export const BoxLink = styled(Link)`
  position: absolute; top: 4px; right: 3px; min-width: 44px; min-height: 44px;
  display: flex; align-items: flex-start; justify-content: flex-end; padding: 2px 3px;
  text-decoration: none; color: var(--box-primary, var(--dw-cyan));
  font: 750 .85rem/1.2 var(--dw-font-data);
  @container (max-width: 260px) {
    top: auto; bottom: 1px; left: 4px; right: auto; justify-content: flex-start; align-items: flex-end;
    background: linear-gradient(0deg, var(--dw-surface) 25%, transparent); border-radius: 3px;
  }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export const Counter = styled.span`
  margin-left: auto; color: var(--dw-text); font: 600 .7rem/1.3 var(--dw-font-data); letter-spacing: normal;
`;
export const Notice = styled.p`
  margin: 0; display: flex; align-items: center; height: 100%; min-width: 0;
  color: var(--dw-text-secondary); font-size: .78rem;
`;
