import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../../styles/tokens';

const TABLE_STACK_BREAKPOINT = '900px';

const LCARS = {
  bg: '#0c0f11',
  panel: '#14181b',
  panelAlt: '#1a1f24',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.13)',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  textMuted: 'rgba(230,237,243,0.56)',
  root: '#7fd7ff',
  teal: '#4cc6c1',
  amber: '#e8b15c',
  coral: '#f08a7b',
  lilac: '#a7b6ff',
  decommissioned: '#e56f67',
};

const toneColor = (tone) => {
  if (tone === 'coral') return LCARS.coral;
  if (tone === 'amber') return LCARS.amber;
  if (tone === 'lilac') return LCARS.lilac;
  if (tone === 'teal') return LCARS.teal;
  if (tone === 'low') return '#ef9d47';
  if (tone === 'medium') return '#e8c75f';
  if (tone === 'high') return '#62cd88';
  if (tone === 'essential') return '#a58dff';
  if (tone === 'decommissioned') return LCARS.decommissioned;
  return LCARS.textDim;
};

const panelBase = css`
  border: 1px solid ${LCARS.line};
  border-radius: 14px;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.25),
    0 8px 24px rgba(0, 0, 0, 0.24);
`;

const controlField = css`
  width: 100%;
  border: 1px solid ${LCARS.lineStrong};
  border-radius: 9px;
  background: ${LCARS.bg};
  color: ${LCARS.text};
  min-height: 34px;
  padding: 0.46rem 0.62rem;
  font-size: 0.86rem;
  outline: none;
  transition:
    border-color 130ms ease,
    box-shadow 130ms ease,
    background 130ms ease;

  &:focus {
    border-color: rgba(127, 215, 255, 0.72);
    box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.22);
    background: ${LCARS.panelAlt};
  }
`;

export const PageShell = styled.section`
  display: grid;
  gap: 0.78rem;
  color: ${LCARS.text};
`;

export const HeaderPanel = styled.header`
  ${panelBase};
  display: grid;
  gap: 0.58rem;
  padding: 0.84rem 0.92rem 0.92rem;
  background:
    radial-gradient(circle at 95% 8%, rgba(127, 215, 255, 0.14) 0%, transparent 44%),
    linear-gradient(180deg, #12171b 0%, #0f1317 100%);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.38rem;
    padding: 0.56rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.58rem;
`;

export const TitlePip = styled.span`
  width: 9px;
  height: 26px;
  border-radius: 8px;
  background: ${LCARS.teal};
  box-shadow: 0 0 0 2px rgba(76, 198, 193, 0.22) inset;
`;

export const Title = styled.h2`
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(1.02rem, 2.2vw, 1.18rem);
  font-weight: 900;
  letter-spacing: 0.085em;
  color: rgba(230, 237, 243, 0.96);
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
    letter-spacing: 0.065em;
  }
`;

export const TelemetryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.78rem;
  letter-spacing: 0.045em;
  color: ${LCARS.textDim};
`;

export const TelemetryValue = styled.span`
  color: ${({ $tone = 'text' }) =>
    $tone === 'total'
      ? LCARS.root
      : $tone === 'active'
        ? LCARS.teal
        : $tone === 'gone'
          ? LCARS.coral
          : $tone === 'orphaned'
            ? LCARS.amber
            : LCARS.textDim};
`;

export const Sep = styled.span`
  color: rgba(230, 237, 243, 0.45);
`;

export const ControlsRow = styled.div`
  display: grid;
  grid-template-columns:
    minmax(190px, 1.3fr)
    minmax(170px, 1fr)
    minmax(170px, 1fr)
    minmax(170px, 1fr);
  gap: 0.56rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const ControlGroup = styled.label`
  ${panelBase};
  display: grid;
  gap: 0.3rem;
  padding: 0.42rem 0.56rem 0.5rem;
  background:
    linear-gradient(
      94deg,
      ${({ $tone = LCARS.root }) => `${$tone}20`} 0%,
      transparent 62%
    ),
    ${LCARS.panel};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.3rem 0.38rem 0.36rem;
    border-radius: 10px;
    gap: 0.18rem;
  }
`;

export const ControlLabel = styled.span`
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${LCARS.textDim};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.08em;
  }
`;

export const Select = styled.select`
  ${controlField};
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, ${LCARS.textDim} 50%),
    linear-gradient(135deg, ${LCARS.textDim} 50%, transparent 50%);
  background-position:
    calc(100% - 16px) calc(50% - 2px),
    calc(100% - 11px) calc(50% - 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 1.8rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 33px;
    font-size: ${MOBILE_FONT_SM};
    padding: 0.35rem 1.6rem 0.35rem 0.5rem;
  }
`;

export const SearchInput = styled.input`
  ${controlField};
`;

export const ContentPanel = styled.section`
  ${panelBase};
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 40%),
    ${LCARS.panel};
  overflow: hidden;
`;

export const DesktopWrap = styled.div`
  display: block;

  @media (max-width: ${TABLE_STACK_BREAKPOINT}) {
    display: none;
  }
`;

export const MobileWrap = styled.div`
  display: none;

  @media (max-width: ${TABLE_STACK_BREAKPOINT}) {
    display: block;
  }
`;

export const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${LCARS.text};
  min-width: 900px;
`;

export const TH = styled.th`
  text-align: left;
  padding: 0.66rem 0.7rem;
  font-size: 0.68rem;
  font-weight: 820;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${LCARS.textDim};
  border-bottom: 1px solid ${LCARS.lineStrong};
  white-space: nowrap;
