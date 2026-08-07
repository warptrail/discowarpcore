// Toast.jsx
import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_NARROW_BREAKPOINT,
} from '../../styles/tokens';
import RetrievalConsoleControls from '../Retrieval/RetrievalConsoleControls';
import houseCommandIcon from '../../assets/house-command-icon.png';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../../util/inventoryColorTheme';

const commandAmbientDrift = keyframes`
  0% {
    background-position:
      9% 50%,
      92% 50%,
      42% 50%;
    opacity: 0.52;
  }
  34% {
    background-position:
      21% 50%,
      78% 50%,
      48% 50%;
    opacity: 0.76;
  }
  62% {
    background-position:
      37% 50%,
      64% 50%,
      58% 50%;
    opacity: 0.92;
  }
  100% {
    background-position:
      9% 50%,
      92% 50%,
      42% 50%;
    opacity: 0.52;
  }
`;

const commandSweep = keyframes`
  0%,
  68% {
    opacity: 0;
    transform: translateX(-118%);
  }
  74% {
    opacity: 0.18;
  }
  82%,
  100% {
    opacity: 0;
    transform: translateX(118%);
  }
`;

const idlePromptBlink = keyframes`
  0%,
  48%,
  100% {
    opacity: 1;
  }

  56%,
  68% {
    opacity: 0.42;
  }
`;

