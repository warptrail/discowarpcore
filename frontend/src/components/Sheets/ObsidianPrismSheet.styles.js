import styled, { css, keyframes } from 'styled-components';

const riseAndSettle = keyframes`
  from { opacity: 0; translate: 0 32px; }
  to { opacity: 1; translate: 0 0; }
`;

const descend = keyframes`
  from { opacity: 1; translate: 0 0; }
  to { opacity: 0; translate: 0 104%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 168;
  background: rgba(3, 6, 10, 0.56);
  backdrop-filter: blur(4px) saturate(0.82);
  animation: ${({ $closing }) => ($closing ? fadeOut : fadeIn)}
    ${({ $closing }) => ($closing ? '220ms' : '200ms')} ease both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Sheet = styled.section`
  position: fixed;
  top: var(--prism-sheet-top, 0px);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 176;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  color: var(--dw-text);
  background: var(--dw-surface);
  border-top: 2px solid var(--dw-amber);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 -18px 48px rgba(0, 0, 0, 0.52);
  animation: ${({ $closing }) =>
    $closing
      ? css`${descend} 220ms cubic-bezier(0.58, 0.02, 0.82, 0.42) both`
      : css`${riseAndSettle} 260ms cubic-bezier(0.16, 0.82, 0.24, 1) both`};
  will-change: translate, opacity;

  &:focus {
    outline: none;
  }

  @media (min-width: 600px) {
    top: calc(var(--prism-sheet-top, 0px) + 10px);
    right: auto;
    bottom: 12px;
    left: 50%;
    width: min(760px, calc(100vw - 24px));
    border: 1px solid var(--dw-border);
    border-radius: 16px 8px 8px 8px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.045),
      0 22px 64px rgba(0, 0, 0, 0.62);
    transform: translateX(-50%);
  }

  @media (min-width: 1120px) {
    width: min(880px, calc(100vw - 48px));
    bottom: 18px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Header = styled.header`
  position: relative;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: start;
  gap: 0.35rem;
  min-height: 72px;
  padding: 0.72rem 0.28rem 0.68rem;
  border-bottom: 1px solid var(--dw-border-soft);
  background: var(--dw-surface);

  @media (min-width: 600px) {
    min-height: 78px;
    padding: 0.78rem 0.42rem 0.72rem;
  }
`;

const divot = css`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  color: var(--dw-text-secondary);
  background: transparent;
  font: 500 1.5rem/1 system-ui, sans-serif;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease;

  &:hover {
    color: var(--dw-text);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: -3px;
  }
`;

export const BackButton = styled.button`
  ${divot}
  justify-self: start;
`;

export const CloseButton = styled.button`
  ${divot}
  justify-self: end;
  font-size: 1.12rem;
`;

export const Heading = styled.div`
  display: grid;
  align-self: center;
  gap: 0.2rem;
  min-width: 0;
  padding-top: 0.06rem;
`;

export const Eyebrow = styled.span`
  color: var(--dw-teal);
  font: 700 0.7rem/1.2 var(--dw-font-data);
  letter-spacing: 0.13em;
  text-transform: uppercase;
`;

export const Title = styled.h2`
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--dw-text);
  font-size: clamp(1.08rem, 4vw, 1.42rem);
  font-weight: 720;
  line-height: 1.14;
  letter-spacing: -0.018em;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Context = styled.span`
  min-width: 0;
  overflow: hidden;
  color: var(--dw-text-muted);
  font: 500 0.8rem/1.4 var(--dw-font-ui);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Body = styled.div`
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.72rem max(0.72rem, env(safe-area-inset-right))
    max(1rem, env(safe-area-inset-bottom)) max(0.72rem, env(safe-area-inset-left));
  scrollbar-color: rgba(126, 211, 205, 0.34) transparent;

  @media (min-width: 600px) {
    padding: 0.9rem 1rem 1.1rem;
  }

  @media (min-width: 1120px) {
    padding-inline: 1.2rem;
  }
`;
