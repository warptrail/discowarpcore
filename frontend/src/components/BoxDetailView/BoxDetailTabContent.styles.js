import styled from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

export const TreeTabScope = styled.div`
  position: relative;
  isolation: isolate;
  contain: paint;
  min-width: 0;
  padding-left: 0.74rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-left: 0.14rem;
  }
`;

export const FlatTabScope = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.42rem;
  }
`;

export const FlatEmpty = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.5rem 0.62rem;
  font-size: 0.88rem;
  color: rgba(230, 237, 243, 0.72);
  background:
    linear-gradient(90deg, rgba(167, 182, 255, 0.16) 0%, transparent 44%),
    #14181b;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 10px;
    padding: 0.44rem 0.52rem;
    font-size: 0.8rem;
  }
`;
