// frontend/src/styles/BoxTree.styles.js
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
} from './tokens';
import { SectionTitle } from './Lists.shared.styles';

export * from './Lists.shared.styles';

export const TreeSectionTitle = styled(SectionTitle)`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.62rem;
  margin-bottom: 0.36rem;
  font-size: ${({ $isRoot }) => ($isRoot ? '1.16rem' : '1.02rem')};
  line-height: 1.18;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.3rem;
    margin-top: 0.34rem;
    margin-bottom: 0.18rem;
    font-size: 0.78rem;
    line-height: 1.14;
    flex-wrap: wrap;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    gap: 0.24rem;
    margin-top: 0.28rem;
    margin-bottom: 0.16rem;
  }
`;

export const TreeBoxIdChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid currentColor;
  background: rgba(255, 255, 255, 0.07);
  color: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.74em;
  font-weight: 860;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
  padding: 0.24rem 0.56rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.12rem 0.32rem;
    font-size: 0.66rem;
    letter-spacing: 0.07em;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    padding: 0.1rem 0.28rem;
    font-size: 0.62rem;
    letter-spacing: 0.05em;
  }
`;

export const TreeBoxLabel = styled.span`
  color: #ecf2f8;
  font-size: 1em;
  font-weight: 820;
  letter-spacing: 0.01em;
  min-width: 0;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    line-height: 1.16;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    line-height: 1.12;
  }
`;
