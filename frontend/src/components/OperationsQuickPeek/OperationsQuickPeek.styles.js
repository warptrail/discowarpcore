import styled, { css, keyframes } from 'styled-components';
import { QUICK_PEEK_EXIT_DURATION_MS } from './OperationsQuickPeek.motion';

const COLORS = {
  bg: '#090d12',
  panel: '#0e151d',
  panelRaised: '#131d27',
  text: '#e6edf3',
  dim: 'rgba(230, 237, 243, 0.62)',
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
  overflow: visible;
  color: ${COLORS.text};
  background:
    radial-gradient(circle at 78% 0%, rgba(${COLORS.secondaryRgb}, 0.13), transparent 38%),
    linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.055), transparent 44%),
    linear-gradient(160deg, rgba(14, 25, 34, 0.985), rgba(7, 11, 16, 0.995));
  border: 1px solid ${COLORS.line};
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 -18px 50px rgba(0, 0, 0, 0.58),
    0 0 24px rgba(${COLORS.accentRgb}, 0.13);
  transform: translateY(
    ${({ $expanded }) => ($expanded ? '0' : 'var(--quick-peek-collapsed-shift)')}
  );
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  animation: ${({ $closing }) =>
    $closing
      ? css`${undockAndDescend} ${QUICK_PEEK_EXIT_DURATION_MS}ms cubic-bezier(0.58, 0.02, 0.82, 0.42) both`
      : css`${riseAndDock} 680ms cubic-bezier(0.16, 0.82, 0.24, 1) both`};
  will-change: translate, transform;
  pointer-events: ${({ $closing }) => ($closing ? 'none' : 'auto')};

  &:focus {
    outline: none;
  }

  @media (min-width: 768px) {
    --quick-peek-expanded-height: auto;
    --quick-peek-collapsed-height: auto;
    --quick-peek-collapsed-shift: 0px;
    top: var(--operations-quick-peek-top, 8.6rem);
    right: 1rem;
    bottom: 1rem;
    left: auto;
    width: min(420px, 38vw);
    height: auto;
    min-height: 0;
    border-bottom: 1px solid ${COLORS.line};
    border-radius: 10px;
    transform: none;
    animation: ${settle} 240ms cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: auto;
  }

  @media (min-width: 1100px) {
    ${({ $itemFocused }) =>
      $itemFocused &&
      css`
        width: min(720px, 58vw);
      `}
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
`;

export const DeckCap = styled.header`
  position: relative;
  isolation: isolate;
  z-index: 8;
  overflow: visible;
  padding: ${({ $expanded }) =>
    $expanded ? '0.55rem 0.18rem 0.42rem' : '0 0.18rem'};
  border-bottom: 1px solid ${COLORS.line};
  background:
    linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.12), transparent 42%),
    rgba(8, 13, 19, 0.88);
  touch-action: none;
  user-select: none;

  @media (min-width: 768px) {
    padding: 0.55rem 0.18rem 0.42rem;
    touch-action: auto;
  }
