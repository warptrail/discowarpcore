import { FieldControl } from '../ItemFieldEditor/ItemFieldEditor';
import * as S from './RetrievalItemPanel.styles';
import { useLayoutEffect, useRef } from 'react';

export default function RetrievalInlineSelect({ editing }) {
  const root = useRef(null);
  const fieldKey = editing.fieldKey;
  useLayoutEffect(() => () => {
    if (!root.current?.contains(document.activeElement)) return;
    queueMicrotask(() => document.querySelector(`[data-retrieval-field="${fieldKey}"]`)?.focus({ preventScroll: true }));
  }, [fieldKey]);
  const save = value => {
    editing.setDraft(value);
    void editing.save({ value, commitSelection: true });
  };
  return <S.InlineSelect ref={root}>
    <FieldControl descriptor={editing.descriptor} draft={editing.draft} saving={editing.saving}
      selectVariant="floating" onChange={save}
      selectProps={{ initialOpen: true, onDismiss: () => editing.requestClose() }} />
    {editing.saving ? <small role="status">Saving…</small> : null}
    {editing.error ? <><small role="alert">{editing.error}</small>
      <button type="button" onClick={() => { void editing.save({ value: editing.draft, commitSelection: true }); }}>Retry</button></> : null}
    {editing.discardRequested ? <>
      <small>Discard unsaved changes?</small>
      <button type="button" onClick={editing.keepEditing}>Keep editing</button>
      <button type="button" onClick={editing.discard}>Discard changes</button>
    </> : editing.isDirty && !editing.saving ? <button type="button" onClick={editing.requestClose}>Cancel</button> : null}
  </S.InlineSelect>;
}
