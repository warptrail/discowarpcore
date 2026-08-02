// src/styles/BoxList.styles.js
import { Link } from 'react-router-dom';
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
const MOBILE_BREAKPOINT_NARROW = '560px';
const MOBILE_RAIL_W = '2px';
const RADIUS = '14px';
const radiusL = '12px';
const railBaseX = '-0.74rem';
const BOX_DEPTH_INDENT_PX = 22;
const BOX_DEPTH_INDENT_MOBILE_PX = 12;

const railTone = ({ $isRoot, $depth = 0 }) =>
  $isRoot ? ROOT_RAIL : BRACKET_COLORS[$depth % BRACKET_COLORS.length];
const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;
const boxTone = `var(--box-primary, ${ROOT_RAIL})`;
const boxToneRgb = 'var(--box-primary-rgb, 127, 215, 255)';
const boxMutedRgb = 'var(--box-muted-rgb, 92, 132, 150)';
const boxToneAlpha = (alpha) => `rgba(${boxToneRgb}, ${alpha})`;
const boxMutedAlpha = (alpha) => `rgba(${boxMutedRgb}, ${alpha})`;
const depthStep = ({ $depth = 0 }) => Math.min(Math.max($depth, 0), 4);
const childIndent = ({ $depth = 1, $mobile = false }) => {
  const depth = Math.max(Number($depth) || 0, 0);
  if (depth < 1 || depth >= 3) return '0px';
  return `${$mobile ? BOX_DEPTH_INDENT_MOBILE_PX : BOX_DEPTH_INDENT_PX}px`;
};
const railTop = ({ $isRoot }) => ($isRoot ? '0.22rem' : '0.3rem');

const mobileRailBaseOffset = ({ $depth = 0 }) => {
  if ($depth >= 3) return '-0.24rem';
  if ($depth >= 1) return '-0.31rem';
  return '-0.4rem';
};

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

const notesPulse = keyframes`
  0%,
  100% {
    opacity: 0.72;
    box-shadow:
      inset 0 0 0 1px ${toneAlpha(LCARS.lilac, '42')},
      0 0 7px ${toneAlpha(LCARS.lilac, '20')};
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    box-shadow:
      inset 0 0 0 1px ${toneAlpha(LCARS.ice, '86')},
      0 0 14px ${toneAlpha(LCARS.ice, '32')};
    transform: translateY(-1px);
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

  @media (max-width: 767px) {
    padding-bottom: ${({ $quickPeekOpen }) =>
      $quickPeekOpen
        ? 'calc(68dvh + env(safe-area-inset-bottom))'
        : 'calc(var(--pad) * 1.8)'};
    transition: padding-bottom 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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
  background: ${boxTone};
  opacity: ${({ $isRoot }) => ($isRoot ? 0.96 : 0.9)};
  filter: drop-shadow(
    0 0 ${({ $isRoot }) => ($isRoot ? '3px' : '2px')}
      ${boxToneAlpha(0.18)}
  );
  pointer-events: none;
  z-index: 0;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    margin-left: ${({ $depth = 0 }) => mobileRailBaseOffset({ $depth })};
    opacity: ${({ $isRoot, $depth = 0 }) => ($isRoot ? 0.94 : $depth >= 2 ? 0.62 : 0.78)};
  }
`;

const RailFront = styled.div`
  grid-area: 1 / 1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  width: auto;
  min-width: 0;
  z-index: 1;
  margin-left: calc(${RAIL_W} + 0.08rem);
  margin-right: ${RAIL_W};
  margin-top: ${({ $isRoot }) => `calc(${railTop({ $isRoot })} + ${RAIL_W})`};
  margin-bottom: ${RAIL_W};
  padding: 0;
  border-radius: ${({ $isRoot, $depth = 0 }) =>
    railInnerCorners({ $isRoot, $depth })};
  background: linear-gradient(
    140deg,
    ${LCARS.bg} 34%,
    rgba(12, 15, 17, 0.95) 68%,
    rgba(12, 15, 17, 0.9) 100%
  );

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    margin-left: calc(${MOBILE_RAIL_W} + 0.02rem);
    margin-right: 1px;
    margin-top: ${({ $isRoot }) => `calc(${railTop({ $isRoot })} + ${MOBILE_RAIL_W})`};
    margin-bottom: ${MOBILE_RAIL_W};
    padding: 0;
  }
`;

