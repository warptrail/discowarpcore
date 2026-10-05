import styled from 'styled-components';
import { controlStyles, inputStyles } from './primitives';

export const Wrapper = styled.div`
  display: inline-flex;
  align-items: center;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'fit-content')};
  max-width: 100%;
  min-width: 0;
  gap: 2px;
  padding: 2px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface);

  &:focus-within { border-color: var(--dw-cyan); }
`;

export const ValueShell = styled.div`
  position: relative;
  display: grid;
  flex: ${({ $fullWidth }) => ($fullWidth ? '1' : '0 0 auto')};
  min-width: 0;
  justify-items: center;
`;

export const ValueKicker = styled.span`
  position: absolute;
  top: 2px;
  z-index: 1;
  color: var(--dw-text-secondary);
  font-size: 0.55rem;
  font-weight: 650;
  pointer-events: none;
`;

export const Button = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  min-width: 40px;
  height: 40px;
  padding: 0;
  color: var(--dw-cyan);
  font-size: 1.2rem;
  line-height: 1;
`;

export const Input = styled.input`
  ${inputStyles}
  width: ${({ $compact }) => ($compact ? '2.6rem' : '3.6rem')};
  max-width: 100%;
  height: 40px;
  padding: ${({ $compact }) => ($compact ? '0.15rem' : '0.55rem 0.2rem 0')};
  text-align: center;
  font-family: var(--dw-font-data);
  font-size: 1rem;
  font-weight: 650;
  appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`;
