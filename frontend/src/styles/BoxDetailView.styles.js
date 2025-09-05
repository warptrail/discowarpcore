// BoxDetailView.styles.js
import styled, { css, keyframes } from 'styled-components';

/* ==== LCARS-ish Palette (subtle, readable, high-contrast) ==== */
const LCARS = {
  bg: '#0c0f11',
  panel: '#14181b',
  panelAlt: '#1a1f24',
  text: '#e6edf3',
  textDim: 'rgba(230, 237, 243, 0.70)',
  line: 'rgba(255,255,255,0.08)',
  glow: 'rgba(255,255,255,0.06)',

  // accents
  amber: '#E8B15C', // items
  coral: '#F08A7B', // items hover
  plum: '#B986C8', // boxes
  lilac: '#A7B6FF', // boxes hover
  teal: '#4CC6C1',
  lime: '#9BE564',
};

const flashBorder = keyframes`
  0%   { box-shadow: 0 0 0 0 ${LCARS.teal}00; }
  50%  { box-shadow: 0 0 0 4px ${LCARS.teal}59; }
  100% { box-shadow: 0 0 0 0 ${LCARS.teal}00; }
`;

/* ==== Tokens / helpers ==== */
const radiusXXL = '22px';
const radiusXL = '16px';
// const radiusL = '12px';

const shadowCard = `0 1px 0 rgba(0,0,0,0.3), 0 10px 28px rgba(0,0,0,0.28)`;
const focusRing = `0 0 0 3px ${LCARS.teal}40`;

const panelBase = css`
  background: ${LCARS.panel};
  border: 1px solid ${LCARS.line};
  border-radius: ${radiusXL};
  box-shadow: ${shadowCard};
`;

/* ==== Layout container ==== */
const Container = styled.div`
  --pad: clamp(12px, 3vw, 20px);
  max-width: 920px;
  margin: 0 auto;
  padding: calc(var(--pad) * 1.5) var(--pad) calc(var(--pad) * 2.25);
  color: ${LCARS.text};
  background-color: ${LCARS.bg};
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
  line-height: 1.45;

  /* mobile-friendly tap targets by default */
  *:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
    border-radius: 10px;
    transition: box-shadow 120ms ease;
  }
`;

/* ==== Heading with LCARS elbow bar ==== */
const Heading = styled.h2`
  position: relative;
  margin: 0 0 14px;
  font-weight: 800;
  letter-spacing: 0.2px;
  font-size: clamp(20px, 3.6vw, 28px);

  /* LCARS elbow: colored block + thin runner */
  &::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
    height: 38px;
    width: 10px;
    border-radius: 10px;
    background: ${LCARS.coral};
  }
  &::after {
    content: '';
    position: absolute;
    left: 6px;
    right: -6px;
    bottom: -8px;
    height: 4px;
    border-radius: 6px;
    background: linear-gradient(
      90deg,
      ${LCARS.coral},
      ${LCARS.amber},
      ${LCARS.teal}
    );
    opacity: 0.65;
  }

  ${({ $flash }) =>
    $flash &&
    css`
      display: inline-block;
      padding: 2px 8px 4px;
      border-radius: 10px;
      background: ${LCARS.panelAlt};
      animation: ${flashBorder} 600ms ease-out 0ms 2;
    `}
`;

/* ==== Tabs (fat, thumb-friendly, LCARS chips) ==== */
const TabToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 18px;

  @media (min-width: 720px) {
    gap: 10px;
    margin-bottom: 22px;
  }
`;

const TabButton = styled.button`
  ${panelBase};
  position: relative;
  padding: 12px 14px;
  font-size: clamp(14px, 2.8vw, 16px);
  font-weight: 700;
  color: ${({ $active }) => ($active ? LCARS.bg : LCARS.text)};
  background: ${({ $active }) => ($active ? LCARS.teal : LCARS.panel)};
  border: none;
  cursor: pointer;
  transition: transform 120ms ease, background 150ms ease, color 150ms ease;
  border-radius: ${radiusXXL};

  &:hover {
    transform: translateY(-1px);
    background: ${({ $active }) => ($active ? LCARS.teal : LCARS.panelAlt)};
  }

  &:active {
    transform: translateY(0);
  }
`;

/* ==== Tree containers ==== */
const TreeList = styled.ul`
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
`;

const NodeRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
`;

const NodeLabel = styled.span`
  font-weight: 700;
`;

const NodeDim = styled.span`
  opacity: 0.72;
  font-size: 0.94em;
`;

const Indent = styled.div`
  padding-left: ${({ depth = 0 }) => depth * 16}px;
`;

/* ==== Each box card (LCARS ribbon + rounded corners) ==== */
const TreeNode = styled.div`
  display: block;
  cursor: pointer;
  /* keep all your existing box panel styles */
`;

/* ==== Items ==== */
const ItemList = styled.ul`
  list-style: none;
  margin: 8px 0;
  padding: 0;
`;

