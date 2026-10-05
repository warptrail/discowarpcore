import { controlStyles } from './primitives';
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
  bg: 'var(--dw-background)',
  panel: 'var(--dw-surface)',
  panelSoft: 'var(--dw-surface-raised)',
  line: 'rgba(230, 237, 243, 0.12)',
  text: 'var(--dw-text)',
  textDim: 'var(--dw-text-secondary)',
  lilac: 'var(--dw-violet)',
  coral: 'var(--dw-coral)',
  amber: 'var(--dw-amber)',
  teal: 'var(--dw-teal)',
  lime: '#9BE564',
};

const PANEL_RADIUS = 'var(--dw-radius)';
const NODE_RADIUS = 'var(--dw-radius)';
const TERMINAL_CHIP_RADIUS = 'var(--dw-radius-sm)';
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
  padding: 12px 14px;
  min-width: 0;
  border: 1px solid ${LCARS.line};
  border-radius: var(--dw-radius);
  background: ${LCARS.panel};
  box-shadow: inset 3px 0 0 var(--box-primary, #8A8175);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 10px;
    padding: 10px 11px;
    border-radius: var(--dw-radius);
    box-shadow: inset 3px 0 0 var(--box-primary, #8A8175);

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
  height: clamp(180px, 26vw, 280px);
  overflow: hidden;
  border: 1px solid ${LCARS.line};
  border-radius: var(--dw-radius);
  background: ${LCARS.bg};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    height: 190px;
    border-radius: var(--dw-radius);
  }
`;

export const HeroImageBackdrop = styled.img`
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  object-fit: cover;
  opacity: 0.2;
  filter: none;
  visibility: hidden;
  transform: scale(1.04);
`;

export const HeroImageButton = styled.button`
  ${controlStyles}
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 10px;
  border: 0;
  color: var(--box-neon, #edf3ff);
  background: transparent;
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
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  font: 700 0.9rem/1 var(--dw-font-ui);
  backdrop-filter: none;
`;

export const HeroImagePlaceholder = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  isolation: isolate;
  background: var(--dw-background);

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--box-primary, var(--dw-teal));
  }
`;

export const HeroHeaderCard = styled.div`
  position: relative;
  z-index: 2;
  display: grid;
  gap: 12px;
  width: 100%;
  margin: 8px 0 0;
  padding: 14px 16px 15px;
  border: 1px solid ${LCARS.line};
  border-radius: var(--dw-radius);
  background: ${LCARS.panelSoft};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    margin-top: 8px;
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
  color: var(--dw-text-secondary);
  font: 700 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
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

export const MetaPreviewButton = styled.button`
  ${controlStyles}
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: zoom-in;

  &:hover ${MetaPreviewText},
  &:focus-visible ${MetaPreviewText} {
    color: rgba(236, 250, 255, 0.98);
  }

  &:focus-visible {
    outline: 1px solid rgba(var(--box-primary-rgb, 125, 168, 182), 0.72);
    outline-offset: 4px;
  }
`;

export const MetaPreviewHint = styled.span`
  display: block;
  margin-top: 0.34rem;
  color: rgba(var(--box-primary-rgb, 125, 168, 182), 0.92);
  font: 700 0.75rem/1.2 var(--dw-font-ui);
  letter-spacing: 0.01em;
`;

export const IdentityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  position: relative;
  z-index: 2;
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
  color: var(--dw-text-secondary);
  font: 600 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
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
  font: 700 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const IconButton = styled.button`
  ${controlStyles}
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--dw-radius);
  color: var(--dw-text-secondary);
  background: transparent;
  cursor: pointer;
  font: 700 0.9rem/1 var(--dw-font-ui);
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
  color: var(--dw-text-secondary);
  font: 700 0.76rem/1.4 var(--dw-font-ui);
  letter-spacing: 0.01em;
`;

export const ScopeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: ${TERMINAL_CHIP_RADIUS};
  border: 1px solid ${LCARS.line};
  background: ${LCARS.panelSoft};
  color: ${({ $tone }) => toneColor($tone)};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: none;

  &:before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.75;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    padding: 3px 8px;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;

    &:before {
      width: 6px;
      height: 6px;
    }
  }
`;

export const DepthHint = styled.span`
  color: ${LCARS.textDim};
  font-size: 0.76rem;
  letter-spacing: 0.01em;
  text-transform: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

export const EditBoxButton = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--dw-control-height);
  padding: 7px 13px;
  border-radius: var(--dw-radius);
  border: 1px solid rgba(76, 198, 193, 0.35);
  background: ${LCARS.panelSoft};
  color: ${LCARS.text};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
  text-transform: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.045);
  transition: border-color ${FAST}, background ${FAST}, transform ${FAST},
    box-shadow ${FAST};

  &:hover {
    border-color: ${LCARS.teal};
    background: ${LCARS.panelSoft};
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.055),
      0 0 0 2px rgba(76, 198, 193, 0.18);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: var(--dw-control-height);
    padding: 6px 10px;
    border-radius: var(--dw-radius);
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
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
  font-family: var(--dw-font-data);
  font-size: 1.08rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
  padding: 3px 0;
  border-radius: 0;
  color: var(--box-neon, rgba(109, 201, 196, 0.78));
  background: transparent;
  border: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.01em;
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
  font-size: 0.75rem;
  font-weight: 760;
  letter-spacing: 0.01em;
  text-transform: none;
  line-height: 1;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
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
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
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
  font-weight: 700;
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
    color: var(--dw-text-secondary);
    font: 700 0.75rem/1 var(--dw-font-ui);
    letter-spacing: 0.01em;
    text-transform: none;
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
  color: var(--dw-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: none;
  line-height: 1;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
  }
`;

export const CurrentBoxLocationValue = styled.span`
  color: var(--box-location, #7fd7ff);
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.1;
  min-width: 0;
  max-width: min(44vw, 340px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 0.9rem;
    max-width: min(60vw, 240px);
  }
`;

export const BoxIdMono = styled.span`
  font-family: var(--dw-font-data);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
  padding: 3px 6px;
  border-radius: var(--dw-radius);
  color: var(--box-primary, #8A8175);
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
  border-radius: var(--dw-radius);
  background: ${LCARS.panelSoft};
  padding: 11px 13px 12px 15px;

  &:before {
    content: '';
    position: absolute;
    inset: 10px auto 10px 0;
    width: 3px;
    border-radius: 0 999px 999px 0;
    background: ${LCARS.amber};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 7px;
    padding: 10px 11px 11px 13px;
    border-radius: var(--dw-radius);
  }
`;

export const NotesHeader = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

export const NotesLabel = styled.span`
  color: var(--dw-amber);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
  text-transform: none;
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
  font-size: 0.75rem;
  font-weight: 700;
  color: ${LCARS.textDim};
  letter-spacing: 0.01em;
  text-transform: none;

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
  border-radius: var(--dw-radius);
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 10px;
    border-radius: var(--dw-radius);
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
  letter-spacing: 0.01em;
  text-transform: none;
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
  font-family: var(--dw-font-ui);
  color: ${LCARS.textDim};
  font-size: 0.78rem;
  letter-spacing: 0.01em;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.01em;
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
  border-radius: var(--dw-radius);
  color: ${LCARS.text};
  text-decoration: none;
  background: ${LCARS.panelSoft};
  border: 1px solid ${LCARS.line};
  min-width: 0;
  transition: border-color ${FAST}, background ${FAST}, transform ${FAST};

  &:hover {
    border-color: rgba(76, 198, 193, 0.3);
    background: ${LCARS.panelSoft};
    transform: translateY(-1px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 7px;
    padding: 7px 8px;
    border-radius: var(--dw-radius);
  }
`;

export const DescendantLink = styled(BoxLink)`
  flex: 1;
`;

export const DescendantMeta = styled.span`
  color: ${LCARS.textDim};
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  text-transform: none;
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
