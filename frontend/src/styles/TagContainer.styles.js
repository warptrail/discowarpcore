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
  align-items: center;
  gap: 0.32rem;
  min-width: 0;
`;

export const InputChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  max-width: 100%;
  min-height: 30px;
  padding: 0.18rem 0.34rem 0.18rem 0.52rem;
  border: 1px dashed rgba(127, 215, 255, 0.48);
  border-radius: 3px;
  background: rgba(8, 18, 27, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    border-radius: 3px;
    padding: 0.22rem 0.34rem 0.22rem 0.52rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const Input = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: #eee;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.74rem;
  letter-spacing: 0.045em;
  width: 100%;
  min-width: 0;

  &::placeholder {
    color: rgba(180, 212, 226, 0.52);
    text-transform: uppercase;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const AddButton = styled.button`
  all: unset;
  cursor: pointer;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1;
  color: #73ddff;
  padding: 0;
  min-height: 26px;
  min-width: 26px;
  text-align: center;
  border-left: 1px solid rgba(127, 215, 255, 0.2);

  &:hover {
    color: #d8a6ff;
  }

  &:focus-visible {
    outline: 1px solid #73ddff;
    outline-offset: 2px;
  }
`;
