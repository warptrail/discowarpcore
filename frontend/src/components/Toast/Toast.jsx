// Toast.jsx
import { isValidElement } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_NARROW_BREAKPOINT,
} from '../../styles/tokens';
import HomeCommandIcon from '../HomeCommandIcon';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../../util/inventoryColorTheme';

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

const Wrap = styled.div`
  --toast-compact-progress: 0;
  --toast-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --toast-duration: 220ms;

  position: relative;
  display: flex;
  gap: calc(0.35rem - (0.12rem * var(--toast-compact-progress)));
  align-items: ${({ $hasContent }) => ($hasContent ? 'flex-start' : 'center')};
  width: 100%;
  margin-block: calc(8px - (4px * var(--toast-compact-progress)));
  margin-inline: 0;
  min-height: ${({ $idle }) =>
    $idle
      ? 'calc(48px - (16px * var(--toast-compact-progress)))'
      : 'calc(46px - (6px * var(--toast-compact-progress)))'};
  background: ${({ $idle }) =>
    $idle ? 'rgba(12, 17, 23, 0.96)' : 'rgba(8, 13, 19, 0.98)'};
  border: 1px solid
    ${({ $variant, $idle }) =>
      $idle
        ? 'rgba(205, 224, 232, 0.16)'
        : $variant === 'danger'
          ? 'rgba(238, 132, 150, 0.34)'
          : $variant === 'warning'
            ? 'rgba(177, 159, 239, 0.3)'
            : $variant === 'success'
              ? 'rgba(101, 220, 213, 0.28)'
              : 'rgba(127, 215, 255, 0.25)'};
  color: ${({ $idle }) => ($idle ? 'rgba(225, 234, 239, 0.72)' : 'rgba(238, 245, 249, 0.9)')};
  padding-block: ${({ $idle }) =>
    $idle
      ? 'calc(0.48rem - (0.25rem * var(--toast-compact-progress)))'
      : 'calc(0.48rem - (0.14rem * var(--toast-compact-progress)))'};
  padding-left: calc(0.7rem - (0.12rem * var(--toast-compact-progress)));
  padding-right: ${({ $hasClose }) =>
    $hasClose
      ? 'calc(2.65rem - (0.25rem * var(--toast-compact-progress)))'
      : 'calc(0.7rem - (0.12rem * var(--toast-compact-progress)))'};
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 5px 16px rgba(0, 0, 0, 0.2);
  ${({ $themedIdle }) =>
    $themedIdle &&
    css`
      border-color: rgba(var(--box-primary-rgb), 0.46);
      color: rgba(242, 245, 248, 0.9);
      box-shadow:
        inset 0 1px 0 rgba(var(--box-secondary-rgb), 0.12),
        0 5px 16px rgba(0, 0, 0, 0.2);
    `}
  ${({ $retrievalActive }) =>
    $retrievalActive &&
    css`
      border-color: rgba(var(--box-primary-rgb), 0.58);
      box-shadow:
        inset 0 1px 0 rgba(var(--box-secondary-rgb), 0.14),
        0 5px 16px rgba(0, 0, 0, 0.2);
    `}
  overflow: ${({ $allowOverflow }) => ($allowOverflow ? 'visible' : 'hidden')};
  transition:
    gap var(--toast-duration) var(--toast-ease),
    margin var(--toast-duration) var(--toast-ease),
    min-height var(--toast-duration) var(--toast-ease),
    padding var(--toast-duration) var(--toast-ease),
    box-shadow var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.5rem;
    margin: 6px 0;
    min-height: 44px;
    padding: 0.44rem 0.58rem;
    padding-right: ${({ $hasClose }) => ($hasClose ? '2.65rem' : '0.58rem')};
    border-radius: 8px;
    box-shadow: 0 4px 13px rgba(0, 0, 0, 0.2);
  }

  ${({ $itemPageRail }) =>
    $itemPageRail &&
    css`
      min-height: 42px;
      margin-block: 3px;
      padding: 0.38rem 0.5rem;
      border-color: rgba(var(--item-accent-rgb, 127, 215, 255), 0.46);
      border-radius: 6px;
      background: #090f16;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.055),
        0 5px 15px rgba(0, 0, 0, 0.22);

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
      border-radius: 6px;
      background: rgba(6, 10, 15, 0.985);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.055),
        0 4px 14px rgba(0, 0, 0, 0.28);

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

const Title = styled.div`
  font-weight: 600;
  font-size: ${({ $size }) =>
    $size === 'hero'
      ? 'calc(1.22rem - (0.14rem * var(--toast-compact-progress)))'
      : 'calc(0.92rem - (0.1rem * var(--toast-compact-progress)))'};
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
  font-size: calc(0.88rem - (0.1rem * var(--toast-compact-progress)));
  line-height: 1.32;
  transition:
    font-size var(--toast-duration) var(--toast-ease),
    line-height var(--toast-duration) var(--toast-ease);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.8rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
const ContentWrap = styled.div`
  width: 100%;
`;
const Idle = styled.div`
  position: relative;
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

