import { useEffect, useRef, useState } from 'react';
import ItemNoteSheet from '../ItemNoteSheet';
import MarkdownContent from '../RichText/MarkdownContent';
import * as N from './QuickPeekNoteSheet.styles';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekNoteSheet({
  title,
  notes,
  eyebrow = 'Notes',
  titleId,
  contentId,
  returnLabel = 'Return to item',
  onClose,
  contained = false,
  onSave,
}) {
  const returnButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const fullReaderOpenRef = useRef(false);
  const [fullReaderOpen, setFullReaderOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editingRef = useRef(false);
  editingRef.current = editing;
  const save = async () => {
    if (saving) return;
    setSaving(true); setError('');
    try { await onSave(draft); setEditing(false); }
    catch (failure) { setError(failure?.message || 'Could not save notes.'); }
    finally { setSaving(false); }
  };
  const noteText = String(notes || '').trim();
  const noteIsLong = noteText.length > 360 || noteText.split(/\r?\n/).length > 8;
  onCloseRef.current = onClose;
  fullReaderOpenRef.current = fullReaderOpen;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    returnButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (fullReaderOpenRef.current || editingRef.current) return;
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
      <N.Sheet
        $contained={contained}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <N.Toolbar>
          {!contained ? <S.NoteItemsReturn
            ref={returnButtonRef}
            type="button"
            aria-label={returnLabel}
            title={returnLabel}
            onClick={onClose}
          >
            <span aria-hidden="true">←</span>
          </S.NoteItemsReturn> : null}
          <N.Identity>{contained ? <h2 id={titleId}>NOTES</h2> : <><span>{eyebrow}</span><h2 id={titleId}>{title}</h2></>}</N.Identity>
          {onSave && !editing ? <N.Edit type="button" aria-label="Edit notes" title="Edit notes" onClick={() => { setDraft(String(notes || '')); setError(''); setEditing(true); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 10-10 4 4-10 10-5 1 1-5Zm8-8 4 4" /></svg></N.Edit> : null}
        </N.Toolbar>
        <N.Body id={contentId} tabIndex={0} aria-label={`${eyebrow} content`}>
          {editing ? <N.EditForm onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <N.TextArea autoFocus aria-label="Notes Markdown" value={draft} disabled={saving} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!saving) setEditing(false); } }} />
            <N.EditHint>Markdown supported</N.EditHint>
            {error ? <N.EditError role="alert">{error}</N.EditError> : null}
            <N.EditActions><N.Edit type="button" disabled={saving} onClick={() => setEditing(false)}>Cancel</N.Edit><N.Save type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</N.Save></N.EditActions>
          </N.EditForm> : noteText ? <MarkdownContent text={noteText} /> : <p>No notes recorded.</p>}
        </N.Body>
        {noteIsLong && !editing ? <N.FullReader type="button" aria-haspopup="dialog" aria-expanded={fullReaderOpen}
          onClick={() => setFullReaderOpen(true)}>Open full note ↗</N.FullReader> : null}
      </N.Sheet>

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
