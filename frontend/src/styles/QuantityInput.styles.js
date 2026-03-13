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
  gap: 0.48rem;
  width: fit-content;
  padding: 0.34rem;
  border-radius: 18px;
  border: 1px solid ${LCARS.line};
  background: linear-gradient(135deg, ${LCARS.shell}, ${LCARS.shellSoft});
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 8px 16px rgba(0, 0, 0, 0.25);
  isolation: isolate;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
    opacity: 0.64;
  }

  &::before {
    left: 0.52rem;
    right: 0.52rem;
    top: 0.25rem;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, ${LCARS.teal}, ${LCARS.lilac});
  }

  &::after {
    left: 50%;
    transform: translateX(-50%);
    bottom: 0.22rem;
    width: 1.9rem;
    height: 2px;
    border-radius: 999px;
    background: ${LCARS.teal};
  }
`;

export const Button = styled.button`
  position: relative;
  z-index: 1;
  min-width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(76, 198, 193, 0.55);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(76, 198, 193, 0.26), rgba(76, 198, 193, 0.15));
  color: ${LCARS.text};
  font-size: 1.45rem;
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
`;

export const Input = styled.input`
  position: relative;
  z-index: 1;
  width: 3.15rem;
  height: 2.1rem;
  text-align: center;
  font-size: 1.06rem;
  font-weight: 700;
  color: ${LCARS.text};
  border-radius: 10px;
  border: 1px solid rgba(167, 182, 255, 0.56);
  background: #0b1018;
  outline: none;
  padding: 0;

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
`;
