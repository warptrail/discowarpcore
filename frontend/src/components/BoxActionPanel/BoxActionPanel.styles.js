import styled, { keyframes, css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

export const PanelContainer = styled.div`
  background-color: #121212;
  padding: 1rem;
  border-radius: 12px;
  min-width: 0;
  overflow-x: clip;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.58rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

const zipIn = keyframes`
  from { transform: translateX(-40%) scale(.98); opacity: 0; }
  to   { transform: translateX(0)      scale(1);  opacity: 1; }
`;

const zipAway = keyframes`
  to { transform: translateX(40%) scale(.96); opacity: 0; }
`;

const flashBorder = keyframes`
  0%   { box-shadow: 0 0 0 0 var(--flash-shadow, transparent); }
  50%  { box-shadow: 0 0 0 3px var(--flash-shadow, transparent); }
  100% { box-shadow: 0 0 0 0 var(--flash-shadow, transparent); }
`;

const FLASH_MAP = {
  green: { border: '#4bd17a', shadow: 'rgba(75, 209, 122, .45)' },
  yellow: { border: '#ffd400', shadow: 'rgba(255, 212,   0, .45)' },
  red: { border: '#ff6b6b', shadow: 'rgba(255, 107, 107, .45)' },
};

export const ItemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

export const ItemCard = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  column-gap: 0.55rem;
  row-gap: 0.4rem;
  min-height: 72px;
  padding: 0.56rem 0.62rem 0.56rem 0.78rem;
  border-radius: 22px 11px 11px 18px;
  border: 1px solid #334840;
  background:
    linear-gradient(
      90deg,
      rgba(62, 106, 87, 0.2) 0%,
      rgba(30, 44, 38, 0.5) 30%,
      rgba(27, 31, 34, 0.96) 60%
    ) no-repeat,
    #1b1f22;
  background-size:
    100% 100%,
    auto;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  will-change: transform, opacity;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0.42rem;
    top: 0.44rem;
    bottom: 0.44rem;
    width: 5px;
    border-radius: 999px;
    background: linear-gradient(180deg, #67c99a, #3f8f68 68%, #326e52);
    opacity: 0.58;
    pointer-events: none;
  }

  ${({ $preEnter }) =>
    $preEnter &&
    css`
      transform: translateX(-40%) scale(0.98);
      opacity: 0;
    `}

  ${({ $zip }) =>
    $zip === 'in'
      ? css`
          animation: ${zipIn} 280ms ease-out both;
        `
      : $zip === 'out'
        ? css`
            animation: ${zipAway} 1000ms ease-in forwards;
            pointer-events: none;
          `
        : ''}

  ${({ $flash, $flashDelay = 0, $zip }) => {
    if (!$flash) return '';
    const c = FLASH_MAP[$flash] || FLASH_MAP.yellow;
    const base = css`
      outline: 2px dashed ${c.border};
      outline-offset: 0;
      box-shadow: 0 0 0 0 ${c.shadow};
    `;

    if ($zip === 'in') {
      return css`
        ${base};
        animation:
          ${zipIn} 280ms ease-out both,
          ${flashBorder} 600ms ease-out ${$flashDelay}ms 2;
      `;
    }

    if ($zip === 'out') {
      return css`
        ${base};
        animation:
          ${zipAway} 1000ms ease-in forwards,
          ${flashBorder} 600ms ease-out ${$flashDelay}ms 2;
      `;
    }

    return css`
      ${base};
      animation: ${flashBorder} 600ms ease-out ${$flashDelay}ms 2;
    `;
  }}

  ${({ $focusMode, $isFocused }) =>
    $focusMode &&
    ($isFocused
      ? css`
          border-color: #4ec77b;
          background:
            linear-gradient(
              90deg,
              rgba(64, 137, 98, 0.32) 0%,
              rgba(38, 68, 52, 0.62) 34%,
              rgba(28, 47, 36, 0.94) 60%
            ) no-repeat,
            #213629;
          background-size:
            100% 100%,
            auto;
          box-shadow:
            0 0 0 1px rgba(78, 199, 123, 0.4),
            0 0 12px rgba(78, 199, 123, 0.2);
        `
      : css`
          opacity: 0.45;
          min-height: 58px;
          padding: 0.44rem 0.56rem 0.44rem 0.72rem;
          border-color: #252d2a;
          background:
            linear-gradient(90deg, rgba(54, 64, 59, 0.18) 0%, rgba(25, 29, 31, 0.9) 52%)
              no-repeat,
            #171a1c;
          background-size:
            100% 100%,
            auto;
          box-shadow: none;
        `)}

  &:hover {
    border-color: #4ec77b;
    background:
      linear-gradient(
        90deg,
        rgba(65, 123, 95, 0.3) 0%,
        rgba(40, 67, 53, 0.54) 32%,
        rgba(31, 47, 39, 0.9) 58%
      ) no-repeat,
      #253128;
    background-size:
      100% 100%,
      auto;
    box-shadow: 0 0 8px rgba(78, 199, 123, 0.32);
  }

  ${({ $focusMode, $isFocused }) =>
    $focusMode &&
    !$isFocused &&
    css`
      &:hover {
        border-color: #323232;
        background:
          linear-gradient(
            90deg,
            rgba(54, 64, 59, 0.16) 0%,
            rgba(24, 27, 29, 0.9) 52%
          ) no-repeat,
          #191919;
        background-size:
          100% 100%,
          auto;
        box-shadow: none;
      }
    `}

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 0.56rem 0.62rem 0.62rem 0.78rem;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    column-gap: 0.42rem;
    row-gap: 0.3rem;
    border-radius: 16px 10px 10px 14px;
    padding: 0.46rem 0.5rem 0.5rem 0.62rem;
    border-color: #2f4039;

    &::before {
      left: 0.34rem;
      top: 0.36rem;
      bottom: 0.36rem;
      width: 4px;
      opacity: 0.48;
    }

    &:hover {
      box-shadow: none;
    }
  }
`;

export const ItemMain = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  padding-left: 0.6rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-left: 0.42rem;
  }
