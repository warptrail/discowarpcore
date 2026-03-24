import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../styles/tokens';

const LOGS = {
  panel: '#111820',
  panelAlt: '#17222f',
  row: '#121b24',
  rowHover: '#1a2633',
  border: 'rgba(115, 206, 255, 0.22)',
  borderStrong: 'rgba(115, 206, 255, 0.44)',
  text: '#e8f0f7',
  textMuted: 'rgba(232, 240, 247, 0.64)',
  cyan: '#74d4ff',
  mint: '#78f5c8',
  amber: '#f3bc76',
  rose: '#f2a5a5',
};

const panelChrome = css`
  border: 1px solid ${LOGS.border};
  border-radius: 14px;
  background:
    radial-gradient(circle at 88% 11%, rgba(120, 245, 200, 0.1), transparent 46%),
    linear-gradient(180deg, ${LOGS.panelAlt} 0%, ${LOGS.panel} 100%);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.24),
    0 14px 30px rgba(0, 0, 0, 0.32);
`;

export const PageShell = styled.section`
  display: grid;
  gap: 0.72rem;
  color: ${LOGS.text};
`;

export const IntroPanel = styled.section`
  ${panelChrome};
  display: grid;
  gap: 0.56rem;
  padding: 0.8rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.58rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const HeadingRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.55rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const HeadingGroup = styled.div`
  display: grid;
  gap: 0.2rem;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const TitlePip = styled.span`
  width: 9px;
  height: 24px;
  border-radius: 8px;
  background: ${LOGS.mint};
  box-shadow: 0 0 0 2px rgba(120, 245, 200, 0.22) inset;
`;

export const Title = styled.h2`
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(1rem, 2.1vw, 1.12rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 800;
  color: rgba(232, 240, 247, 0.96);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
  }
`;

export const Subtitle = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${LOGS.textMuted};
  line-height: 1.35;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(116, 212, 255, 0.34);
  background: rgba(116, 212, 255, 0.14);
  color: ${LOGS.cyan};
  padding: 0.3rem 0.62rem;
  min-width: 3rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.79rem;
  font-variant-numeric: tabular-nums;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.46rem;
  flex-wrap: wrap;
`;

export const ExportButton = styled.button`
  min-height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(116, 212, 255, 0.46);
  background: rgba(116, 212, 255, 0.14);
  color: #c9efff;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0 0.72rem;
  cursor: pointer;
  transition: background 120ms ease;

  &:hover:not(:disabled) {
    background: rgba(116, 212, 255, 0.2);
  }

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const ExportError = styled.div`
  margin-top: 0.28rem;
  color: ${LOGS.rose};
  font-size: 0.74rem;
  letter-spacing: 0.01em;
`;

export const StatePanel = styled.section`
  ${panelChrome};
  padding: 0.72rem;
  font-size: 0.86rem;
  color: ${({ $tone }) =>
    $tone === 'error' ? LOGS.rose : $tone === 'muted' ? LOGS.textMuted : LOGS.text};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.58rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const RetryButton = styled.button`
  border: 1px solid rgba(242, 165, 165, 0.52);
  border-radius: 9px;
  background: rgba(242, 165, 165, 0.12);
  color: #ffd7d7;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  min-height: 34px;
  padding: 0 0.7rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(242, 165, 165, 0.18);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const FeedPanel = styled.section`
  ${panelChrome};
  padding: 0;
  overflow: hidden;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const FeedList = styled.div`
  display: grid;
`;

export const EntryRow = styled.article`
  padding: 0.68rem 0.74rem;
  border-bottom: 1px solid rgba(115, 206, 255, 0.16);
  background: ${LOGS.row};
  transition: background 120ms ease;

  &:hover {
    background: ${LOGS.rowHover};
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.56rem 0.54rem;
  }
`;

export const EntryPrimary = styled.div`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.32;
  color: ${LOGS.text};
`;

export const EntryPrimaryStructured = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.44rem;
  flex-wrap: wrap;
`;

export const EntryPrefix = styled.span`
  color: ${LOGS.text};
  font-weight: 700;
  letter-spacing: 0.01em;
`;

const summaryBase = css`
  color: ${LOGS.text};
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.01em;
`;

export const EntrySummaryLink = styled(Link)`
  ${summaryBase};
  border-bottom: 1px dotted rgba(120, 245, 200, 0.38);

  &:hover {
    color: #f2fbff;
    border-bottom-color: rgba(120, 245, 200, 0.72);
  }
`;

