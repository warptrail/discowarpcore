import styled, { css, keyframes } from 'styled-components';
import { QUICK_PEEK_EXIT_DURATION_MS } from './OperationsQuickPeek.motion';
import { APP_VISUAL_THEME } from '../../styles/tokens';

const COLORS = {
  bg: APP_VISUAL_THEME.background,
  panel: APP_VISUAL_THEME.surface,
  panelRaised: APP_VISUAL_THEME.surfaceRaised,
  text: APP_VISUAL_THEME.text,
  dim: APP_VISUAL_THEME.textSecondary,
  accent: 'var(--box-primary, #4cc6c1)',
  secondary: 'var(--box-secondary, #a7b6ff)',
  accentRgb: 'var(--box-primary-rgb, 76, 198, 193)',
  secondaryRgb: 'var(--box-secondary-rgb, 167, 182, 255)',
  line: 'rgba(var(--box-primary-rgb, 76, 198, 193), 0.24)',
};

const slideForward = keyframes`
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideBackward = keyframes`
  from { opacity: 0; transform: translateX(-18px); }
  to { opacity: 1; transform: translateX(0); }
`;

const settle = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const notePaperRise = keyframes`
  from {
    opacity: 0;
    transform: translateY(42px) rotate(-0.8deg) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(-0.25deg) scale(1);
  }
`;

const riseAndDock = keyframes`
  0% {
    opacity: 0.72;
    translate: 0 108%;
  }
  64% {
    opacity: 1;
    translate: 0 -10px;
  }
  80% {
    translate: 0 4px;
  }
  91% {
    translate: 0 -2px;
  }
  100% {
    opacity: 1;
    translate: 0 0;
  }
`;

const undockAndDescend = keyframes`
  0% {
    opacity: 1;
    translate: 0 0;
  }
  14% {
    translate: 0 -6px;
  }
  26% {
    translate: 0 2px;
  }
  100% {
    opacity: 0.68;
    translate: 0 108%;
  }
`;

export const Deck = styled.aside`
  --quick-peek-expanded-height: min(
    82dvh,
    max(0px, calc(100dvh - var(--operations-quick-peek-top, 0px)))
  );
  --quick-peek-collapsed-height: min(54dvh, var(--quick-peek-expanded-height));
  --quick-peek-collapsed-shift: max(
    0px,
    calc(var(--quick-peek-expanded-height) - var(--quick-peek-collapsed-height))
  );
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 180;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 100%;
  height: var(--quick-peek-expanded-height);
  min-height: 0;
  box-sizing: border-box;
  padding-bottom: ${({ $expanded }) => $expanded ? '0' : 'var(--quick-peek-collapsed-shift)'};
  overflow: visible;
  color: ${COLORS.text};
  background:
    radial-gradient(ellipse at 0% 0%, rgba(${COLORS.accentRgb}, 0.16), transparent 65%),
    linear-gradient(145deg, rgba(30, 47, 65, 0.88), rgba(12, 21, 32, 0.96));
  backdrop-filter: blur(22px) saturate(1.25);
  -webkit-backdrop-filter: blur(22px) saturate(1.25);
  border: 1px solid ${COLORS.line};
  border-bottom: 0;
  border-radius: var(--dw-radius);
  box-shadow: 0 -12px 36px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(226, 245, 255, 0.22);
  &, & * {
    scrollbar-width: none !important;
    &::-webkit-scrollbar { display: none; width: 0; height: 0; }
  }
  transform: translateY(
    ${({ $expanded }) => ($expanded ? '0' : 'var(--quick-peek-collapsed-shift)')}
  );
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), padding-bottom 260ms cubic-bezier(0.22, 1, 0.36, 1);
  animation: ${({ $closing }) =>
    $closing
      ? css`${undockAndDescend} ${QUICK_PEEK_EXIT_DURATION_MS}ms cubic-bezier(0.58, 0.02, 0.82, 0.42) both`
      : css`${riseAndDock} 280ms cubic-bezier(0.16, 0.82, 0.24, 1) both`};
  will-change: translate, transform;
  pointer-events: ${({ $closing }) => ($closing ? 'none' : 'auto')};

  &:focus {
    outline: none;
  }

  @media (min-width: 768px) {
    grid-template-rows: ${({ $itemFocused }) => $itemFocused ? 'auto minmax(0, 1fr)' : 'auto auto minmax(0, 1fr)'};
    --quick-peek-expanded-height: auto;
    --quick-peek-collapsed-height: auto;
    --quick-peek-collapsed-shift: 0px;
    top: var(--operations-quick-peek-top, 8.6rem);
    right: 1rem;
    bottom: 1rem;
    left: auto;
    width: min(420px, 38vw);
    height: auto;
    padding-bottom: 0;
    min-height: 0;
    border-bottom: 1px solid ${COLORS.line};
    border-radius: var(--dw-radius);
    box-shadow:
      -18px 12px 48px rgba(0, 0, 0, 0.55),
      0 24px 64px rgba(0, 0, 0, 0.46),
      inset 0 1px 0 rgba(226, 245, 255, 0.25),
      inset 1px 0 0 rgba(226, 245, 255, 0.12);
    transform: none;
    animation: ${settle} 240ms cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
  min-width: 0;
  font-family: var(--dw-font-ui);
  & :is(button, a, input, select, textarea):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
  }
