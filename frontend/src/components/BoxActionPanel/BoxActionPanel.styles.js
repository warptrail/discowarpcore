import { controlStyles } from '../../styles/primitives';
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
  background: transparent;
  padding: 0;
  border-radius: 0;
  min-width: 0;
  overflow-x: clip;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0;
    border-radius: 0;
  }
`;

export const WorkspaceRail = styled.div`
  position: absolute;
  top: 7px;
  left: 0;
  right: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  pointer-events: none;
`;

export const BackButton = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  width: 32px;
  border: 0;
  border-radius: var(--dw-radius);
  padding: 0;
  color: var(--dw-text-secondary);
  background: transparent;
  font: 700 0.76rem/1 var(--dw-font-ui);
  cursor: pointer;
  pointer-events: auto;
  font-size: 1.24rem;
  &:hover, &:focus-visible {
    color: var(--dw-cyan);
    background: transparent;
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }
  &:disabled { opacity: .55; cursor: wait; }
`;

export const WorkspaceContext = styled.span`
  min-width: 0;
  overflow: hidden;
  color: var(--dw-text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.12);
  background: var(--dw-surface);
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
    border-radius: var(--dw-radius);
    background: var(--dw-teal);
    opacity: 0.65;
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
          border-color: var(--dw-teal);
          background: var(--dw-surface-raised);
        `
      : css`
          opacity: 0.45;
          min-height: 58px;
          padding: 0.44rem 0.56rem 0.44rem 0.72rem;
          border-color: rgba(230, 237, 243, 0.1);
          background: var(--dw-surface);
          box-shadow: none;
        `)}

  &:hover {
    border-color: var(--dw-teal);
    background: var(--dw-surface-raised);
  }

  ${({ $focusMode, $isFocused }) =>
    $focusMode &&
    !$isFocused &&
    css`
      &:hover {
        border-color: rgba(230, 237, 243, 0.1);
        background: var(--dw-surface);
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
    border-radius: var(--dw-radius);
    padding: 0.46rem 0.5rem 0.5rem 0.62rem;
    border-color: rgba(230, 237, 243, 0.12);

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
  display: inline-block;
  width: fit-content;
  max-width: 100%;
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
    text-decoration-color: var(--dw-teal);
    text-underline-offset: 2px;
  }
`;

export const QtyPill = styled.span`
  justify-self: end;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 0.62rem;
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.14);
  background: var(--dw-surface-raised);
  color: var(--dw-text-secondary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: none;
  white-space: nowrap;

  @media (max-width: 720px) {
    justify-self: start;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 28px;
    padding: 0 0.44rem;
    border-radius: var(--dw-radius);
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
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.12);
  background: var(--dw-surface-raised);

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
    border-radius: var(--dw-radius);
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const toneStyles = {
  primary: css`
    background: rgba(76, 198, 193, 0.16);
    border-color: var(--dw-teal);
    color: var(--dw-text);

    &:hover:not(:disabled) {
      background: rgba(76, 198, 193, 0.24);
      border-color: var(--dw-teal);
    }
  `,
  neutral: css`
    background: var(--dw-surface-raised);
    border-color: rgba(230, 237, 243, 0.16);
    color: var(--dw-text);

    &:hover:not(:disabled) {
      background: var(--dw-surface-raised);
      border-color: var(--dw-cyan);
    }
  `,
  warning: css`
    background: rgba(232, 177, 92, 0.12);
    border-color: rgba(232, 177, 92, 0.42);
    color: var(--dw-amber);

    &:hover:not(:disabled) {
      background: rgba(232, 177, 92, 0.18);
      border-color: var(--dw-amber);
    }
  `,
  danger: css`
    background: rgba(240, 138, 123, 0.12);
    border-color: rgba(240, 138, 123, 0.42);
    color: var(--dw-coral);

    &:hover:not(:disabled) {
      background: rgba(240, 138, 123, 0.18);
      border-color: var(--dw-coral);
    }
  `,
};

export const ActionButton = styled.button`
  ${controlStyles}
  border: 1px solid transparent;
  border-radius: var(--dw-radius);
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  min-width: 68px;
  padding: 0 0.66rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
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
      border-color: var(--dw-cyan);
    `}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    padding: 0.35rem 0.24rem;
    border-radius: var(--dw-radius);
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
  }
`;

export const ItemWorkspace = styled.section`
  margin-top: 0.8rem;
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.12);
  background: var(--dw-surface);
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
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.12);
  background: var(--dw-surface);
  padding: 0.8rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: -0.12rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: 0.58rem;
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
  letter-spacing: 0.01em;
  color: var(--dw-text);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const WorkspaceClose = styled.button`
  ${controlStyles}
  border: 1px solid rgba(230, 237, 243, 0.16);
  background: var(--dw-surface-raised);
  color: var(--dw-text-secondary);
  border-radius: var(--dw-radius);
  padding: 0.25rem 0.5rem;
  font-size: 0.78rem;
  cursor: pointer;
  min-height: 44px;

  &:hover {
    background: var(--dw-surface-raised);
    border-color: var(--dw-cyan);
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
  border-radius: var(--dw-radius);
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
  transition:
    max-height 220ms ease,
    margin-bottom 220ms ease,
    border-color 220ms ease;

  max-height: 0;
  margin-bottom: 0;
  border: 0;

  ${({ $open }) =>
    $open &&
    css`
      max-height: none;
      overflow: visible;
      margin-bottom: 12px;
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

export const ExportPanelContainer = styled.section`
  padding: 0.9rem;
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.12);
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.62rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const ExportPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.52rem;
`;

export const ExportPanelTitle = styled.h4`
  margin: 0;
  color: var(--dw-text);
  font-size: 0.92rem;
  letter-spacing: 0.01em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const ExportPanelBody = styled.p`
  margin: 0;
  color: var(--dw-text-secondary);
  font-size: 0.86rem;
  line-height: 1.45;
`;

export const ExportPanelActions = styled.div`
  margin-top: 0.7rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const ExportDownloadButton = styled.button`
  ${controlStyles}
  border: 1px solid var(--dw-teal);
  background: rgba(76, 198, 193, 0.16);
  color: var(--dw-text);
  border-radius: var(--dw-radius);
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  min-width: 132px;
  padding: 0 0.72rem;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(76, 198, 193, 0.24);
    border-color: var(--dw-cyan);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 0;
    width: 100%;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    border-radius: var(--dw-radius);
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
  }
`;

export const ExportPanelError = styled.p`
  margin: 0.48rem 0 0;
  color: var(--dw-coral);
  font-size: 0.8rem;
  line-height: 1.35;
`;

export const ExportPanelClose = styled.button`
  ${controlStyles}
  border: 1px solid rgba(230, 237, 243, 0.16);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  border-radius: var(--dw-radius);
  padding: 0.25rem 0.5rem;
  font-size: 0.78rem;
  cursor: pointer;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  &:hover {
    background: var(--dw-surface-raised);
    border-color: var(--dw-cyan);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.2rem 0.44rem;
  }
`;
