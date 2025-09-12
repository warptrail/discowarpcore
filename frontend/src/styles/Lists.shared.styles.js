// frontend/src/styles/Lists.shared.styles.js
import styled, { css } from 'styled-components';

/* ===== LCARS-ish tokens (subtle but present) ===== */
const LCARS = {
  bg: '#0c0f11',
  panel: '#14181b',
  panelAlt: '#1a1f24',
  line: 'rgba(255,255,255,0.08)',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.70)',
  lilac: '#A7B6FF',
  coral: '#F08A7B',
  amber: '#E8B15C',
  teal: '#4CC6C1',
  lime: '#9BE564',
};

const BRACKET_COLORS = [
  '#F08A7B', // coral
  '#4CC6C1', // teal
  '#A7B6FF', // lilac
  '#E8B15C', // amber
  '#9BE564', // lime
];

const radius = '14px';
const chipRadius = '999px';

const panelBase = css`
  background: ${LCARS.panel};
  border: 1px solid ${LCARS.line};
  border-radius: ${radius};
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25), 0 10px 28px rgba(0, 0, 0, 0.24);
`;

/* ===== Core layout (names preserved) ===== */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem;
  color: ${LCARS.text};
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

export const Title = styled.h3`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.2px;

  /* LCARS elbow */
  &::before {
    content: '';
    width: 8px;
    height: 28px;
    border-radius: 8px;
    background: ${LCARS.coral};
    box-shadow: 0 0 0 2px ${LCARS.coral}20 inset;
  }
`;

export const ShortId = styled.span`
  font-size: 0.9rem;
  color: ${LCARS.textDim};
`;

export const SectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  margin: 0.75rem 0 0.25rem 0;
  color: ${LCARS.text};
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const TagBubble = styled.button`
  ${panelBase};
  border-radius: ${chipRadius};
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
  color: ${LCARS.text};
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease,
    transform 120ms ease;
  background: linear-gradient(90deg, ${LCARS.teal}22, transparent 36%) no-repeat,
    ${LCARS.panel};

  &:hover {
    border-color: ${LCARS.teal};
    background: linear-gradient(90deg, ${LCARS.lime}1f, transparent 44%)
        no-repeat,
      ${LCARS.panelAlt};
    transform: translateY(-1px);
  }
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Count = styled.span`
  font-size: 0.9rem;
  color: ${LCARS.textDim};
`;

export const MetaRow = styled.div`
  ${panelBase};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
`;

/* Indentation for nested sections */
export const Nest = styled.div`
  position: relative;
  margin-left: ${({ $depth = 0 }) => Math.min($depth * 14, 48)}px;
  padding-left: 0.75rem;
  border-left: 4px solid
    ${({ $depth = 0 }) => BRACKET_COLORS[$depth % BRACKET_COLORS.length]};
  border-radius: 0 0 0 8px;
  background: ${({ $depth = 0 }) =>
    $depth % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};
`;

/* Spacing between logical groups */
export const SectionGroup = styled.div`
  margin-top: 0.6rem;
`;

/* ===== NEW: Breadcrumb / Tree map + Stats ===== */

/** Thin LCARS bar row to hold crumbs + stats */
export const CrumbBar = styled.div`
  ${panelBase};
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: linear-gradient(90deg, ${LCARS.coral}1c, transparent 35%)
      no-repeat,
    ${LCARS.panel};
`;

/** Left side crumbs */
export const Crumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  min-width: 0;
`;

/** breadcrumb chip / link */
export const Crumb = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: ${chipRadius};
  padding: 0.2rem 0.6rem;
  font-size: 0.78rem;
  color: ${LCARS.text};
  background: #23282d;
  border: 1px solid ${LCARS.line};
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** chevron between crumbs */
export const CrumbSep = styled.span`
  color: ${LCARS.textDim};
  opacity: 0.9;
`;

/** Right side stats group */
export const StatGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

/** pill for counts */
export const StatPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: ${chipRadius};
  padding: 0.25rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${LCARS.bg};
  background: ${({ $tone = 'teal' }) =>
    $tone === 'lilac'
      ? LCARS.lilac
      : $tone === 'amber'
      ? LCARS.amber
      : $tone === 'coral'
      ? LCARS.coral
      : $tone === 'lime'
      ? LCARS.lime
      : LCARS.teal};
  border: 1px solid rgba(255, 255, 255, 0.18);
`;

/** level dots to show max depth (1–5) */
export const LevelDots = styled.div`
  display: inline-grid;
  grid-auto-flow: column;
  gap: 6px;
  align-items: center;

  & > i {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${LCARS.textDim};
    opacity: 0.6;
  }
  & > i[data-on='true'] {
    background: ${LCARS.teal};
    opacity: 1;
    box-shadow: 0 0 0 2px ${LCARS.teal}22;
  }
`;
