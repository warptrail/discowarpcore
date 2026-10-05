import { controlStyles } from './primitives';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from './tokens';

const LCARS = {
  panel: 'var(--dw-surface)',
  panelSoft: 'var(--dw-surface-raised)',
  line: 'rgba(230, 237, 243, 0.1)',
  text: 'var(--dw-text)',
  textDim: 'var(--dw-text-secondary)',
  textMuted: 'var(--dw-text-muted)',
  teal: 'var(--dw-teal)',
  coral: 'var(--dw-coral)',
  amber: 'var(--dw-amber)',
  green: '#54d097',
  lilac: '#a097ff',
};

const uiFont = 'var(--dw-font-ui)';

export const Page = styled.section`
  display: grid;
  gap: 0.8rem;
  padding: 0.2rem 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.58rem;
    padding: 0.05rem 0;
  }
`;

export const RetrievalReturnButton = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 42px;
  width: 100%;
  border: 1px solid rgba(76, 198, 193, 0.3);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: rgba(225, 250, 248, 0.92);
  font: 760 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: rgba(var(--box-primary-rgb, 76, 198, 193), 0.2);
    box-shadow: none;
  }

  &:active {
    transform: translateY(1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: var(--dw-control-height);
    font-size: 0.75rem;
  }
`;

export const PageMainGrid = styled.div`
  display: grid;
  gap: 0.8rem;
  min-width: 0;

  @media (min-width: 980px) {
    grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.42fr);
    align-items: start;
    height: auto;
    min-height: 0;
    gap: clamp(1rem, 2vw, 1.6rem);
  }
`;

const terminalScrollbar = css`
  scrollbar-width: thin;
  scrollbar-color: var(--item-accent, #7fd7ff) #080e14;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #080e14;
    border-left: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.18);
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.65);
    border: 2px solid #080e14;
    border-radius: var(--dw-radius-sm);
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--item-accent, #7fd7ff);
  }
  &::-webkit-scrollbar-corner {
    background: #080e14;
  }
`;

export const PageVisualColumn = styled.div`
  ${terminalScrollbar}
  grid-auto-rows: max-content;
  @media (min-width: 980px) {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }
  display: grid;
  align-content: start;
  gap: 0.72rem;
  min-width: 0;
`;

export const PageDataColumn = styled.div`
  ${terminalScrollbar}
  min-width: 0;

  @media (min-width: 980px) {
    min-height: 0;
    height: 100%;
    overscroll-behavior: contain;
    overflow: auto;
    scrollbar-width: thin;
  }
`;

export const ViewModeNav = styled.nav`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  overflow: hidden;
  border: 1px solid ${LCARS.line};
  border-radius: var(--dw-radius-sm);
  background: ${LCARS.panel};
`;

export const ViewModeButton = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  padding: 0 0.34rem;
  border: 0;
  border-right: 1px solid rgba(var(--item-secondary-rgb, 167, 182, 255), 0.2);
  color: ${({ $active }) => ($active ? '#effbff' : 'rgba(214, 226, 241, 0.64)')};
  background: ${({ $active }) => ($active ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.16)' : 'transparent')};
  font: 760 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;

  &:last-child { border-right: 0; }
  &:hover, &:focus-visible { outline: 2px solid var(--dw-cyan);
    outline-offset: 2px; color: #ffffff; background: rgba(var(--item-secondary-rgb, 167, 182, 255), 0.18); }
  &:focus-visible { box-shadow: inset 0 0 0 1px var(--item-secondary, #a7b6ff); }
`;

export const BreadcrumbNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
  padding: 0.66rem 0.8rem;
  border: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.34);
  border-radius: var(--dw-radius);
  background: ${LCARS.panelSoft};

  ${({ $compact }) => $compact && `
    gap: 0.2rem;
    padding: 0;
    border: 0;
    background: transparent;

    & > a,
    & > span {
      gap: 0.18rem;
      padding: 0.08rem 0.14rem;
      border: 0;
      border-radius: var(--dw-radius-sm);
      background: transparent;
      font-size: 0.75rem;
    }
  `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    ${({ $compact }) => ($compact ? `
      gap: 0.2rem;
      padding: 0;
      border-radius: 0;
    ` : `
      gap: 0.26rem;
      padding: 0.45rem 0.52rem;
      border-radius: var(--dw-radius);
    `)}
  }
