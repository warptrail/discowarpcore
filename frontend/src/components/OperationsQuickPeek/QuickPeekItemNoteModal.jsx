import QuickPeekNoteSheet from './QuickPeekNoteSheet';

export default function QuickPeekItemNoteModal({ item, notes, onClose }) {
  const title = String(item?.name || item?.label || 'Untitled item').trim();

  return (
    <QuickPeekNoteSheet
      title={title}
      notes={notes}
      eyebrow="Item notes"
      titleId="quick-peek-item-note-title"
      contentId="quick-peek-item-note-content"
      returnLabel="Return to item"
      onClose={onClose}
    />
  );
}
