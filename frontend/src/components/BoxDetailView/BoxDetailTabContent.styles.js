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

export const InlineActionsArea = styled.section`
  margin-top: 0.66rem;
  display: grid;
  gap: 0.52rem;
`;

export const InlineActionsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

export const InlineActionButton = styled.button`
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid
    ${({ $active, $tone }) => {
      if ($active) return 'rgba(160, 230, 198, 0.84)';
      if ($tone === 'assign') return 'rgba(124, 204, 154, 0.62)';
      return 'rgba(111, 176, 230, 0.56)';
    }};
  background: ${({ $active, $tone }) => {
    if ($active) {
      return 'linear-gradient(180deg, rgba(19, 58, 44, 0.96) 0%, rgba(13, 40, 30, 0.96) 100%)';
    }
    if ($tone === 'assign') {
      return 'linear-gradient(180deg, rgba(14, 38, 28, 0.96) 0%, rgba(10, 28, 20, 0.96) 100%)';
    }
    return 'linear-gradient(180deg, rgba(11, 28, 42, 0.96) 0%, rgba(8, 20, 31, 0.96) 100%)';
  }};
  color: ${({ $active }) => ($active ? '#ecfff4' : '#d8eafc')};
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0 0.78rem;
  cursor: pointer;
  text-align: center;

  &:hover:not(:disabled) {
    border-color: ${({ $tone }) =>
      $tone === 'assign'
        ? 'rgba(152, 230, 182, 0.82)'
        : 'rgba(140, 202, 255, 0.74)'};
    box-shadow: 0 0 0 1px rgba(88, 150, 216, 0.18);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
    border-radius: 10px;
    font-size: 0.72rem;
  }
`;

export const InlinePanelShell = styled.div`
  display: grid;
  gap: 0.46rem;
  border: 1px solid rgba(88, 146, 112, 0.5);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(8, 18, 13, 0.9) 0%, rgba(7, 14, 10, 0.94) 100%);
  padding: 0.52rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 10px;
    padding: 0.42rem;
  }

  & > section {
    margin-top: 0;
  }
`;

export const InlinePanelHeader = styled.div`
  display: grid;
  gap: 0.24rem;
`;

export const InlinePanelTitle = styled.h4`
  margin: 0;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #cae5d4;
`;

export const InlinePanelContext = styled.div`
  font-size: 0.74rem;
  color: rgba(183, 214, 194, 0.9);
`;

export const QuickCreateNotice = styled.div`
  border: 1px dashed rgba(120, 168, 205, 0.48);
  border-radius: 10px;
  padding: 0.48rem 0.58rem;
  color: rgba(202, 224, 244, 0.82);
  font-size: 0.76rem;
`;