`;

export const DeckCapArtwork = styled.span`
  position: absolute;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  border-radius: 11px 11px 0 0;
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
      linear-gradient(90deg, rgba(8, 13, 19, 0.94) 0%, rgba(8, 13, 19, 0.48) 48%, rgba(8, 13, 19, 0.72) 100%),
      linear-gradient(0deg, rgba(8, 13, 19, 0.84), transparent 72%);
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
  border-radius: 999px;
  background: linear-gradient(90deg, ${COLORS.accent}, ${COLORS.secondary});
  opacity: 0.62;
  box-shadow: 0 0 10px rgba(${COLORS.accentRgb}, 0.3);
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
  background:
    linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.1), transparent 36%),
    rgba(7, 12, 18, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 0 14px rgba(${COLORS.accentRgb}, 0.16);
  touch-action: none;
  animation: ${settle} 180ms cubic-bezier(0.22, 1, 0.36, 1);

  &:focus-within {
    border-color: rgba(${COLORS.accentRgb}, 0.88);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 0 16px rgba(${COLORS.accentRgb}, 0.24);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const QuickPeekSearchGlyph = styled.span`
  display: grid;
  place-items: center;
  color: ${COLORS.accent};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
  font: 700 0.72rem/1.2 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;

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
  border-radius: 999px;
  background: currentColor;
  opacity: 0.82;
  box-shadow: 0 0 7px rgba(238, 190, 91, 0.18);
  transition:
    width 180ms ease,
    opacity 180ms ease,
    box-shadow 180ms ease;

  ${CollapseEdgeButton}:hover &,
  ${CollapseEdgeButton}:focus-visible & {
    width: 4.1rem;
    opacity: 1;
    box-shadow:
      0 0 8px rgba(255, 211, 116, 0.62),
      0 0 18px rgba(238, 190, 91, 0.34);
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
  border: 0;
  border-radius: 6px;
  color: ${COLORS.accent};
  background: transparent;
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  opacity: 0.78;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    background: rgba(${COLORS.accentRgb}, 0.1);
    outline: 1px solid rgba(${COLORS.accentRgb}, 0.52);
  }

  &:disabled {
    opacity: 0.18;
    cursor: default;
  }
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

  @media (max-width: 767px) {
    display: ${({ $expanded }) => ($expanded ? 'grid' : 'none')};
    visibility: ${({ $expanded }) => ($expanded ? 'visible' : 'hidden')};
    opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
    transform: translateY(${({ $expanded }) => ($expanded ? '0' : '-4px')});
    pointer-events: ${({ $expanded }) => ($expanded ? 'auto' : 'none')};
  }

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
  font-size: 0.68rem;
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
  background: rgba(5, 10, 15, 0.58);
  font: 900 0.61rem ui-monospace, monospace;
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
  font-family:
    'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo,
    Monaco, Consolas, monospace;
  font-size: 1.02rem;
  font-weight: 900;
  letter-spacing: 0.08em;
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
  font-size: 0.68rem;
  line-height: 1.2;
`;

export const BoxLocation = styled.span`
  min-width: 0;
  overflow: hidden;
  color: rgba(${COLORS.accentRgb}, 0.82);
  font-family:
    'SFMono-Regular', ui-monospace, Menlo, Monaco, Consolas, monospace;
  font-weight: 800;
  letter-spacing: 0.055em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const PositionReadout = styled.span`
  flex: 0 0 auto;
  color: rgba(${COLORS.secondaryRgb}, 0.82);
  font-family:
    'SFMono-Regular', ui-monospace, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
`;

export const DeckContent = styled.div`
  min-height: 0;
  overflow-x: hidden;
  overflow-y: ${({ $expanded, $itemFocused, $photoFocused }) =>
    $itemFocused && !$expanded
      ? 'auto'
      : $itemFocused || $photoFocused
        ? 'hidden'
        : 'auto'};
  overscroll-behavior: contain;
  padding: ${({ $itemFocused, $photoFocused, $expanded }) =>
    $photoFocused
      ? `0.45rem 0.6rem ${$expanded ? '4.65rem' : '4.25rem'}`
      : $itemFocused
      ? '0.45rem 0.72rem 0.25rem'
      : `0.55rem 0.78rem ${$expanded ? '5.2rem' : 'calc(5.2rem + var(--quick-peek-collapsed-shift))'}`};
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
  background:
    radial-gradient(circle at 50% 44%, rgba(${COLORS.accentRgb}, 0.12), transparent 58%),
    rgba(3, 8, 13, 0.78);
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.44);
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
  background: rgba(5, 10, 16, 0.66);
  backdrop-filter: blur(10px);

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
  background: rgba(5, 10, 16, 0.72);
  backdrop-filter: blur(12px) saturate(130%);
  cursor: pointer;
  box-shadow: 0 0 15px rgba(${COLORS.accentRgb}, 0.12);

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
    box-shadow: 0 0 18px rgba(${COLORS.accentRgb}, 0.28);
  }