`;

export const DeckCap = styled.header`
  order: 0;
  position: relative;
  isolation: isolate;
  z-index: 8;
  overflow: visible;
  padding: ${({ $expanded }) =>
    $expanded ? '0.55rem 0.18rem 0.42rem' : '0 0.18rem'};
  border-bottom: 1px solid ${COLORS.line};
  border-radius: var(--dw-radius) var(--dw-radius) 0 0;
  background: linear-gradient(180deg, rgba(223, 243, 255, 0.08), rgba(12, 21, 32, 0.48));
  box-shadow: inset 0 1px 0 rgba(226, 245, 255, 0.16), 0 5px 12px rgba(0, 0, 0, 0.16);
  touch-action: none;
  user-select: none;

  @media (min-width: 768px) {
    padding: 0.55rem 0.18rem 0.42rem;
    touch-action: auto;
  }
`;

export const DeckCapArtwork = styled.span`
  display: none;
  position: absolute;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  border-radius: var(--dw-radius);
  background-position: 72% 48%;
  background-size: cover;
  opacity: 0.22;
  filter: saturate(0.72) contrast(1.08) brightness(0.72);
  mix-blend-mode: screen;
  mask-image: linear-gradient(90deg, transparent 0%, black 30%, black 100%);

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    background:
      var(--dw-surface);
  }
`;

export const DetentButton = styled.button`
  position: absolute;
  z-index: 2;
  top: -22px;
  right: 3rem;
  left: 3rem;
  display: grid;
  place-items: center;
  min-height: 44px;
  padding: 0;
  border: 0;
  color: ${COLORS.dim};
  background: transparent;
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
`;

export const DetentHandle = styled.span`
  width: 2.8rem;
  height: 3px;
  border-radius: var(--dw-radius);
  background: ${COLORS.accent};
  opacity: 1;
  box-shadow: none;