const BoxCard = styled.button`
  ${panelBase};
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  isolation: isolate;
  color: inherit;
  font: inherit;
  text-align: left;
  appearance: none;
  cursor: pointer;
  animation: ${breatheIn} 140ms ease both;
  border-color: ${boxToneAlpha(0.25)};
  border-radius: ${({ $isRoot, $depth = 0 }) =>
    railInnerCorners({ $isRoot, $depth })};
  background:
    linear-gradient(
      var(--box-wash-angle, 92deg),
      ${boxToneAlpha(0.08)} 0%,
      transparent 36%
    ),
    ${LCARS.panel};
  transition:
    transform 130ms ease,
    border-color 160ms ease,
    background 160ms ease;

  ${({ $density }) =>
    $density === 'roomy' &&
    css`
      border-radius: 16px;
    `}

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      border-style: dashed;
      border-color: ${boxToneAlpha(0.6)};
      background:
        linear-gradient(
          var(--box-wash-angle, 92deg),
          ${boxToneAlpha(0.14)} 0%,
          transparent 42%
        ),
        ${LCARS.panel};
    `}

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: ${boxTone};
    opacity: ${({ $isRoot }) => ($isRoot ? 0 : 0.28)};
    ${({ $isSystem }) =>
      $isSystem &&
      css`
        background: ${boxTone};
        opacity: 0.42;
      `}

    @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
      width: ${({ $depth = 0 }) => ($depth >= 2 ? '2px' : '3px')};
    }
  }

  &:hover {
    transform: translateY(-1px);
    border-color: ${boxToneAlpha(0.48)};
    background:
      linear-gradient(
        var(--box-wash-angle, 92deg),
        ${boxToneAlpha(0.12)} 0%,
        transparent 42%
      ),
      ${LCARS.panelAlt};

    ${({ $isSystem }) =>
      $isSystem &&
      css`
        border-color: ${boxToneAlpha(0.7)};
        background:
          linear-gradient(
            var(--box-wash-angle, 92deg),
            ${boxToneAlpha(0.17)} 0%,
            transparent 46%
          ),
          ${LCARS.panelAlt};
      `}
  }

  &:focus-visible {
    outline: 2px solid ${boxToneAlpha(0.76)};
    outline-offset: 2px;
  }

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: ${boxToneAlpha(0.88)};
      background:
        linear-gradient(
          var(--box-wash-angle, 92deg),
          ${boxToneAlpha(0.2)} 0%,
          transparent 52%
        ),
        ${LCARS.panelAlt};
      box-shadow:
        inset 0 0 0 1px ${boxToneAlpha(0.34)},
        0 0 22px ${boxToneAlpha(0.18)};
    `}
`;

const BoxHeader = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.58rem;
  padding: 0;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    gap: 0.42rem;
  }
`;

const BoxTitle = styled.div`
  font-weight: 900;
  font-size: ${({ $density }) =>
    $density === 'roomy'
      ? 'clamp(1rem, 1.9vw, 1.12rem)'
      : $density === 'compact'
        ? 'clamp(0.88rem, 1.7vw, 1rem)'
        : 'clamp(0.94rem, 1.8vw, 1.08rem)'};
  color: ${boxTone};
  text-shadow: 0 0 10px ${boxToneAlpha(0.12)};
  ${({ $isSystem }) =>
    $isSystem &&
    css`
      color: ${boxTone};
      text-shadow: 0 0 10px ${boxToneAlpha(0.18)};
    `}
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    font-size: 0.86rem;
  }
`;

const ShortId = styled.span`
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 0.08rem;
  padding: 0.04rem 0.1rem 0.04rem 0;
  border-radius: 0;
  font-family:
    'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo,
    Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-weight: 900;
  font-size: 1rem;
  letter-spacing: 0.08em;
  line-height: 1;
  color: ${boxTone};
  background: transparent;
  border: 0;
  text-shadow: 0 0 10px ${boxToneAlpha(0.16)};

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    font-size: 0.96rem;
  }

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      color: ${boxTone};
    `}
`;

