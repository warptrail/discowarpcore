import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import Toast from './Toast/Toast';
import { ToastContext } from './Toast';

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
`;

const Inner = styled.div`
  padding: ${({ $condensed }) =>
    $condensed ? '0.85rem 1rem' : '1.35rem 1.25rem'};
  transition: padding 180ms ease;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  justify-content: space-between;
`;

const Brand = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: inline-flex;
  align-items: baseline;
  gap: 0.75rem;
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.05;
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
`;

const LcarsPips = styled.div`
  display: flex;
  gap: 0.35rem;
  align-items: center;
  opacity: 0.9;
`;

const Pip = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ $c }) => $c};
  box-shadow: 0 0 12px ${({ $c }) => $c};
`;

const NavRow = styled.nav`
  margin-top: ${({ $condensed }) => ($condensed ? '0.7rem' : '1.1rem')};
  transition: margin-top 180ms ease;

  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
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
`;

function routeTag(pathname) {
  if (pathname === '/') return 'HOME';
  if (pathname.startsWith('/boxes/')) return 'BOX DETAIL';
  if (pathname === '/create-box') return 'CREATE BOX';
  if (pathname === '/all-items') return 'ALL ITEMS';
  if (pathname.startsWith('/items/')) return 'ITEM DETAIL';
  return 'NAV';
}

export default function Header() {
  const [condensed, setCondensed] = useState(false);
  const location = useLocation();

  const toastCtx = useContext(ToastContext);
  const toast = toastCtx?.toast ?? null;
  const hideToast = toastCtx?.hideToast;

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
                LCARS // INVENTORY CONSOLE // {routeTag(location.pathname)}
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
          <NavButton to="/">🗂️ Boxes</NavButton>
          <NavButton to="/create-box">📦 New Box</NavButton>
          <NavButton to="/all-items">🧾 All Items</NavButton>

          {/* Filler buttons (wire later) */}
          <FauxButton type="button" disabled>
            🧨 Orphaned
          </FauxButton>
          <FauxButton type="button" disabled>
            ⚙️ Settings
          </FauxButton>
          <FauxButton type="button" disabled>
            🛰️ Logs
          </FauxButton>
        </NavRow>
      </Inner>

      <Divider />

      {/* Inline “Toast” (status strip) lives here permanently */}
      <ToastRow>
        <Toast
          open={!!toast}
          title={toast?.title}
          message={toast?.message}
          variant={toast?.variant ?? 'info'}
          actions={toast?.actions ?? []}
          onClose={typeof hideToast === 'function' ? hideToast : undefined}
          showIdle
          idleIcon="📦"
          idleText="Console ready. Awaiting orders…"
        />
      </ToastRow>
    </HeaderShell>
  );
}
