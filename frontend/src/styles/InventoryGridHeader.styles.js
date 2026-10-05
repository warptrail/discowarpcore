import styled, { css, keyframes } from 'styled-components';
import { controlStyles, inputStyles, panelStyles } from './primitives';
import { Link } from 'react-router-dom';
import { APP_VISUAL_THEME } from './tokens';

const LCARS = {
  bg: APP_VISUAL_THEME.background,
  panel: APP_VISUAL_THEME.surface,
  panelAlt: APP_VISUAL_THEME.surfaceRaised,
  text: APP_VISUAL_THEME.text,
  textDim: APP_VISUAL_THEME.textSecondary,
  line: APP_VISUAL_THEME.border,
  teal: APP_VISUAL_THEME.teal,
  lilac: APP_VISUAL_THEME.violet,
  amber: APP_VISUAL_THEME.amber,
  lime: APP_VISUAL_THEME.teal,
  root: APP_VISUAL_THEME.cyan,
};

const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;

const panelBase = css`${panelStyles}`;

export const HeaderShell = styled.section`
  position: relative;
  z-index: 30;
  display: grid;
  gap: 0.38rem;
  min-width: 0;
  margin-bottom: -0.4rem;

  @media (max-width: 700px) {
    margin-top: -0.55rem;
    margin-bottom: 0;
    margin-inline: 0;
    width: 100%;
    gap: 0;
  }
  font-family: var(--dw-font-ui);
  & :is(button, a, input, select):focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
`;

export const ControlConsole = styled.div`
  position: relative;
  display: grid;
  grid-template-areas:
    'utility utility'
    'telemetry telemetry';
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.12rem 0.5rem;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0.28rem 0.55rem 0.25rem 0.75rem;
  overflow: visible;
  border: 1px solid rgba(104, 154, 186, 0.32);
  border-radius: var(--dw-radius);
  background: var(--dw-surface-raised);
  box-shadow: none;

  @media (min-width: 660px) {
    display: grid;
    grid-template-areas:
      'utility utility'
      'telemetry telemetry';
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.18rem 0.36rem;
    padding: 0.3rem 0.55rem 0.28rem 0.75rem;
  }

  @media (max-width: 560px) {
    gap: 0.12rem 0.3rem;
    padding: 0.25rem 0 0.24rem;
  }

  @media (max-width: 700px) {
    border-inline: 0;
    border-bottom: 0;
    border-radius: 0;
    background: var(--dw-surface);
    box-shadow: none;
  }
  border-left: 4px solid var(--dw-amber);
  @media (max-width: 700px) { border-left: 4px solid var(--dw-amber); padding-left: 0.4rem; }
`;

const finderCollapse = keyframes`
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(-0.35rem) scale(0.98);
  }
`;

export const FloatingFinder = styled.div`
  position: relative;
  z-index: 20;
  width: 100%;
  min-width: 0;
  pointer-events: none;
  transform-origin: 50% 0%;
  animation: ${({ $collapsing }) => ($collapsing ? css`${finderCollapse} 180ms cubic-bezier(0.4, 0, 1, 1) forwards` : 'none')};
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  width: 100%;

  @media (max-width: 560px) {
    order: 1;
  }
`;

export const TitleActions = styled.div`
  position: absolute;
  z-index: 60;
  top: calc(100% + 0.42rem);
  right: 0;
  display: grid;
  gap: 0.18rem;
  width: min(18rem, calc(100vw - 2rem));
  min-width: 0;
  padding: 0.3rem;
  border: 1px solid ${toneAlpha(LCARS.line, 'c8')};
  border-radius: 5px;
  background: var(--dw-surface-raised);
  box-shadow: none;
  opacity: ${({ $mobileOpen }) => ($mobileOpen ? 1 : 0)};
  visibility: ${({ $mobileOpen }) => ($mobileOpen ? 'visible' : 'hidden')};
  pointer-events: ${({ $mobileOpen }) => ($mobileOpen ? 'auto' : 'none')};
  transform: translateY(${({ $mobileOpen }) => ($mobileOpen ? '0' : '-5px')});
  transition:
    opacity 180ms ease,
    visibility 0s linear ${({ $mobileOpen }) => ($mobileOpen ? '0s' : '180ms')},
    transform 180ms ease;

  > button {
    width: 100%;
    min-height: 40px;
    justify-content: flex-start;
    padding-inline: 0.62rem;
    border-radius: 3px;
  }

  @media (min-width: 660px) {
    position: static;
    display: flex;
    align-items: stretch;
    gap: 0.18rem;
    width: auto;
    padding: 1px;
    overflow: hidden;
    border-color: ${toneAlpha(LCARS.line, 'b0')};
    border-radius: 3px;
    background: var(--dw-surface-raised);
    box-shadow: none;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: none;
    transition: none;

    > button {
      width: auto;
      min-height: var(--dw-control-height);
      justify-content: center;
      padding-inline: 0.32rem;
      font-size: 0.75rem;
      letter-spacing: normal;
    }
  }

  @media (min-width: 800px) {
    > button {
      padding-inline: 0.42rem;
      font-size: 0.75rem;
      letter-spacing: normal;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
  background: var(--dw-surface-raised);
  box-shadow: var(--dw-shadow);
  @media (min-width: 660px) { flex-wrap: wrap; overflow: visible; box-shadow: none; }
`;

