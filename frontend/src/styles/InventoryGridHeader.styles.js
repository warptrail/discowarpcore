import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';

const LCARS = {
  bg: '#090d13',
  panel: '#101821',
  panelAlt: '#162330',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  line: 'rgba(104, 154, 186, 0.34)',
  teal: '#4CC6C1',
  lilac: '#A7B6FF',
  amber: '#E8B15C',
  lime: '#9BE564',
  root: '#7FD7FF',
};

const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;

const panelBase = css`
  border: 1px solid ${LCARS.line};
  border-radius: 14px;
  box-shadow:
    inset 0 0 0 1px rgba(127, 215, 255, 0.08),
    0 12px 30px rgba(2, 9, 16, 0.55),
    0 0 16px rgba(76, 198, 193, 0.08);
`;

export const HeaderShell = styled.section`
  position: relative;
  z-index: 30;
  display: grid;
  gap: 0.38rem;
  min-width: 0;
  margin-bottom: -0.4rem;
`;

export const ControlConsole = styled.div`
  position: relative;
  display: grid;
  grid-template-areas:
    'utility utility'
    'map telemetry';
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.24rem 0.5rem;
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0.3rem 0.18rem 0.26rem;
  overflow: visible;
  border: 2px solid rgba(127, 215, 255, 0.48);
  border-radius: 14px 5px 14px 5px;
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.08), transparent 28%),
    rgba(7, 13, 19, 0.88);
  box-shadow:
    inset 5px 0 0 rgba(76, 198, 193, 0.68),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 18px rgba(2, 8, 13, 0.16);

  @media (min-width: 660px) {
    display: grid;
    grid-template-areas:
      'map utility spacer'
      'telemetry telemetry telemetry';
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    grid-template-rows: minmax(40px, auto) auto;
    align-items: center;
    gap: 0.18rem 0.36rem;
    padding: 0.28rem 0.42rem 0.34rem;
  }
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
  background: rgba(7, 13, 19, 0.985);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 16px 30px rgba(0, 0, 0, 0.58);
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
    gap: 0;
    width: auto;
    padding: 1px;
    overflow: hidden;
    border-color: ${toneAlpha(LCARS.line, 'b0')};
    border-radius: 3px;
    background: rgba(4, 10, 15, 0.66);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: none;
    transition: none;

    > button {
      width: auto;
      min-height: 38px;
      justify-content: center;
      border: 0;
      border-radius: 2px 0 0 2px;
      padding-inline: 0.32rem;
      font-size: 0.49rem;
      letter-spacing: 0.035em;
    }
  }

  @media (min-width: 800px) {
    > button {
      padding-inline: 0.42rem;
      font-size: 0.52rem;
      letter-spacing: 0.04em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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
    font-size: 0.56rem;
    letter-spacing: 0.055em;
    white-space: nowrap;
  }

  @media (min-width: 660px) {
    display: flex;
    align-items: stretch;
    gap: 0;

    button {
      width: auto;
      min-height: 38px;
      justify-content: center;
      padding-inline: 0.28rem;
      border: 0;
      border-left: 1px solid ${toneAlpha(LCARS.line, '8a')};
      border-radius: 0;
      font-size: 0.48rem;
      letter-spacing: 0.025em;
    }
  }

  @media (min-width: 800px) {
    button {
      padding-inline: 0.36rem;
      font-size: 0.52rem;
      letter-spacing: 0.04em;
    }
  }
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
  min-height: 28px;
`;

export const MinimizedChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-height: 28px;
  max-width: 100%;
  border: 1px solid ${toneAlpha(LCARS.teal, '72')};
  border-radius: 8px;
  padding: 0.18rem 0.48rem 0.18rem 0.34rem;
  color: ${toneAlpha(LCARS.text, 'e8')};
  background:
    linear-gradient(180deg, rgba(17, 48, 58, 0.92), rgba(8, 27, 35, 0.96)),
    ${LCARS.bg};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.66rem;
  font-weight: 820;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${toneAlpha(LCARS.root, 'd0')};
    color: ${toneAlpha(LCARS.root, 'ff')};
    box-shadow: 0 0 14px ${toneAlpha(LCARS.root, '22')};
  }
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
  background: rgba(9, 24, 38, 0.92);
  font-size: 0.86rem;
  line-height: 1;
`;

export const MinimizedCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  color: ${LCARS.bg};
  background: ${LCARS.amber};
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0;
`;

