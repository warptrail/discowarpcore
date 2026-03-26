import { useContext, useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import Toast from './Toast/Toast';
import { ToastContext } from './Toast';
import useIsMobile from '../hooks/useIsMobile';
import useRandomItemFlow from '../hooks/useRandomItemFlow';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_MAX_WIDTH,
  MOBILE_NARROW_BREAKPOINT,
} from '../styles/tokens';

// ===============
// LCARS-ish Styles
// ===============

const HeaderShell = styled.header`
  position: sticky;
  top: 0;
  z-index: 200;

  /* Make it feel like a “panel” that’s part of the page, not an overlay. */
  background: linear-gradient(
    180deg,
    rgba(8, 12, 18, 0.98),
    rgba(8, 12, 18, 0.92)
  );
  backdrop-filter: blur(6px);

  border: 1px solid rgba(0, 255, 200, 0.22);
  border-radius: 14px;
  box-shadow:
    0 0 0 2px rgba(0, 255, 200, 0.08),
    0 10px 30px rgba(0, 0, 0, 0.35);

  /* Prevent content behind header from peeking through around rounded corners */
  overflow: hidden;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    border-radius: 10px;
    box-shadow:
      0 0 0 1px rgba(0, 255, 200, 0.09),
      0 4px 14px rgba(0, 0, 0, 0.28);
  }
`;

const Inner = styled.div`
  position: relative;
  padding: ${({ $condensed }) =>
    $condensed ? '0.85rem 1rem' : '1.35rem 1.25rem'};
  transition: padding 180ms ease;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: ${({ $condensed }) =>
      $condensed ? '0.42rem 0.58rem' : '0.56rem 0.64rem'};
  }
`;

const TopRow = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  justify-content: space-between;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.45rem;
    align-items: flex-start;
  }
`;

const mobileAmbientDrift = keyframes`
  0% {
    background-position:
      12% 50%,
      88% 50%,
      45% 50%;
    opacity: 0.42;
  }
  22% {
    background-position:
      18% 50%,
      82% 50%,
      47% 50%;
    opacity: 0.56;
  }
  48% {
    background-position:
      34% 50%,
      66% 50%,
      56% 50%;
    opacity: 0.92;
  }
  62% {
    background-position:
      44% 50%,
      56% 50%,
      62% 50%;
    opacity: 0.98;
  }
  82% {
    background-position:
      29% 50%,
      71% 50%,
      53% 50%;
    opacity: 0.64;
  }
  100% {
    background-position:
      12% 50%,
      88% 50%,
      45% 50%;
    opacity: 0.42;
  }
`;

const mobileAmbientSweep = keyframes`
  0%,
  70% {
    opacity: 0;
    transform: translateX(-125%);
  }
  74% {
    opacity: 0.08;
  }
  76% {
    opacity: 0.2;
  }
  79% {
    opacity: 0.11;
  }
  84% {
    opacity: 0;
    transform: translateX(125%);
  }
  100% {
    opacity: 0;
    transform: translateX(125%);
  }