export const TitleOrphanActions = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.18rem;
  min-width: 0;

  button {
    width: 100%;
    min-height: 40px;
    justify-content: flex-start;
    padding-inline: 0.62rem;
    border-radius: 3px;
    font-size: 0.75rem;
    letter-spacing: normal;
    white-space: nowrap;
  }

  @media (min-width: 660px) {
    display: flex;
    align-items: stretch;
    gap: 0.18rem;

    button {
      width: auto;
      min-height: var(--dw-control-height);
      justify-content: center;
      padding-inline: 0.28rem;
      font-size: 0.75rem;
      letter-spacing: normal;
    }
  }

  @media (min-width: 800px) {
    button {
      padding-inline: 0.36rem;
      font-size: 0.75rem;
      letter-spacing: normal;
    }
  }
  min-width: 0;
  @media (min-width: 660px) { flex-wrap: wrap; }
`;

export const TitleIdentity = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
`;

export const MinimizedBar = styled.div`
  display: flex;
  align-items: center;
  min-height: var(--dw-control-height);
`;

export const MinimizedChip = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-height: var(--dw-control-height);
  max-width: 100%;
  border: 1px solid ${toneAlpha(LCARS.teal, '72')};
  border-radius: 8px;
  padding: 0.18rem 0.48rem 0.18rem 0.34rem;
  color: ${toneAlpha(LCARS.text, 'e8')};
  background: var(--dw-surface);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${toneAlpha(LCARS.root, 'd0')};
    color: ${toneAlpha(LCARS.root, 'ff')};
    box-shadow: none;
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const MinimizedIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid ${toneAlpha(LCARS.root, '80')};
  border-radius: 5px;
  color: ${toneAlpha(LCARS.root, 'f2')};
  background: var(--dw-surface-raised);
  font-size: 0.86rem;
  line-height: 1;
`;

export const MinimizedCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: var(--dw-radius);
  color: ${LCARS.bg};
  background: ${LCARS.amber};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0;
`;

export const TitlePip = styled.span`
  width: 9px;
  height: 26px;
  border-radius: 8px;
  background: ${LCARS.teal};
  box-shadow: none;
  background: var(--dw-amber);
`;

export const Title = styled.h2`
  margin: 0;
  font-family: var(--dw-font-ui);
  font-size: clamp(1.02rem, 2.3vw, 1.22rem);
  font-weight: 650;
  letter-spacing: normal;
  color: ${toneAlpha(LCARS.text, 'f2')};
`;

export const TelemetryRow = styled.div`
  position: static;
  grid-area: telemetry;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.16rem 0.34rem;
  max-width: 100%;
  margin: 0;
  padding: 0.06rem 0.18rem 0;
  border: 0;
  background: transparent;
  color: ${LCARS.textDim};
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  opacity: 0.82;
  pointer-events: none;
  white-space: nowrap;
  text-transform: none;
  text-shadow: none;

  @media (min-width: 660px) {
    grid-area: telemetry;
    justify-self: stretch;
    flex: 0 0 auto;
    flex-wrap: nowrap;
    min-height: 14px;
    gap: 0.12rem;
    width: 100%;
    padding: 0.06rem 0.08rem;
    border-top: 0;
    border-left: 0;
    background: transparent;
    opacity: 0.82;
    font-size: 0.75rem;
    letter-spacing: normal;
  }

  @media (max-width: 560px) {
    display: none;
  }

  @media (min-width: 800px) {
    gap: 0.16rem 0.34rem;
    padding-right: 0.48rem;
    letter-spacing: normal;
  }
  opacity: 1;
  color: var(--dw-text-secondary);
  @media (min-width: 660px) { opacity: 1; flex-wrap: wrap; }
`;

export const MobileTelemetryValue = styled.span`
  display: none;
  overflow: hidden;
  color: rgba(211, 232, 244, 0.82);
  font: 800 0.75rem/1.1 var(--dw-font-ui);
  letter-spacing: normal;
  text-align: right;
  text-overflow: ellipsis;
  text-transform: none;
  white-space: nowrap;

  @media (max-width: 560px) {
    display: block;
  }
  animation: mobileTelemetryFade 420ms ease both;

  @keyframes mobileTelemetryFade {
    from { opacity: 0; transform: translateX(8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  color: var(--dw-text-secondary);
  font-weight: 600;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const TelemetryLine = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.28rem;
  min-width: 0;

  @media (max-width: 560px) {
    gap: 0.22rem;
  }
`;

