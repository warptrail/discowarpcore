// src/styles/BoxDetailView.styles.js
import styled, { keyframes } from 'styled-components';

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
  background: ${LCARS.bg};
  color: ${LCARS.text};

  /* IMPORTANT for wrapping children correctly */
  min-width: 0;
`;

/* Optional inner content area if you want a max width on big screens */
export const Content = styled.div`
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  min-width: 0; /* critical for preventing flex/grid overflow */
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
  border-top: 3px solid ${LCARS.accent};
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
`;
