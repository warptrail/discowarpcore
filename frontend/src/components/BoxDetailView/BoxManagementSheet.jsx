import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const Backdrop = styled.div`
  position: fixed;
  top: ${({ $top }) => `${$top}px`};
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 190;
  display: grid;
  justify-items: end;
  background: rgba(1, 4, 8, 0.44);
  backdrop-filter: blur(3px);

  @media (min-width: 700px) {
    align-items: center;
    justify-items: center;
    padding: 24px;
  }
`;
const Sheet = styled.aside`
  position: relative;
  width: min(620px, calc(100vw - 18px));
  height: 100%;
  overflow-y: auto;
  padding: 0 16px 16px;
  border-left: 1px solid rgba(106, 222, 214, 0.36);
  background:
    radial-gradient(circle at 100% 0, rgba(167, 139, 250, 0.12), transparent 32%),
    rgba(8, 12, 18, 0.98);
  box-shadow: -24px 0 60px rgba(0, 0, 0, 0.5);
  animation: sheet-in 240ms cubic-bezier(0.22, 1, 0.36, 1);
  @keyframes sheet-in { from { transform: translateX(24px); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { animation: none; }

  @media (min-width: 700px) {
    width: min(640px, calc(100vw - 48px));
    height: min(86vh, 760px);
    padding: 0 18px 18px;
    border: 1px solid rgba(127, 215, 255, 0.18);
    border-radius: 8px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(76, 198, 193, 0.06);
  }
`;
const Head = styled.header`
  position: relative;
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 -16px;
  padding: 16px 16px 8px 42px;
  background: rgba(8, 12, 18, 0.92);

  @media (min-width: 700px) {
    margin-inline: -18px;
    padding-inline: 42px 18px;
  }
`;
const Title = styled.h2`
  margin: 0;
  color: #edf3f6;
  font-size: clamp(1.2rem, 2.4vw, 1.55rem);
  letter-spacing: 0.015em;
`;
const TitleId = styled.span`
  margin-right: 0.42em;
  color: rgba(127, 215, 255, 0.78);
  font: 800 0.82em/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.04em;
`;
const TitleLabel = styled.span`
  color: #f4f7fa;
  font-weight: 820;
`;
const Close = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: rgba(232, 238, 243, 0.62);
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 140ms ease, background 140ms ease;

  &:hover,
  &:focus-visible {
    color: #fff;
    background: rgba(255, 255, 255, 0.07);
    outline: none;
  }
`;

export default function BoxManagementSheet({ open, boxId, title, onClose, children }) {
  const sheetRef = useRef(null);
  const [headerBottom, setHeaderBottom] = useState(0);

  useLayoutEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const header = document.querySelector('header');
    if (!header) {
      setHeaderBottom(0);
      return undefined;
    }

    const measure = () => {
      setHeaderBottom(Math.max(0, Math.round(header.getBoundingClientRect().bottom)));
    };
    measure();

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measure)
      : null;
    observer?.observe(header);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <Backdrop $top={headerBottom} onPointerDown={(event) => {
      if (!sheetRef.current?.contains(event.target)) onClose?.();
    }}>
      <Sheet ref={sheetRef} aria-label={`Manage ${title}`}>
        <Head>
          <Title><TitleId>#{boxId}</TitleId><TitleLabel>{title}</TitleLabel></Title>
          <Close type="button" onClick={onClose} aria-label="Close management sheet">×</Close>
        </Head>
        {children}
      </Sheet>
    </Backdrop>,
    document.body,
  );
}