`;

export const QuickPeekSearchDock = styled.div`
  position: absolute;
  z-index: 3;
  top: -18px;
  right: 2.7rem;
  left: 2.7rem;
  display: grid;
  grid-template-columns: 1.5rem minmax(0, 1fr) 1.75rem;
  align-items: center;
  height: 36px;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.58);
  border-radius: 6px;
  color: ${COLORS.text};
  background: var(--dw-surface);
  box-shadow: none;
  touch-action: none;
  animation: ${settle} 180ms cubic-bezier(0.22, 1, 0.36, 1);

  &:focus-within {
    border-color: rgba(${COLORS.accentRgb}, 0.88);
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const QuickPeekSearchGlyph = styled.span`
  display: grid;
  place-items: center;
  color: ${COLORS.accent};
  font-family: var(--dw-font-ui);
  font-size: 0.9rem;
  opacity: 0.72;
`;

export const QuickPeekSearchInput = styled.input`
  min-width: 0;
  height: 30px;
  border: 0;
  outline: 0;
  padding: 0 0.2rem;
  color: ${COLORS.text};
  background: transparent;
  font: 700 0.75rem/1.2 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: normal;

  &::placeholder {
    color: ${COLORS.dim};
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
`;

export const QuickPeekSearchClose = styled.button`
  display: grid;
  place-items: center;
  width: 28px;
  height: 32px;
  border: 0;
  padding: 0;
  color: ${COLORS.dim};
  background: transparent;
  font-size: 1rem;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    outline: 0;
  }
`;

export const CapNavigation = styled.div`
  position: relative;
  /* Keep the action popover in the DeckCap stacking context so its own
     z-index can clear the overlapping return/collapse handle. */
  z-index: auto;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 40px;
  align-items: center;
  gap: 0.25rem;
  min-height: 44px;
`;

export const CollapseEdgeButton = styled.button`
  position: absolute;
  z-index: 6;
  top: calc(100% - 1px);
  left: 50%;
  display: grid;
  place-items: center;
  width: 6.5rem;
  height: 30px;
  padding: 0;
  border: 0;
  color: ${({ $itemFocused }) => (
    $itemFocused ? 'rgba(190, 151, 255, 0.8)' : 'rgba(238, 190, 91, 0.62)'
  )};
  background: transparent;
  cursor: pointer;
  transform: translateX(-50%);
  transition: color 180ms ease;
  touch-action: manipulation;

  &:hover,
  &:focus-visible {
    color: ${({ $itemFocused }) => (
      $itemFocused ? 'rgba(226, 205, 255, 0.98)' : 'rgba(255, 211, 116, 0.96)'
    )};
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CollapseEdgeHandle = styled.span`
  width: 3.4rem;
  height: 3px;
  border-radius: var(--dw-radius);
  background: currentColor;
  opacity: 0.82;
  box-shadow: none;
  transition:
    width 180ms ease,
    opacity 180ms ease,
    box-shadow 180ms ease;

  ${CollapseEdgeButton}:hover &,
  ${CollapseEdgeButton}:focus-visible & {
    width: 4.1rem;
    opacity: 1;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CapIconButton = styled.button`
  display: grid;
  place-items: center;
  width: 40px;
  height: 44px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--dw-radius-sm);
  color: ${COLORS.dim};
  background: transparent;
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease;

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  &:hover:not(:disabled) {
    color: ${COLORS.text};
    background: rgba(223, 243, 255, 0.06);
  }
  &:active:not(:disabled) { background: rgba(0, 0, 0, 0.16); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 1px; }
  &:disabled { opacity: 0.25; cursor: default; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

export const CapIdentityStack = styled.div`
  min-width: 0;
  display: grid;
  place-items: center;
  gap: 0.22rem;
`;

export const BoxIdentity = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.18rem;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CapDescription = styled.p`
  width: 100%;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: rgba(230, 237, 243, 0.72);
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1.2;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
  user-select: text;

  @media (max-width: 767px) {
    padding-inline: 0.25rem;
    color: rgba(230, 237, 243, 0.76);
  }
`;

export const CapDescriptionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  gap: 0.32rem;
`;

export const CapNoteButton = styled.button`
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.44);
  border-radius: 4px;
  color: rgba(${COLORS.accentRgb}, 0.96);
  background: var(--dw-surface-raised);
  font: 900 0.75rem var(--dw-font-ui);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(${COLORS.accentRgb}, 0.84);
    color: ${COLORS.text};
    outline: none;
  }
`;

export const BoxTitleLine = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.58rem;
  min-width: 0;
`;

export const BoxId = styled.span`
  color: ${COLORS.accent};
  font-family: var(--dw-font-ui);
  font-size: 1.02rem;
  font-weight: 900;
  letter-spacing: normal;
  font-family: var(--dw-font-data);
`;

export const BoxName = styled.strong`
  min-width: 0;
  overflow: hidden;
  color: ${COLORS.text};
  font-size: 1.08rem;
  line-height: 1.08;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BoxContextLine = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-width: 0;
  color: ${COLORS.dim};
  font-size: 0.75rem;
  line-height: 1.2;
`;

export const BoxLocation = styled.span`
  min-width: 0;
  overflow: hidden;
  color: var(--box-location, rgba(${COLORS.accentRgb}, 0.92));
  font-family: var(--dw-font-ui);
  font-size: 0.78rem;
  font-weight: 860;
  letter-spacing: normal;
  text-overflow: ellipsis;
  text-transform: none;
  white-space: nowrap;
  text-shadow: none;
`;

export const PositionReadout = styled.span`
  flex: 0 0 auto;
  color: rgba(${COLORS.secondaryRgb}, 0.82);
  font-family: var(--dw-font-ui);
  letter-spacing: normal;
`;

export const DeckContent = styled.div`
  order: 2;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: ${({ $expanded, $itemFocused, $photoFocused }) =>
    $itemFocused && !$expanded
      ? 'auto'
      : $itemFocused || $photoFocused
        ? 'hidden'
        : 'auto'};
  overscroll-behavior: contain;
  padding: ${({ $itemFocused, $photoFocused }) =>
    $photoFocused ? '0.45rem 0.6rem 0.4rem' : $itemFocused ? '0.45rem 0.72rem 0.25rem' : '0.55rem 0.78rem 0.4rem'};
  ${({ $itemFocused, $photoFocused }) =>
    ($itemFocused || $photoFocused) &&
    css`
      height: auto;
      block-size: auto;
    `}
  animation: ${({ $direction }) =>
    $direction > 0
      ? css`${slideForward} 250ms cubic-bezier(0.22, 1, 0.36, 1)`
      : $direction < 0
        ? css`${slideBackward} 250ms cubic-bezier(0.22, 1, 0.36, 1)`
      : css`${settle} 220ms cubic-bezier(0.22, 1, 0.36, 1)`};

  @media (min-width: 768px) {
    block-size: auto;
    height: auto;
  }

  @media (max-width: 767px) {
    ${({ $expanded, $itemFocused }) =>
      $itemFocused && !$expanded &&
      css`
        max-height: calc(
          var(--quick-peek-expanded-height) -
          var(--quick-peek-collapsed-shift) -
          3.15rem
        );
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(${COLORS.accentRgb}, 0.4) transparent;
      `}
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const BoxPhotoView = styled.section`
  width: 100%;
  height: 100%;
  min-height: 0;
`;

export const BoxPhotoStage = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.34);
  border-radius: 8px;
  background: var(--dw-surface);
  box-shadow: none;
`;

export const BoxPhotoBackdrop = styled.img`
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  object-fit: cover;
  opacity: 0.16;
  filter: blur(22px) saturate(1.2);
  transform: scale(1.04);
  pointer-events: none;
`;

export const BoxPhotoImageButton = styled.button`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 0.45rem;
  border: 0;
  color: ${COLORS.text};
  background: transparent;
  cursor: zoom-in;

  &:focus-visible {
    outline: 2px solid ${COLORS.accent};
    outline-offset: -3px;
  }
`;

export const BoxPhotoImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: contain;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.5));
`;

export const BoxPhotoExpandHint = styled.span`
  position: absolute;
  right: 0.55rem;
  bottom: 0.55rem;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.48);
  border-radius: 6px;
  background: var(--dw-surface-raised);

  svg {
    width: 15px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }
`;

export const BoxPhotoItemsButton = styled.button`
  position: absolute;
  z-index: 3;
  top: 0.55rem;
  left: 0.55rem;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(${COLORS.secondaryRgb}, 0.62);
  border-radius: 6px;
  color: ${COLORS.accent};
  background: var(--dw-surface);
  cursor: pointer;
  box-shadow: none;

  svg {
    width: 19px;
    height: 19px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  &:hover,
  &:focus-visible {
    outline: none;
    color: ${COLORS.text};
    border-color: ${COLORS.accent};
    box-shadow: none;
  }
`;

export const BoxPhotoFallback = styled.div`
  color: ${COLORS.dim};
  font: 800 0.7rem/1.3 'SFMono-Regular', var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
`;

export const BoxSnapshot = styled.div`
  padding: ${({ $notesEmphasized }) =>
    $notesEmphasized ? '0.38rem 0.52rem 0.42rem' : '0 0 0.55rem'};
  margin: ${({ $notesEmphasized }) =>
    $notesEmphasized ? '0 0 0.38rem' : '0'};
  border-left: ${({ $notesEmphasized }) =>
    $notesEmphasized
      ? `3px solid rgba(${COLORS.accentRgb}, 0.9)`
      : '0'};
  background: ${({ $notesEmphasized }) =>
    $notesEmphasized
      ? 'var(--dw-surface-raised)'
      : 'transparent'};
  box-shadow: none;
`;

export const BoxSnapshotText = styled.div`
  min-width: 0;
  display: grid;
  gap: ${({ $notesEmphasized }) =>
    $notesEmphasized ? '0.22rem' : '0.42rem'};
`;

export const BoxNotes = styled.p`
  margin: 0;
  color: ${({ $emphasized }) => ($emphasized ? COLORS.text : COLORS.dim)};
  font-size: ${({ $emphasized }) => ($emphasized ? '0.82rem' : '0.72rem')};
  line-height: ${({ $emphasized }) => ($emphasized ? '1.45' : '1.35')};
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${({ $emphasized }) => ($emphasized ? 5 : 2)};
  overflow: hidden;
`;

export const BoxNotesButton = styled.button`
  display: block;
  width: 100%;
  min-height: 2.8rem;
  margin: 0;
  padding: 0;
  overflow: hidden;
  color: ${({ $emphasized }) => ($emphasized ? COLORS.text : COLORS.dim)};
  background: transparent;
  border: 0;
  font: inherit;
  font-size: ${({ $emphasized }) => ($emphasized ? '0.82rem' : '0.72rem')};
  line-height: ${({ $emphasized }) => ($emphasized ? '1.45' : '1.35')};
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    outline: none;
  }
`;

export const MetaLabel = styled.span`
  display: block;
  margin-bottom: 0.12rem;
  color: ${({ $emphasized }) =>
    $emphasized
      ? `rgba(${COLORS.accentRgb}, 0.98)`
      : `rgba(${COLORS.secondaryRgb}, 0.8)`};
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: normal;
  text-transform: none;
`;

export const TagLine = styled.div`
  display: flex;
  gap: 0.4rem;
  min-width: 0;
  overflow: hidden;
  color: rgba(${COLORS.accentRgb}, 0.78);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  white-space: nowrap;
`;

export const NoteFocusStage = styled.section`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.48rem;
  min-height: 100%;
`;

export const NoteFocusToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 44px;
`;

export const NoteItemsReturn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 44px;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.24);
  border-radius: 5px 10px 5px 5px;
  padding: 0 0.72rem;
  color: rgba(230, 237, 243, 0.72);
  background: var(--dw-surface-raised);
  font: 800 0.75rem var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;

  span:last-child {
    color: ${COLORS.accent};
    font-size: 1rem;
    line-height: 1;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(${COLORS.accentRgb}, 0.72);
    color: ${COLORS.text};
    background: rgba(${COLORS.accentRgb}, 0.1);
    outline: none;
  }
`;

export const NotePaper = styled.button`
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0.7rem;
  width: calc(100% - 0.3rem);
  min-height: clamp(190px, 34dvh, 310px);
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.42);
  border-radius: 3px 10px 5px 3px;
  padding: 1rem 1rem 0.82rem 1.42rem;
  color: var(--box-neon, ${COLORS.text});
  background: var(--dw-surface);
  box-shadow: none;
  text-align: left;
  cursor: pointer;
  transform-origin: 50% 100%;
  animation: ${notePaperRise} 430ms cubic-bezier(0.16, 0.82, 0.24, 1) both;

  &::before {
    position: absolute;
    z-index: 1;
    inset: 0 auto 0 0;
    width: 7px;
    background: var(--dw-surface);
    box-shadow: none;
    content: '';
  }

  &::after {
    position: absolute;
    z-index: 0;
    inset: 0 auto 0 2.02rem;
    width: 1px;
    background: rgba(${COLORS.accentRgb}, 0.24);
    box-shadow: none;
    content: '';
    pointer-events: none;
  }

  > span {
    position: relative;
    z-index: 2;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(${COLORS.accentRgb}, 0.72);
    outline: none;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
  }
`;

export const NotePaperKicker = styled.span`
  color: rgba(${COLORS.secondaryRgb}, 0.86);
  font: 900 0.75rem var(--dw-font-ui);
  letter-spacing: normal;
  text-shadow: none;
  text-transform: none;
`;

export const NotePaperBody = styled.span`
  align-self: start;
  color: var(--box-neon, ${COLORS.text});
  font-size: clamp(0.96rem, 3.6vw, 1.08rem);
  font-weight: 720;
  line-height: 1.78;
  overflow-wrap: anywhere;
  text-shadow: none;
  white-space: pre-wrap;
`;

export const NotePaperHint = styled.span`
  justify-self: end;
  color: rgba(${COLORS.accentRgb}, 0.76);
  font: 800 0.75rem var(--dw-font-ui);
  letter-spacing: normal;
  text-shadow: none;
  text-transform: none;
`;

export const ItemsHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.52rem 0 0.4rem;
  border-top: 1px solid ${COLORS.line};
  color: ${COLORS.accent};
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: normal;
  text-transform: none;
`;

export const ItemsCount = styled.span`
  color: ${COLORS.dim};
  font-size: 0.75rem;
`;

export const ItemsHeaderMeta = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.42rem;
  min-width: 0;
`;

export const ItemSortButton = styled.button`
  flex: 0 0 2.35rem;
  width: 2.35rem;
  height: 1.55rem;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.34);
  border-radius: 6px;
  color: rgba(${COLORS.accentRgb}, 0.86);
  background: rgba(${COLORS.accentRgb}, 0.08);
  font: 800 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(${COLORS.accentRgb}, 0.84);
    background: rgba(${COLORS.accentRgb}, 0.16);
    box-shadow: none;
    outline: none;
  }
`;

export const ItemList = styled.ul`
  display: grid;
  gap: 1px;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid rgba(${COLORS.accentRgb}, 0.12);
`;

export const ItemRow = styled.li`
  position: relative;
  border-bottom: 1px solid rgba(${COLORS.accentRgb}, 0.12);
`;

export const ItemMatchLabel = styled.span`
  color: #b5f36b;
  font-weight: 700;
`;

export const ItemRowButton = styled.button`
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.14rem 0.65rem;
  width: 100%;
  min-height: 46px;
  padding: 0.42rem 0.1rem;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;

  ${({ $matched }) => $matched && `
    background: rgba(163, 230, 53, 0.13);
    box-shadow: none;
    padding-left: 0.5rem;
  `}

  &:hover,
  &:focus-visible {
    outline: none;
    background: var(--dw-surface);
    box-shadow: none;
  }
`;

export const ItemThumbnail = styled.img`
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 30px;
  height: 30px;
  object-fit: cover;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.3);
  border-radius: 4px;
  background: var(--dw-surface);
`;

export const ItemThumbnailFallback = styled.span`
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.12);
  border-radius: 4px;
  background: var(--dw-surface);
`;

export const ItemName = styled.strong`
  grid-column: 2;
  min-width: 0;
  overflow: hidden;
  color: rgba(230, 237, 243, 0.9);
  font-size: 0.78rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemCategory = styled.span`
  grid-column: 2;
  min-width: 0;
  overflow: hidden;
  color: ${COLORS.dim};
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemQuantity = styled.code`
  grid-column: 3;
  grid-row: 1 / span 2;
  color: ${COLORS.secondary};
  font-size: 0.75rem;
  letter-spacing: normal;
`;

export const EmptyItems = styled.p`
  margin: 0.35rem 0 0.8rem;
  padding: 0.8rem;
  color: ${COLORS.dim};
  border: 1px dashed rgba(${COLORS.accentRgb}, 0.24);
  border-radius: 7px;
  font-size: 0.76rem;
  text-align: center;
`;

export const ItemCarousel = styled.section`
  min-width: 0;
  height: 100%;
  touch-action: pan-y;
  animation: ${({ $direction }) =>
    $direction > 0
      ? css`${slideForward} 250ms cubic-bezier(0.22, 1, 0.36, 1)`
      : $direction < 0
        ? css`${slideBackward} 250ms cubic-bezier(0.22, 1, 0.36, 1)`
        : css`${settle} 220ms cubic-bezier(0.22, 1, 0.36, 1)`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const ItemCarouselCard = styled.div`
  position: relative;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.34);
  border-radius: 8px;
  background: var(--dw-surface);
  box-shadow: none;

  @media (min-width: 768px) {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
  }

  @media (max-width: 767px) {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
  }
`;

export const ItemCarouselMedia = styled.div`
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--dw-surface);
  cursor: ${({ $interactive }) => ($interactive ? 'zoom-in' : 'default')};

  &:focus-visible {
    outline: 2px solid rgba(${COLORS.accentRgb}, 0.9);
    outline-offset: -3px;
  }

  &::after {
    content: '';
    position: absolute;
    z-index: 1;
    inset: 0;
    pointer-events: none;
    background:
      var(--dw-surface);
  }
