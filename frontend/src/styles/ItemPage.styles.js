import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from './tokens';

const LCARS = {
  panel: '#141920',
  panelSoft: '#1b212b',
  line: 'rgba(231, 236, 243, 0.11)',
  text: '#e7ecf3',
  textDim: 'rgba(231, 236, 243, 0.72)',
  textMuted: 'rgba(231, 236, 243, 0.56)',
  teal: '#4cc6c1',
  coral: '#f08a7b',
  amber: '#e8b15c',
  green: '#54d097',
  lilac: '#a097ff',
};

const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const Page = styled.section`
  display: grid;
  gap: 0.8rem;
  padding: 0.2rem 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.58rem;
    padding: 0.05rem 0;
  }
`;

export const PageMainGrid = styled.div`
  display: grid;
  gap: 0.8rem;
  min-width: 0;

  @media (min-width: 980px) {
    grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.42fr);
    align-items: start;
    gap: clamp(1rem, 2vw, 1.6rem);
  }
`;

export const PageVisualColumn = styled.div`
  display: grid;
  align-content: start;
  gap: 0.72rem;
  min-width: 0;
`;

export const PageDataColumn = styled.div`
  min-width: 0;

  @media (min-width: 980px) {
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow: auto;
    scrollbar-width: thin;
  }
`;

export const ViewModeNav = styled.nav`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(var(--item-secondary-rgb, 167, 182, 255), 0.28);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.018);
`;

export const ViewModeButton = styled.button`
  min-height: 31px;
  padding: 0 0.34rem;
  border: 0;
  border-right: 1px solid rgba(var(--item-secondary-rgb, 167, 182, 255), 0.2);
  color: ${({ $active }) => ($active ? '#effbff' : 'rgba(214, 226, 241, 0.64)')};
  background: ${({ $active }) => ($active ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.16)' : 'transparent')};
  font: 760 0.55rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:last-child { border-right: 0; }
  &:hover, &:focus-visible { outline: none; color: #ffffff; background: rgba(var(--item-secondary-rgb, 167, 182, 255), 0.18); }
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
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(var(--box-primary-rgb, 76, 198, 193), 0.07), transparent 38%), ${LCARS.panelSoft};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.26rem;
    padding: 0.45rem 0.52rem;
    border-radius: 6px;
  }
`;

const crumbBase = `
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
  padding: 0.26rem 0.42rem;
  border-radius: 3px;
  border: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.25);
  background: rgba(var(--box-primary-rgb, 76, 198, 193), 0.035);
  font-size: 0.82rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
    padding: 0.2rem 0.34rem;
    border-radius: 7px;
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--box-neon, ${LCARS.textDim});
  border: 0;
  border-radius: 0;
  padding: 0.08rem 0.28rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;
    padding: 0.06rem 0.2rem;
    border-radius: 5px;
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
  letter-spacing: 0.02em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 1rem;
    line-height: 1.18;
  }
`;

export const Meta = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.74rem;
  font-weight: 640;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.05em;
  }
`;

export const StateCard = styled.div`
  border: 1px solid ${({ $tone }) => ($tone === 'error' ? '#a84a4a' : LCARS.line)};
  border-radius: 10px;
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

const departurePulse = keyframes`
  0%, 100% {
    border-color: rgba(255, 101, 91, 0.64);
    box-shadow: 0 0 0 1px rgba(255, 78, 68, 0.08), 0 0 13px rgba(255, 67, 58, 0.12);
  }
  50% {
    border-color: rgba(255, 139, 112, 0.96);
    box-shadow: 0 0 0 1px rgba(255, 101, 91, 0.2), 0 0 22px rgba(255, 67, 58, 0.3);
  }
`;

