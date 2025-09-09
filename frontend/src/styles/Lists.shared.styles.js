// frontend/src/styles/Lists.shared.styles.js
import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

export const ShortId = styled.span`
  font-size: 0.9rem;
  color: #888;
  margin-left: 0.5rem;
`;

export const SectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 500;
  margin: 0.75rem 0 0.25rem 0;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const TagBubble = styled.button`
  background: #000;
  border: 1px solid #444;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
  color: #eee;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
  &:hover {
    border-color: #888;
    background: #0a0a0a;
  }
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Count = styled.span`
  font-size: 0.9rem;
  color: #aaa;
`;