export const TitlePip = styled.span`
  width: 9px;
  height: 26px;
  border-radius: 8px;
  background: ${LCARS.teal};
  box-shadow: 0 0 0 2px ${toneAlpha(LCARS.teal, '2f')} inset;
`;

export const Title = styled.h2`
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(1.02rem, 2.3vw, 1.22rem);
  font-weight: 900;
  letter-spacing: 0.08em;
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
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  opacity: 0.72;
  pointer-events: none;
  white-space: nowrap;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(127, 215, 255, 0.18);

  @media (min-width: 660px) {
    grid-area: telemetry;
    justify-self: stretch;
    flex: 0 0 auto;
    flex-wrap: nowrap;
    min-height: 20px;
    gap: 0.12rem;
    width: 100%;
    padding: 0.1rem 0.48rem 0.12rem;
    border-top: 1px solid rgba(104, 154, 186, 0.34);
    border-left: 0;
    background: linear-gradient(90deg, transparent, rgba(20, 32, 40, 0.58));
    opacity: 0.58;
    font-size: clamp(0.68rem, 1.35vw, 0.96rem);
    letter-spacing: 0.055em;
  }

  @media (min-width: 800px) {
    gap: 0.16rem 0.34rem;
    padding-right: 0.48rem;
    letter-spacing: 0.065em;
  }
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
  min-height: 40px;
  margin: 0;

  @media (min-width: 660px) {
    display: flex;
    align-items: stretch;
    gap: 0.38rem;
    width: auto;
  }
`;

export const MapStatus = styled.span`
  grid-area: map;
  align-self: center;
  min-width: 0;
  padding-left: 0.18rem;
  color: rgba(167, 182, 255, 0.5);
  font: 850 0.5rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;

  @media (min-width: 660px) {
    flex: 0 0 auto;
    padding: 0 0.28rem 0 0;
    border-right: 1px solid ${toneAlpha(LCARS.line, '72')};
    font-size: 0.45rem;
    letter-spacing: 0.055em;
  }

  @media (min-width: 800px) {
    padding-right: 0.42rem;
    font-size: 0.5rem;
    letter-spacing: 0.08em;
  }
`;

export const MobileActionsButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.34rem;
  min-width: 5.35rem;
  min-height: 40px;
  padding: 0 0.58rem;
  border: 1px solid ${toneAlpha(LCARS.root, '62')};
  border-radius: 4px 10px 3px 3px;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.text, 'ff') : 'rgba(230, 237, 243, 0.58)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(76, 198, 193, 0.32), rgba(24, 63, 78, 0.72))'
      : 'rgba(4, 9, 14, 0.82)'};
  box-shadow: ${({ $active }) =>
    $active
      ? `inset 4px 0 0 ${LCARS.teal}, inset 0 1px 0 rgba(255, 255, 255, 0.14)`
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.045), inset 0 -6px 14px rgba(0, 0, 0, 0.2)'};
  font: 900 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: ${({ $active }) =>
    $active ? '0 0 9px rgba(127, 215, 255, 0.28)' : 'none'};
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
    font-size: 0.72rem;
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
`;

export const ViewModeToggle = styled.div`
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  width: 100%;
  padding: 0;
  border: 1px solid ${toneAlpha(LCARS.root, '62')};
  border-radius: 4px 10px 3px 3px;
  background: rgba(4, 9, 14, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    inset 0 -6px 14px rgba(0, 0, 0, 0.2);
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
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.035),
      inset 0 -5px 12px rgba(0, 0, 0, 0.28),
      0 0 10px ${toneAlpha(LCARS.root, '0c')};

    &::before {
      display: none;
    }
  }

  @media (min-width: 660px) {
    align-self: center;
    box-sizing: border-box;
    height: 36px;
    width: 6.45rem;
  }

  @media (min-width: 800px) {
    width: 7rem;
  }
