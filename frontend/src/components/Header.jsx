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
import AllItemsHeaderTicker from './AllItemsList/AllItemsHeaderTicker';
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
  ALL_ITEMS_FILTERS_STATE_EVENT,
  ALL_ITEMS_FILTERS_TOGGLE_EVENT,
  ALL_ITEMS_INSIGHTS_STATE_EVENT,
} from '../constants/inventoryFinderEvents';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
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
// LCARS-ish Styles
// ===============

// Two states with a simple latch. Compacting changes the header's height by
// roughly 127px at the target viewport, so the enter and leave thresholds need
// enough separation to keep the header from moving its own scroll position
// back across the trigger.
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
  --header-duration: 280ms;

  position: sticky;
  top: 0;
  z-index: 200;

  /* Make it feel like a “panel” that’s part of the page, not an overlay. */
  background: linear-gradient(
    180deg,
    rgba(8, 12, 18, calc(0.92 + (0.07 * var(--header-progress)))),
    rgba(8, 12, 18, calc(0.84 + (0.12 * var(--header-progress))))
  );
  backdrop-filter: blur(calc(6px + (6px * var(--header-progress))));

  border: 1px solid rgba(0, 255, 200, calc(0.14 + (0.12 * var(--header-progress))));
  border-radius: calc(14px - (4px * var(--header-progress)));
  box-shadow:
    0 0 0 2px rgba(0, 255, 200, calc(0.05 + (0.04 * var(--header-progress)))),
    0 calc(10px - (4px * var(--header-progress))) calc(30px - (10px * var(--header-progress))) rgba(0, 0, 0, 0.35);

  /* Prevent content behind header from peeking through around rounded corners */
  overflow: ${({ $allowFinderOverflow }) =>
    $allowFinderOverflow ? 'visible' : 'hidden'};
  transition:
    background var(--header-duration) var(--header-ease),
    backdrop-filter var(--header-duration) var(--header-ease),
    border-color var(--header-duration) var(--header-ease),
    border-radius var(--header-duration) var(--header-ease),
    box-shadow var(--header-duration) var(--header-ease);

  ${({ $retrievalWorkspace }) => $retrievalWorkspace && css`
    position: relative;
    border-radius: 3px 8px 3px 3px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
  `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 10px;
    box-shadow:
      0 0 0 1px rgba(0, 255, 200, 0.09),
      0 4px 14px rgba(0, 0, 0, 0.28);
  }

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) and (max-width: 899px) {
    ${({ $retrievalPage }) =>
      $retrievalPage &&
      css`
        border-radius: 3px 10px 3px 3px;
        box-shadow:
          inset 5px 0 0 rgba(76, 198, 193, 0.52),
          0 8px 22px rgba(0, 0, 0, 0.28);
      `}
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Inner = styled.div`
  position: relative;
  padding-block: calc(1rem - (0.68rem * var(--header-progress)));
  padding-inline: calc(1.25rem - (0.53rem * var(--header-progress)));
  transition:
    padding-block var(--header-duration) var(--header-ease),
    padding-inline var(--header-duration) var(--header-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-block: calc(0.5rem - (0.22rem * var(--header-progress)));
    padding-inline: calc(0.58rem - (0.16rem * var(--header-progress)));
  }

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) and (max-width: 899px) {
    ${({ $retrievalPage }) =>
      $retrievalPage &&
      css`
        padding-block: calc(0.64rem - (0.34rem * var(--header-progress)));
        padding-inline: calc(0.72rem - (0.22rem * var(--header-progress)));
      `}
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  ${({ $boxPage }) =>
    $boxPage &&
    css`
      padding-block: 0;
      padding-inline: 0.65rem;
    `}

  ${({ $itemPageRail }) =>
    $itemPageRail &&
    css`
      padding: 0.18rem 0.65rem 0.24rem;

      @media (max-width: ${MOBILE_BREAKPOINT}) {
        padding: 0.14rem 0.46rem 0.2rem;
      }
    `}

  ${({ $retrievalWorkspace }) => $retrievalWorkspace && css`
    padding: 0.22rem 0.58rem 0.18rem;
  `}
`;

const TopRow = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: calc(0.9rem - (0.28rem * var(--header-progress)));
  justify-content: space-between;
  transition: gap var(--header-duration) var(--header-ease);

  ${({ $retrievalWorkspace }) => $retrievalWorkspace && css`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.58rem;
  `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: calc(0.45rem - (0.08rem * var(--header-progress)));
    align-items: flex-start;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const mobileAmbientDrift = keyframes`
  0% {
    background-position:
      12% 50%,
      88% 50%,
      45% 50%;
    opacity: 0.42;
  }
  22% {
    background-position:
      18% 50%,
      82% 50%,
      47% 50%;
    opacity: 0.56;
  }
  48% {
    background-position:
      34% 50%,
      66% 50%,
      56% 50%;
    opacity: 0.92;
  }
  62% {
    background-position:
      44% 50%,
      56% 50%,
      62% 50%;
    opacity: 0.98;
  }
  82% {
    background-position:
      29% 50%,
      71% 50%,
      53% 50%;
    opacity: 0.64;
  }
  100% {
    background-position:
      12% 50%,
      88% 50%,
      45% 50%;
    opacity: 0.42;
  }
`;

const mobileAmbientSweep = keyframes`
  0%,
  70% {
    opacity: 0;
    transform: translateX(-125%);
  }
  74% {
    opacity: 0.08;
  }
  76% {
    opacity: 0.2;
  }
  79% {
    opacity: 0.11;
  }
  84% {
    opacity: 0;
    transform: translateX(125%);
  }
  100% {
    opacity: 0;
    transform: translateX(125%);
  }
`;

const MobileAmbientGap = styled.div`
  display: none;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: block;
    pointer-events: none;
    position: absolute;
    left: 0.58rem;
    right: 0.58rem;
    bottom: 0.14rem;
    height: 22px;
    z-index: 0;
    border-radius: 8px;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.46) 16%,
      rgba(0, 0, 0, 0.98) 48%,
      rgba(0, 0, 0, 0.38) 80%,
      rgba(0, 0, 0, 0) 100%
    );
    mask-image: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.46) 16%,
      rgba(0, 0, 0, 0.98) 48%,
      rgba(0, 0, 0, 0.38) 80%,
      rgba(0, 0, 0, 0) 100%
    );
    opacity: ${({ $show }) => ($show ? 1 : 0)};
    visibility: ${({ $show }) => ($show ? 'visible' : 'hidden')};
    transition:
      opacity 220ms ease,
      visibility 0s linear ${({ $show }) => ($show ? '0s' : '220ms')};

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(
          90% 120% at 16% 50%,
          rgba(34, 211, 238, 0.34) 0%,
          rgba(34, 211, 238, 0) 72%
        ),
        radial-gradient(
          80% 120% at 85% 52%,
          rgba(167, 139, 250, 0.3) 0%,
          rgba(167, 139, 250, 0) 74%
        ),
        linear-gradient(
          92deg,
          rgba(0, 255, 200, 0.04) 0%,
          rgba(94, 226, 255, 0.2) 46%,
          rgba(153, 124, 246, 0.16) 62%,
          rgba(0, 255, 200, 0.04) 100%
        );
      background-size:
        150% 100%,
        145% 100%,
        175% 100%;
      animation: ${mobileAmbientDrift} 7.2s linear infinite;
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        104deg,
        rgba(0, 0, 0, 0) 40%,
        rgba(88, 226, 255, 0.18) 50%,
        rgba(162, 134, 255, 0.14) 54%,
        rgba(0, 0, 0, 0) 64%
      );
      mix-blend-mode: screen;
      animation: ${mobileAmbientSweep} 10.5s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      &::before,
      &::after {
        animation: none;
      }
    }
  }
`;

const TopRowControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.36rem;
  }
`;

const Brand = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: inline-flex;
  align-items: baseline;
  gap: 0.75rem;
  min-width: 0;
`;

const RetrievalMiniNav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.18rem;
  min-width: 0;
  overflow: hidden;
`;

const retrievalMiniControl = css`
  display: inline-grid;
  place-items: center;
  flex: 0 0 28px;
  width: 28px;
  height: 25px;
  padding: 2px;
  border: 1px solid rgba(127, 215, 255, 0.22);
  border-radius: 2px 5px 2px 2px;
  background: rgba(10, 22, 31, 0.72);
  color: rgba(230, 242, 249, 0.86);
  cursor: pointer;
  text-decoration: none;
  transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;

  ${({ $active }) => $active && css`
    border-color: rgba(103, 239, 200, 0.62);
    background: rgba(76, 198, 193, 0.17);
    box-shadow: inset 0 -2px 0 rgba(103, 239, 200, 0.56);
  `}

  &:hover,
  &:focus-visible {
    border-color: rgba(127, 215, 255, 0.7);
    background: rgba(35, 74, 91, 0.58);
    box-shadow: 0 0 10px rgba(76, 198, 193, 0.16);
    outline: none;
  }

  img {
    display: block;
    width: 19px;
    height: 19px;
    object-fit: contain;
    filter: drop-shadow(0 0 4px rgba(60, 217, 255, 0.28));
  }
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
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: 0.06em;
  font-weight: 800;
  color: rgba(240, 240, 240, 0.98);

  font-size: calc(1.28rem - (0.33rem * var(--header-progress)));
  transform: scale(calc(1 - (0.025 * var(--header-progress))));
  transform-origin: left center;
  transition:
    font-size var(--header-duration) var(--header-ease),
    transform var(--header-duration) var(--header-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: calc(0.96rem - (0.18rem * var(--header-progress)));
    letter-spacing: 0.045em;
    line-height: 1.08;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const LcarsPips = styled.div`
  display: flex;
  gap: calc(0.35rem - (0.08rem * var(--header-progress)));
  align-items: center;
  opacity: calc(0.9 - (0.38 * var(--header-progress)));
  transform: translateY(calc(-2px * var(--header-progress))) scale(calc(1 - (0.04 * var(--header-progress))));
  transform-origin: right center;
  transition:
    gap var(--header-duration) var(--header-ease),
    opacity 220ms ease,
    transform var(--header-duration) var(--header-ease);

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) {
    & > span:nth-child(1) {
      --pip-breathe-duration: 5.9s;
      --pip-breathe-delay: -0.9s;
      --pip-hue-duration: 6.7s;
      --pip-hue-delay: -1.6s;
      --pip-hue-timing: cubic-bezier(0.62, 0.01, 0.24, 0.99);
      --pip-h0: 18deg;
      --pip-h1: 97deg;
      --pip-h2: 169deg;
      --pip-h3: 248deg;
      --pip-h4: 328deg;
      --pip-h5: 386deg;
      --pip-flare-duration: 16.9s;
      --pip-flare-delay: -2.4s;
    }

    & > span:nth-child(2) {
      --pip-breathe-duration: 4.7s;
      --pip-breathe-delay: -1.7s;
      --pip-hue-duration: 9.9s;
      --pip-hue-delay: -3.1s;
      --pip-hue-timing: cubic-bezier(0.36, 0.08, 0.12, 0.97);
      --pip-h0: 142deg;
      --pip-h1: 214deg;
      --pip-h2: 281deg;
      --pip-h3: 349deg;
      --pip-h4: 431deg;
      --pip-h5: 504deg;
      --pip-flare-duration: 19.4s;
      --pip-flare-delay: -6.2s;
    }

    & > span:nth-child(3) {
      --pip-breathe-duration: 6.3s;
      --pip-breathe-delay: -2.9s;
      --pip-hue-duration: 7.8s;
      --pip-hue-delay: -4.2s;
      --pip-hue-timing: cubic-bezier(0.54, 0.05, 0.2, 0.98);
      --pip-h0: -76deg;
      --pip-h1: -3deg;
      --pip-h2: 84deg;
      --pip-h3: 171deg;
      --pip-h4: 262deg;
      --pip-h5: 289deg;
      --pip-flare-duration: 17.8s;
      --pip-flare-delay: -8.3s;
    }

    & > span:nth-child(4) {
      --pip-breathe-duration: 5.2s;
      --pip-breathe-delay: -0.3s;
      --pip-hue-duration: 11.2s;
      --pip-hue-delay: -5.1s;
      --pip-hue-timing: cubic-bezier(0.31, 0.16, 0.11, 0.98);
      --pip-h0: 63deg;
      --pip-h1: 138deg;
      --pip-h2: 226deg;
      --pip-h3: 307deg;
      --pip-h4: 389deg;
      --pip-h5: 445deg;
      --pip-flare-duration: 21.2s;
      --pip-flare-delay: -10.4s;
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
    opacity: calc(0.75 - (0.28 * var(--header-progress)));
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const pipBreath = keyframes`
  0%,
  100% {
    transform: scale(1);
    opacity: 0.86;
    box-shadow: 0 0 9px currentColor;
  }
  34% {
    transform: scale(1.08);
    opacity: 0.98;
    box-shadow: 0 0 12px currentColor;
  }
  58% {
    transform: scale(0.96);
    opacity: 0.82;
    box-shadow: 0 0 8px currentColor;
  }
  78% {
    transform: scale(1.04);
    opacity: 0.94;
    box-shadow: 0 0 11px currentColor;
  }
`;

const pipFlare = keyframes`
  0%,
  92%,
  100% {
    opacity: 0;
    transform: scale(0.78);
  }
  93.5% {
    opacity: 0.24;
    transform: scale(1.45);
  }
  94.5% {
    opacity: 0.08;
    transform: scale(1.08);
  }
  95.5% {
    opacity: 0.18;
    transform: scale(1.35);
  }
  97% {
    opacity: 0;
    transform: scale(0.82);
  }
`;

const pipHueDrift = keyframes`
  0% {
    filter: hue-rotate(var(--pip-h0, 0deg)) saturate(110%) brightness(1);
  }
  13% {
    filter: hue-rotate(var(--pip-h1, 78deg)) saturate(126%) brightness(1.12);
  }
  31% {
    filter: hue-rotate(var(--pip-h2, 152deg)) saturate(118%) brightness(1.06);
  }
  53% {
    filter: hue-rotate(var(--pip-h3, 238deg)) saturate(132%) brightness(1.14);
  }
  76% {
    filter: hue-rotate(var(--pip-h4, 314deg)) saturate(124%) brightness(1.08);
  }
  100% {
    filter: hue-rotate(var(--pip-h5, 360deg)) saturate(110%) brightness(1);
  }
`;

const Pip = styled.span`
  position: relative;
  width: calc(10px - (2px * var(--header-progress)));
  height: calc(10px - (2px * var(--header-progress)));
  border-radius: 999px;
  color: ${({ $c }) => $c};
  background: currentColor;
  box-shadow: 0 0 12px currentColor;
  transition:
    width var(--header-duration) var(--header-ease),
    height var(--header-duration) var(--header-ease),
    opacity 220ms ease;

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) {
    animation:
      ${pipBreath} var(--pip-breathe-duration, 5.6s) ease-in-out infinite,
      ${pipHueDrift} var(--pip-hue-duration, 14s) var(--pip-hue-timing, ease-in-out) infinite;
    animation-delay:
      var(--pip-breathe-delay, 0s),
      var(--pip-hue-delay, 0s);
    will-change: transform, opacity, box-shadow, filter;

    &::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      background: radial-gradient(
        circle,
        currentColor 0%,
        rgba(255, 255, 255, 0) 72%
      );
      opacity: 0;
      transform: scale(0.8);
      filter: blur(0.35px);
      animation: ${pipFlare} var(--pip-flare-duration, 18.5s) linear infinite;
      animation-delay: var(--pip-flare-delay, 0s);
      pointer-events: none;
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: calc(8px - (1px * var(--header-progress)));
    height: calc(8px - (1px * var(--header-progress)));
    box-shadow: 0 0 7px currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;

    &::after {
      animation: none;
    }
  }
`;

const MobileMenuToggle = styled.button`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: ${MOBILE_CONTROL_MIN_HEIGHT};
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding: 0;
    border-radius: 0;
    border: 0;
    background: transparent;
    color: rgba(240, 245, 250, 0.96);
    box-shadow: none;
    appearance: none;
    cursor: pointer;
    transition:
      color 180ms ease,
      transform 120ms ease;

    &:hover {
      background: transparent;
      box-shadow: none;
      color: rgba(161, 246, 255, 1);
    }

    &:active {
      transform: scale(0.98);
    }

    &:focus-visible {
      outline: 2px solid rgba(0, 255, 200, 0.55);
      outline-offset: 2px;
    }
  }