`;

export const TR = styled.tr`
  cursor: pointer;
  transition: background 120ms ease;

  &:hover {
    background: rgba(127, 215, 255, 0.08);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.56);
    outline-offset: -2px;
  }
`;

export const TD = styled.td`
  padding: 0.66rem 0.7rem;
  vertical-align: top;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: ${({ $muted }) => ($muted ? LCARS.textDim : LCARS.text)};
`;

export const NameLink = styled(Link)`
  color: ${LCARS.text};
  font-size: 0.95rem;
  font-weight: 720;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.9);
    text-underline-offset: 2px;
  }
`;

export const NameText = styled.span`
  color: ${LCARS.text};
  font-size: 0.95rem;
  font-weight: 720;
`;

export const NameMeta = styled.div`
  margin-top: 0.22rem;
  font-size: 0.72rem;
  color: ${LCARS.textMuted};
`;

export const KeepPriorityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  margin-top: 0.3rem;
  border-radius: 999px;
  padding: 0.12rem 0.48rem;
  border: 1px solid ${({ $tone }) => `${toneColor($tone)}88`};
  background: ${({ $tone }) => `${toneColor($tone)}2a`};
  color: ${({ $tone }) => toneColor($tone)};
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const QtyPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2ch;
  color: ${LCARS.text};
  font-size: 0.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

export const Category = styled.div`
  font-size: 0.85rem;
  color: ${LCARS.text};
`;

export const Subtle = styled.span`
  color: ${LCARS.textMuted};
  font-size: 0.75rem;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.32rem;
`;

export const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.16rem 0.48rem;
  border: 1px solid rgba(76, 198, 193, 0.42);
  background: rgba(76, 198, 193, 0.16);
  color: #c9f2ee;
  font-size: 0.71rem;
  line-height: 1;
`;

export const OverflowTag = styled(TagChip)`
  border-color: rgba(167, 182, 255, 0.42);
  background: rgba(167, 182, 255, 0.16);
  color: #e2e8ff;
`;

export const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
`;

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.17rem 0.52rem;
  border: 1px solid ${({ $tone }) => `${toneColor($tone)}70`};
  background: ${({ $tone }) => `${toneColor($tone)}20`};
  color: ${({ $tone }) => toneColor($tone)};
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const LifecycleText = styled.div`
  margin-top: 0.32rem;
  font-size: 0.76rem;
  color: ${LCARS.textDim};
`;

export const NotesPreview = styled.div`
  margin-top: 0.3rem;
  font-size: 0.75rem;
  line-height: 1.33;
  color: rgba(230, 237, 243, 0.8);
  max-width: 29ch;
`;

export const NotesFlag = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.1rem 0.42rem;
  border: 1px solid rgba(232, 177, 92, 0.46);
  background: rgba(232, 177, 92, 0.16);
  color: #f8d7a0;
  font-size: 0.66rem;
  font-weight: 720;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const BoxLink = styled(Link)`
  color: ${LCARS.root};
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 660;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.88);
    text-underline-offset: 2px;
  }
`;

export const BoxLabel = styled.span`
  color: ${LCARS.text};
  font-size: 0.86rem;
`;

export const ContextLine = styled.div`
  margin-top: 0.25rem;
  color: ${LCARS.textMuted};
  font-size: 0.74rem;
  line-height: 1.3;
`;

export const EmptyState = styled.div`
  padding: 1rem;
  color: ${LCARS.textDim};
  font-size: 0.9rem;
`;

export const ErrorState = styled.div`
  ${panelBase};
  padding: 0.82rem 0.9rem;
  color: #ffd6d2;
  border-color: rgba(240, 138, 123, 0.35);
  background: rgba(94, 35, 41, 0.32);
`;

export const MobileList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.48rem;
`;

export const MobileCard = styled.li`
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
`;

export const MobileCardButton = styled.button`
  width: 100%;
  border: 0;
  margin: 0;
  padding: 0.62rem 0.62rem 0.64rem;
  display: grid;
  gap: 0.44rem;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(127, 215, 255, 0.09);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.56);
    outline-offset: -2px;
  }

  &[aria-disabled='true'] {
    cursor: default;
    opacity: 0.88;
  }

  &[aria-disabled='true']:hover {
    background: transparent;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.5rem;
  }
`;

export const MobileTop = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.35rem;
`;

export const MobileNameBlock = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.2rem;
`;

export const MobileNameLink = styled(Link)`
  color: ${LCARS.text};
  font-size: 0.92rem;
  font-weight: 720;
  text-decoration: none;
  line-height: 1.25;
  overflow-wrap: anywhere;

  &:hover {
    text-decoration: underline;
    text-decoration-color: rgba(127, 215, 255, 0.9);
    text-underline-offset: 2px;
  }
`;

export const MobileNameText = styled.span`
  color: ${LCARS.text};
  font-size: 0.92rem;
  font-weight: 720;
  line-height: 1.25;
  overflow-wrap: anywhere;
`;

export const MobileMeta = styled.div`
  color: ${LCARS.textMuted};
  font-size: ${MOBILE_FONT_XS};
`;

export const MobileFacts = styled.div`
  display: grid;
  gap: 0.35rem;
`;

export const MobileLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem;
  align-items: center;
  color: ${LCARS.textDim};
  font-size: ${MOBILE_FONT_SM};
`;

export const MobileNotes = styled.div`
  color: rgba(230, 237, 243, 0.82);
  font-size: ${MOBILE_FONT_SM};
  line-height: 1.35;
`;