const ShortIdMarker = styled.span`
  font-size: 0.68em;
  line-height: 1;
  opacity: 0.58;
`;

const ShortIdDigits = styled.span`
  font-size: 1.22em;
  line-height: 1;
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

const BoxContextRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 10px 16px 2px;

  @media (max-width: 720px) {
    gap: 0.4rem;
    padding-top: 9px;
  }

  @media (max-width: 560px) {
    gap: 0.36rem;
    padding-top: 8px;
  }
`;

const BoxImageFrame = styled.div`
  position: relative;
  width: 92px;
  min-height: 92px;
  height: 100%;
  align-self: stretch;
  border: 0;
  border-right: 1px solid ${boxToneAlpha(0.22)};
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(8, 12, 15, 0.64), rgba(8, 12, 15, 0.92)),
    #11161a;
  overflow: hidden;
  flex: 0 0 auto;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    width: ${({ $density }) =>
      $density === 'roomy' ? '82px' : $density === 'compact' ? '72px' : '74px'};
    min-height: 92px;
    height: 100%;
    border-radius: 0;
  }
`;

const BoxImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const BoxImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: ${toneAlpha(LCARS.textDim, 'dd')};
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const BoxMetaStack = styled.div`
  display: grid;
  gap: 0.2rem;
  padding: 0.14rem 0 0.14rem;
`;

const BoxMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.36rem 0.62rem;
  min-width: 0;
  padding: 0.12rem 0 0.16rem;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    flex-wrap: nowrap;
    gap: 0.28rem;
    padding: 0.08rem 0 0.1rem;
    overflow: hidden;
  }
`;

const LocationMeta = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.34rem;
  min-width: 0;
  max-width: 100%;
  color: ${toneAlpha(LCARS.cyan, 'f0')};
  font-size: 0.78rem;
  font-weight: 820;
  line-height: 1.2;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    flex: 0 1 auto;
    max-width: 66%;
    font-size: 0.66rem;
  }
`;

const LocationMetaLabel = styled.span`
  flex: 0 0 auto;
  color: ${toneAlpha(LCARS.cyan, 'bf')};
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const LocationMetaValue = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SecondaryMeta = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${toneAlpha(LCARS.textDim, 'd2')};
  font-size: 0.68rem;
  line-height: 1.2;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    flex: 1 1 auto;
    font-size: 0.62rem;
  }
`;

const BoxMetaLine = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.38rem;
  align-items: baseline;
  min-width: 0;
`;

const BoxMetaLabel = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'c9')};
  font-size: 0.58rem;
  font-weight: 820;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 1.1;
`;

const BoxMetaValue = styled.span`
  min-width: 0;
  color: ${toneAlpha(LCARS.text, 'e6')};
  font-size: 0.74rem;
  line-height: 1.22;
  overflow-wrap: anywhere;
`;

const BoxSummary = styled.p`
  margin: 0;
  padding: 0.16rem 0 0.1rem;
  color: ${toneAlpha(LCARS.textDim, 'd8')};
  font-size: 0.72rem;
  line-height: 1.28;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;

  ${({ $density }) =>
    $density === 'compact' &&
    css`
      -webkit-line-clamp: 1;
      font-size: 0.68rem;
    `}

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    max-width: calc(100% - 6.6rem);
    padding-top: 0.02rem;
    font-size: 0.6rem;
    line-height: 1.1;
  }
`;

