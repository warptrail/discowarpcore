// src/styles/BoxList.styles.js
import { Link } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { panelStyles } from './primitives';
import { APP_VISUAL_THEME } from './tokens';

const LCARS = {
  bg: APP_VISUAL_THEME.background,
  panel: APP_VISUAL_THEME.surface,
  panelAlt: APP_VISUAL_THEME.surfaceRaised,
  text: APP_VISUAL_THEME.text,
  textDim: APP_VISUAL_THEME.textSecondary,
  line: APP_VISUAL_THEME.borderSoft,
  coral: APP_VISUAL_THEME.coral,
  teal: APP_VISUAL_THEME.teal,
  lilac: APP_VISUAL_THEME.violet,
  amber: APP_VISUAL_THEME.amber,
  lime: '#9BE564',
  ice: APP_VISUAL_THEME.cyan,
  cyan: APP_VISUAL_THEME.teal,
};

const BRACKET_COLORS = [
  LCARS.coral,
  LCARS.teal,
  LCARS.lilac,
  LCARS.amber,
  LCARS.lime,
];
const ROOT_RAIL = APP_VISUAL_THEME.amber;
const MOBILE_BREAKPOINT_NARROW = '560px';
const RADIUS = 'var(--dw-radius)';
const radiusL = '12px';
const BOX_DEPTH_INDENT_PX = 22;
const BOX_DEPTH_INDENT_MOBILE_PX = 12;

const railTone = ({ $isRoot, $depth = 0 }) =>
  $isRoot ? ROOT_RAIL : BRACKET_COLORS[$depth % BRACKET_COLORS.length];
