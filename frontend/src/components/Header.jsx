import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Toast from './Toast/Toast';
import { ToastContext } from './Toast';
import HomeCommandIcon from './HomeCommandIcon';
import operationsNavIcon from '../assets/nav-icon-concepts-v1/logoist/operations.svg';
import retrievalNavIcon from '../assets/nav-icon-concepts-v1/logoist/retrieval.svg';
import intakeNavIcon from '../assets/nav-icon-concepts-v1/logoist/intake.svg';
import importNavIcon from '../assets/nav-icon-concepts-v1/logoist/import.svg';
import allItemsNavIcon from '../assets/nav-icon-concepts-v1/logoist/all-items.svg';
import declutterNavIcon from '../assets/nav-icon-concepts-v1/logoist/declutter.svg';
import logsNavIcon from '../assets/nav-icon-concepts-v1/logoist/logs.svg';
import randomNavIcon from '../assets/nav-icon-concepts-v1/logoist/random.svg';
import useIsMobile from '../hooks/useIsMobile';
import useRandomItemFlow from '../hooks/useRandomItemFlow';
import RotatingDataAnnouncement from './RotatingDataAnnouncement';
import DeclutterPlayerPicker from './Declutter/DeclutterPlayerPicker';
import {
  DECLUTTER_PENDING_COUNTS_EVENT,
  DECLUTTER_PLAYER_CHANGE_EVENT,
  getStoredDeclutterPlayer,
} from './Declutter/declutterPlayers';
import {
  BOX_FINDER_CLOSE_EVENT,
  BOX_FINDER_OPEN_EVENT,
  BOX_FINDER_STATE_EVENT,
  BOX_CONTEXT_STATE_EVENT,
  INVENTORY_FINDER_CLOSE_EVENT,
  INVENTORY_FINDER_COMMIT_EVENT,
  INVENTORY_FINDER_OPEN_EVENT,
  INVENTORY_FINDER_STATE_EVENT,
  OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT,
  OPERATIONS_QUICK_PEEK_SEARCH_TOGGLE_EVENT,
  OPERATIONS_QUICK_PEEK_CLOSE_EVENT,
  RETRIEVAL_FINDER_STATE_EVENT,
  RETRIEVAL_FINDER_OPEN_EVENT,
  RETRIEVAL_FINDER_CLOSE_EVENT,
} from '../constants/inventoryFinderEvents';
import {
  MOBILE_BREAKPOINT,
  MOBILE_MAX_WIDTH,
  MOBILE_NARROW_BREAKPOINT,
} from '../styles/tokens';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../util/inventoryColorTheme';
import {
  getOperationsReturnNavigation,
  saveOperationsReturnPosition,
} from '../util/operationsReturnPosition';

// ===============
// App shell and navigation
// ===============

// Preserve the toast's compact state with separated scroll thresholds.
const HEADER_COMPACT_ENTER_Y = 180;
const HEADER_COMPACT_LEAVE_Y = 24;
const RETRIEVAL_WORKSPACE_MAX_WIDTH = 979;
const getHeaderScrollProgress = (scrollY, previousProgress) => {
  if (previousProgress >= 0.5) {
    return scrollY <= HEADER_COMPACT_LEAVE_Y ? 0 : 1;
  }
  return scrollY >= HEADER_COMPACT_ENTER_Y ? 1 : 0;
};

const HeaderShell = styled.header`
--header-progress: 0;
  --header-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --header-duration: 180ms;
  position: ${({ $retrievalWorkspace }) => $retrievalWorkspace ? 'relative' : 'sticky'};
  top: 0;
  width: 100%;
  min-width: 0;
  z-index: 200;
  isolation: isolate;
  background: var(--dw-surface);
  border: 1px solid var(--dw-border);
  border-left: 5px solid var(--dw-amber);
  border-radius: 0;
  box-shadow: var(--dw-shadow);
  overflow: visible;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-top: 0;
    border-right: 0;
    border-left-width: 4px;
    border-radius: 0;
  }
`;

const Inner = styled.div`
min-width: 0;
  padding: 0.65rem 0.85rem 0.5rem;
  ${({ $retrievalWorkspace }) => $retrievalWorkspace && css`
    padding: 0.45rem 0.65rem;
  `}
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.35rem 0.5rem;
  }
`;

const TopRow = styled.div`
position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  min-height: 32px;
  ${({ $retrievalWorkspace }) => $retrievalWorkspace && css`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
  `}
  @media (max-width: ${MOBILE_BREAKPOINT}) { gap: 0.4rem; }
`;

const TopRowControls = styled.div`
display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex-shrink: 0;
  @media (max-width: 360px) { gap: 0.25rem; }
`;

const MobileTelemetryMount = styled.span`
display: none;
  min-width: 0;
  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: block;
    max-width: 5.5rem;
    overflow: hidden;
  }
  @media (max-width: 360px) { display: none; }
`;

const Brand = styled(Link)`
display: inline-flex;
  align-items: center;
  min-width: 0;
  min-height: 40px;
  color: var(--dw-text);
  text-decoration: none;
  border-radius: var(--dw-radius-sm);
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 3px; }
`;

const RetrievalMiniNav = styled.nav`
display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  padding: 3px;
`;

const retrievalMiniControl = css`
display: inline-grid;
  place-items: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  padding: 7px;
  border: 1px solid var(--dw-border-soft);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: var(--dw-text-secondary);
  cursor: pointer;
  text-decoration: none;
  &[aria-current='page'] {
    color: var(--dw-cyan);
    background: var(--dw-surface-raised);
    border-color: var(--dw-cyan);
    box-shadow: inset 0 -2px 0 var(--dw-cyan);
  }
  &:hover { background: var(--dw-surface-raised); border-color: var(--dw-cyan); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  img { display: block; width: 24px; height: 24px; object-fit: contain; }
`;

const RetrievalMiniNavLink = styled(Link)`
  ${retrievalMiniControl}
`;

const RetrievalMiniNavAction = styled.button`
  ${retrievalMiniControl}
  appearance: none;
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  min-width: 0;
`;

const Big = styled.div`
color: var(--dw-text);
  font-family: var(--dw-font-ui);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.2;
  @media (max-width: ${MOBILE_BREAKPOINT}) { font-size: 1rem; }
`;

const LcarsPips = styled.div`
display: flex;
  align-items: center;
  gap: 4px;
  @media (max-width: ${MOBILE_BREAKPOINT}) { display: none; }
`;