`;

const crumbBase = `
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
  padding: 0.26rem 0.42rem;
  border-radius: var(--dw-radius-sm);
  border: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.25);
  background: rgba(var(--box-primary-rgb, 76, 198, 193), 0.035);
  font-size: 0.82rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
    padding: 0.2rem 0.34rem;
    border-radius: var(--dw-radius);
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const BreadcrumbLink = styled(Link)`
  ${crumbBase}
  color: ${LCARS.text};
  text-decoration: none;
  transition: border-color 120ms ease, transform 120ms ease;

  &:hover {
    border-color: rgba(var(--box-primary-rgb, 76, 198, 193), 0.72);
    transform: translateY(-1px);
  }
`;

export const BreadcrumbCurrent = styled.span`
  ${crumbBase}
  color: ${LCARS.textDim};
  border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.46);
  background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.08);
`;

export const BreadcrumbText = styled.span`
  ${crumbBase}
  color: ${LCARS.textDim};
`;

export const CrumbId = styled.span`
  font-family: var(--dw-font-data);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--box-neon, ${LCARS.textDim});
  border: 0;
  border-radius: 0;
  padding: 0.08rem 0.28rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
    padding: 0.06rem 0.2rem;
    border-radius: var(--dw-radius);
  }
`;

export const CrumbLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(38vw, 320px);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: min(50vw, 190px);
  }
`;

export const CrumbSep = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.88rem;
  user-select: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const TitleBar = styled.header`
  display: grid;
  gap: 0.25rem;
  padding: 0.18rem 0.06rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.18rem;
    padding: 0.06rem 0.02rem;
  }
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.6rem;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.42rem;
    flex-wrap: wrap;
  }
`;

export const TitleInfo = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

export const Title = styled.h2`
  margin: 0;
  color: ${LCARS.text};
  font-size: clamp(1.14rem, 2vw, 1.36rem);
  line-height: 1.22;
  letter-spacing: 0.01em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 1rem;
    line-height: 1.18;
  }
`;

export const Meta = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.75rem;
  font-weight: 640;
  letter-spacing: 0.01em;
  text-transform: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
  }
`;

export const StateCard = styled.div`
  border: 1px solid ${({ $tone }) => ($tone === 'error' ? '#a84a4a' : LCARS.line)};
  border-radius: var(--dw-radius);
  padding: 0.86rem 0.92rem;
  color: ${({ $tone }) => ($tone === 'error' ? '#ffc8c8' : LCARS.text)};
  background: ${({ $tone }) =>
    $tone === 'error' ? 'rgba(240, 138, 123, 0.16)' : LCARS.panel};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: 0.62rem 0.68rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const DepartureAlert = styled.section`
  display: grid;
  gap: 0.5rem;
  padding: 0.62rem 0.68rem;
  border: 1px solid rgba(240, 138, 123, 0.36);
  border-left: 3px solid var(--dw-coral);
  border-radius: var(--dw-radius-sm);
  color: var(--dw-text);
  background: var(--dw-surface);
`;

export const DepartureAlertHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.7rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: grid;
    gap: 0.36rem;
  }
`;

export const DepartureAlertHeading = styled.span`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

export const DepartureAlertKicker = styled.span`
  color: ${({ $urgent }) => ($urgent ? '#ffb08e' : '#ffd36a')};
  font: 760 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
`;

export const DepartureAlertTitle = styled.strong`
  color: #fff7ec;
  font-size: 0.9rem;
  line-height: 1.18;
`;

export const DepartureAlertStatus = styled.span`
  flex: 0 0 auto;
  padding: 0.28rem 0.38rem;
  border: 1px solid rgba(255, 101, 91, 0.6);
  border-radius: var(--dw-radius-sm);
  color: #ffd0cb;
  background: rgba(255, 69, 58, 0.12);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: fit-content;
  }
`;

export const DepartureAlertDetail = styled.span`
  color: rgba(255, 239, 218, 0.78);
  font-size: 0.75rem;
  line-height: 1.4;
`;

export const DepartureAlertMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(255, 173, 159, 0.16);
  border-bottom: 1px solid rgba(255, 173, 159, 0.16);

  > span {
    display: grid;
    gap: 0.16rem;
    min-width: 0;
    padding: 0.4rem 0.48rem;
    color: rgba(255, 239, 232, 0.8);
    font-size: 0.75rem;
    line-height: 1.2;
  }

  > span + span {
    border-left: 1px solid rgba(255, 173, 159, 0.16);
  }

  b {
    color: var(--dw-text-secondary);
    font: 760 0.75rem/1 ${uiFont};
    letter-spacing: 0.01em;
    text-transform: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;

    > span {
      grid-template-columns: 76px minmax(0, 1fr);
      align-items: baseline;
      padding: 0.28rem 0.34rem;
    }

    > span + span {
      border-left: 0;
      border-top: 1px solid rgba(255, 173, 159, 0.1);
    }
  }
`;