`;

const MobileMenuGlyph = styled.span`
  position: relative;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: ${({ $open }) => ($open ? 'transparent' : 'currentColor')};
  transition: background 140ms ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    width: 16px;
    height: 2px;
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
  --nav-progress: min(1, calc(var(--header-progress) * 1.12));
  --nav-icon-size: 2.05rem;
  --nav-readable-size: 10rem;
  --nav-gap: calc(0.56rem - (0.24rem * var(--nav-progress)));
  --nav-expanded-size: calc((100% - (1.68rem - (0.72rem * var(--nav-progress)))) / 4);

  margin-top: 0.52rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.42rem;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 1220px) {
    grid-template-columns: repeat(8, minmax(0, 1fr));

    ${({ $retrievalPage }) =>
      $retrievalPage &&
      css`
        --nav-readable-size: 0px;

        > a,
        > button {
          width: 100%;
          min-width: 0;
          border-radius: 2px 6px 2px 2px;
        }
      `}
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    --nav-icon-size: 1.86rem;
    --nav-readable-size: 9.5rem;
    --nav-gap: calc(0.38rem - (0.14rem * var(--nav-progress)));
    --nav-expanded-size: calc((100% - (0.76rem - (0.28rem * var(--nav-progress)))) / 3);

    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.32rem;
    margin-top: 0.36rem;

    ${({ $textOnly }) =>
      $textOnly &&
      css`
        > a,
        > button {
          gap: 0;
          padding-inline: clamp(0.28rem, 2.4vw, 0.58rem);
        }

        > a > span:first-child,
        > button > span:first-child {
          display: none;
        }

        > a > span:last-child,
        > button > span:last-child {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          opacity: 1;
          overflow: hidden;
          transform: none;
          font-size: clamp(0.62rem, 3.5vw, 0.82rem);
          letter-spacing: clamp(0.02em, 0.3vw, 0.055em);
          line-height: 1.05;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    --nav-expanded-size: calc((100% - (0.38rem - (0.14rem * var(--nav-progress)))) / 2);
  }

  @media (min-width: 900px) and (max-width: 1219px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) and (max-width: 899px) {
    ${({ $retrievalPage }) =>
      $retrievalPage &&
      css`
        --nav-gap: calc(0.36rem - (0.12rem * var(--nav-progress)));
        --nav-readable-size: 0px;
        --nav-expanded-size: calc((100% - (1.08rem - (0.36rem * var(--nav-progress)))) / 4);

        > a,
        > button {
          width: 100%;
          min-width: 0;
          min-height: calc(2.08rem - (0.16rem * var(--header-progress)));
          gap: calc(0.34rem - (0.22rem * var(--nav-progress)));
          padding: calc(0.34rem - (0.18rem * var(--nav-progress))) 0.36rem;
          border-radius: 2px 6px 2px 2px;
          font-size: calc(0.74rem + (0.08rem * var(--nav-progress)));
        }
      `}
  }

  ${({ $condensed, $textOnly }) =>
    $condensed &&
    !$textOnly &&
    css`
      --nav-icon-size: clamp(1.34rem, 3.2vw, 1.72rem);

      grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
      gap: clamp(0.16rem, 0.5vw, 0.34rem);
      margin-top: calc(0.3rem - (0.16rem * var(--nav-progress)));

      > a,
      > button {
        justify-content: center;
        min-width: 0;
        min-height: 2.12rem;
        padding-inline: clamp(0.2rem, 0.7vw, 0.42rem);
        border-radius: 7px;
      }
    `}

`;

const MobileNavPanel = styled.div`
  ${({ $retrievalWorkspace }) => $retrievalWorkspace && css`
    display: none;
  `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    position: relative;
    z-index: 1;
    overflow: hidden;
    max-height: ${({ $open }) => ($open ? '280px' : '0')};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    transition:
      max-height 240ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 180ms ease,
      visibility 0s linear ${({ $open }) => ($open ? '0s' : '240ms')};
  }
`;

const navControlStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.36rem;
  padding: 0.46rem 0.68rem;
  flex: none;
  width: 100%;
  min-width: 0;
  min-height: 2.35rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 1.14;
  text-align: left;

  border-radius: 10px;
  text-decoration: none;

  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: clamp(0.018em, 0.01em + 0.03vw, 0.04em);
  font-weight: 700;
  font-size: 0.84rem;

  color: rgba(240, 240, 240, 0.95);
  background:
    linear-gradient(135deg, rgba(20, 31, 66, 0.96), rgba(10, 35, 54, 0.94) 52%, rgba(37, 17, 66, 0.94));
  border: 1px solid rgba(97, 221, 255, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 0 2px rgba(0, 255, 200, 0.06),
    0 0 14px rgba(73, 137, 255, 0.08);

  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;

  &:hover {
    background:
      linear-gradient(135deg, rgba(34, 57, 112, 0.98), rgba(11, 58, 76, 0.96) 52%, rgba(66, 28, 102, 0.96));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      0 0 0 2px rgba(0, 255, 200, 0.14),
      0 0 22px rgba(0, 206, 255, 0.24),
      0 0 34px rgba(122, 82, 255, 0.14);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: flex-start;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding: 0.32rem 0.48rem;
    border-radius: 8px;
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.035em;
    box-shadow: 0 0 0 1px rgba(0, 255, 200, 0.08);
  }

  @media (prefers-reduced-motion: reduce) {
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      background 120ms ease;
  }
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
  filter: drop-shadow(0 0 5px rgba(60, 217, 255, 0.24));
`;

const NavLabel = styled.span`
  --nav-label-progress: min(1, calc(var(--header-progress) * 1.35));

  display: inline-block;
  max-width: calc(6.8rem - (6.8rem * var(--nav-label-progress)));
  opacity: calc(1 - var(--nav-label-progress));
  overflow: hidden;
  transform: translateY(calc(-4px * var(--nav-label-progress)));
  transition:
    max-width var(--header-duration) var(--header-ease),
    opacity 220ms ease,
    transform var(--header-duration) var(--header-ease);
  vertical-align: bottom;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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
  padding: 0.34rem 0.62rem 0.32rem;
  border: 1px solid rgba(103, 239, 200, 0.72);
  border-left-width: 5px;
  border-radius: 2px 7px 2px 2px;
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.22), transparent 24%),
    rgba(5, 13, 21, 0.98);
  color: rgba(232, 255, 250, 0.98);
  box-shadow:
    0 0 0 1px rgba(127, 215, 255, 0.14),
    0 6px 18px rgba(0, 0, 0, 0.55),
    0 0 16px rgba(76, 198, 193, 0.16);
  font: 900 0.68rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: none;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 200, 0),
    rgba(0, 255, 200, 0.25),
    rgba(0, 255, 200, 0)
  );
