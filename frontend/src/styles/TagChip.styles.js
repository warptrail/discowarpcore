import { controlStyles } from './primitives';
import styled, { css } from 'styled-components';
import { MOBILE_BREAKPOINT, MOBILE_FONT_SM } from './tokens';

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  min-height: 30px;
  max-width: 100%;
  padding: 0.18rem 0.28rem 0.18rem 0.5rem;
  border-radius: var(--dw-radius-sm);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  line-height: 1;
  border: 1px solid rgba(230, 237, 243, 0.16);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  user-select: none;
  transition: border-color 180ms ease, color 180ms ease, background 180ms ease;

  ${({ $status }) =>
    $status === 'unchanged' &&
    css`
      border-color: rgba(76, 198, 193, 0.62);
      color: var(--dw-teal);
    `}

  ${({ $status }) =>
    $status === 'new' &&
    css`
      border-color: rgba(76, 198, 193, 0.7);
      color: var(--dw-teal);
    `}

  ${({ $status }) =>
    $status === 'deleted' &&
    css`
      border-color: rgba(240, 138, 123, 0.7);
      opacity: 0.75;
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.18rem;
    min-height: 29px;
    padding: 0.18rem 0.22rem 0.18rem 0.42rem;
    border-radius: var(--dw-radius-sm);
    font-size: ${MOBILE_FONT_SM};
  }

  @media (prefers-reduced-motion: reduce) {
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
  ${controlStyles}
  all: unset;
  cursor: pointer;
  font-weight: 700;
  font-family: var(--dw-font-ui);
  font-size: 0.82rem;
  line-height: 1;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  color: var(--dw-text-secondary);
  text-align: center;

  &:hover {
    color: var(--dw-coral);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 1px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 44px;
    min-height: 44px;
  }
`;
