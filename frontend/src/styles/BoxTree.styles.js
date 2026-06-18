// frontend/src/styles/BoxTree.styles.js
import styled, { keyframes } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
} from './tokens';
import {
  RailFront as SharedRailFront,
  SectionTitle,
  ViewModeLabel,
} from './Lists.shared.styles';

export * from './Lists.shared.styles';

export const RailFront = styled(SharedRailFront)`
  padding-left: ${({ $isRoot }) => ($isRoot ? '0.58rem' : '0.48rem')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-left: ${({ $isRoot }) => ($isRoot ? '0.36rem' : '0.32rem')};
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    padding-left: ${({ $isRoot }) => ($isRoot ? '0.32rem' : '0.28rem')};
  }
`;

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

const slideCondensedControlsDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const CondensedControlsPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0.52rem 0 0.72rem;
  padding: 0.55rem 0.68rem;
  border: 1px solid rgba(127, 215, 255, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
  flex-wrap: wrap;
  animation: ${slideCondensedControlsDown} 180ms ease-out;

  ${ViewModeLabel} {
    min-height: 32px;
    padding: 0.22rem 0.48rem;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: stretch;
    gap: 0.5rem;

    ${ViewModeLabel} {
      width: auto;
      flex: 1 1 100%;
    }
  }
`;

export const SelectionCount = styled.span`
  color: rgba(237, 245, 247, 0.84);
  font-size: 0.84rem;
  font-weight: 760;
`;

export const SelectionActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  flex-wrap: wrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
  }
`;

export const SelectionButton = styled.button`
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'move'
        ? 'rgba(112, 218, 184, 0.5)'
        : $tone === 'dispose'
          ? 'rgba(240, 180, 104, 0.54)'
          : 'rgba(127, 215, 255, 0.2)'};
  border-radius: 8px;
  background: ${({ $tone }) =>
    $tone === 'move'
      ? 'rgba(32, 113, 83, 0.44)'
      : $tone === 'dispose'
        ? 'rgba(116, 67, 21, 0.44)'
        : 'rgba(127, 215, 255, 0.08)'};
  color: ${({ $tone }) =>
    $tone === 'move' ? '#eafff7' : $tone === 'dispose' ? '#fff2df' : '#dceff8'};
  min-height: 30px;
  padding: 0 0.58rem;
  font-size: 0.78rem;
  font-weight: 760;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ $tone }) =>
      $tone === 'move'
        ? 'rgba(112, 218, 184, 0.68)'
        : $tone === 'dispose'
          ? 'rgba(240, 180, 104, 0.72)'
          : 'rgba(127, 215, 255, 0.42)'};
    background: ${({ $tone }) =>
      $tone === 'move'
        ? 'rgba(32, 113, 83, 0.58)'
        : $tone === 'dispose'
          ? 'rgba(116, 67, 21, 0.58)'
          : 'rgba(127, 215, 255, 0.13)'};
  }

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1 1 auto;
  }
`;
