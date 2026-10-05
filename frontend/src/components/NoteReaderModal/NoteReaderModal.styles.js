import styled from 'styled-components';

const noteTone = 'var(--box-primary-rgb, 90, 205, 219)';

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 320;
  display: grid;
  place-items: center;
  padding: clamp(0.65rem, 3vw, 1.5rem);
  background: rgba(2, 5, 8, 0.76);
  backdrop-filter: blur(7px);
`;

export const Reader = styled.section`
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(42rem, 100%);
  max-height: calc(100dvh - clamp(1.3rem, 6vw, 3rem));
  overflow: hidden;
  color: var(--dw-text);
  background: var(--dw-surface);
  border: 1px solid var(--dw-border);
  border-top: 2px solid var(--dw-violet);
  border-radius: var(--dw-radius);
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.5);
`;

export const Header = styled.header`
  min-width: 0;
  padding: 0.82rem 3rem 0.68rem 0.92rem;
  border-bottom: 1px solid rgba(${noteTone}, 0.26);
`;

export const Eyebrow = styled.span`
  display: block;
  margin-bottom: 0.18rem;
  color: rgba(${noteTone}, 0.96);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`;

export const Title = styled.h2`
  margin: 0;
  color: var(--dw-text);
  font-size: clamp(1rem, 4vw, 1.24rem);
  line-height: 1.25;
  overflow-wrap: anywhere;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 0.32rem;
  right: 0.36rem;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  color: rgba(205, 215, 228, 0.8);
  background: transparent;
  border: 0;
  font: 700 1rem/1 ui-monospace, monospace;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: white;
    outline: 1px solid rgba(${noteTone}, 0.72);
    outline-offset: -5px;
  }
`;

export const ScrollBody = styled.div`
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: clamp(0.92rem, 4vw, 1.4rem);
  scrollbar-gutter: stable;

  &:focus-visible {
    outline: 1px solid rgba(${noteTone}, 0.42);
    outline-offset: -4px;
  }
`;

export const FullNote = styled.p`
  margin: 0;
  color: rgba(225, 233, 242, 0.95);
  font-size: clamp(0.94rem, 3.7vw, 1.04rem);
  line-height: 1.68;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;