const ItemNode = styled.a`
  display: block;
  text-decoration: none;
  cursor: pointer;
  ${panelBase};
  border-radius: 12px;
  margin: 8px 0;
  transition: transform 120ms ease, background 150ms ease;

  background: linear-gradient(90deg, ${LCARS.amber}26, transparent 28%)
      no-repeat,
    ${LCARS.panel};

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(90deg, ${LCARS.coral}20, transparent 36%)
        no-repeat,
      ${LCARS.panelAlt};
  }
`;

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px; /* was 12px 14px */
  border-bottom: 1px solid ${LCARS.line};
  background: ${LCARS.panelAlt};

  &:hover {
    background: ${LCARS.panel};
  }
`;

const NodeChildren = styled.div`
  margin-left: 10px;
  margin-top: 8px;

  display: flex;
  flex-direction: column;
  gap: 10px;

  border-left: 2px dashed ${LCARS.lilac}33; /* nudge toward “box accent” */
  padding-left: 12px;
`;

const NodeTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  font-size: clamp(16px, 3.6vw, 18px); /* was 15->16 */
  font-weight: 800;
  color: ${LCARS.text};
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const BoxLabelText = styled.span`
  font-weight: 900;
  font-size: clamp(18px, 4vw, 22px); /* bigger title */
  color: ${LCARS.text};
  max-width: min(72vw, 560px);
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;

  &:hover {
    color: ${LCARS.lilac};
    text-shadow: 0 0 18px ${LCARS.lilac}40;
  }
`;

const Meta = styled.span`
  font-size: 0.9rem;
  color: ${LCARS.textDim};
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${LCARS.glow};
  display: inline-flex;
  align-items: center;

  &:first-of-type {
    margin-left: 12px;
  }
`;

/* item row content */
const ItemRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr; /* qty first, then title */
  align-items: start; /* top align for “top-left” qty */
  column-gap: 10px;
  padding: 8px 12px 4px; /* shorter overall */
  min-height: 38px; /* shorter than before */
  cursor: pointer;

  &:hover ._qty {
    filter: brightness(1.12);
  }
`;

const ItemTitle = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  color: ${LCARS.text};
  font-size: clamp(13px, 3vw, 15px); /* slightly smaller */
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemQuantity = styled.span.attrs({ className: '_qty' })`
  order: -1; /* appears before the name */
  align-self: start; /* top-left alignment */
  margin-top: 2px;
  margin-right: 2px;

  font-size: 11px;
  font-weight: 900;
  color: ${LCARS.bg};
  background: ${LCARS.amber}; /* item accent */
  border: 1px solid ${LCARS.amber}90;
  border-radius: 999px;
  padding: 2px 8px;
  line-height: 1.2;
  white-space: nowrap;
`;

const NotePreview = styled.div`
  font-size: clamp(12px, 2.8vw, 13px);
  color: ${LCARS.textDim};
  margin: 4px 12px 8px; /* tighter margins */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2; /* shorter line height */
  min-height: 1.1em;
`;

const RowDivider = styled.div`
  height: 1px;
  margin: 0 10px 8px;
  background: linear-gradient(
    90deg,
    transparent,
    ${LCARS.line} 25%,
    ${LCARS.line} 75%,
    transparent
  );
  opacity: 0.9;
`;

/* tag row doubles as chip rack */
const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 8px;
  padding: 10px 12px 12px;
  min-height: 36px;
`;

const TagBubble = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;

  color: ${LCARS.bg};
  background: ${LCARS.teal};
  border: 1px solid ${LCARS.teal}90;
  font-size: 12px;
  font-weight: 800;
  user-select: none;
  cursor: pointer;
  letter-spacing: 0.25px;

  &:hover {
    background: ${LCARS.lime};
    border-color: ${LCARS.lime}a0;
  }
`;

const DetailsWrap = styled.div`
  overflow: hidden;
  animation: fadeIn 160ms ease;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const EmptyMessage = styled.div`
  ${panelBase};
  padding: 14px;
  color: ${LCARS.textDim};
  border-style: dashed;
  border-radius: ${radiusXL};
  background: linear-gradient(90deg, ${LCARS.glow}, transparent 20%) no-repeat,
    ${LCARS.panelAlt};
`;

/* ==== Export (unchanged names) ==== */
export const styledComponents = {
  Container,
  Heading,
  TabToggle,
  TabButton,
  TreeList,
  NodeRow,
  NodeLabel,
  NodeDim,
  Indent,
  TreeNode,
  ItemList,
  ItemNode,
  NodeHeader,
  NodeChildren,
  NodeTitle,
  BoxLabelText,
  Meta,
  ItemRow,
  ItemTitle,
  ItemQuantity,
  NotePreview,
  RowDivider,
  TagRow,
  TagBubble,
  DetailsWrap,
  EmptyMessage,
};