export const DepartureAlertActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.34rem;
  flex-wrap: wrap;
`;

export const DepartureInlineToggle = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: var(--dw-control-height);
  padding: 0.28rem 0.5rem;
  border: 1px solid rgba(255, 151, 128, 0.76);
  border-radius: var(--dw-radius-sm);
  color: #fff1ec;
  background: rgba(255, 101, 91, 0.15);
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;

  span {
    color: #ffab98;
    font-size: 0.82rem;
  }

  &:hover:enabled,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: #ffad99;
    background: rgba(255, 101, 91, 0.23);
  }

  &:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }
`;

export const DepartureAlertLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0.28rem 0.5rem;
  border: 1px solid rgba(255, 151, 128, 0.54);
  border-radius: var(--dw-radius-sm);
  color: #ffd2c7;
  background: rgba(255, 101, 91, 0.08);
  font: 760 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-decoration: none;
  text-transform: none;

  &:hover,
  &:focus-visible {
    color: #ffffff;
    border-color: #ff9b83;
    text-decoration: none;
  }
`;

export const DepartureLifecycleButton = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  padding: 0.28rem 0.5rem;
  border: 1px solid ${({ $quiet }) => ($quiet
    ? 'rgba(213, 226, 234, 0.22)'
    : 'rgba(255, 101, 91, 0.72)')};
  border-radius: var(--dw-radius-sm);
  color: ${({ $quiet }) => ($quiet ? 'rgba(225, 233, 238, 0.64)' : '#fff0ed')};
  background: ${({ $quiet }) => ($quiet ? 'transparent' : 'rgba(255, 69, 58, 0.18)')};
  font: 700 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;

  &:hover:enabled,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: #ff9b83;
    color: #ffffff;
    background: rgba(255, 69, 58, 0.24);
  }

  &:disabled {
    opacity: 0.48;
    cursor: wait;
  }
`;

export const DepartureDestinationPanel = styled.section`
  display: grid;
  gap: 0.22rem;
  padding: 0.48rem;
  border-top: 1px solid rgba(255, 173, 159, 0.24);
  background: var(--dw-surface);
`;

export const DepartureDestinationHeader = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.65rem;
  color: #ffd0c7;
  font: 700 0.75rem/1.15 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;

  small {
    color: var(--dw-text-secondary);
    font: 620 0.75rem/1.25 ${uiFont};
    letter-spacing: 0.01em;
    text-transform: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: grid;
    gap: 0.18rem;
  }
`;

export const ContainerMuted = styled.span`
  color: ${LCARS.textMuted};
`;

export const ContainerActions = styled.div`
  display: flex;
  gap: 0.24rem;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    ${({ $paired }) =>
      $paired &&
      css`
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));

        > button {
          width: 100%;
          min-width: 0;
        }
      `}
  }
`;

export const ItemButtonBar = styled.section`
  display: grid;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.16);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: var(--dw-radius);
  }