const retrievalGhostFlow = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const Wrap = styled.div`
  --toast-compact-progress: 0;
  --toast-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --toast-duration: 280ms;

  position: relative;
  isolation: isolate;
  display: flex;
  gap: calc(0.75rem - (0.3rem * var(--toast-compact-progress)));
  align-items: ${({ $hasContent }) => ($hasContent ? 'flex-start' : 'center')};
  width: 100%;
  margin-block: calc(10px - (6px * var(--toast-compact-progress)));
  margin-inline: 0;
  min-height: ${({ $idle }) =>
    $idle
      ? 'calc(52px - (24px * var(--toast-compact-progress)))'
      : 'calc(48px - (10px * var(--toast-compact-progress)))'};
  background: ${({ $variant, $idle }) =>
    $idle
      ? '#0f141a'
      : $variant === 'command'
        ? `
          radial-gradient(80% 170% at 12% 0%, rgba(34, 211, 238, 0.16), transparent 68%),
          radial-gradient(74% 170% at 86% 12%, rgba(167, 139, 250, 0.16), transparent 70%),
          linear-gradient(180deg, rgba(18, 31, 45, 0.98), rgba(8, 13, 23, 0.98))
        `
        : $variant === 'success'
          ? 'rgba(12, 29, 31, 0.98)'
          : $variant === 'warning'
            ? 'rgba(24, 21, 39, 0.98)'
            : $variant === 'danger'
              ? 'rgba(34, 19, 28, 0.98)'
              : 'rgba(13, 26, 36, 0.98)'};
  border: 1px solid
    ${({ $variant, $idle }) =>
      $idle
        ? 'rgba(255,255,255,0.12)'
        : $variant === 'command'
          ? 'rgba(91, 215, 244, 0.42)'
          : $variant === 'success'
            ? 'rgba(76, 198, 193, 0.5)'
            : $variant === 'warning'
              ? 'rgba(177, 159, 239, 0.54)'
              : $variant === 'danger'
                ? 'rgba(238, 132, 150, 0.58)'
                : 'rgba(127, 215, 255, 0.48)'};
  color: ${({ $idle }) => ($idle ? 'rgba(234,234,234,0.82)' : 'rgba(238, 245, 249, 0.92)')};
  padding-block: ${({ $idle }) =>
    $idle
      ? 'calc(0.62rem - (0.39rem * var(--toast-compact-progress)))'
      : 'calc(0.58rem - (0.22rem * var(--toast-compact-progress)))'};
  padding-left: calc(0.78rem - (0.18rem * var(--toast-compact-progress)));
  padding-right: ${({ $hasClose }) =>
    $hasClose
      ? 'calc(3rem - (0.55rem * var(--toast-compact-progress)))'
      : 'calc(0.78rem - (0.2rem * var(--toast-compact-progress)))'};
  border-radius: calc(7px - (1px * var(--toast-compact-progress)));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 calc(6px - (3px * var(--toast-compact-progress))) calc(16px - (6px * var(--toast-compact-progress))) rgba(0, 0, 0, calc(0.28 - (0.03 * var(--toast-compact-progress))));
  ${({ $themedIdle }) =>
    $themedIdle &&
    css`
      background:
        linear-gradient(
          var(--box-wash-angle, 110deg),
          rgba(var(--box-primary-rgb), 0.16),
          rgba(var(--box-secondary-rgb), 0.075) 48%,
          rgba(15, 20, 26, 0.97) 88%
        );
      border-color: rgba(var(--box-primary-rgb), 0.46);
      color: rgba(242, 245, 248, 0.9);
      box-shadow:
        inset 3px 0 0 rgba(var(--box-primary-rgb), 0.72),
        inset 0 1px 0 rgba(var(--box-secondary-rgb), 0.12),
        0 calc(8px - (4px * var(--toast-compact-progress)))
          calc(20px - (8px * var(--toast-compact-progress)))
          rgba(0, 0, 0, 0.24),
        0 0 13px rgba(var(--box-primary-rgb), 0.08);
    `}
  ${({ $retrievalControls }) =>
    $retrievalControls &&
    css`
      min-height: 0;
      margin-block: 6px;
      padding: 0.48rem 0.62rem 0.48rem 0.78rem;
      border-color: rgba(127, 215, 255, 0.36);
      border-radius: 2px 9px 2px 2px;
      background:
        linear-gradient(90deg, rgba(76, 198, 193, 0.1), transparent 28%),
        linear-gradient(180deg, rgba(14, 23, 32, 0.98), rgba(7, 12, 18, 0.98));
      box-shadow:
        inset 5px 0 0 rgba(76, 198, 193, 0.76),
        inset 0 1px 0 rgba(167, 182, 255, 0.1),
        0 8px 20px rgba(0, 0, 0, 0.24);
    `}
  ${({ $retrievalActive }) =>
    $retrievalActive &&
    css`
      border-color: rgba(var(--box-primary-rgb), 0.58);
      border-left: 5px solid var(--box-primary);
      border-radius: 2px 9px 2px 2px;
      background:
        linear-gradient(
          var(--box-wash-angle, 96deg),
          rgba(var(--box-primary-rgb), 0.17),
          rgba(var(--box-secondary-rgb), 0.06) 46%,
          rgba(8, 14, 20, 0.98) 82%
        );
      box-shadow:
        inset 0 1px 0 rgba(var(--box-secondary-rgb), 0.14),
        0 8px 20px rgba(0, 0, 0, 0.26),
        0 0 14px rgba(var(--box-primary-rgb), 0.09);
    `}
  overflow: ${({ $allowOverflow }) => ($allowOverflow ? 'visible' : 'hidden')};
  transition:
    gap var(--toast-duration) var(--toast-ease),
    margin var(--toast-duration) var(--toast-ease),
    min-height var(--toast-duration) var(--toast-ease),
    padding var(--toast-duration) var(--toast-ease),
    border-radius var(--toast-duration) var(--toast-ease),
    box-shadow var(--toast-duration) var(--toast-ease);

  ${({ $variant, $idle }) =>
    !$idle && $variant === 'command'
      ? css`
          color: rgba(237, 247, 255, 0.98);
          box-shadow:
            0 0 0 1px rgba(0, 255, 200, 0.08),
            0 calc(10px - (4px * var(--toast-compact-progress))) calc(28px - (8px * var(--toast-compact-progress))) rgba(0, 0, 0, 0.34),
            inset 0 0 30px rgba(34, 211, 238, 0.06);

          &::before,
          &::after {
            content: '';
            position: absolute;
            pointer-events: none;
            z-index: 0;
          }

          &::before {
            inset: 0;
            background:
              radial-gradient(
                88% 150% at 16% 50%,
                rgba(34, 211, 238, 0.22) 0%,
                rgba(34, 211, 238, 0) 72%
              ),
              radial-gradient(
                82% 150% at 84% 52%,
                rgba(167, 139, 250, 0.2) 0%,
                rgba(167, 139, 250, 0) 74%
              ),
              linear-gradient(
                94deg,
                rgba(0, 255, 200, 0.03) 0%,
                rgba(94, 226, 255, 0.16) 47%,
                rgba(153, 124, 246, 0.14) 63%,
                rgba(0, 255, 200, 0.03) 100%
              );
            background-size:
              148% 100%,
              142% 100%,
              174% 100%;
            mix-blend-mode: screen;
            animation: ${commandAmbientDrift} 7.8s linear infinite;
          }

          &::after {
            top: calc(0.44rem - (0.18rem * var(--toast-compact-progress)));
            left: calc(0.78rem - (0.24rem * var(--toast-compact-progress)));
            right: calc(0.78rem - (0.24rem * var(--toast-compact-progress)));
            height: 1px;
            background:
              linear-gradient(
                90deg,
                rgba(0, 255, 200, 0),
                rgba(0, 255, 200, 0.44) 34%,
                rgba(167, 139, 250, 0.42) 68%,
                rgba(0, 255, 200, 0)
              ),
              linear-gradient(
                104deg,
                rgba(0, 0, 0, 0) 38%,
                rgba(88, 226, 255, 0.52) 50%,
                rgba(162, 134, 255, 0.42) 55%,
                rgba(0, 0, 0, 0) 66%
              );
            background-size:
              100% 100%,
              180% 100%;
            box-shadow:
              0 0 12px rgba(34, 211, 238, 0.22),
              0 0 18px rgba(167, 139, 250, 0.14);
            animation: ${commandSweep} 9.8s linear infinite;
          }
        `
      : ''}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.5rem;
    margin: 6px 0;
    min-height: 44px;
    padding: 0.5rem 0.6rem;
    padding-right: ${({ $hasClose }) => ($hasClose ? '2.7rem' : '0.6rem')};
    border-radius: ${({ $retrievalControls }) =>
      $retrievalControls ? '2px 7px 2px 2px' : '8px'};
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.24);
  }

  ${({ $itemPageRail }) =>
    $itemPageRail &&
    css`
      min-height: 42px;
      margin-block: 3px;
      padding: 0.38rem 0.5rem;
      border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.46);
      border-radius: 4px;
      background:
        linear-gradient(
          90deg,
          rgba(var(--box-primary-rgb, 76, 198, 193), 0.1),
          rgba(var(--item-accent-rgb, 127, 215, 255), 0.055) 48%,
          transparent 82%
        ),
        #090f16;
      box-shadow:
        inset 3px 0 0 rgba(var(--box-primary-rgb, 76, 198, 193), 0.74),
        inset 0 1px 0 rgba(255, 255, 255, 0.055),
        0 5px 15px rgba(0, 0, 0, 0.22);

      &::before,
      &::after {
        display: none;
      }

      @media (max-width: ${MOBILE_BREAKPOINT}) {
        min-height: 0;
        margin-block: 2px;
        padding: 0.34rem 0.42rem;
        border-radius: 4px;
      }
    `}

  ${({ $fieldCommandRail, $variant }) =>
    $fieldCommandRail &&
    css`
      min-height: 0;
      margin-block: 2px;
      padding: 0.38rem 0.44rem;
      border-color: ${$variant === 'danger'
        ? 'rgba(238, 132, 150, 0.5)'
        : $variant === 'warning'
          ? 'rgba(196, 177, 255, 0.48)'
          : 'rgba(var(--box-primary-rgb, 101, 220, 213), 0.5)'};
      border-radius: 8px;
      background:
        linear-gradient(
          104deg,
          rgba(var(--box-primary-rgb, 68, 207, 201), 0.13),
          transparent 38%,
          rgba(var(--box-secondary-rgb, 162, 137, 236), 0.09) 78%,
          transparent
        ),
        rgba(6, 10, 15, 0.985);
      box-shadow:
        inset 3px 0 0 rgba(var(--box-primary-rgb, 76, 198, 193), 0.72),
        inset 0 1px 0 rgba(255, 255, 255, 0.055),
        0 4px 14px rgba(0, 0, 0, 0.28);

      &::before,
      &::after {
        display: none;
      }

      @media (max-width: ${MOBILE_BREAKPOINT}) {
        margin-block: 2px;
        padding: 0.36rem 0.4rem;
        border-radius: 8px;
      }
    `}

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    flex-direction: column;
    align-items: stretch;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::before,
    &::after {
      animation: none;
    }
  }
`;

