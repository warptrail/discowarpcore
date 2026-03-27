// src/styles/BoxList.styles.js
import styled, { css, keyframes } from 'styled-components';

const LCARS = {
  bg: '#0c0f11',
  panel: '#14181b',
  panelAlt: '#1a1f24',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  line: 'rgba(255,255,255,0.08)',
  coral: '#F08A7B',
  teal: '#4CC6C1',
  lilac: '#A7B6FF',
  amber: '#E8B15C',
  lime: '#9BE564',
  ice: '#7FD7FF',
  cyan: '#67D9D3',
};

const BRACKET_COLORS = [
  LCARS.coral,
  LCARS.teal,
  LCARS.lilac,
  LCARS.amber,
  LCARS.lime,
];
const ROOT_RAIL = '#7FD7FF';
const RAIL_W = '3px';
const RADIUS = '14px';
const radiusL = '12px';
const railBaseX = '-0.74rem';

const railTone = ({ $isRoot, $depth = 0 }) =>
  $isRoot ? ROOT_RAIL : BRACKET_COLORS[$depth % BRACKET_COLORS.length];
const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;
const depthStep = ({ $depth = 0 }) => Math.min(Math.max($depth, 0), 4);
const railTop = ({ $isRoot }) => ($isRoot ? '0.22rem' : '0.3rem');

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

const breatheIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const panelBase = css`
  background: ${LCARS.panel};
  border: 1px solid ${LCARS.line};
  border-radius: ${RADIUS};
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.25),
    0 10px 28px rgba(0, 0, 0, 0.24);
`;

const Container = styled.div`
  --pad: clamp(12px, 3vw, 20px);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-width: 940px;
  margin: 0 auto;
  padding: calc(var(--pad) * 1.2) var(--pad) calc(var(--pad) * 1.8);
  color: ${LCARS.text};
  border-radius: 16px;
  background:
    radial-gradient(circle at top right, #7fd7ff15 0%, transparent 44%),
    linear-gradient(180deg, #0d1013, #0b0e11 45%, #0d1013 100%);
`;

const Heading = styled.h2`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: clamp(20px, 4.2vw, 26px);
  font-weight: 900;
  color: ${LCARS.text};
  margin: 0.4rem 0 0.25rem;
  letter-spacing: 0.25px;

  &::before {
    content: '';
    width: 9px;
    height: 28px;
    border-radius: 8px;
    background: ${LCARS.coral};
    box-shadow: 0 0 0 2px ${toneAlpha(LCARS.coral, '2f')} inset;
  }
`;

const NodeSection = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  min-width: 0;
  margin-top: 0.44rem;
  isolation: isolate;
`;

const RailBack = styled.div`
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

  @media (max-width: 560px) {
    opacity: ${({ $isRoot, $depth = 0 }) => ($isRoot ? 0.94 : $depth >= 2 ? 0.62 : 0.78)};
  }
`;

const RailFront = styled.div`
  grid-area: 1 / 1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.44rem;
  width: auto;
  min-width: 0;
  z-index: 1;
  margin-left: calc(${RAIL_W} + 0.08rem);
  margin-right: ${RAIL_W};
  margin-top: ${({ $isRoot }) => `calc(${railTop({ $isRoot })} + ${RAIL_W})`};
  margin-bottom: ${RAIL_W};
  padding-top: 0.38rem;
  padding-right: 0.45rem;
  padding-left: ${({ $isRoot }) => ($isRoot ? '1.94rem' : '1.72rem')};
  padding-bottom: 0.35rem;
  border-radius: ${({ $isRoot, $depth = 0 }) =>
    railInnerCorners({ $isRoot, $depth })};
  background: linear-gradient(
    140deg,
    ${LCARS.bg} 34%,
    rgba(12, 15, 17, 0.95) 68%,
    rgba(12, 15, 17, 0.9) 100%
  );

  @media (max-width: 560px) {
    margin-right: 2px;
    padding-right: 0.3rem;
    padding-left: ${({ $isRoot, $depth = 0 }) =>
      $isRoot ? '1.3rem' : $depth >= 2 ? '0.96rem' : '1.1rem'};
  }