const Pip = styled.span`
display: block;
  width: 20px;
  height: 5px;
  border-radius: 1px;
  background: ${({ $c }) => $c};
  &:first-child { width: 38px; }
`;

const MobileMenuToggle = styled.button`
display: none;
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 44px;
    width: 44px;
    min-height: 44px;
    padding: 0;
    border: 1px solid var(--dw-border);
    border-radius: var(--dw-radius-sm);
    background: var(--dw-surface-raised);
    color: var(--dw-text);
    cursor: pointer;
    &[aria-expanded='true'] { border-color: var(--dw-cyan); color: var(--dw-cyan); }
    &:hover { border-color: var(--dw-cyan); }
    &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  }
`;

const MobileMenuGlyph = styled.span`
  position: relative;
  width: 16px;
  height: 1px;
  border-radius: 999px;
  background: ${({ $open }) => ($open ? 'transparent' : 'currentColor')};
  transition: background 140ms ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    width: 16px;
    height: 1px;
    border-radius: 999px;
    background: currentColor;
    transition:
      transform 180ms ease,
      top 180ms ease;
  }

  &::before {
    top: ${({ $open }) => ($open ? '0' : '-5px')};
    transform: ${({ $open }) => ($open ? 'rotate(45deg)' : 'none')};
  }

  &::after {
    top: ${({ $open }) => ($open ? '0' : '5px')};
    transform: ${({ $open }) => ($open ? 'rotate(-45deg)' : 'none')};
  }
`;

const NavRow = styled.nav`
--nav-icon-size: 1.2rem;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 0.25rem;
  min-width: 0;
  margin-top: 0.35rem;
  padding: 3px;
  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) and (max-width: 899px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.3rem;
    padding-block: 0.35rem;
  }
`;

const MobileNavPanel = styled.div`
${({ $retrievalWorkspace }) => $retrievalWorkspace && css`display: none;`}
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: ${({ $open }) => $open ? 'block' : 'none'};
    max-height: min(50dvh, 280px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`;

const navControlStyles = css`
display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  min-width: 0;
  min-height: var(--dw-control-height);
  padding: 0.45rem 0.3rem;
  border: 1px solid transparent;
  border-radius: var(--dw-radius-sm);
  background: transparent;
  color: var(--dw-text-secondary);
  font-family: var(--dw-font-ui);
  font-weight: 600;
  font-size: 0.76rem;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
  transition: background 120ms ease, border-color 120ms ease;
  &[aria-current='page'] {
    background: var(--dw-surface-raised);
    border-color: var(--dw-border);
    color: var(--dw-text);
    box-shadow: inset 0 -2px 0 var(--dw-cyan);
  }
  &:hover { background: var(--dw-surface-raised); color: var(--dw-text); border-color: var(--dw-border); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: flex-start;
    min-height: 44px;
    padding-inline: 0.65rem;
    background: var(--dw-surface-raised);
    border-color: var(--dw-border-soft);
    font-size: 0.85rem;
  }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

const NavIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--nav-icon-size);
  height: var(--nav-icon-size);
  flex: 0 0 var(--nav-icon-size);
  line-height: 1;
`;

const NavIconImage = styled.img`
display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const NavLabel = styled.span`
display: inline-block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NavButton = styled(Link)`
  ${navControlStyles}
`;

const NavActionButton = styled.button`
  ${navControlStyles}
  appearance: none;
  cursor: pointer;
`;

const NavTooltip = styled.div`
position: fixed;
  z-index: 1000;
  top: ${({ $top }) => `${$top}px`};
  left: ${({ $left }) => `${$left}px`};
  transform: translateX(-50%);
  pointer-events: none;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  box-shadow: var(--dw-shadow);
  font: 500 0.8rem/1.3 var(--dw-font-ui);
  white-space: nowrap;
  @media (max-width: ${MOBILE_BREAKPOINT}) { display: none; }
`;

const Divider = styled.div`
height: 1px;
  background: var(--dw-border-soft);
`;

const ToastRow = styled.div`
min-width: 0;
  padding: 0.2rem 0.85rem 0.45rem;
  background: var(--dw-surface);
  border-radius: 0 0 var(--dw-radius) 0;
  ${({ $boxPage }) => $boxPage && css`
    & > div { min-height: 40px; margin-block: 0; padding-block: 0.15rem; }
  `}
  ${({ $retrievalWorkspace }) => $retrievalWorkspace && css`padding: 0.2rem 0.65rem 0.45rem;`}
  @media (max-width: ${MOBILE_BREAKPOINT}) { padding: 0.1rem 0.5rem 0.35rem; border-radius: 0; }
`;

const OperationsConsoleFinderMount = styled.div`
  display: ${({ $active }) => ($active ? 'block' : 'none')};
  flex: 1 1 auto;
  min-width: 0;

  &:empty {
    display: none;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    &:not(:empty) {
      margin-top: 0.14rem;
    }
  }
`;

const RetrievalConsoleFinderMount = styled.div`
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;

  &:empty {
    min-height: 88px;
  }
`;

const RetrievalWorkspaceConsole = styled.div`
display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.35rem;
  min-width: 0;
  border: 1px solid var(--dw-border);
  border-left: 3px solid var(--dw-cyan);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  padding: 0.25rem;
`;

const BoxConsoleMessage = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.36rem;
  min-width: 0;
  max-width: 100%;
  color: rgba(234, 238, 242, 0.84);
`;

const BoxConsoleShortId = styled.span`
  flex: 0 0 auto;
  color: var(--box-neon);
  font-family: var(--dw-font-data);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.1em;
`;

const BoxConsoleSeparator = styled.span`
  flex: 0 0 auto;
  color: rgba(var(--box-secondary-rgb), 0.62);
  font-family: ui-monospace, monospace;
`;

const BoxConsoleTitle = styled.span`
  min-width: 0;
  overflow: hidden;
  color: var(--box-muted);
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BoxConsoleLocation = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--box-location, #7fd7ff);
  font-size: 0.9rem;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BoxConsoleTrailingContext = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.36rem;
  min-width: 0;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }
`;

const BoxConsoleBreadcrumb = styled.nav`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  gap: 0.28rem;
  overflow: hidden;
