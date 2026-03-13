import styled, { css, keyframes } from 'styled-components';

const LCARS = {
  panel: '#141920',
  panelSoft: '#1b212b',
  panelInset: '#11161e',
  line: 'rgba(231, 236, 243, 0.11)',
  text: '#e7ecf3',
  textDim: 'rgba(231, 236, 243, 0.72)',
  textMuted: 'rgba(231, 236, 243, 0.56)',
  teal: '#4cc6c1',
  coral: '#f08a7b',
  amber: '#e8b15c',
  lilac: '#a7b6ff',
};

const toneColor = (tone) =>
  tone === 'coral'
    ? LCARS.coral
    : tone === 'amber'
      ? LCARS.amber
      : tone === 'lilac'
        ? LCARS.lilac
        : LCARS.teal;

const rowGridColumns = 'minmax(104px, 160px) minmax(0, 1fr)';

export const Panel = styled.section`
  position: relative;
  display: grid;
  gap: 0.95rem;
  padding: 1rem;
  border: 1px solid ${LCARS.line};
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 28%),
    ${LCARS.panel};
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.3),
    0 10px 22px rgba(0, 0, 0, 0.22);
  overflow: hidden;
  isolation: isolate;

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  &::before {
    left: 0.92rem;
    right: 0.92rem;
    top: 0.58rem;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${LCARS.coral} 0 14%,
      transparent 14% 19%,
      ${LCARS.teal} 19% 54%,
      transparent 54% 58%,
      ${LCARS.amber} 58% 79%,
      transparent 79% 83%,
      ${LCARS.lilac} 83% 100%
    );
    opacity: 0.45;
  }

  &::after {
    left: 0;
    top: 1rem;
    bottom: 1rem;
    width: 7px;
    border-radius: 0 999px 999px 0;
    background: linear-gradient(180deg, ${LCARS.teal}, ${LCARS.lilac} 62%, ${LCARS.coral});
    opacity: 0.34;
  }
`;

export const HeaderBand = styled.header`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.35rem;
  min-width: 0;
`;

export const TitleBlock = styled.div`
  min-width: 0;
`;

export const Header = styled.h3`
  margin: 0;
  font-size: clamp(1.05rem, 1.65vw, 1.25rem);
  font-weight: 780;
  line-height: 1.25;
  letter-spacing: 0.015em;
  color: ${LCARS.text};
  overflow-wrap: anywhere;
`;

export const HeaderMeta = styled.div`
  margin-top: ${({ $compact }) => ($compact ? '0' : '0.22rem')};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

export const StatePill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.18rem 0.56rem;
  border-radius: 999px;
  border: 1px solid ${({ $tone }) => `${toneColor($tone)}70`};
  background: ${({ $tone }) => `${toneColor($tone)}1e`};
  color: ${({ $tone }) => toneColor($tone)};
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const MetaTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.52rem;
  border-radius: 999px;
  border: 1px solid ${LCARS.line};
  background: rgba(255, 255, 255, 0.02);
  color: ${LCARS.textDim};
  font-size: 0.68rem;
  font-weight: 720;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const SectionGrid = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  min-width: 0;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionCard = styled.section`
  position: relative;
  min-width: 0;
  padding: 0.68rem 0.72rem 0.64rem;
  border: 1px solid ${LCARS.line};
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.016), transparent 60%),
    ${LCARS.panelSoft};
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.025);

  ${({ $wide }) =>
    $wide &&
    css`
      grid-column: 1 / -1;
    `}

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.62rem;
    bottom: 0.62rem;
    width: 4px;
    border-radius: 0 999px 999px 0;
    background: ${({ $tone }) => toneColor($tone)};
    opacity: 0.6;
  }
`;

export const SectionTitle = styled.h4`
  margin: 0 0 0.45rem;
  padding-left: 0.45rem;
  color: ${LCARS.textDim};
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;

export const SectionBody = styled.div`
  display: grid;
  gap: 0;
`;

export const DetailRow = styled.div`
  display: grid;
  grid-template-columns: ${rowGridColumns};
  align-items: ${({ $stretch }) => ($stretch ? 'start' : 'center')};
  gap: 0.62rem;
  padding: 0.42rem 0.2rem 0.38rem 0.45rem;
  min-width: 0;

  &:not(:first-child) {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 0.28rem;
    padding-left: 0.28rem;
  }
`;

export const RowLabel = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.68rem;
  font-weight: 740;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;

export const RowValue = styled.div`
  color: ${LCARS.text};
  font-size: 0.92rem;
  font-weight: 560;
  line-height: 1.43;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

export const MutedValue = styled.span`
  color: ${LCARS.textMuted};
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
`;

export const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.52rem;
  border: 1px solid ${LCARS.teal}66;
  background: ${LCARS.teal}1a;
  color: #c9f2ee;
  font-size: 0.74rem;
  font-weight: 620;
`;

export const UsageList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
`;

export const UsageItem = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.14rem 0.44rem;
  border: 1px solid ${LCARS.line};
  background: rgba(255, 255, 255, 0.03);
  color: ${LCARS.textDim};
  font-size: 0.74rem;
`;

export const BreadcrumbList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.24rem;
`;

export const BreadcrumbNode = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.26rem;
  min-width: 0;
`;

export const BreadcrumbId = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${LCARS.textDim};
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${LCARS.line};
  border-radius: 6px;
  padding: 0.08rem 0.3rem;
`;

export const BreadcrumbLabel = styled.span`
  color: ${LCARS.text};
  font-size: 0.83rem;
`;

export const BreadcrumbSep = styled.span`
  color: ${LCARS.textMuted};
  margin: 0 0.05rem;
`;

export const UtilityDock = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.62rem;

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const UtilityTitle = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const TestButtons = styled.div`
  display: inline-flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

export const FlashButton = styled.button`
  border: 1px solid
    ${({ $tone }) => ($tone === 'yellow' ? 'rgba(255, 212, 0, 0.52)' : 'rgba(255, 107, 107, 0.55)')};
  background: ${({ $tone }) =>
    $tone === 'yellow' ? 'rgba(255, 212, 0, 0.12)' : 'rgba(255, 107, 107, 0.12)'};
  color: ${({ $tone }) => ($tone === 'yellow' ? '#ffe38a' : '#ffc4c4')};
  border-radius: 7px;
  padding: 0.28rem 0.56rem;
  font-size: 0.72rem;
  font-weight: 640;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, transform 120ms ease;

  &:hover {
    border-color: ${({ $tone }) => ($tone === 'yellow' ? 'rgba(255, 212, 0, 0.74)' : 'rgba(255, 107, 107, 0.74)')};
    background: ${({ $tone }) =>
      $tone === 'yellow' ? 'rgba(255, 212, 0, 0.2)' : 'rgba(255, 107, 107, 0.2)'};
    transform: translateY(-1px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -360px 0;
  }
  100% {
    background-position: 360px 0;
  }
`;

export const Skeleton = styled.div`
  display: grid;
  gap: 0.7rem;
  padding: 1rem;
  border: 1px solid ${LCARS.line};
  border-radius: 12px;
  background: ${LCARS.panelInset};

  div {
    height: 0.95rem;
    border-radius: 6px;
    background: linear-gradient(90deg, #252a31 20%, #313843 38%, #252a31 62%);
    background-size: 360% 100%;
    animation: ${shimmer} 1.35s ease infinite;
  }
`;

export const ErrorMsg = styled.div`
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 107, 107, 0.45);
  background: rgba(255, 107, 107, 0.11);
  color: #ff9a9a;
  font-size: 0.9rem;
`;