export const TelemetryValue = styled.span`
  color: ${({ $tone }) =>
    $tone === 'boxes'
      ? toneAlpha(LCARS.root, 'ee')
      : $tone === 'items'
        ? toneAlpha(LCARS.amber, 'ee')
        : toneAlpha(LCARS.lilac, 'ee')};
`;

export const Sep = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'b8')};
`;

export const SearchSortRow = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns:
    minmax(280px, 2.2fr)
    minmax(200px, 1.35fr)
    minmax(126px, 0.72fr)
    minmax(126px, 0.72fr);
  gap: 0.55rem;

  @media (max-width: 880px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const FilterRow = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.42rem 0.58rem;

  @media (max-width: 820px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 370px) {
    grid-template-columns: 1fr;
  }
`;

export const UtilityRow = styled.div`
  position: relative;
  z-index: 20;
  grid-area: utility;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 0.36rem;
  width: 100%;
  min-height: var(--dw-control-height);
  margin: 0;

  @media (min-width: 660px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 0.38rem;
    width: 100%;
  }

  @media (max-width: 560px) {
    min-height: var(--dw-control-height);
  }
`;

export const MapStatus = styled.span`
  grid-area: map;
  align-self: center;
  min-width: 0;
  padding-left: 0.1rem;
  color: rgba(167, 182, 255, 0.72);
  font: 850 0.75rem/1 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;

  @media (min-width: 660px) {
    flex: 0 0 auto;
    padding: 0 0.28rem 0 0.1rem;
    font-size: 0.75rem;
    letter-spacing: normal;
  }

  @media (min-width: 800px) {
    padding-right: 0.42rem;
    font-size: 0.75rem;
    letter-spacing: normal;
  }
`;

export const MobileActionsButton = styled.button`
  ${controlStyles}
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.34rem;
  min-width: 5.35rem;
  min-height: var(--dw-control-height);
  padding: 0 0.58rem;
  border: 1px solid ${toneAlpha(LCARS.root, '62')};
  border-radius: 7px;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.text, 'ff') : 'rgba(230, 237, 243, 0.58)'};
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'rgba(4, 9, 14, 0.82)'};
  box-shadow: none;
  font: 900 0.75rem/1 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
  text-shadow: none;
  cursor: pointer;
  transition:
    color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease,
    text-shadow 140ms ease,
    transform 120ms ease;

  span {
    color: ${({ $active }) =>
      $active ? toneAlpha(LCARS.text, 'f0') : toneAlpha(LCARS.teal, 'c8')};
    font-size: 0.75rem;
    line-height: 1;
  }

  &:hover {
    color: ${toneAlpha(LCARS.text, 'f4')};
    background: rgba(76, 198, 193, 0.12);
  }

  &:focus-visible {
    outline: 2px solid ${toneAlpha(LCARS.root, 'b0')};
    outline-offset: -3px;
  }

  @media (min-width: 660px) {
    display: none;
  }
  border-left: 3px solid ${({ $active }) => $active ? 'var(--dw-cyan)' : 'transparent'};
  color: var(--dw-text);
  @media (pointer: coarse) { min-height: 44px; }
`;

export const ViewModeToggle = styled.div`
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 1px solid ${toneAlpha(LCARS.root, '62')};
  border-radius: 7px;
  background: var(--dw-surface-raised);
  box-shadow: none;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    z-index: 2;
    background: rgba(76, 198, 193, 0.72);
    pointer-events: none;
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-color: ${toneAlpha(LCARS.root, '46')};
    box-shadow: none;

    &::before {
      display: none;
    }
  }

  @media (min-width: 660px) {
    align-self: center;
    box-sizing: border-box;
    height: 34px;
    width: 15rem;
  }

  @media (min-width: 800px) {
    width: 16rem;
  }
  height: auto;
  min-height: var(--dw-control-height);
  @media (min-width: 660px) { height: auto; }
`;

export const ViewModeButton = styled.button`
  ${controlStyles}
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--dw-control-height);
  min-width: 70px;
  border: 0;
  border-right: 1px solid rgba(127, 215, 255, 0.26);
  border-radius: 0;
  padding: 0 0.42rem;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.text, 'ff') : 'rgba(230, 237, 243, 0.58)'};
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'transparent'};
  box-shadow: none;
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  text-shadow: none;
  cursor: pointer;
  transition:
    color 140ms ease,
    text-shadow 140ms ease,
    transform 120ms ease;

  &:hover {
    color: ${toneAlpha(LCARS.text, 'f2')};
    background: rgba(76, 198, 193, 0.12);
  }

  &:last-child {
    border-right: 0;
  }

  &:focus-visible {
    outline: 2px solid ${toneAlpha(LCARS.root, 'b0')};
    outline-offset: -3px;
  }

  @media (max-width: 560px) {
    min-width: 0;
    min-height: var(--dw-control-height);
    padding-inline: 0.28rem;
    font-size: 0.75rem;
    letter-spacing: normal;
  }

  @media (min-width: 660px) {
    min-width: clamp(3.25rem, 5.4vw, 4.2rem);
    min-height: var(--dw-control-height);
    padding-inline: 0.28rem;
    font-size: 0.75rem;
    letter-spacing: normal;
  }
  border-left: 3px solid ${({ $active }) => $active ? 'var(--dw-cyan)' : 'transparent'};
  color: var(--dw-text);
  @media (pointer: coarse) { min-height: 44px; }
`;