export const EntrySummaryText = styled.span`
  ${summaryBase};
`;

export const EntryMeta = styled.div`
  margin-top: 0.32rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.74rem;
  color: ${LOGS.textMuted};
`;

export const Timestamp = styled.span`
  font-variant-numeric: tabular-nums;
  color: rgba(232, 240, 247, 0.72);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

export const BoxChipGroup = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  flex-wrap: wrap;
`;

const boxChipBase = css`
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  line-height: 1.2;
`;

export const BoxIdChip = styled.span`
  ${boxChipBase};
  border: 1px solid rgba(116, 212, 255, 0.6);
  background: linear-gradient(180deg, rgba(116, 212, 255, 0.2) 0%, rgba(116, 212, 255, 0.1) 100%);
  color: #8ce2ff;
  padding: 0.14rem 0.52rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.03em;
`;

export const BoxLabelChip = styled.span`
  ${boxChipBase};
  border: 1px solid rgba(120, 245, 200, 0.38);
  background: rgba(120, 245, 200, 0.11);
  color: #d5f6ea;
  padding: 0.14rem 0.45rem;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.01em;
`;

export const BoxChipLink = styled(Link)`
  ${BoxChipGroup};
  text-decoration: none;

  &:hover ${BoxIdChip},
  &:hover ${BoxLabelChip} {
    filter: brightness(1.09);
  }
`;

const nameChipBase = css`
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  padding: 0.12rem 0.5rem;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'boxName' ? 'rgba(116, 212, 255, 0.54)' : 'rgba(120, 245, 200, 0.54)'};
  background: ${({ $tone }) =>
    $tone === 'boxName' ? 'rgba(116, 212, 255, 0.16)' : 'rgba(120, 245, 200, 0.16)'};
  color: ${({ $tone }) => ($tone === 'boxName' ? LOGS.cyan : LOGS.mint)};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.82rem;
  letter-spacing: 0.01em;
  line-height: 1.25;
  font-weight: 700;
`;

export const NameChip = styled.span`
  ${nameChipBase};
`;

export const NameChipLink = styled(Link)`
  ${nameChipBase};
  text-decoration: none;

  &:hover {
    filter: brightness(1.08);
  }
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'entity'
        ? 'rgba(120, 245, 200, 0.36)'
        : $tone === 'event'
          ? 'rgba(116, 212, 255, 0.34)'
          : $tone === 'import'
            ? 'rgba(120, 245, 200, 0.42)'
            : $tone === 'file'
              ? 'rgba(243, 188, 118, 0.42)'
              : 'rgba(243, 188, 118, 0.35)'};
  background: ${({ $tone }) =>
    $tone === 'entity'
      ? 'rgba(120, 245, 200, 0.12)'
      : $tone === 'event'
        ? 'rgba(116, 212, 255, 0.12)'
        : $tone === 'import'
          ? 'rgba(120, 245, 200, 0.16)'
          : $tone === 'file'
            ? 'rgba(243, 188, 118, 0.18)'
        : 'rgba(243, 188, 118, 0.14)'};
  color: ${({ $tone }) =>
    $tone === 'entity'
      ? LOGS.mint
      : $tone === 'event'
        ? LOGS.cyan
        : $tone === 'import'
          ? LOGS.mint
          : LOGS.amber};
  padding: 0.08rem 0.44rem;
  font-size: 0.66rem;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  font-weight: 760;
`;

export const BulkDetails = styled.div`
  margin-top: 0.3rem;
  color: rgba(232, 240, 247, 0.66);
  font-size: 0.73rem;
  letter-spacing: 0.02em;
`;

export const FeedFooter = styled.div`
  border-top: 1px solid rgba(115, 206, 255, 0.16);
  padding: 0.62rem 0.74rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 54px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.52rem 0.54rem;
  }
`;

export const LoadMoreButton = styled.button`
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(120, 245, 200, 0.5);
  background: rgba(120, 245, 200, 0.14);
  color: #d7fff1;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0 0.9rem;
  cursor: pointer;
  transition: background 120ms ease;

  &:hover:not(:disabled) {
    background: rgba(120, 245, 200, 0.2);
  }

  &:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const EndState = styled.div`
  font-size: 0.76rem;
  color: ${LOGS.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;
