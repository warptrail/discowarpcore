import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import useDialogFocus from '../../hooks/useDialogFocus';
import * as S from './QuickPeekItemEditor.styles';

// One presentation for item and box field editors; each owns its save behavior.
export default function QuickPeekFieldSheet({ label, children, onClose, busy = false,
  onBackdrop, onKeyDown, manageFocus = false, inline = false, heading = label, centered = false }) {
  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, onClose, manageFocus);
  useEffect(() => {
    if (!manageFocus) return undefined;
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector('[data-field-autofocus]')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [manageFocus]);
  const content = (
    <S.EditorOverlay onMouseDown={(event) => {
      if (event.target === event.currentTarget) onBackdrop?.();
    }}>
      <S.EditorDialog ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true"
        aria-label={`Edit ${label}`} onKeyDown={onKeyDown}>
        <S.EditorHeading $centered={centered}>{heading}<S.CancelEdit type="button" aria-label="Cancel field edit"
          disabled={busy} onMouseDown={(event) => event.preventDefault()} onClick={onClose}>×</S.CancelEdit></S.EditorHeading>
        <S.InlineEditor>{children}</S.InlineEditor>
      </S.EditorDialog>
    </S.EditorOverlay>
  );
  return inline ? content : createPortal(content, document.getElementById('operations-box-quick-peek') || document.body);
}
