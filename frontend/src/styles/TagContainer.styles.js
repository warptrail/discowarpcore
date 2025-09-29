import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const Input = styled.input`
  flex: 1;
  min-width: 120px;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #555;
  background: #141414;
  color: #eee;

  &::placeholder {
    color: #666;
  }
`;

export const AddButton = styled.button`
  padding: 0.35rem 0.7rem;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  background: var(--accent, #00e0ff);
  color: #000;
  cursor: pointer;
  transition: transform 120ms ease, background 160ms ease;

  &:hover {
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`;