const IdleAddon = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
  margin-left: auto;

  ${({ $centered }) => $centered && css`
    position: absolute;
    left: 50%;
    flex: none;
    margin-left: 0;
    transform: translateX(-50%);
  `}
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

const RetrievalBoxSeparator = styled.span`
  color: rgba(168, 206, 232, 0.84);
  font-size: 0.9rem;
  line-height: 1.1;
`;

const RetrievalMeta = styled.span`
  color: var(--box-location, #7fd7ff);
  font-size: clamp(0.98rem, 3.2vw, 1.12rem);
  font-weight: 820;
  line-height: 1.25;
  letter-spacing: 0.015em;
  text-shadow: 0 0 10px rgba(var(--box-location-rgb, 127, 215, 255), 0.26);
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
  align-self: center;
  align-items: center;
  gap: 0.1rem;
  flex: 0 0 auto;
  flex-wrap: nowrap;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    align-self: flex-start;
  }

  ${({ $fieldCommand }) =>
    $fieldCommand &&
    css`
      align-self: center;
      align-items: center;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  min-width: 40px;
  cursor: pointer;
  white-space: nowrap;
  border: 0;
  border-radius: 5px;
  padding: 0.32rem 0.48rem;
  color: rgba(215, 230, 238, 0.78);
  background: transparent;
  box-shadow: none;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.065em;
  line-height: 1;
  text-transform: uppercase;
  transition:
    background 140ms ease,
    color 140ms ease,
    opacity 120ms ease;

  ${({ $kind }) =>
    $kind === 'primary'
      ? css`
          color: rgba(174, 244, 237, 0.94);
        `
      : $kind === 'danger'
        ? css`
            color: rgba(255, 190, 202, 0.92);
          `
        : $kind === 'mode'
          ? css`
              color: rgba(213, 201, 255, 0.9);
            `
          : ''}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${({ $fieldCommand }) => ($fieldCommand ? '44px' : '40px')};
    min-width: ${({ $fieldCommand }) => ($fieldCommand ? '44px' : '40px')};
    font-size: 0.7rem;
  }

  &:hover:enabled {
    color: rgba(238, 249, 252, 0.98);
    background: rgba(127, 215, 255, 0.1);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.72);
    outline-offset: -2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.44;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  ${({ $fieldCommand, $kind }) =>
    $fieldCommand &&
    css`
      min-width: 44px;
      min-height: 44px;
      padding: 0.38rem 0.72rem;
      color: ${$kind === 'danger'
        ? 'rgba(255, 224, 230, 0.92)'
        : $kind === 'primary'
          ? 'rgba(224, 255, 251, 0.96)'
          : 'rgba(225, 220, 246, 0.88)'};

      &:hover:enabled {
        background: ${$kind === 'danger'
          ? 'rgba(128, 54, 72, 0.18)'
          : $kind === 'primary'
            ? 'rgba(45, 154, 151, 0.2)'
            : 'rgba(103, 86, 158, 0.14)'};
      }
    `}
`;

const CloseBtn = styled.button`
  appearance: none;
  z-index: 2;
  position: absolute;
  top: 50%;
  right: calc(0.28rem - (0.04rem * var(--toast-compact-progress)));
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 5px;
  color: rgba(212, 226, 234, 0.62);
  background: transparent;
  font: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    background 140ms ease,
    color 140ms ease,
    opacity 120ms ease;

  &:hover {
    color: rgba(246, 252, 255, 0.96);
    background: rgba(127, 215, 255, 0.08);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.72);
    outline-offset: -2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    right: 0.22rem;
    width: ${({ $fieldCommand }) => ($fieldCommand ? '44px' : '40px')};
    height: ${({ $fieldCommand }) => ($fieldCommand ? '44px' : '40px')};
  }

  ${({ $retrievalActive }) => $retrievalActive && css`
    color: rgba(226, 236, 247, 0.72);
  `}

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 120ms ease;
  }

  ${({ $fieldCommand }) =>
    $fieldCommand &&
    css`
      width: 44px;
      height: 44px;
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
  idleAddonCentered = false,
  activeRetrievalItem = null,
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
  const hasRetrievalActive = hasActiveRetrieval && retrievalMode === 'active';
  const isIdle = !open && !hasActiveRetrieval;
  const hasContent = !isIdle && !!content;
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
                isValidElement(idleText) ? idleText : <span>{idleText}</span>
              )}
              {idleAddon ? (
                <IdleAddon $centered={idleAddonCentered}>{idleAddon}</IdleAddon>
              ) : null}
            </Idle>
          ) : null
        ) : hasRetrievalActive ? (
          <RetrievalStateWrap>
            <RetrievalConsoleKicker>Active Item</RetrievalConsoleKicker>
            {retrievalItemHref ? (
              <RetrievalNameLink
                to={retrievalItemHref}
                state={activeRetrievalItem?.itemState}
              >
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
                  <HomeCommandIcon size="1.5rem" alt="" aria-hidden="true" />
                </RetrievalBoxHomeLink>
              ) : (
                <RetrievalBoxHome title={retrievalBoxNameText}>
                  <HomeCommandIcon size="1.5rem" alt="" aria-hidden="true" />
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
