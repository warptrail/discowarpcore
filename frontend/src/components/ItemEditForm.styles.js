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

export const TextArea = styled.textarea`
  width: 100%;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  min-height: 80px;
  resize: vertical;
`;

export const Select = styled.select`
  width: 100%;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
`;

export const SectionTitle = styled.h4`
  margin: 1rem 0 0.5rem;
  font-size: 0.92rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b7d4d1;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const CheckboxRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const Checkbox = styled.input`
  width: auto;
  margin: 0;
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
