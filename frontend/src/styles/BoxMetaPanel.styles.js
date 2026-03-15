// src/styles/BoxMetaPanel.styles.js
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
  MOBILE_PANEL_RADIUS,
} from './tokens';

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

const PANEL_RADIUS = '14px';
const NODE_RADIUS = '10px';
const FAST = '150ms ease';

const toneColor = (tone) =>
  tone === 'coral'
    ? LCARS.coral
    : tone === 'amber'
    ? LCARS.amber
    : tone === 'lime'
    ? LCARS.lime
    : tone === 'teal'
    ? LCARS.teal
    : LCARS.lilac;

export const Panel = styled.section`
  position: relative;
  display: grid;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid ${LCARS.line};
  border-radius: ${PANEL_RADIUS};
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 28%),
    ${LCARS.panel};
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.28), 0 10px 20px rgba(0, 0, 0, 0.2);

  &:before {
    content: '';
    position: absolute;
    left: 18px;
    right: 18px;
    top: 0;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      ${LCARS.teal},
      ${LCARS.coral} 48%,
      transparent 92%
    );
    opacity: 0.45;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 10px;
    padding: 10px 11px;
    border-radius: ${MOBILE_PANEL_RADIUS};
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.24), 0 6px 12px rgba(0, 0, 0, 0.18);

    &:before {
      left: 11px;
      right: 11px;
      opacity: 0.34;
    }
  }
`;

export const IdentityZone = styled.div`
  display: grid;
  gap: 10px;
`;

export const IdentityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-wrap: wrap;
    gap: 6px;
  }
`;

export const ScopeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid ${({ $tone }) => `${toneColor($tone)}66`};
  background: ${({ $tone }) => `${toneColor($tone)}1f`};
  color: ${({ $tone }) => toneColor($tone)};
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &:before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 8px currentColor;
    opacity: 0.75;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    padding: 3px 8px;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;

    &:before {
      width: 6px;
      height: 6px;
      box-shadow: 0 0 5px currentColor;
    }
  }
`;

export const DepthHint = styled.span`
  color: ${LCARS.textDim};
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const CurrentBox = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid ${LCARS.teal}52;
  border-radius: ${NODE_RADIUS};
  color: ${LCARS.text};
  background: linear-gradient(105deg, ${LCARS.teal}26, transparent 58%),
    ${LCARS.panelSoft};
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  cursor: default;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    padding: 8px 9px;
    border-radius: 9px;
  }
`;

export const CurrentBoxId = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.93rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1;
  padding: 5px 8px;
  border-radius: 8px;
  color: ${LCARS.teal};
  background: ${LCARS.teal}1f;
  border: 1px solid ${LCARS.teal}57;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.09em;
    padding: 4px 6px;
  }
`;

export const CurrentBoxTitle = styled.span`
  font-size: 1.02rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
  }
`;

export const Crumbs = styled.nav`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
`;

export const PathContext = styled.div`
  display: grid;
  gap: 6px;
`;

export const PathLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${LCARS.textDim};
`;

export const Crumb = styled.a`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px 9px;
  border-radius: 8px;
  border: 1px solid ${LCARS.line};
  color: ${LCARS.text};
  text-decoration: none;
  background: ${LCARS.panelSoft};
  opacity: 0.9;
  transition: border-color ${FAST}, background ${FAST}, opacity ${FAST},
    transform ${FAST};

  &:hover {
    opacity: 1;
    border-color: ${LCARS.teal}42;
    background: linear-gradient(98deg, ${LCARS.teal}14, transparent 52%),
      ${LCARS.panelSoft};
    transform: translateY(-1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    padding: 5px 7px;
    border-radius: 7px;
  }
`;

export const CrumbSep = styled.span`
  color: ${LCARS.textDim};
  font-size: 0.9rem;
  line-height: 1;
  user-select: none;
`;

export const BoxIdMono = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 6px;
  color: ${LCARS.textDim};
  background: ${LCARS.panelSoft};
  border: 1px solid ${LCARS.line};
`;

export const CrumbLabel = styled.span`
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: 130px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const MetaZone = styled.div`
  padding: 2px 0;
  border-top: 1px solid ${LCARS.line};
  border-bottom: 1px solid ${LCARS.line};
`;

export const StatGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 2px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 440px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 8px;
    padding: 8px 0;
  }
`;

export const StatItem = styled.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`;

export const StatLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${LCARS.textDim};
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const StatValue = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ $tone }) => toneColor($tone)};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
  }
`;

export const ChildrenZone = styled.div`
  display: grid;
  gap: 10px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
`;

export const Label = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${LCARS.textDim};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const SectionHint = styled.span`
  color: ${LCARS.textDim};
  font-size: 0.8rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const MetaCount = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  color: ${LCARS.textDim};
  font-size: 0.78rem;
  letter-spacing: 0.1em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.07em;
  }
`;

export const ChildrenRow = styled.div`
  display: grid;
  gap: 8px;
`;

export const DescendantNode = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

export const DescendantRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    align-items: flex-start;
    gap: 6px;
  }
`;

export const DescendantConnector = styled.span`
  width: ${({ $depth }) => ($depth > 0 ? '10px' : '0px')};
  flex: 0 0 ${({ $depth }) => ($depth > 0 ? '10px' : '0px')};
  height: 1px;
  background: ${LCARS.line};
  opacity: ${({ $depth }) => ($depth > 0 ? 1 : 0)};
`;

export const BoxLink = styled.a`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 9px;
  color: ${LCARS.text};
  text-decoration: none;
  background: ${LCARS.panelSoft};
  border: 1px solid ${LCARS.line};
  min-width: 0;
  transition: border-color ${FAST}, background ${FAST}, transform ${FAST};

  &:hover {
    border-color: ${LCARS.teal}4d;
    background: linear-gradient(98deg, ${LCARS.teal}1a, transparent 52%),
      ${LCARS.panelSoft};
    transform: translateY(-1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 7px;
    padding: 7px 8px;
    border-radius: 8px;
  }
`;

export const DescendantLink = styled(BoxLink)`
  flex: 1;
`;

export const DescendantMeta = styled.span`
  color: ${LCARS.textDim};
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: 560px) {
    display: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const DescendantChildren = styled.div`
  display: grid;
  gap: 6px;
  margin-left: 14px;
  padding-left: 12px;
  border-left: 1px solid ${LCARS.line};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-left: 8px;
    padding-left: 8px;
    gap: 5px;
  }
`;

export const BoxLinkLabel = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Muted = styled.span`
  color: ${LCARS.textDim};
  font-size: 0.92rem;
  padding: 4px 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;
