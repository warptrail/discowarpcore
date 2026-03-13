import styled, { keyframes, css } from 'styled-components';

export const PanelContainer = styled.div`
  background-color: #121212;
  padding: 1rem;
  border-radius: 12px;
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.8rem 0.9rem;
  border-radius: 10px;
  border: 1px solid #2f2f2f;
  background-color: #1f1f1f;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  will-change: transform, opacity;

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
          background-color: #243429;
          box-shadow:
            0 0 0 1px rgba(78, 199, 123, 0.4),
            0 0 12px rgba(78, 199, 123, 0.2);
        `
      : css`
          opacity: 0.45;
          padding: 0.55rem 0.75rem;
          border-color: #252525;
          background-color: #171717;
          box-shadow: none;
        `)}

  &:hover {
    border-color: #4ec77b;
    background-color: #253128;
    box-shadow: 0 0 8px rgba(78, 199, 123, 0.32);
  }

  ${({ $focusMode, $isFocused }) =>
    $focusMode &&
    !$isFocused &&
    css`
      &:hover {
        border-color: #323232;
        background-color: #191919;
        box-shadow: none;
      }
    `}

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ItemMain = styled.div`
  min-width: 0;
  flex: 1;
`;

export const ItemTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
`;

export const ItemName = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #f2f2f2;
  line-height: 1.3;
`;

export const ItemMetaRow = styled.div`
  margin-top: 0.45rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

export const MetaPill = styled.span`
  font-size: 0.75rem;
  color: #c9e8d4;
  border: 1px solid #355443;
  background: #1b2b22;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  white-space: nowrap;
`;

export const ItemSummary = styled.p`
  margin: 0.5rem 0 0;
  color: #b7c1b9;
  font-size: 0.85rem;
  line-height: 1.3;
`;

export const ItemActions = styled.div`
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
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
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
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
`;

export const ItemWorkspace = styled.section`
  margin-top: 0.8rem;
  border-radius: 10px;
  border: 1px solid #2f2f2f;
  background: #171717;
  padding: 0.8rem;
`;

export const InlineItemWorkspace = styled.li`
  list-style: none;
  margin-top: -0.2rem;
  border-radius: 10px;
  border: 1px solid #355943;
  background: #131a15;
  padding: 0.8rem;
  box-shadow: 0 0 0 1px rgba(78, 199, 123, 0.14);
`;

export const WorkspaceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
`;

export const WorkspaceTitle = styled.h4`
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  color: #d8ece0;
`;

export const WorkspaceClose = styled.button`
  border: 1px solid #3d3d3d;
  background: #202020;
  color: #ddd;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.78rem;
  cursor: pointer;

  &:hover {
    background: #2a2a2a;
    border-color: #565656;
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
`;
