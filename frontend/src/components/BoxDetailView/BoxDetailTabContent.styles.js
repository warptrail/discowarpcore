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

export const DetailActionSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
`;

export const SectionHeading = styled.header`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0.72rem 0 0.22rem;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: var(--box-neon, rgba(231, 236, 243, 0.86));
  font: 800 0.82rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const SectionCount = styled.span`
  color: rgba(231, 236, 243, 0.54);
  font: 700 0.68rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: nowrap;
`;

export const SectionRule = styled.div`
  height: 1px;
  flex: 1;
  background: linear-gradient(
    90deg,
    rgba(var(--box-primary-rgb, 76, 198, 193), 0.52),
    rgba(var(--box-secondary-rgb, 167, 139, 250), 0.12),
    transparent
  );
`;

export const SectionManageButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 28px;
  margin-left: auto;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: rgba(190, 204, 214, 0.48);
  gap: 3px;
  cursor: pointer;
  &:hover, &:focus-visible { color: rgba(226, 237, 242, 0.9); background: rgba(120, 170, 182, 0.08); outline: 1px solid rgba(120, 170, 182, 0.28); }
`;

export const ManageDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${({ $i }) => ['#4cc6c1', '#a78bfa', '#7fb7ff', '#70d6a7'][$i]};
  box-shadow: 0 0 5px currentColor;
  animation: manage-dot-wave 1.35s ease-in-out infinite;
  animation-delay: ${({ $i }) => `${$i * 110}ms`};

  @keyframes manage-dot-wave {
    0%, 100% { transform: translateY(2px); opacity: 0.46; }
    50% { transform: translateY(-2px); opacity: 0.95; }
  }

  @media (prefers-reduced-motion: reduce) { animation: none; }
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
  margin-top: ${({ $compact }) => ($compact ? '-0.12rem' : '0.66rem')};
  display: grid;
  gap: 0.52rem;
`;

export const InlineActionsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;

  ${({ $compact }) => $compact && `
    display: flex;
    justify-content: flex-end;
    gap: 0.32rem;
  `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

export const InlineActionButton = styled.button`
  min-height: ${({ $compact }) => ($compact ? '27px' : '42px')};
  border-radius: ${({ $compact }) => ($compact ? '4px' : '5px')};
  border: 1px solid
    ${({ $active, $tone }) => {
      if ($active) return 'rgba(0, 255, 224, 0.92)';
      if ($tone === 'assign') return 'rgba(190, 117, 255, 0.72)';
      return 'rgba(0, 223, 255, 0.72)';
    }};
  background: ${({ $active, $tone }) => {
    if ($active) {
      return 'linear-gradient(180deg, rgba(0, 92, 96, 0.9) 0%, rgba(4, 35, 47, 0.98) 100%)';
    }
    if ($tone === 'assign') {
      return 'linear-gradient(180deg, rgba(48, 29, 74, 0.92) 0%, rgba(15, 24, 43, 0.98) 100%)';
    }
    return 'linear-gradient(180deg, rgba(13, 48, 64, 0.94) 0%, rgba(8, 25, 39, 0.98) 100%)';
  }};
  color: ${({ $active, $tone }) => {
    if ($active) return '#cffffb';
    if ($tone === 'assign') return '#f0d7ff';
    return '#c8f7ff';
  }};
  font-size: ${({ $compact }) => ($compact ? '0.57rem' : '0.78rem')};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: ${({ $compact }) => ($compact ? '0 0.52rem' : '0 0.78rem')};
  cursor: pointer;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.035), 0 0 8px
    ${({ $active, $tone }) => {
      if ($active) return 'rgba(0, 255, 224, 0.34)';
      if ($tone === 'assign') return 'rgba(190, 117, 255, 0.18)';
      return 'rgba(0, 223, 255, 0.18)';
    }};

  &:hover:not(:disabled) {
    border-color: ${({ $tone }) => ($tone === 'assign' ? '#d59aff' : '#57f3ff')};
    filter: brightness(1.14);
    box-shadow: 0 0 0 1px rgba(0, 223, 255, 0.22), 0 0 12px
      ${({ $tone }) => ($tone === 'assign' ? 'rgba(190, 117, 255, 0.42)' : 'rgba(0, 223, 255, 0.42)')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${({ $compact }) => ($compact ? '26px' : '40px')};
    border-radius: 4px;
    font-size: ${({ $compact }) => ($compact ? '0.52rem' : '0.72rem')};
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
