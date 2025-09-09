// src/components/ItemDetails.styles.js
import styled, { css } from 'styled-components';

// Re-use shared chips/labels from ItemRow styles to stay consistent
export { Tag, MetaRow } from './ItemRow.styles';

export const Wrapper = styled.div`
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.35);
`;

export const Header = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
`;

export const Thumb = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  background: #111;
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.2;
  font-weight: 700;
`;

export const Micro = styled.span`
  font-size: 0.8rem;
  opacity: 0.85;
`;

export const Notes = styled.div`
  font-size: 0.95rem;
  line-height: 1.35;
  opacity: 0.9;
  white-space: pre-wrap;
`;

export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 4px 0;
`;

export const Grid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`;

export const Stat = styled.div`
  display: grid;
  gap: 4px;
`;

export const StatLabel = styled.div`
  font-size: 0.75rem;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

export const StatValue = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  opacity: 0.95;
  ${(p) =>
    p.mono &&
    css`
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        'Liberation Mono', 'Courier New', monospace;
      font-weight: 500;
    `}
`;

export const Gallery = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const GalleryImg = styled.img`
  width: 120px;
  height: 90px;
  border-radius: 8px;
  object-fit: cover;
  background: #111;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ActionBtn = styled.button`
  appearance: none;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  cursor: pointer;

  &:hover {
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
  }
`;
