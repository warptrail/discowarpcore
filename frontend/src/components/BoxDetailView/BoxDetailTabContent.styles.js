import { controlStyles } from '../../styles/primitives';
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
  align-items: stretch;
  min-width: 0;
  min-height: 48px;
  margin: 4px 0 0;
  border: 1px solid var(--dw-border-soft);
  border-left: 2px solid var(--dw-cyan);
  border-radius: 3px 9px 3px 3px;
  background: linear-gradient(110deg, rgba(113, 210, 255, .055), transparent 65%), var(--dw-surface);
`;

export const SectionIdentity = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 10px;
  padding: 0 12px;
  @media (max-width: 390px) { gap: 8px; padding-inline: 8px; }
`;

export const SectionTitle = styled.h2`
  margin: 0;
  min-width: 0;
  color: var(--dw-text);
  font: 600 .85rem/1.2 var(--dw-font-ui);
  overflow-wrap: anywhere;
`;

export const SectionCount = styled.span`
  flex: 0 0 auto;
  color: var(--dw-text-secondary);
  font: 500 .8rem/1.2 var(--dw-font-data);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const SectionCountFull = styled.span`
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

export const SectionCountCompact = styled.span`
  display: none;
  @media (max-width: ${MOBILE_BREAKPOINT}) { display: inline; }
`;

export const SectionNote = styled.span`
  min-width: 0;
  color: var(--dw-text-muted);
  font: 400 .75rem/1.2 var(--dw-font-ui);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (max-width: 1000px) { display: none; }
`;

export const SectionCommands = styled.div`
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  border-left: 1px solid var(--dw-border-soft);
  background: rgba(113, 210, 255, .035);
`;

export const SectionActionButton = styled.button`
  ${controlStyles}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 12px;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--dw-cyan);
  font: 550 .8rem/1.2 var(--dw-font-ui);
  svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  &:hover { background: rgba(113, 210, 255, .08); }
  &:focus-visible { outline-offset: -3px; }
  @media (max-width: 390px) { gap: 6px; padding-inline: 10px; }
`;

export const SectionActionFull = styled.span`
  @media (max-width: ${MOBILE_BREAKPOINT}) { display: none; }
`;

export const SectionActionCompact = styled.span`
  display: none;
  @media (max-width: ${MOBILE_BREAKPOINT}) { display: inline; }
`;

export const SelectionToolbar = styled.div`
  position: sticky;
  top: 0.5rem;
  z-index: 4;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 0.42rem;
  padding: 0.46rem;
  border: 1px solid rgba(230, 237, 243, 0.14);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    padding: 0.5rem;

    > button:nth-of-type(1) {
      grid-column: 1;
      grid-row: 2;
    }

    > button:nth-of-type(2) {
      grid-column: 2;
      grid-row: 2;
    }

    > button:nth-of-type(3) {
      grid-column: 2;
      grid-row: 1;
      justify-self: end;
      width: auto;
    }
  }
`;
export const SelectionSummary = styled.span`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-column: 1;
    grid-row: 1;
    flex-direction: column;
    gap: 0.25rem;
  }
`;
export const SelectionEyebrow = styled.span`
  color: var(--dw-violet);
  font: 700 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;
export const SelectionCount = styled.span`
  color: var(--dw-text); font: 700 0.75rem/1 var(--dw-font-ui); letter-spacing: 0.01em;
`;
export const SelectionButton = styled.button`
  ${controlStyles}
  min-height: 44px; border: 1px solid ${({ $primary }) => ($primary ? 'var(--dw-cyan)' : 'rgba(230, 237, 243, 0.16)')}; border-radius: var(--dw-radius); background: var(--dw-surface-raised);
  color: var(--dw-text); padding: 0.28rem 0.46rem; font: 700 0.75rem/1 var(--dw-font-ui); letter-spacing: 0.01em; text-transform: none; cursor: pointer;
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    min-height: var(--dw-control-height);
  }
`;

export const SectionManageButton = styled.button`
  ${controlStyles}
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  width: 44px;
  min-height: 44px;
  margin: 0;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--dw-border-soft);
  border-radius: 0 8px 2px 0;
  background: transparent;
  color: var(--dw-text-secondary);
  svg { width: 24px; height: 24px; fill: currentColor; }
  &:hover { color: var(--dw-cyan); background: rgba(113, 210, 255, .08); }
  &:focus-visible { color: var(--dw-cyan); outline-offset: -3px; }
`;

export const FlatEmpty = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--dw-radius);
  padding: 0.5rem 0.62rem;
  font-size: 0.88rem;
  color: rgba(230, 237, 243, 0.72);
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: var(--dw-radius);
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
  color: var(--dw-text-secondary);
  font: 700 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
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
  ${controlStyles}
  position: relative;
  min-height: var(--dw-control-height);
  min-width: 0;
  padding: ${({ $compact }) => ($compact ? '0 0.52rem' : '0.35rem 0.62rem 0.48rem')};
  border: 0;
  border-right: 1px solid rgba(127, 215, 255, 0.1);
  border-radius: 0;
  background: ${({ $active }) => ($active ? 'rgba(45, 154, 151, 0.08)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'rgba(229, 255, 251, 0.96)' : 'rgba(185, 205, 216, 0.65)')};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
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
    transition: background 180ms ease;
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
    min-height: var(--dw-control-height);
    padding-inline: ${({ $compact }) => ($compact ? '0.52rem' : '0.42rem')};
    font-size: 0.75rem;
    letter-spacing: 0.01em;
    text-align: center;
  }
`;

export const InlinePanelShell = styled.div`
  display: grid;
  gap: 0.46rem;
  border: 1px solid rgba(230, 237, 243, 0.12);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  padding: 0.52rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: var(--dw-radius);
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
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: var(--dw-text);
`;

export const InlinePanelContext = styled.div`
  font-size: 0.75rem;
  color: var(--dw-text-secondary);
`;

export const QuickCreateNotice = styled.div`
  border: 1px dashed rgba(120, 168, 205, 0.48);
  border-radius: var(--dw-radius);
  padding: 0.48rem 0.58rem;
  color: rgba(202, 224, 244, 0.82);
  font-size: 0.76rem;
`;
