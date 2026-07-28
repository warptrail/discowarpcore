import { useContext, useEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import Toast from './Toast/Toast';
import { ToastContext } from './Toast';
import useIsMobile from '../hooks/useIsMobile';
import useRandomItemFlow from '../hooks/useRandomItemFlow';
import {
  BOX_FINDER_CLOSE_EVENT,
  BOX_FINDER_OPEN_EVENT,
  BOX_FINDER_STATE_EVENT,
  BOX_CONTEXT_STATE_EVENT,
  INVENTORY_FINDER_CLOSE_EVENT,
  INVENTORY_FINDER_COMMIT_EVENT,
  INVENTORY_FINDER_OPEN_EVENT,
  INVENTORY_FINDER_STATE_EVENT,
  RETRIEVAL_FINDER_CLOSE_EVENT,
  RETRIEVAL_FINDER_OPEN_EVENT,
  RETRIEVAL_FINDER_STATE_EVENT,
} from '../constants/inventoryFinderEvents';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_MAX_WIDTH,
  MOBILE_NARROW_BREAKPOINT,
} from '../styles/tokens';

// ===============
// LCARS-ish Styles
// ===============

const HEADER_SCROLL_RANGE = 120;
const MIN_HEADER_SCROLL_RANGE = 72;
const SHORT_PAGE_SCROLL_COMPLETION_RATIO = 0.42;