const MatchSummary = styled.div`
  margin: 0.16rem 0 0.1rem;
  padding: 0.22rem 0.36rem;
  border-left: 2px solid ${LCARS.lime};
  color: ${toneAlpha(LCARS.lime, 'eb')};
  background: ${toneAlpha(LCARS.lime, '0d')};
  font-size: 0.68rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContextChip = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.42rem;
  min-width: 0;
  max-width: 100%;
  border-style: solid;
  border-width: 1px;
  border-radius: 10px;
  padding: ${({ $variant }) =>
    $variant === 'group' ? '0.38rem 0.62rem' : '0.28rem 0.5rem'};
  background: ${({ $variant }) =>
    $variant === 'group'
      ? `linear-gradient(
          106deg,
          ${toneAlpha(LCARS.amber, '3e')} 0%,
          ${toneAlpha(LCARS.coral, '20')} 62%,
          rgba(26, 20, 12, 0.94) 100%
        )`
      : `linear-gradient(
          106deg,
          ${toneAlpha(LCARS.ice, '1f')} 0%,
          ${toneAlpha(LCARS.ice, '12')} 62%,
          rgba(11, 18, 27, 0.92) 100%
        )`};
  border-color: ${({ $variant }) =>
    $variant === 'group'
      ? toneAlpha(LCARS.amber, '96')
      : toneAlpha(LCARS.ice, '7b')};
  box-shadow: ${({ $variant }) =>
    $variant === 'group'
      ? `inset 0 0 0 1px ${toneAlpha(LCARS.amber, '33')},
        0 0 14px ${toneAlpha(LCARS.amber, '2d')}`
      : `inset 0 0 0 1px ${toneAlpha(LCARS.ice, '1f')},
        0 0 10px ${toneAlpha(LCARS.ice, '14')}`};

  @media (max-width: 560px) {
    border-radius: 9px;
    padding: ${({ $variant }) =>
      $variant === 'group' ? '0.32rem 0.52rem' : '0.24rem 0.42rem'};
    gap: 0.34rem;
  }
`;

const ContextChipLabel = styled.span`
  flex: 0 0 auto;
  color: ${toneAlpha(LCARS.textDim, 'd8')};
  font-size: 0.6rem;
  font-weight: 820;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 1.1;
`;

const ContextChipValue = styled.span`
  min-width: 0;
  color: ${toneAlpha(LCARS.text, 'ef')};
  font-size: 0.82rem;
  font-weight: 760;
  letter-spacing: 0.018em;
  line-height: 1.2;
  overflow-wrap: anywhere;

  @media (max-width: 560px) {
    font-size: 0.76rem;
    line-height: 1.18;
  }
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
  align-items: center;
  gap: 0.35rem;
  padding: 0.24rem 0 0.2rem;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    flex-wrap: nowrap;
    gap: 0.3rem;
    max-width: calc(100% - 8.6rem);
    overflow: hidden;
    padding: 0.16rem 0 0;
  }
`;

const TagBubble = styled.span`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0;
  border-radius: 0;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.03em;
  user-select: none;
  color: ${boxMutedAlpha(0.95)};
  background: transparent;
  border: 0;
  text-shadow: 0 0 8px ${boxToneAlpha(0.1)};

  &::before {
    content: '#';
    opacity: 0.46;
    margin-right: 0.12rem;
  }

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    height: 18px;
    font-size: 0.6rem;
    max-width: 4.4rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

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
          border-color: ${boxToneAlpha(0.44)};
          color: ${boxTone};
          background:
            linear-gradient(90deg, ${boxToneAlpha(0.12)} 0%, transparent 74%),
            #121518;
        `}
    `}
`;

const BoxFooter = styled.div`
  display: none;
`;

const CardManifest = styled.div`
  position: absolute;
  right: 0.64rem;
  bottom: 0.42rem;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.28rem;
  max-width: min(58%, 360px);
  color: ${boxTone};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: clamp(1rem, 2.35vw, 1.72rem);
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1;
  opacity: 0.18;
  pointer-events: none;
  text-shadow:
    0 0 14px ${boxToneAlpha(0.19)},
    0 0 2px rgba(230, 237, 243, 0.2);
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    right: 0.62rem;
    bottom: 0.76rem;
    max-width: 48%;
    font-size: 0.68rem;
    opacity: 0.22;
    overflow: hidden;
  }
`;

const CardManifestMuted = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'd0')};
`;

const BoxBodyRow = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  min-width: 0;
  min-height: 92px;
  padding: 0;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    grid-template-columns: 72px minmax(0, 1fr);
    min-height: 92px;
    gap: 0;
    padding: 0;
  }
`;