`;

export const ItemCarouselLightboxTrigger = styled.button`
  position: absolute;
  z-index: 3;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: inherit;
  background: transparent;
  cursor: zoom-in;
  touch-action: pan-y;

  &:focus-visible {
    outline: 2px solid rgba(${COLORS.accentRgb}, 0.9);
    outline-offset: -4px;
  }
`;

export const ItemCarouselArrow = styled.button`
  position: absolute;
  z-index: 4;
  bottom: 0.25rem;
  ${({ $side }) => ($side === 'previous' ? 'left: 0.35rem;' : 'right: 0.35rem;')}
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: ${COLORS.accent};
  background: transparent;
  text-shadow: none;
  font-family: var(--dw-font-ui);
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    outline: none;
    background: transparent;
  }

  &:focus-visible { outline: 1px dashed currentColor; outline-offset: -5px; }

  &:disabled {
    opacity: 0.18;
    cursor: default;
  }
`;

export const ItemCarouselReturn = styled.button`
  position: absolute;
  z-index: 4;
  top: 0.42rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  justify-self: center;
  min-width: 76px;
  min-height: 40px;
  padding: 0 0.68rem;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.22);
  border-radius: 5px;
  color: rgba(230, 237, 243, 0.78);
  background: var(--dw-surface-raised);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    outline: none;
  }
