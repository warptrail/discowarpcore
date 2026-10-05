// frontend/src/styles/Lists.shared.styles.js
import styled, { css } from 'styled-components';
import { panelStyles } from './primitives';
import {
  APP_VISUAL_THEME,
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
  MOBILE_PAGE_GAP,
  MOBILE_PANEL_RADIUS,
} from './tokens';

/* ===== LCARS-ish tokens (subtle but present) ===== */
const LCARS = {
  bg: APP_VISUAL_THEME.background,
  panel: APP_VISUAL_THEME.surface,
  panelAlt: APP_VISUAL_THEME.surfaceRaised,
  line: APP_VISUAL_THEME.borderSoft,
  text: APP_VISUAL_THEME.text,
  textDim: APP_VISUAL_THEME.textSecondary,
  lilac: APP_VISUAL_THEME.violet,
  coral: APP_VISUAL_THEME.coral,
  amber: APP_VISUAL_THEME.amber,
  teal: APP_VISUAL_THEME.teal,
  lime: '#9BE564',
};

const BRACKET_COLORS = [
  '#F08A7B', // coral
  '#4CC6C1', // teal
  '#A7B6FF', // lilac
  '#E8B15C', // amber
  '#9BE564', // lime
];
const ROOT_RAIL = APP_VISUAL_THEME.amber;
const BOX_DEPTH_INDENT_PX = 22;
const BOX_DEPTH_INDENT_MOBILE_PX = 12;

const railTone = ({ $isRoot, $depth = 0 }) =>
  $isRoot ? ROOT_RAIL : BRACKET_COLORS[$depth % BRACKET_COLORS.length];
const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;
const childIndent = ({ $depth = 1, $mobile = false }) => {
  const depth = Math.max(Number($depth) || 0, 0);
  if (depth < 1 || depth > 3) return '0px';
  return `${$mobile ? BOX_DEPTH_INDENT_MOBILE_PX : BOX_DEPTH_INDENT_PX}px`;
};



const chipRadius = 'var(--dw-radius-sm)';

const panelBase = css`${panelStyles}`;

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
    gap: 0.36rem;
    padding: 0;
  }
  min-width: 0;
  font-family: var(--dw-font-ui);
  & :is(button, a, input, select, textarea):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }
`;

export const TreeRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.62rem;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    gap: 0.5rem;
  }
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
  letter-spacing: normal;

  /* LCARS elbow */
  &::before {
    content: '';
    width: 8px;
    height: 28px;
    border-radius: 8px;
    background: var(--dw-amber);
    box-shadow: none;
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
  font-family: var(--dw-font-data);
`;

export const SectionTitle = styled.h4`
  font-family: var(--dw-font-ui);
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: normal;
  margin: 0.72rem 0 0.28rem 0;
  color: ${({ $isRoot, $depth = 0 }) =>
    toneAlpha(railTone({ $isRoot, $depth }), 'ee')};
  text-shadow: none;

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
  background: var(--dw-surface);

  &:hover {
    border-color: ${LCARS.teal};
    background: var(--dw-surface);
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.36rem;
  }
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

export const ViewModeBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: -0.35rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: stretch;
    margin-top: -0.22rem;
  }
`;

export const ViewModeLabel = styled.label`
  ${panelBase};
  display: inline-flex;
  align-items: center;
  gap: 0.46rem;
  min-height: 44px;
  padding: 0.32rem 0.54rem;
  background: var(--dw-surface);
  color: ${LCARS.text};
  cursor: pointer;
  user-select: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    justify-content: center;
    min-height: 44px;
    padding: 0.28rem 0.42rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

export const ViewModeLabelText = styled.span`
  font-size: 0.75rem;
  font-weight: 820;
  letter-spacing: normal;
  text-transform: none;
  color: ${LCARS.textDim};
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: normal;
  }
`;

export const ViewModeSwitch = styled.span`
  position: relative;
  display: inline-flex;
  width: 48px;
  height: 26px;
  flex: 0 0 auto;
`;

export const ViewModeCheckbox = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  margin: 0;
  cursor: pointer;
`;

export const ViewModeSlider = styled.span`
  position: absolute;
  inset: 0;
  border-radius: var(--dw-radius);
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: none;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: var(--dw-radius);
    background: ${LCARS.text};
    box-shadow: none;
    transition: transform 160ms ease;
  }

  ${ViewModeCheckbox}:checked + & {
    border-color: rgba(76, 198, 193, 0.62);
    background: rgba(76, 198, 193, 0.32);
    box-shadow: none;
  }

  ${ViewModeCheckbox}:checked + &::after {
    transform: translateX(22px);
    background: #d8fffb;
  }

  ${ViewModeCheckbox}:focus-visible + & {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }
`;

/* Indentation for nested sections */
export const Nest = styled.div`
  position: relative;
  --box-depth-indent: ${({ $depth = 0 }) => childIndent({ $depth })};
  margin-left: var(--box-depth-indent);
  padding-left: 0;
  min-width: 0;
  border-radius: 0 0 0 10px;
  background: ${({ $depth = 0 }) =>
    $depth % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    --box-depth-indent: ${({ $depth = 0 }) =>
      childIndent({ $depth, $mobile: true })};
    border-left: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 0;
    background: transparent;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    --box-depth-indent: ${({ $depth = 0 }) =>
      childIndent({ $depth, $mobile: true })};
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
    margin-top: 0.24rem;
  }
`;

export const RailBack = styled.div`
  grid-area: 1 / 1;
  align-self: stretch;
  width: 4px;
  border-radius: var(--dw-radius-sm) 0 0 var(--dw-radius-sm);
  background: var(--box-primary, #8A8175);
  pointer-events: none;
  z-index: 0;
`;

export const RailFront = styled.div`
  grid-area: 1 / 1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  margin-left: 4px;
  border-radius: 0 var(--dw-radius-sm) var(--dw-radius-sm) 0;
  background: var(--dw-surface);
  z-index: 1;
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
  background: var(--dw-surface);

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
    border-radius: var(--dw-radius);
    background: ${LCARS.textDim};
    opacity: 0.6;
  }
  & > i[data-on='true'] {
    background: ${LCARS.teal};
    opacity: 1;
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }
`;
