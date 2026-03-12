import styled from 'styled-components';

export const FormContainer = styled.div`
  background-color: #1e1e1e;
  color: #eee;
  padding: 1rem;
  border-radius: 0px 0px 10px 10px;
  border: 1px solid #333;
  border-top: none;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
`;

export const Input = styled.input`
  width: 100%;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export const Button = styled.button`
  background-color: ${(props) =>
    props.$variant === 'close' ? '#555' : '#009688'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border: 1px solid red;
  }

  &:hover {
    background-color: ${(props) =>
      props.$variant === 'close' ? '#666' : '#00796b'};
  }
`;

export const SaveFlash = styled.span`
  color: limegreen;
  font-weight: bold;
  margin-left: 8px;
`;
