import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import useDialogFocus from '../../hooks/useDialogFocus';

import * as S from './ObsidianPrismSheet.styles';

const EXIT_DURATION_MS = 220;

export default function ObsidianPrismSheet({
  eyebrow,
  title,
  context,
  onBack,
  onClose,
  backLabel = 'Back',
  closeLabel = 'Close',
  children,
}) {
  const sheetRef = useRef(null);
  const titleId = useId();
  const closeTimerRef = useRef(0);
  const [closing, setClosing] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(0);

  const dismiss = useCallback((handler) => {
    if (closing) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => handler?.(), EXIT_DURATION_MS);
  }, [closing]);

  useDialogFocus(sheetRef, () => dismiss(onClose));
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  useEffect(() => {
    const header = document.querySelector('#root header');
    if (!header) return undefined;

    const updateHeaderBottom = () => {
      setHeaderBottom(Math.min(window.innerHeight * 0.4, Math.max(0, Math.round(header.getBoundingClientRect().bottom))));
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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <S.Backdrop $closing={closing} onMouseDown={() => dismiss(onClose)} />
      <S.Sheet
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        $closing={closing}
        style={{ '--prism-sheet-top': `${headerBottom}px` }}
      >
        <S.Header>
          <S.BackButton
            type="button"
            aria-label={backLabel}
            onClick={() => dismiss(onBack || onClose)}
          >
            ‹
          </S.BackButton>
          <S.Heading>
            <S.Eyebrow>{eyebrow}</S.Eyebrow>
            <S.Title id={titleId}>{title}</S.Title>
            {context ? <S.Context>{context}</S.Context> : null}
          </S.Heading>
          <S.CloseButton
            type="button"
            aria-label={closeLabel}
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
