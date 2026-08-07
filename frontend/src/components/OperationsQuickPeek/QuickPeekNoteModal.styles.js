import styled from 'styled-components';

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 260;
  display: grid;
  place-items: center;
  padding: clamp(0.75rem, 3vw, 1.5rem);
  background: rgba(2, 5, 8, 0.68);
  backdrop-filter: blur(5px);
`;

export const Reader = styled.section`
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(36rem, 100%);
  height: min(46rem, calc(100dvh - clamp(1.5rem, 6vw, 3rem)));
  max-height: calc(100dvh - clamp(1.5rem, 6vw, 3rem));
  overflow: hidden;
  color: rgba(232, 239, 246, 0.96);
  background:
    linear-gradient(135deg, rgba(var(--box-tone-rgb, 90, 205, 219), 0.1), transparent 44%),
    rgba(7, 11, 16, 0.985);
  border: 1px solid rgba(var(--box-tone-rgb, 90, 205, 219), 0.58);
  border-radius: 8px;
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.05),
    0 18px 60px rgba(0, 0, 0, 0.72),
    0 0 28px rgba(var(--box-tone-rgb, 90, 205, 219), 0.12);
`;

export const Header = styled.header`
  min-width: 0;
  padding: 0.9rem 2.35rem 0.72rem 1rem;
  border-bottom: 1px solid rgba(var(--box-tone-rgb, 90, 205, 219), 0.28);
`;

export const Eyebrow = styled.span`
  display: block;
  margin-bottom: 0.22rem;
  color: rgba(var(--box-tone-rgb, 90, 205, 219), 0.96);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`;

export const Title = styled.h2`
  margin: 0;
  overflow: hidden;
  color: rgba(238, 243, 249, 0.96);
  font-size: clamp(1rem, 4vw, 1.2rem);
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 0.36rem;
  right: 0.42rem;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: rgba(205, 215, 228, 0.78);
  background: transparent;
  border: 0;
  font: 700 1rem/1 ui-monospace, monospace;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: white;
    outline: none;
  }
`;

export const ScrollBody = styled.div`
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: clamp(1rem, 4vw, 1.35rem);
  scrollbar-gutter: stable;
`;

export const FullNote = styled.p`
  margin: 0;
  color: rgba(225, 233, 242, 0.94);
  font-size: clamp(0.92rem, 3.7vw, 1rem);
  line-height: 1.62;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;
