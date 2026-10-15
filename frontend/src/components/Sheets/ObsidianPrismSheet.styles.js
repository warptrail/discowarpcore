import styled, { css, keyframes } from 'styled-components';

const riseAndSettle = keyframes`
  from { opacity: 0; translate: 0 32px; }
  to { opacity: 1; translate: 0 0; }
`;

const slideUp = keyframes`
  from { translate: 0 100%; }
  to { translate: 0 0; }
`;

const descend = keyframes`
  from { opacity: 1; translate: 0 var(--prism-sheet-pull-y, 0px); }
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

const dialogIn = keyframes`
  from { opacity: 0; scale: 0.985; }
  to { opacity: 1; scale: 1; }
`;

const dialogOut = keyframes`
  from { opacity: 1; scale: 1; }
  to { opacity: 0; scale: 0.985; }
`;

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ $layer = 0 }) => 168 + $layer * 140};
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
  z-index: ${({ $layer = 0 }) => 176 + $layer * 140};
  display: grid;
  grid-template-rows: ${({ $footer }) => $footer ? 'auto minmax(0, 1fr) auto' : 'auto minmax(0, 1fr)'};
  min-width: 0;
  overflow: hidden;
  color: var(--dw-text);
  background: var(--prism-sheet-surface, var(--dw-surface));
  border-top: 2px solid var(--prism-sheet-top-edge, var(--dw-amber));
  box-shadow:
    var(--prism-sheet-glow, 0 0 0 transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.045),
    0 -18px 48px rgba(0, 0, 0, 0.52);
  animation: ${({ $closing, $slideFromBottom, $openingDurationMs = 260 }) =>
    $closing
      ? css`${descend} 220ms cubic-bezier(0.58, 0.02, 0.82, 0.42) both`
      : css`${$slideFromBottom ? slideUp : riseAndSettle} ${$openingDurationMs}ms cubic-bezier(0.16, 0.82, 0.24, 1) both`};
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
    border: 1px solid var(--prism-sheet-border, var(--dw-border));
    border-radius: 16px 8px 8px 8px;
    box-shadow:
      var(--prism-sheet-glow, 0 0 0 transparent),
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

  ${({ $swipeToClose, $closing }) => $swipeToClose && css`
    translate: 0 var(--prism-sheet-pull-y, 0px);
    transition: translate 220ms cubic-bezier(0.22, 1, 0.36, 1);
    &[data-prism-sheet-pulling='true'] { transition: none; }
    ${!$closing && css`&[data-prism-sheet-interacted='true'] { animation: none; }`}
    @media (prefers-reduced-motion: reduce) { transition: none; }
  `}

  ${({ $centered, $closing, $openingDurationMs = 260 }) => $centered && css`
    && {
      top: 50%;
      right: auto;
      bottom: auto;
      left: 50%;
      width: min(720px, calc(100vw - 64px));
      height: min(760px, calc(100dvh - 80px));
      translate: -50% -50%;
      transform: none;
      border: 1px solid var(--prism-sheet-border, var(--dw-border));
      border-radius: 12px 8px 8px 8px;
      animation: ${$closing ? dialogOut : dialogIn} ${$closing ? 220 : $openingDurationMs}ms ease both;
      will-change: opacity, scale;
      @media (prefers-reduced-motion: reduce) { animation: none; }
    }
  `}

`;

export const Header = styled.header`
  position: relative;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: start;
  gap: 0.35rem;
  min-height: 72px;
  padding: 0.72rem 0.28rem 0.68rem;
  border-bottom: 1px solid var(--prism-sheet-divider, var(--dw-border-soft));
  background: var(--prism-sheet-header-surface, var(--dw-surface));

  ${({ $swipeToClose }) => $swipeToClose && css`
    touch-action: none;
    user-select: none;
    cursor: grab;
    button, a, input, textarea, select { touch-action: manipulation; }
  `}

  @media (min-width: 600px) {
    min-height: 78px;
    padding: 0.78rem 0.42rem 0.72rem;
  }
  ${({ $compact, $hasBack }) => $compact && css`
    grid-template-columns: ${$hasBack ? '44px minmax(0, 1fr) 44px' : 'minmax(0, 1fr) 44px'};
    align-items: center; min-height: 56px; padding: 4px 8px 4px 12px;
    @media (min-width: 600px) { min-height: 56px; padding: 4px 8px 4px 12px; }
  `}
  ${({ $headerVariant }) => $headerVariant === 'mini' && css`
    && { min-height: 44px; padding: 0 4px 0 12px; }
    h2 { font-size: 1rem; }
  `}
  ${({ $headerVariant }) => $headerVariant === 'handle' && css`
    && { min-height: 16px; height: 16px; padding: 0; border-bottom: 0; z-index: 2; }
    &::after { content: ''; position: absolute; top: 6px; left: 50%; width: 32px; height: 3px;
      transform: translateX(-50%); border-radius: 2px;
      background: var(--prism-sheet-divider, var(--dw-border-soft)); pointer-events: none; }
    > button:last-child { position: absolute; top: 21px; right: 4px; }
  `}
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

  ${({ $fill }) => $fill && css`
    display: flex; flex-direction: column; overflow: hidden; padding: 0;
    @media (min-width: 600px) { padding: 0; }
    @media (min-width: 1120px) { padding: 0; }
  `}
`;
