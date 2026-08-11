import { useEffect, useRef } from 'react';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekNoteSheet({
  title,
  notes,
  eyebrow = 'Notes',
  titleId,
  contentId,
  returnLabel = 'Return to item',
  onClose,
}) {
  const returnButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    returnButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCloseRef.current?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <S.ItemNoteSheet
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <S.NoteFocusToolbar>
        <S.NoteItemsReturn
          ref={returnButtonRef}
          type="button"
          aria-label={returnLabel}
          title={returnLabel}
          onClick={onClose}
        >
          <span aria-hidden="true">←</span>
        </S.NoteItemsReturn>
      </S.NoteFocusToolbar>
      <S.NotePaper as="article" aria-describedby={contentId}>
        <S.NotePaperKicker>{eyebrow}</S.NotePaperKicker>
        <S.NotePaperBody id={contentId}>{notes}</S.NotePaperBody>
        <S.NotePaperHint>{title}</S.NotePaperHint>
      </S.NotePaper>
      <h2 id={titleId} hidden>{title}</h2>
    </S.ItemNoteSheet>
  );
}