const toneAlpha = (hex, alpha = 'ff') => `${hex}${alpha}`;
const boxTone = `var(--box-primary, ${ROOT_RAIL})`;
const boxToneRgb = 'var(--box-primary-rgb, 127, 215, 255)';
const boxToneAlpha = (alpha) => `rgba(${boxToneRgb}, ${alpha})`;
const childIndent = ({ $depth = 1, $mobile = false }) => {
  const depth = Math.max(Number($depth) || 0, 0);
  if (depth < 1 || depth >= 3) return '0px';
  return `${$mobile ? BOX_DEPTH_INDENT_MOBILE_PX : BOX_DEPTH_INDENT_PX}px`;
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

const panelBase = css`${panelStyles}`;

const Container = styled.div`
  --pad: clamp(12px, 3vw, 20px);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  max-width: 940px;
  margin: 0 auto;
  padding: calc(var(--pad) * 1.2) var(--pad) calc(var(--pad) * 1.8);
  color: ${LCARS.text};
  border-radius: var(--dw-radius);
  background: var(--dw-surface);

  @media (max-width: 767px) {
    max-width: none;
    padding-inline: clamp(6px, 1.5vw, 10px);
    padding-top: 8px;
    border-radius: 0;
    padding-bottom: ${({ $quickPeekOpen }) =>
      $quickPeekOpen
        ? 'calc(68dvh + env(safe-area-inset-bottom))'
        : 'calc(var(--pad) * 1.8)'};
    transition: padding-bottom 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
  min-width: 0;
  font-family: var(--dw-font-ui);
  & :is(button, a, input, select, textarea):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }
`;

const Heading = styled.h2`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: clamp(20px, 4.2vw, 26px);
  font-weight: 650;
  color: ${LCARS.text};
  margin: 0.4rem 0 0.25rem;
  letter-spacing: normal;

  &::before {
    content: '';
    width: 9px;
    height: 28px;
    border-radius: 8px;
    background: var(--dw-amber);
    box-shadow: none;
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
  transition:
    opacity 180ms ease,
    filter 180ms ease;

  ${({ $ambientQuiet }) =>
    $ambientQuiet &&
    css`
      opacity: 0.74;
      filter: saturate(0.72) brightness(0.9);

      &,
      & *,
      &::before,
      &::after,
      & *::before,
      & *::after {
        animation-play-state: paused !important;
      }
    `}
`;

const RailBack = styled.div`
  grid-area: 1 / 1;
  align-self: stretch;
  width: 4px;
  border-radius: var(--dw-radius-sm) 0 0 var(--dw-radius-sm);
  background: var(--box-primary, #8A8175);
  pointer-events: none;
  z-index: 0;
`;

const RailFront = styled.div`
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

const selectedBoxWisp = keyframes`
  0%, 100% { transform: translate(-6%, 3%) rotate(-12deg) scale(0.95); }
  50% { transform: translate(6%, -3%) rotate(12deg) scale(1.08); }
`;

const BoxCard = styled.button`
  ${panelBase};
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  overflow: clip;
  isolation: isolate;
  color: inherit;
  font: inherit;
  text-align: left;
  appearance: none;
  cursor: pointer;
  animation: ${breatheIn} 140ms ease both;
  border-color: ${boxToneAlpha(0.25)};
  border-radius: var(--dw-radius-sm);
  background-color: var(--dw-surface);
  background-image:
    linear-gradient(110deg, ${boxToneAlpha(0.19)}, ${boxToneAlpha(0.04)} 65%, rgba(var(--box-secondary-rgb, 103, 217, 211), 0.12));
  transition:
    transform 130ms ease,
    border-color 160ms ease,
    background 160ms ease;

  ${({ $density }) =>
    $density === 'roomy' &&
    css`
      border-radius: var(--dw-radius);
    `}

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      border-style: dashed;
      border-color: ${boxToneAlpha(0.6)};
      background: var(--dw-surface);
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

  &::after {
    content: '';
    position: absolute;
    z-index: 0;
    inset: -80% -15%;
    pointer-events: none;
    background:
      radial-gradient(ellipse at 25% 40%, ${boxToneAlpha(0.5)}, transparent 48%),
      radial-gradient(ellipse at 75% 60%, rgba(var(--box-secondary-rgb, 103, 217, 211), 0.38), transparent 50%);
    filter: blur(22px);
    transition: opacity 220ms ease;
    opacity: 0;
    transform-origin: center;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: ${boxToneAlpha(0.48)};
    background-color: var(--dw-surface);

    ${({ $isSystem }) =>
      $isSystem &&
      css`
        border-color: ${boxToneAlpha(0.7)};
        background: var(--dw-surface);
      `}
  }

  &:focus-visible {
    outline: 2px solid ${boxToneAlpha(0.76)};
    outline-offset: 2px;
  }

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: ${boxTone};
      background-color: ${LCARS.panelAlt};
      background-image: linear-gradient(110deg, ${boxToneAlpha(0.3)}, ${boxToneAlpha(0.1)} 65%, rgba(var(--box-secondary-rgb, 103, 217, 211), 0.22));
      box-shadow: inset 0 0 18px ${boxToneAlpha(0.12)}, 0 0 12px ${boxToneAlpha(0.18)};

      &::before {
        background: ${boxTone};
        opacity: 0.8;
      }

      &::after {
        opacity: 0.65;
        animation: ${selectedBoxWisp} 18s ease-in-out infinite;
      }
    `}
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    &::after { animation: none; transition: none; }
  }
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
  font-weight: 650;
  font-size: ${({ $density }) =>
    $density === 'roomy'
      ? 'clamp(1rem, 1.9vw, 1.12rem)'
      : $density === 'compact'
        ? 'clamp(0.88rem, 1.7vw, 1rem)'
        : 'clamp(0.94rem, 1.8vw, 1.08rem)'};
  color: ${boxTone};
  text-shadow: none;
  ${({ $isSystem }) =>
    $isSystem &&
    css`
      color: ${boxTone};
      text-shadow: none;
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
  font-family: var(--dw-font-ui);
  font-weight: 650;
  font-size: 1rem;
  letter-spacing: normal;
  line-height: 1;
  color: ${boxTone};
  background: transparent;
  border: 0;
  text-shadow: none;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    font-size: 0.96rem;
  }

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      color: ${boxTone};
    `}
  font-family: var(--dw-font-data);
`;

