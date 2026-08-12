import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as S from '../styles/ItemNoteSheet.styles';

export default function ItemNoteSheet({
  itemName,
  note,
  eyebrow = 'ITEM NOTES // FULL RECORD',
  closeLabel = 'Put note down',
  onClose,
}) {
  const titleId = useId();
  const closeButtonRef = useRef(null);
  const paperRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    const previousRootOverflow = document.documentElement.style.overflow;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusStops = [closeButtonRef.current, paperRef.current].filter(Boolean);
      if (!focusStops.length) return;
      const currentIndex = focusStops.indexOf(document.activeElement);
      const nextIndex = event.shiftKey
        ? currentIndex <= 0 ? focusStops.length - 1 : currentIndex - 1
        : currentIndex === focusStops.length - 1 ? 0 : currentIndex + 1;
      event.preventDefault();
      focusStops[nextIndex].focus({ preventScroll: true });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      Object.assign(document.body.style, previousBodyStyles);
      document.documentElement.style.overflow = previousRootOverflow;
      window.scrollTo({ top: scrollY, behavior: 'auto' });
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <S.SheetBackdrop
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <S.Sheet
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <S.SheetHeader>
          <div>
            <S.SheetEyebrow>{eyebrow}</S.SheetEyebrow>
            <S.SheetTitle id={titleId}>{itemName || 'Note'}</S.SheetTitle>
          </div>
          <S.SheetClose
            ref={closeButtonRef}
            type="button"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
          >
            ×
          </S.SheetClose>
        </S.SheetHeader>
        <S.NotePaper ref={paperRef} tabIndex={0} aria-label="Full note text">
          {note}
        </S.NotePaper>
      </S.Sheet>
    </S.SheetBackdrop>,
    document.body,
  );
}