const BoxContent = styled.div`
  min-width: 0;
  display: grid;
  gap: 0;
  align-content: start;
  padding: 0.48rem 0.58rem 0.52rem 0.72rem;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    padding: 0.4rem 0.48rem 0.44rem 0.5rem;
  }
`;

const NotesSignal = styled.span`
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border: 1px solid ${toneAlpha(LCARS.lilac, '58')};
  border-radius: 5px;
  color: ${toneAlpha(LCARS.lilac, 'ec')};
  background:
    linear-gradient(135deg, ${toneAlpha(LCARS.lilac, '16')}, ${toneAlpha(LCARS.ice, '0e')}),
    rgba(10, 14, 18, 0.82);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.64rem;
  font-weight: 900;
  line-height: 1;
  cursor: inherit;
  animation: ${notesPulse} 2.35s ease-in-out infinite;
  transition:
    border-color 150ms ease,
    color 150ms ease,
    background 150ms ease,
    transform 150ms ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    width: 18px;
    height: 18px;
    font-size: 0.58rem;
  }
`;

const NotesPreviewArea = styled.div`
  display: grid;
  gap: 4px;
  margin: 0.18rem 0 0;
  padding: 0.7rem 0.78rem;
  border-radius: 8px;
  border: 1px solid ${toneAlpha(LCARS.lilac, '3e')};
  background:
    linear-gradient(135deg, ${toneAlpha(LCARS.lilac, '12')}, transparent 62%),
    rgba(8, 12, 16, 0.78);

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    ${({ $density }) =>
      $density === 'compact' &&
      css`
        padding: 0.58rem 0.62rem;
      `}
  }
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

const StatPill = styled.span`
  font-size: 0.64rem;
  font-weight: 900;
  border-radius: 999px;
  padding: 0.18rem 0.48rem;
  line-height: 1.2;
  white-space: nowrap;
  color: ${LCARS.textDim};
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${boxToneAlpha(0.32)};

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
  --box-depth-indent: ${({ $depth = 1 }) => childIndent({ $depth })};
  margin-left: var(--box-depth-indent);
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: ${({ $density }) =>
    $density === 'roomy' ? '0.9rem' : $density === 'compact' ? '0.42rem' : '0.72rem'};
  min-width: 0;
  padding-left: 0;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    --box-depth-indent: ${({ $depth = 1 }) =>
      childIndent({ $depth, $mobile: true })};
    gap: ${({ $density }) =>
      $density === 'roomy' ? '0.68rem' : $density === 'compact' ? '0.34rem' : '0.54rem'};
  }
`;

const NestedChildrenToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  min-height: 44px;
  margin-top: 0.24rem;
  padding: 0.42rem 0.58rem;
  border: 1px solid ${toneAlpha(LCARS.ice, '58')};
  border-radius: 9px;
  color: ${toneAlpha(LCARS.ice, 'e8')};
  background: linear-gradient(90deg, ${toneAlpha(LCARS.ice, '15')}, rgba(9, 18, 27, 0.9));
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${toneAlpha(LCARS.lime, '8a')};
    color: ${toneAlpha(LCARS.lime, 'ed')};
  }
`;

const NestedChildrenIcon = styled.span`
  display: inline-grid;
  place-items: center;
  width: 1.3rem;
  height: 1.3rem;
  border: 1px solid ${toneAlpha(LCARS.ice, '66')};
  border-radius: 6px;
  font-size: 1rem;
  line-height: 1;
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

const TerminalTable = styled.div`
  ${panelBase};
  display: grid;
  gap: 0;
  overflow: hidden;
  border-color: ${toneAlpha(LCARS.ice, '6f')};
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(4, 10, 15, 0.96), rgba(7, 12, 16, 0.98)),
    ${LCARS.bg};
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