`;

export const BoxPhotoFallback = styled.div`
  color: ${COLORS.dim};
  font: 800 0.7rem/1.3 'SFMono-Regular', ui-monospace, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
      ? `linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.15), rgba(${COLORS.secondaryRgb}, 0.05) 72%, transparent)`
      : 'transparent'};
  box-shadow: ${({ $notesEmphasized }) =>
    $notesEmphasized
      ? `inset 0 1px rgba(${COLORS.accentRgb}, 0.16), 0 0 20px rgba(${COLORS.accentRgb}, 0.08)`
      : 'none'};
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
  font-family: ui-monospace, monospace;
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const TagLine = styled.div`
  display: flex;
  gap: 0.4rem;
  min-width: 0;
  overflow: hidden;
  color: rgba(${COLORS.accentRgb}, 0.78);
  font-family: ui-monospace, monospace;
  font-size: 0.62rem;
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
  background: rgba(6, 12, 17, 0.56);
  font: 800 0.62rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;
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
  background:
    radial-gradient(
      circle at 18% 7%,
      rgba(${COLORS.accentRgb}, 0.13),
      transparent 36%
    ),
    radial-gradient(
      circle at 92% 88%,
      rgba(${COLORS.secondaryRgb}, 0.09),
      transparent 44%
    ),
    repeating-linear-gradient(
      180deg,
      transparent 0,
      transparent 28px,
      rgba(${COLORS.secondaryRgb}, 0.13) 29px,
      transparent 30px
    ),
    linear-gradient(145deg, #0c1017, #05070b 72%, #090c12);
  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.48),
    0 0 18px rgba(${COLORS.accentRgb}, 0.09),
    inset 0 1px rgba(${COLORS.secondaryRgb}, 0.14),
    inset 0 0 28px rgba(0, 0, 0, 0.34);
  text-align: left;
  cursor: pointer;
  transform-origin: 50% 100%;
  animation: ${notePaperRise} 430ms cubic-bezier(0.16, 0.82, 0.24, 1) both;

  &::before {
    position: absolute;
    z-index: 1;
    inset: 0 auto 0 0;
    width: 7px;
    background: linear-gradient(
      180deg,
      rgba(${COLORS.accentRgb}, 0.98),
      rgba(${COLORS.secondaryRgb}, 0.78)
    );
    box-shadow: 0 0 14px rgba(${COLORS.accentRgb}, 0.34);
    content: '';
  }

  &::after {
    position: absolute;
    z-index: 0;
    inset: 0 auto 0 2.02rem;
    width: 1px;
    background: rgba(${COLORS.accentRgb}, 0.24);
    box-shadow: 0 0 8px rgba(${COLORS.accentRgb}, 0.2);
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
    box-shadow:
      0 20px 38px rgba(0, 0, 0, 0.52),
      0 0 0 2px rgba(${COLORS.accentRgb}, 0.24),
      0 0 24px rgba(${COLORS.accentRgb}, 0.14),
      inset 0 1px rgba(${COLORS.secondaryRgb}, 0.18);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
  }
`;

export const NotePaperKicker = styled.span`
  color: rgba(${COLORS.secondaryRgb}, 0.86);
  font: 900 0.62rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.12em;
  text-shadow: 0 0 10px rgba(${COLORS.secondaryRgb}, 0.32);
  text-transform: uppercase;
`;

export const NotePaperBody = styled.span`
  align-self: start;
  color: var(--box-neon, ${COLORS.text});
  font-size: clamp(0.96rem, 3.6vw, 1.08rem);
  font-weight: 720;
  line-height: 1.78;
  overflow-wrap: anywhere;
  text-shadow:
    0 0 5px rgba(var(--box-neon-rgb, 230, 237, 243), 0.42),
    0 0 16px rgba(${COLORS.accentRgb}, 0.2);
  white-space: pre-wrap;
`;