const ShortIdMarker = styled.span`
  font-size: 0.68em;
  line-height: 1;
  opacity: 0.58;
`;

const ShortIdDigits = styled.span`
  font-size: 1.22em;
  line-height: 1;
  font-family: var(--dw-font-data);
`;

const Meta = styled.span`
  font-size: 12px;
  color: ${LCARS.textDim};
  padding: 2px 8px;
  border-radius: var(--dw-radius);
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
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
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
  background: var(--dw-surface);
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

const BoxImageTrigger = styled(BoxImageFrame).attrs({
  as: 'button',
  type: 'button',
})`
  padding: 0;
  color: inherit;
  appearance: none;
  cursor: zoom-in;
  transition:
    filter 160ms ease,
    box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    z-index: 2;
    outline: none;
    filter: brightness(1.12) saturate(1.08);
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
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
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: var(--dw-surface);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.48;
    background: var(--dw-surface);
  }
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
  color: var(--box-location, ${LCARS.cyan});
  font-size: clamp(0.82rem, 2vw, 0.94rem);
  font-weight: 650;
  line-height: 1.2;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    flex: 0 1 auto;
    max-width: 66%;
    font-size: 0.78rem;
  }
`;

const LocationMetaLabel = styled.span`
  flex: 0 0 auto;
  color: ${toneAlpha(LCARS.cyan, 'bf')};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
`;

const LocationMetaValue = styled.span`
  color: ${({ $missing }) => ($missing ? '#ff777f' : 'inherit')};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: none;
  text-transform: ${({ $missing }) => ($missing ? 'uppercase' : 'none')};
`;

const SecondaryMeta = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${toneAlpha(LCARS.textDim, 'd2')};
  font-size: 0.75rem;
  line-height: 1.2;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    flex: 1 1 auto;
    font-size: 0.75rem;
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
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  line-height: 1.1;
`;

const BoxMetaValue = styled.span`
  min-width: 0;
  color: ${toneAlpha(LCARS.text, 'e6')};
  font-size: 0.75rem;
  line-height: 1.22;
  overflow-wrap: anywhere;
`;

const BoxSummary = styled.p`
  margin: 0;
  padding: 0.16rem 0 0.1rem;
  color: ${toneAlpha(LCARS.textDim, 'd8')};
  font-size: 0.75rem;
  line-height: 1.28;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;

  ${({ $density }) =>
    $density === 'compact' &&
    css`
      -webkit-line-clamp: 1;
      font-size: 0.75rem;
    `}

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    max-width: calc(100% - 6.6rem);
    padding-top: 0.02rem;
    font-size: 0.75rem;
    line-height: 1.1;
  }
`;

const MatchSummaryLabel = styled.span`
  color: #67d9e8;
  font-family: var(--dw-font-ui);
  font-size: 0.9em;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
`;

const MatchSummary = styled.div`
  margin: 0.16rem 0 0.1rem;
  padding: 0.22rem 0.36rem;
  border-left: 2px solid ${LCARS.lime};
  color: ${toneAlpha(LCARS.lime, 'eb')};
  background: ${toneAlpha(LCARS.lime, '0d')};
  font-size: 0.75rem;
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
  border-radius: var(--dw-radius);
  padding: 0.28rem 0.5rem;
  background: var(--dw-surface-raised);
  border-color: ${toneAlpha(LCARS.ice, '7b')};
  box-shadow: none;

  @media (max-width: 560px) {
    border-radius: 9px;
    padding: 0.24rem 0.42rem;
    gap: 0.34rem;
  }
`;

const ContextChipLabel = styled.span`
  flex: 0 0 auto;
  color: ${toneAlpha(LCARS.textDim, 'd8')};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  line-height: 1.1;
`;