export const DepartureAlert = styled.section`
  display: grid;
  gap: 0.5rem;
  padding: 0.62rem 0.68rem;
  border: 1px solid rgba(255, 101, 91, 0.76);
  border-left: 4px solid #ff655b;
  border-radius: 3px;
  color: #fff3df;
  background:
    linear-gradient(90deg, rgba(255, 69, 58, 0.16), transparent 46%),
    #100d12;
  animation: ${departurePulse} 1.35s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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
  font: 760 0.59rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.12em;
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
  border-radius: 2px;
  color: #ffd0cb;
  background: rgba(255, 69, 58, 0.12);
  font: 820 0.52rem/1 ${mono};
  letter-spacing: 0.08em;

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
    font-size: 0.7rem;
    line-height: 1.2;
  }

  > span + span {
    border-left: 1px solid rgba(255, 173, 159, 0.16);
  }

  b {
    color: rgba(255, 175, 163, 0.64);
    font: 760 0.48rem/1 ${mono};
    letter-spacing: 0.1em;
    text-transform: uppercase;
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
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 32px;
  padding: 0.28rem 0.5rem;
  border: 1px solid rgba(255, 151, 128, 0.76);
  border-radius: 2px;
  color: #fff1ec;
  background: rgba(255, 101, 91, 0.15);
  font: 800 0.6rem/1 ${mono};
  letter-spacing: 0.065em;
  text-transform: uppercase;
  cursor: pointer;

  span {
    color: #ffab98;
    font-size: 0.82rem;
  }

  &:hover:enabled,
  &:focus-visible {
    outline: none;
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
  border-radius: 2px;
  color: #ffd2c7;
  background: rgba(255, 101, 91, 0.08);
  font: 760 0.63rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.07em;
  text-decoration: none;
  text-transform: uppercase;

  &:hover,
  &:focus-visible {
    color: #ffffff;
    border-color: #ff9b83;
    text-decoration: none;
  }
`;

export const DepartureLifecycleButton = styled.button`
  min-height: 32px;
  padding: 0.28rem 0.5rem;
  border: 1px solid ${({ $quiet }) => ($quiet
    ? 'rgba(213, 226, 234, 0.22)'
    : 'rgba(255, 101, 91, 0.72)')};
  border-radius: 2px;
  color: ${({ $quiet }) => ($quiet ? 'rgba(225, 233, 238, 0.64)' : '#fff0ed')};
  background: ${({ $quiet }) => ($quiet ? 'transparent' : 'rgba(255, 69, 58, 0.18)')};
  font: 800 0.58rem/1 ${mono};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover:enabled,
  &:focus-visible {
    outline: none;
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
  background: rgba(5, 9, 14, 0.62);
`;

export const DepartureDestinationHeader = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.65rem;
  color: #ffd0c7;
  font: 800 0.56rem/1.15 ${mono};
  letter-spacing: 0.08em;
  text-transform: uppercase;

  small {
    color: rgba(233, 224, 222, 0.54);
    font: 620 0.56rem/1.25 ${mono};
    letter-spacing: 0.025em;
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
`;

export const ItemButtonBar = styled.section`
  display: grid;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.16);
  border-radius: 6px;
  background: #0a0f15;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 5px;
  }
`;

export const ItemControlsToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  width: 100%;
  min-height: 34px;
  padding: 0.28rem 0.44rem;
  border: 0;
  background:
    linear-gradient(90deg, rgba(var(--item-accent-rgb, 127, 215, 255), 0.075), transparent 42%),
    rgba(8, 13, 19, 0.96);
  color: ${LCARS.text};
  text-align: left;
  cursor: pointer;

  &:hover {
    background:
      linear-gradient(90deg, rgba(var(--item-accent-rgb, 127, 215, 255), 0.12), transparent 50%),
      rgba(10, 16, 23, 0.98);
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
  font: 800 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const ItemControlsSummary = styled.span`
  color: rgba(226, 237, 243, 0.58);
  font: 680 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.05em;
  text-transform: uppercase;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid rgba(var(--item-accent-rgb, 127, 215, 255), 0.1);
  background: rgba(4, 9, 14, 0.72);

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
  background: rgba(var(--item-accent-rgb, 127, 215, 255), 0.025);
`;

export const DeclutterControlButton = styled.button`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  min-height: 32px;
  padding: 0.18rem 0.34rem;
  border: 1px solid ${({ $active }) =>
    $active
      ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.7)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.68)'};
  border-radius: 2px;
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.13)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.09)'};
  color: #eef8ff;
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
    box-shadow: 0 0 10px ${({ $active }) =>
      $active
        ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.18)'
        : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.18)'};
  }

  &:focus-visible {
    outline: 1px solid ${({ $active }) =>
      $active ? 'var(--item-secondary, #a7b6ff)' : 'var(--item-accent, #7fd7ff)'};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.58;
    cursor: wait;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const DeclutterControlContext = styled.span`
  color: rgba(210, 228, 237, 0.5);
  font: 760 0.52rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const DeclutterControlTitle = styled.strong`
  min-width: 0;
  color: inherit;
  font: 780 0.59rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const DeclutterControlState = styled.span`
  color: var(--item-accent, #7fd7ff);
  font: 850 0.54rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;

export const ControlGroup = styled.section`
  display: grid;
  align-content: start;
  gap: 0.22rem;
  min-width: 0;
  padding: 0.3rem;
  border-right: 0;

  ${({ $wide }) => $wide && 'grid-column: span 2;'}
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
  color: rgba(210, 228, 237, 0.5);
  font: 760 0.5rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;
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
  font-size: 0.72rem;
  line-height: 1.2;
`;

export const DepartureActivityDetail = styled.span`
  color: rgba(255, 231, 215, 0.68);
  font-size: 0.64rem;
  line-height: 1.3;
`;

export const DepartureActivityLink = styled(Link)`
  width: fit-content;
  color: #ffb08e;
  font: 760 0.56rem/1 ${mono};
  letter-spacing: 0.06em;
  text-decoration: none;
  text-transform: uppercase;

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
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.07em;
  }