const Body = styled.div`
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  display: grid;
  gap: ${({ $hasContent }) =>
    $hasContent
      ? 'calc(0.55rem - (0.19rem * var(--toast-compact-progress)))'
      : 'calc(0.2rem - (0.12rem * var(--toast-compact-progress)))'};
  transition: gap var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.88rem;
    gap: ${({ $hasContent }) => ($hasContent ? '0.4rem' : '0.15rem')};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ItemPageRail = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.34rem;
  }
`;

const FieldCommandRail = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.34rem;
  }
`;

const ItemPageRailContext = styled.div`
  display: grid;
  gap: 0.14rem;
  min-width: 0;
`;

const ItemPageRailActions = styled.div`
  display: flex;
  justify-content: flex-end;
  min-width: 0;

  > * {
    width: 100%;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: flex-start;
  }
`;

const RetrievalControlsShell = styled.div`
  position: relative;
  max-height: ${({ $scrollCompact }) => ($scrollCompact ? '28px' : '1200px')};
  overflow: hidden;
  transition: max-height 180ms cubic-bezier(0.22, 1, 0.36, 1);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: ${({ $scrollCompact }) =>
      $scrollCompact ? MOBILE_CONTROL_MIN_HEIGHT : '1200px'};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 36px;
    height: 28px;
    box-sizing: border-box;
    border: 1px solid rgba(91, 215, 244, 0.36);
    border-radius: 8px;
    background:
      linear-gradient(
        105deg,
        rgba(7, 20, 31, 0.96) 0%,
        rgba(34, 211, 238, 0.24) 24%,
        rgba(76, 198, 193, 0.4) 48%,
        rgba(167, 139, 250, 0.24) 70%,
        rgba(7, 20, 31, 0.96) 100%
      );
    background-size: 220% 100%;
    box-shadow:
      inset 0 0 14px rgba(76, 198, 193, 0.12),
      0 0 12px rgba(34, 211, 238, 0.1);
    opacity: ${({ $scrollCompact }) => ($scrollCompact ? 1 : 0)};
    pointer-events: none;
    transition: opacity 130ms ease;
    animation: ${retrievalGhostFlow} 1.4s ease-in-out infinite;

    @media (max-width: ${MOBILE_BREAKPOINT}) {
      right: calc(${MOBILE_CONTROL_MIN_HEIGHT} + 8px);
      height: ${MOBILE_CONTROL_MIN_HEIGHT};
    }
  }

  > div:first-child {
    padding-right: 2.5rem;
    opacity: ${({ $scrollCompact }) => ($scrollCompact ? 0 : 1)};
    filter: blur(${({ $scrollCompact }) => ($scrollCompact ? '8px' : '0')});
    visibility: ${({ $scrollCompact }) => ($scrollCompact ? 'hidden' : 'visible')};
    pointer-events: ${({ $scrollCompact }) => ($scrollCompact ? 'none' : 'auto')};
    transition:
      opacity 150ms ease,
      filter 150ms ease,
      visibility 0s ${({ $scrollCompact }) => ($scrollCompact ? '150ms' : '0s')};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::before {
      animation: none;
    }

    > div:first-child {
      transition: none;
    }
  }