const ContextChipValue = styled.span`
  min-width: 0;
  color: ${toneAlpha(LCARS.text, 'ef')};
  font-size: 0.82rem;
  font-weight: 650;
  letter-spacing: normal;
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
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  user-select: none;
  color: var(--dw-text-secondary);
  background: transparent;
  border: 0;
  text-shadow: none;

  &::before {
    content: '#';
    opacity: 0.46;
    margin-right: 0.12rem;
  }

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    height: 18px;
    font-size: 0.75rem;
    max-width: 4.4rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${({ $tiny, $isRoot, $depth }) =>
    $tiny &&
    css`
      height: 20px;
      font-size: 0.75rem;
      font-weight: 650;
      border-color: ${toneAlpha(railTone({ $isRoot, $depth }), '49')};
      color: ${toneAlpha(LCARS.text, 'b8')};

      ${({ $isSystem }) =>
        $isSystem &&
        css`
          border-color: ${boxToneAlpha(0.44)};
          color: ${boxTone};
          background: var(--dw-surface);
        `}
    `}
`;

const BoxFooter = styled.div`
  display: none;
`;

const CardManifest = styled.div`
  position: absolute;
  right: 0.55rem;
  bottom: 0.42rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 56%;
  padding: 0.16rem 0.3rem;
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  font: 600 0.75rem/1.25 var(--dw-font-ui);
  pointer-events: none;
  white-space: nowrap;
  @media (max-width: 560px) {
    max-width: 48%;
    right: 0.4rem;
    bottom: 0.42rem;
    overflow: hidden;
  }
`;

const CardManifestMuted = styled.span`
  color: var(--dw-text-secondary);
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

const NotesSignal = styled.button`
  padding: 0;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border: 1px solid ${toneAlpha(LCARS.lilac, '58')};
  border-radius: 5px;
  color: ${toneAlpha(LCARS.lilac, 'ec')};
  background: var(--dw-surface);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1;
  cursor: pointer;
  animation: none;
  transition:
    border-color 150ms ease,
    color 150ms ease,
    background 150ms ease,
    transform 150ms ease;

  &:hover,
  &:focus-visible {
    color: ${LCARS.text};
    border-color: ${toneAlpha(LCARS.lilac, 'd8')};
    background: ${toneAlpha(LCARS.lilac, '2b')};
    transform: translateY(-1px);
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    width: 34px;
    height: 34px;
    border-radius: 7px;
    font-size: 0.75rem;
  }
