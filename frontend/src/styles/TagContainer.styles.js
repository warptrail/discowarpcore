import { controlStyles, inputStyles } from './primitives';
import styled from 'styled-components';
import { MOBILE_BREAKPOINT, MOBILE_FONT_SM } from './tokens';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.32rem;
  min-width: 0;
`;

export const InputChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  max-width: 100%;
  min-height: 44px;
  padding: 0.18rem 0.34rem 0.18rem 0.52rem;
  border: 1px solid rgba(230, 237, 243, 0.18);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    border-radius: var(--dw-radius-sm);
    padding: 0.22rem 0.34rem 0.22rem 0.52rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Input = styled.input`
  ${inputStyles}
  border: none;
  outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  background: transparent;
  color: var(--dw-text);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  width: 100%;
  min-width: 0;

  &::placeholder {
    color: var(--dw-text-muted);
    text-transform: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const AddButton = styled.button`
  ${controlStyles}
  all: unset;
  cursor: pointer;
  font-weight: 700;
  font-family: var(--dw-font-ui);
  font-size: 0.9rem;
  line-height: 1;
  color: var(--dw-cyan);
  padding: 0;
  min-height: 44px;
  min-width: 44px;
  text-align: center;
  border-left: 1px solid rgba(127, 215, 255, 0.2);

  &:hover {
    color: var(--dw-violet);
  }

  &:focus-visible {
    outline: 1px solid #73ddff;
    outline-offset: 2px;
  }
`;