`;

const RetrievalFinderDock = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
`;
const Title = styled.div`
  font-weight: 600;
  font-size: ${({ $size }) =>
    $size === 'hero'
      ? 'calc(1.32rem - (0.18rem * var(--toast-compact-progress)))'
      : 'calc(1rem - (0.18rem * var(--toast-compact-progress)))'};
  transition: font-size var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.86rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  ${({ $fieldCommand }) =>
    $fieldCommand &&
    css`
      color: rgba(214, 252, 248, 0.92);
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
        'Courier New', monospace;
      font-size: 0.7rem;
      font-weight: 780;
      letter-spacing: 0.11em;
      line-height: 1.15;
      text-transform: uppercase;
    `}

  ${({ $itemPageTitle }) =>
    $itemPageTitle &&
    css`
      position: relative;
      color: rgba(246, 251, 255, 0.97);
      font-family: 'Avenir Next Condensed', 'DIN Condensed', 'Arial Narrow',
        sans-serif;
      font-size: calc(1.42rem - (0.16rem * var(--toast-compact-progress)));
      font-stretch: condensed;
      font-weight: 760;
      letter-spacing: 0.035em;
      line-height: 1.04;
      text-shadow: 0 0 12px rgba(var(--item-accent-rgb, 127, 215, 255), 0.2);

      &::before {
        content: '';
        display: inline-block;
        width: 0.28rem;
        height: 0.82em;
        margin-right: 0.42rem;
        border-radius: 1px 4px 2px 1px;
        background: linear-gradient(
          180deg,
          var(--item-accent, #7fd7ff),
          var(--item-secondary, #a7b6ff)
        );
        box-shadow: 0 0 9px rgba(var(--item-accent-rgb, 127, 215, 255), 0.34);
        vertical-align: -0.08em;
      }

      @media (max-width: ${MOBILE_BREAKPOINT}) {
        font-size: 1rem;
      }
    `}
`;
const TitleDetailsWrap = styled.div`
  min-width: 0;
`;
const Msg = styled.div`
  opacity: 0.9;
  font-size: calc(1rem - (0.22rem * var(--toast-compact-progress)));
  line-height: calc(1.35 - (0.15 * var(--toast-compact-progress)));
  transition:
    font-size var(--toast-duration) var(--toast-ease),
    line-height var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.82rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
const ContentWrap = styled.div`
  width: 100%;
`;
const Idle = styled.div`
  display: flex;
  align-items: center;
  gap: calc(0.6rem - (0.2rem * var(--toast-compact-progress)));
  opacity: 0.9;
  font-size: calc(1rem - (0.22rem * var(--toast-compact-progress)));
  line-height: 1.1;
  min-width: 0;
  transition:
    gap var(--toast-duration) var(--toast-ease),
    font-size var(--toast-duration) var(--toast-ease);

  span:last-child {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.4rem;
    font-size: 0.82rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const IdlePromptButton = styled.button`
  min-width: 0;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  font-weight: 750;
  text-align: left;
  cursor: pointer;
  animation: ${({ $calm }) =>
    $calm ? 'none' : css`${idlePromptBlink} 1.9s steps(2, end) infinite`};

  &:hover,
  &:focus-visible {
    color: var(--box-neon, #bfffee);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  &:focus-visible {
    outline: 2px solid var(--box-neon, rgba(103, 239, 200, 0.9));
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const IdleIconButton = styled.button`
  display: inline-grid;
  align-self: ${({ $alignTop }) => ($alignTop ? 'flex-start' : 'center')};
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  margin: -0.28rem 0;
  padding: 0;
  border: 0;
  border-radius: 7px;
  color: inherit;
  background: transparent;
  cursor: pointer;

  > span {
    display: grid;
    place-items: center;
  }

  &:hover,
  &:focus-visible {
    outline: none;
    background: rgba(var(--box-primary-rgb, 76, 198, 193), 0.1);
    box-shadow: inset 0 0 0 1px rgba(var(--box-primary-rgb, 76, 198, 193), 0.42);
  }

  &:focus-visible {
    box-shadow:
      inset 0 0 0 1px rgba(var(--box-primary-rgb, 76, 198, 193), 0.72),
      0 0 0 2px rgba(var(--box-primary-rgb, 76, 198, 193), 0.18);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
    margin: -0.32rem 0;
  }
`;

const RetrievalStateWrap = styled.div`
  position: relative;
  display: grid;
  gap: 0.42rem;
  min-width: 0;
`;

const RetrievalConsoleKicker = styled.span`
  color: var(--box-secondary, rgba(165, 218, 198, 0.78));
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const RetrievalNameBase = `
  color: var(--box-neon, #eaf4ff);
  font-size: clamp(1.18rem, 2.8vw, 1.48rem);
  font-weight: 860;
  line-height: 1.12;
  letter-spacing: 0.01em;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const RetrievalName = styled.span`
  ${RetrievalNameBase}
`;

const RetrievalNameLink = styled(Link)`
  ${RetrievalNameBase}
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  justify-self: start;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(119, 213, 255, 0.86);
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.64);
    outline-offset: 1px;
    border-radius: 4px;
  }
`;

const RetrievalBoxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.38rem;
  min-width: 0;
  flex-wrap: wrap;
  margin-top: 0.06rem;
`;

const RetrievalBoxId = styled.span`
  display: inline-flex;
  align-items: center;
  color: var(--box-neon, rgba(189, 231, 255, 0.98));
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-weight: 840;
  font-size: 0.93rem;
  line-height: 1.2;
  letter-spacing: 0.03em;
  flex: 0 0 auto;
`;

const RetrievalBoxIdLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: var(--box-neon, rgba(189, 231, 255, 0.98));
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-weight: 840;
  font-size: 0.93rem;
  line-height: 1.2;
  letter-spacing: 0.03em;
  text-decoration: none;
  flex: 0 0 auto;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(119, 213, 255, 0.72);
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.64);
    outline-offset: 1px;
  }
`;

const RetrievalBoxHomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex: 0 0 auto;
  border-radius: 6px;
  text-decoration: none;
  transition: background 160ms ease, transform 160ms ease;

  &:hover {
    background: rgba(119, 213, 255, 0.1);
    transform: scale(1.06);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.64);
    outline-offset: 1px;
  }
`;

const RetrievalBoxHome = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex: 0 0 auto;
`;

const RetrievalBoxHomeIcon = styled.img`
  display: block;
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
`;

const RetrievalBoxSeparator = styled.span`
  color: rgba(168, 206, 232, 0.84);
  font-size: 0.9rem;
  line-height: 1.1;
`;

const RetrievalMeta = styled.span`
  color: rgba(226, 236, 247, 0.72);
  font-size: 0.88rem;
  font-weight: 620;
  line-height: 1.25;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RetrievalMiniThumb = styled.img`
  position: absolute;
  right: -2.2rem;
  bottom: 0.04rem;
  width: 40px;
  height: 40px;
  object-fit: cover;
  border: 1px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.58);
  border-radius: 2px 6px 2px 2px;
  background: rgba(5, 11, 17, 0.84);
  box-shadow: 0 0 10px rgba(var(--box-primary-rgb, 119, 213, 255), 0.16);
`;
const Controls = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  flex-wrap: wrap;

  ${({ $variant }) =>
    $variant === 'command'
      ? css`
          align-self: center;
          align-items: stretch;
          gap: 0.24rem;
          flex-wrap: nowrap;
          padding: 0.22rem;
          border: 1px solid rgba(91, 215, 244, 0.24);
          border-radius: 11px;
          background:
            linear-gradient(180deg, rgba(19, 32, 48, 0.88), rgba(8, 13, 23, 0.86)),
            rgba(10, 19, 30, 0.86);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.035),
            0 0 16px rgba(34, 211, 238, 0.08);
        `
      : ''}

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    width: 100%;
    justify-content: flex-start;

    ${({ $variant }) =>
      $variant === 'command'
        ? css`
            flex-wrap: wrap;
          `
        : ''}
  }

  ${({ $fieldCommand }) =>
    $fieldCommand &&
    css`
      align-self: center;
      align-items: stretch;
      gap: 0.32rem;
      flex-wrap: nowrap;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;

      @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        width: 100%;
      }
    `}
