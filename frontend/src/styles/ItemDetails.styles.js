import styled, { keyframes } from 'styled-components';
import { BASE_BORDER, ACTIVE_BORDER, CARD_BG } from './tokens';

/* Animations */
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const slideUp = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-4px); }
`;

/* Shell */
export const DetailsCard = styled.div`
  position: relative;
  margin-top: -1px; /* fuse with ItemRow */
  border: 1px solid ${BASE_BORDER};
  border-top: 0;
  background: ${CARD_BG};
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  padding: 10px 10px 12px 10px;

  transition: border-color 160ms ease, box-shadow 160ms ease;

  &[data-open='true'] {
    border-color: ${ACTIVE_BORDER};
    box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.08) inset;
  }
  &[data-opening='true'] {
    animation: ${slideDown} 140ms ease-out;
  }
  &[data-closing='true'] {
    animation: ${slideUp} 120ms ease-in forwards;
  }
`;

export const Wrapper = styled.div`
  position: relative;
`;

/* Header */
export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
`;

export const Thumb = styled.img`
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid ${BASE_BORDER};
  flex: 0 0 42px;
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 0.95rem; /* compact */
  font-weight: 600;
  color: #eaeaea;
  line-height: 1.15;
`;

export const SubTitle = styled.div`
  margin-top: 2px;
  font-size: 0.78rem;
  color: #c9c9c9;
  line-height: 1.2;
`;

export const Micro = styled.span`
  display: inline-block;
  margin-top: 2px;
  font-size: 0.7rem; /* smaller */
  color: #a8a8a8;
  letter-spacing: 0.01em;
`;

/* Body */
export const Notes = styled.p`
  margin: 6px 0 8px 0;
  font-size: 0.85rem; /* smaller */
  line-height: 1.3;
  color: #c7c7c7;
  white-space: pre-wrap;
`;

/* Key–value grid */
export const DataGrid = styled.dl`
  display: grid;
  grid-template-columns: 108px 1fr; /* narrow label column */
  column-gap: 8px;
  row-gap: 4px;
  margin: 4px 0 6px 0;

  dt,
  dd {
    margin: 0;
  }

  dt {
    font-size: 0.68rem;
    color: #9da3a8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1.2;
    white-space: nowrap;
  }
  dd {
    font-size: 0.78rem;
    color: #cfd3d7;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  /* light separators for long lists */
  & > dt:nth-of-type(n + 3),
  & > dd:nth-of-type(n + 3) {
    border-top: 1px dashed rgba(160, 160, 160, 0.12);
    padding-top: 4px;
  }

  @media (min-width: 560px) {
    grid-template-columns: 140px 1fr;
    dt {
      font-size: 0.7rem;
    }
    dd {
      font-size: 0.8rem;
    }
  }
`;

export const LastUsedButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  color: #fff;
  font-size: 0.9rem;
  padding: 0.35rem 0.75rem;
  margin: 0.75rem 0;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.35);
  }

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
`;
