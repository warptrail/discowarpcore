import QuickPeekNoteSheet from './QuickPeekNoteSheet';
import { editItem } from '../../api/editItem';

export default function QuickPeekItemNoteModal({ item, notes, onClose, onSaved }) {
  const title = String(item?.name || item?.label || 'Untitled item').trim();

  return (
    <QuickPeekNoteSheet
      contained
      onSave={async (value) => {
        const updated = await editItem(item._id || item.id, { notes: value });
        onSaved?.(updated);
      }}
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
