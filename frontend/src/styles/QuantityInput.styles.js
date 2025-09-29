import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(20, 20, 20, 0.9);
  border: 2px solid var(--accent, #0ff);
  border-radius: 12px;
  padding: 0.3rem 0.6rem;
  width: fit-content;
`;

export const Button = styled.button`
  background: var(--accent, #0ff);
  color: #000;
  font-weight: bold;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #fff35c;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const Input = styled.input`
  width: 3rem;
  text-align: center;
  font-size: 1rem;
  color: #fff;
  background: transparent;
  border: none;
  outline: none;

  /* LCARS underline style */
  border-bottom: 2px solid var(--accent, #0ff);
  padding-bottom: 0.1rem;

  /* Remove arrows in number input */
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;