`;

export const ViewModeButton = styled.button`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  min-width: 70px;
  border: 0;
  border-right: 1px solid rgba(127, 215, 255, 0.26);
  border-radius: 0;
  padding: 0 0.42rem;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.text, 'ff') : 'rgba(230, 237, 243, 0.58)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(76, 198, 193, 0.32), rgba(24, 63, 78, 0.72))'
      : 'transparent'};
  box-shadow: ${({ $active }) =>
    $active
      ? `inset 4px 0 0 ${LCARS.teal}, inset 0 1px 0 rgba(255, 255, 255, 0.14)`
      : 'none'};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: ${({ $active }) =>
    $active ? '0 0 9px rgba(127, 215, 255, 0.28)' : 'none'};
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
    min-height: 38px;
    padding-inline: 0.28rem;
    font-size: 0.54rem;
    letter-spacing: 0.055em;
  }

  @media (min-width: 660px) {
    min-width: clamp(3.25rem, 5.4vw, 4.2rem);
    min-height: 32px;
    padding-inline: 0.28rem;
    font-size: 0.54rem;
    letter-spacing: 0.055em;
  }
`;


export const OrphanToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, '9e') : toneAlpha(LCARS.root, '6e')};
  border-radius: 5px;
  min-height: 36px;
  padding: 0 0.72rem;
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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
    box-shadow:
      inset 0 0 0 1px
        ${({ $active }) =>
          $active ? toneAlpha(LCARS.lime, '2d') : toneAlpha(LCARS.root, '28')},
      0 0 12px
        ${({ $active }) =>
          $active ? toneAlpha(LCARS.lime, '1e') : toneAlpha(LCARS.root, '1b')};
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const FilterToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 32px;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.teal, 'aa') : toneAlpha(LCARS.root, '72')};
  border-radius: 9px;
  padding: 0 0.78rem;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, 'f2') : toneAlpha(LCARS.root, 'e2')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(18, 58, 62, 0.92), rgba(10, 36, 42, 0.96))'
      : 'linear-gradient(180deg, rgba(11, 24, 37, 0.94), rgba(8, 17, 28, 0.96))'};
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    color 130ms ease,
    background 130ms ease,
    transform 90ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.teal, 'c2')};
    color: ${toneAlpha(LCARS.text, 'f4')};
    box-shadow: 0 0 14px ${toneAlpha(LCARS.teal, '24')};
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const FilterCount = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.22rem;
  border-radius: 999px;
  color: ${LCARS.bg};
  background: ${LCARS.lime};
  font-size: 0.65rem;
  font-weight: 900;
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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.018);
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
  min-height: 38px;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.root, 'ac') : toneAlpha(LCARS.root, '42')};
  border-radius: 9px;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.root, 'f4') : '#b8cad8'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(21, 62, 86, 0.9), rgba(10, 34, 52, 0.94))'
      : 'rgba(7, 17, 27, 0.72)'};
  font-size: 0.66rem;
  font-weight: 820;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  text-shadow: 0 0 6px rgba(127, 215, 255, 0.12);

  &:hover {
    border-color: ${toneAlpha(LCARS.root, '9e')};
    color: ${toneAlpha(LCARS.text, 'f2')};
  }
`;

export const AdvancedFiltersToggle = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  min-width: 38px;
  min-height: 38px;
  flex: 0 0 38px;
  padding: 0;
  border: 1px solid ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, '92') : toneAlpha(LCARS.line, '72')};
  border-radius: 4px;
  color: ${({ $active }) =>
    $active ? toneAlpha(LCARS.teal, 'f0') : toneAlpha(LCARS.textDim, 'cc')};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(25, 78, 78, 0.58), rgba(8, 33, 39, 0.72))'
      : 'rgba(4, 10, 16, 0.52)'};
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  font-size: 0.54rem;
  font-weight: 780;
  letter-spacing: 0.07em;
  text-align: center;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${toneAlpha(LCARS.teal, 'bc')};
    color: ${toneAlpha(LCARS.text, 'f2')};
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 0 10px ${toneAlpha(LCARS.teal, '18')};
    outline: none;
  }
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
  font-weight: 760;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  min-width: 38px;
  min-height: 34px;
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
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 10px currentColor;
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
    box-shadow:
      0 0 0 2px
        ${({ $descending }) =>
          $descending ? toneAlpha(LCARS.amber, '24') : toneAlpha(LCARS.root, '2f')},
      0 0 14px
        ${({ $descending }) =>
          $descending ? toneAlpha(LCARS.amber, '2e') : toneAlpha(LCARS.root, '30')};
  }

  &:active {
    transform: translateY(1px);
  }
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
    min-height: 36px;
    min-width: 0;
    gap: 0.3rem;
    border-radius: 5px;
    padding-inline: 0.48rem 0.38rem;
    background: rgba(4, 10, 16, 0.52);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);

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
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${toneAlpha(LCARS.root, 'cc')};
`;

const controlField = css`
  width: 100%;
  min-width: 0;
  max-width: 100%;
  border: 1px solid rgba(108, 156, 188, 0.5);
  border-radius: 9px;
  background: linear-gradient(180deg, rgba(6, 12, 19, 0.98), rgba(8, 15, 23, 0.98));
  color: ${toneAlpha(LCARS.text, 'f3')};
  min-height: 34px;
  padding: 0.46rem 0.62rem;
  font-size: 0.86rem;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(125, 185, 220, 0.08);
  transition:
    border-color 130ms ease,
    box-shadow 130ms ease,
    background 130ms ease;

  &:focus {
    border-color: ${toneAlpha(LCARS.root, 'd0')};
    box-shadow:
      0 0 0 2px ${toneAlpha(LCARS.root, '2f')},
      0 0 14px ${toneAlpha(LCARS.root, '30')};
    background: ${LCARS.panelAlt};
  }