`;
const Btn = styled.button`
  appearance: none;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease,
    transform 120ms ease,
    opacity 120ms ease;

  ${({ $toastVariant, $kind }) =>
    $toastVariant === 'command'
      ? css`
          min-width: calc(4.8rem - (0.5rem * var(--toast-compact-progress)));
          border: 1px solid rgba(91, 215, 244, 0.34);
          border-radius: 8px;
          padding: calc(0.38rem - (0.06rem * var(--toast-compact-progress))) calc(0.76rem - (0.12rem * var(--toast-compact-progress)));
          color: rgba(230, 244, 255, 0.92);
          background:
            linear-gradient(180deg, rgba(28, 49, 70, 0.86), rgba(10, 17, 28, 0.92)),
            rgba(20, 34, 46, 0.9);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.035),
            0 0 0 1px rgba(0, 255, 200, 0.045);
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
            'Courier New', monospace;
          font-size: calc(0.78rem - (0.04rem * var(--toast-compact-progress)));
          font-weight: 760;
          letter-spacing: 0.045em;
          text-transform: uppercase;

          ${$kind === 'primary'
            ? css`
                color: #f4fdff;
                border-color: rgba(126, 223, 255, 0.7);
                background:
                  linear-gradient(
                    180deg,
                    rgba(72, 224, 255, 0.42),
                    rgba(74, 89, 212, 0.26) 48%,
                    rgba(17, 29, 55, 0.96)
                  ),
                  rgba(13, 29, 44, 0.96);
                box-shadow:
                  0 0 0 1px rgba(0, 255, 200, 0.1),
                  0 0 18px rgba(34, 211, 238, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.18);
              `
            : ''}

          ${$kind === 'danger'
            ? css`
                color: #ffe7e3;
                border-color: rgba(240, 138, 123, 0.62);
                background:
                  linear-gradient(180deg, rgba(119, 50, 58, 0.72), rgba(58, 22, 31, 0.94)),
                  rgba(58, 22, 31, 0.94);
              `
            : ''}

          ${$kind === 'mode'
            ? css`
                border-color: rgba(167, 139, 250, 0.46);
                background:
                  linear-gradient(180deg, rgba(58, 74, 109, 0.82), rgba(17, 24, 42, 0.95)),
                  rgba(17, 24, 42, 0.95);
              `
            : ''}
        `
      : css`
          min-width: 4.6rem;
          background: rgba(17, 27, 36, 0.72);
          color: rgba(226, 239, 245, 0.9);
          border: 1px solid rgba(127, 215, 255, 0.34);
          border-radius: 5px;
          padding: 0.34rem 0.64rem;
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
            'Courier New', monospace;
          font-size: 0.68rem;
          font-weight: 760;
          letter-spacing: 0.06em;
          text-transform: uppercase;

          ${$kind === 'primary'
            ? css`
                background: rgba(45, 154, 151, 0.16);
                color: rgba(224, 255, 251, 0.96);
                border-color: rgba(101, 220, 213, 0.54);
              `
            : ''}

          ${$kind === 'danger'
            ? css`
                background: rgba(128, 54, 72, 0.14);
                color: rgba(255, 224, 230, 0.92);
                border-color: rgba(238, 132, 150, 0.5);
              `
            : ''}
        `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 7px;
    padding: 0.28rem 0.5rem;
    min-height: ${({ $fieldCommand }) => ($fieldCommand ? '44px' : '40px')};
    font-size: 0.78rem;
  }

  &:hover {
    opacity: 0.92;

    ${({ $toastVariant }) =>
      $toastVariant === 'command'
        ? css`
            border-color: rgba(126, 223, 255, 0.72);
            background:
              linear-gradient(180deg, rgba(40, 70, 98, 0.92), rgba(14, 24, 40, 0.96)),
              rgba(20, 34, 46, 0.92);
            box-shadow:
              0 0 0 1px rgba(0, 255, 200, 0.08),
              0 0 18px rgba(34, 211, 238, 0.18);
            transform: translateY(-1px);
          `
        : ''}
  }

  &:active:enabled {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.72);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: ${({ $toastVariant }) => ($toastVariant === 'command' ? 0.44 : 0.48)};
    transform: none;

    ${({ $toastVariant }) =>
      $toastVariant === 'command'
        ? css`
            border-color: rgba(129, 157, 181, 0.22);
            color: rgba(224, 235, 245, 0.62);
            background:
              linear-gradient(180deg, rgba(35, 45, 58, 0.7), rgba(13, 18, 27, 0.82)),
              rgba(13, 18, 27, 0.82);
            box-shadow: none;
          `
        : ''}
  }

  @media (prefers-reduced-motion: reduce) {
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease,
      color 140ms ease,
      opacity 120ms ease;
  }

  ${({ $fieldCommand, $kind }) =>
    $fieldCommand &&
    css`
      min-width: 6.8rem;
      min-height: 44px;
      padding: 0.38rem 0.72rem;
      border: 1px solid
        ${$kind === 'danger'
          ? 'rgba(238, 132, 150, 0.46)'
          : $kind === 'primary'
            ? 'rgba(101, 220, 213, 0.5)'
            : 'rgba(177, 159, 239, 0.34)'};
      border-radius: 6px;
      background: ${$kind === 'danger'
        ? 'rgba(128, 54, 72, 0.1)'
        : $kind === 'primary'
          ? 'rgba(45, 154, 151, 0.13)'
          : 'rgba(103, 86, 158, 0.08)'};
      color: ${$kind === 'danger'
        ? 'rgba(255, 224, 230, 0.92)'
        : $kind === 'primary'
          ? 'rgba(224, 255, 251, 0.96)'
          : 'rgba(225, 220, 246, 0.88)'};
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
        'Courier New', monospace;
      font-size: 0.68rem;
      font-weight: 760;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transform: none;

      &:hover:enabled {
        border-color: ${$kind === 'danger'
          ? 'rgba(247, 154, 171, 0.72)'
          : $kind === 'primary'
            ? 'rgba(115, 241, 233, 0.76)'
            : 'rgba(196, 177, 255, 0.64)'};
        background: ${$kind === 'danger'
          ? 'rgba(128, 54, 72, 0.18)'
          : $kind === 'primary'
            ? 'rgba(45, 154, 151, 0.2)'
            : 'rgba(103, 86, 158, 0.14)'};
        box-shadow: 0 0 14px
          ${$kind === 'danger'
            ? 'rgba(238, 132, 150, 0.1)'
            : $kind === 'primary'
              ? 'rgba(73, 211, 202, 0.14)'
              : 'rgba(169, 139, 250, 0.1)'};
        opacity: 1;
        transform: none;
      }

      &:disabled {
        border-color: rgba(150, 166, 181, 0.18);
        background: rgba(17, 23, 30, 0.76);
        color: rgba(205, 216, 225, 0.42);
        box-shadow: none;
      }
    `}
