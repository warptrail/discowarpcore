import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

const RETRIEVAL = {
  bg: '#0d1116',
  panel: '#141a21',
  panelAlt: '#1b2430',
  row: '#121922',
  rowHover: '#1a2330',
  border: 'rgba(127, 215, 255, 0.18)',
  borderStrong: 'rgba(127, 215, 255, 0.36)',
  text: '#e8eef4',
  textDim: 'rgba(232, 238, 244, 0.78)',
  textMuted: 'rgba(232, 238, 244, 0.55)',
  cyan: '#77d5ff',
  teal: '#4cc6c1',
  mint: '#67efc8',
  amber: '#e8b15c',
};

const panelChrome = css`
  border: 1px solid ${RETRIEVAL.border};
  border-radius: 14px;
  background:
    radial-gradient(circle at 92% 9%, rgba(76, 198, 193, 0.1), transparent 42%),
    linear-gradient(180deg, ${RETRIEVAL.panelAlt} 0%, ${RETRIEVAL.panel} 100%);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.24),
    0 14px 28px rgba(0, 0, 0, 0.28);
`;

const controlField = css`
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid ${RETRIEVAL.borderStrong};
  background: ${RETRIEVAL.bg};
  color: ${RETRIEVAL.text};
  padding: 0.5rem 0.65rem;
  outline: none;
  font-size: 0.88rem;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;

  &:focus {
    border-color: rgba(119, 213, 255, 0.8);
    box-shadow: 0 0 0 2px rgba(119, 213, 255, 0.24);
    background: ${RETRIEVAL.panelAlt};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
    border-radius: 9px;
  }
`;

export const PageShell = styled.section`
  display: grid;
  gap: 0.72rem;
  color: ${RETRIEVAL.text};
`;

export const ControlsPanel = styled.section`
  ${panelChrome};
  display: grid;
  gap: 0.66rem;
  padding: 0.78rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.54rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    gap: 0.52rem;
  }
`;

export const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
`;

export const HeadingGroup = styled.div`
  display: grid;
  gap: 0.2rem;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.52rem;
`;

export const TitlePip = styled.span`
  width: 9px;
  height: 26px;
  border-radius: 8px;
  background: ${RETRIEVAL.mint};
  box-shadow: 0 0 0 2px rgba(103, 239, 200, 0.2) inset;
`;

export const Title = styled.h2`
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(1rem, 2.2vw, 1.14rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 800;
  color: rgba(232, 238, 244, 0.95);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
    letter-spacing: 0.06em;
  }
`;

export const Subtitle = styled.p`
  margin: 0;
  font-size: 0.77rem;
  color: ${RETRIEVAL.textMuted};
  letter-spacing: 0.035em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(119, 213, 255, 0.35);
  background: rgba(119, 213, 255, 0.16);
  color: ${RETRIEVAL.cyan};
  padding: 0.3rem 0.6rem;
  min-width: 2.8rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.79rem;
  font-variant-numeric: tabular-nums;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    padding: 0.24rem 0.5rem;
  }
`;

export const SearchWrap = styled.label`
  display: grid;
  gap: 0.3rem;
`;

export const SearchLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 760;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${RETRIEVAL.textDim};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const SearchInput = styled.input`
  ${controlField};
`;

export const SearchHint = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.75rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.52rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const FilterControl = styled.div`
  display: grid;
  gap: 0.24rem;
  border: 1px solid rgba(127, 215, 255, 0.17);
  border-radius: 11px;
  padding: 0.42rem;
  background: rgba(12, 18, 26, 0.65);
`;

export const FilterLabel = styled.span`
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${RETRIEVAL.textDim};
`;

export const FilterRow = styled.div`
  display: flex;
  gap: 0.4rem;
`;

export const FilterSelect = styled.select`
  ${controlField};
  min-height: 36px;
