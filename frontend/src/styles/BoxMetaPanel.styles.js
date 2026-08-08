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
const TERMINAL_CHIP_RADIUS = '6px';
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
  gap: 10px;
  padding: 18px 14px 12px;
  border: 1px solid rgba(var(--box-primary-rgb, 125, 168, 182), 0.28);
  border-radius: 10px;
  background:
    linear-gradient(
      var(--box-wash-angle, 118deg),
      rgba(var(--box-primary-rgb, 125, 168, 182), 0.09),
      rgba(var(--box-secondary-rgb, 167, 182, 255), 0.035) 46%,
      transparent
    ),
    rgba(15, 20, 27, 0.9);
  box-shadow:
    inset 3px 0 0 rgba(var(--box-primary-rgb, 125, 168, 182), 0.68),
    inset 0 1px rgba(255, 255, 255, 0.035),
    0 10px 24px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 10px;
    padding: 16px 11px 10px;
    border-radius: 8px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.24), 0 6px 12px rgba(0, 0, 0, 0.18);

  }
`;

export const IdentityZone = styled.div`
  display: grid;
  gap: 10px;
`;

export const PresentationHero = styled.div`
  position: relative;
  min-width: 0;
  padding-bottom: 2px;
`;

export const HeroMediaStage = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: clamp(240px, 31vw, 320px);
  overflow: hidden;
  border: 1px solid rgba(var(--box-primary-rgb, 125, 168, 182), 0.25);
  border-radius: 10px;
  background: #0d1318;
  box-shadow: inset 0 0 42px rgba(0, 0, 0, 0.4);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    height: 230px;
    border-radius: 8px;
  }
`;

export const HeroImageBackdrop = styled.img`
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  object-fit: cover;
  opacity: 0.2;
  filter: blur(24px) saturate(1.18);
  transform: scale(1.04);
`;

export const HeroImageButton = styled.button`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 10px 10px 58px;
  border: 0;
  color: var(--box-neon, #edf3ff);
  background: linear-gradient(180deg, transparent 54%, rgba(3, 7, 11, 0.42));
  cursor: zoom-in;

  &:focus-visible {
    outline: 2px solid var(--box-neon, #7fd7ff);
    outline-offset: -3px;
  }
`;

export const HeroImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 15px 24px rgba(0, 0, 0, 0.42));
`;

export const HeroExpandHint = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(var(--box-primary-rgb, 125, 168, 182), 0.42);
  border-radius: 7px;
  background: rgba(5, 10, 16, 0.66);
  font: 800 0.9rem/1 ui-monospace, monospace;
  backdrop-filter: blur(10px);
`;

export const HeroImagePlaceholder = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(
      118% 94% at var(--placeholder-primary-x, 48%) var(--placeholder-primary-y, 34%),
      rgba(var(--box-primary-rgb, 125, 168, 182), 0.3) 0%,
      rgba(var(--box-primary-rgb, 125, 168, 182), 0.13) 34%,
      transparent 70%
    ),
    radial-gradient(
      104% 88% at var(--placeholder-secondary-x, 67%) var(--placeholder-secondary-y, 72%),
      rgba(var(--box-secondary-rgb, 167, 182, 255), 0.21) 0%,
      transparent 68%
    ),
    linear-gradient(
      var(--placeholder-wash-angle, 104deg),
      rgba(8, 13, 19, 0.24),
      rgba(8, 13, 19, 0.82) 78%
    ),
    #0d1318;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.48;
    background:
      linear-gradient(135deg, transparent 36%, rgba(var(--box-primary-rgb, 125, 168, 182), 0.09) 50%, transparent 64%),
      repeating-linear-gradient(0deg, transparent 0 5px, rgba(255, 255, 255, 0.018) 6px 7px);
  }
