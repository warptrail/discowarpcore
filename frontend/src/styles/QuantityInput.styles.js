import styled from 'styled-components';

const LCARS = {
  shell: '#101620',
  shellSoft: '#1a2230',
  line: 'rgba(106, 140, 176, 0.7)',
  teal: '#4cc6c1',
  lilac: '#a7b6ff',
  text: '#ebf2f9',
};

export const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'fit-content')};
  padding: 0.18rem;
  border-radius: 14px;
  border: 1px solid ${LCARS.line};
  background:
    radial-gradient(circle at 50% 0%, rgba(76, 198, 193, 0.16), transparent 54%),
    linear-gradient(135deg, ${LCARS.shell}, ${LCARS.shellSoft});
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 8px 16px rgba(0, 0, 0, 0.25);
  isolation: isolate;
  overflow: hidden;

  &:focus-within {
    border-color: rgba(167, 182, 255, 0.86);
    box-shadow:
      0 0 0 2px rgba(167, 182, 255, 0.16),
      0 8px 18px rgba(0, 0, 0, 0.28);
  }
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
  top: 0.12rem;
  z-index: 2;
  color: rgba(167, 182, 255, 0.7);
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  pointer-events: none;
`;

export const Button = styled.button`
  position: relative;
  z-index: 1;
  min-width: 2.45rem;
  height: 2.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(76, 198, 193, 0.55);
  border-radius: 9px;
  background: linear-gradient(180deg, rgba(76, 198, 193, 0.3), rgba(76, 198, 193, 0.13));
  color: ${LCARS.text};
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;

  &:hover:enabled {
    background: linear-gradient(180deg, rgba(76, 198, 193, 0.36), rgba(76, 198, 193, 0.2));
    border-color: rgba(76, 198, 193, 0.8);
  }

  &:active:enabled {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.46;
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    min-width: 2.75rem;
    height: 2.75rem;
  }
`;

export const Input = styled.input`
  position: relative;
  z-index: 1;
  width: 3.6rem;
  height: 2.45rem;
  text-align: center;
  font-size: 1.14rem;
  font-weight: 700;
  color: ${LCARS.text};
  border-radius: 8px;
  border: 1px solid rgba(167, 182, 255, 0.56);
  background: #0b1018;
  outline: none;
  padding: 0.42rem 0.2rem 0;

  &:focus {
    border-color: ${LCARS.lilac};
    box-shadow: 0 0 0 2px rgba(167, 182, 255, 0.24);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  -moz-appearance: textfield;

  @media (max-width: 560px) {
    width: 3.6rem;
    height: 2.75rem;
  }
`;
