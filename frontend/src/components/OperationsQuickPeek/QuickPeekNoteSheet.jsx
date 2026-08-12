import { useEffect, useRef, useState } from 'react';
import ItemNoteSheet from '../ItemNoteSheet';
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
  const fullReaderOpenRef = useRef(false);
  const [fullReaderOpen, setFullReaderOpen] = useState(false);
  const noteText = String(notes || '').trim();
  const noteIsLong = noteText.length > 360 || noteText.split(/\r?\n/).length > 8;
  onCloseRef.current = onClose;
  fullReaderOpenRef.current = fullReaderOpen;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    returnButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (fullReaderOpenRef.current) return;
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
    <>
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
        <S.NotePaper
          as={noteIsLong ? undefined : 'article'}
          type={noteIsLong ? 'button' : undefined}
          aria-label={noteIsLong ? `Pick up and read full note for ${title}` : undefined}
          aria-haspopup={noteIsLong ? 'dialog' : undefined}
          aria-expanded={noteIsLong ? fullReaderOpen : undefined}
          aria-describedby={contentId}
          onClick={noteIsLong ? () => setFullReaderOpen(true) : undefined}
        >
          <S.NotePaperKicker>{eyebrow}</S.NotePaperKicker>
          <S.NotePaperBody id={contentId}>{notes}</S.NotePaperBody>
          <S.NotePaperHint>
            {noteIsLong ? 'Pick up note ↗' : title}
          </S.NotePaperHint>
        </S.NotePaper>
        <h2 id={titleId} hidden>{title}</h2>
      </S.ItemNoteSheet>

      {fullReaderOpen ? (
        <ItemNoteSheet
          itemName={title}
          note={noteText}
          eyebrow={`${eyebrow} // FULL RECORD`}
          onClose={() => setFullReaderOpen(false)}
        />
      ) : null}
    </>
  );
}