export const NotePaperHint = styled.span`
  justify-self: end;
  color: rgba(${COLORS.accentRgb}, 0.76);
  font: 800 0.56rem ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
  text-shadow: 0 0 8px rgba(${COLORS.accentRgb}, 0.24);
  text-transform: uppercase;
`;

export const ItemsHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.52rem 0 0.4rem;
  border-top: 1px solid ${COLORS.line};
  color: ${COLORS.accent};
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const ItemsCount = styled.span`
  color: ${COLORS.dim};
  font-size: 0.58rem;
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

  &:hover,
  &:focus-visible {
    outline: none;
    background:
      linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.12), transparent 74%);
    box-shadow: inset 2px 0 0 ${COLORS.accent};
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
  background: rgba(4, 8, 12, 0.78);
`;

export const ItemThumbnailFallback = styled.span`
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.12);
  border-radius: 4px;
  background:
    linear-gradient(135deg, transparent 46%, rgba(${COLORS.accentRgb}, 0.1) 47% 53%, transparent 54%),
    rgba(4, 8, 12, 0.54);
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
  font-size: 0.62rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemQuantity = styled.code`
  grid-column: 3;
  grid-row: 1 / span 2;
  color: ${COLORS.secondary};
  font-size: 0.72rem;
  letter-spacing: 0.06em;
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
  background:
    linear-gradient(145deg, rgba(${COLORS.accentRgb}, 0.07), transparent 42%),
    rgba(7, 12, 18, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 14px 34px rgba(0, 0, 0, 0.3);

  @media (min-width: 768px) {
    display: grid;
    grid-template-rows: minmax(0, 1fr) clamp(9.75rem, 24dvh, 12rem);
  }

  @media (min-width: 1100px) {
    grid-template-columns: minmax(250px, 0.9fr) minmax(0, 1.1fr);
    grid-template-rows: minmax(0, 1fr);
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
  background:
    radial-gradient(circle at 50% 44%, rgba(${COLORS.secondaryRgb}, 0.12), transparent 62%),
    rgba(3, 8, 12, 0.88);
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
      linear-gradient(180deg, rgba(3, 7, 11, 0.42), transparent 22% 72%, rgba(3, 7, 11, 0.58)),
      linear-gradient(90deg, rgba(3, 7, 11, 0.32), transparent 18% 82%, rgba(3, 7, 11, 0.32));
  }

  @media (min-width: 1100px) {
    border-right: 1px solid rgba(${COLORS.accentRgb}, 0.22);
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
  top: 50%;
  ${({ $side }) => ($side === 'previous' ? 'left: 0.35rem;' : 'right: 0.35rem;')}
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.26);
  border-radius: 6px;
  color: ${COLORS.accent};
  background: rgba(5, 10, 15, 0.68);
  backdrop-filter: blur(7px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.34);
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    outline: none;
    border-color: rgba(${COLORS.accentRgb}, 0.7);
    background: rgba(${COLORS.accentRgb}, 0.1);
  }

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
  background: rgba(5, 10, 15, 0.7);
  backdrop-filter: blur(7px);
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
  font-size: 0.64rem;
  letter-spacing: 0.08em;
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
  backdrop-filter: blur(7px);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    filter: brightness(1.22);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(${COLORS.accentRgb}, 0.34);
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
  grid-template-columns: repeat(3, max-content);
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
      font-size: 0.48rem;
    }
  `}

  @media (max-width: 460px) {
    grid-template-columns: ${({ $positionOnly }) => ($positionOnly ? '42px' : 'repeat(3, max-content)')};

    button {
      width: 42px;
      font-size: 0.48rem;
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
  backdrop-filter: blur(7px);
  font-family: inherit;
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    filter: brightness(1.22);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(${COLORS.accentRgb}, 0.34);
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
        linear-gradient(
          135deg,
          rgba(var(--box-accent-rgb, 68, 205, 214), 0.64),
          rgba(var(--box-secondary-rgb, 167, 182, 255), 0.5)
        ),
        rgba(7, 16, 24, 0.96);
      box-shadow:
        0 0 0 1px rgba(var(--box-accent-rgb, 68, 205, 214), 0.45),
        0 0 12px rgba(var(--box-accent-rgb, 68, 205, 214), 0.66),
        inset 0 0 10px rgba(255, 255, 255, 0.16);
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
  background:
    linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.16), rgba(${COLORS.secondaryRgb}, 0.12)),
    rgba(9, 14, 20, 0.78);
  font: 900 0.48rem/1 inherit;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover,
  &:focus-visible {
    border-color: ${COLORS.accent};
    outline: none;
    box-shadow: 0 0 12px rgba(${COLORS.accentRgb}, 0.2);
  }
`;

