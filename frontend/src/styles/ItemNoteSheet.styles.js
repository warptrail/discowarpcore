import { controlStyles } from './primitives';
import styled from 'styled-components';

export const SheetBackdrop = styled.div`
  position: fixed;
  z-index: 10000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(0.7rem, 4vw, 2rem);
  background: var(--dw-surface);
  backdrop-filter: none;
  animation: note-sheet-fade 180ms ease both;

  @keyframes note-sheet-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 560px) {
    padding: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Sheet = styled.section`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(100%, 40rem);
  max-height: min(88dvh, 46rem);
  overflow: hidden;
  border: 1px solid rgba(230, 237, 243, 0.14);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.64), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  color: var(--dw-text);
  animation: note-sheet-lift 240ms cubic-bezier(0.2, 0.75, 0.25, 1) both;

  @keyframes note-sheet-lift {
    from { opacity: 0; transform: translateY(12px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 560px) {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const SheetHeader = styled.header`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem 0.72rem;
  border-bottom: 1px solid rgba(127, 215, 255, 0.22);
  background: var(--dw-surface);

  @media (max-width: 560px) {
    padding: max(0.75rem, env(safe-area-inset-top)) 0.8rem 0.7rem;
  }
`;

export const SheetEyebrow = styled.div`
  color: var(--dw-cyan);
  font: 700 0.75rem/1.2 var(--dw-font-ui);
  letter-spacing: 0.01em;
`;

export const SheetTitle = styled.h2`
  margin: 0.3rem 0 0;
  color: var(--dw-text);
  font-size: clamp(1rem, 3vw, 1.3rem);
  line-height: 1.2;
`;

export const SheetClose = styled.button`
  ${controlStyles}
  width: 44px;
  height: 44px;
  margin: -0.28rem -0.35rem 0 0;
  border: 0;
  color: rgba(216, 230, 241, 0.72);
  background: transparent;
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #d8fffa;
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    text-shadow: 0 0 10px rgba(127, 215, 255, 0.6);
  }
`;

export const NotePaper = styled.div`
  min-width: 0;
  min-height: 12rem;
  max-height: calc(min(88dvh, 46rem) - 5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(127, 215, 255, 0.42) transparent;
  -webkit-overflow-scrolling: touch;
  padding: 1.2rem 1rem 1.4rem;
  color: var(--dw-text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: 500 1rem/1.7 var(--dw-font-ui);
  background: var(--dw-surface-raised);
  padding-left: 2rem;

  &:focus-visible {
    outline: 1px solid rgba(127, 215, 255, 0.5);
    outline-offset: -3px;
  }

  @media (max-width: 560px) {
    height: 100%;
    max-height: none;
    padding: 1.15rem max(1rem, env(safe-area-inset-right)) max(2rem, env(safe-area-inset-bottom)) max(2rem, calc(env(safe-area-inset-left) + 1.4rem));
  }
`;