export const OrphanToggleButton = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, '9e') : toneAlpha(LCARS.root, '6e')};
  border-radius: 5px;
  min-height: var(--dw-control-height);
  padding: 0 0.72rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  color: ${({ $active }) => ($active ? '#d9fffa' : '#d7e4f1')};
  background: ${({ $active }) =>
    $active ? 'rgba(76, 198, 193, 0.08)' : 'transparent'};
  box-shadow: none;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease,
    transform 90ms ease;

  &:hover {
    border-color: ${({ $active }) =>
      $active ? toneAlpha(LCARS.lime, '88') : toneAlpha(LCARS.root, '9a')};
    color: ${({ $active }) => ($active ? '#edffd5' : '#eef5fc')};
    box-shadow: none;
  }

  &:active {
    transform: translateY(1px);
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const FilterToggleButton = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: var(--dw-control-height);
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, 'aa') : toneAlpha(LCARS.root, '72')};
  border-radius: 9px;
  padding: 0 0.78rem;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, 'f2') : toneAlpha(LCARS.root, 'e2')};
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'var(--dw-surface-raised)'};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    color 130ms ease,
    background 130ms ease,
    transform 90ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.teal, 'c2')};
    color: ${toneAlpha(LCARS.text, 'f4')};
    box-shadow: none;
  }

  &:active {
    transform: translateY(1px);
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const FilterCount = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.22rem;
  border-radius: var(--dw-radius);
  color: ${LCARS.bg};
  background: ${LCARS.lime};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0;
`;

export const FilterPanel = styled.div`
  display: grid;
  gap: 0.4rem;
  min-width: 0;
  max-height: ${({ $scrollable }) => ($scrollable ? 'min(58dvh, 520px)' : 'none')};
  padding: 0.5rem 0.08rem 0.06rem;
  border: 0;
  border-top: 1px solid ${toneAlpha(LCARS.teal, '32')};
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow-y: ${({ $scrollable }) => ($scrollable ? 'auto' : 'visible')};
  overscroll-behavior: contain;
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
  transition:
    opacity 140ms ease,
    visibility 0s linear ${({ $hidden }) => ($hidden ? '140ms' : '0s')};
`;

export const FinderModeRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.34rem;
`;

export const FinderModeButton = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.root, 'ac') : toneAlpha(LCARS.root, '42')};
  border-radius: 9px;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.root, 'f4') : '#b8cad8'};
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'rgba(7, 17, 27, 0.72)'};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
  text-shadow: none;

  &:hover {
    border-color: ${toneAlpha(LCARS.root, '9e')};
    color: ${toneAlpha(LCARS.text, 'f2')};
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const AdvancedFiltersToggle = styled.button`
  ${controlStyles}
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  min-width: 38px;
  min-height: var(--dw-control-height);
  flex: 0 0 38px;
  padding: 0;
  border: 1px solid ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, '92') : toneAlpha(LCARS.line, '72')};
  border-radius: 4px;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, 'f0') : toneAlpha(LCARS.textDim, 'cc')};
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'rgba(4, 10, 16, 0.52)'};
  box-shadow: none;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-align: center;
  text-transform: none;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${toneAlpha(LCARS.teal, 'bc')};
    color: ${toneAlpha(LCARS.text, 'f2')};
    box-shadow: none;
    outline: none;
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const AdvancedFiltersIcon = styled.span`
  display: inline-grid;
  place-items: center;
  width: 0.9rem;
  height: 0.9rem;
  border: 0;
  border-radius: 0;
  color: ${toneAlpha(LCARS.teal, 'ec')};
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1;
`;

export const AdvancedFilters = styled.div`
  display: grid;
  gap: 0.48rem;
  min-width: 0;
  padding: 0 0.38rem 0.38rem;
`;

export const SortControlRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: stretch;
`;

export const SortDirectionButton = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  min-width: 38px;
  min-height: var(--dw-control-height);
  align-self: end;
  border: 1px solid
    ${({ $descending }) =>
      $descending ? toneAlpha(LCARS.amber, 'b4') : toneAlpha(LCARS.root, '9a')};
  border-radius: 5px;
  color: ${({ $descending }) =>
    $descending ? toneAlpha(LCARS.amber, 'f4') : toneAlpha(LCARS.root, 'ec')};
  background: ${({ $descending }) =>
    $descending ? 'rgba(232, 177, 92, 0.08)' : 'rgba(127, 215, 255, 0.05)'};
  box-shadow: none;
  font-size: 1.18rem;
  font-weight: 650;
  line-height: 1;
  text-shadow: none;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    color 130ms ease,
    background 130ms ease,
    box-shadow 130ms ease,
    transform 90ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${({ $descending }) =>
      $descending ? toneAlpha(LCARS.amber, 'e0') : toneAlpha(LCARS.root, 'd0')};
    color: ${toneAlpha(LCARS.text, 'f2')};
    box-shadow: none;
  }

  &:active {
    transform: translateY(1px);
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const ControlGroup = styled.label`
  display: grid;
  min-width: 0;
  width: 100%;
  gap: 0.2rem;
  padding: 0.2rem 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;

  ${({ $active, $tone = LCARS.root }) =>
    $active &&
    css`
      color: ${toneAlpha($tone, 'f0')};
    `}

  button[aria-haspopup='listbox'] {
    display: flex;
    width: 100%;
    min-height: var(--dw-control-height);
    min-width: 0;
    gap: 0.3rem;
    border-radius: 5px;
    padding-inline: 0.48rem 0.38rem;
    background: var(--dw-surface-raised);
    box-shadow: none;

    > span:first-child {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > span:last-child {
      flex: 0 0 auto;
      margin-left: auto;
    }
  }
`;

export const ControlLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  color: ${toneAlpha(LCARS.root, 'cc')};
`;

const controlField = css`
  ${inputStyles}
  width: 100%;
`;

export const SearchInput = styled.input`
  ${controlField};

  &::placeholder {
    color: rgba(230, 237, 243, 0.56);
    font-size: 0.94em;
    letter-spacing: normal;
  }
`;

export const BoxLocatorScope = styled.div`
  min-width: 0;
  min-height: 56px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 34px;
  align-items: end;
  gap: 0.52rem;
  padding: 0.42rem 0.48rem;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.lime, 'a8') : toneAlpha(LCARS.line, '82')};
  border-radius: 9px;
  background: var(--dw-surface);
  box-shadow: none;

  ${({ $compact }) => $compact && css`
    grid-template-columns: auto 28px;
    gap: 0.12rem;
    min-height: var(--dw-control-height);
    padding: 0;
    border: 0;
    border-radius: 0;
    align-items: center;
    background: var(--dw-surface-raised);
    box-shadow: none;
  `}

  @media (max-width: 560px) {
    ${({ $compact }) => $compact
      ? css`
          grid-template-columns: auto 28px;
          min-height: var(--dw-control-height);
        `
      : css`
          grid-template-columns: auto minmax(0, 1fr) 34px;
          min-height: 52px;
        `}

    ${({ $compact }) => $compact && css`
      grid-template-columns: 1fr;
      min-height: var(--dw-control-height);
      gap: 0;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    `}
  }
  grid-template-columns: ${({ $compact }) => $compact ? 'auto auto' : 'auto minmax(0, 1fr) auto'};
  @media (max-width: 560px) { grid-template-columns: ${({ $compact }) => $compact ? 'minmax(0, 1fr) auto' : 'auto minmax(0, 1fr) auto'}; }