`;

export const SearchInput = styled.input`
  ${controlField};
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
  background:
    linear-gradient(
      92deg,
      ${({ $active }) =>
        $active ? toneAlpha(LCARS.lime, '20') : toneAlpha(LCARS.root, '10')},
      transparent 58%
    ),
    ${LCARS.panel};
  box-shadow: ${({ $active }) =>
    $active
      ? `inset 0 0 0 1px ${toneAlpha(LCARS.lime, '24')}, 0 0 16px ${toneAlpha(LCARS.lime, '18')}`
      : `inset 0 0 0 1px ${toneAlpha(LCARS.root, '16')}`};

  ${({ $compact, $active }) => $compact && css`
    grid-template-columns: auto 28px;
    gap: 0.12rem;
    min-height: 38px;
    padding: 0;
    border: 0;
    border-radius: 0;
    align-items: center;
    background: ${$active
      ? `linear-gradient(90deg, ${toneAlpha(LCARS.lime, '12')}, transparent 82%)`
      : 'transparent'};
    box-shadow: ${$active ? `0 0 12px ${toneAlpha(LCARS.lime, '12')}` : 'none'};
  `}

  @media (max-width: 560px) {
    ${({ $compact }) => $compact
      ? css`
          grid-template-columns: auto 28px;
          min-height: 38px;
        `
      : css`
          grid-template-columns: auto minmax(0, 1fr) 34px;
          min-height: 52px;
        `}
  }
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
  min-height: 32px;
  padding: 0.34rem 0.46rem;
  text-align: center;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 1.02rem;
  font-weight: 760;
  letter-spacing: 0.18em;
  font-variant-numeric: tabular-nums;

  ${({ $compact }) => $compact && css`
    min-height: 38px;
    border-color: ${toneAlpha(LCARS.line, '64')};
    border-radius: 5px;
    background: rgba(4, 10, 16, 0.52);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);

    &:focus {
      border-color: ${toneAlpha(LCARS.lime, 'b8')};
      box-shadow:
        0 0 0 1px ${toneAlpha(LCARS.lime, '28')},
        0 0 12px ${toneAlpha(LCARS.lime, '1d')};
    }
  `}
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
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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
    font-size: 0.56rem;
    letter-spacing: 0.08em;
  }
`;

export const BoxLocatorClear = styled.button`
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
`;

export const UnifiedFinderWorkspace = styled.div`
  display: grid;
  gap: 0.38rem;
  min-width: 0;
  width: 100%;
