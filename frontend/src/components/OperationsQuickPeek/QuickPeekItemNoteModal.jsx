import NoteReaderModal from '../NoteReaderModal/NoteReaderModal';

const itemNoteTheme = {
  '--box-primary-rgb': '202, 118, 255',
  '--box-secondary-rgb': '255, 172, 231',
};

export default function QuickPeekItemNoteModal({ item, notes, onClose }) {
  const title = String(item?.name || item?.label || 'Untitled item').trim();

  return (
    <NoteReaderModal
      eyebrow="Item notes"
      title={title}
      titleId="quick-peek-item-note-title"
      notes={notes}
      onClose={onClose}
      themeStyle={itemNoteTheme}
    />
  );
}
