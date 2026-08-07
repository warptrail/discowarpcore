import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as S from './NoteReaderModal.styles';

export default function NoteReaderModal({
  eyebrow = 'Notes',
  title = 'Untitled record',
  titleId = 'note-reader-title',
  notes = '',
  onClose,
  themeStyle,
}) {
  const readerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = readerRef.current?.querySelectorAll(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
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
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const noteId = `${titleId}-content`;

  return createPortal(
    <S.Backdrop
      data-note-reader
      style={themeStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <S.Reader
        ref={readerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={noteId}
      >
        <S.Header>
          <S.Eyebrow>{eyebrow}</S.Eyebrow>
          <S.Title id={titleId}>{title}</S.Title>
        </S.Header>
        <S.CloseButton
          ref={closeButtonRef}
          type="button"
          aria-label="Close full note"
          onClick={onClose}
        >
          ×
        </S.CloseButton>
        <S.ScrollBody tabIndex={0}>
          <S.FullNote id={noteId}>{notes}</S.FullNote>
        </S.ScrollBody>
      </S.Reader>
    </S.Backdrop>,
    document.body,
  );
}
