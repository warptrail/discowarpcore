// ItemRow.styles.js
import styled, { keyframes, css } from 'styled-components';
import {
  OPEN_ACCENT,
  BASE_BORDER,
  ACTIVE_BORDER,
  ROW_BG,
  ROW_BG_ACTIVE,
} from '../styles/tokens';

/* soft inner glow while open (content-safe) */
const steadyGlow = css`
  box-shadow: 0 0 6px 0 var(--accent), 0 0 14px 2px rgba(0, 0, 0, 0);
`;

/* smooth full-spectrum hue rotation (applied to a bg layer) */
const hueDial = keyframes`
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
`;

/* ================= Frame (no borders; we show background through row margin) ================= */
/* ================= Frame (thinner glow, connected open state) ================= */
export const Wrapper = styled.div`
  --accent: ${({ $accent }) => $accent || OPEN_ACCENT};
  --r: 10px;
  --gap: ${({ $gap = '3px' }) => $gap}; /* thinner frame */
  --ring-speed: ${({ $ringSpeed = '8s' }) => $ringSpeed};

  position: relative;
  border-radius: var(--r);
  overflow: hidden;
  isolation: isolate;
  contain: paint;

  /* CLOSED: subtle neutral background */
  background: linear-gradient(135deg, ${BASE_BORDER}, ${ACTIVE_BORDER});
  transition: box-shadow 280ms ease, background 280ms ease;

  /* Hue-rotating background under the card */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, #1cd3ff, #20ff9d);
    opacity: 0; /* hidden while closed */
    z-index: 0; /* sits under the card */
    transform: translateZ(0);
    -webkit-mask-image: -webkit-radial-gradient(white, black);
  }

  &[data-open='true'] {
    /* soft inner glow when open */
    box-shadow: 0 0 6px 0 var(--accent), 0 0 14px 2px rgba(0, 0, 0, 0);

    &::before {
      opacity: 1;
      animation: ${hueDial} var(--ring-speed) linear infinite;
    }
  }
`;

/* ================= Inner clip container =================
   Everything inside is clipped to the inner radius; prevents any child from
   poking past corners during height transitions in Safari. */
export const Clip = styled.div`
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  /* border-radius: calc(var(--r) - 1px); */
  border-radius: inherit;
  overflow: hidden;
  background: transparent;
`;

/* ================= Row (clickable header) =================
   No borders. We create the “frame” by margin so the Wrapper’s background
   is visible around it. */
export const Row = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  /* show the thin glow around the card via margins */
  margin: var(--gap);
  padding: 0.75rem 1rem;

  background: ${ROW_BG};
  border: 0;
  border-radius: calc(var(--r) - var(--gap));
  cursor: pointer;
  transition: background 240ms ease;

  &:active {
    background: #1e1e1e;
  }

  /* CONNECTED: when open, remove the bottom rounding and the bottom gap */
  &[data-open='true'] {
    margin-bottom: 0; /* <-- no space between Row and Details */
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
`;

/* ================= Collapse (slide-down) ================= */
export const Collapse = styled.div`
  overflow: hidden;

  /* left/right gap only; top/bottom handled by Row open-state */
  margin: 0 var(--gap) var(--gap);
  border-bottom-left-radius: calc(var(--r) - var(--gap));
  border-bottom-right-radius: calc(var(--r) - var(--gap));

  transition: height var(--collapse-dur, 520ms) cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 380ms ease, transform 380ms ease;

  opacity: ${({ ['data-open']: open }) => (open === 'true' ? 1 : 0)};
  transform: translateY(
    ${({ ['data-open']: open }) => (open === 'true' ? '0px' : '-6px')}
  );
  background: transparent;
  border: 0;
  outline: none;

  /* when the Row is open, butt the panels together (no seam) */
  &[data-open='true'] {
    margin-top: 0; /* <-- connects to Row */
  }
`;

/* ================= Details card ================= */
export const DetailsCard = styled.div`
  position: relative;
  z-index: 1;
  background: ${ROW_BG_ACTIVE};
  border: 0;
  /* top corners are square so it mates flush with Row above */
  border-radius: 0 0 calc(var(--r) - var(--gap)) calc(var(--r) - var(--gap));
  padding: 12px 12px 16px;
`;
/* ===== Text/layout bits (unchanged) ===== */
export const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
`;
export const Right = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  margin-left: 1rem;
`;
export const Title = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #eee;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const Breadcrumb = styled.div`
  font-size: 0.8rem;
  color: #aaa;
`;
export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;
export const Tag = styled.span`
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 999px;
  background: #333;
  color: #ccc;
  border: 1px solid #555;
`;
export const Notes = styled.div`
  font-size: 0.8rem;
  color: #bbb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const Qty = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: #0c0;
`;