`;

const CloseBtn = styled(Btn)`
  z-index: 2;
  position: absolute;
  top: calc(0.5rem - (0.14rem * var(--toast-compact-progress)));
  right: calc(0.55rem - (0.13rem * var(--toast-compact-progress)));
  min-height: calc(30px - (4px * var(--toast-compact-progress)));
  min-width: calc(30px - (4px * var(--toast-compact-progress)));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  font-size: 0.92rem;
  line-height: 1;
  transition:
    top var(--toast-duration) var(--toast-ease),
    right var(--toast-duration) var(--toast-ease),
    min-height var(--toast-duration) var(--toast-ease),
    min-width var(--toast-duration) var(--toast-ease),
    opacity 120ms ease;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    top: 0.38rem;
    right: 0.42rem;
    min-height: ${({ $fieldCommand, $retrievalActive }) => (
      $fieldCommand ? '44px' : $retrievalActive ? '24px' : '40px'
    )};
    min-width: ${({ $fieldCommand, $retrievalActive }) => (
      $fieldCommand ? '44px' : $retrievalActive ? '24px' : '40px'
    )};
    border-radius: 7px;
    font-size: ${({ $retrievalActive }) => ($retrievalActive ? '0.56rem' : '0.92rem')};
  }

  ${({ $retrievalActive }) => $retrievalActive && css`
    top: 0.34rem;
    right: 0.36rem;
    min-width: 24px;
    min-height: 24px;
    border: 0;
    background: transparent;
    box-shadow: none;
    border-radius: 4px;
    color: rgba(226, 236, 247, 0.72);
    font-size: 0.62rem;

      &:hover,
      &:active {
      border: 0;
      background: transparent;
      box-shadow: none;
        color: rgba(255, 255, 255, 0.96);
      }

    &:focus-visible {
      outline: 2px solid rgba(var(--box-primary-rgb, 119, 213, 255), 0.7);
      outline-offset: -1px;
    }
  `}

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 120ms ease;
  }

  ${({ $fieldCommand }) =>
    $fieldCommand &&
    css`
      top: 0.38rem;
      right: 0.4rem;
      min-width: 44px;
      min-height: 44px;
      border-radius: 6px;
    `}
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) => ($align === 'center' ? 'center' : 'flex-start')};
  gap: 0.5rem;
  min-width: 0;
`;

const Spinner = styled.span`
  width: 0.88rem;
  height: 0.88rem;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.28);
  border-top-color: rgba(255, 255, 255, 0.96);
  animation: ${spin} 0.8s linear infinite;
  flex: 0 0 auto;