`;

const ToastRow = styled.div`
  padding-block: 0 calc(0.86rem - (0.44rem * var(--header-progress)));
  padding-inline: calc(1.25rem - (0.53rem * var(--header-progress)));
  transition:
    padding-block var(--header-duration) var(--header-ease),
    padding-inline var(--header-duration) var(--header-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-block: 0 calc(0.5rem - (0.18rem * var(--header-progress)));
    padding-inline: calc(0.58rem - (0.16rem * var(--header-progress)));
  }

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) and (max-width: 899px) {
    ${({ $retrievalPage }) =>
      $retrievalPage &&
      css`
        padding-block: 0 calc(0.48rem - (0.18rem * var(--header-progress)));
        padding-inline: calc(0.72rem - (0.22rem * var(--header-progress)));
      `}
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  ${({ $boxPage }) =>
    $boxPage &&
    css`
      padding: 0.15rem 0.65rem 0.22rem;

      & > div {
        min-height: 40px;
        margin-block: 0;
        padding-block: 0.15rem;
      }
    `}

  ${({ $retrievalWorkspace }) => $retrievalWorkspace && css`
    padding: 0 0.48rem 0.34rem;
  `}
`;

const OperationsConsoleFinderMount = styled.div`
  display: ${({ $active }) => ($active ? 'block' : 'none')};
  flex: 1 1 auto;
  min-width: 0;

  &:empty {
    display: none;
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
  gap: 0.25rem;
  min-width: 0;
  border: 1px solid rgba(76, 198, 193, 0.34);
  border-radius: 3px 7px 3px 3px;
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.08), transparent 36%),
    rgba(6, 11, 17, 0.96);
  box-shadow:
    inset 3px 0 0 rgba(76, 198, 193, 0.58),
    0 3px 12px rgba(0, 0, 0, 0.24);
  padding: 0.12rem 0.18rem;
  animation: retrieval-console-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) both;

  @keyframes retrieval-console-enter {
    from {
      opacity: 0;
      transform: translateY(-8px) scaleY(0.94);
      transform-origin: top;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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
  font-family:
    'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo,
    Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(var(--box-primary-rgb), 0.32);
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
  color: rgba(224, 229, 235, 0.66);
  font-weight: 650;
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
  font-family:
    'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo,
    Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 0.78rem;
  font-weight: 860;
  letter-spacing: 0.055em;
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

const geometryOrbit = keyframes`
  to { transform: rotate(360deg); }
`;

const geometryCounterOrbit = keyframes`
  to { transform: rotate(-360deg); }
`;

const geometryCommitPulse = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(76, 198, 193, 0.2); }
  45% { box-shadow: 0 0 22px rgba(127, 215, 255, 0.95), 0 0 42px rgba(76, 198, 193, 0.52); }
`;

const geometryFilteredPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 1px rgba(190, 120, 255, 0.18), 0 0 13px rgba(169, 92, 255, 0.32), inset 0 0 12px rgba(213, 166, 255, 0.1);
  }
  50% {
    box-shadow: 0 0 0 1px rgba(218, 174, 255, 0.34), 0 0 25px rgba(181, 105, 255, 0.58), inset 0 0 17px rgba(221, 181, 255, 0.16);
  }
`;

const RescueConsoleTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  align-self: ${({ $operationsFinderOpen }) =>
    $operationsFinderOpen ? 'flex-start' : 'center'};
  margin-top: 0;
  margin-left: auto;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(255, 182, 72, 0.96)' : 'rgba(76, 198, 193, 0.68)'};
  border-radius: 7px;
  padding: 0;
  color: ${({ $active }) =>
    $active ? 'rgba(255, 240, 196, 0.98)' : 'rgba(127, 215, 255, 0.96)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(82, 52, 12, 0.96), rgba(38, 21, 6, 0.96))'
      : 'rgba(7, 25, 35, 0.86)'};
  box-shadow: ${({ $active }) =>
    $active
      ? '0 0 0 1px rgba(255, 182, 72, 0.18), 0 0 18px rgba(255, 182, 72, 0.34), inset 0 0 14px rgba(255, 225, 138, 0.12)'
      : 'none'};
  cursor: pointer;
  transition:
    border-color 140ms ease,
    color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease;

  ${({ $retrievalConsoleDismiss }) => $retrievalConsoleDismiss && css`
    width: 44px;
    height: 44px;
    align-self: start;
    margin: 0.2rem 0.12rem 0 0;
  `}

  ${({ $pulse }) =>
    $pulse &&
    css`
      animation: ${geometryCommitPulse} 620ms ease-out both;
    `}

  ${({ $retrievalDocked }) => $retrievalDocked && css`
    animation: ${geometryCommitPulse} 1.8s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `}

  svg {
    width: 20px;
    height: 20px;
    overflow: visible;
    filter: ${({ $active }) =>
      $active
        ? 'drop-shadow(0 0 5px rgba(255, 214, 102, 0.92))'
        : 'drop-shadow(0 0 3px rgba(127, 215, 255, 0.75))'};
  }

  .orbit {
    transform-origin: 12px 12px;
    animation: ${geometryOrbit} 8s linear infinite;
  }

  .counter-orbit {
    transform-origin: 12px 12px;
    animation: ${geometryCounterOrbit} 5.5s linear infinite;
  }

  &:hover,
  &:focus-visible {
    border-color: ${({ $active }) =>
      $active ? 'rgba(255, 213, 120, 0.98)' : 'rgba(127, 215, 255, 0.94)'};
    color: rgba(230, 237, 243, 0.98);
    background: ${({ $active }) =>
      $active
        ? 'linear-gradient(180deg, rgba(111, 71, 18, 0.98), rgba(56, 31, 8, 0.98))'
        : 'rgba(18, 58, 62, 0.92)'};
    box-shadow: ${({ $active }) =>
      $active
        ? '0 0 16px rgba(255, 191, 73, 0.42), inset 0 0 16px rgba(255, 229, 148, 0.18)'
        : '0 0 12px rgba(76, 198, 193, 0.22)'};
  }

  ${({ $boxThemed, $active }) =>
    $boxThemed &&
    css`
      border-color: rgba(var(--box-primary-rgb), ${$active ? '0.92' : '0.62'});
      color: var(--box-neon);
      background:
        linear-gradient(
          145deg,
          rgba(var(--box-primary-rgb), ${$active ? '0.27' : '0.14'}),
          rgba(var(--box-secondary-rgb), ${$active ? '0.16' : '0.07'})
        ),
        rgba(7, 18, 26, 0.94);
      box-shadow:
        0 0 ${$active ? '17px' : '10px'} rgba(var(--box-primary-rgb), ${$active ? '0.3' : '0.12'}),
        inset 0 0 12px rgba(var(--box-secondary-rgb), 0.08);

      svg {
        filter: drop-shadow(0 0 4px rgba(var(--box-primary-rgb), 0.78));
      }

      &:hover,
      &:focus-visible {
        border-color: var(--box-neon);
        color: #f4f8fa;
        background:
          linear-gradient(
            145deg,
            rgba(var(--box-primary-rgb), 0.32),
            rgba(var(--box-secondary-rgb), 0.19)
          ),
          rgba(7, 18, 26, 0.96);
        box-shadow:
          0 0 18px rgba(var(--box-primary-rgb), 0.3),
          inset 0 0 14px rgba(var(--box-secondary-rgb), 0.12);
      }
    `}

  ${({ $filtersActive }) =>
    $filtersActive &&
    css`
      border-color: rgba(210, 157, 255, 0.96);
      color: rgba(239, 218, 255, 0.98);
      background:
        linear-gradient(145deg, rgba(105, 42, 161, 0.9), rgba(35, 14, 61, 0.96)),
        rgba(8, 14, 25, 0.96);
      animation: ${geometryFilteredPulse} 2.4s ease-in-out infinite;

      svg {
        filter: drop-shadow(0 0 6px rgba(210, 157, 255, 0.95));
      }

      .orbit {
        animation: ${geometryCounterOrbit} 4.2s linear infinite;
      }

      .counter-orbit {
        animation: ${geometryOrbit} 6.8s linear infinite;
      }

      &:hover,
      &:focus-visible {
        border-color: rgba(235, 207, 255, 1);
        color: #ffffff;
        background:
          linear-gradient(145deg, rgba(127, 52, 189, 0.96), rgba(47, 17, 79, 0.98)),
          rgba(8, 14, 25, 0.98);
        box-shadow: 0 0 28px rgba(193, 126, 255, 0.62), inset 0 0 18px rgba(226, 191, 255, 0.18);
      }
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 0 0
      ${({ $operationsFinderOpen }) =>
        $operationsFinderOpen ? '38px' : MOBILE_CONTROL_MIN_HEIGHT};
    width: ${({ $operationsFinderOpen }) =>
      $operationsFinderOpen ? '38px' : MOBILE_CONTROL_MIN_HEIGHT};
    height: ${({ $operationsFinderOpen }) =>
      $operationsFinderOpen ? '38px' : MOBILE_CONTROL_MIN_HEIGHT};
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;

    .orbit,
    .counter-orbit {
      animation: none;
    }
  }
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

const IDLE_SIGNAL_FRAMES = [
  '╾━ ◇ ━━━━━╼',
  '╾━━ ◇ ━━━━╼',
  '╾━━━ ◈ ━━━╼',
  '╾━━━━ ◇ ━━╼',
  '╾━━━━━ ◇ ━╼',
  '╾━━━━ ◈ ━━╼',
  '╾━━━ ◇ ━━━╼',
  '╾━━ ◇ ━━━━╼',
];

const SEARCH_CONTROL_FRAMES = [
  'SEARCH CONTROLS >',
  'SEARCH CONTROLS ─>',
  'SEARCH CONTROLS ──>',
  'SEARCH CONTROLS ───>',
  'SEARCH CONTROLS ────>',
  'SEARCH CONTROLS ─────>',
];

const IdleAsciiArt = styled.span`
  display: inline-grid;
  grid-template-columns: ${({ $searchPrompt }) =>
    $searchPrompt ? 'auto minmax(0, 1fr)' : 'auto auto'};
  align-items: center;
  gap: 0.65rem;
  width: ${({ $searchPrompt }) => ($searchPrompt ? '100%' : 'auto')};
  min-width: 0;
  color: var(--idle-signal-primary);
  font-family: 'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace,
    Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.68rem, 1.6vw, 0.82rem);
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px color-mix(in srgb, var(--idle-signal-primary) 42%, transparent);
`;

const IdleAsciiFrame = styled.span`
  color: var(--idle-signal-primary);
  white-space: pre;
`;

const SearchControlFrame = styled(IdleAsciiFrame)`
  overflow: hidden;
  color: var(--idle-signal-secondary);
  font-size: clamp(0.62rem, 3vw, 0.76rem);
  font-weight: 800;
  letter-spacing: 0.09em;
  text-overflow: clip;
  text-shadow:
    0 0 8px color-mix(in srgb, var(--idle-signal-primary) 50%, transparent),
    0 0 16px color-mix(in srgb, var(--idle-signal-secondary) 32%, transparent);
`;

const IdleAsciiStatus = styled.span`
  color: var(--idle-signal-secondary);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  opacity: 0.74;
  white-space: nowrap;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }
