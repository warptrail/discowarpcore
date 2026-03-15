// frontend/src/styles/Lists.shared.styles.js
import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
  MOBILE_PAGE_GAP,
  MOBILE_PANEL_RADIUS,
} from './tokens';

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
const ROOT_RAIL = '#7FD7FF';
const RAIL_W = '3px';

const railTone = ({ $isRoot, $depth = 0 }) =>
  $isRoot ? ROOT_RAIL : BRACKET_COLORS[$depth % BRACKET_COLORS.length];
const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;
const depthStep = ({ $depth = 0 }) => Math.min(Math.max($depth, 0), 4);

const railOuterCorners = ({ $isRoot, $depth = 0 }) => {
  const d = depthStep({ $depth });
  if ($isRoot) {
    return `${26 - d}px ${14 - d * 0.4}px ${10 - d * 0.25}px ${20 - d * 0.8}px / ${
      16 - d * 0.6
    }px ${12 - d * 0.3}px ${8 - d * 0.2}px ${20 - d * 0.8}px`;
  }
  return `${22 - d * 0.8}px ${11 - d * 0.3}px ${9 - d * 0.2}px ${
    16 - d * 0.6
  }px / ${13 - d * 0.5}px ${9 - d * 0.25}px ${7 - d * 0.15}px ${
    16 - d * 0.6
  }px`;
};

const railInnerCorners = ({ $isRoot, $depth = 0 }) => {
  const d = depthStep({ $depth });
  if ($isRoot) {
    return `${23 - d * 0.9}px ${11 - d * 0.35}px ${8 - d * 0.2}px ${
      17 - d * 0.7
    }px / ${13 - d * 0.55}px ${10 - d * 0.25}px ${6 - d * 0.15}px ${
      17 - d * 0.7
    }px`;
  }
  return `${19 - d * 0.7}px ${9 - d * 0.25}px ${7 - d * 0.15}px ${
    13 - d * 0.5
  }px / ${10 - d * 0.4}px ${7 - d * 0.2}px ${5 - d * 0.1}px ${
    13 - d * 0.5
  }px`;
};
const railBaseX = '-0.74rem';
const railTop = ({ $isRoot }) => ($isRoot ? '0.22rem' : '0.3rem');

const radius = '14px';
const chipRadius = '999px';

const panelBase = css`
  background: ${LCARS.panel};
  border: 1px solid ${LCARS.line};
  border-radius: ${radius};
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.25),
    0 10px 28px rgba(0, 0, 0, 0.24);
`;

/* ===== Core layout (names preserved) ===== */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem;
  color: ${LCARS.text};
  min-width: 0;
  overflow-x: clip;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.55rem;
    padding: ${MOBILE_PAGE_GAP};
  }
`;

export const TreeRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-wrap: wrap;
    gap: 0.42rem;
  }
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 1rem;

    &::before {
      width: 6px;
      height: 20px;
      border-radius: 6px;
    }
  }
`;

