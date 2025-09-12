// src/components/styles/ItemRow.styles.js
import styled, { keyframes, css } from 'styled-components';
import {
  OPEN_ACCENT, // fallback accent color
  BASE_BORDER,
  ACTIVE_BORDER,
  ROW_BG,
  ROW_BG_ACTIVE,
} from '../styles/tokens';

/* One-time border glow pulse (you can trigger via [data-opening='true'] or leave it out) */
export const borderPulse = keyframes`
  0%   { box-shadow: 0 0 0 0 var(--accent); }
  50%  { box-shadow: 0 0 10px 3px var(--accent); }
  100% { box-shadow: 0 0 0 0 var(--accent); }
`;

/* Repeating “attention” flash you can toggle with the $pulsing prop */
const pulseFlash = keyframes`
  0%   { box-shadow: 0 0 0 0 var(--accent); }
  50%  { box-shadow: 0 0 12px 4px var(--accent); }
  100% { box-shadow: 0 0 0 0 var(--accent); }
`;

/* Subtle steady glow while open */
const steadyGlow = css`
  box-shadow: 0 0 6px 0 var(--accent), 0 0 14px 2px rgba(0, 0, 0, 0);
`;

/* ===== Frame (single source of truth for the border) ===== */
export const Wrapper = styled.div`
  /* accent hue is still configurable */
  --accent: ${({ $accent }) => $accent || OPEN_ACCENT};
  --b: 2px; /* visual border thickness */
  --r: 10px; /* outer radius */

  position: relative;
  width: 100%;
  margin: 0 0 10px 0;
  border-radius: var(--r);
  padding: var(--b); /* creates the “border” gap */
  overflow: hidden;

  /* gradient frame behind the content */
  background: linear-gradient(135deg, ${BASE_BORDER}, ${ACTIVE_BORDER});
  transition: background 280ms ease, box-shadow 280ms ease;

  /* opening pulse (optional – keep if you like) */
  &[data-opening='true'] {
    animation: ${borderPulse} 800ms ease;
  }

  /* OPEN: shift to accent gradient + soft glow */
  &[data-open='true'] {
    background: linear-gradient(135deg, var(--accent), ${ACTIVE_BORDER});
    ${steadyGlow}
  }

  /* CLOSING: settle back */
  &[data-closing='true'] {
    background: linear-gradient(135deg, ${BASE_BORDER}, ${ACTIVE_BORDER});
    box-shadow: none;
  }

  /* Optional attention flash */
  ${({ $pulsing }) =>
    $pulsing &&
    css`
      animation: ${pulseFlash} 900ms ease-in-out infinite;
    `}
`;
/* ===== Clickable row content (no borders here) ===== */
export const Row = styled.div`
  position: relative;
  z-index: 1; /* content above the gradient frame */
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.75rem 1rem;

  /* the readable card on top */
  background: ${ROW_BG};
  border: 0;
  border-radius: calc(var(--r) - var(--b)); /* inner radius = outer - border */
  cursor: pointer;
  transition: background 240ms ease;

  &:active {
    background: #1e1e1e;
  }

  &[data-open='true'] {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
`;
/* ===== Simple slide-down container for details ===== */
export const Collapse = styled.div`
  overflow: hidden;
  transition: height var(--collapse-dur, 520ms) cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 380ms ease, transform 380ms ease;
  opacity: ${({ ['data-open']: open }) => (open === 'true' ? 1 : 0)};
  transform: translateY(
    ${({ ['data-open']: open }) => (open === 'true' ? '0px' : '-6px')}
  );
  border: 0;
  outline: none;
  background: transparent;
`;

/* ===== Details panel (borderless; Wrapper owns the frame) ===== */
export const DetailsCard = styled.div`
  position: relative;
  z-index: 1;
  border: 0;
  border-radius: 0 0 10px 10px;
  background: ${ROW_BG_ACTIVE}; /* or swap to your CARD_BG token if desired */
  padding: 12px 12px 16px;
`;

/* ===== Little helpers for the row body ===== */
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
