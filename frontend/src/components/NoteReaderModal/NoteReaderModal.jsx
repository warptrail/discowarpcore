import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import useDialogFocus from '../../hooks/useDialogFocus';
import * as S from './NoteReaderModal.styles';

export default function NoteReaderModal({
  eyebrow = 'Notes',
  title = 'Untitled record',
  titleId: suppliedTitleId,
  notes = '',
  onClose,
  themeStyle,
}) {
  const readerRef = useRef(null);
  const generatedTitleId = useId();
  const titleId = suppliedTitleId || generatedTitleId;
  useDialogFocus(readerRef, onClose);

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
        tabIndex={-1}
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