`;

export const BoxLocatorInputGroup = styled.label`
  display: grid;
  gap: 0.22rem;

  ${({ $compact }) => $compact && css`
    gap: 0;

    > ${ControlLabel} {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `}
`;

export const BoxLocatorInput = styled.input`
  ${controlField};
  width: 4.7rem;
  min-height: var(--dw-control-height);
  padding: 0.34rem 0.46rem;
  text-align: center;
  font-family: var(--dw-font-ui);
  font-size: 1.02rem;
  font-weight: 650;
  letter-spacing: normal;
  font-variant-numeric: tabular-nums;

  ${({ $compact }) => $compact && css`
    min-height: var(--dw-control-height);
    border-color: ${toneAlpha(LCARS.line, '64')};
    border-radius: 5px;
    background: var(--dw-surface-raised);
    box-shadow: none;

    &:focus {
      border-color: ${toneAlpha(LCARS.lime, 'b8')};
      box-shadow: none;
    }
  `}

  @media (max-width: 560px) {
    ${({ $compact }) => $compact && css`
      width: 4rem;
      max-width: 4rem;
      min-height: var(--dw-control-height);
      padding-block: 0.22rem;
      border: 0;
      border-bottom: 1px solid ${toneAlpha(LCARS.line, '88')};
      border-radius: 0;
      background: var(--dw-surface-raised);
      box-shadow: none;

      &:focus {
        border-bottom-color: ${toneAlpha(LCARS.lime, 'd0')};
        box-shadow: none;
      }
    `}
  }
  font-family: var(--dw-font-data);
`;

export const BoxLocatorReadout = styled.div`
  align-self: stretch;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.08rem;
  padding: 0.1rem 0 0.22rem;
  color: ${toneAlpha(LCARS.text, 'dc')};
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  overflow: hidden;

  ${({ $compact }) => $compact && css`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  `}

  span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: ${toneAlpha(LCARS.textDim, 'b0')};
    font-size: 0.75rem;
    letter-spacing: normal;
  }