`;

export const AddFilterButton = styled.button`
  min-width: 68px;
  border: 1px solid rgba(103, 239, 200, 0.38);
  border-radius: 10px;
  background: rgba(103, 239, 200, 0.14);
  color: #d8fff2;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  padding: 0 0.65rem;
  transition: background 120ms ease;

  &:hover:not(:disabled) {
    background: rgba(103, 239, 200, 0.22);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 74px;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const ActiveChipsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.32rem;
`;

export const ActiveChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  border-radius: 999px;
  border: 1px solid rgba(76, 198, 193, 0.42);
  background: rgba(76, 198, 193, 0.14);
  color: #d8f8f5;
  font-size: 0.71rem;
  padding: 0.18rem 0.42rem 0.18rem 0.52rem;
`;

export const ActiveChipLabel = styled.span`
  line-height: 1;
`;

export const ActiveChipRemove = styled.button`
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.86rem;
  line-height: 1;
  padding: 0;
`;

export const ClearFiltersButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.05);
  color: ${RETRIEVAL.textDim};
  border-radius: 999px;
  font-size: 0.71rem;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
`;

export const ResultsPanel = styled.section`
  ${panelChrome};
  overflow: hidden;
`;

export const ResultsHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.45rem;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 14, 20, 0.45);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.5rem 0.54rem;
  }
`;

export const ResultsCount = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.75rem;
  color: ${RETRIEVAL.textDim};
  letter-spacing: 0.04em;
`;

export const ResultsList = styled.div`
  display: grid;
  gap: 0;
`;

export const ResultsFooter = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.6rem 0.7rem 0.74rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 14, 20, 0.34);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.5rem 0.54rem 0.62rem;
  }
`;

export const LoadMoreButton = styled.button`
  min-height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(119, 213, 255, 0.42);
  background: rgba(119, 213, 255, 0.16);
  color: #dff3ff;
  padding: 0.28rem 0.78rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 120ms ease;

  &:hover:not(:disabled) {
    background: rgba(119, 213, 255, 0.24);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const ResultsEndState = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.74rem;
`;

export const ResultCard = styled.article`
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background:
    linear-gradient(180deg, rgba(17, 25, 35, 0.92), rgba(14, 22, 31, 0.9)),
    ${RETRIEVAL.row};

  &:nth-child(even) {
    background:
      linear-gradient(180deg, rgba(21, 30, 41, 0.92), rgba(16, 25, 35, 0.9)),
      ${RETRIEVAL.row};
  }

  &:last-child {
    border-bottom: 0;
  }
`;

export const SummaryButton = styled.div`
  width: 100%;
  background: ${({ $expanded }) =>
    $expanded
      ? `radial-gradient(circle at 90% 14%, rgba(76, 198, 193, 0.12), transparent 44%),
         linear-gradient(180deg, rgba(24, 35, 48, 0.72), rgba(17, 28, 40, 0.62))`
      : 'linear-gradient(180deg, rgba(15, 22, 31, 0.16), rgba(15, 22, 31, 0.04))'};
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0.66rem 0.72rem 0.56rem;
  display: grid;
  gap: 0.4rem;
  transition: background 140ms ease;

  &:hover {
    background: ${({ $expanded }) =>
      $expanded
        ? `radial-gradient(circle at 90% 14%, rgba(76, 198, 193, 0.18), transparent 46%),
           linear-gradient(180deg, rgba(28, 40, 54, 0.78), rgba(20, 32, 46, 0.68))`
        : RETRIEVAL.rowHover};
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.6);
    outline-offset: -2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.58rem;
    gap: 0.3rem;
  }
`;

export const SummaryTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.4rem;
`;

export const RowMain = styled.div`
  display: grid;
  grid-template-columns: clamp(72px, 8vw, 92px) minmax(0, 1fr);
  align-items: start;
  gap: 0.7rem;
  min-width: 0;

  @media (max-width: 980px) {
    grid-template-columns: 68px minmax(0, 1fr);
    gap: 0.56rem;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 0.48rem;
  }
`;

const thumbFrameBase = css`
  width: clamp(72px, 8vw, 92px);
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(8, 13, 19, 0.9);
  display: grid;
  place-items: center;

  @media (max-width: 980px) {
    width: 68px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 56px;
    border-radius: 10px;
  }
`;

export const ThumbFrame = styled.div`
  ${thumbFrameBase};
`;

export const ThumbPreviewButton = styled.button`
  ${thumbFrameBase};
  border-color: rgba(127, 215, 255, 0.32);
  cursor: zoom-in;
  padding: 0;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    border-color: rgba(127, 215, 255, 0.52);
    box-shadow: 0 0 0 1px rgba(127, 215, 255, 0.2);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.65);
    outline-offset: 1px;
  }
`;

export const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const ThumbPlaceholder = styled.span`
  color: rgba(232, 238, 244, 0.45);
  font-size: 0.52rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