`;

export const ItemListIcon = styled.svg`
  width: 16px;
  height: 16px;
  fill: none;
  stroke: ${COLORS.accent};
  stroke-width: 1.8;
  stroke-linecap: round;
`;

export const ItemCarouselPosition = styled.code`
  color: rgba(${COLORS.secondaryRgb}, 0.82);
  font-size: 0.75rem;
  letter-spacing: normal;
`;

export const ItemCarouselDeckToggle = styled.button`
  position: absolute;
  z-index: 5;
  top: 0.66rem;
  left: calc(50% + 54px);
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  border: 1px solid ${({ $active }) => (
    $active ? 'rgba(240, 138, 123, 0.88)' : `rgba(${COLORS.accentRgb}, 0.34)`
  )};
  border-radius: 5px;
  color: ${({ $active }) => ($active ? '#ff9d91' : `rgba(${COLORS.accentRgb}, 0.88)`)};
  background: ${({ $active }) => (
    $active ? 'rgba(118, 39, 35, 0.76)' : 'rgba(5, 10, 15, 0.78)'
  )};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    filter: brightness(1.22);
  }

  &:focus-visible {
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
`;

export const ItemCarouselActionRail = styled.div`
  position: absolute;
  z-index: 5;
  top: 0.42rem;
  right: 0.42rem;
  display: grid;
  grid-template-columns: repeat(3, 46px);
  gap: 0.22rem;
`;

export const ItemHeaderActionPanel = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${({ $editable }) => $editable ? 4 : 3}, max-content);
  gap: 0.22rem;
  align-items: center;
  justify-content: center;
  min-width: 0;

  ${({ $positionOnly }) => $positionOnly && css`
    grid-template-columns: 46px;
  `}

  ${({ $body }) => $body && css`
    display: contents;
    position: static;

    button {
      width: 100%;
      min-width: 0;
      font-size: 0.75rem;
    }
  `}

  @media (max-width: 460px) {
    grid-template-columns: ${({ $positionOnly, $editable }) => ($positionOnly ? '42px' : `repeat(${$editable ? 4 : 3}, max-content)`)};

    button {
      width: 42px;
      font-size: 0.75rem;
    }
  }
`;

export const ItemCarouselActionButton = styled.button`
  display: inline-grid;
  width: 46px;
  height: 30px;
  place-items: center;
  padding: 0;
  border: 1px solid ${({ $active, $tone }) => (
    $active && $tone === 'declutter'
      ? 'rgba(240, 138, 123, 0.88)'
      : $active && $tone === 'consumable'
        ? 'rgba(255, 195, 87, 0.88)'
        : $tone === 'consumable'
          ? 'rgba(220, 161, 75, 0.64)'
        : $tone === 'position'
          ? 'rgba(var(--box-secondary-rgb, 167, 182, 255), 0.78)'
        : $tone === 'note'
          ? 'rgba(220, 143, 255, 0.72)'
          : `rgba(${COLORS.accentRgb}, 0.34)`
  )};
  border-radius: 5px;
  color: ${({ $active, $tone }) => (
    $active && $tone === 'declutter'
      ? '#ff9d91'
      : $active && $tone === 'consumable'
        ? '#ffd26e'
        : $tone === 'consumable'
          ? '#e8b765'
        : $tone === 'position'
          ? 'var(--box-secondary, #a7b6ff)'
        : $tone === 'note'
          ? '#e8b5ff'
          : `rgba(${COLORS.accentRgb}, 0.88)`
  )};
  background: ${({ $active, $tone }) => (
    $active && $tone === 'declutter'
      ? 'rgba(118, 39, 35, 0.76)'
      : $active && $tone === 'consumable'
        ? 'rgba(106, 78, 22, 0.76)'
        : $tone === 'consumable'
          ? 'rgba(70, 48, 18, 0.7)'
        : $tone === 'position'
          ? 'rgba(var(--box-secondary-rgb, 167, 182, 255), 0.16)'
        : $tone === 'note'
          ? 'rgba(76, 37, 104, 0.76)'
          : 'rgba(5, 10, 15, 0.78)'
  )};
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: normal;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    filter: brightness(1.22);
  }

  &:focus-visible {
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
`;

export const ItemActionsToggle = styled(ItemCarouselActionButton)`
  && {
    width: 42px;
    transition:
      border-color 150ms ease,
      color 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease,
      filter 150ms ease;
  }

  ${({ $active }) => $active && css`
    && {
      border-color: rgba(var(--box-secondary-rgb, 167, 182, 255), 0.98);
      color: #f5fbff;
      background:
        var(--dw-surface);
      box-shadow: none;
      filter: brightness(1.22) saturate(1.18);
    }

    circle {
      fill: currentColor;
      stroke-width: 0;
    }
  `}

  @media (max-width: 460px) {
    && {
      width: 42px;
    }
  }
`;

export const ActionMenuIcon = styled.svg`
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.35;
  stroke-linecap: round;
`;

export const ItemHeaderOpenFullButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 42px;
  height: 30px;
  padding: 0 0.28rem;
  border: 1px solid rgba(${COLORS.secondaryRgb}, 0.58);
  border-radius: 5px;
  color: ${COLORS.text};
  background: var(--dw-surface);
  font: 600 0.75rem/1.25 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover,
  &:focus-visible {
    border-color: ${COLORS.accent};
    outline: none;
    box-shadow: none;
  }
`;

export const ItemActionPopover = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.42rem);
  left: 50%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: min(290px, calc(100vw - 48px));
  max-height: min(440px, 48dvh);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--box-primary, #4cc6c1) #080e14;
  gap: 0.24rem;
  padding: 0.38rem;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.48);
  border-radius: 7px;
  background: var(--dw-surface);
  box-shadow: none;
  transform: translateX(-50%);

  &::before {
    position: absolute;
    top: -5px;
    left: 50%;
    width: 9px;
    height: 9px;
    border-top: 1px solid rgba(${COLORS.accentRgb}, 0.48);
    border-left: 1px solid rgba(${COLORS.accentRgb}, 0.48);
    background: var(--dw-surface);
    content: '';
    transform: translateX(-50%) rotate(45deg);
  }

  @media (max-width: 460px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ItemNoteSheet = styled.section`
  position: absolute;
  z-index: 14;
  top: calc(100% + 0.42rem);
  left: 50%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.35rem;
  width: min(360px, calc(100vw - 1rem));
  max-height: min(58dvh, 430px);
  padding: 0.42rem;
  overflow-y: auto;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.5);
  border-radius: 8px;
  background: var(--dw-surface);
  box-shadow: none;
  transform: translateX(-50%);
  scrollbar-width: thin;
  scrollbar-color: rgba(${COLORS.accentRgb}, 0.44) transparent;

  ${NoteFocusToolbar} {
    min-height: var(--dw-control-height);
  }

  ${NoteItemsReturn} {
    min-height: var(--dw-control-height);
    padding: 0 0.52rem;
    border-radius: 5px 8px 5px 5px;
    font-size: 0.75rem;
  }

  ${NotePaper} {
    width: 100%;
    min-height: 190px;
    padding: 0.78rem 0.72rem 0.68rem 1.08rem;
  }

  @media (max-width: 460px) {
    width: calc(100vw - 0.8rem);
  }