`;

const MobileAmbientGap = styled.div`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: block;
    pointer-events: none;
    position: absolute;
    left: 0.58rem;
    right: 0.58rem;
    bottom: 0.14rem;
    height: 22px;
    z-index: 0;
    border-radius: 8px;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.46) 16%,
      rgba(0, 0, 0, 0.98) 48%,
      rgba(0, 0, 0, 0.38) 80%,
      rgba(0, 0, 0, 0) 100%
    );
    mask-image: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.46) 16%,
      rgba(0, 0, 0, 0.98) 48%,
      rgba(0, 0, 0, 0.38) 80%,
      rgba(0, 0, 0, 0) 100%
    );
    opacity: ${({ $show }) => ($show ? 1 : 0)};
    visibility: ${({ $show }) => ($show ? 'visible' : 'hidden')};
    transition:
      opacity 220ms ease,
      visibility 0s linear ${({ $show }) => ($show ? '0s' : '220ms')};

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(
          90% 120% at 16% 50%,
          rgba(34, 211, 238, 0.34) 0%,
          rgba(34, 211, 238, 0) 72%
        ),
        radial-gradient(
          80% 120% at 85% 52%,
          rgba(167, 139, 250, 0.3) 0%,
          rgba(167, 139, 250, 0) 74%
        ),
        linear-gradient(
          92deg,
          rgba(0, 255, 200, 0.04) 0%,
          rgba(94, 226, 255, 0.2) 46%,
          rgba(153, 124, 246, 0.16) 62%,
          rgba(0, 255, 200, 0.04) 100%
        );
      background-size:
        150% 100%,
        145% 100%,
        175% 100%;
      animation: ${mobileAmbientDrift} 7.2s linear infinite;
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        104deg,
        rgba(0, 0, 0, 0) 40%,
        rgba(88, 226, 255, 0.18) 50%,
        rgba(162, 134, 255, 0.14) 54%,
        rgba(0, 0, 0, 0) 64%
      );
      mix-blend-mode: screen;
      animation: ${mobileAmbientSweep} 10.5s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      &::before,
      &::after {
        animation: none;
      }
    }
  }
`;

const TopRowControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.36rem;
  }
`;

const Brand = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: inline-flex;
  align-items: baseline;
  gap: 0.75rem;
  min-width: 0;
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  min-width: 0;
`;

const Big = styled.div`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: 0.06em;
  font-weight: 800;
  color: rgba(240, 240, 240, 0.98);

  font-size: ${({ $condensed }) => ($condensed ? '1.15rem' : '1.65rem')};
  transition: font-size 180ms ease;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${({ $condensed }) => ($condensed ? '0.92rem' : '1.02rem')};
    letter-spacing: 0.045em;
    line-height: 1.08;
  }
`;

const Sub = styled.div`
  margin-top: 0.2rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: 0.12em;
  font-size: 0.78rem;
  opacity: 0.8;

  /* neon-ish accent */
  color: rgba(0, 255, 200, 0.85);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: 0.08rem;
    font-size: ${MOBILE_FONT_XS};
    letter-spacing: 0.06em;
    max-width: min(58vw, 280px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }
`;

const LcarsPips = styled.div`
  display: flex;
  gap: 0.35rem;
  align-items: center;
  opacity: 0.9;

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) {
    & > span:nth-child(1) {
      --pip-breathe-duration: 5.9s;
      --pip-breathe-delay: -0.9s;
      --pip-hue-duration: 6.7s;
      --pip-hue-delay: -1.6s;
      --pip-hue-timing: cubic-bezier(0.62, 0.01, 0.24, 0.99);
      --pip-h0: 18deg;
      --pip-h1: 97deg;
      --pip-h2: 169deg;
      --pip-h3: 248deg;
      --pip-h4: 328deg;
      --pip-h5: 386deg;
      --pip-flare-duration: 16.9s;
      --pip-flare-delay: -2.4s;
    }

    & > span:nth-child(2) {
      --pip-breathe-duration: 4.7s;
      --pip-breathe-delay: -1.7s;
      --pip-hue-duration: 9.9s;
      --pip-hue-delay: -3.1s;
      --pip-hue-timing: cubic-bezier(0.36, 0.08, 0.12, 0.97);
      --pip-h0: 142deg;
      --pip-h1: 214deg;
      --pip-h2: 281deg;
      --pip-h3: 349deg;
      --pip-h4: 431deg;
      --pip-h5: 504deg;
      --pip-flare-duration: 19.4s;
      --pip-flare-delay: -6.2s;
    }

    & > span:nth-child(3) {
      --pip-breathe-duration: 6.3s;
      --pip-breathe-delay: -2.9s;
      --pip-hue-duration: 7.8s;
      --pip-hue-delay: -4.2s;
      --pip-hue-timing: cubic-bezier(0.54, 0.05, 0.2, 0.98);
      --pip-h0: -76deg;
      --pip-h1: -3deg;
      --pip-h2: 84deg;
      --pip-h3: 171deg;
      --pip-h4: 262deg;
      --pip-h5: 289deg;
      --pip-flare-duration: 17.8s;
      --pip-flare-delay: -8.3s;
    }

    & > span:nth-child(4) {
      --pip-breathe-duration: 5.2s;
      --pip-breathe-delay: -0.3s;
      --pip-hue-duration: 11.2s;
      --pip-hue-delay: -5.1s;
      --pip-hue-timing: cubic-bezier(0.31, 0.16, 0.11, 0.98);
      --pip-h0: 63deg;
      --pip-h1: 138deg;
      --pip-h2: 226deg;
      --pip-h3: 307deg;
      --pip-h4: 389deg;
      --pip-h5: 445deg;
      --pip-flare-duration: 21.2s;
      --pip-flare-delay: -10.4s;
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
    opacity: 0.75;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }
`;

const pipBreath = keyframes`
  0%,
  100% {
    transform: scale(1);
    opacity: 0.86;
    box-shadow: 0 0 9px currentColor;
  }
  34% {
    transform: scale(1.08);
    opacity: 0.98;
    box-shadow: 0 0 12px currentColor;
  }
  58% {
    transform: scale(0.96);
    opacity: 0.82;
    box-shadow: 0 0 8px currentColor;
  }
  78% {
    transform: scale(1.04);
    opacity: 0.94;
    box-shadow: 0 0 11px currentColor;
  }
`;

const pipFlare = keyframes`
  0%,
  92%,
  100% {
    opacity: 0;
    transform: scale(0.78);
  }
  93.5% {
    opacity: 0.24;
    transform: scale(1.45);
  }
  94.5% {
    opacity: 0.08;
    transform: scale(1.08);
  }
  95.5% {
    opacity: 0.18;
    transform: scale(1.35);
  }
  97% {
    opacity: 0;
    transform: scale(0.82);
  }
`;

const pipHueDrift = keyframes`
  0% {
    filter: hue-rotate(var(--pip-h0, 0deg)) saturate(110%) brightness(1);
  }
  13% {
    filter: hue-rotate(var(--pip-h1, 78deg)) saturate(126%) brightness(1.12);
  }
  31% {
    filter: hue-rotate(var(--pip-h2, 152deg)) saturate(118%) brightness(1.06);
  }
  53% {
    filter: hue-rotate(var(--pip-h3, 238deg)) saturate(132%) brightness(1.14);
  }
  76% {
    filter: hue-rotate(var(--pip-h4, 314deg)) saturate(124%) brightness(1.08);
  }
  100% {
    filter: hue-rotate(var(--pip-h5, 360deg)) saturate(110%) brightness(1);
  }
`;

const Pip = styled.span`
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  color: ${({ $c }) => $c};
  background: currentColor;
  box-shadow: 0 0 12px currentColor;

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) {
    animation:
      ${pipBreath} var(--pip-breathe-duration, 5.6s) ease-in-out infinite,
      ${pipHueDrift} var(--pip-hue-duration, 14s) var(--pip-hue-timing, ease-in-out) infinite;
    animation-delay:
      var(--pip-breathe-delay, 0s),
      var(--pip-hue-delay, 0s);
    will-change: transform, opacity, box-shadow, filter;

    &::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      background: radial-gradient(
        circle,
        currentColor 0%,
        rgba(255, 255, 255, 0) 72%
      );
      opacity: 0;
      transform: scale(0.8);
      filter: blur(0.35px);
      animation: ${pipFlare} var(--pip-flare-duration, 18.5s) linear infinite;
      animation-delay: var(--pip-flare-delay, 0s);
      pointer-events: none;
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 8px;
    height: 8px;
    box-shadow: 0 0 7px currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;

    &::after {
      animation: none;
    }
  }