const terminalGrid = css`
  display: grid;
  grid-template-columns:
    minmax(230px, 1.55fr)
    minmax(120px, 0.78fr)
    minmax(150px, 1fr)
    minmax(72px, 0.34fr)
    minmax(62px, 0.28fr)
    34px;
  align-items: center;
  gap: 0.42rem;

  @media (max-width: 780px) {
    grid-template-columns: minmax(0, 1fr) 34px;
  }
`;

const TerminalHeader = styled.div`
  ${terminalGrid};
  padding: 0.48rem 0.62rem;
  border-bottom: 1px solid ${toneAlpha(LCARS.ice, '42')};
  background:
    linear-gradient(90deg, ${toneAlpha(LCARS.ice, '22')}, transparent 70%),
    rgba(11, 20, 27, 0.92);
`;

const TerminalHeadCell = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'd5')};
  font-size: 0.66rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;

  @media (max-width: 780px) {
    &:nth-child(n + 2) {
      display: none;
    }
  }
`;

const TerminalBranch = styled.div`
  display: grid;
  min-width: 0;
`;

const TerminalRow = styled.div`
  ${terminalGrid};
  position: relative;
  min-width: 0;
  min-height: 38px;
  padding: 0.34rem 0.62rem;
  border-bottom: 1px solid rgba(127, 215, 255, 0.1);
  background:
    linear-gradient(
      90deg,
      ${boxToneAlpha(0.09)} 0%,
      rgba(255, 255, 255, 0.01) 52%,
      transparent 100%
    ),
    rgba(10, 15, 18, 0.82);
  cursor: pointer;
  transition:
    background 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease;

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      border-bottom-style: dashed;
      background:
        linear-gradient(90deg, ${boxToneAlpha(0.12)}, transparent 70%),
        rgba(9, 18, 20, 0.86);
    `}

  &:hover {
    background:
      linear-gradient(
        90deg,
        ${boxToneAlpha(0.16)} 0%,
        rgba(127, 215, 255, 0.05) 60%,
        transparent 100%
      ),
      rgba(14, 23, 28, 0.94);
    box-shadow: inset 0 0 0 1px ${toneAlpha(LCARS.ice, '2b')};
  }
`;

const TerminalBoxCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
  padding-left: ${({ $depth = 0 }) => `${Math.min($depth, 6) * 18}px`};
`;

const TreeGlyph = styled.span`
  flex: 0 0 auto;
  width: 1.15rem;
  color: ${boxMutedAlpha(0.95)};
  font-size: 0.92rem;
`;

const TerminalShortId = styled.span`
  flex: 0 0 auto;
  color: ${boxTone};
  border: 1px solid ${boxToneAlpha(0.52)};
  border-radius: 999px;
  padding: 0.1rem 0.38rem;
  font-size: 0.7rem;
  font-weight: 900;
  line-height: 1.2;

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      color: ${boxTone};
      border-color: ${boxToneAlpha(0.58)};
    `}
`;

const TerminalTitle = styled.span`
  min-width: 0;
  color: ${toneAlpha(LCARS.text, 'f2')};
  font-size: 0.82rem;
  font-weight: 780;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TerminalCell = styled.span`
  min-width: 0;
  color: ${toneAlpha(LCARS.textDim, 'd4')};
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 780px) {
    display: none;
  }
`;

const TerminalMetric = styled.span`
  color: ${toneAlpha(LCARS.ice, 'e2')};
  font-size: 0.72rem;
  font-weight: 850;
  text-align: right;

  @media (max-width: 780px) {
    display: none;
  }
`;

const TerminalMoreButton = styled.button`
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid ${toneAlpha(LCARS.ice, '66')};
  color: ${toneAlpha(LCARS.ice, 'e2')};
  background: linear-gradient(180deg, rgba(11, 26, 38, 0.94), rgba(7, 16, 24, 0.96));
  font-size: 0.92rem;
  font-weight: 900;
  cursor: pointer;

  &:hover:enabled {
    border-color: ${toneAlpha(LCARS.lime, '8c')};
    color: ${toneAlpha(LCARS.lime, 'f0')};
    box-shadow: 0 0 12px ${toneAlpha(LCARS.lime, '24')};
  }

  &:disabled {
    opacity: 0.34;
    cursor: default;
  }