`;

export const ItemControlsToggle = styled.button`
  ${controlStyles}
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  width: 100%;
  min-height: var(--dw-control-height);
  padding: 0.28rem 0.44rem;
  border: 0;
  background: var(--dw-surface);
  color: ${LCARS.text};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--dw-surface-raised);
  }

  &:focus-visible {
    outline: 2px solid var(--item-accent, #7fd7ff);
    outline-offset: -2px;
  }
`;

export const ItemControlsToggleCopy = styled.span`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.34rem;
  min-width: 0;
`;

export const ItemControlsKicker = styled.span`
  color: var(--item-accent, #7fd7ff);
  font: 700 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const ItemControlsSummary = styled.span`
  color: var(--dw-text-secondary);
  font: 680 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const ItemControlsChevron = styled.span`
  color: var(--item-secondary, #a7b6ff);
  font-size: 0.82rem;
  line-height: 1;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform 180ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ItemControlsPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.1);
  background: var(--dw-surface-raised);

  > *:last-child {
    border-right: 0;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: ${({ $editing }) => ($editing ? '1fr' : 'repeat(2, minmax(0, 1fr))')};
  }
`;

export const DeclutterControlGroup = styled.section`
  grid-column: 1 / -1;
  padding: 0.24rem 0.3rem;
  border-bottom: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.16);
  background: transparent;
`;

export const DeclutterControlButton = styled.button`
  ${controlStyles}
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  min-height: var(--dw-control-height);
  padding: 0.18rem 0.34rem;
  border: 1px solid ${({ $active, $gone }) =>
    $gone
      ? 'rgba(255, 94, 94, 0.9)'
      : $active
      ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.7)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.68)'};
  border-radius: var(--dw-radius-sm);
  background: ${({ $active, $gone }) =>
    $gone
      ? 'rgba(240, 138, 123, 0.14)'
      : $active
      ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.13)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.09)'};
  color: ${({ $gone }) => ($gone ? '#ffe7e7' : '#eef8ff')};
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;

  &:hover:enabled {
    border-color: ${({ $active }) =>
      $active ? 'var(--item-secondary, #a7b6ff)' : 'var(--item-accent, #7fd7ff)'};
    background: ${({ $active }) =>
      $active
        ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.19)'
        : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.15)'};
    box-shadow: none;
  }

  &:focus-visible {
    outline: 1px solid ${({ $active }) =>
      $active ? 'var(--item-secondary, #a7b6ff)' : 'var(--item-accent, #7fd7ff)'};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: ${({ $gone }) => ($gone ? 1 : 0.58)};
    cursor: ${({ $gone }) => ($gone ? 'not-allowed' : 'wait')};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const DeclutterControlContext = styled.span`
  color: ${({ $gone }) => ($gone ? 'rgba(255, 204, 204, 0.72)' : 'rgba(210, 228, 237, 0.5)')};
  font: 760 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const DeclutterControlTitle = styled.strong`
  min-width: 0;
  color: inherit;
  font: 780 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const DeclutterControlState = styled.span`
  color: ${({ $gone }) => ($gone ? '#ff9c9c' : 'var(--item-accent, #7fd7ff)')};
  font: 700 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const ControlGroup = styled.section`
  display: grid;
  align-content: start;
  gap: 0.22rem;
  min-width: 0;
  padding: 0.3rem;
  border-right: 0;

  ${({ $wide, $activity }) => ($wide || $activity) && 'grid-column: 1 / -1;'}
  ${({ $full }) => $full && 'grid-column: 1 / -1; border-right: 0;'}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    align-items: stretch;
    gap: 0.22rem;
    padding: 0.28rem 0.24rem;
    border-right: 0;
    border-bottom: 0;

    ${({ $wide }) => $wide && 'grid-column: auto;'}
    ${({ $full }) => $full && 'grid-column: 1 / -1; border-right: 0;'}
    ${({ $activity }) => $activity && `
      grid-column: 1 / -1;
      border-right: 0;
      border-bottom: 1px solid rgba(214, 226, 241, 0.08);
    `}
  }
`;

export const ControlGroupLabel = styled.span`
  color: var(--dw-text-secondary);
  font: 760 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const DepartureActivity = styled.div`
  display: grid;
  gap: 0.18rem;
  min-height: 40px;
  padding: 0.38rem 0.48rem;
  border-left: 3px solid #ff976f;
  background: rgba(119, 43, 30, 0.22);
`;

export const DepartureActivityTitle = styled.strong`
  color: #ffd0b9;
  font-size: 0.75rem;
  line-height: 1.2;
`;

export const DepartureActivityDetail = styled.span`
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  line-height: 1.3;
`;

export const DepartureActivityLink = styled(Link)`
  width: fit-content;
  color: #ffb08e;
  font: 760 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-decoration: none;
  text-transform: none;

  &:hover,
  &:focus-visible {
    color: #fff7ef;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

export const ContainerTimestampSection = styled.section`
  display: flex;
  align-items: center;
  gap: 0.36rem;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
  }
`;

export const ContainerTimestampLabel = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.75rem;
  font-weight: 760;
  letter-spacing: 0.01em;
  text-transform: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
  }
`;

export const ContainerTimestampActions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
  min-width: 0;
`;

export const ActivityLockNotice = styled.span`
  grid-column: 1 / -1;
  padding: 0.24rem 0.34rem;
  border-left: 2px solid rgba(255, 101, 91, 0.72);
  color: rgba(255, 191, 181, 0.74);
  background: rgba(255, 69, 58, 0.07);
  font: 740 0.75rem/1.25 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const LifecycleArchiveLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  min-height: 32px;
  align-items: center;
  padding: 0.28rem 0.5rem;
  border: 1px solid rgba(76, 198, 193, 0.58);
  border-radius: var(--dw-radius-sm);
  color: #d8fff8;
  background: rgba(76, 198, 193, 0.1);
  font: 780 0.75rem/1 ${uiFont};
  letter-spacing: 0.01em;
  text-decoration: none;
  text-transform: none;

  &:hover,
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: #6be0d8;
    color: #ffffff;
    background: rgba(76, 198, 193, 0.18);
  }