export const ItemActionPopover = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.42rem);
  left: 50%;
  display: grid;
  grid-template-columns: repeat(4, 46px);
  gap: 0.24rem;
  padding: 0.38rem;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.48);
  border-radius: 7px;
  background:
    linear-gradient(135deg, rgba(${COLORS.accentRgb}, 0.14), transparent 62%),
    rgba(6, 11, 17, 0.98);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.54),
    0 0 18px rgba(${COLORS.accentRgb}, 0.18);
  transform: translateX(-50%);

  &::before {
    position: absolute;
    top: -5px;
    left: 50%;
    width: 9px;
    height: 9px;
    border-top: 1px solid rgba(${COLORS.accentRgb}, 0.48);
    border-left: 1px solid rgba(${COLORS.accentRgb}, 0.48);
    background: rgba(8, 14, 20, 0.98);
    content: '';
    transform: translateX(-50%) rotate(45deg);
  }

  @media (max-width: 460px) {
    grid-template-columns: repeat(4, 42px);
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
  background:
    linear-gradient(135deg, rgba(${COLORS.accentRgb}, 0.12), transparent 62%),
    rgba(5, 10, 16, 0.98);
  box-shadow:
    0 16px 34px rgba(0, 0, 0, 0.6),
    0 0 22px rgba(${COLORS.accentRgb}, 0.2);
  transform: translateX(-50%);
  scrollbar-width: thin;
  scrollbar-color: rgba(${COLORS.accentRgb}, 0.44) transparent;

  ${NoteFocusToolbar} {
    min-height: 32px;
  }

  ${NoteItemsReturn} {
    min-height: 30px;
    padding: 0 0.52rem;
    border-radius: 5px 8px 5px 5px;
    font-size: 0.52rem;
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
  background: linear-gradient(
    180deg,
    transparent 0,
    rgba(5, 10, 15, 0.84) 2.4rem,
    rgba(5, 10, 15, 0.98) 100%
  );

  @media (min-width: 768px) {
    position: static;
    align-self: stretch;
    min-height: 0;
    max-height: none;
    overflow-x: hidden;
    overflow-y: auto;
    pointer-events: auto;
    padding: 0.78rem 0.9rem 1rem;
    border-top: 1px solid rgba(${COLORS.accentRgb}, 0.22);
    background:
      linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.055), transparent 46%),
      rgba(7, 12, 18, 0.96);
    scrollbar-width: thin;
    scrollbar-color: rgba(${COLORS.accentRgb}, 0.4) transparent;
  }

  @media (min-width: 1100px) {
    align-self: stretch;
    padding: 1.05rem 1.1rem;
    border-top: 0;
    background: rgba(7, 12, 18, 0.78);
  }

  @media (max-width: 767px) {
    position: static;
    max-height: none;
    overflow-x: hidden;
    overflow-y: auto;
    pointer-events: auto;
    padding: 0.62rem 0.72rem 0.28rem;
    background:
      linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.055), transparent 46%),
      rgba(7, 12, 18, 0.96);
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
  background:
    linear-gradient(135deg, transparent 49.7%, rgba(${COLORS.accentRgb}, 0.12) 50%, transparent 50.3%),
    rgba(4, 8, 12, 0.28);
  font-family: ui-monospace, monospace;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
`;

export const ItemCarouselIdentity = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.3rem;
  padding-bottom: 0.42rem;
  border-bottom: 1px solid ${COLORS.line};
`;

