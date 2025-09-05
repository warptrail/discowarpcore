// src/components/ItemRow.styles.js
import styled, { css } from 'styled-components';

export const Empty = styled.div`
  opacity: 0.7;
  font-size: 0.95rem;
  padding: 0.5rem 0.25rem;
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
`;

export const Chip = styled.button`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.35);
  cursor: pointer;
  text-align: left;
  ${(p) =>
    p.$compact &&
    css`
      padding: 8px;
      gap: 8px;
    `}
  ${(p) =>
    p.$selected &&
    css`
      border-color: rgba(255, 220, 100, 0.6);
      box-shadow: 0 0 0 2px rgba(255, 220, 100, 0.15) inset;
    `}
  &:hover {
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
  }
`;

export const Thumb = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  background: #111;
`;

export const Meta = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

export const TopLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

export const Name = styled.div`
  font-size: ${(p) => (p.$compact ? '0.95rem' : '1rem')};
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Badge = styled.span`
  font-size: 0.75rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  opacity: 0.9;
`;

export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Tag = styled.span`
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  opacity: 0.85;
`;

export const Notes = styled.div`
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1.25;
  max-height: 2.5em;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MetaRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.8rem;
  opacity: 0.8;
`;

export const BoxChip = styled.span`
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
  opacity: 0.9;
`;

export const Micro = styled.span``;
