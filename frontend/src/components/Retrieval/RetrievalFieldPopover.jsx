import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import useDialogFocus from '../../hooks/useDialogFocus';
import ItemFieldEditor from '../ItemFieldEditor/ItemFieldEditor';
import useRetrievalFieldPopoverBounds from './useRetrievalFieldPopoverBounds';
import * as S from './RetrievalFieldPopover.styles';

export default function RetrievalFieldPopover({ editing, themeStyle, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useDialogFocus(dialogRef, editing.requestClose, true, '#retrieval-finder-toggle');
  const bounds = useRetrievalFieldPopoverBounds(editing.anchor, dialogRef);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      const body = dialog?.querySelector('[data-retrieval-editor-body]');
      const target = editing.discardRequested ? dialog?.querySelector('[data-retrieval-keep-editing]')
        : body?.querySelector('textarea, input:not([type="hidden"])') || body?.querySelector('button');
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [editing.discardRequested]);
  return createPortal(<>
    <S.Scrim onMouseDown={(event) => { event.preventDefault(); editing.requestClose(); }} />
    <S.Dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
      style={{ ...themeStyle, ...bounds, visibility: bounds ? undefined : 'hidden' }}>
      <S.Header><h3 id={titleId}>Edit {editing.descriptor.label}</h3>
        <S.Close type="button" aria-label="Close field editor" disabled={editing.saving} onClick={editing.requestClose}>×</S.Close>
      </S.Header>
      <S.Body data-retrieval-editor-body><fieldset disabled={editing.saving}>
        {children || <ItemFieldEditor autoFocus={false} commitSelections={false} commitTextOnTab={false} editNotesImmediately selectVariant="prism"
          descriptor={editing.descriptor} draft={editing.draft} error={editing.error}
          isDirty={editing.isDirty} saving={editing.saving} onChange={editing.setDraft} onSave={editing.save}
          onRequestDiscard={editing.requestClose} />}
      </fieldset></S.Body>
      <S.Actions>
        {editing.discardRequested ? <><p role="alert">Discard unsaved changes?</p>
          <S.Button type="button" data-retrieval-keep-editing onClick={editing.keepEditing}>Keep editing</S.Button>
          <S.Button type="button" onClick={editing.discard}>Discard changes</S.Button></>
          : <><S.Button type="button" disabled={editing.saving} onClick={editing.requestClose}>Cancel</S.Button>
            <S.Button type="button" $primary disabled={editing.saving || !editing.isDirty} onClick={() => { void editing.save(); }}>{editing.saving ? 'Saving…' : 'Save changes'}</S.Button></>}
      </S.Actions>
    </S.Dialog>
  </>, document.body);
}