export const ShortId = styled.span`
  font-size: 0.94rem;
  color: currentColor;
  opacity: 0.78;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const SectionTitle = styled.h4`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.015em;
  margin: 0.72rem 0 0.28rem 0;
  color: ${({ $isRoot, $depth = 0 }) =>
    toneAlpha(railTone({ $isRoot, $depth }), 'ee')};
  text-shadow: 0 0 10px
    ${({ $isRoot, $depth = 0 }) =>
      toneAlpha(railTone({ $isRoot, $depth }), '2a')};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.94rem;
    margin: 0.5rem 0 0.2rem 0;
  }
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
  transition:
    border-color 120ms ease,
    background 120ms ease,
    transform 120ms ease;
  background:
    linear-gradient(90deg, ${LCARS.teal}22, transparent 36%) no-repeat,
    ${LCARS.panel};

  &:hover {
    border-color: ${LCARS.teal};
    background:
      linear-gradient(90deg, ${LCARS.lime}1f, transparent 44%) no-repeat,
      ${LCARS.panelAlt};
    transform: translateY(-1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    padding: 0.22rem 0.55rem;
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const MetaRow = styled.div`
  ${panelBase};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.5rem;
    padding: 0.42rem 0.5rem;
  }
`;

/* Indentation for nested sections */
export const Nest = styled.div`
  position: relative;
  margin-left: ${({ $depth = 0 }) => Math.min($depth * 11, 40)}px;
  padding-left: 0.3rem;
  border-radius: 0 0 0 10px;
  background: ${({ $depth = 0 }) =>
    $depth % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-left: ${({ $depth = 0 }) => Math.min($depth * 7, 26)}px;
    padding-left: 0.16rem;
  }
`;

/* Spacing between logical groups */
export const SectionGroup = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  min-width: 0;
  margin-top: 0.5rem;
  isolation: isolate;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: 0.34rem;
  }
`;

export const RailBack = styled.div`
  grid-area: 1 / 1;
  align-self: stretch;
  justify-self: stretch;
  margin-left: ${railBaseX};
  margin-top: ${({ $isRoot }) => railTop({ $isRoot })};
  border-radius: ${({ $isRoot, $depth = 0 }) =>
    railOuterCorners({ $isRoot, $depth })};
  background: ${({ $isRoot, $depth = 0 }) => railTone({ $isRoot, $depth })};
  opacity: ${({ $isRoot }) => ($isRoot ? 0.96 : 0.9)};
  filter: drop-shadow(
    0 0 ${({ $isRoot }) => ($isRoot ? '3px' : '2px')}
      ${({ $isRoot, $depth = 0 }) => `${railTone({ $isRoot, $depth })}2d`}
  );
  pointer-events: none;
  z-index: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-left: -0.5rem;
    margin-top: ${({ $isRoot }) => ($isRoot ? '0.18rem' : '0.24rem')};
  }
`;

export const RailFront = styled.div`
  grid-area: 1 / 1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  width: auto;
  min-width: 0;
  z-index: 1;
  margin-left: calc(${RAIL_W} + 0.08rem);
  margin-right: ${RAIL_W};
  margin-top: ${({ $isRoot }) => `calc(${railTop({ $isRoot })} + ${RAIL_W})`};
  margin-bottom: ${RAIL_W};
  padding-top: 0.34rem;
  padding-right: 0.45rem;
  padding-left: ${({ $isRoot }) => ($isRoot ? '1.92rem' : '1.7rem')};
  padding-bottom: 0.2rem;
  border-radius: ${({ $isRoot, $depth = 0 }) =>
    railInnerCorners({ $isRoot, $depth })};
  background: linear-gradient(
    140deg,
    ${LCARS.bg} 32%,
    rgba(12, 15, 17, 0.94) 68%,
    rgba(12, 15, 17, 0.9) 100%
  );

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-left: calc(${RAIL_W} + 0.02rem);
    margin-right: ${RAIL_W};
    margin-top: ${({ $isRoot }) => ($isRoot ? '0.24rem' : '0.28rem')};
    padding-top: 0.22rem;
    padding-right: 0.25rem;
    padding-left: ${({ $isRoot }) => ($isRoot ? '1.18rem' : '1.04rem')};
    padding-bottom: 0.16rem;
    border-radius: 10px 8px 7px 9px / 9px 7px 6px 9px;
  }
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
  background:
    linear-gradient(90deg, ${LCARS.coral}1c, transparent 35%) no-repeat,
    ${LCARS.panel};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.42rem;
    padding: 0.44rem 0.5rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

/** Left side crumbs */
export const Crumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.3rem;
  }
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.18rem 0.42rem;
    max-width: 150px;
  }
`;

/** chevron between crumbs */
export const CrumbSep = styled.span`
  color: ${LCARS.textDim};
  opacity: 0.9;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

/** Right side stats group */
export const StatGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: flex-start;
    gap: 0.3rem;
  }
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    padding: 0.2rem 0.42rem;
  }
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

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }
`;