const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

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
  overflow: hidden;
  transition:
    background var(--header-duration) var(--header-ease),
    backdrop-filter var(--header-duration) var(--header-ease),
    border-color var(--header-duration) var(--header-ease),
    border-radius var(--header-duration) var(--header-ease),
    box-shadow var(--header-duration) var(--header-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 10px;
    box-shadow:
      0 0 0 1px rgba(0, 255, 200, 0.09),
      0 4px 14px rgba(0, 0, 0, 0.28);
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

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  ${({ $boxPage }) =>
    $boxPage &&
    css`
      padding-block: 0;
      padding-inline: 0.65rem;
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
    border-radius: 8px;
    border: 1px solid rgba(0, 255, 200, 0.26);
    background: ${({ $open }) =>
      $open ? 'rgba(0, 255, 200, 0.18)' : 'rgba(20, 34, 46, 0.92)'};
    color: rgba(240, 245, 250, 0.96);
    box-shadow:
      0 0 0 1px rgba(0, 255, 200, 0.1),
      0 0 0 2px rgba(0, 255, 200, 0.05);
    appearance: none;
    cursor: pointer;
    transition:
      background 180ms ease,
      box-shadow 180ms ease,
      transform 120ms ease;

    &:hover {
      background: rgba(0, 255, 200, 0.2);
      box-shadow:
        0 0 0 1px rgba(0, 255, 200, 0.18),
        0 0 14px rgba(0, 255, 200, 0.2);
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

  margin-top: calc(0.72rem - (0.44rem * var(--header-progress)));
  transition:
    margin-top var(--header-duration) var(--header-ease),
    gap var(--header-duration) var(--header-ease);

  display: flex;
  flex-wrap: wrap;
  gap: var(--nav-gap);
  align-items: stretch;
  justify-content: flex-start;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 1220px) {
    --nav-gap: calc(0.6rem - (0.26rem * var(--nav-progress)));
    --nav-expanded-size: calc((100% - (4.2rem - (1.82rem * var(--nav-progress)))) / 8);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    --nav-icon-size: 1.86rem;
    --nav-readable-size: 9.5rem;
    --nav-gap: calc(0.38rem - (0.14rem * var(--nav-progress)));
    --nav-expanded-size: calc((100% - (0.76rem - (0.28rem * var(--nav-progress)))) / 3);

    margin-top: calc(0.42rem - (0.18rem * var(--header-progress)));
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    --nav-expanded-size: calc((100% - (0.38rem - (0.14rem * var(--nav-progress)))) / 2);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const MobileNavPanel = styled.div`
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
  justify-content: center;
  gap: calc(0.48rem - (0.48rem * var(--nav-progress)));
  padding-block: calc(0.55rem - (0.55rem * var(--nav-progress)));
  padding-inline: calc(1rem - (1rem * var(--nav-progress)));
  flex: 0 1 calc(max(var(--nav-expanded-size), var(--nav-readable-size)) - ((max(var(--nav-expanded-size), var(--nav-readable-size)) - var(--nav-icon-size)) * var(--nav-progress)));
  width: calc(max(var(--nav-expanded-size), var(--nav-readable-size)) - ((max(var(--nav-expanded-size), var(--nav-readable-size)) - var(--nav-icon-size)) * var(--nav-progress)));
  min-width: calc(var(--nav-readable-size) - ((var(--nav-readable-size) - var(--nav-icon-size)) * var(--nav-progress)));
  min-height: calc(2.35rem - (0.3rem * var(--header-progress)));
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 1.14;
  text-align: center;

  border-radius: 10px;
  text-decoration: none;

  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: clamp(0.018em, 0.01em + 0.03vw, 0.04em);
  font-weight: 700;
  font-size: calc(0.84rem + (0.16rem * var(--nav-progress)));

  color: rgba(240, 240, 240, 0.95);
  background: rgba(20, 34, 46, 0.9);
  border: 1px solid rgba(0, 255, 200, 0.22);
  box-shadow: 0 0 0 2px rgba(0, 255, 200, 0.06);

  transition:
    width var(--header-duration) var(--header-ease),
    min-height var(--header-duration) var(--header-ease),
    padding var(--header-duration) var(--header-ease),
    gap var(--header-duration) var(--header-ease),
    font-size var(--header-duration) var(--header-ease),
    transform 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;

  &:hover {
    background: rgba(0, 255, 200, 0.14);
    box-shadow:
      0 0 0 2px rgba(0, 255, 200, 0.12),
      0 0 18px rgba(0, 255, 200, 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: center;
    min-height: calc(${MOBILE_CONTROL_MIN_HEIGHT} - (0.64rem * var(--nav-progress)));
    padding-block: calc(0.36rem - (0.36rem * var(--nav-progress)));
    padding-inline: calc(0.34rem - (0.34rem * var(--nav-progress)));
    border-radius: 8px;
    font-size: calc(${MOBILE_FONT_SM} + (0.12rem * var(--nav-progress)));
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
  line-height: 1;
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
`;

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

const RescueConsoleTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
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

  ${({ $pulse }) =>
    $pulse &&
    css`
      animation: ${geometryCommitPulse} 620ms ease-out both;
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: ${MOBILE_CONTROL_MIN_HEIGHT};
    height: ${MOBILE_CONTROL_MIN_HEIGHT};
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

export default function Header() {
  const location = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [committedSearch, setCommittedSearch] = useState('');
  const [isOperationsFinderOpen, setIsOperationsFinderOpen] = useState(false);
  const [boxContext, setBoxContext] = useState(null);
  const [boxFinderState, setBoxFinderState] = useState({
    mode: 'closed',
    query: '',
    matchCount: 0,
    sortMode: 'treeOrder',
  });
  const [searchPulse, setSearchPulse] = useState(false);
  const [retrievalScrollCompact, setRetrievalScrollCompact] = useState(false);
  const retrievalScrollTimerRef = useRef(null);
  const retrievalLastScrollYRef = useRef(0);
  const retrievalIgnoreScrollUntilRef = useRef(0);
  const isBoxDetailPage = /^\/boxes\/[^/]+\/?$/.test(location.pathname);
  const isRetrievalPage = /^\/retrieval\/?$/.test(location.pathname);
  const isMobile = useIsMobile(MOBILE_MAX_WIDTH);
  const mobileControlsId = 'mobile-header-controls';

  const toastCtx = useContext(ToastContext);
  const toast = toastCtx?.toast ?? null;
  const hideToast = toastCtx?.hideToast;
  const activeRetrievalItem = toastCtx?.activeRetrievalItem ?? null;
  const { runRandomItem } = useRandomItemFlow();

  const openOperationsFinder = () => {
    const openEvent = isBoxDetailPage
      ? BOX_FINDER_OPEN_EVENT
      : isRetrievalPage
        ? RETRIEVAL_FINDER_OPEN_EVENT
        : INVENTORY_FINDER_OPEN_EVENT;
    const closeEvent = isBoxDetailPage
      ? BOX_FINDER_CLOSE_EVENT
      : isRetrievalPage
        ? RETRIEVAL_FINDER_CLOSE_EVENT
        : INVENTORY_FINDER_CLOSE_EVENT;

    window.dispatchEvent(
      new CustomEvent(
        isOperationsFinderOpen ? closeEvent : openEvent,
      ),
    );
  };

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
      if (event.type === BOX_FINDER_STATE_EVENT) {
        setBoxFinderState((current) => ({ ...current, ...event.detail }));
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
    setIsOperationsFinderOpen(false);
    setBoxFinderState({
      mode: 'closed',
      query: '',
      matchCount: 0,
      sortMode: 'treeOrder',
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!isRetrievalPage || !isOperationsFinderOpen) {
      setRetrievalScrollCompact(false);
      retrievalLastScrollYRef.current = window.scrollY;
      if (retrievalScrollTimerRef.current) {
        window.clearTimeout(retrievalScrollTimerRef.current);
        retrievalScrollTimerRef.current = null;
      }
      return undefined;
    }

    retrievalLastScrollYRef.current = window.scrollY;
    const handleRetrievalScroll = () => {
      const nextScrollY = window.scrollY;
      if (Date.now() < retrievalIgnoreScrollUntilRef.current) {
        retrievalLastScrollYRef.current = nextScrollY;
        return;
      }
      if (Math.abs(nextScrollY - retrievalLastScrollYRef.current) < 1) return;
      retrievalLastScrollYRef.current = nextScrollY;
      setRetrievalScrollCompact(true);
      if (retrievalScrollTimerRef.current) {
        window.clearTimeout(retrievalScrollTimerRef.current);
      }
      retrievalScrollTimerRef.current = window.setTimeout(() => {
        retrievalIgnoreScrollUntilRef.current = Date.now() + 500;
        setRetrievalScrollCompact(false);
        retrievalScrollTimerRef.current = null;
      }, 2000);
    };

    window.addEventListener('scroll', handleRetrievalScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleRetrievalScroll);
      if (retrievalScrollTimerRef.current) {
        window.clearTimeout(retrievalScrollTimerRef.current);
        retrievalScrollTimerRef.current = null;
      }
    };
  }, [isOperationsFinderOpen, isRetrievalPage]);

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
      setScrollProgress((previousProgress) => {
        const maxScrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollRange = clamp(
          maxScrollable * SHORT_PAGE_SCROLL_COMPLETION_RATIO,
          MIN_HEADER_SCROLL_RANGE,
          HEADER_SCROLL_RANGE
        );
        const nextProgress = clamp(window.scrollY / scrollRange);
        return Math.abs(nextProgress - previousProgress) < 0.01
          ? previousProgress
          : nextProgress;
      });
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
    };
  }, []);

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
    runRandomItem();
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const effectiveHeaderProgress = isBoxDetailPage
    ? 1
    : scrollProgress;
  const headerStyle = {
    '--header-progress': effectiveHeaderProgress.toFixed(3),
  };
  const isHeaderCondensed = effectiveHeaderProgress >= 0.98;

  return (
    <HeaderShell style={headerStyle}>
      <Inner $boxPage={isBoxDetailPage}>
        <TopRow>
          <Brand to="/">
            <Title>
              <Big>DISCO WARP CORE</Big>
            </Title>
          </Brand>

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
          aria-hidden={isMobile ? !isMobileMenuOpen : undefined}
          inert={isMobile && !isMobileMenuOpen ? true : undefined}
        >
          <NavRow>
            <NavButton
              to="/operations"
              aria-label="Operations"
              title="Operations"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">🚀</NavIcon>
              <NavLabel>Operations</NavLabel>
            </NavButton>
            <NavButton
              to="/retrieval"
              aria-label="Retrieval"
              title="Retrieval"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">🔎</NavIcon>
              <NavLabel>Retrieval</NavLabel>
            </NavButton>
            <NavButton
              to="/intake"
              aria-label="Intake"
              title="Intake"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">📲</NavIcon>
              <NavLabel>Intake</NavLabel>
            </NavButton>
            <NavButton
              to="/import"
              aria-label="Import"
              title="Import"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">📥</NavIcon>
              <NavLabel>Import</NavLabel>
            </NavButton>
            <NavButton
              to="/all-items"
              aria-label="All Items"
              title="All Items"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">🧾</NavIcon>
              <NavLabel>All Items</NavLabel>
            </NavButton>
            <NavButton
              to="/declutter"
              aria-label="Declutter"
              title="Declutter"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">🧹</NavIcon>
              <NavLabel>Declutter</NavLabel>
            </NavButton>
            <NavButton
              to="/logs"
              aria-label="Logs"
              title="Logs"
              onClick={handleNavSelection}
            >
              <NavIcon aria-hidden="true">🛰️</NavIcon>
              <NavLabel>Logs</NavLabel>
            </NavButton>
            <NavActionButton
              type="button"
              aria-label="Random"
              title="Random"
              onClick={handleRandomSelection}
            >
              <NavIcon aria-hidden="true">🎲</NavIcon>
              <NavLabel>Random</NavLabel>
            </NavActionButton>
          </NavRow>
        </MobileNavPanel>
      </Inner>

      <Divider />

      <ToastRow $boxPage={isBoxDetailPage}>
        <Toast
          open={!!toast}
          title={toast?.title}
          titleDetails={toast?.titleDetails}
          titleAlign={toast?.titleAlign}
          titleSize={toast?.titleSize}
          message={toast?.message}
          content={toast?.content}
          variant={toast?.variant ?? 'info'}
          loading={!!toast?.loading}
          actions={toast?.actions ?? []}
          onClose={
            toast &&
            toast.id !== 'item-page-actions' &&
            !String(toast.id || '').startsWith('edit-item-actions:')
              ? handleToastClose
              : typeof activeRetrievalItem?.onCollapse === 'function'
                ? activeRetrievalItem.onCollapse
                : undefined
          }
          showIdle
          idleIcon="📦"
          idleText={
            isBoxDetailPage && boxContext
              ? boxFinderState.mode === 'minimized' && boxFinderState.query
                ? `#${boxContext.shortId} · ${boxFinderState.query} · ${boxFinderState.matchCount} ${
                    boxFinderState.matchCount === 1 ? 'match' : 'matches'
                  }`
                : `#${boxContext.shortId} · ${boxContext.title}${
                    boxContext.location ? ` · ${boxContext.location}` : ''
                  }`
              : committedSearch
                ? `Searching: ${committedSearch}`
                : 'What are you looking for?'
          }
          idleAction={{
            onClick: openOperationsFinder,
            ariaLabel: isBoxDetailPage
              ? 'Open box search'
              : isRetrievalPage
                ? 'Open retrieval search'
                : 'Open item finder',
          }}
          calmIdle={isBoxDetailPage}
          idleAddon={
            <RescueConsoleTrigger
              type="button"
              onClick={openOperationsFinder}
              data-box-finder-trigger={isBoxDetailPage ? true : undefined}
              aria-label={
                isBoxDetailPage
                  ? 'Toggle box quick search'
                  : isRetrievalPage
                    ? 'Toggle retrieval search'
                    : 'Open item finder from search icon'
              }
              title={
                isBoxDetailPage
                  ? 'Search this box'
                  : isRetrievalPage
                    ? 'Retrieval search'
                    : 'Open item finder'
              }
              $active={
                isBoxDetailPage
                  ? boxFinderState.mode === 'expanded' ||
                    !!boxFinderState.query ||
                    boxFinderState.sortMode !== 'treeOrder'
                  : isOperationsFinderOpen
              }
              $pulse={searchPulse}
            >
              <FinderGeometryGlyph />
            </RescueConsoleTrigger>
          }
          activeRetrievalItem={activeRetrievalItem}
          retrievalScrollCompact={retrievalScrollCompact}
          compact={isHeaderCondensed}
          compactProgress={isBoxDetailPage ? 1.35 : effectiveHeaderProgress}
        />
      </ToastRow>
    </HeaderShell>
  );
}
