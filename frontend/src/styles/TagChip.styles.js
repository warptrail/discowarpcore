import styled, { css, keyframes } from 'styled-components';
import { MOBILE_BREAKPOINT, MOBILE_FONT_SM } from './tokens';

const pulseGreen = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(0,255,128,0); }
  50%      { box-shadow: 0 0 8px rgba(0,255,128,0.8); }
`;

const pulseRed = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(255,64,64,0); }
  50%      { box-shadow: 0 0 8px rgba(255,64,64,0.9); }
`;

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 14px;
  font-size: 0.85rem;
  line-height: 1;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.06);
  color: #eaeaea;
  user-select: none;
  max-width: 100%;

  ${({ $status }) =>
    $status === 'unchanged' &&
    css`
      border-color: #666;
    `}

  ${({ $status }) =>
    $status === 'new' &&
    css`
      border-color: #00ff80;
      animation: ${pulseGreen} 1.6s ease-in-out infinite;
    `}

  ${({ $status }) =>
    $status === 'deleted' &&
    css`
      border-color: #ff4040;
      animation: ${pulseRed} 1.6s ease-in-out infinite;
      opacity: 0.75;
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.28rem;
    padding: 0.2rem 0.46rem;
    border-radius: 10px;
    border-width: 1px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Text = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${({ $status }) =>
    $status === 'deleted' &&
    css`
      color: #9a9a9a;
      text-decoration: line-through;
    `}
`;

export const RemoveButton = styled.button`
  all: unset;
  cursor: pointer;
  font-weight: 800;
  font-size: 1rem;
  line-height: 1;
  padding: 0 0.2rem;

  &:hover {
    color: #ff6b6b;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0 0.12rem;
  }
`;