`;

export const BoxLocatorClear = styled.button`
  ${controlStyles}
  align-self: end;
  width: 34px;
  min-width: 34px;
  height: 34px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: ${toneAlpha(LCARS.textDim, 'c4')};
  font-size: 1.05rem;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${toneAlpha(LCARS.lime, 'f0')};
    background: ${toneAlpha(LCARS.lime, '15')};
    outline: 1px solid ${toneAlpha(LCARS.lime, '70')};
  }
  flex: 0 0 auto;
  width: 40px; min-width: 40px; height: 40px; padding: 0;
  @media (pointer: coarse) { width: 44px; min-width: 44px; height: 44px; }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const PrimaryFinderRow = styled.div`
  display: grid;
  grid-template-columns: minmax(7.5rem, 1fr) auto auto;
  align-items: stretch;
  gap: 0.38rem;
  min-width: 0;

  @media (max-width: 720px) {
    grid-template-columns: minmax(6.5rem, 1fr) auto 40px;
    gap: 0.26rem;
  }

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.42rem;
  }
`;

export const UnifiedFinderWorkspace = styled.div`
  display: grid;
  gap: 0.18rem;
  min-width: 0;
  width: 100%;

  @media (max-width: 560px) {
    gap: 0;
  }
`;

export const PrimarySearchGroup = styled.label`
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: var(--dw-control-height);

  ${SearchInput} {
    min-height: var(--dw-control-height);
    border-color: ${toneAlpha(LCARS.line, '64')};
    border-radius: 0;
    background: var(--dw-surface-raised);
    box-shadow: none;

    &:focus {
      border-color: ${toneAlpha(LCARS.root, 'b8')};
      box-shadow: none;
    }
  }

  @media (max-width: 560px) {
    ${SearchInput} {
      min-height: var(--dw-control-height);
      border: 0;
      border-left: 3px solid ${toneAlpha(LCARS.teal, 'c0')};
      border-bottom: 1px solid ${toneAlpha(LCARS.line, '88')};
      border-radius: 0;
      background: var(--dw-surface-raised);
      box-shadow: none;

      &:focus {
        border-bottom-color: ${toneAlpha(LCARS.root, 'd0')};
        box-shadow: none;
      }
    }
  }
`;

export const FinderActionLabel = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

export const QuickCreateLaunchButton = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  min-width: 40px;
  min-height: var(--dw-control-height);
  border: 1px solid ${({ $active, $tone }) =>
    $active
      ? toneAlpha($tone === 'teal' ? LCARS.teal : LCARS.amber, 'b0')
      : toneAlpha($tone === 'teal' ? LCARS.root : LCARS.amber, '58')};
  border-radius: 2px 7px 2px 2px;
  padding: 0 0.68rem;
  color: ${({ $tone }) => toneAlpha($tone === 'teal' ? LCARS.root : LCARS.amber, 'f2')};
  background: ${({ $active, $tone }) => $active
    ? ($tone === 'teal' ? 'rgba(76, 198, 193, 0.14)' : 'rgba(93, 60, 17, 0.32)')
    : 'rgba(20, 18, 13, 0.38)'};
  font: 820 0.75rem/1 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;

  &::before {
    content: ${({ $symbol = '+' }) => JSON.stringify($symbol)};
    display: inline-block;
    font-size: 1.08em;
    font-weight: 650;
    line-height: 1;
  }

  &:hover,
  &:focus-visible {
    border-color: ${({ $tone }) => $tone === 'teal' ? LCARS.root : LCARS.amber};
    box-shadow: none;
    outline: none;
  }

  @media (max-width: 420px) {
    padding-inline: 0.52rem;
    font-size: 0.75rem;
  }

  @media (min-width: 660px) {
    min-height: var(--dw-control-height);
    padding-inline: 0.42rem;
    font-size: 0.75rem;
    letter-spacing: normal;
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const CompactFilterCount = styled.span`
  position: absolute;
  top: -0.22rem;
  right: -0.2rem;
  display: grid;
  place-items: center;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.18rem;
  border-radius: var(--dw-radius);
  color: ${LCARS.bg};
  background: ${LCARS.lime};
  font: 900 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0;
  box-shadow: none;
`;

export const AdvancedUtilityRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.38rem;
  padding-top: 0.1rem;
`;

export const LocatorWrap = styled.div`
  position: relative;
`;

export const LocatorDropdown = styled.div`
  position: fixed;
  z-index: 640;
  display: grid;
  gap: 0.2rem;
  padding: 0.36rem;
  border-radius: var(--dw-radius);
  border: 1px solid ${toneAlpha(LCARS.lime, '7a')};
  background: var(--dw-surface);
  box-shadow: none;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--dw-surface-raised);
  box-shadow: var(--dw-shadow);
