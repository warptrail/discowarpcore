import styled, { css, keyframes } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from './tokens';

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

const KEEP_PRIORITY_ACCENT = {
  decommissioned: {
    base: '#e56f67',
    soft: '#c75751',
    bright: '#f4aaa2',
    deep: '#9f3e39',
  },
  low: {
    base: '#ef9d47',
    soft: '#d58230',
    bright: '#f8c178',
    deep: '#ac6220',
  },
  medium: {
    base: '#e8c75f',
    soft: '#cfaa43',
    bright: '#f5df8a',
    deep: '#a78524',
  },
  high: {
    base: '#62cd88',
    soft: '#4aad6f',
    bright: '#92e6b0',
    deep: '#368a55',
  },
  essential: {
    base: '#a58dff',
    soft: '#8a73dd',
    bright: '#c8bcff',
    deep: '#6452af',
  },
  muted: {
    base: '#8993a3',
    soft: '#717c8d',
    bright: '#adb5c2',
    deep: '#535d6b',
  },
};

const keepPriorityAccent = (tone) =>
  KEEP_PRIORITY_ACCENT[tone] || KEEP_PRIORITY_ACCENT.muted;

const metaChipBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0.26rem 0.72rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.09em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 27px;
    padding: 0.2rem 0.54rem;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;
  }
`;

const rowGridColumns = 'minmax(104px, 160px) minmax(0, 1fr)';

export const Panel = styled.section`
  position: relative;
  z-index: ${({ $lightboxOpen }) => ($lightboxOpen ? 1700 : 1)};
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
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${({ $priorityTone }) => keepPriorityAccent($priorityTone).soft} 0 16%,
      transparent 16% 20%,
      ${({ $priorityTone }) => keepPriorityAccent($priorityTone).base} 20% 72%,
      transparent 72% 76%,
      ${({ $priorityTone }) => keepPriorityAccent($priorityTone).bright} 76% 100%
    );
    opacity: 0.62;
  }

  &::after {
    left: 0;
    top: 1rem;
    bottom: 1rem;
    width: 7px;
    border-radius: 0 999px 999px 0;
    background: linear-gradient(
      180deg,
      ${({ $priorityTone }) => keepPriorityAccent($priorityTone).deep},
      ${({ $priorityTone }) => keepPriorityAccent($priorityTone).base} 58%,
      ${({ $priorityTone }) => keepPriorityAccent($priorityTone).bright}
    );
    opacity: 0.4;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.62rem;
    padding: 0.68rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.24), 0 5px 12px rgba(0, 0, 0, 0.2);

    &::before {
      left: 0.68rem;
      right: 0.68rem;
      top: 0.42rem;
      height: 3px;
      opacity: 0.46;
    }

    &::after {
      top: 0.68rem;
      bottom: 0.68rem;
      width: 5px;
      opacity: 0.34;
    }
  }
`;

export const HeaderBand = styled.header`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.35rem;
  min-width: 0;
`;

export const FeaturedImageWrap = styled.div`
  position: relative;
  z-index: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${LCARS.line};
  background: ${LCARS.panelInset};
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  transition:
    border-color 160ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  ${({ $interactive }) =>
    $interactive &&
    css`
      cursor: zoom-in;

      &:hover {
        border-color: rgba(76, 198, 193, 0.58);
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.06),
          0 0 0 1px rgba(76, 198, 193, 0.14);
      }

      &:focus-visible {
        outline: none;
        border-color: rgba(76, 198, 193, 0.86);
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.08),
          0 0 0 2px rgba(76, 198, 193, 0.3);
      }

      &:active {
        transform: scale(0.997);
      }
    `}

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 10px;
  }
`;

export const FeaturedImage = styled.img`
  display: block;
  width: 100%;
  max-height: min(44vh, 420px);
  object-fit: cover;
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
  gap: 0.48rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.32rem;
  }
`;

export const StatePill = styled.span`
  ${metaChipBase};
  gap: 0.35rem;
  border: 1px solid ${({ $tone }) => `${toneColor($tone)}70`};
  background: ${({ $tone }) => `${toneColor($tone)}1e`};
  color: ${({ $tone }) => toneColor($tone)};
`;

export const MetaTag = styled.span`
  ${metaChipBase};
  border: 1px solid ${LCARS.line};
  background: rgba(255, 255, 255, 0.045);
  color: ${LCARS.textDim};
  font-weight: 740;
`;

export const KeepPriorityPill = styled.span`
  ${metaChipBase};
  border: 1px solid ${({ $tone }) => `${keepPriorityAccent($tone).base}88`};
  background: ${({ $tone }) =>
    `linear-gradient(180deg, ${keepPriorityAccent($tone).soft}2e, ${keepPriorityAccent(
      $tone
    ).base}22)`};
  color: ${({ $tone }) => keepPriorityAccent($tone).bright};
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.52rem;
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.52rem 0.56rem 0.52rem;
    border-radius: 10px;

    &::before {
      top: 0.5rem;
      bottom: 0.5rem;
      width: 3px;
      opacity: 0.45;
    }
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin: 0 0 0.34rem;
    padding-left: 0.35rem;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.08em;
  }
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.24rem;
    padding: 0.34rem 0.12rem 0.32rem 0.3rem;
  }
