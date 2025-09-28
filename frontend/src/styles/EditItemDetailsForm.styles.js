import styled from 'styled-components';

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const Label = styled.label`
  font-size: 0.9rem;
  font-weight: bold;
  color: #ccc;
`;

export const Input = styled.input`
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #444;
  background: #111;
  color: #eee;

  &:focus {
    outline: none;
    border-color: #0ff;
  }
`;

export const TextArea = styled.textarea`
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #444;
  background: #111;
  color: #eee;
  min-height: 4rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #0ff;
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const disabledStyles = `
  opacity: 0.5;
  cursor: not-allowed;
`;

export const SaveButton = styled.button`
  background: #0f0;
  color: #000;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;

  &:hover:enabled {
    background: #1cff1c;
  }

  &:active:enabled {
    transform: scale(0.96);
  }

  &:disabled {
    ${disabledStyles}
  }
`;

export const RevertButton = styled.button`
  background: #222;
  color: #bbb;
  padding: 0.5rem 1rem;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:enabled {
    background: #333;
    color: #fff;
  }

  &:disabled {
    ${disabledStyles}
  }
`;