`;

const BoxCard = styled.div`
  ${panelBase};
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  animation: ${breatheIn} 140ms ease both;
  border-color: ${({ $isRoot, $depth = 0 }) =>
    toneAlpha(railTone({ $isRoot, $depth }), '3f')};
  background:
    linear-gradient(
      92deg,
      ${({ $isRoot, $depth = 0 }) => toneAlpha(railTone({ $isRoot, $depth }), '15')} 0%,
      transparent 36%
    ),
    ${LCARS.panel};
  transition:
    transform 130ms ease,
    border-color 160ms ease,
    background 160ms ease;

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      border-style: dashed;
      border-color: ${toneAlpha(LCARS.teal, '9a')};
      background:
        linear-gradient(92deg, ${toneAlpha(LCARS.teal, '24')} 0%, transparent 42%),
        ${LCARS.panel};
    `}

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: ${({ $isRoot, $depth = 0 }) => railTone({ $isRoot, $depth })};
    opacity: 0.28;
    ${({ $isSystem }) =>
      $isSystem &&
      css`
        background: ${LCARS.teal};
        opacity: 0.42;
      `}
  }

  &:hover {
    transform: translateY(-1px);
    border-color: ${({ $isRoot, $depth = 0 }) =>
      toneAlpha(railTone({ $isRoot, $depth }), '7a')};
    background:
      linear-gradient(
        92deg,
        ${({ $isRoot, $depth = 0 }) =>
          toneAlpha(railTone({ $isRoot, $depth }), '1f')} 0%,
        transparent 42%
      ),
      ${LCARS.panelAlt};

    ${({ $isSystem }) =>
      $isSystem &&
      css`
        border-color: ${toneAlpha(LCARS.cyan, 'b4')};
        background:
          linear-gradient(92deg, ${toneAlpha(LCARS.cyan, '2b')} 0%, transparent 46%),
          ${LCARS.panelAlt};
      `}
  }
`;

const BoxHeader = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 15px 16px 11px;
  border-bottom: 1px solid ${LCARS.line};
`;

const BoxTitle = styled.div`
  font-weight: 900;
  font-size: clamp(18px, 3.6vw, 22px);
  color: ${({ $isRoot, $depth = 0 }) =>
    toneAlpha(railTone({ $isRoot, $depth }), 'ee')};
  text-shadow: 0 0 10px
    ${({ $isRoot, $depth = 0 }) => toneAlpha(railTone({ $isRoot, $depth }), '1f')};
  ${({ $isSystem }) =>
    $isSystem &&
    css`
      color: ${toneAlpha(LCARS.teal, 'ef')};
      text-shadow: 0 0 10px ${toneAlpha(LCARS.teal, '2f')};
    `}
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ShortId = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 900;
  font-size: clamp(14px, 3.4vw, 18px);
  letter-spacing: 0.4px;
  color: ${({ $isRoot, $depth = 0 }) =>
    toneAlpha(railTone({ $isRoot, $depth }), 'f0')};
  background: transparent;
  border: 2px solid
    ${({ $isRoot, $depth = 0 }) => toneAlpha(railTone({ $isRoot, $depth }), 'bd')};
  ${({ $isSystem }) =>
    $isSystem &&
    css`
      color: ${toneAlpha(LCARS.teal, 'ef')};
      border-color: ${toneAlpha(LCARS.teal, 'bd')};
      background: linear-gradient(
        180deg,
        ${toneAlpha(LCARS.teal, '14')},
        transparent 90%
      );
    `}
`;

const Meta = styled.span`
  font-size: 12px;
  color: ${LCARS.textDim};
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${LCARS.line};
  align-self: start;
`;

const FieldGroup = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
  padding: 10px 16px 0;
  align-items: start;
`;

const FieldLabel = styled.span`
  color: ${LCARS.textDim};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  line-height: 1.6;
`;

const FieldValue = styled.div`
  color: ${LCARS.text};
  font-size: 13px;
  line-height: 1.45;
  opacity: 0.95;
  min-height: 1.2em;
  word-break: break-word;
`;

const DescriptionValue = styled(FieldValue)`
  @media (max-width: 560px) {
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${({ $depth = 0 }) =>
      $depth >= 2 &&
      css`
        display: none;
      `}
  }
`;

const MobileDescriptionHint = styled.span`
  display: none;

  @media (max-width: 560px) {
    ${({ $depth = 0 }) =>
      $depth >= 2
        ? css`
            display: inline-flex;
            align-items: center;
          `
        : css`
            display: none;
          `}
    color: ${toneAlpha(LCARS.textDim, 'cf')};
    font-size: 12px;
    line-height: 1.35;
    font-style: italic;
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 6px;
`;

const TagBubble = styled.span`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.25px;
  user-select: none;
  color: ${LCARS.textDim};
  background:
    linear-gradient(
      90deg,
      ${({ $isRoot, $depth = 0 }) =>
          toneAlpha(railTone({ $isRoot, $depth }), '20')}
        0%,
      transparent 70%
    ),
    #121518;
  border: 1px solid
    ${({ $isRoot, $depth = 0 }) => toneAlpha(railTone({ $isRoot, $depth }), '7f')};

  ${({ $tiny, $isRoot, $depth }) =>
    $tiny &&
    css`
      height: 20px;
      font-size: 10px;
      font-weight: 700;
      border-color: ${toneAlpha(railTone({ $isRoot, $depth }), '49')};
      color: ${toneAlpha(LCARS.text, 'b8')};

      ${({ $isSystem }) =>
        $isSystem &&
        css`
          border-color: ${toneAlpha(LCARS.teal, '70')};
          color: ${toneAlpha(LCARS.teal, 'ea')};
          background:
            linear-gradient(90deg, ${toneAlpha(LCARS.teal, '20')} 0%, transparent 74%),
            #121518;
        `}
    `}
`;

const BoxFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 12px;
  border-top: 1px dashed ${LCARS.line};
`;

const NotesPreviewArea = styled.div`
  display: grid;
  gap: 4px;
  margin: 0 12px 12px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${toneAlpha(LCARS.line, 'db')};
  background: linear-gradient(180deg, rgba(13, 21, 29, 0.88), rgba(10, 16, 22, 0.84));
`;

const NotesPreviewLabel = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'dc')};
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.42px;
  text-transform: uppercase;
`;

const NotesPreviewText = styled.p`
  margin: 0;
  color: ${toneAlpha(LCARS.text, 'de')};
  font-size: 12.5px;
  line-height: 1.44;
  white-space: pre-line;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;

  @media (max-width: 720px) {
    font-size: 12px;
    line-height: 1.4;
    -webkit-line-clamp: 2;
  }
`;

const NotesPreviewEmpty = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'b8')};
  font-size: 12px;
  font-style: italic;
`;

const StatPill = styled.span`
  font-size: 11px;
  font-weight: 900;
  border-radius: 999px;
  padding: 2px 8px;
  line-height: 1.2;
  white-space: nowrap;
  color: ${LCARS.textDim};
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid
    ${({ $isRoot, $depth = 0 }) => toneAlpha(railTone({ $isRoot, $depth }), '52')};

  ${({ $variant }) =>
    $variant === 'boxes' &&
    css`
      color: #061018;
      background: linear-gradient(135deg, ${LCARS.ice}, ${LCARS.cyan});
      border-color: ${toneAlpha(LCARS.ice, 'd8')};
    `}

  ${({ $variant }) =>
    $variant === 'items' &&
    css`
      color: #091027;
      background: linear-gradient(135deg, ${LCARS.lilac}, #8ec6ff);
      border-color: ${toneAlpha(LCARS.lilac, 'd8')};
    `}
`;

const NodeChildren = styled.div`
  margin-left: ${({ $depth = 1 }) => Math.min(Math.max($depth, 1) * 8, 32)}px;
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
  padding-left: 0.24rem;

  @media (max-width: 560px) {
    margin-left: ${({ $depth = 1 }) => Math.min(Math.max($depth, 1) * 5, 14)}px;
    gap: 0.58rem;
    padding-left: 0.12rem;
  }
`;

const OrphanedRevealShell = styled.div`
  display: grid;
  overflow: hidden;
  max-height: ${({ $open }) => ($open ? '2400px' : '0')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: translateY(${({ $open }) => ($open ? '0' : '-8px')});
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition:
    max-height 340ms cubic-bezier(0.2, 0.7, 0.2, 1),
    opacity 240ms ease,
    transform 240ms ease;
  will-change: max-height, opacity, transform;
`;

const EmptyMessage = styled.div`
  ${panelBase};
  padding: 16px;
  color: ${LCARS.textDim};
  border-style: dashed;
  background:
    linear-gradient(90deg, ${toneAlpha(LCARS.coral, '1b')}, transparent 34%),
    ${LCARS.panelAlt};
  text-align: center;
  border-radius: ${radiusL};
`;

const PaginationBar = styled.div`
  ${panelBase};
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.56rem 0.62rem;
  border-color: ${toneAlpha(LCARS.ice, '58')};
  background:
    linear-gradient(90deg, ${toneAlpha(LCARS.ice, '18')}, transparent 55%),
    ${LCARS.panel};
`;

const PaginationButton = styled.button`
  min-height: 34px;
  min-width: 92px;
  border-radius: 9px;
  border: 1px solid ${toneAlpha(LCARS.ice, '78')};
  background: linear-gradient(180deg, rgba(13, 31, 45, 0.95), rgba(10, 24, 36, 0.95));
  color: ${toneAlpha(LCARS.ice, 'ea')};
  font-size: 0.78rem;
  font-weight: 740;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    background 130ms ease,
    opacity 130ms ease;

  &:hover:enabled {
    border-color: ${toneAlpha(LCARS.lime, '86')};
    background: linear-gradient(180deg, rgba(23, 53, 39, 0.95), rgba(14, 34, 25, 0.95));
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const PaginationInfo = styled.div`
  text-align: center;
  color: ${toneAlpha(LCARS.textDim, 'df')};
  font-size: 0.77rem;
  letter-spacing: 0.04em;
`;

export const styledComponents = {
  Container,
  Heading,

  NodeSection,
  RailBack,
  RailFront,

  BoxCard,
  BoxHeader,
  BoxTitle,
  Meta,
  ShortId,

  FieldGroup,
  FieldLabel,
  FieldValue,
  DescriptionValue,
  MobileDescriptionHint,

  TagRow,
  TagBubble,

  BoxFooter,
  StatPill,
  NotesPreviewArea,
  NotesPreviewLabel,
  NotesPreviewText,
  NotesPreviewEmpty,

  NodeChildren,
  OrphanedRevealShell,
  EmptyMessage,
  PaginationBar,
  PaginationButton,
  PaginationInfo,
};