`;

export const LocatorOption = styled.button`
  ${controlStyles}
  width: 100%;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.lime, '8f') : toneAlpha(LCARS.root, '6e')};
  border-radius: 9px;
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'var(--dw-surface-raised)'};
  color: ${toneAlpha(LCARS.text, 'f0')};
  display: grid;
  gap: 0.12rem;
  text-align: left;
  padding: 0.44rem 0.52rem;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    background 120ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.lime, '92')};
    background: var(--dw-surface);
    box-shadow: none;
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const LocatorOptionMain = styled.span`
  font-size: 0.8rem;
  font-weight: 650;
  letter-spacing: normal;
  color: ${toneAlpha(LCARS.text, 'ec')};
`;

export const LocatorOptionMeta = styled.span`
  font-size: 0.75rem;
  color: ${toneAlpha(LCARS.textDim, 'd0')};
`;

export const LocatorEmpty = styled.div`
  padding: 0.48rem 0.52rem;
  border-radius: 9px;
  border: 1px dashed ${toneAlpha(LCARS.line, 'cc')};
  color: ${toneAlpha(LCARS.textDim, 'd0')};
  font-size: 0.76rem;
`;

export const LocatorInspector = styled.section`
  margin-top: 0;
  border: 1px solid ${toneAlpha(LCARS.lime, '72')};
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  box-shadow: none;
  overflow: hidden;
`;

export const LocatorInspectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.46rem 0.55rem;
  border-bottom: 1px solid ${toneAlpha(LCARS.line, 'cc')};
`;

export const LocatorInspectorTitle = styled.div`
  min-width: 0;
`;

export const LocatorInspectorTitleLink = styled(Link)`
  color: ${toneAlpha(LCARS.lime, 'ef')};
  font-size: 0.8rem;
  font-weight: 650;
  letter-spacing: normal;
  text-decoration: none;

  &:hover {
    color: ${toneAlpha(LCARS.text, 'f2')};
    text-decoration: underline;
  }
`;

export const LocatorInspectorClear = styled.button`
  ${controlStyles}
  border: 1px solid ${toneAlpha(LCARS.root, '72')};
  border-radius: 8px;
  min-height: var(--dw-control-height);
  padding: 0.16rem 0.42rem;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  color: ${toneAlpha(LCARS.root, 'd8')};
  background: var(--dw-surface);
  box-shadow: none;
  cursor: pointer;

  &:hover {
    border-color: ${toneAlpha(LCARS.lime, '7a')};
    color: ${toneAlpha(LCARS.lime, 'e8')};
    box-shadow: none;
  }
  flex: 0 0 auto;
  width: auto;
  justify-self: start;
  @media (pointer: coarse) { min-height: 44px; }
`;

export const LocatorBreadcrumb = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
  align-items: center;
  padding: 0.32rem 0.55rem 0.4rem;
  border-bottom: 1px dashed ${toneAlpha(LCARS.line, 'b8')};
  font-size: 0.75rem;
`;

export const LocatorBreadcrumbLink = styled(Link)`
  color: ${toneAlpha(LCARS.textDim, 'dd')};
  text-decoration: none;

  &:hover {
    color: ${toneAlpha(LCARS.text, 'ef')};
    text-decoration: underline;
  }
`;

export const LocatorBreadcrumbCurrent = styled.span`
  color: ${toneAlpha(LCARS.lime, 'e8')};
  font-weight: 650;
`;

export const LocatorBreadcrumbSep = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'a0')};
`;

export const LocatorInspectorBody = styled.div`
  display: grid;
  gap: 0.3rem;
  padding: 0.5rem 0.55rem 0.55rem;
  max-height: min(320px, 42vh);
  overflow-y: auto;
`;

export const LocatorSection = styled.section`
  display: grid;
  gap: 0.26rem;
`;

export const LocatorSectionTitle = styled.h4`
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: normal;
  text-transform: none;
  color: ${toneAlpha(LCARS.textDim, 'd3')};
`;

export const LocatorList = styled.div`
  display: grid;
  gap: 0.2rem;
`;

export const LocatorRow = styled.div`
  border: 1px solid
    ${({ $kind = 'item' }) =>
      $kind === 'box'
        ? toneAlpha(LCARS.root, '68')
        : toneAlpha(LCARS.lime, '65')};
  border-radius: 8px;
  background: ${({ $kind = 'item' }) =>
    $kind === 'box'
      ? 'var(--dw-surface-raised)'
      : 'var(--dw-surface-raised)'};
`;

export const LocatorRowLink = styled(Link)`
  display: grid;
  gap: 0.1rem;
  text-decoration: none;
  padding: 0.34rem 0.45rem;
`;

export const LocatorRowTitle = styled.span`
  color: ${toneAlpha(LCARS.text, 'ef')};
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.2;
`;

export const LocatorRowMeta = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'cd')};
  font-size: 0.75rem;
  line-height: 1.2;
`;

export const LocatorEmptyBlock = styled.div`
  border: 1px dashed ${toneAlpha(LCARS.line, 'c6')};
  border-radius: 8px;
  color: ${toneAlpha(LCARS.textDim, 'd2')};
  font-size: 0.75rem;
  padding: 0.38rem 0.45rem;
`;

