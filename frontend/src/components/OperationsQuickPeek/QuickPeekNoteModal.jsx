import QuickPeekNoteSheet from './QuickPeekNoteSheet';

export default function QuickPeekNoteModal({ box, notes, onClose }) {
  const title = String(box?.label || box?.name || 'Untitled box').trim();
  const boxId = String(box?.box_id || '').trim();
  return (
    <QuickPeekNoteSheet
      title={title}
      notes={notes}
      eyebrow={`Box notes${boxId ? ` · #${boxId}` : ''}`}
      titleId="quick-peek-box-note-title"
      contentId="quick-peek-box-note-content"
      returnLabel="Return to box"
      onClose={onClose}
    />
  );
}