`;

export const PrimarySearchGroup = styled.label`
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 38px;

  ${SearchInput} {
    min-height: 38px;
    border-color: ${toneAlpha(LCARS.line, '64')};
    border-radius: 5px;
    background: rgba(4, 10, 16, 0.52);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);

    &:focus {
      border-color: ${toneAlpha(LCARS.root, 'b8')};
      box-shadow:
        0 0 0 1px ${toneAlpha(LCARS.root, '28')},
        0 0 12px ${toneAlpha(LCARS.root, '1d')};
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  min-width: 40px;
  min-height: 38px;
  border: 1px solid ${({ $active }) =>
    $active ? toneAlpha(LCARS.amber, 'b0') : toneAlpha(LCARS.amber, '58')};
  border-radius: 2px 7px 2px 2px;
  padding: 0 0.68rem;
  color: ${toneAlpha(LCARS.amber, 'f2')};
  background: ${({ $active }) => $active
    ? 'rgba(93, 60, 17, 0.32)'
    : 'rgba(20, 18, 13, 0.38)'};
  font: 820 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${LCARS.amber};
    box-shadow: 0 0 12px ${toneAlpha(LCARS.amber, '20')};
    outline: none;
  }

  @media (max-width: 420px) {
    padding-inline: 0.52rem;
    font-size: 0.58rem;
  }

  @media (min-width: 660px) {
    min-height: 38px;
    padding-inline: 0.42rem;
    font-size: 0.54rem;
    letter-spacing: 0.055em;
  }
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
  border-radius: 999px;
  color: ${LCARS.bg};
  background: ${LCARS.lime};
  font: 900 0.56rem/1 ui-monospace, monospace;
  letter-spacing: 0;
  box-shadow: 0 0 8px ${toneAlpha(LCARS.lime, '32')};
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
  border-radius: 11px;
  border: 1px solid ${toneAlpha(LCARS.lime, '7a')};
  background: linear-gradient(180deg, rgba(9, 16, 24, 0.99), rgba(8, 14, 20, 0.99));
  box-shadow:
    0 18px 30px rgba(2, 9, 16, 0.7),
    0 0 0 1px ${toneAlpha(LCARS.lime, '1f')} inset;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const LocatorOption = styled.button`
  width: 100%;
  border: 1px solid
    ${({ $active }) =>
      $active ? toneAlpha(LCARS.lime, '8f') : toneAlpha(LCARS.root, '6e')};
  border-radius: 9px;
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(88, 132, 44, 0.24), rgba(57, 91, 27, 0.2))'
      : 'linear-gradient(180deg, rgba(15, 30, 45, 0.94), rgba(9, 18, 29, 0.96))'};
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
    background: linear-gradient(
      180deg,
      rgba(106, 157, 54, 0.24),
      rgba(65, 102, 34, 0.22)
    );
    box-shadow:
      0 0 0 1px ${toneAlpha(LCARS.lime, '2f')} inset,
      0 0 14px ${toneAlpha(LCARS.lime, '24')};
  }
`;

export const LocatorOptionMain = styled.span`
  font-size: 0.8rem;
  font-weight: 760;
  letter-spacing: 0.02em;
  color: ${toneAlpha(LCARS.text, 'ec')};
`;

export const LocatorOptionMeta = styled.span`
  font-size: 0.7rem;
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
  border-radius: 11px;
  background:
    linear-gradient(
      100deg,
      ${toneAlpha(LCARS.lime, '17')} 0%,
      transparent 52%
    ),
    linear-gradient(180deg, rgba(8, 16, 23, 0.98), rgba(8, 14, 21, 0.98));
  box-shadow:
    inset 0 0 0 1px ${toneAlpha(LCARS.lime, '1f')},
    0 12px 22px rgba(2, 9, 16, 0.6);
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
  font-weight: 780;
  letter-spacing: 0.02em;
  text-decoration: none;

  &:hover {
    color: ${toneAlpha(LCARS.text, 'f2')};
    text-decoration: underline;
  }
`;

export const LocatorInspectorClear = styled.button`
  border: 1px solid ${toneAlpha(LCARS.root, '72')};
  border-radius: 8px;
  min-height: 24px;
  padding: 0.16rem 0.42rem;
  font-size: 0.66rem;
  font-weight: 740;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${toneAlpha(LCARS.root, 'd8')};
  background: linear-gradient(180deg, rgba(11, 25, 37, 0.95), rgba(8, 17, 27, 0.95));
  box-shadow: inset 0 0 0 1px ${toneAlpha(LCARS.root, '22')};
  cursor: pointer;

  &:hover {
    border-color: ${toneAlpha(LCARS.lime, '7a')};
    color: ${toneAlpha(LCARS.lime, 'e8')};
    box-shadow:
      inset 0 0 0 1px ${toneAlpha(LCARS.lime, '26')},
      0 0 12px ${toneAlpha(LCARS.lime, '28')};
  }
`;

