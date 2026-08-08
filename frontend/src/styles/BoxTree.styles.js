// frontend/src/styles/BoxTree.styles.js
import styled, { keyframes } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
} from './tokens';
import {
  RailBack as SharedRailBack,
  RailFront as SharedRailFront,
  SectionTitle,
  ViewModeLabel,
} from './Lists.shared.styles';

export * from './Lists.shared.styles';

export const RailBack = styled(SharedRailBack)`
  background: rgba(var(--box-primary-rgb, 127, 215, 255), 0.18);
  border: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.32);
  filter: drop-shadow(
    0 0 ${({ $isRoot }) => ($isRoot ? '5px' : '3px')}
      rgba(var(--box-primary-rgb, 127, 215, 255), 0.1)
  );
`;

export const FinderReveal = styled.div`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transform: translateY(${({ $open }) => ($open ? '0' : '-6px')});
  margin-bottom: ${({ $open }) => ($open ? '0.6rem' : '0')};
  transition:
    grid-template-rows 180ms ease,
    opacity 140ms ease,
    transform 180ms ease,
    margin-bottom 180ms ease;

  > * {
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: ${({ $open }) => ($open ? '0.42rem' : '0')};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const FinderRevealContent = styled.div`
  min-height: 0;
  overflow: hidden;

  > * {
    margin-bottom: 0;
  }
`;

export const RailFront = styled(SharedRailFront)`
  padding-left: ${({ $isRoot }) => ($isRoot ? '0.58rem' : '0.48rem')};
  background: rgba(12, 15, 17, 0.97);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-left: ${({ $isRoot }) => ($isRoot ? '0.36rem' : '0.32rem')};
    background: rgba(12, 15, 17, 0.97);
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
  color: var(--box-neon, #7fd7ff);

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

export const TreeSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;

  ${TreeSectionTitle} {
    min-width: 0;
    flex: 1 1 auto;
  }
`;

export const AsciiTree = styled.section`
  min-width: 0;
  margin-top: 0.18rem;
  padding: 0 0.12rem 0.22rem;
  color: rgba(211, 228, 233, 0.86);
`;

export const AsciiBranch = styled.div`
  margin: 0.18rem 0 0.1rem;
  padding: 0.34rem 0.42rem 0.38rem;
  border-left: 1px solid rgba(76, 198, 193, 0.28);
  background: rgba(7, 13, 19, 0.32);
  font: 600 0.75rem/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  overflow-x: auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.26rem 0.28rem 0.3rem;
    font-size: 0.68rem;
  }
`;

export const AsciiLine = styled.div`
  display: flex;
  align-items: baseline;
  min-width: max-content;
  min-height: 1.45rem;
  padding-left: ${({ $depth = 0 }) => `${Math.min($depth, 8) * 0.18}rem`};
`;

export const AsciiPrefix = styled.span`
  color: rgba(127, 215, 255, 0.62);
  white-space: pre;
  user-select: none;
`;

export const AsciiBoxLabel = styled.span`
  color: rgba(229, 245, 247, 0.94);
  font-weight: 800;
`;

export const AsciiItemButton = styled.button`
  display: inline-flex;
  align-items: baseline;
  min-width: max-content;
  min-height: 1.45rem;
  padding: 0;
  border: 0;
  color: ${({ $active }) => ($active ? 'rgba(225, 255, 250, 0.98)' : 'rgba(197, 214, 220, 0.78)')};
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    color: rgba(225, 255, 250, 0.98);
  }

  &:focus-visible {
    outline: 1px solid rgba(127, 215, 255, 0.72);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: default;
  }
`;

export const AsciiLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const AsciiMeta = styled.span`
  margin-left: 0.55rem;
  color: rgba(167, 139, 250, 0.74);
  font-size: 0.88em;
`;

export const TreeBoxIdChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
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
  border-radius: 3px;
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
  border-radius: 2px;
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