`;

const BoxConsoleCrumb = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  color: var(--box-muted);
  font-weight: 760;
  text-decoration: none;

  &:hover {
    color: var(--box-neon);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const BoxConsoleCurrentCrumb = styled.span`
  min-width: 0;
  overflow: hidden;
  color: var(--box-muted);
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BoxConsoleCrumbSeparator = styled.span`
  flex: 0 0 auto;
  color: rgba(var(--box-secondary-rgb), 0.62);
  font-family: ui-monospace, monospace;
`;

function BoxConsoleIdleMessage({
  shortId,
  title,
  location,
  query,
  matchCount,
  breadcrumb = [],
  onReturnHome,
}) {
  const hasQuery = Boolean(query);
  const countLabel = `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`;
  const trailingContext = hasQuery ? countLabel : location;

  if (!hasQuery && breadcrumb.length > 0) {
    return (
      <BoxConsoleBreadcrumb aria-label="Box breadcrumb">
        <BoxConsoleCrumb
          to="/operations"
          title="Operations home"
          aria-label="Go to Operations home"
          onClick={onReturnHome}
        >
          <HomeCommandIcon alt="" aria-hidden="true" />
        </BoxConsoleCrumb>
        {breadcrumb.map((crumb, index) => {
          const id = String(crumb?.id || '').trim();
          const label = String(crumb?.label || 'Box').trim() || 'Box';
          const isCurrent = index === breadcrumb.length - 1;
          return (
            <Fragment key={`${id}:${index}`}>
              <BoxConsoleCrumbSeparator aria-hidden="true">›</BoxConsoleCrumbSeparator>
              {isCurrent ? (
                <BoxConsoleCurrentCrumb title={`${id ? `#${id} / ` : ''}${label}`}>
                  {id ? `#${id} / ` : ''}{label}
                </BoxConsoleCurrentCrumb>
              ) : (
                <BoxConsoleCrumb to={`/boxes/${encodeURIComponent(id)}`}>
                  {id ? `#${id} / ` : ''}{label}
                </BoxConsoleCrumb>
              )}
            </Fragment>
          );
        })}
      </BoxConsoleBreadcrumb>
    );
  }

  return (
    <BoxConsoleMessage>
      <BoxConsoleShortId>#{shortId}</BoxConsoleShortId>
      <BoxConsoleSeparator aria-hidden="true">/</BoxConsoleSeparator>
      <BoxConsoleTitle>{hasQuery ? query : title}</BoxConsoleTitle>
      {trailingContext ? (
        <BoxConsoleTrailingContext>
          <BoxConsoleSeparator aria-hidden="true">/</BoxConsoleSeparator>
          <BoxConsoleLocation>{trailingContext}</BoxConsoleLocation>
        </BoxConsoleTrailingContext>
      ) : null}
    </BoxConsoleMessage>
  );
}

const IntakeConsoleMessage = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.34rem;
  min-width: 0;
  max-width: 100%;
  color: rgba(234, 238, 242, 0.84);
`;

const IntakeConsoleDestination = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  max-width: 58%;
  overflow: hidden;
  color: rgba(var(--box-neon-rgb), 0.96);
  font-family: var(--dw-font-ui);
  font-size: 0.78rem;
  font-weight: 860;
  letter-spacing: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IntakeConsoleDivider = styled.span`
  flex: 0 0 auto;
  color: rgba(var(--box-primary-rgb), 0.48);
`;

const IntakeConsoleDraft = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: rgba(230, 235, 239, 0.8);
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function IntakeConsoleIdleMessage({ draftName, context }) {
  const shortId = String(context?.shortId || '').trim();
  const label = String(context?.label || '').trim();
  const destination = shortId ? `#${shortId}${label ? ` · ${label}` : ''}` : 'ORPHANED';
  const draft = String(draftName || '').trim();
  const mode = String(context?.mode || 'new');
  const hasDestination = Boolean(shortId);
  const modeCopy = {
    new: draft ? `Staging: ${draft}` : 'Enter a new item',
    box: hasDestination ? 'Review or change this box' : 'Choose a current box',
    organize: 'Route recent activity',
    edit: hasDestination ? 'Edit this box' : 'Choose a box to edit',
  };
  const activity = modeCopy[mode] || modeCopy.new;

  return (
    <IntakeConsoleMessage>
      <IntakeConsoleDestination title={destination}>{destination}</IntakeConsoleDestination>
      <IntakeConsoleDivider aria-hidden="true">/</IntakeConsoleDivider>
      <IntakeConsoleDraft title={activity}>{activity}</IntakeConsoleDraft>
    </IntakeConsoleMessage>
  );
}



const geometryCommitPulse = keyframes`
  0%, 100% { border-color: var(--dw-border); }
  45% { border-color: var(--dw-cyan); }
`;


const RescueConsoleTrigger = styled.button`
display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  align-self: ${({ $operationsFinderOpen }) => $operationsFinderOpen ? 'flex-start' : 'center'};
  margin-left: auto;
  padding: 0;
  border: 1px solid ${({ $active }) => $active ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: ${({ $active }) => $active ? 'var(--dw-amber)' : 'var(--dw-cyan)'};
  cursor: pointer;
  transition: color 140ms ease, border-color 140ms ease;
  ${({ $pulse }) => $pulse && css`animation: ${geometryCommitPulse} 620ms ease-out;`}
  ${({ $boxThemed }) => $boxThemed && css`color: var(--box-neon, var(--dw-cyan));`}
  ${({ $filtersActive }) => $filtersActive && css`
    border-color: var(--dw-violet);
    color: var(--dw-violet);
  `}
  svg { width: 21px; height: 21px; }
  &:hover { border-color: currentColor; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  @media (max-width: ${MOBILE_BREAKPOINT}) { flex-basis: 44px; width: 44px; height: 44px; }
  @media (prefers-reduced-motion: reduce) { animation: none; transition: none; }
`;

function FinderGeometryGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g className="orbit" fill="none" stroke="currentColor" strokeWidth="1.15">
        <polygon points="12,2.5 20.2,7.2 20.2,16.8 12,21.5 3.8,16.8 3.8,7.2" />
        <circle cx="12" cy="2.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="20.2" cy="16.8" r="1" fill="currentColor" stroke="none" />
        <circle cx="3.8" cy="16.8" r="1" fill="currentColor" stroke="none" />
      </g>
      <g className="counter-orbit" fill="none" stroke="rgba(76, 198, 193, 0.95)" strokeWidth="1.1">
        <path d="M12 5.6 17.5 15H6.5Z" />
        <circle cx="12" cy="12" r="2.15" />
      </g>
    </svg>
  );
}

