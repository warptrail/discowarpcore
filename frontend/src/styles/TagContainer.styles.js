import styled from 'styled-components';
import { MOBILE_BREAKPOINT, MOBILE_FONT_SM } from './tokens';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-width: 0;
`;

export const InputChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  padding: 0.25rem 0.6rem;
  border-radius: 14px;
  font-size: 0.85rem;
  border: 2px dashed #555;
  background: rgba(255, 255, 255, 0.05);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    border-radius: 10px;
    border-width: 1px;
    padding: 0.28rem 0.4rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Input = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: #eee;
  font-size: 0.85rem;
  width: 100%;
  min-width: 0;

  &::placeholder {
    color: #666;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
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
  min-height: 30px;
  min-width: 22px;
  text-align: center;

  &:hover {
    color: #0ff;
  }
`;
