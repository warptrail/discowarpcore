import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import Toast from './Toast/Toast';
import { ToastContext } from './Toast';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
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
  padding: ${({ $condensed }) =>
    $condensed ? '0.85rem 1rem' : '1.35rem 1.25rem'};
  transition: padding 180ms ease;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: ${({ $condensed }) =>
      $condensed ? '0.42rem 0.58rem' : '0.56rem 0.64rem'};
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  justify-content: space-between;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.45rem;
    align-items: flex-start;
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

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.24rem;
    opacity: 0.75;
  }

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }
`;

const Pip = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ $c }) => $c};
  box-shadow: 0 0 12px ${({ $c }) => $c};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 8px;
    height: 8px;
    box-shadow: 0 0 7px ${({ $c }) => $c};
  }
`;

const NavRow = styled.nav`
  margin-top: ${({ $condensed }) => ($condensed ? '0.7rem' : '1.1rem')};
  transition: margin-top 180ms ease;

  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;

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

const NavButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;

  border-radius: 10px;
  text-decoration: none;

  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: 0.06em;
  font-weight: 700;
  font-size: 0.88rem;

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

const FauxButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;

  border-radius: 10px;

  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  letter-spacing: 0.06em;
  font-weight: 700;
  font-size: 0.88rem;

  color: rgba(240, 240, 240, 0.55);
  background: rgba(20, 34, 46, 0.55);
  border: 1px dashed rgba(0, 255, 200, 0.18);
  box-shadow: 0 0 0 2px rgba(0, 255, 200, 0.04);

  cursor: not-allowed;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: none;
  }
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
  const location = useLocation();
  const isRetrievalRoute = location.pathname === '/retrieval';

  const toastCtx = useContext(ToastContext);
  const toast = toastCtx?.toast ?? null;
  const hideToast = toastCtx?.hideToast;

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

          <LcarsPips aria-hidden="true">
            <Pip $c="#ff7a18" />
            <Pip $c="#22d3ee" />
            <Pip $c="#a78bfa" />
            <Pip $c="#00ffcc" />
          </LcarsPips>
        </TopRow>

        <NavRow $condensed={condensed}>
          <NavButton to="/">🚀 Operations</NavButton>
          <NavButton to="/retrieval">🔎 Retrieval</NavButton>
          <NavButton to="/intake">📲 Intake</NavButton>
          <NavButton to="/all-items">🧾 All Items</NavButton>

          {/* Placeholder button (wire later) */}
          <FauxButton type="button" disabled>
            🛰️ Logs
          </FauxButton>
        </NavRow>
      </Inner>

      <Divider />

      {!isRetrievalRoute ? (
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
      ) : null}
    </HeaderShell>
  );
}
