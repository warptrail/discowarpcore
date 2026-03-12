import styled, { keyframes, css } from 'styled-components';

export const ItemEditWrapper = styled.div`
  overflow: hidden;
  max-height: ${({ $isOpen }) => ($isOpen ? '800px' : '0')};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  transform: ${({ $isOpen }) =>
    $isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease,
    transform 0.3s ease;
`;

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
  gap: 0.5rem;
`;

export const ItemRow = styled.li`
  background-color: ${({ $isOpen }) => ($isOpen ? '#1b2a1f' : '#222')};
  color: ${({ $isOpen }) => ($isOpen ? '#d9f2e6' : '#e4e4e4')};
  padding: 0.75rem 1rem;
  border-radius: ${({ $isOpen }) => ($isOpen ? '8px 8px 0 0' : '8px')};
  cursor: pointer;
  border: ${({ $isOpen }) =>
    $isOpen ? '1px solid #3fa46a' : '1px solid #2f2f2f'};
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
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

  &:hover {
    background-color: #2d3d31;
    border-color: #4ec77b;
    color: #e9fcee;
    box-shadow: 0 0 6px rgba(78, 199, 123, 0.4);
  }
`;

export const BoxLabel = styled.h3`
  font-size: 1.1rem;
  padding-top: 0.2rem;
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
