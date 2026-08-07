import NoteReaderModal from '../NoteReaderModal/NoteReaderModal';

export default function QuickPeekNoteModal({ box, notes, onClose, themeStyle }) {
  const title = String(box?.label || box?.name || 'Untitled box').trim();
  const boxId = String(box?.box_id || '').trim();
  return (
    <NoteReaderModal
      eyebrow={`Box notes${boxId ? ` · #${boxId}` : ''}`}
      title={title}
      titleId="quick-peek-note-title"
      notes={notes}
      onClose={onClose}
      themeStyle={themeStyle}
    />
  );
}
