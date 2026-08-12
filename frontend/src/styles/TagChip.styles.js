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
  gap: 0.22rem;
  min-height: 30px;
  max-width: 100%;
  padding: 0.18rem 0.28rem 0.18rem 0.5rem;
  border-radius: 3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.055em;
  line-height: 1;
  border: 1px solid rgba(104, 154, 186, 0.42);
  background: linear-gradient(180deg, rgba(15, 30, 45, 0.82), rgba(8, 17, 27, 0.92));
  color: #eaeaea;
  user-select: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
  transition: border-color 180ms ease, color 180ms ease, background 180ms ease;

  ${({ $status }) =>
    $status === 'unchanged' &&
    css`
      border-color: rgba(76, 198, 193, 0.62);
      color: #b9fff7;
    `}

  ${({ $status }) =>
    $status === 'new' &&
    css`
      border-color: rgba(81, 232, 161, 0.88);
      color: #9dffd0;
      animation: ${pulseGreen} 1.6s ease-in-out infinite;
    `}

  ${({ $status }) =>
    $status === 'deleted' &&
    css`
      border-color: rgba(255, 111, 125, 0.9);
      animation: ${pulseRed} 1.6s ease-in-out infinite;
      opacity: 0.75;
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.18rem;
    min-height: 29px;
    padding: 0.18rem 0.22rem 0.18rem 0.42rem;
    border-radius: 3px;
    font-size: ${MOBILE_FONT_SM};
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  line-height: 1;
  min-width: 24px;
  min-height: 24px;
  padding: 0;
  color: rgba(207, 235, 243, 0.7);
  text-align: center;

  &:hover {
    color: #ff6b6b;
  }

  &:focus-visible {
    outline: 1px solid #73ddff;
    outline-offset: 1px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 24px;
    min-height: 24px;
  }
`;
