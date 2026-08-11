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

export const SectionNote = styled.span`
  color: rgba(174, 197, 208, 0.48);
  font: 700 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const SectionActionButton = styled.button`
  flex: 0 0 auto; min-height: 28px; border: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.58); border-radius: 7px;
  background: rgba(25, 73, 76, 0.24); color: rgba(207, 249, 247, 0.92); padding: 0.3rem 0.52rem;
  font: 800 0.61rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.07em; text-transform: uppercase; cursor: pointer;
`;

export const SelectionToolbar = styled.div`
  position: sticky; top: 0.5rem; z-index: 4; display: flex; flex-wrap: wrap; align-items: center; gap: 0.42rem;
  padding: 0.46rem; border: 1px solid rgba(184, 91, 234, 0.48); border-radius: 10px; background: rgba(13, 14, 29, 0.96);
`;
export const SelectionCount = styled.span`
  margin-right: auto; color: rgba(239, 215, 255, 0.9); font: 800 0.68rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.06em;
`;
export const SelectionButton = styled.button`
  min-height: 29px; border: 1px solid rgba(154, 129, 243, 0.58); border-radius: 7px; background: ${({ $primary }) => ($primary ? 'rgba(109, 78, 187, 0.32)' : 'rgba(20, 28, 49, 0.78)')};
  color: rgba(229, 230, 255, 0.9); padding: 0.28rem 0.46rem; font: 700 0.59rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
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
  gap: 0.24rem;
  padding: ${({ $compact }) => ($compact ? '0' : '0.28rem 0')};
  border-top: 1px solid rgba(var(--box-primary-rgb, 76, 198, 193), 0.16);
  border-bottom: 1px solid rgba(var(--box-secondary-rgb, 167, 139, 250), 0.12);
`;

export const InlineActionsLabel = styled.div`
  color: rgba(163, 183, 194, 0.64);
  font: 700 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`;

export const InlineActionsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;

  ${({ $compact }) => $compact && `
    display: flex;
    justify-content: flex-end;
    gap: 0.32rem;
  `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const InlineActionButton = styled.button`
  position: relative;
  min-height: ${({ $compact }) => ($compact ? '27px' : '36px')};
  min-width: 0;
  padding: ${({ $compact }) => ($compact ? '0 0.52rem' : '0.35rem 0.62rem 0.48rem')};
  border: 0;
  border-right: 1px solid rgba(127, 215, 255, 0.1);
  border-radius: 0;
  background: ${({ $active }) => ($active ? 'rgba(45, 154, 151, 0.08)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'rgba(229, 255, 251, 0.96)' : 'rgba(185, 205, 216, 0.65)')};
  font-size: ${({ $compact }) => ($compact ? '0.57rem' : '0.65rem')};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  cursor: pointer;
  line-height: 1.12;
  text-align: left;
  transition: color 180ms ease, background 180ms ease;

  &::after {
    content: '';
    position: absolute;
    right: 0.56rem;
    bottom: 0;
    left: 0.56rem;
    height: 2px;
    background: ${({ $active }) => ($active ? 'rgba(76, 198, 193, 0.88)' : 'transparent')};
    box-shadow: ${({ $active }) => ($active ? '0 0 8px rgba(76, 198, 193, 0.3)' : 'none')};
    transition: background 180ms ease, box-shadow 180ms ease;
  }

  &:hover:not(:disabled) {
    color: rgba(239, 247, 255, 0.94);
    background: rgba(103, 86, 158, 0.09);
  }

  &:focus-visible {
    z-index: 1;
    outline: 2px solid rgba(127, 215, 255, 0.76);
    outline-offset: -2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${({ $compact }) => ($compact ? '26px' : '38px')};
    padding-inline: ${({ $compact }) => ($compact ? '0.52rem' : '0.42rem')};
    font-size: ${({ $compact }) => ($compact ? '0.52rem' : '0.58rem')};
    letter-spacing: 0.05em;
    text-align: center;
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