`;

const NotesPreviewArea = styled.div`
  display: grid;
  gap: 4px;
  margin: 0.18rem 0 0;
  padding: 0.7rem 0.78rem;
  border-radius: 8px;
  border: 1px solid ${toneAlpha(LCARS.lilac, '3e')};
  background: var(--dw-surface);

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
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
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
  font-size: 0.75rem;
  font-weight: 650;
  border-radius: var(--dw-radius);
  padding: 0.18rem 0.48rem;
  line-height: 1.2;
  white-space: nowrap;
  color: ${LCARS.textDim};
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${boxToneAlpha(0.32)};

  ${({ $variant }) =>
    $variant === 'boxes' &&
    css`
      color: var(--dw-text);
      background: var(--dw-surface);
      border-color: ${toneAlpha(LCARS.ice, 'd8')};
    `}

  ${({ $variant }) =>
    $variant === 'items' &&
    css`
      color: var(--dw-text);
      background: var(--dw-surface);
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
  background: var(--dw-surface);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
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

const OrphanedRailBack = styled(RailBack)`
  background: var(--box-primary, #8A8175);
  box-shadow: none;
`;

const OrphanedAttentionLink = styled(Link)`
  ${panelBase};
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  overflow: clip;
  isolation: isolate;
  border-color: transparent;
  border-radius: var(--dw-radius-sm);
  color: ${LCARS.text};
  text-align: left;
  appearance: none;
  cursor: pointer;
  background: var(--dw-surface);
  box-shadow: none;
  text-decoration: none;


  &:hover {
    border-color: var(--dw-amber);
    background: var(--dw-surface-raised);
  }

  &:focus-visible {
    outline: 2px solid #7de9ff;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-position: 0 0, 50% 50%;
    transition: none;
  }
`;

const adriftWispOrbit = keyframes`
  0% { transform: translate(-4%, 3%) rotate(0deg) scale(0.92); }
  50% { transform: translate(5%, -5%) rotate(180deg) scale(1.08); }
  100% { transform: translate(-4%, 3%) rotate(360deg) scale(0.92); }
`;

const OrphanedSignal = styled(BoxImageFrame)`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-right: 1px solid rgba(113, 210, 255, 0.15);
  background: var(--dw-surface);

  &::before, &::after {
    content: '';
    position: absolute;
    inset: 12%;
    border-radius: 42% 58% 64% 36%;
    background:
      radial-gradient(ellipse at 28% 35%, rgba(113, 210, 255, 0.75), transparent 55%),
      radial-gradient(ellipse at 70% 62%, rgba(167, 150, 255, 0.65), transparent 58%),
      radial-gradient(ellipse at 40% 75%, rgba(103, 217, 211, 0.5), transparent 50%);
    filter: blur(9px);
    animation: ${adriftWispOrbit} 24s linear infinite;
    pointer-events: none;
  }
  &::after {
    inset: 23% 15%;
    opacity: 0.65;
    filter: blur(5px);
    animation-duration: 32s;
    animation-direction: reverse;
  }
  @media (prefers-reduced-motion: reduce) {
    &::before, &::after { animation: none; }
  }
`;

const OrphanedAttentionCopy = styled(BoxContent)`
  gap: 0.18rem;
`;

const OrphanedAttentionKicker = styled.span`
  overflow: hidden;
  color: rgba(113, 217, 255, 0.8);
  font: 860 0.75rem/1.1 var(--dw-font-ui);
  letter-spacing: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OrphanedAttentionTitle = styled.strong`
  overflow: hidden;
  color: #f1f7ff;
  font-size: clamp(0.98rem, 2.2vw, 1.14rem);
  line-height: 1.1;
  text-overflow: ellipsis;
  text-shadow: none;
  white-space: nowrap;
`;

const OrphanedAttentionMeta = styled.span`
  overflow: hidden;
  color: rgba(224, 234, 245, 0.62);
  font-size: 0.75rem;
  line-height: 1.18;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT_NARROW}) {
    font-size: 0.75rem;
  }
`;

const TerminalTable = styled.div`
  ${panelBase};
  display: grid;
  gap: 0;
  overflow: hidden;
  border-color: ${toneAlpha(LCARS.ice, '6f')};
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  font-family: var(--dw-font-ui);
`;

const terminalGrid = css`
  display: grid;
  grid-template-columns:
    minmax(230px, 1.55fr)
    minmax(120px, 0.78fr)
    minmax(150px, 1fr)
    minmax(72px, 0.34fr)
    minmax(62px, 0.28fr);
  align-items: center;
  gap: 0.42rem;

  @media (max-width: 780px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const TerminalHeader = styled.div`
  ${terminalGrid};
  padding: 0.48rem 0.62rem;
  border-bottom: 1px solid ${toneAlpha(LCARS.ice, '42')};
  background: var(--dw-surface);
`;

const TerminalHeadCell = styled.span`
  color: ${toneAlpha(LCARS.textDim, 'd5')};
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;

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

const TerminalRow = styled.button`
  ${terminalGrid};
  position: relative;
  min-width: 0;
  min-height: var(--dw-control-height);
  width: 100%;
  padding: 0.34rem 0.62rem;
  border: 0;
  border-bottom: 1px solid rgba(127, 215, 255, 0.1);
  background: var(--dw-surface);
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
  transition:
    background 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease;

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      border-bottom-style: dashed;
      background: var(--dw-surface);
    `}

  &:hover {
    background: var(--dw-surface);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 1px solid ${boxToneAlpha(0.74)};
    outline-offset: -2px;
  }
`;

const TerminalBoxCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
  padding-left: ${({ $depth = 0 }) => `${Math.min($depth, 6) * 18}px`};`;

const TreeGlyph = styled.span`
  flex: 0 0 auto;
  width: 1.15rem;
  color: var(--dw-text-secondary);
  font-size: 0.92rem;
  transform: rotate(${({ $expanded }) => ($expanded ? '90deg' : '0deg')});
  transform-origin: center;
  transition: transform 180ms ease, color 180ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const TerminalShortId = styled.span`
  flex: 0 0 auto;
  color: ${boxTone};
  border: 1px solid ${boxToneAlpha(0.52)};
  border-radius: 3px;
  padding: 0.08rem 0.3rem;
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1.2;

  ${({ $isSystem }) =>
    $isSystem &&
    css`
      color: ${boxTone};
      border-color: ${boxToneAlpha(0.58)};
    `}
  font-family: var(--dw-font-data);
`;

const TerminalTitle = styled.span`
  min-width: 0;
  color: ${toneAlpha(LCARS.text, 'f2')};
  font-size: 0.82rem;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TerminalCell = styled.span`
  min-width: 0;
  color: ${toneAlpha(LCARS.textDim, 'd4')};
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 780px) {
    display: none;
  }
`;

const TerminalMetric = styled.span`
  color: ${toneAlpha(LCARS.ice, 'e2')};
  font-size: 0.75rem;
  font-weight: 650;
  text-align: right;

  @media (max-width: 780px) {
    display: none;
  }
`;

const TerminalChildrenToggle = styled.button`
  justify-self: stretch;
  min-height: var(--dw-control-height);
  margin: 0.28rem 0.62rem 0.36rem;
  border: 1px solid ${toneAlpha(LCARS.ice, '58')};
  border-radius: 8px;
  color: ${toneAlpha(LCARS.ice, 'e6')};
  background: var(--dw-surface-raised);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;

  &:hover {
    border-color: ${toneAlpha(LCARS.lime, '86')};
    color: ${toneAlpha(LCARS.lime, 'ee')};
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
  background: var(--dw-surface);
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
  background: var(--dw-surface);

  @media (max-width: 560px) {
    grid-template-columns: 30px minmax(0, 1fr) 30px;
    gap: 2px;
    padding: 2px;
    border-radius: 4px;
    border-color: ${toneAlpha(LCARS.ice, '32')};
    background: var(--dw-surface-raised);
    box-shadow: none;
  }
`;

const PaginationButton = styled.button`
  min-height: var(--dw-control-height);
  min-width: 92px;
  border-radius: 9px;
  border: 1px solid ${toneAlpha(LCARS.ice, '78')};
  background: var(--dw-surface);
  color: ${toneAlpha(LCARS.ice, 'ea')};
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: normal;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    background 130ms ease,
    opacity 130ms ease;

  &:hover:enabled {
    border-color: ${toneAlpha(LCARS.lime, '86')};
    background: var(--dw-surface);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  > span[aria-hidden='true'] {
    display: none;
  }

  @media (max-width: 560px) {
    min-width: 0;
    min-height: var(--dw-control-height);
    padding: 0;
    border: 0;
    border-radius: 2px;
    background: transparent;
    box-shadow: none;
    font: 800 1rem/1 var(--dw-font-ui);

    .pagination-label {
      display: none;
    }

    > span[aria-hidden='true'] {
      display: inline;
    }
  }
`;

const PaginationInfo = styled.div`
  text-align: center;
  color: ${toneAlpha(LCARS.textDim, 'df')};
  font-size: 0.77rem;
  letter-spacing: normal;

  @media (max-width: 560px) {
    font: 760 0.75rem/1 var(--dw-font-ui);
    letter-spacing: normal;
  }
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
  BoxImageTrigger,
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
  MatchSummaryLabel,

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
  OrphanedRailBack,
  OrphanedAttentionLink,
  OrphanedSignal,
  OrphanedAttentionCopy,
  OrphanedAttentionKicker,
  OrphanedAttentionTitle,
  OrphanedAttentionMeta,
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
  TerminalChildrenToggle,
  TerminalChildren,
  EmptyMessage,
  PaginationBar,
  PaginationButton,
  PaginationInfo,
};