export const LocatorStatusText = styled.div`
  color: ${toneAlpha(LCARS.textDim, 'dc')};
  font-size: 0.75rem;
  padding: 0.24rem 0.1rem;
`;

export const LocatorNotes = styled.div`
  border: 1px solid ${toneAlpha(LCARS.line, 'cc')};
  border-radius: 8px;
  background: var(--dw-surface);
  color: ${toneAlpha(LCARS.text, 'e8')};
  font-size: 0.75rem;
  line-height: 1.45;
  padding: 0.36rem 0.45rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: min(120px, 24vh);
  overflow-y: auto;
`;

export const ControlHint = styled.span`
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.lime, 'ed') : toneAlpha(LCARS.textDim, 'cf')};
  font-size: 0.75rem;
  font-weight: ${({ $active }) => ($active ? 760 : 650)};
  letter-spacing: normal;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const QuickActionsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  min-width: 0;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const QuickActionButton = styled.button`
  ${controlStyles}
  min-width: 0;
  min-height: 40px;
  border-radius: 5px;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, 'cf') : toneAlpha(LCARS.root, '6b')};
  background: ${({ $active }) =>
    $active ? 'rgba(76, 198, 193, 0.08)' : 'transparent'};
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, 'f2') : toneAlpha(LCARS.root, 'da')};
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    background 130ms ease,
    transform 130ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.teal, 'aa')};
    box-shadow: none;
    transform: translateY(-1px);
  }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const QuickActionPanel = styled.div`
  ${panelBase};
  padding: 0.52rem;
  border-color: ${toneAlpha(LCARS.root, '58')};
  background: var(--dw-surface);
  min-width: 0;
`;

export const QuickOrphanInlinePanel = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  margin-top: 0.16rem;
  border-top: 1px solid ${toneAlpha(LCARS.amber, '64')};
  padding: 0.48rem 0.08rem 0.08rem;
  background: var(--dw-surface);
`;

export const QuickCaptureComposer = styled.section`
  display: grid;
  gap: 0.42rem;
  min-width: 0;
`;

export const QuickCaptureForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: end;
  min-width: 0;

  @media (max-width: 899px) {
    grid-template-columns: minmax(0, 1fr) auto;
  }
`;

export const QuickCaptureField = styled.label`
  display: grid;
  gap: 0.18rem;
  min-width: 0;
  color: ${toneAlpha(LCARS.textDim, 'd4')};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;

  &:first-child { grid-column: 1; }

  @media (max-width: 899px) {
    &:first-child { grid-column: 1 / -1; }
  }
`;

export const QuickCaptureInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid rgba(104, 154, 186, 0.78);
  border-radius: 3px 8px 3px 3px;
  padding: 0 0.58rem;
  color: ${toneAlpha(LCARS.text, 'f2')};
  background: var(--dw-surface-raised);
  font: 700 0.82rem var(--dw-font-ui);
  outline: none;

  &::placeholder { color: ${toneAlpha(LCARS.textDim, 'a0')}; }
  &:focus { border-color: ${toneAlpha(LCARS.teal, 'e8')}; box-shadow: none; }
  &:disabled { opacity: 0.58; cursor: not-allowed; }
`;

export const QuickCaptureActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.28rem;
  justify-content: flex-end;
  min-width: max-content;

  @media (max-width: 899px) {
    grid-column: 2;
    grid-row: 2;
  }
`;

export const QuickCaptureButton = styled.button`
  ${controlStyles}
  min-height: 40px;
  border: 1px solid ${({ $primary }) => ($primary ? toneAlpha(LCARS.amber, 'd8') : 'rgba(104, 154, 186, 0.69)')};
  border-radius: ${({ $primary }) => ($primary ? '3px 9px 3px 3px' : '3px')};
  padding: 0 0.62rem;
  color: ${({ $primary }) => ($primary ? toneAlpha(LCARS.amber, 'f2') : LCARS.text)};
  background: ${({ $primary }) => ($primary ? 'rgba(104, 63, 14, 0.28)' : 'rgba(18, 30, 42, 0.96)')};
  cursor: pointer;
  font: 800 0.75rem var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;

  &:hover:not(:disabled) {
    border-color: ${({ $primary }) => ($primary ? toneAlpha(LCARS.amber, 'f2') : toneAlpha(LCARS.teal, 'e0'))};
    background: ${({ $primary }) => ($primary ? 'rgba(104, 63, 14, 0.38)' : 'rgba(24, 45, 58, 0.98)')};
  }
  &:focus-visible { outline: 2px solid ${toneAlpha(LCARS.lilac, 'ee')}; outline-offset: 2px; }
  &:disabled { opacity: 0.48; cursor: not-allowed; }
  @media (pointer: coarse) { min-height: 44px; }
`;

export const QuickCaptureError = styled.div`
  color: #ffb2a7;
  font-size: 0.75rem;
  line-height: 1.3;
`;