`;

const MobileMenuToggle = styled.button`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: ${MOBILE_CONTROL_MIN_HEIGHT};
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding: 0;
    border-radius: 8px;
    border: 1px solid rgba(0, 255, 200, 0.26);
    background: ${({ $open }) =>
      $open ? 'rgba(0, 255, 200, 0.18)' : 'rgba(20, 34, 46, 0.92)'};
    color: rgba(240, 245, 250, 0.96);
    box-shadow:
      0 0 0 1px rgba(0, 255, 200, 0.1),
      0 0 0 2px rgba(0, 255, 200, 0.05);
    appearance: none;
    cursor: pointer;
    transition:
      background 180ms ease,
      box-shadow 180ms ease,
      transform 120ms ease;

    &:hover {
      background: rgba(0, 255, 200, 0.2);
      box-shadow:
        0 0 0 1px rgba(0, 255, 200, 0.18),
        0 0 14px rgba(0, 255, 200, 0.2);
    }

    &:active {
      transform: scale(0.98);
    }

    &:focus-visible {
      outline: 2px solid rgba(0, 255, 200, 0.55);
      outline-offset: 2px;
    }
  }
`;

const MobileMenuGlyph = styled.span`
  position: relative;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: ${({ $open }) => ($open ? 'transparent' : 'currentColor')};
  transition: background 140ms ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    width: 16px;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
    transition:
      transform 180ms ease,
      top 180ms ease;
  }

  &::before {
    top: ${({ $open }) => ($open ? '0' : '-5px')};
    transform: ${({ $open }) => ($open ? 'rotate(45deg)' : 'none')};
  }

  &::after {
    top: ${({ $open }) => ($open ? '0' : '5px')};
    transform: ${({ $open }) => ($open ? 'rotate(-45deg)' : 'none')};
  }
