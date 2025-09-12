// src/styles/BoxMetaPanel.styles.js
import styled from 'styled-components';

/* ---- LCARS-ish fixed palette (no ThemeProvider required) ---- */
const LCARS = {
  bg: '#0E0F12',
  panel: '#151921',
  panelSoft: '#1B2029',
  line: 'rgba(255,255,255,0.08)',
  text: '#E7ECF3',
  textDim: 'rgba(231,236,243,0.72)',
  lilac: '#A7B6FF',
  coral: '#F08A7B',
  amber: '#E8B15C',
  teal: '#4CC6C1',
  lime: '#9BE564',
};

const RADIUS = '12px';
const CHIP = '999px';

/* ---- Root panel ---- */
export const Panel = styled.section`
  background: ${LCARS.panel};
  border: 1px solid ${LCARS.line};
  border-radius: ${RADIUS};
  padding: 16px;
  display: grid;
  gap: 12px;
  position: relative;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25), 0 12px 26px rgba(0, 0, 0, 0.22);

  /* LCARS vertical accent */
  &:before {
    content: '';
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 10px;
    width: 6px;
    border-radius: 6px;
    background: linear-gradient(${LCARS.coral}, ${LCARS.teal});
    opacity: 0.9;
  }
`;

/* ---- Row 1: scope + breadcrumb ---- */
export const TopRow = styled.div`
  display: block;
`;

export const Crumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
`;

export const ScopeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: ${CHIP};
  font-size: 0.78rem;
  font-weight: 800;
  color: ${LCARS.bg};
  background: ${({ $tone }) =>
    $tone === 'coral'
      ? LCARS.coral
      : $tone === 'amber'
      ? LCARS.amber
      : $tone === 'lime'
      ? LCARS.lime
      : $tone === 'teal'
      ? LCARS.teal
      : LCARS.lilac};
  border: 1px solid rgba(255, 255, 255, 0.18);
`;

export const Crumb = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: ${CHIP};
  color: ${LCARS.text};
  text-decoration: none;
  background: linear-gradient(90deg, ${LCARS.coral}20, transparent 35%)
      no-repeat,
    ${LCARS.panel};
  border: 1px solid ${LCARS.line};
  white-space: nowrap;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: linear-gradient(90deg, ${LCARS.lime}1a, transparent 45%)
        no-repeat,
      ${LCARS.panelSoft};
    transform: translateY(-1px);
  }

  &[aria-current='page'] {
    outline: 2px solid ${LCARS.teal}44;
  }
`;

export const CrumbSep = styled.span`
  color: ${LCARS.textDim};
  user-select: none;
`;

export const BoxIdMono = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border-radius: ${CHIP};
  color: ${LCARS.bg};
  background: ${LCARS.teal};
  border: 1px solid ${LCARS.teal}a0;
`;

/* ---- Row 2: stats ---- */
export const StatsRow = styled.div`
  background: linear-gradient(90deg, ${LCARS.teal}17, transparent 40%) no-repeat,
    ${LCARS.panelSoft};
  border: 1px solid ${LCARS.line};
  border-radius: ${RADIUS};
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

export const StatGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const StatPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: ${CHIP};
  padding: 6px 10px;
  font-size: 0.82rem;
  font-weight: 800;
  color: ${LCARS.bg};
  background: ${({ $tone }) =>
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

/* ---- Divider ---- */
export const Divider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, ${LCARS.line}, transparent);
  margin: 2px 0;
`;

/* ---- Row 3: children ---- */
export const ChildrenBlock = styled.div`
  display: grid;
  gap: 8px;
`;

export const Label = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${LCARS.textDim};
`;

export const ChildrenRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

export const BoxLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: ${CHIP};
  color: ${LCARS.text};
  text-decoration: none;
  background: linear-gradient(90deg, ${LCARS.teal}22, transparent 35%) no-repeat,
    ${LCARS.panel};
  border: 1px solid ${LCARS.line};

  &:hover {
    background: linear-gradient(90deg, ${LCARS.lime}1a, transparent 45%)
        no-repeat,
      ${LCARS.panelSoft};
    transform: translateY(-1px);
  }
`;

export const Muted = styled.span`
  color: ${LCARS.textDim};
  opacity: 0.9;
`;