`;

export const ItemDeckIcon = styled.svg`
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

export const ItemCarouselBody = styled.div`
  position: absolute;
  z-index: 3;
  right: 0;
  bottom: 0;
  left: 0;
  min-width: 0;
  max-height: 64%;
  overflow: hidden;
  pointer-events: none;
  padding: 2.5rem 0.82rem 0.62rem;
  background: var(--dw-surface);

  @media (min-width: 768px) {
    position: static;
    align-self: stretch;
    min-height: 0;
    max-height: none;
    overflow-x: hidden;
    overflow-y: hidden;
    pointer-events: auto;
    padding: 0.78rem 0.9rem 1rem;
    border-top: 1px solid rgba(${COLORS.accentRgb}, 0.22);
    background: var(--dw-surface);
    scrollbar-width: thin;
    scrollbar-color: rgba(${COLORS.accentRgb}, 0.4) transparent;
  }

  @media (max-width: 767px) {
    position: static;
    max-height: none;
    overflow-x: hidden;
    overflow-y: hidden;
    pointer-events: auto;
    padding: 0.62rem 0.72rem 0.28rem;
    background: var(--dw-surface);
    scrollbar-width: thin;
    scrollbar-color: rgba(${COLORS.accentRgb}, 0.4) transparent;
    scroll-padding-bottom: 2.25rem;
  }
`;