`;

export const ItemModeActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.18rem;
  width: 100%;
  min-width: 0;
`;

export const ItemModeButton = styled.button`
  ${controlStyles}
  min-width: 0;
  min-height: var(--dw-control-height);
  padding: 0.16rem 0.3rem;
  border: 1px solid
    ${({ $active }) =>
      $active
        ? 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.66)'
        : 'rgba(214, 226, 241, 0.18)'};
  border-radius: var(--dw-radius-sm);
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.12)'
      : 'rgba(255, 255, 255, 0.025)'};
  color: ${({ $active }) =>
    $active ? 'var(--item-accent, #7fd7ff)' : 'rgba(230, 239, 245, 0.72)'};
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 780;
  letter-spacing: 0.01em;
  line-height: 1;
  text-transform: none;
  cursor: ${({ $active }) => ($active ? 'default' : 'pointer')};
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease;

  &:hover:enabled {
    border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.58);
    color: #f4fbff;
    background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.1);
  }

  &:focus-visible {
    outline: 2px solid var(--item-accent, #7fd7ff);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ContainerButton = styled.button`
  ${controlStyles}
  border: 1px solid ${({ $active }) =>
    $active
      ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.68)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.54)'};
  border-radius: var(--dw-radius-sm);
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.13)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.09)'};
  color: ${LCARS.text};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: none;
  padding: 0.35rem 0.56rem;
  min-height: var(--dw-control-height);
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;

  &:hover:enabled {
    border-color: ${({ $active }) =>
      $active ? 'var(--box-primary, #4cc6c1)' : 'var(--item-accent, #7fd7ff)'};
    background: ${({ $active }) =>
      $active
        ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.19)'
        : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.14)'};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1 1 100px;
    min-height: var(--dw-control-height);
    font-size: 0.75rem;
    padding: 0.18rem 0.3rem;
  }
`;

const timestampToneColor = (tone) =>
  tone === 'consumed'
    ? '#f26262'
    : tone === 'maintained'
      ? 'var(--box-primary, #4cc6c1)'
      : tone === 'checked'
        ? 'var(--item-secondary, #a7b6ff)'
        : 'var(--item-accent, #7fd7ff)';

const timestampToneBorder = (tone) =>
  tone === 'consumed'
    ? 'rgba(242, 98, 98, 0.72)'
    : tone === 'maintained'
      ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.68)'
      : tone === 'checked'
        ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.68)'
        : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.68)';

const timestampToneBg = (tone) =>
  tone === 'consumed'
    ? 'rgba(242, 98, 98, 0.12)'
    : tone === 'maintained'
      ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.12)'
      : tone === 'checked'
        ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.12)'
        : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.12)';

export const ContainerTimestampButton = styled.button`
  ${controlStyles}
  display: grid;
  min-width: 0;
  align-content: center;
  justify-items: center;
  gap: 0.14rem;
  border: 1px solid ${({ $tone }) => timestampToneBorder($tone)};
  background: ${({ $tone }) => timestampToneBg($tone)};
  color: ${({ $tone }) => timestampToneColor($tone)};
  border-radius: var(--dw-radius-sm);
  padding: 0.14rem 0.24rem;
  min-height: 42px;
  font-size: 0.75rem;
  font-weight: 730;
  letter-spacing: 0.01em;
  line-height: 1;
  text-transform: none;
  cursor: pointer;
  transition: filter 120ms ease, border-color 120ms ease, box-shadow 120ms ease;

  &:hover:enabled {
    filter: brightness(1.08);
    box-shadow: none;
  }

  &:active:enabled {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 42px;
    font-size: 0.75rem;
    letter-spacing: 0.01em;
    padding: 0.12rem 0.14rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ContainerTimestampStat = styled.span`
  max-width: 100%;
  color: var(--dw-text-secondary);
  font: 650 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: none;
  white-space: nowrap;
`;

export const TimestampLabelFull = styled.span`
  display: inline;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: none;
  }
`;

export const TimestampLabelCompact = styled.span`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: inline;
  }
`;

export const ContainerPickerWrap = styled.div`
  grid-column: 1 / -1;
  border-top: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.16);
  padding: 0.18rem 0.24rem 0.24rem;
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.16rem 0.2rem 0.2rem;
  }
`;

export const ContainerError = styled.div`
  grid-column: 1 / -1;
  padding: 0.34rem 0.42rem;
  color: #ffc8c8;
  font-size: 0.78rem;
`;
