// src/styles/BoxDetailView.styles.js
import styled, { keyframes } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_PAGE_GAP,
  MOBILE_PANEL_RADIUS,
} from './tokens';

/* LCARS-ish palette (fixed) */
const LCARS = {
  bg: '#0E0F12',
  panel: '#151921',
  line: 'rgba(255,255,255,0.08)',
  text: '#E7ECF3',
  errorBg: '#2B0000',
  errorText: '#FF6B6B',
  accent: '#E88C1F',
};

/* Mobile-first wrapper: prevents horizontal scroll, allows content to shrink */
export const Wrap = styled.div`
  /* layout */
  display: grid;
  gap: clamp(12px, 2vw, 20px);
  padding: clamp(12px, 3vw, 20px);

  /* mobile-first constraints */
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  min-height: 100dvh;

  /* cosmetics */
  background:
    radial-gradient(
      circle at 12% 0%,
      rgba(var(--box-primary-rgb, 127, 215, 255), 0.1),
      transparent 34%
    ),
    linear-gradient(
      var(--box-wash-angle, 118deg),
      rgba(var(--box-secondary-rgb, 103, 217, 211), 0.045),
      transparent 42%
    ),
    ${LCARS.bg};
  color: ${LCARS.text};

  /* IMPORTANT for wrapping children correctly */
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.58rem;
    padding: ${MOBILE_PAGE_GAP};
    min-height: auto;
  }
`;

/* Optional inner content area if you want a max width on big screens */
export const Content = styled.div`
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  min-width: 0; /* critical for preventing flex/grid overflow */

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: 100%;
  }
`;

export const TabViewport = styled.div`
  position: relative;
  min-width: 0;
  overflow-x: clip;
  border-top: 1px solid rgba(var(--box-primary-rgb, 127, 215, 255), 0.1);
`;

/* Spinner */
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
export const Spinner = styled.div`
  display: inline-block;
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.18);
  border-top: 3px solid var(--box-primary, ${LCARS.accent});
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 24px auto;
`;

/* Error banner */
export const ErrorBanner = styled.div`
  background: ${LCARS.errorBg};
  color: ${LCARS.errorText};
  border: 1px solid ${LCARS.errorText};
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-size: 0.95rem;
  max-width: 680px;
  margin: 0 auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: ${MOBILE_PANEL_RADIUS};
    padding: 0.6rem 0.7rem;
    font-size: 0.84rem;
  }
`;