export const ItemCarouselImage = styled.img`
  position: absolute;
  z-index: 2;
  inset: 0;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  padding: ${({ $framing }) =>
    $framing === 'portrait' ? '1.05rem 3.15rem 0.6rem' : '0'};
  object-fit: ${({ $framing }) =>
    $framing === 'portrait' ? 'contain' : 'cover'};
  object-position: ${({ $framing }) => {
    if ($framing === 'landscape') return 'center 64%';
    if ($framing === 'portrait') return 'center 38%';
    return 'center 70%';
  }};
  filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.46));
  transition: object-position 180ms ease;

  @media (min-width: 1100px) {
    padding: 1rem 1.2rem;
    object-fit: contain;
    object-position: center;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ItemCarouselImageBackdrop = styled.img`
  position: absolute;
  z-index: 0;
  inset: -8%;
  width: 116%;
  height: 116%;
  object-fit: cover;
  opacity: 0.22;
  filter: blur(18px) saturate(0.8) brightness(0.72);
  transform: scale(1.06);
`;

export const ItemCarouselImageFallback = styled.div`
  display: grid;
  place-items: center;
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  color: rgba(230, 237, 243, 0.3);
  background: var(--dw-surface);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  letter-spacing: normal;
`;

export const ItemCarouselIdentity = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.3rem;
  padding-bottom: 0.42rem;
  border-bottom: 1px solid ${COLORS.line};
`;

export const ItemCarouselName = styled.h3`
  button { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
  margin: 0;
  color: ${COLORS.text};
  font-size: clamp(1rem, 4.8vw, 1.35rem);
  line-height: 1.08;
  overflow-wrap: anywhere;
`;

export const ItemCarouselMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.6rem;
  align-items: center;
  color: ${COLORS.dim};
  font-size: 0.75rem;

  code {
    color: ${COLORS.secondary};
    font-size: 0.75rem;
    letter-spacing: normal;
  }
`;

export const ItemCarouselDetails = styled.div`
  display: grid;
  gap: 0;
