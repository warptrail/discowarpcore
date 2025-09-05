// src/styles/BoxMetaPanel.styles.js
// Minimal dark-mode styles with slight LCARS rounding.
// You can refine and theme later; this keeps BoxMetaPanel.jsx lean.

import styled from 'styled-components';

const Wrap = styled.section`
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid #222;
  border-radius: 16px; /* LCARS vibe */
  background: #131414; /* dark mode card */
`;

const TopGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 100px 1fr;

  @media (min-width: 900px) {
    grid-template-columns: 140px 1fr;
  }
`;

const ImageSquare = styled.button`
  all: unset;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #2a2a2a;
  background: #0f0f0f;
  display: block;
  cursor: pointer;

  &:hover {
    filter: brightness(1.05);
  }
`;

const ThumbImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Core = styled.div`
  display: grid;
  gap: 6px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(1.05rem, 1.8vw, 1.2rem);
  color: #e9f0f5;
  font-weight: 700;
`;

const Subtle = styled.div`
  color: #9fb0bd;
  font-size: 13px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  padding: 6px 10px;
  border: 1px solid #2a2f33;
  border-radius: 12px;
  background: #0e1012;
  color: #cfe2ef;
  font-size: 13px;
  line-height: 1;
`;

const Chip = styled.button`
  all: unset;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 12px;
  background: #101214;
  border: 1px solid #2a2f33;
  color: #d7e3ea;
  font-size: 13px;
  line-height: 1;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.05s ease;

  &:hover {
    background: #151a1f;
    border-color: #3a4249;
  }
  &:active {
    transform: translateY(1px);
  }
`;

const Divider = styled.hr`
  height: 1px;
  border: none;
  background: #1a1d21;
  margin: 6px 0 2px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #cfd6dd;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const Muted = styled.div`
  color: #7b8894;
  font-size: 13px;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.div`
  padding: 5px 8px;
  border: 1px solid #2a2f33;
  border-radius: 10px;
  background: #0d0f11;
  color: #b6c6d2;
  font-size: 12px;
`;

export const styledComponents = {
  Wrap,
  TopGrid,
  ImageSquare,
  ThumbImg,
  Core,
  Title,
  Subtle,
  Row,
  Stat,
  Chip,
  Divider,
  SectionHeader,
  SectionTitle,
  ChipRow,
  Muted,
  TagRow,
  Tag,
};