export const LocatorBreadcrumb = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
  align-items: center;
  padding: 0.32rem 0.55rem 0.4rem;
  border-bottom: 1px dashed ${toneAlpha(LCARS.line, 'b8')};
  font-size: 0.7rem;
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
  font-weight: 720;
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
  font-size: 0.64rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
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
      ? 'linear-gradient(180deg, rgba(16, 33, 48, 0.92), rgba(10, 19, 27, 0.92))'
      : 'linear-gradient(180deg, rgba(15, 30, 17, 0.92), rgba(10, 19, 12, 0.92))'};
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
  font-weight: 710;
  line-height: 1.2;
`;

export const LocatorRowMeta = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'cd')};
  font-size: 0.67rem;
  line-height: 1.2;
`;

export const LocatorEmptyBlock = styled.div`
  border: 1px dashed ${toneAlpha(LCARS.line, 'c6')};
  border-radius: 8px;
  color: ${toneAlpha(LCARS.textDim, 'd2')};
  font-size: 0.74rem;
  padding: 0.38rem 0.45rem;
`;

export const LocatorStatusText = styled.div`
  color: ${toneAlpha(LCARS.textDim, 'dc')};
  font-size: 0.74rem;
  padding: 0.24rem 0.1rem;
`;

export const LocatorNotes = styled.div`
  border: 1px solid ${toneAlpha(LCARS.line, 'cc')};
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(12, 25, 34, 0.94), rgba(8, 18, 24, 0.94));
  color: ${toneAlpha(LCARS.text, 'e8')};
  font-size: 0.73rem;
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
  font-size: 0.68rem;
  font-weight: ${({ $active }) => ($active ? 760 : 650)};
  letter-spacing: 0.03em;
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
  font-weight: 780;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    background 130ms ease,
    transform 130ms ease;

  &:hover {
    border-color: ${toneAlpha(LCARS.teal, 'aa')};
    box-shadow: 0 0 12px ${toneAlpha(LCARS.teal, '2e')};
    transform: translateY(-1px);
  }
`;

export const QuickActionPanel = styled.div`
  ${panelBase};
  padding: 0.52rem;
  border-color: ${toneAlpha(LCARS.root, '58')};
  background:
    radial-gradient(circle at 95% 8%, ${toneAlpha(LCARS.lilac, '22')} 0%, transparent 44%),
    linear-gradient(180deg, #0f1822 0%, #0a121a 100%);
  min-width: 0;
`;

export const QuickOrphanInlinePanel = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  margin-top: 0.16rem;
  border-top: 1px solid ${toneAlpha(LCARS.amber, '64')};
  padding: 0.48rem 0.08rem 0.08rem;
  background: linear-gradient(90deg, rgba(232, 177, 92, 0.08), transparent 58%);
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
  font-size: 0.56rem;
  font-weight: 780;
  letter-spacing: 0.09em;
  text-transform: uppercase;

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
  background: rgba(4, 10, 15, 0.88);
  font: 700 0.82rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  outline: none;

  &::placeholder { color: ${toneAlpha(LCARS.textDim, 'a0')}; }
  &:focus { border-color: ${toneAlpha(LCARS.teal, 'e8')}; box-shadow: 0 0 0 2px ${toneAlpha(LCARS.teal, '24')}; }
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
  min-height: 40px;
  border: 1px solid ${({ $primary }) => ($primary ? toneAlpha(LCARS.amber, 'd8') : 'rgba(104, 154, 186, 0.69)')};
  border-radius: ${({ $primary }) => ($primary ? '3px 9px 3px 3px' : '3px')};
  padding: 0 0.62rem;
  color: ${({ $primary }) => ($primary ? toneAlpha(LCARS.amber, 'f2') : LCARS.text)};
  background: ${({ $primary }) => ($primary ? 'rgba(104, 63, 14, 0.28)' : 'rgba(18, 30, 42, 0.96)')};
  cursor: pointer;
  font: 800 0.6rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    border-color: ${({ $primary }) => ($primary ? toneAlpha(LCARS.amber, 'f2') : toneAlpha(LCARS.teal, 'e0'))};
    background: ${({ $primary }) => ($primary ? 'rgba(104, 63, 14, 0.38)' : 'rgba(24, 45, 58, 0.98)')};
  }
  &:focus-visible { outline: 2px solid ${toneAlpha(LCARS.lilac, 'ee')}; outline-offset: 2px; }
  &:disabled { opacity: 0.48; cursor: not-allowed; }
`;

export const QuickCaptureError = styled.div`
  color: #ffb2a7;
  font-size: 0.68rem;
  line-height: 1.3;
`;