export const ItemCarouselName = styled.h3`
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
  font-size: 0.68rem;

  code {
    color: ${COLORS.secondary};
    font-size: 0.64rem;
    letter-spacing: 0.08em;
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
    font-size: 0.7rem;
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
  cursor: help;

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
  font: 900 0.62rem ui-monospace, monospace;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: #f0caff;
    color: ${COLORS.text};
    outline: none;
    box-shadow: 0 0 12px rgba(220, 143, 255, 0.24);
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
  font-size: 0.7rem;
  line-height: 1.32;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemCarouselDeckButton = styled.button`
  flex: 0 0 auto;
  margin-left: auto;
  min-height: 24px;
  padding: 0.1rem 0.42rem;
  border: 1px solid ${({ $active }) => (
    $active ? 'rgba(240, 138, 123, 0.88)' : `rgba(${COLORS.accentRgb}, 0.44)`
  )};
  border-radius: 4px;
  color: ${({ $active }) => ($active ? '#ff9d91' : `rgba(${COLORS.accentRgb}, 0.92)`)};
  background: ${({ $active }) => (
    $active ? 'rgba(118, 39, 35, 0.76)' : 'rgba(5, 10, 15, 0.72)'
  )};
  font: 900 0.56rem ui-monospace, monospace;
  letter-spacing: 0.04em;
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem 0.48rem;
  max-height: 2.9em;
  padding: 0.38rem 0 0;
  overflow: hidden;
  color: rgba(${COLORS.accentRgb}, 0.8);
  font-family: ui-monospace, monospace;
  font-size: 0.64rem;
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
  font-size: 0.72rem;
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
    font-size: 0.72rem;
    font-weight: 800;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary span {
    color: ${COLORS.accent};
    font-family: ui-monospace, monospace;
  }
`;

export const NestedBoxList = styled.ul`
  display: grid;
  gap: 0.32rem;
  margin: 0;
  padding: 0 0 0.6rem;
  list-style: none;
  color: ${COLORS.dim};
  font-size: 0.7rem;

  li {
    display: flex;
    gap: 0.5rem;
  }

  code {
    color: ${COLORS.accent};
  }
`;

export const BoxFooterActions = styled.div`
  position: absolute;
  right: 0.72rem;
  bottom: max(0.52rem, env(safe-area-inset-bottom));
  left: 0.6rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${({ $withNotes }) => ($withNotes ? '36px' : '1fr')};
  gap: 0.28rem;
  transform: translateY(
    ${({ $expanded }) =>
      $expanded ? '0' : 'calc(-1 * var(--quick-peek-collapsed-shift))'}
  );
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);

  @media (min-width: 768px) {
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const OpenFullBoxButton = styled.button`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0 0.72rem;
  border: 1px solid rgba(${COLORS.secondaryRgb}, 0.58);
  border-radius: 7px;
  color: ${COLORS.text};
  background:
    linear-gradient(
      90deg,
      rgba(${COLORS.accentRgb}, 0.18),
      rgba(${COLORS.secondaryRgb}, 0.14)
    ),
    rgba(9, 14, 20, 0.62);
  -webkit-backdrop-filter: blur(14px) saturate(135%);
  backdrop-filter: blur(14px) saturate(135%);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.42);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${COLORS.accent};
    outline: none;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.42),
      0 0 16px rgba(${COLORS.accentRgb}, 0.2);
  }

`;

export const BoxNotesFooterButton = styled.button`
  display: grid;
  place-items: center;
  width: 36px;
  min-height: 36px;
  padding: 0;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.62);
  border-radius: 7px;
  color: ${COLORS.text};
  background: rgba(9, 14, 20, 0.72);
  font: 900 0.64rem/1 ui-monospace, monospace;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.34);

  &:hover,
  &:focus-visible {
    border-color: ${COLORS.accent};
    outline: none;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.42),
      0 0 16px rgba(${COLORS.accentRgb}, 0.2);
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