`;

const NavRow = styled.nav`
  margin-top: ${({ $condensed }) => ($condensed ? '0.7rem' : '1.1rem')};
  transition: margin-top 180ms ease;

  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.56rem;
  align-items: stretch;

  @media (min-width: 1220px) {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.6rem;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: 0.45rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.38rem;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const MobileNavPanel = styled.div`
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    position: relative;
    z-index: 1;
    overflow: hidden;
    max-height: ${({ $open }) => ($open ? '280px' : '0')};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    transition:
      max-height 240ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 180ms ease,
      visibility 0s linear ${({ $open }) => ($open ? '0s' : '240ms')};
  }
`;

const navControlStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.32rem, 0.24rem + 0.18vw, 0.48rem);
  padding-block: 0.55rem;
  padding-inline: clamp(0.95rem, 0.78rem + 0.22vw, 1.1rem);
  width: 100%;
  min-width: 0;
  min-height: 2.35rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 1.14;
  text-align: center;

  border-radius: 10px;
  text-decoration: none;

  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: clamp(0.018em, 0.01em + 0.03vw, 0.04em);
  font-weight: 700;
  font-size: clamp(0.74rem, 0.54rem + 0.25vw, 0.84rem);

  color: rgba(240, 240, 240, 0.95);
  background: rgba(20, 34, 46, 0.9);
  border: 1px solid rgba(0, 255, 200, 0.22);
  box-shadow: 0 0 0 2px rgba(0, 255, 200, 0.06);

  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;

  &:hover {
    background: rgba(0, 255, 200, 0.14);
    box-shadow:
      0 0 0 2px rgba(0, 255, 200, 0.12),
      0 0 18px rgba(0, 255, 200, 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    justify-content: center;
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    padding: 0.36rem 0.34rem;
    border-radius: 8px;
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.035em;
    box-shadow: 0 0 0 1px rgba(0, 255, 200, 0.08);
  }
`;

const NavButton = styled(Link)`
  ${navControlStyles}
`;

const NavActionButton = styled.button`
  ${navControlStyles}
  appearance: none;
  cursor: pointer;
`;

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 200, 0),
    rgba(0, 255, 200, 0.25),
    rgba(0, 255, 200, 0)
  );
`;

const ToastRow = styled.div`
  padding: 0 1.25rem 1rem 1.25rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0 0.58rem 0.58rem;
  }
`;

export default function Header() {
  const [condensed, setCondensed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile(MOBILE_MAX_WIDTH);
  const mobileControlsId = 'mobile-header-controls';

  const toastCtx = useContext(ToastContext);
  const toast = toastCtx?.toast ?? null;
  const hideToast = toastCtx?.hideToast;
  const { runRandomItem } = useRandomItemFlow();

  const handleToastClose = () => {
    if (typeof toast?.onClose === 'function') {
      toast.onClose();
      return;
    }

    if (typeof hideToast === 'function') {
      hideToast();
    }
  };

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((open) => !open);
  };

  const handleNavSelection = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleRandomSelection = () => {
    runRandomItem();
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <HeaderShell>
      <Inner $condensed={condensed}>
        <TopRow>
          <Brand to="/">
            <Title>
              <Big $condensed={condensed}>DISCO WARP CORE</Big>
              <Sub>
                CARGO NETWORK // INVENTORY MATRIX // ONLINE
              </Sub>
            </Title>
          </Brand>

          <TopRowControls>
            <LcarsPips aria-hidden="true">
              <Pip $c="#ff7a18" />
              <Pip $c="#22d3ee" />
              <Pip $c="#a78bfa" />
              <Pip $c="#00ffcc" />
            </LcarsPips>

            <MobileMenuToggle
              type="button"
              $open={isMobileMenuOpen}
              aria-expanded={isMobileMenuOpen}
              aria-controls={mobileControlsId}
              aria-label={isMobileMenuOpen ? 'Collapse navigation menu' : 'Expand navigation menu'}
              onClick={handleToggleMobileMenu}
            >
              <MobileMenuGlyph $open={isMobileMenuOpen} aria-hidden="true" />
            </MobileMenuToggle>
          </TopRowControls>
        </TopRow>

        <MobileAmbientGap
          aria-hidden="true"
          $show={isMobile && !isMobileMenuOpen}
        />

        <MobileNavPanel
          id={mobileControlsId}
          $open={!isMobile || isMobileMenuOpen}
          aria-hidden={isMobile ? !isMobileMenuOpen : undefined}
          inert={isMobile && !isMobileMenuOpen ? true : undefined}
        >
          <NavRow $condensed={condensed}>
            <NavButton to="/" onClick={handleNavSelection}>🚀 Operations</NavButton>
            <NavButton to="/retrieval" onClick={handleNavSelection}>🔎 Retrieval</NavButton>
            <NavButton to="/intake" onClick={handleNavSelection}>📲 Intake</NavButton>
            <NavButton to="/import" onClick={handleNavSelection}>📥 Import</NavButton>
            <NavButton to="/all-items" onClick={handleNavSelection}>🧾 All Items</NavButton>
            <NavButton to="/logs" onClick={handleNavSelection}>🛰️ Logs</NavButton>
            <NavActionButton type="button" onClick={handleRandomSelection}>
              🎲 Random
            </NavActionButton>
          </NavRow>
        </MobileNavPanel>
      </Inner>

      <Divider />

      <ToastRow>
        <Toast
          open={!!toast}
          title={toast?.title}
          message={toast?.message}
          content={toast?.content}
          variant={toast?.variant ?? 'info'}
          actions={toast?.actions ?? []}
          onClose={toast ? handleToastClose : undefined}
          showIdle
          idleIcon="📦"
          idleText="Console ready. Awaiting orders…"
        />
      </ToastRow>
    </HeaderShell>
  );
}