`;

export const ContainerTimestampActions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.14rem;
  min-width: 0;
`;

export const ActivityLockNotice = styled.span`
  grid-column: 1 / -1;
  padding: 0.24rem 0.34rem;
  border-left: 2px solid rgba(255, 101, 91, 0.72);
  color: rgba(255, 191, 181, 0.74);
  background: rgba(255, 69, 58, 0.07);
  font: 740 0.49rem/1.25 ${mono};
  letter-spacing: 0.065em;
  text-transform: uppercase;
`;

export const LifecycleArchiveLink = styled(Link)`
  display: inline-flex;
  width: fit-content;
  min-height: 32px;
  align-items: center;
  padding: 0.28rem 0.5rem;
  border: 1px solid rgba(76, 198, 193, 0.58);
  border-radius: 2px;
  color: #d8fff8;
  background: rgba(76, 198, 193, 0.1);
  font: 780 0.6rem/1 ${mono};
  letter-spacing: 0.06em;
  text-decoration: none;
  text-transform: uppercase;

  &:hover,
  &:focus-visible {
    outline: none;
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
  min-width: 0;
  min-height: 31px;
  padding: 0.16rem 0.3rem;
  border: 1px solid
    ${({ $active }) =>
      $active
        ? 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.66)'
        : 'rgba(214, 226, 241, 0.18)'};
  border-radius: 3px;
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.12)'
      : 'rgba(255, 255, 255, 0.025)'};
  color: ${({ $active }) =>
    $active ? 'var(--item-accent, #7fd7ff)' : 'rgba(230, 239, 245, 0.72)'};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  font-weight: 780;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
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
  border: 1px solid ${({ $active }) =>
    $active
      ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.68)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.54)'};
  border-radius: 3px;
  background: ${({ $active }) =>
    $active
      ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.13)'
      : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.09)'};
  color: ${LCARS.text};
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.35rem 0.56rem;
  min-height: 34px;
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
    min-height: 34px;
    font-size: 0.55rem;
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

const timestampToneGlow = (tone) =>
  tone === 'consumed'
    ? 'rgba(242, 98, 98, 0.26)'
    : tone === 'maintained'
      ? 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.22)'
      : tone === 'checked'
        ? 'rgba(var(--item-secondary-rgb, 167, 182, 255), 0.22)'
        : 'rgba(var(--item-accent-rgb, 127, 215, 255), 0.2)';

export const ContainerTimestampButton = styled.button`
  border: 1px solid ${({ $tone }) => timestampToneBorder($tone)};
  background: ${({ $tone }) => timestampToneBg($tone)};
  color: ${({ $tone }) => timestampToneColor($tone)};
  border-radius: 3px;
  padding: 0.14rem 0.24rem;
  min-height: 31px;
  font-size: 0.55rem;
  font-weight: 730;
  letter-spacing: 0.07em;
  line-height: 1;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 120ms ease, border-color 120ms ease, box-shadow 120ms ease;

  &:hover:enabled {
    filter: brightness(1.08);
    box-shadow: 0 0 10px ${({ $tone }) => timestampToneGlow($tone)};
  }

  &:active:enabled {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 31px;
    font-size: 0.51rem;
    letter-spacing: 0.025em;
    padding: 0.12rem 0.14rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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
  border: 1px solid ${LCARS.line};
  border-radius: 8px;
  padding: 0.3rem 0.42rem 0.42rem;
  background: rgba(255, 255, 255, 0.02);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 7px;
    padding: 0.22rem 0.28rem 0.28rem;
  }
`;

export const ContainerError = styled.div`
  grid-column: 1 / -1;
  padding: 0.34rem 0.42rem;
  color: #ffc8c8;
  font-size: 0.78rem;
`;
