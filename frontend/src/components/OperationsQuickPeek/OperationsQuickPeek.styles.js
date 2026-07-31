import styled, { css, keyframes } from 'styled-components';

const COLORS = {
  bg: '#090d12',
  panel: '#0e151d',
  panelRaised: '#131d27',
  text: '#e6edf3',
  dim: 'rgba(230, 237, 243, 0.62)',
  teal: '#4cc6c1',
  ice: '#7fd7ff',
  lilac: '#a7b6ff',
  line: 'rgba(127, 215, 255, 0.24)',
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
  overflow: hidden;
  color: ${COLORS.text};
  background:
    radial-gradient(circle at 78% 0%, rgba(167, 182, 255, 0.12), transparent 38%),
    linear-gradient(160deg, rgba(14, 25, 34, 0.985), rgba(7, 11, 16, 0.995));
  border: 1px solid ${COLORS.line};
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 -18px 50px rgba(0, 0, 0, 0.58),
    0 0 24px rgba(76, 198, 193, 0.08);
  transform: translateY(${({ $expanded }) => ($expanded ? '0' : '28dvh')});
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;

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
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
`;

export const DeckCap = styled.header`
  position: relative;
  display: grid;
  gap: 0.18rem;
  padding: 0.1rem 2.6rem 0.5rem;
  border-bottom: 1px solid ${COLORS.line};
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.08), transparent 42%),
    rgba(8, 13, 19, 0.88);
  touch-action: pan-y;
  user-select: none;
`;

export const DetentButton = styled.button`
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 44px;
  padding: 0;
  border: 0;
  color: ${COLORS.dim};
  background: transparent;
  cursor: pointer;
`;

export const DetentHandle = styled.span`
  width: 2.8rem;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, ${COLORS.teal}, ${COLORS.lilac});
  opacity: 0.62;
  box-shadow: 0 0 10px rgba(127, 215, 255, 0.22);
`;

export const CapNavigation = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 0.25rem;
`;

export const CapIconButton = styled.button`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: ${COLORS.ice};
  background: transparent;
  font-size: 1.45rem;
  cursor: pointer;
  opacity: 0.78;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    background: rgba(127, 215, 255, 0.08);
    outline: 1px solid rgba(127, 215, 255, 0.48);
  }

  &:disabled {
    opacity: 0.18;
    cursor: default;
  }
`;

export const BoxIdentity = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 0.08rem 0.55rem;
`;

export const BoxId = styled.span`
  color: ${COLORS.teal};
  font-family:
    'Berkeley Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo,
    Monaco, Consolas, monospace;
  font-size: 0.88rem;
  font-weight: 900;
  letter-spacing: 0.08em;
`;

export const BoxName = styled.strong`
  min-width: 0;
  overflow: hidden;
  color: ${COLORS.text};
  font-size: 1rem;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BoxContextLine = styled.span`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  color: ${COLORS.dim};
  font-size: 0.7rem;
  line-height: 1.2;
`;

export const PositionReadout = styled.span`
  flex: 0 0 auto;
  color: rgba(167, 182, 255, 0.78);
  font-family:
    'SFMono-Regular', ui-monospace, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.08em;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 0.18rem;
  right: 0.22rem;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  color: ${COLORS.dim};
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${COLORS.text};
    outline: 1px solid rgba(127, 215, 255, 0.42);
    outline-offset: -7px;
  }
`;

export const DeckContent = styled.div`
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.72rem 0.78rem 5.2rem;
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
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.7rem;
  align-items: start;
  padding-bottom: 0.7rem;
`;

export const BoxImage = styled.img`
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: 1px solid rgba(76, 198, 193, 0.34);
  border-radius: 7px;
  background: ${COLORS.bg};
`;

export const BoxImageFallback = styled.div`
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  border: 1px solid rgba(127, 215, 255, 0.18);
  border-radius: 7px;
  color: rgba(230, 237, 243, 0.34);
  background: rgba(4, 8, 12, 0.7);
  font-family: ui-monospace, monospace;
  font-size: 0.64rem;
  letter-spacing: 0.12em;
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
  color: rgba(167, 182, 255, 0.76);
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
  color: rgba(76, 198, 193, 0.72);
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
  color: ${COLORS.ice};
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
  border-top: 1px solid rgba(127, 215, 255, 0.1);
`;

export const ItemRow = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.14rem 0.65rem;
  min-height: 46px;
  padding: 0.42rem 0.1rem;
  border-bottom: 1px solid rgba(127, 215, 255, 0.1);
`;

export const ItemThumbnail = styled.img`
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 30px;
  height: 30px;
  object-fit: cover;
  border: 1px solid rgba(76, 198, 193, 0.26);
  border-radius: 4px;
  background: rgba(4, 8, 12, 0.78);
`;

export const ItemThumbnailFallback = styled.span`
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(127, 215, 255, 0.1);
  border-radius: 4px;
  background:
    linear-gradient(135deg, transparent 46%, rgba(127, 215, 255, 0.08) 47% 53%, transparent 54%),
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
  color: ${COLORS.lilac};
  font-size: 0.72rem;
  letter-spacing: 0.06em;
`;

export const EmptyItems = styled.p`
  margin: 0.35rem 0 0.8rem;
  padding: 0.8rem;
  color: ${COLORS.dim};
  border: 1px dashed rgba(127, 215, 255, 0.18);
  border-radius: 7px;
  font-size: 0.76rem;
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
    color: ${COLORS.teal};
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
    color: ${COLORS.teal};
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
  border: 1px solid rgba(167, 182, 255, 0.5);
  border-radius: 7px;
  color: ${COLORS.text};
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.12), rgba(167, 182, 255, 0.17)),
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
    border-color: ${COLORS.ice};
    outline: none;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.42),
      0 0 16px rgba(127, 215, 255, 0.14);
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
  filter: drop-shadow(0 0 5px rgba(127, 215, 255, 0.24));
`;