`;

const TerminalChildrenToggle = styled.button`
  justify-self: stretch;
  min-height: 34px;
  margin: 0.28rem 0.62rem 0.36rem;
  border: 1px solid ${toneAlpha(LCARS.ice, '58')};
  border-radius: 8px;
  color: ${toneAlpha(LCARS.ice, 'e6')};
  background: rgba(10, 23, 33, 0.86);
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    border-color: ${toneAlpha(LCARS.lime, '86')};
    color: ${toneAlpha(LCARS.lime, 'ee')};
  }
`;

const TerminalDetailPanel = styled.div`
  overflow: hidden;
  max-height: ${({ $open }) => ($open ? '260px' : '0')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: translateY(${({ $open }) => ($open ? '0' : '-6px')});
  transition:
    max-height 260ms cubic-bezier(0.2, 0.7, 0.2, 1),
    opacity 180ms ease,
    transform 180ms ease;
`;

const TerminalDetailInner = styled.div`
  display: grid;
  gap: 0.44rem;
  margin: 0.22rem 0.62rem 0.52rem;
  padding: 0.56rem 0.62rem;
  border: 1px solid ${toneAlpha(LCARS.line, 'd8')};
  border-radius: 10px;
  background:
    linear-gradient(90deg, ${toneAlpha(LCARS.ice, '12')}, transparent 64%),
    rgba(7, 13, 18, 0.92);
`;

const TerminalDetailText = styled.p`
  margin: 0;
  color: ${toneAlpha(LCARS.text, 'dc')};
  font-size: 0.74rem;
  line-height: 1.42;
`;

const TerminalDetailNote = styled(TerminalDetailText)`
  white-space: pre-wrap;
`;

const TerminalDetailLabel = styled.span`
  display: block;
  color: ${toneAlpha(LCARS.textDim, 'd0')};
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.18rem;
`;

const TerminalTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`;

const TerminalLink = styled(Link)`
  justify-self: start;
  color: ${toneAlpha(LCARS.lime, 'eb')};
  font-size: 0.72rem;
  font-weight: 820;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;

  &:hover {
    color: ${toneAlpha(LCARS.text, 'f2')};
    text-decoration: underline;
  }
`;

const TerminalChildren = styled.div`
  display: grid;
  min-width: 0;
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
  BoxBodyRow,
  BoxContent,
  CardManifest,
  CardManifestMuted,
  BoxImageFrame,
  BoxImage,
  BoxImagePlaceholder,
  BoxHeader,
  BoxTitle,
  Meta,
  ShortId,
  ShortIdMarker,
  ShortIdDigits,
  BoxMetaStack,
  BoxMetaRow,
  LocationMeta,
  LocationMetaLabel,
  LocationMetaValue,
  SecondaryMeta,
  BoxMetaLine,
  BoxMetaLabel,
  BoxMetaValue,
  BoxSummary,
  MatchSummary,

  FieldGroup,
  FieldLabel,
  FieldValue,
  BoxContextRow,
  ContextChip,
  ContextChipLabel,
  ContextChipValue,
  DescriptionValue,
  MobileDescriptionHint,

  TagRow,
  TagBubble,

  BoxFooter,
  StatPill,
  NotesSignal,
  NotesPreviewArea,
  NotesPreviewLabel,
  NotesPreviewText,

  NodeChildren,
  NestedChildrenToggle,
  NestedChildrenIcon,
  OrphanedRevealShell,
  TerminalTable,
  TerminalHeader,
  TerminalHeadCell,
  TerminalBranch,
  TerminalRow,
  TerminalBoxCell,
  TreeGlyph,
  TerminalShortId,
  TerminalTitle,
  TerminalCell,
  TerminalMetric,
  TerminalMoreButton,
  TerminalChildrenToggle,
  TerminalDetailPanel,
  TerminalDetailInner,
  TerminalDetailText,
  TerminalDetailNote,
  TerminalDetailLabel,
  TerminalTagRow,
  TerminalLink,
  TerminalChildren,
  EmptyMessage,
  PaginationBar,
  PaginationButton,
  PaginationInfo,
};