`;

export const ItemName = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #f2f2f2;
  line-height: 1.2;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const ItemNameLink = styled(Link)`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #f2f2f2;
  line-height: 1.2;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(78, 199, 123, 0.86);
    text-underline-offset: 2px;
  }
`;

export const QtyPill = styled.span`
  justify-self: end;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 0.62rem;
  border-radius: 10px;
  border: 1px solid #456b59;
  background: linear-gradient(180deg, #1f352a, #16261f);
  color: #d5f0e2;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: 720px) {
    justify-self: start;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 28px;
    padding: 0 0.44rem;
    border-radius: 8px;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const ItemActions = styled.div`
  justify-self: end;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: 0.34rem;
  padding: 0.24rem;
  border-radius: 11px;
  border: 1px solid #323c38;
  background: linear-gradient(180deg, #1a1f22, #15191b);

  @media (max-width: 860px) {
    grid-column: 1 / -1;
    justify-self: start;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    justify-self: stretch;
    grid-auto-flow: row;
    grid-auto-columns: initial;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.26rem;
    padding: 0.2rem;
    border-radius: 9px;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const toneStyles = {
  primary: css`
    background: #214734;
    border-color: #3a8f64;
    color: #dcf4e7;

    &:hover:not(:disabled) {
      background: #2c6047;
      border-color: #4ec77b;
    }
  `,
  neutral: css`
    background: #252525;
    border-color: #3b3b3b;
    color: #ececec;

    &:hover:not(:disabled) {
      background: #2e2e2e;
      border-color: #5a5a5a;
    }
  `,
  danger: css`
    background: #3b1c1f;
    border-color: #7a353d;
    color: #ffd8dc;

    &:hover:not(:disabled) {
      background: #4b2328;
      border-color: #b34b56;
    }
  `,
};

export const ActionButton = styled.button`
  border: 1px solid transparent;
  border-radius: 8px;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  min-width: 68px;
  padding: 0 0.66rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;

  ${({ $tone = 'neutral' }) => toneStyles[$tone] || toneStyles.neutral}

  ${({ $active }) =>
    $active &&
    css`
      box-shadow: 0 0 0 1px rgba(78, 199, 123, 0.45);
      border-color: #4ec77b;
    `}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-width: 0;
    min-height: 34px;
    padding: 0.35rem 0.24rem;
    border-radius: 7px;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
  }
`;

export const ItemWorkspace = styled.section`
  margin-top: 0.8rem;
  border-radius: 10px;
  border: 1px solid #2f2f2f;
  background: #171717;
  padding: 0.8rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: 0.58rem;
    padding: 0.58rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const InlineItemWorkspace = styled.li`
  list-style: none;
  margin-top: -0.2rem;
  border-radius: 10px;
  border: 1px solid #355943;
  background: #131a15;
  padding: 0.8rem;
  box-shadow: 0 0 0 1px rgba(78, 199, 123, 0.14);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: -0.12rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: 0.58rem;
    box-shadow: 0 0 0 1px rgba(78, 199, 123, 0.08);
  }
`;

export const WorkspaceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.46rem;
  }
`;

export const WorkspaceTitle = styled.h4`
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  color: #d8ece0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const WorkspaceClose = styled.button`
  border: 1px solid #3d3d3d;
  background: #202020;
  color: #ddd;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.78rem;
  cursor: pointer;
  min-height: 34px;

  &:hover {
    background: #2a2a2a;
    border-color: #565656;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.2rem 0.44rem;
  }
`;

export const EmptyMessage = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-size: 0.95rem;
  margin-top: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.72rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const DetailsPanel = styled.div`
  overflow: hidden;
  background: #191919;
  border-radius: 10px;
  transition:
    max-height 220ms ease,
    margin-bottom 220ms ease,
    border-color 220ms ease;

  max-height: 0;
  margin-bottom: 0;
  border: 0;

  ${({ $open, $maxHeight = 400 }) =>
    $open &&
    css`
      max-height: ${$maxHeight}px;
      margin-bottom: 12px;
      border: 1px solid #2f2f2f;
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    transition:
      margin-bottom 220ms ease,
      border-color 220ms ease;

    ${({ $open }) =>
      $open &&
      css`
        max-height: none;
        overflow: visible;
        margin-bottom: 10px;
      `}
  }
`;