`;

export const ItemCarouselDetail = styled.div`
  padding: 0.38rem 0;
  border-bottom: 1px solid rgba(${COLORS.accentRgb}, 0.12);

  p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: rgba(230, 237, 243, 0.8);
    font-size: 0.75rem;
    line-height: 1.32;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  &:nth-of-type(n + 2) p {
    -webkit-line-clamp: 2;
  }
`;

export const ItemCarouselAnnotationLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
  min-width: 0;
`;

export const ItemCarouselDescription = styled.p`
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.32;
  button { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
  cursor: text;

  @media (max-width: 767px) {
    -webkit-line-clamp: 2;
  }
`;

export const ItemCarouselNoteButton = styled.button`
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid rgba(220, 143, 255, 0.72);
  border-radius: 4px;
  color: #e8b5ff;
  background: rgba(76, 37, 104, 0.76);
  font: 900 0.75rem var(--dw-font-ui);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: #f0caff;
    color: ${COLORS.text};
    outline: none;
    box-shadow: none;
  }
`;

export const ItemCarouselCategoryLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
`;

export const ItemCarouselCategoryValue = styled.p`
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: rgba(230, 237, 243, 0.8);
  font-size: 0.75rem;
  line-height: 1.32;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemCarouselDeckButton = styled.button`
  flex: 0 0 auto;
  margin-left: auto;
  min-height: var(--dw-control-height);
  padding: 0.1rem 0.42rem;
  border: 1px solid ${({ $active }) => (
    $active ? 'rgba(240, 138, 123, 0.88)' : `rgba(${COLORS.accentRgb}, 0.44)`
  )};
  border-radius: 4px;
  color: ${({ $active }) => ($active ? '#ff9d91' : `rgba(${COLORS.accentRgb}, 0.92)`)};
  background: ${({ $active }) => (
    $active ? 'rgba(118, 39, 35, 0.76)' : 'rgba(5, 10, 15, 0.72)'
  )};
  font: 900 0.75rem var(--dw-font-ui);
  letter-spacing: normal;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(${COLORS.accentRgb}, 0.84);
    color: ${COLORS.text};
    outline: none;
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
`;

export const ItemCarouselTags = styled.div`
  button { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem 0.48rem;
  max-height: 2.9em;
  padding: 0.38rem 0 0;
  overflow: hidden;
  color: rgba(${COLORS.accentRgb}, 0.8);
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
  line-height: 1.4;

  @media (min-width: 768px) {
    max-height: 2.9em;
    padding-bottom: 0.16rem;
  }
`;

export const ItemCarouselEmpty = styled.p`
  margin: 0;
  padding: 0.75rem 0;
  border-top: 1px solid ${COLORS.line};
  color: ${COLORS.dim};
  font-size: 0.75rem;
  text-align: center;
`;

export const NestedBoxes = styled.details`
  margin-top: 0.72rem;
  border-top: 1px solid ${COLORS.line};

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    color: rgba(230, 237, 243, 0.76);
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary span {
    color: ${COLORS.accent};
    font-family: var(--dw-font-ui);
  }
`;

export const NestedBoxList = styled.ul`
  display: grid;
  gap: 0.32rem;
  margin: 0;
  padding: 0 0 0.6rem;
  list-style: none;
  color: ${COLORS.dim};
  font-size: 0.75rem;

  li {
    display: flex;
    gap: 0.5rem;
  }

  code {
    color: ${COLORS.accent};
  }
`;

export const OpenFullBoxIcon = styled.svg`
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 5px rgba(${COLORS.accentRgb}, 0.3));
`;

export const ActionGroup = styled.section`
  display: grid; gap: 0.15rem; min-width: 0; padding: 0.25rem 0.35rem;
  ${({ $inline }) => $inline && css`grid-template-columns: 1fr auto; align-items: center;`}
  & + & { border-top: 1px solid rgba(${COLORS.accentRgb}, 0.16); }
`;
export const ActionGroupLabel = styled.span`
  color: ${COLORS.dim}; font: 600 0.75rem/1.4 var(--dw-font-ui); letter-spacing: normal;
`;
export const ActionGroupButtons = styled.div`
  display: flex; gap: 0.3rem;
  button {
    flex: ${({ $compact }) => $compact ? '0 0 auto' : '1'};
    width: auto; min-height: var(--dw-control-height); padding: 0.2rem 0.45rem;
    border: 0; border-radius: 3px; box-shadow: none;
    font-size: 0.75rem; background: transparent;
    &:hover { background: rgba(${COLORS.accentRgb}, 0.1); }
    &:focus-visible { outline: 1px solid ${COLORS.accent}; outline-offset: -1px; }
  }
  @media (pointer: coarse) { button { min-height: 40px; } }
`;

export const ControlCenterNotes = styled.section`
  padding: 0.6rem 0.2rem 1rem;
  min-width: 0;
`;
export const NotesEyebrow = styled.div`
  color: var(--box-primary, var(--dw-cyan));
  font: 600 0.75rem/1.4 var(--dw-font-ui);
`;
export const NotesTitle = styled.h3`
  margin: 0.35rem 0 1rem;
  color: var(--dw-text);
  font: 650 1rem/1.3 var(--dw-font-ui);
`;
export const NotesText = styled.div`
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--dw-text-secondary);
  font: 400 0.85rem/1.65 var(--dw-font-ui);
`;