`;

export const BadgeStack = styled.div`
  display: grid;
  gap: 0.34rem;
  min-width: 0;
`;

export const ExpandControl = styled.span`
  align-self: start;
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid
    ${({ $expanded }) =>
      $expanded ? 'rgba(119, 213, 255, 0.5)' : 'rgba(255, 255, 255, 0.22)'};
  background: ${({ $expanded }) =>
    $expanded ? 'rgba(119, 213, 255, 0.18)' : 'rgba(255, 255, 255, 0.07)'};
  color: ${({ $expanded }) => ($expanded ? '#d6f0ff' : RETRIEVAL.textDim)};
  flex: 0 0 auto;
`;

export const ExpandCaret = styled.span`
  font-size: 1rem;
  line-height: 1;
`;

export const MetaBlock = styled.div`
  display: grid;
  gap: 0.18rem;
`;

export const MetaLabel = styled.span`
  color: ${RETRIEVAL.textMuted};
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.1;
`;

export const CategoryValue = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 8px;
  border: 1px solid rgba(154, 173, 255, 0.34);
  background: rgba(121, 141, 232, 0.16);
  color: #dde4ff;
  font-size: 0.74rem;
  padding: 0.14rem 0.44rem;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
`;

export const ItemTagChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(127, 215, 255, 0.24);
  background: rgba(127, 215, 255, 0.11);
  color: #d1e8f8;
  font-size: 0.68rem;
  line-height: 1;
  padding: 0.14rem 0.4rem;
`;

export const PathLine = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.68rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

const itemPillBase = css`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: none;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(119, 213, 255, 0.44);
  background:
    linear-gradient(96deg, rgba(119, 213, 255, 0.22) 0%, rgba(119, 213, 255, 0.1) 75%),
    rgba(9, 18, 26, 0.84);
  color: #eff8ff;
  padding: 0.46rem 0.78rem;
  font-size: 1.08rem;
  font-weight: 780;
  letter-spacing: 0.01em;
  line-height: 1.2;
  word-break: break-word;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.98rem;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding: 0.32rem 0.64rem;
    border-radius: 11px;
  }
`;

export const ItemPill = styled.span`
  ${itemPillBase};
`;

export const ItemPillLink = styled(Link)`
  ${itemPillBase};
  text-decoration: none;
  transition:
    border-color 120ms ease,
    background 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    border-color: rgba(119, 213, 255, 0.62);
    background:
      linear-gradient(
        96deg,
        rgba(119, 213, 255, 0.28) 0%,
        rgba(119, 213, 255, 0.14) 62%
      ),
      rgba(9, 18, 26, 0.9);
  }

  &:focus-visible {
    outline: 2px solid rgba(119, 213, 255, 0.65);
    outline-offset: 1px;
  }
`;

const linkButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(119, 213, 255, 0.35);
  background: rgba(119, 213, 255, 0.14);
  color: #d4efff;
  text-decoration: none;
  padding: 0.3rem 0.62rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const LocationWrap = styled.div`
  display: grid;
  gap: 0.18rem;
`;

export const LocationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(103, 239, 200, 0.46);
  background: rgba(103, 239, 200, 0.17);
  color: #d7fff2;
  padding: ${({ $compact }) => ($compact ? '0.18rem 0.5rem' : '0.28rem 0.7rem')};
  font-size: ${({ $compact }) => ($compact ? '0.72rem' : '0.82rem')};
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.2;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${({ $compact }) => ($compact ? MOBILE_FONT_XS : MOBILE_FONT_SM)};
  }
`;

export const LocationPath = styled.p`
  margin: 0;
  font-size: 0.7rem;
  color: ${RETRIEVAL.textMuted};
`;

export const BoxBadge = styled.span`
  display: inline-grid;
  align-items: center;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.36rem;
  width: fit-content;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(232, 177, 92, 0.42);
  background:
    linear-gradient(180deg, rgba(232, 177, 92, 0.18), rgba(232, 177, 92, 0.09)),
    rgba(22, 17, 10, 0.7);
  padding: ${({ $compact }) => ($compact ? '0.2rem 0.42rem' : '0.24rem 0.5rem')};
  line-height: 1.2;
`;

