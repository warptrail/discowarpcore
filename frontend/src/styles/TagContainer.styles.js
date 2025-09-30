import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const InputChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  border-radius: 14px;
  font-size: 0.85rem;
  border: 2px dashed #555;
  background: rgba(255, 255, 255, 0.05);
`;

export const Input = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: #eee;
  font-size: 0.85rem;
  min-width: 80px;

  &::placeholder {
    color: #666;
  }
`;

export const AddButton = styled.button`
  all: unset;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  line-height: 1;
  color: var(--accent, #00e0ff);
  padding: 0 0.25rem;

  &:hover {
    color: #0ff;
  }
`;
