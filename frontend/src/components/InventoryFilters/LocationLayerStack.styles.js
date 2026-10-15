import styled, { keyframes } from 'styled-components';
import PaintedControlLabel from './PaintedControlLabel';

const arrive = keyframes`
  from { transform: translate(6px, 6px); }
  to { transform: translate(0, 0); }
`;
export const Stage = styled.div`
  position: relative;
  min-width: 0;
  margin: .1rem .15rem .2rem;
  padding-top: ${({ $depth }) => $depth * 4}px;
  padding-left: ${({ $depth }) => $depth * 4}px;
`;
export const Backplate = styled.div`
  position: absolute;
  inset: ${({ $index }) => $index * 4}px 0 0 ${({ $index }) => $index * 4}px;
  border: 1px solid color-mix(in srgb, var(--layer-color) 32%, var(--dw-border-soft));
  border-radius: 4px;
  background: var(--dw-surface);
  pointer-events: none;
`;
export const Face = styled.div`
  position: relative;
  min-width: 0;
  height: ${({ $hasTrail }) => $hasTrail ? '94px' : '50px'};
  border: 1px solid color-mix(in srgb, var(--layer-color) 40%, var(--dw-border-soft));
  border-radius: 4px;
  background: var(--dw-surface);
  box-shadow: -3px -3px 8px rgba(0, 0, 0, .12);
  animation: ${arrive} 200ms ease-out both;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
export const Trail = styled.nav`
  position: absolute;
  inset: 0 ${({ $hasClear }) => $hasClear ? '44px' : '0'} auto 0;
  height: 44px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: .1rem;
  min-width: 0;
  padding-inline: .2rem;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  overscroll-behavior-x: contain;
`;
export const Crumb = styled.button`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  min-height: 40px;
  min-width: 40px;
  max-width: 9rem;
  padding: .2rem .4rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--dw-text-muted);
  font: 550 .7rem/1.2 var(--dw-font-ui);
  cursor: pointer;
  > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  svg { width: 13px; height: 13px; flex-shrink: 0; }
  &[aria-current='step'] { color: var(--layer-color); border-bottom-color: var(--layer-color); }
  &:hover { color: var(--dw-text); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @media (pointer: coarse) { min-width: 44px; min-height: 44px; }
`;
export const Clear = styled.button`
  position: absolute;
  inset: 0 0 auto auto;
  z-index: 2;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--dw-text-muted);
  cursor: pointer;
  svg { width: 14px; height: 14px; }
  &:hover { color: var(--layer-color); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
export const Wall = styled.div`
  position: relative;
  min-width: 0;
  padding-top: ${({ $hasTrail }) => $hasTrail ? '44px' : '0'};
`;
export const WallLabel = styled(PaintedControlLabel)`
  inset: auto;
  width: max-content;
  height: 23px;
  white-space: nowrap;
  display: block;
  opacity: .23;
  color: var(--dw-violet);
  font-size: clamp(1.1rem, 4.5vw, 1.4rem);
  letter-spacing: .14em;
  filter: none;
  text-shadow: 0 1px 1px rgba(0, 0, 0, .8), .4px -.3px .6px currentColor;
  transition: left 180ms ease-out, top 180ms ease-out;
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
export const CarouselShell = styled.div`
  position: relative;
  height: 48px;
  margin-right: ${({ $hasClear }) => $hasClear ? '44px' : '0'};
  overflow: hidden;
`;
export const Carousel = styled.div`
  position: relative;
  z-index: 1;
  height: 48px;
  padding: 2px .3rem;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
  user-select: none;
  cursor: grab;
  &:active { cursor: grabbing; }
`;
export const Track = styled.div`
  position: relative;
  display: flex;
  gap: 4px;
  width: max-content;
`;
export const Cycle = styled.div`
  position: relative;
  display: flex;
  gap: 4px;
`;
export const Choice = styled.button`
  flex: 0 0 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .1rem;
  min-width: 0;
  min-height: 44px;
  height: 44px;
  padding: 0 .15rem;
  scroll-snap-align: start;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--dw-text-secondary);
  font: 550 .6875rem/1.1 var(--dw-font-ui);
  cursor: pointer;
  transition: color 160ms ease-out, background 160ms ease-out;
  > svg { width: 18px; height: 18px; flex-shrink: 0; opacity: .72; filter: drop-shadow(0 3px 2px rgba(0, 0, 0, .35)); }
  > span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &[aria-pressed='true'] {
    color: var(--layer-color);
    border-color: color-mix(in srgb, var(--layer-color) 35%, transparent);
    background: color-mix(in srgb, var(--layer-color) 9%, transparent);
  }
  &[aria-pressed='true'] > svg, &:hover > svg, &:focus-visible > svg { opacity: 1; }
  &:hover { color: var(--layer-color); background: color-mix(in srgb, var(--layer-color) 6%, transparent); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  &[data-keyboard-current='true'] { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
export const Empty = styled.span`
  align-self: center;
  color: var(--dw-text-muted);
  font: 450 .75rem/1.3 var(--dw-font-ui);
`;