export const BoxId = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  color: #ffe8c5;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  white-space: nowrap;
`;

export const BoxName = styled.span`
  color: #f3ddba;
  font-size: 0.74rem;
  font-weight: 620;
  letter-spacing: 0.02em;
  border-left: 1px solid rgba(255, 231, 188, 0.28);
  padding-left: 0.36rem;
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const ExpandedPanel = styled.section`
  margin: 0 0.72rem 0.62rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-top: 0;
  border-radius: 0 0 10px 10px;
  background: rgba(8, 14, 20, 0.58);
  padding: 0.42rem 0.48rem 0.5rem;
  display: grid;
  gap: 0.42rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin: 0 0.58rem 0.58rem;
    padding: 0.42rem 0.44rem 0.46rem;
  }
`;

export const ExpandedItemPanel = styled.section`
  border-radius: 10px;
  border: 1px solid rgba(119, 213, 255, 0.24);
  background:
    linear-gradient(180deg, rgba(14, 24, 35, 0.9), rgba(11, 19, 28, 0.92)),
    rgba(9, 16, 24, 0.86);
  padding: 0.44rem 0.48rem;
  display: grid;
  gap: 0.34rem;
`;

export const ExpandedBoxPanel = styled.section`
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(8, 14, 20, 0.96), rgba(6, 11, 17, 0.95)),
    rgba(7, 12, 18, 0.92);
  padding: 0.42rem 0.46rem 0.46rem;
  display: grid;
  gap: 0.38rem;
`;

export const ExpandedPanelTitle = styled.p`
  margin: 0;
  color: #c9f6e8;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const ExpandedDetailBlock = styled.div`
  display: grid;
  gap: 0.18rem;
`;

export const ExpandedDetailLabel = styled.p`
  margin: 0;
  color: #a9ead4;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: underline;
  text-decoration-color: rgba(169, 234, 212, 0.78);
  text-underline-offset: 2px;
`;

export const ExpandedDetailText = styled.p`
  margin: 0;
  color: #d7f8ec;
  font-size: 0.76rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

export const ExpandedBoxLink = styled(Link)`
  ${linkButton};
  justify-self: start;
`;

export const ExpandedMuted = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.72rem;
`;

export const SiblingSection = styled.div`
  display: grid;
  gap: 0.26rem;
`;

export const SiblingLabel = styled.p`
  margin: 0;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.72rem;
`;

export const SiblingChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
`;

export const SiblingChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(127, 215, 255, 0.3);
  background: rgba(127, 215, 255, 0.14);
  color: #d6efff;
  font-size: 0.68rem;
  line-height: 1;
  padding: 0.16rem 0.42rem;
`;

export const SiblingOverflow = styled(SiblingChip)`
  border-color: rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.08);
  color: ${RETRIEVAL.textDim};
`;

export const LoadingState = styled.div`
  padding: 0.92rem;
  color: ${RETRIEVAL.textDim};
  font-size: 0.82rem;
`;

export const ErrorState = styled.div`
  padding: 0.78rem;
  border-radius: 12px;
  border: 1px solid rgba(240, 138, 123, 0.44);
  background: rgba(240, 138, 123, 0.14);
  color: #ffd5ce;
  font-size: 0.82rem;
`;

export const EmptyState = styled.div`
  padding: 0.92rem;
  color: ${RETRIEVAL.textMuted};
  font-size: 0.82rem;
`;

export const LightboxBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(3, 7, 12, 0.84);
  display: grid;
  place-items: center;
  padding: clamp(0.8rem, 2vw, 1.5rem);
`;

export const LightboxPanel = styled.div`
  position: relative;
  max-width: 95vw;
  max-height: 93vh;
  display: grid;
  gap: 0.36rem;
  justify-items: center;
`;

export const LightboxImage = styled.img`
  max-width: min(95vw, 1280px);
  max-height: 88vh;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.55);
  background: rgba(5, 10, 16, 0.96);
`;

export const LightboxCloseButton = styled.button`
  position: absolute;
  top: -0.2rem;
  right: -0.2rem;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  background: rgba(8, 16, 24, 0.9);
  color: #e7f3ff;
  font-size: 1.22rem;
  line-height: 1;
  cursor: pointer;
`;

export const LightboxCaption = styled.p`
  margin: 0;
  color: rgba(232, 238, 244, 0.86);
  font-size: 0.79rem;
  letter-spacing: 0.02em;
  text-align: center;
`;