`;

function IdleAsciiSignal({ palette, searchPrompt = false }) {
  const [frame, setFrame] = useState(0);
  const frames = searchPrompt ? SEARCH_CONTROL_FRAMES : IDLE_SIGNAL_FRAMES;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return undefined;

    const intervalId = window.setInterval(() => {
      setFrame((current) => (current + 1) % frames.length);
    }, 260);

    return () => window.clearInterval(intervalId);
  }, [frames.length]);

  return (
    <IdleAsciiArt
      role="img"
      aria-label={searchPrompt ? 'Search controls available' : 'Idle warp core signal'}
      $searchPrompt={searchPrompt}
      style={{
        '--idle-signal-primary': palette.primary,
        '--idle-signal-secondary': palette.secondary,
      }}
    >
      {searchPrompt ? (
        <>
          <IdleAsciiFrame aria-hidden="true">
            {IDLE_SIGNAL_FRAMES[frame % IDLE_SIGNAL_FRAMES.length]}
          </IdleAsciiFrame>
          <SearchControlFrame aria-hidden="true">{frames[frame]}</SearchControlFrame>
        </>
      ) : (
        <>
          <IdleAsciiFrame aria-hidden="true">{frames[frame]}</IdleAsciiFrame>
          <IdleAsciiStatus aria-hidden="true">CORE IDLE // SIGNAL NOMINAL</IdleAsciiStatus>
        </>
      )}
    </IdleAsciiArt>
  );
}

export default function Header() {
  const location = useLocation();
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
  const [allItemsFilterState, setAllItemsFilterState] = useState({
    expanded: true,
    searchQuery: '',
  });
  const [allItemsTickerData, setAllItemsTickerData] = useState({ loading: true });
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
    if (isAllItemsPage) {
      window.dispatchEvent(new CustomEvent(ALL_ITEMS_FILTERS_TOGGLE_EVENT));
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
    const handleAllItemsFilters = (event) => {
      setAllItemsFilterState((current) => ({ ...current, ...event.detail }));
      setIsOperationsFinderOpen(Boolean(event.detail?.expanded));
    };
    window.addEventListener(ALL_ITEMS_FILTERS_STATE_EVENT, handleAllItemsFilters);
    return () => {
      window.removeEventListener(ALL_ITEMS_FILTERS_STATE_EVENT, handleAllItemsFilters);
    };
  }, []);

  useEffect(() => {
    const handleAllItemsInsights = (event) => {
      setAllItemsTickerData(event.detail || { loading: true });
    };
    window.addEventListener(ALL_ITEMS_INSIGHTS_STATE_EVENT, handleAllItemsInsights);
    return () => {
      window.removeEventListener(ALL_ITEMS_INSIGHTS_STATE_EVENT, handleAllItemsInsights);
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
      data-app-header="true"
      style={headerStyle}
      $retrievalPage={isRetrievalPage}
      $retrievalWorkspace={isRetrievalWorkspace}
      $allowFinderOverflow={
        (isOperationsPage && isOperationsFinderOpen) || showRetrievalConsole
      }
    >
      <Inner
        $boxPage={isBoxDetailPage}
        $retrievalPage={isRetrievalPage}
        $retrievalWorkspace={isRetrievalWorkspace}
      >
        <TopRow $retrievalWorkspace={isRetrievalWorkspace}>
          <Brand
            to="/operations"
            onClick={(event) => {
              event.preventDefault();
              returnToOperationsHome();
            }}
          >
            <Title>
              <Big>DISCO WARP CORE</Big>
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
                aria-label="Operations"
                data-nav-tooltip="Operations"
                onClick={handleNavSelection}
              >
                <img src={operationsNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/retrieval"
                aria-label="Retrieval"
                data-nav-tooltip="Retrieval"
                $active={isRetrievalPage}
                onClick={handleNavSelection}
              >
                <img src={logsNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/intake"
                aria-label="Intake"
                data-nav-tooltip="Intake"
                onClick={handleNavSelection}
              >
                <img src={declutterNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/import"
                aria-label="Import"
                data-nav-tooltip="Import"
                onClick={handleNavSelection}
              >
                <img src={allItemsNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/all-items"
                aria-label="All Items"
                data-nav-tooltip="All Items"
                onClick={handleNavSelection}
              >
                <img src={importNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/declutter"
                aria-label="Declutter"
                data-nav-tooltip="Declutter"
                onClick={handleNavSelection}
              >
                <img src={intakeNavIcon} alt="" />
              </RetrievalMiniNavLink>
              <RetrievalMiniNavLink
                to="/logs"
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
              <Pip $c="#ff7a18" />
              <Pip $c="#22d3ee" />
              <Pip $c="#a78bfa" />
              <Pip $c="#00ffcc" />
            </LcarsPips>

            <MobileMenuToggle
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

        <MobileAmbientGap
          aria-hidden="true"
          $show={isMobile && !isMobileMenuOpen}
        />

        <MobileNavPanel
          id={mobileControlsId}
          $open={!isMobile || isMobileMenuOpen}
          $retrievalWorkspace={isRetrievalWorkspace}
          aria-hidden={isMobile ? !isMobileMenuOpen : undefined}
          inert={isMobile && !isMobileMenuOpen ? true : undefined}
        >
          <NavRow
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
            isDeclutterPage
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
          idleText={
            isDeclutterPage
              ? ''
              : isOperationsPage
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
              : isAllItemsPage && allItemsFilterState.searchQuery
                  ? `All Items · ${allItemsFilterState.searchQuery}`
                : isAllItemsPage
                  ? <AllItemsHeaderTicker data={allItemsTickerData} />
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
            isDeclutterPage || isOperationsPage || isBoxDetailPage || isRetrievalPage || isLogsPage || isIntakeIdleSignal
              ? null
              : {
                  onClick: openOperationsFinder,
                  ariaLabel: isBoxDetailPage
                    ? 'Open box search'
                    : isRetrievalPage
                      ? 'Open retrieval search'
                      : isAllItemsPage
                        ? allItemsFilterState.expanded
                          ? 'Collapse All Items filters'
                          : 'Open All Items filters'
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
            isDeclutterPage ? (
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
                      : isAllItemsPage
                        ? 'Toggle All Items filters'
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
                      : isAllItemsPage
                        ? 'All Items filters'
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