`;

export const HeroHeaderCard = styled.div`
  position: relative;
  z-index: 2;
  display: grid;
  gap: 12px;
  width: calc(100% - 34px);
  margin: -66px auto 0;
  padding: 14px 16px 15px;
  border: 1px solid rgba(var(--box-primary-rgb, 125, 168, 182), 0.32);
  border-radius: 10px;
  background:
    linear-gradient(112deg, rgba(var(--box-primary-rgb, 125, 168, 182), 0.16), transparent 44%),
    rgba(10, 16, 23, 0.74);
  box-shadow: 0 18px 35px rgba(0, 0, 0, 0.4), inset 0 1px rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(1.14);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: calc(100% - 18px);
    margin-top: -54px;
    padding: 12px;
  }
`;

export const HeroMetadata = styled.div`
  display: grid;
  gap: 11px;
  min-width: 0;
`;

export const MetaPreviewBlock = styled.div`
  min-width: 0;
  overflow: hidden;
`;

export const MetaPreviewLabel = styled.div`
  margin-bottom: 4px;
  color: rgba(184, 202, 212, 0.48);
  font: 700 0.58rem/1 ui-monospace, monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;

export const MetaPreviewText = styled.div`
  display: -webkit-box;
  overflow: hidden;
  color: rgba(226, 235, 240, 0.84);
  font-size: 0.78rem;
  line-height: 1.38;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
`;

export const IdentityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  position: absolute;
  z-index: 2;
  top: 4px;
  left: 8px;
  right: 8px;
  min-height: 24px;
  pointer-events: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-wrap: wrap;
    gap: 6px;
  }
`;

export const RotatingMeta = styled.span`
  margin-right: auto;
  min-width: 0;
  overflow: hidden;
  color: rgba(184, 202, 212, 0.46);
  font: 600 0.68rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.04em;
  white-space: nowrap;
  text-overflow: ellipsis;
  animation: prism-meta 320ms ease;

  @keyframes prism-meta {
    from { opacity: 0; transform: translateY(3px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const IdentityActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
  pointer-events: auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 7px;
    margin-left: auto;
  }
`;

export const IdentityKicker = styled.span`
  color: rgba(121, 222, 216, 0.64);
  font: 700 0.66rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`;

export const IconButton = styled.button`
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: rgba(190, 204, 214, 0.48);
  background: transparent;
  cursor: pointer;
  font: 800 0.9rem/1 ui-monospace, monospace;
  letter-spacing: -0.08em;
  transition: 180ms ease;

  &:hover,
  &:focus-visible {
    color: rgba(226, 237, 242, 0.9);
    background: rgba(120, 170, 182, 0.08);
    outline: 1px solid rgba(120, 170, 182, 0.28);
    outline-offset: 1px;
  }
`;

export const UsefulCount = styled.span`
  color: rgba(231, 236, 243, 0.68);
  font: 700 0.76rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.025em;
`;

export const ScopeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: ${TERMINAL_CHIP_RADIUS};
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

export const EditBoxButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 7px 13px;
  border-radius: 9px;
  border: 1px solid ${LCARS.teal}7a;
  background: linear-gradient(110deg, ${LCARS.teal}2e, ${LCARS.lilac}1f),
    ${LCARS.panelSoft};
  color: ${LCARS.text};
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.045);
  transition: border-color ${FAST}, background ${FAST}, transform ${FAST},
    box-shadow ${FAST};

  &:hover {
    border-color: ${LCARS.teal};
    background: linear-gradient(110deg, ${LCARS.teal}42, ${LCARS.lilac}2b),
      ${LCARS.panelSoft};
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.055),
      0 0 12px ${LCARS.teal}26;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 31px;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.04em;
  }
`;

export const CurrentBox = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  min-width: 0;
  padding: 8px 0 9px;
  border: 0;
  border-bottom: 1px solid rgba(var(--box-primary-rgb, 125, 168, 182), 0.22);
  border-radius: 0;
  color: ${LCARS.text};
  background: transparent;
  box-shadow: none;
  cursor: default;
  margin-top: 2px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 9px;
    padding: 7px 0 8px;
    border-radius: 0;
  }
`;

export const CurrentBoxId = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 1.08rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1;
  padding: 3px 0;
  border-radius: 0;
  color: var(--box-neon, rgba(109, 201, 196, 0.78));
  background: transparent;
  border: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.09em;
    padding: 3px 0;
  }
`;

export const CurrentBoxMain = styled.div`
  min-width: 0;
  display: grid;
  gap: 6px;
  padding-left: 2px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-left: 1px;
  }
`;

export const CurrentBoxInfoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
  }
