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
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 180;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 100%;
  height: 82dvh;
  min-height: 28rem;
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
  transform: translateY(${({ $expanded }) => ($expanded ? '0' : '28dvh')});
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

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
`;

export const DeckCap = styled.header`
  position: relative;
  isolation: isolate;
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
  touch-action: manipulation;
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
  z-index: 1;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 40px;
  align-items: center;
  gap: 0.25rem;
  min-height: 44px;
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
    visibility: ${({ $expanded }) => ($expanded ? 'visible' : 'hidden')};
    opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
    transform: translateY(${({ $expanded }) => ($expanded ? '0' : '-4px')});
    pointer-events: ${({ $expanded }) => ($expanded ? 'auto' : 'none')};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
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
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.55rem 0.78rem 5.2rem;
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

export const BoxSnapshot = styled.div`
  padding: 0 0 0.55rem;
`;

export const BoxSnapshotText = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.42rem;
`;

export const BoxDescription = styled.p`
  margin: 0;
  color: rgba(230, 237, 243, 0.82);
  font-size: 0.78rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;

export const BoxNotes = styled.p`
  margin: 0;
  color: ${COLORS.dim};
  font-size: 0.72rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;

export const MetaLabel = styled.span`
  display: block;
  margin-bottom: 0.12rem;
  color: rgba(${COLORS.secondaryRgb}, 0.8);
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

export const ItemCarouselNavigation = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  min-height: 46px;
  border-bottom: 1px solid ${COLORS.line};
`;

export const ItemCarouselArrow = styled.button`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  color: ${COLORS.accent};
  background: transparent;
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    outline: 1px solid rgba(${COLORS.accentRgb}, 0.48);
    background: rgba(${COLORS.accentRgb}, 0.1);
  }

  &:disabled {
    opacity: 0.18;
    cursor: default;
  }
`;

export const ItemCarouselReturn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  justify-self: center;
  min-width: 76px;
  min-height: 44px;
  padding: 0 0.5rem;
  border: 0;
  color: ${COLORS.dim};
  background: transparent;
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

export const ItemCarouselHero = styled.div`
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
  padding: 0.8rem 0 0.72rem;
`;

export const ItemCarouselImage = styled.img`
  width: 86px;
  height: 86px;
  object-fit: cover;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.34);
  border-radius: 6px;
  background: ${COLORS.bg};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 0 14px rgba(${COLORS.accentRgb}, 0.1);
`;

export const ItemCarouselImageFallback = styled.div`
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  border: 1px solid rgba(${COLORS.accentRgb}, 0.16);
  border-radius: 6px;
  color: rgba(230, 237, 243, 0.3);
  background: rgba(4, 8, 12, 0.58);
  font-family: ui-monospace, monospace;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
`;

export const ItemCarouselIdentity = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.44rem;
`;

export const ItemCarouselName = styled.h3`
  margin: 0;
  color: ${COLORS.text};
  font-size: clamp(1rem, 4.5vw, 1.24rem);
  line-height: 1.12;
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
  border-top: 1px solid ${COLORS.line};
`;

export const ItemCarouselDetail = styled.div`
  padding: 0.68rem 0;
  border-bottom: 1px solid rgba(${COLORS.accentRgb}, 0.12);

  p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: rgba(230, 237, 243, 0.8);
    font-size: 0.76rem;
    line-height: 1.4;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
`;

export const ItemCarouselTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem 0.52rem;
  max-height: 2.8em;
  padding: 0.68rem 0;
  overflow: hidden;
  color: rgba(${COLORS.accentRgb}, 0.8);
  font-family: ui-monospace, monospace;
  font-size: 0.64rem;
  line-height: 1.4;
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

export const OpenFullBoxButton = styled.button`
  position: absolute;
  right: 0.72rem;
  bottom: max(0.72rem, env(safe-area-inset-bottom));
  left: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 0 0.9rem;
  border: 1px solid rgba(${COLORS.secondaryRgb}, 0.58);
  border-radius: 7px;
  color: ${COLORS.text};
  background:
    linear-gradient(90deg, rgba(${COLORS.accentRgb}, 0.16), rgba(${COLORS.secondaryRgb}, 0.2)),
    rgba(9, 14, 20, 0.96);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.42);
  transform: translateY(${({ $expanded }) => ($expanded ? '0' : '-28dvh')});
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
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

  @media (min-width: 768px) {
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const OpenFullBoxIcon = styled.svg`
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 5px rgba(${COLORS.accentRgb}, 0.3));
`;