`;

export const RowLabel = styled.div`
  color: ${LCARS.textMuted};
  font-size: 0.68rem;
  font-weight: 740;
  letter-spacing: 0.09em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.07em;
  }
`;

export const RowValue = styled.div`
  color: ${LCARS.text};
  font-size: 0.92rem;
  font-weight: 560;
  line-height: 1.43;
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    line-height: 1.32;
  }
`;

export const MutedValue = styled.span`
  color: ${LCARS.textMuted};
`;

export const KeepPriorityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.56rem;
  border: 1px solid ${({ $tone }) => `${keepPriorityAccent($tone).base}80`};
  background: ${({ $tone }) =>
    `linear-gradient(180deg, ${keepPriorityAccent($tone).soft}20, ${keepPriorityAccent(
      $tone
    ).base}26)`};
  color: ${({ $tone }) => keepPriorityAccent($tone).bright};
  font-size: 0.74rem;
  font-weight: 720;
  letter-spacing: 0.07em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.14rem 0.42rem;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.05em;
  }
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.14rem 0.4rem;
    font-size: ${MOBILE_FONT_XS};
  }
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.12rem 0.34rem;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const ExternalLinkList = styled.div`
  display: grid;
  gap: 0.34rem;
`;

export const ExternalLinkAnchor = styled.a`
  color: ${LCARS.teal};
  text-decoration: underline;
  text-decoration-color: rgba(76, 198, 193, 0.52);
  text-underline-offset: 2px;
  overflow-wrap: anywhere;

  &:hover {
    color: #9ff0eb;
    text-decoration-color: rgba(159, 240, 235, 0.84);
  }
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;
    padding: 0.06rem 0.22rem;
  }
`;

export const BreadcrumbLabel = styled.span`
  color: ${LCARS.text};
  font-size: 0.83rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const BreadcrumbSep = styled.span`
  color: ${LCARS.textMuted};
  margin: 0 0.05rem;
`;

export const UploadStack = styled.div`
  display: grid;
  gap: 0.4rem;
`;

export const UploadInput = styled.input`
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${LCARS.line};
  background: rgba(255, 255, 255, 0.03);
  color: ${LCARS.text};
  padding: 0.38rem 0.42rem;
  font-size: 0.82rem;

  &::file-selector-button {
    border: 1px solid ${LCARS.teal}66;
    background: ${LCARS.teal}1a;
    color: #c9f2ee;
    border-radius: 6px;
    padding: 0.24rem 0.5rem;
    margin-right: 0.5rem;
    cursor: pointer;
    font-size: 0.78rem;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const UploadHint = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.76rem;
`;

export const UploadSuccess = styled.span`
  color: #9ce3b6;
  font-size: 0.8rem;
`;

export const UploadError = styled.span`
  color: #ff9a9a;
  font-size: 0.8rem;
`;

export const PreviewStack = styled.div`
  display: grid;
  gap: 0.44rem;
`;

export const PreviewLink = styled.a`
  color: ${LCARS.teal};
  font-size: 0.78rem;
  overflow-wrap: anywhere;
`;

export const PreviewImage = styled.img`
  display: block;
  width: min(320px, 100%);
  max-height: 240px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid ${LCARS.line};
  background: ${LCARS.panelInset};
`;

export const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1800;
  display: grid;
  place-items: center;
  padding: clamp(0.9rem, 3.6vw, 2rem);
  background: rgba(4, 8, 14, 0.82);
  backdrop-filter: blur(3px);
`;

export const LightboxFrame = styled.div`
  position: relative;
  max-width: min(94vw, 1320px);
  max-height: 92vh;
  width: fit-content;
  border-radius: 14px;
  border: 1px solid rgba(137, 181, 220, 0.3);
  background: #080e16;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.62),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  padding: clamp(0.45rem, 1.5vw, 0.8rem);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 12px;
    padding: 0.46rem;
  }
`;

export const LightboxCloseButton = styled.button`
  position: absolute;
  top: clamp(0.34rem, 1vw, 0.5rem);
  right: clamp(0.34rem, 1vw, 0.5rem);
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgba(233, 240, 247, 0.34);
  background: rgba(9, 14, 22, 0.82);
  color: ${LCARS.text};
  font-size: 1.25rem;
  line-height: 1;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease;

  &:hover {
    background: rgba(28, 39, 56, 0.9);
    border-color: rgba(76, 198, 193, 0.58);
    color: #eaf8f7;
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(76, 198, 193, 0.9);
    box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.32);
  }
`;

export const LightboxImage = styled.img`
  display: block;
  max-width: min(92vw, 1280px);
  max-height: calc(92vh - 1.6rem);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.72rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    gap: 0.52rem;
  }

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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.72rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
    font-size: ${MOBILE_FONT_SM};
  }
`;