`;

export const CurrentBoxTagsSection = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
`;

export const CurrentBoxTagsLabel = styled.span`
  color: ${LCARS.textDim};
  font-size: 0.62rem;
  font-weight: 760;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  line-height: 1;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.07em;
  }
`;

export const CurrentBoxTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
`;

export const CurrentBoxTag = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  max-width: 100%;
  padding: 3px 9px;
  border-radius: ${TERMINAL_CHIP_RADIUS};
  border: 1px solid rgba(var(--box-secondary-rgb, 167, 182, 255), 0.4);
  background: rgba(var(--box-secondary-rgb, 167, 182, 255), 0.12);
  color: ${LCARS.text};
  font-size: 0.69rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 20px;
    padding: 3px 8px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const CurrentBoxTitle = styled.span`
  color: var(--box-neon, #edf3ff);
  font-size: clamp(1.05rem, 2.2vw, 1.28rem);
  font-weight: 800;
  letter-spacing: -0.015em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
  }
`;

export const CompactDescription = styled.p`
  margin: 0;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: rgba(231, 236, 243, 0.74);
  font-size: 0.82rem;
  line-height: 1.35;

  &:before {
    content: 'Visual description';
    display: block;
    margin-bottom: 3px;
    color: rgba(231, 236, 243, 0.48);
    font: 700 0.62rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export const CurrentBoxLocationChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  max-width: 100%;
  min-height: 20px;
  padding: 0;
  border-radius: 0;
  border: 0;
  background: transparent;
  color: ${({ $empty }) => ($empty ? LCARS.textDim : '#d7e5ec')};
  box-shadow: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    min-height: 20px;
    padding: 0;
  }
`;

export const CurrentBoxLocationLabel = styled.span`
  color: rgba(184, 202, 212, 0.48);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.07em;
  }
`;

export const CurrentBoxLocationValue = styled.span`
  color: var(--box-muted, #d7e5ec);
  font-size: 0.86rem;
  font-weight: 760;
  letter-spacing: 0.03em;
  line-height: 1.1;
  min-width: 0;
  max-width: min(44vw, 340px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    max-width: min(60vw, 240px);
  }
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

export const MetaZone = styled.div`
  padding: 2px 0;
  border-top: 1px solid ${LCARS.line};
  border-bottom: 1px solid ${LCARS.line};
`;

export const NotesZone = styled.section`
  position: relative;
  display: grid;
  gap: 8px;
  overflow: hidden;
  border: 1px solid rgba(232, 177, 92, 0.38);
  border-radius: 12px;
  background: linear-gradient(
      135deg,
      rgba(232, 177, 92, 0.18),
      rgba(76, 198, 193, 0.08) 54%,
      rgba(167, 182, 255, 0.08)
    ),
    ${LCARS.panelSoft};
  padding: 11px 13px 12px 15px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 12px 26px rgba(0, 0, 0, 0.2);

  &:before {
    content: '';
    position: absolute;
    inset: 10px auto 10px 0;
    width: 3px;
    border-radius: 0 999px 999px 0;
    background: linear-gradient(180deg, ${LCARS.amber}, ${LCARS.teal});
    box-shadow: 0 0 16px rgba(232, 177, 92, 0.34);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 7px;
    padding: 10px 11px 11px 13px;
    border-radius: 10px;
  }
`;

export const NotesHeader = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

export const NotesLabel = styled.span`
  color: #ffe3a8;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1;
  text-transform: uppercase;
`;

export const NotesBody = styled.p`
  margin: 0;
  color: ${LCARS.text};
  font-size: 0.92rem;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
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
  padding: 12px;
  border: 1px solid ${LCARS.line};
  border-radius: 12px;
  background: rgba(14, 15, 18, 0.22);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 10px;
    border-radius: 10px;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 2px;

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
  margin-top: -4px;

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
