import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import * as S from './ObsidianPrismSheet.styles';

const EXIT_DURATION_MS = 220;

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hasAttribute('hidden'));
}

export default function ObsidianPrismSheet({
  eyebrow,
  title,
  context,
  onBack,
  onClose,
  children,
}) {
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeTimerRef = useRef(0);
  const [closing, setClosing] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(0);

  const dismiss = useCallback((handler) => {
    if (closing) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => handler?.(), EXIT_DURATION_MS);
  }, [closing]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => sheetRef.current?.focus({ preventScroll: true }));

    return () => {
      window.clearTimeout(closeTimerRef.current);
      document.body.style.overflow = previousOverflow;
      const previousFocus = previousFocusRef.current;
      window.requestAnimationFrame(() => previousFocus?.focus?.({ preventScroll: true }));
    };
  }, []);

  useEffect(() => {
    const header = document.querySelector('#root header');
    if (!header) return undefined;

    const updateHeaderBottom = () => {
      setHeaderBottom(Math.max(0, Math.round(header.getBoundingClientRect().bottom)));
    };
    updateHeaderBottom();

    const observer = new ResizeObserver(updateHeaderBottom);
    observer.observe(header);
    window.addEventListener('resize', updateHeaderBottom);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeaderBottom);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss(onClose);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(sheetRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dismiss, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <S.Backdrop $closing={closing} onMouseDown={() => dismiss(onClose)} />
      <S.Sheet
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="obsidian-prism-sheet-title"
        tabIndex={-1}
        $closing={closing}
        style={{ '--prism-sheet-top': `${headerBottom}px` }}
      >
        <S.Header>
          <S.BackButton
            type="button"
            aria-label="Back to item overview"
            onClick={() => dismiss(onBack || onClose)}
          >
            ‹
          </S.BackButton>
          <S.Heading>
            <S.Eyebrow>{eyebrow}</S.Eyebrow>
            <S.Title id="obsidian-prism-sheet-title">{title}</S.Title>
            {context ? <S.Context>{context}</S.Context> : null}
          </S.Heading>
          <S.CloseButton
            type="button"
            aria-label="Close item editor"
            onClick={() => dismiss(onClose)}
          >
            ×
          </S.CloseButton>
        </S.Header>
        <S.Body>{children}</S.Body>
      </S.Sheet>
    </>,
    document.body,
  );
}
