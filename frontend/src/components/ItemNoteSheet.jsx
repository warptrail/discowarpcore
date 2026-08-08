import { useEffect } from 'react';
import * as S from '../styles/ItemNoteSheet.styles';

export default function ItemNoteSheet({ itemName, note, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <S.SheetBackdrop
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <S.Sheet
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-note-sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <S.SheetHeader>
          <div>
            <S.SheetEyebrow>ITEM NOTES</S.SheetEyebrow>
            <S.SheetTitle id="item-note-sheet-title">{itemName || 'Item note'}</S.SheetTitle>
          </div>
          <S.SheetClose type="button" aria-label="Close note" onClick={onClose}>
            ×
          </S.SheetClose>
        </S.SheetHeader>
        <S.NotePaper>{note}</S.NotePaper>
      </S.Sheet>
    </S.SheetBackdrop>
  );
}
