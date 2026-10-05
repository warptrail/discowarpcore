import { controlStyles } from '../../styles/primitives';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import useDialogFocus from '../../hooks/useDialogFocus';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';

const Backdrop = styled.div`
  position: fixed;
  top: ${({ $top }) => `${$top}px`};
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 190;
  display: grid;
  justify-items: end;
  min-height: 0;
  background: rgba(3, 6, 10, 0.72);

  @media (min-width: 600px) {
    align-items: center;
    justify-items: center;
    padding: 16px;
  }
`;
const Sheet = styled.aside`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 16px 16px;
  border: 0;
  border-top: 3px solid var(--box-primary, #8A8175);
  background: var(--dw-surface);
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.3);
  animation: sheet-in 240ms cubic-bezier(0.22, 1, 0.36, 1);
  @keyframes sheet-in { from { transform: translateX(24px); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { animation: none; }

  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }

  @media (min-width: 600px) {
    width: min(620px, 100%);
    height: auto;
    max-height: min(100%, 760px);
    padding: 0 16px 16px;
    border: 1px solid var(--dw-border);
    border-top: 3px solid var(--box-primary, #8A8175);
    border-radius: var(--dw-radius);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.36);
  }
`;
const Head = styled.header`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 -16px;
  padding: 12px 48px 8px 16px;
  background: var(--dw-surface);
  border-bottom: 1px solid rgba(230, 237, 243, 0.1);

  @media (min-width: 600px) {
    margin-inline: -16px;
    padding-inline: 16px 52px;
  }
`;
const Title = styled.h2`
  margin: 0;
  color: var(--dw-text);
  font-size: clamp(1.2rem, 2.4vw, 1.55rem);
  letter-spacing: 0.01em;
  min-width: 0;
  overflow-wrap: anywhere;
`;
const TitleId = styled.span`
  margin-right: 0.42em;
  color: var(--box-primary, #8A8175);
  font: 700 0.82em/1 var(--dw-font-data);
  letter-spacing: 0.01em;
`;
const TitleLabel = styled.span`
  color: var(--dw-text);
  font-weight: 700;
`;
const Close = styled.button`
  ${controlStyles}
  position: absolute;
  top: 6px;
  right: 8px;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--dw-radius-sm);
  background: transparent;
  color: var(--dw-text-secondary);
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 140ms ease, background 140ms ease;

  &:hover,
  &:focus-visible {
    color: var(--dw-cyan);
    background: var(--dw-surface-raised);
    outline: 2px solid var(--dw-cyan);
    outline-offset: -2px;
  }
`;

export default function BoxManagementSheet({ open, boxId, title, onClose, children }) {
  const sheetRef = useRef(null);
  const [headerBottom, setHeaderBottom] = useState(0);
  useDialogFocus(sheetRef, onClose, open);

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

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <Backdrop $top={headerBottom} onPointerDown={(event) => {
      if (!sheetRef.current?.contains(event.target)) onClose?.();
    }}>
      <Sheet style={getBoxThemeCssVars(getBoxTheme(boxId))} ref={sheetRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label={`Manage ${title}`}>
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