`;

export default function Toast({
  open,
  title,
  titleDetails,
  message,
  content,
  variant = 'info', // 'success' | 'warning' | 'danger' | 'info'
  loading = false,
  actions = [], // [{id?, label, onClick, kind}] kind 'primary'|'ghost'
  onClose,
  titleAlign = 'start',
  titleSize = 'default',
  showIdle = true,
  calmIdle = false,
  themedIdle = false,
  idleIcon = '📦',
  idleIconAction = null,
  idleText = 'Standing by…',
  idleAction = null,
  idleAddon = null,
  activeRetrievalItem = null,
  retrievalScrollCompact = false,
  compact = false,
  compactProgress,
  presentation = 'default',
  themeStyle = null,
  allowOverflow = false,
}) {
  const isFieldCommandRail = presentation === 'item-field';
  const isItemPageRail = presentation === 'item-page' || isFieldCommandRail;
  const resolvedCompactProgress = Number.isFinite(Number(compactProgress))
    ? Math.min(1, Math.max(0, Number(compactProgress)))
    : compact
      ? 1
      : 0;
  const hasActiveRetrieval =
    !open && activeRetrievalItem && typeof activeRetrievalItem === 'object';
  const retrievalMode = String(activeRetrievalItem?.mode || '').trim();
  const hasRetrievalControls = hasActiveRetrieval && retrievalMode === 'controls';
  const hasRetrievalActive = hasActiveRetrieval && retrievalMode === 'active';
  const isIdle = !open && !hasActiveRetrieval;
  const hasContent = !isIdle && !!content;
  const retrievalItemsMode = String(activeRetrievalItem?.retrievalMode || 'items').trim();
  const retrievalScope =
    activeRetrievalItem?.scope && typeof activeRetrievalItem.scope === 'object'
      ? activeRetrievalItem.scope
      : null;
  const retrievalSearchValue = String(activeRetrievalItem?.searchValue || '');
  const retrievalSearchLabel = activeRetrievalItem?.searchLabel;
  const retrievalSearchPlaceholder = activeRetrievalItem?.searchPlaceholder;
  const retrievalSearchHint = activeRetrievalItem?.searchHint;
  const retrievalShowRefine = Boolean(activeRetrievalItem?.showRefine);
  const retrievalSortOptions = Array.isArray(activeRetrievalItem?.sortOptions)
    ? activeRetrievalItem.sortOptions
    : [];
  const retrievalSelectedSort = String(activeRetrievalItem?.selectedSort || '').trim();
  const retrievalCategoryOptions = Array.isArray(activeRetrievalItem?.categoryOptions)
    ? activeRetrievalItem.categoryOptions
    : [];
  const retrievalTagOptions = Array.isArray(activeRetrievalItem?.tagOptions)
    ? activeRetrievalItem.tagOptions
    : [];
  const retrievalLocationOptions = Array.isArray(activeRetrievalItem?.locationOptions)
    ? activeRetrievalItem.locationOptions
    : [];
  const retrievalOwnerOptions = Array.isArray(activeRetrievalItem?.ownerOptions)
    ? activeRetrievalItem.ownerOptions
    : [];
  const retrievalKeepPriorityOptions = Array.isArray(activeRetrievalItem?.keepPriorityOptions)
    ? activeRetrievalItem.keepPriorityOptions
    : [];
  const retrievalChips = Array.isArray(activeRetrievalItem?.chips)
    ? activeRetrievalItem.chips
    : [];
  const retrievalBoxGroupOptions = Array.isArray(activeRetrievalItem?.boxGroupOptions)
    ? activeRetrievalItem.boxGroupOptions
    : [];
  const retrievalSelectedBoxGroup = String(activeRetrievalItem?.selectedBoxGroup || '');
  const retrievalBoxLocationOptions = Array.isArray(activeRetrievalItem?.boxLocationOptions)
    ? activeRetrievalItem.boxLocationOptions
    : [];
  const retrievalSelectedBoxLocation = String(activeRetrievalItem?.selectedBoxLocation || '');
  const retrievalName = String(activeRetrievalItem?.name || '').trim();
  const retrievalBoxId = String(activeRetrievalItem?.boxNumber || '').trim();
  const retrievalBoxName = String(activeRetrievalItem?.boxName || '').trim();
  const retrievalBoxHref = String(activeRetrievalItem?.boxHref || '').trim();
  const retrievalLocation = String(activeRetrievalItem?.locationLabel || '').trim();
  const retrievalSectionKey = String(activeRetrievalItem?.sectionKey || 'overview').trim();
  const retrievalPreviewImageUrl = String(activeRetrievalItem?.previewImageUrl || '').trim();
  const retrievalItemHref = String(activeRetrievalItem?.itemHref || '').trim();
  const retrievalBoxIdText = retrievalBoxId ? `#${retrievalBoxId}` : 'No Box ID';
  const retrievalBoxNameText = retrievalBoxName || 'Unknown box';
  const retrievalThemeStyle = hasRetrievalActive
    ? getBoxThemeCssVars(getBoxTheme(retrievalBoxId))
    : {};

  return (
    <Wrap
      $variant={variant}
      $idle={isIdle}
      $themedIdle={isIdle && themedIdle}
      $retrievalControls={hasRetrievalControls}
      $retrievalActive={hasRetrievalActive}
      $itemPageRail={isItemPageRail}
      $fieldCommandRail={isFieldCommandRail}
      $compact={compact}
      $hasContent={hasContent}
      $hasClose={!isIdle && !!onClose}
      $allowOverflow={allowOverflow}
      style={{
        ...retrievalThemeStyle,
        ...(themeStyle || {}),
        '--toast-compact-progress': resolvedCompactProgress.toFixed(3),
      }}
      role={variant === 'danger' ? 'alert' : 'status'}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
    >
      <Body $hasContent={hasContent} $compact={compact}>
        {isFieldCommandRail ? (
          <FieldCommandRail>
            <ItemPageRailContext>
              {title ? (
                <TitleRow $align={titleAlign}>
                  {loading ? <Spinner aria-hidden="true" /> : null}
                  <Title $fieldCommand $compact={compact} $size={titleSize}>{title}</Title>
                </TitleRow>
              ) : null}
              {titleDetails ? <TitleDetailsWrap>{titleDetails}</TitleDetailsWrap> : null}
              {message ? <Msg $compact={compact}>{message}</Msg> : null}
            </ItemPageRailContext>
            {content ? <ItemPageRailActions>{content}</ItemPageRailActions> : null}
          </FieldCommandRail>
        ) : isItemPageRail ? (
          <ItemPageRail>
            <ItemPageRailContext>
              {title ? (
                <TitleRow $align={titleAlign}>
                  {loading ? <Spinner aria-hidden="true" /> : null}
                  <Title
                    $compact={compact}
                    $size={titleSize}
                    $itemPageTitle
                  >
                    {title}
                  </Title>
                </TitleRow>
              ) : null}
              {titleDetails ? <TitleDetailsWrap>{titleDetails}</TitleDetailsWrap> : null}
              {message ? <Msg $compact={compact}>{message}</Msg> : null}
            </ItemPageRailContext>
            {content ? <ItemPageRailActions>{content}</ItemPageRailActions> : null}
          </ItemPageRail>
        ) : isIdle ? (
          showIdle ? (
            <Idle $compact={compact}>
              {idleIconAction ? (
                <IdleIconButton
                  type="button"
                  onClick={idleIconAction.onClick}
                  aria-label={idleIconAction.ariaLabel || 'Home'}
                  title={idleIconAction.title || idleIconAction.ariaLabel || 'Home'}
                  $alignTop={idleIconAction.alignTop}
                >
                  <span aria-hidden="true">{idleIcon}</span>
                </IdleIconButton>
              ) : (
                <span aria-hidden="true">{idleIcon}</span>
              )}
              {idleAction ? (
                <IdlePromptButton
                  type="button"
                  onClick={idleAction.onClick}
                  aria-label={idleAction.ariaLabel || idleText}
                  $calm={calmIdle}
                >
                  {idleText}
                </IdlePromptButton>
              ) : (
                <span>{idleText}</span>
              )}
              {idleAddon}
            </Idle>
          ) : null
        ) : hasRetrievalControls ? (
          <RetrievalControlsShell $scrollCompact={retrievalScrollCompact}>
            <RetrievalConsoleControls
            mode={retrievalItemsMode}
            scope={retrievalScope}
            onModeChange={activeRetrievalItem?.onModeChange}
            searchValue={retrievalSearchValue}
            onSearchChange={activeRetrievalItem?.onSearchChange}
            searchLabel={retrievalSearchLabel}
            searchPlaceholder={retrievalSearchPlaceholder}
            searchHint={retrievalSearchHint}
            showRefine={retrievalShowRefine}
            onToggleRefine={activeRetrievalItem?.onToggleRefine}
            chips={retrievalChips}
            sortOptions={retrievalSortOptions}
            selectedSort={retrievalSelectedSort}
            categoryOptions={retrievalCategoryOptions}
            tagOptions={retrievalTagOptions}
            locationOptions={retrievalLocationOptions}
            ownerOptions={retrievalOwnerOptions}
            keepPriorityOptions={retrievalKeepPriorityOptions}
            onSortChange={activeRetrievalItem?.onSortChange}
            onCategoryChange={activeRetrievalItem?.onCategoryChange}
            onTagChange={activeRetrievalItem?.onTagChange}
            onLocationChange={activeRetrievalItem?.onLocationChange}
            onOwnerChange={activeRetrievalItem?.onOwnerChange}
            onKeepPriorityChange={activeRetrievalItem?.onKeepPriorityChange}
            onRemoveChip={activeRetrievalItem?.onRemoveChip}
            onClearAllChips={activeRetrievalItem?.onClearAllChips}
            boxGroupOptions={retrievalBoxGroupOptions}
            selectedBoxGroup={retrievalSelectedBoxGroup}
            boxLocationOptions={retrievalBoxLocationOptions}
            selectedBoxLocation={retrievalSelectedBoxLocation}
            onBoxGroupChange={activeRetrievalItem?.onBoxGroupChange}
            onBoxLocationChange={activeRetrievalItem?.onBoxLocationChange}
            onClearBoxGroup={activeRetrievalItem?.onClearBoxGroup}
            onClearBoxLocation={activeRetrievalItem?.onClearBoxLocation}
            onToggleResults={activeRetrievalItem?.onToggleResults}
              resultsVisible={activeRetrievalItem?.resultsVisible}
            />
            {idleAddon ? (
              <RetrievalFinderDock>{idleAddon}</RetrievalFinderDock>
            ) : null}
          </RetrievalControlsShell>
        ) : hasRetrievalActive ? (
          <RetrievalStateWrap>
            <RetrievalConsoleKicker>Active Item</RetrievalConsoleKicker>
            {retrievalItemHref ? (
              <RetrievalNameLink to={retrievalItemHref}>
                {retrievalName || 'Expanded item'}
              </RetrievalNameLink>
            ) : (
              <RetrievalName>{retrievalName || 'Expanded item'}</RetrievalName>
            )}
            <RetrievalBoxRow>
              {retrievalBoxHref ? (
                <RetrievalBoxIdLink to={retrievalBoxHref}>
                  {retrievalBoxIdText}
                </RetrievalBoxIdLink>
              ) : (
                <RetrievalBoxId>{retrievalBoxIdText}</RetrievalBoxId>
              )}
              <RetrievalBoxSeparator aria-hidden="true">·</RetrievalBoxSeparator>

              {retrievalBoxHref ? (
                <RetrievalBoxHomeLink
                  to={retrievalBoxHref}
                  title={retrievalBoxNameText}
                  aria-label={`Open ${retrievalBoxNameText}`}
                >
                  <RetrievalBoxHomeIcon src={houseCommandIcon} alt="" aria-hidden="true" />
                </RetrievalBoxHomeLink>
              ) : (
                <RetrievalBoxHome title={retrievalBoxNameText}>
                  <RetrievalBoxHomeIcon src={houseCommandIcon} alt="" aria-hidden="true" />
                </RetrievalBoxHome>
              )}
            </RetrievalBoxRow>
            {retrievalLocation ? (
              <RetrievalMeta>{retrievalLocation}</RetrievalMeta>
            ) : null}
            {retrievalSectionKey !== 'overview' && retrievalPreviewImageUrl ? (
              <RetrievalMiniThumb
                src={retrievalPreviewImageUrl}
                alt=""
                aria-hidden="true"
              />
            ) : null}
          </RetrievalStateWrap>
        ) : (
          <>
            {title ? (
              <TitleRow $align={titleAlign}>
                {loading ? <Spinner aria-hidden="true" /> : null}
                <Title $compact={compact} $size={titleSize}>{title}</Title>
              </TitleRow>
            ) : null}
            {titleDetails ? <TitleDetailsWrap>{titleDetails}</TitleDetailsWrap> : null}
            {message && <Msg $compact={compact}>{message}</Msg>}
            {hasContent && <ContentWrap>{content}</ContentWrap>}
          </>
        )}
      </Body>
      {!isIdle && actions.length ? (
        <Controls $variant={variant} $fieldCommand={isFieldCommandRail}>
          {actions.map((a, i) => (
            <Btn
              type="button"
              key={
                a?.id ?? `${a?.label ?? 'action'}-${a?.kind ?? 'default'}-${i}`
              }
              onClick={a.onClick}
              disabled={!!a.disabled}
              $kind={a.kind}
              $toastVariant={variant}
              $fieldCommand={isFieldCommandRail}
            >
              {a.label}
            </Btn>
          ))}
        </Controls>
      ) : null}
      {!isIdle && onClose ? (
        <CloseBtn
          $compact={compact}
          $toastVariant={variant}
          $fieldCommand={isFieldCommandRail}
          $retrievalActive={hasRetrievalActive}
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          ✕
        </CloseBtn>
      ) : null}
    </Wrap>
  );
}