const IDLE_SIGNAL_COLORS = [
  { primary: '#78f5c8', secondary: '#74d4ff' },
  { primary: '#c9a7ff', secondary: '#ff8ecf' },
  { primary: '#f3bc76', secondary: '#ff7f78' },
  { primary: '#8ed7ff', secondary: '#a9ff68' },
];

const IdleAsciiArt = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  color: var(--dw-text-secondary);
  font: 500 0.82rem/1.4 var(--dw-font-ui);

  &::before {
    content: '';
    width: 18px;
    height: 4px;
    flex: 0 0 18px;
    border-radius: 1px;
    background: var(--idle-signal-primary);
  }
`;

function IdleAsciiSignal({ palette, searchPrompt = false }) {
  return (
    <IdleAsciiArt style={{ '--idle-signal-primary': palette.primary }}>
      {searchPrompt ? 'Search controls available' : 'Inventory ready'}
    </IdleAsciiArt>
  );
}

export default function Header() {
  const location = useLocation();
  const headerRef = useRef(null);
  const menuToggleRef = useRef(null);
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollProgressRef = useRef(0);
  const scrollTransitionLockRef = useRef(false);
  const scrollTransitionTimerRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navTooltip, setNavTooltip] = useState(null);
  const [committedSearch, setCommittedSearch] = useState('');
  const [isOperationsFinderOpen, setIsOperationsFinderOpen] = useState(false);
  const [operationsFiltersActive, setOperationsFiltersActive] = useState(false);
  const [isQuickPeekSearchOpen, setIsQuickPeekSearchOpen] = useState(false);
  const [boxContext, setBoxContext] = useState(null);
  const [boxFinderState, setBoxFinderState] = useState({
    mode: 'closed',
    query: '',
    matchCount: 0,
    sortMode: 'treeOrder',
  });
  const [searchPulse, setSearchPulse] = useState(false);
  const [idleSignalColor, setIdleSignalColor] = useState(0);
  const [retrievalFinderState, setRetrievalFinderState] = useState({
    minimized: true,
    detached: false,
    retrievalMode: 'items',
    boxAnalytics: null,
  });
  const [declutterPlayer, setDeclutterPlayer] = useState(getStoredDeclutterPlayer);
  const [declutterPendingCounts, setDeclutterPendingCounts] = useState({});
  const isBoxDetailPage = /^\/boxes\/[^/]+\/?$/.test(location.pathname);
  const isOperationsPage = /^\/(?:operations\/?|)$/.test(location.pathname);
  const isRetrievalPage = /^\/(?:retrieval|tags\/[^/]+)\/?$/.test(
    location.pathname,
  );
  const isAllItemsPage = /^\/all-items\/?$/.test(location.pathname);
  const isItemPage = /^\/items\/[^/]+\/?$/.test(location.pathname);
  const isIntakePage = /^\/intake\/?$/.test(location.pathname);
  const isImportPage = /^\/import\/?$/.test(location.pathname);
  const isDeclutterPage = /^\/declutter(?:\/|$)/.test(location.pathname);
  const isLogsPage = /^\/logs\/?$/.test(location.pathname);

  const showNavTooltip = (event) => {
    if (typeof window === 'undefined' || window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT})`).matches) {
      return;
    }

    const control = event.target.closest?.('[data-nav-tooltip]');
    if (!control) return;
    const label = control.querySelector('[data-nav-label]');
    const labelStyle = label ? window.getComputedStyle(label) : null;
    const labelHidden = !label ||
      Number.parseFloat(labelStyle?.opacity || '1') < 0.75 ||
      label.getBoundingClientRect().width < 12 ||
      label.scrollWidth > label.clientWidth + 1;

    if (!labelHidden) {
      setNavTooltip(null);
      return;
    }

    const rect = control.getBoundingClientRect();
    setNavTooltip({
      label: control.dataset.navTooltip,
      left: Math.max(72, Math.min(window.innerWidth - 72, rect.left + rect.width / 2)),
      top: rect.bottom + 7,
    });
  };

  const hideNavTooltip = () => setNavTooltip(null);
  const hasOperationsQuickPeek =
    isOperationsPage && new URLSearchParams(location.search).has('peek');

  const toastCtx = useContext(ToastContext);
  const toast = toastCtx?.toast ?? null;
  const hideToast = toastCtx?.hideToast;
  const activeRetrievalItem = toastCtx?.activeRetrievalItem ?? null;
  const intakeDraftName = String(toastCtx?.intakeDraftName || '').trim();
  const intakeContext = toastCtx?.intakeContext ?? null;
  const isIntakeEditMode = isIntakePage && intakeContext?.mode === 'edit';
  const isIntakeIdleSignal =
    isIntakePage &&
    !intakeDraftName &&
    !String(intakeContext?.shortId || '').trim() &&
    String(intakeContext?.mode || 'new') === 'new';
  const boxConsoleStyle =
    isBoxDetailPage && boxContext
      ? getBoxThemeCssVars(getBoxTheme(boxContext.shortId))
      : isIntakePage && intakeContext?.shortId
        ? getBoxThemeCssVars(
            isIntakeEditMode
              ? getBoxTheme(null, { kind: 'system' })
              : getBoxTheme(intakeContext.shortId),
          )
        : undefined;
  const isMobile = useIsMobile(MOBILE_MAX_WIDTH);
  const isRetrievalNarrow = useIsMobile(RETRIEVAL_WORKSPACE_MAX_WIDTH);
  const isRetrievalWorkspace = isRetrievalPage && !isRetrievalNarrow;
  const mobileControlsId = 'mobile-header-controls';
  const { runRandomItem } = useRandomItemFlow();
  const idleSignalPalette = IDLE_SIGNAL_COLORS[idleSignalColor];
  const operationsScrollFrameRef = useRef(0);
  const cycleIdleSignalColor = () => {
    setIdleSignalColor((current) => (current + 1) % IDLE_SIGNAL_COLORS.length);
  };

  useEffect(() => {
    const syncPlayer = (event) => {
      if (event.detail?.playerId) setDeclutterPlayer(event.detail.playerId);
    };
    const syncCounts = (event) => {
      setDeclutterPendingCounts(event.detail?.pendingCounts || {});
    };
    window.addEventListener(DECLUTTER_PLAYER_CHANGE_EVENT, syncPlayer);
    window.addEventListener(DECLUTTER_PENDING_COUNTS_EVENT, syncCounts);
    return () => {
      window.removeEventListener(DECLUTTER_PLAYER_CHANGE_EVENT, syncPlayer);
      window.removeEventListener(DECLUTTER_PENDING_COUNTS_EVENT, syncCounts);
    };
  }, []);

  const openOperationsFinder = () => {
    if (isRetrievalPage) {
      window.dispatchEvent(new CustomEvent(
        isOperationsFinderOpen
          ? RETRIEVAL_FINDER_CLOSE_EVENT
          : RETRIEVAL_FINDER_OPEN_EVENT,
      ));
      return;
    }
    if (hasOperationsQuickPeek) {
      window.dispatchEvent(new CustomEvent(INVENTORY_FINDER_CLOSE_EVENT));
      window.dispatchEvent(
        new CustomEvent(OPERATIONS_QUICK_PEEK_SEARCH_TOGGLE_EVENT),
      );
      return;
    }
    const openEvent = isBoxDetailPage
      ? BOX_FINDER_OPEN_EVENT
      : INVENTORY_FINDER_OPEN_EVENT;
    const closeEvent = isBoxDetailPage
      ? BOX_FINDER_CLOSE_EVENT
      : INVENTORY_FINDER_CLOSE_EVENT;

    const opening = !isOperationsFinderOpen;
    window.dispatchEvent(new CustomEvent(opening ? openEvent : closeEvent));
  };

  const returnToOperationsHome = () => {
    window.dispatchEvent(new CustomEvent(INVENTORY_FINDER_CLOSE_EVENT));
    if (hasOperationsQuickPeek) {
      window.dispatchEvent(
        new CustomEvent(OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT, {
          detail: { open: false },
        }),
      );
    }
    const shouldRestorePosition = isBoxDetailPage || isItemPage;
    const destination = shouldRestorePosition
      ? getOperationsReturnNavigation()
      : null;

    if (destination) {
      navigate(destination.to, {
        state: destination.state,
        preventScrollReset: true,
      });
      return;
    }

    navigate('/operations');
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  };

  useEffect(() => {
    if (!isOperationsPage) return undefined;

    const persistPosition = () => {
      operationsScrollFrameRef.current = 0;
      if (!/^\/(?:operations\/?|)$/.test(window.location.pathname)) return;
      saveOperationsReturnPosition({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        scrollY: window.scrollY,
      });
    };
    const handleScroll = () => {
      if (operationsScrollFrameRef.current) return;
      operationsScrollFrameRef.current = window.requestAnimationFrame(persistPosition);
    };

    persistPosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (operationsScrollFrameRef.current) {
        window.cancelAnimationFrame(operationsScrollFrameRef.current);
        operationsScrollFrameRef.current = 0;
      }
    };
  }, [isOperationsPage, location.hash, location.pathname, location.search]);

  useEffect(() => {
    let pulseTimer = null;
    const handleFinderCommit = (event) => {
      const query = String(event.detail?.query || '').trim();
      if (!query) return;
      setCommittedSearch(query);
      setSearchPulse(true);
      pulseTimer = window.setTimeout(() => setSearchPulse(false), 660);
    };

    window.addEventListener(INVENTORY_FINDER_COMMIT_EVENT, handleFinderCommit);
    return () => {
      window.removeEventListener(INVENTORY_FINDER_COMMIT_EVENT, handleFinderCommit);
      if (pulseTimer) window.clearTimeout(pulseTimer);
    };
  }, []);

  useEffect(() => {
    const handleFinderState = (event) => {
      const minimized = Boolean(event.detail?.minimized);
      setIsOperationsFinderOpen(!minimized);
      if (event.type === INVENTORY_FINDER_STATE_EVENT) {
        setOperationsFiltersActive(Boolean(event.detail?.filtersActive));
      }
      if (event.type === BOX_FINDER_STATE_EVENT) {
        setBoxFinderState((current) => ({ ...current, ...event.detail }));
      }
      if (event.type === RETRIEVAL_FINDER_STATE_EVENT) {
        setRetrievalFinderState((current) => ({ ...current, ...event.detail }));
      }
    };

    window.addEventListener(INVENTORY_FINDER_STATE_EVENT, handleFinderState);
    window.addEventListener(BOX_FINDER_STATE_EVENT, handleFinderState);
    window.addEventListener(RETRIEVAL_FINDER_STATE_EVENT, handleFinderState);
    return () => {
      window.removeEventListener(INVENTORY_FINDER_STATE_EVENT, handleFinderState);
      window.removeEventListener(BOX_FINDER_STATE_EVENT, handleFinderState);
      window.removeEventListener(RETRIEVAL_FINDER_STATE_EVENT, handleFinderState);
    };
  }, []);

  useEffect(() => {
    if (!isOperationsPage) setOperationsFiltersActive(false);
  }, [isOperationsPage]);

  useEffect(() => {
    const handleQuickPeekSearchState = (event) => {
      setIsQuickPeekSearchOpen(Boolean(event.detail?.open));
    };

    window.addEventListener(
      OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT,
      handleQuickPeekSearchState,
    );
    return () =>
      window.removeEventListener(
        OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT,
        handleQuickPeekSearchState,
      );
  }, []);

  useEffect(() => {
    setIsOperationsFinderOpen(false);
    setIsQuickPeekSearchOpen(false);
    setBoxFinderState({
      mode: 'closed',
      query: '',
      matchCount: 0,
      sortMode: 'treeOrder',
    });
    setRetrievalFinderState({
      minimized: true,
      retrievalMode: 'items',
      boxAnalytics: null,
    });
  }, [location.pathname]);

  useEffect(() => {
    const handleBoxContext = (event) => setBoxContext(event?.detail || null);
    window.addEventListener(BOX_CONTEXT_STATE_EVENT, handleBoxContext);
    return () => window.removeEventListener(BOX_CONTEXT_STATE_EVENT, handleBoxContext);
  }, []);

  useEffect(() => {
    if (!isBoxDetailPage) setBoxContext(null);
  }, [isBoxDetailPage]);

  const handleToastClose = () => {
    if (typeof toast?.onClose === 'function') {
      toast.onClose();
      return;
    }

    if (typeof hideToast === 'function') {
      hideToast();
    }
  };

  useEffect(() => {
    // Quick Peek deliberately repositions the selected LCARS row. Keep the
    // header presentation fixed while it does so rather than animate against
    // the programmatic scroll.
    if (hasOperationsQuickPeek) {
      return undefined;
    }

    let frameId = null;
    const scheduleFrame =
      typeof window.requestAnimationFrame === 'function'
        ? (callback) => window.requestAnimationFrame(callback)
        : (callback) => window.setTimeout(callback, 16);
    const cancelFrame =
      typeof window.cancelAnimationFrame === 'function'
        ? (id) => window.cancelAnimationFrame(id)
        : (id) => window.clearTimeout(id);

    const updateProgress = () => {
      frameId = null;
      if (scrollTransitionLockRef.current) return;

      const previousProgress = scrollProgressRef.current;
      const nextProgress = getHeaderScrollProgress(window.scrollY, previousProgress);
      if (Math.abs(nextProgress - previousProgress) < 0.01) return;

      // Keep the latch synchronous. The header's height change can itself
      // emit another scroll event before React has committed the state update.
      scrollProgressRef.current = nextProgress;
      setScrollProgress(nextProgress);
      scrollTransitionLockRef.current = true;
      if (scrollTransitionTimerRef.current !== null) {
        window.clearTimeout(scrollTransitionTimerRef.current);
      }
      scrollTransitionTimerRef.current = window.setTimeout(() => {
        scrollTransitionTimerRef.current = null;
        scrollTransitionLockRef.current = false;
        updateProgress();
      }, 360);
    };

    const onScroll = () => {
      if (frameId === null) {
        frameId = scheduleFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameId !== null) {
        cancelFrame(frameId);
      }
      if (scrollTransitionTimerRef.current !== null) {
        window.clearTimeout(scrollTransitionTimerRef.current);
        scrollTransitionTimerRef.current = null;
      }
      scrollTransitionLockRef.current = false;
    };
  }, [hasOperationsQuickPeek]);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setIsMobileMenuOpen(false);
      menuToggleRef.current?.focus();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    const root = document.documentElement;
    const previousPadding = root.style.scrollPaddingTop;
    const previousHeight = root.style.getPropertyValue('--dw-header-height');
    const updateHeaderHeight = () => {
      const height = isRetrievalWorkspace ? 0 : Math.ceil(header.getBoundingClientRect().height);
      root.style.setProperty('--dw-header-height', `${height}px`);
    };
    root.style.scrollPaddingTop = 'calc(var(--dw-header-height, 0px) + 16px)';
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.scrollPaddingTop = previousPadding;
      if (previousHeight) root.style.setProperty('--dw-header-height', previousHeight);
      else root.style.removeProperty('--dw-header-height');
    };
  }, [isRetrievalWorkspace]);

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((open) => !open);
  };

  const handleNavSelection = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleRandomSelection = () => {
    if (hasOperationsQuickPeek) {
      window.dispatchEvent(new CustomEvent(OPERATIONS_QUICK_PEEK_CLOSE_EVENT));
      window.setTimeout(runRandomItem, 260);
    } else {
      runRandomItem();
    }
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const effectiveHeaderProgress = isBoxDetailPage || isRetrievalWorkspace
    ? 1
    : scrollProgress;
  const headerStyle = {
    '--header-progress': effectiveHeaderProgress.toFixed(3),
  };
  const isHeaderCondensed = effectiveHeaderProgress >= 0.98;
  const showRetrievalConsole = isRetrievalWorkspace || (
    isRetrievalPage && isRetrievalNarrow && !retrievalFinderState.minimized
  );

  return (
    <HeaderShell
      ref={headerRef}
      data-app-header="true"
      style={headerStyle}
      $retrievalPage={isRetrievalPage}
      $retrievalWorkspace={isRetrievalWorkspace}
      $operationsPage={isOperationsPage}
      $allowFinderOverflow={
        (isOperationsPage && isOperationsFinderOpen) || showRetrievalConsole
      }
    >
      <Inner
        $boxPage={isBoxDetailPage}
        $retrievalPage={isRetrievalPage}
        $retrievalWorkspace={isRetrievalWorkspace}
        $operationsPage={isOperationsPage}
      >
        <TopRow $retrievalWorkspace={isRetrievalWorkspace} $operationsPage={isOperationsPage}>
          <Brand
            to="/operations"
            onClick={(event) => {
              event.preventDefault();
              returnToOperationsHome();
            }}
          >
            <Title>
              <Big>Disco Warp Core</Big>
            </Title>
          </Brand>

          {isRetrievalWorkspace ? (
            <RetrievalMiniNav
              aria-label="Compact primary navigation"
              onMouseOver={showNavTooltip}
              onMouseLeave={hideNavTooltip}
              onFocus={showNavTooltip}
              onBlur={hideNavTooltip}
            >
              <RetrievalMiniNavLink
                to="/operations"
                aria-current={isOperationsPage ? 'page' : undefined}
                aria-label="Operations"
                data-nav-tooltip="Operations"
                onClick={handleNavSelection}
              >
                <img src={operationsNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/retrieval"
                aria-current={isRetrievalPage ? 'page' : undefined}
                aria-label="Retrieval"
                data-nav-tooltip="Retrieval"
                $active={isRetrievalPage}
                onClick={handleNavSelection}
              >
                <img src={logsNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/intake"
                aria-current={isIntakePage ? 'page' : undefined}
                aria-label="Intake"
                data-nav-tooltip="Intake"
                onClick={handleNavSelection}
              >
                <img src={declutterNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/import"
                aria-current={isImportPage ? 'page' : undefined}
                aria-label="Import"
                data-nav-tooltip="Import"
                onClick={handleNavSelection}
              >
                <img src={allItemsNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/all-items"
                aria-current={isAllItemsPage ? 'page' : undefined}
                aria-label="All Items"
                data-nav-tooltip="All Items"
                onClick={handleNavSelection}
              >
                <img src={importNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/declutter"
                aria-current={isDeclutterPage ? 'page' : undefined}
                aria-label="Declutter"
                data-nav-tooltip="Declutter"
                onClick={handleNavSelection}
              >
                <img src={intakeNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/logs"
                aria-current={isLogsPage ? 'page' : undefined}
                aria-label="Logs"
                data-nav-tooltip="Logs"
                onClick={handleNavSelection}
              >
                <img src={retrievalNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavAction
                type="button"
                aria-label="Random"
                data-nav-tooltip="Random"
                onClick={handleRandomSelection}
              >
                <img src={randomNavIcon} alt="" />
              </RetrievalMiniNavAction>
            </RetrievalMiniNav>
          ) : null}

          <TopRowControls>
            <LcarsPips aria-hidden="true">
              <Pip $c="var(--dw-amber)" />
              <Pip $c="var(--dw-cyan)" />
              <Pip $c="var(--dw-violet)" />
              <Pip $c="var(--dw-teal)" />
            </LcarsPips>

            <MobileTelemetryMount id="mobile-telemetry-mount" aria-live="polite" />

            <MobileMenuToggle
              ref={menuToggleRef}
              type="button"
              $open={isMobileMenuOpen}
              aria-expanded={isMobileMenuOpen}
              aria-controls={mobileControlsId}
              aria-label={isMobileMenuOpen ? 'Collapse navigation menu' : 'Expand navigation menu'}
              onClick={handleToggleMobileMenu}
            >
              <MobileMenuGlyph $open={isMobileMenuOpen} aria-hidden="true" />
            </MobileMenuToggle>
          </TopRowControls>
        </TopRow>

        <MobileNavPanel
          id={mobileControlsId}
          $open={!isMobile || isMobileMenuOpen}
          $retrievalWorkspace={isRetrievalWorkspace}
          aria-hidden={isMobile ? !isMobileMenuOpen : undefined}
          inert={isMobile && !isMobileMenuOpen ? true : undefined}
        >
          <NavRow
            aria-label="Primary navigation"
            $retrievalPage={isRetrievalPage}
            $condensed={isHeaderCondensed}
            $textOnly={isMobile && isMobileMenuOpen}
            onMouseOver={showNavTooltip}
            onMouseLeave={hideNavTooltip}
            onFocus={showNavTooltip}
            onBlur={hideNavTooltip}
          >
            <NavButton
              to="/operations"
                aria-current={isOperationsPage ? 'page' : undefined}
              aria-label="Operations"
              data-nav-tooltip="Operations"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">
                <NavIconImage src={operationsNavIcon} alt="" />
              </NavIcon>
              <NavLabel data-nav-label>Operations</NavLabel>
            </NavButton>
            <NavButton
              to="/retrieval"
                aria-current={isRetrievalPage ? 'page' : undefined}
              aria-label="Retrieval"
              data-nav-tooltip="Retrieval"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">
                <NavIconImage src={logsNavIcon} alt="" />
              </NavIcon>
              <NavLabel data-nav-label>Retrieval</NavLabel>
            </NavButton>
            <NavButton
              to="/intake"
                aria-current={isIntakePage ? 'page' : undefined}
              aria-label="Intake"
              data-nav-tooltip="Intake"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">
                <NavIconImage src={declutterNavIcon} alt="" />
              </NavIcon>
              <NavLabel data-nav-label>Intake</NavLabel>
            </NavButton>
            <NavButton
              to="/import"
                aria-current={isImportPage ? 'page' : undefined}
              aria-label="Import"
              data-nav-tooltip="Import"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">
                <NavIconImage src={allItemsNavIcon} alt="" />
              </NavIcon>
              <NavLabel data-nav-label>Import</NavLabel>
            </NavButton>
            <NavButton
              to="/all-items"
                aria-current={isAllItemsPage ? 'page' : undefined}
              aria-label="All Items"
              data-nav-tooltip="All Items"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">
                <NavIconImage src={importNavIcon} alt="" />
              </NavIcon>
              <NavLabel data-nav-label>All Items</NavLabel>
            </NavButton>
            <NavButton
              to="/declutter"
                aria-current={isDeclutterPage ? 'page' : undefined}
              aria-label="Declutter"
              data-nav-tooltip="Declutter"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">
                <NavIconImage src={intakeNavIcon} alt="" />
              </NavIcon>
              <NavLabel data-nav-label>Declutter</NavLabel>
            </NavButton>
            <NavButton
              to="/logs"
                aria-current={isLogsPage ? 'page' : undefined}
              aria-label="Logs"
              data-nav-tooltip="Logs"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">
                <NavIconImage src={retrievalNavIcon} alt="" />
              </NavIcon>
              <NavLabel data-nav-label>Logs</NavLabel>
            </NavButton>
            <NavActionButton
              type="button"
              aria-label="Random"
              data-nav-tooltip="Random"
              onClick={handleRandomSelection}
            >
              <NavIcon aria-hidden="true">
                <NavIconImage src={randomNavIcon} alt="" />
              </NavIcon>
              <NavLabel data-nav-label>Random</NavLabel>
            </NavActionButton>
          </NavRow>
        </MobileNavPanel>
      </Inner>

      <Divider />

      {(!isImportPage || toast) ? <ToastRow
        $boxPage={isBoxDetailPage}
        $retrievalPage={isRetrievalPage}
        $retrievalWorkspace={isRetrievalWorkspace}
        $operationsPage={isOperationsPage}
        $itemPageRail={
          toast?.presentation === 'item-page' || toast?.presentation === 'item-field'
        }
        style={toast?.themeStyle || boxConsoleStyle}
      >
        {showRetrievalConsole ? (
          <RetrievalWorkspaceConsole>
            <RetrievalConsoleFinderMount id="retrieval-console-finder-mount" />
            {isRetrievalPage && isRetrievalNarrow ? (
              <RescueConsoleTrigger
                type="button"
                onClick={openOperationsFinder}
                aria-label="Dismiss retrieval search"
                title="Dismiss retrieval search"
                $active
                $retrievalConsoleDismiss
              >
                <FinderGeometryGlyph />
              </RescueConsoleTrigger>
            ) : null}
          </RetrievalWorkspaceConsole>
        ) : (
        <Toast
          operationsDock={isOperationsPage}
          quietIdle={isAllItemsPage}
          open={!!toast}
          title={toast?.title}
          titleDetails={toast?.titleDetails}
          titleAlign={toast?.titleAlign}
          titleSize={toast?.titleSize}
          presentation={toast?.presentation}
          themeStyle={toast?.themeStyle}
          allowOverflow={isOperationsPage && isOperationsFinderOpen}
          message={toast?.message}
          content={toast?.content}
          variant={toast?.variant ?? 'info'}
          loading={!!toast?.loading}
          actions={toast?.actions ?? []}
          onClose={
            toast &&
            toast.dismissible !== false &&
            toast.id !== 'item-page-actions' &&
            !String(toast.id || '').startsWith('edit-item-actions:') &&
            !String(toast.id || '').startsWith('edit-item-field:')
              ? handleToastClose
              : typeof activeRetrievalItem?.onCollapse === 'function'
                ? activeRetrievalItem.onCollapse
                : undefined
          }
          showIdle
          idleIcon={
            isAllItemsPage || isDeclutterPage
              ? ''
              : isOperationsPage
              ? <HomeCommandIcon alt="" />
              : isBoxDetailPage ? '' : <HomeCommandIcon alt="" />
          }
          idleIconAction={
            isOperationsPage || isLogsPage || isIntakeIdleSignal
              ? {
                  onClick: returnToOperationsHome,
                  ariaLabel: 'Return to Operations home and scroll to top',
                  title: 'Operations home',
                  alignTop: isOperationsFinderOpen,
                }
              : null
          }
          hideIdleIconOnMobile={isOperationsPage}
          idleText={
            isDeclutterPage
              ? ''
              : isOperationsPage
              ? ''
              : isAllItemsPage
              ? ''
              : isBoxDetailPage && boxContext
              ? (
                  <BoxConsoleIdleMessage
                    shortId={boxContext.shortId}
                    title={boxContext.title}
                    location={boxContext.location}
                    query={
                      boxFinderState.mode === 'minimized'
                        ? boxFinderState.query
                        : ''
                    }
                    matchCount={boxFinderState.matchCount}
                    breadcrumb={boxContext.breadcrumb}
                    onReturnHome={(event) => {
                      event.preventDefault();
                      returnToOperationsHome();
                    }}
                  />
                )
              : committedSearch
                ? `Searching: ${committedSearch}`
                : isIntakeIdleSignal
                  ? <IdleAsciiSignal palette={idleSignalPalette} />
                : isIntakePage
                  ? (
                      <IntakeConsoleIdleMessage
                        draftName={intakeDraftName}
                        context={intakeContext}
                      />
                    )
                : isRetrievalPage &&
                    retrievalFinderState.minimized &&
                    retrievalFinderState.retrievalMode === 'boxes' &&
                    retrievalFinderState.boxAnalytics
                  ? (
                      <RotatingDataAnnouncement
                        analytics={retrievalFinderState.boxAnalytics}
                      />
                    )
                : isRetrievalPage
                  ? (
                      <IdleAsciiSignal
                        palette={idleSignalPalette}
                        searchPrompt={
                          isRetrievalNarrow &&
                          retrievalFinderState.detached &&
                          retrievalFinderState.minimized
                        }
                      />
                    )
                : isLogsPage
                  ? <IdleAsciiSignal palette={idleSignalPalette} />
                  : 'What are you looking for?'
          }
          idleAction={
            isDeclutterPage || isOperationsPage || isAllItemsPage || isBoxDetailPage || isRetrievalPage || isLogsPage || isIntakeIdleSignal
              ? null
              : {
                  onClick: openOperationsFinder,
                  ariaLabel: isBoxDetailPage
                    ? 'Open box search'
                    : isRetrievalPage
                      ? 'Open retrieval search'
                    : hasOperationsQuickPeek
                          ? 'Toggle Quick Peek item search'
                          : 'Open item finder',
                }
          }
          calmIdle={isBoxDetailPage || isIntakePage}
          themedIdle={
            (isBoxDetailPage && !!boxContext) ||
            (isIntakePage && !!intakeContext?.shortId)
          }
          idleAddon={
            isAllItemsPage ? null : isDeclutterPage ? (
              <DeclutterPlayerPicker
                value={declutterPlayer}
                pendingCounts={declutterPendingCounts}
                onChange={setDeclutterPlayer}
              />
            ) : <>
              {isOperationsPage ? (
                <OperationsConsoleFinderMount
                  id="operations-console-finder-mount"
                  $active={isOperationsPage}
                />
              ) : null}
              <RescueConsoleTrigger
                type="button"
                onClick={isLogsPage || isIntakeIdleSignal ? cycleIdleSignalColor : openOperationsFinder}
                data-box-finder-trigger={isBoxDetailPage ? true : undefined}
                aria-label={
                  isBoxDetailPage
                    ? 'Toggle box quick search'
                    : isLogsPage || isIntakeIdleSignal
                      ? 'Change idle signal color'
                    : isRetrievalPage
                      ? 'Toggle retrieval search'
                    : hasOperationsQuickPeek
                          ? 'Toggle Quick Peek item search'
                          : isOperationsFinderOpen
                            ? 'Hide inventory options'
                            : 'Expand inventory options'
                }
                title={
                  isBoxDetailPage
                    ? 'Search this box'
                    : isLogsPage || isIntakeIdleSignal
                      ? 'Change signal color'
                    : isRetrievalPage
                      ? 'Retrieval search'
                        : hasOperationsQuickPeek
                          ? 'Search items in this box'
                          : isOperationsFinderOpen
                            ? 'Hide inventory options'
                            : 'Expand inventory options'
                }
                $active={
                  isBoxDetailPage
                    ? boxFinderState.mode === 'expanded' ||
                      !!boxFinderState.query ||
                      boxFinderState.sortMode !== 'treeOrder'
                    : isOperationsFinderOpen || isQuickPeekSearchOpen
                }
                $pulse={searchPulse || (
                  isRetrievalPage && retrievalFinderState.detached
                )}
                $retrievalDocked={
                  isRetrievalPage &&
                  retrievalFinderState.detached &&
                  retrievalFinderState.minimized
                }
                $boxThemed={
                  (isBoxDetailPage && !!boxContext) ||
                  (isIntakePage && !!intakeContext?.shortId)
                }
                $operationsFinderOpen={isOperationsPage && isOperationsFinderOpen}
                $filtersActive={isOperationsPage && operationsFiltersActive}
              >
                <FinderGeometryGlyph />
              </RescueConsoleTrigger>
            </>
          }
          idleAddonCentered={isDeclutterPage}
          activeRetrievalItem={activeRetrievalItem}
          compact={isHeaderCondensed}
          compactProgress={isBoxDetailPage ? 1.35 : effectiveHeaderProgress}
        />
        )}
      </ToastRow> : null}
      {navTooltip && typeof document !== 'undefined'
        ? createPortal(
            <NavTooltip
              role="tooltip"
              $left={navTooltip.left}
              $top={navTooltip.top}
            >
              {navTooltip.label}
            </NavTooltip>,
            document.body,
          )
        : null}
    </HeaderShell>
  );
}
