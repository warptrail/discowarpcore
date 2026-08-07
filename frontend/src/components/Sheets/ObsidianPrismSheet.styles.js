import styled, { css, keyframes } from 'styled-components';

const riseAndSettle = keyframes`
  0% { opacity: 0; translate: 0 104%; }
  68% { opacity: 1; translate: 0 -8px; }
  84% { translate: 0 3px; }
  100% { opacity: 1; translate: 0 0; }
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
  color: #e8edf4;
  background: rgba(9, 13, 19, 0.985);
  border-top: 1px solid rgba(99, 203, 196, 0.34);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 -18px 48px rgba(0, 0, 0, 0.52);
  animation: ${({ $closing }) =>
    $closing
      ? css`${descend} 220ms cubic-bezier(0.58, 0.02, 0.82, 0.42) both`
      : css`${riseAndSettle} 560ms cubic-bezier(0.16, 0.82, 0.24, 1) both`};
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
    border: 1px solid rgba(99, 203, 196, 0.28);
    border-radius: 8px;
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
  grid-template-columns: 40px minmax(0, 1fr) 40px;
  align-items: start;
  gap: 0.35rem;
  min-height: 72px;
  padding: 0.72rem 0.28rem 0.68rem;
  border-bottom: 1px solid rgba(166, 181, 203, 0.16);
  background:
    radial-gradient(circle at 52% -80%, rgba(87, 211, 202, 0.14), transparent 68%),
    rgba(12, 17, 24, 0.96);

  @media (min-width: 600px) {
    min-height: 78px;
    padding: 0.78rem 0.42rem 0.72rem;
  }
`;

const divot = css`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  color: rgba(224, 233, 243, 0.7);
  background: transparent;
  font: 500 1.5rem/1 system-ui, sans-serif;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease;

  &:hover {
    color: #f3fbff;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(87, 211, 202, 0.72);
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
  color: rgba(117, 221, 213, 0.76);
  font: 780 0.58rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`;

export const Title = styled.h2`
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #f0f4f8;
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
  color: rgba(213, 222, 234, 0.58);
  font: 650 0.64rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
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
