import { useContext, useState } from 'react';
import useItemFieldEditor from '../ItemFieldEditor/useItemFieldEditor';
import { getItemFieldDescriptor } from '../ItemFieldEditor/itemFieldRegistry';
import { ToastContext } from '../Toast';
import { editItem } from '../../api/editItem';

function readableSaveError(message) {
  const jsonStart = String(message || '').indexOf('{');
  if (jsonStart < 0) return message;
  try { const body = JSON.parse(message.slice(jsonStart)); return body.message || body.error || message; }
  catch { return message; }
}

export default function useRetrievalItemFieldEditor({ item, detailResource, onItemUpdated }) {
  const [fieldKey, setFieldKey] = useState('');
  const [anchor, setAnchor] = useState(null);
  const [discardRequested, setDiscardRequested] = useState(false);
  const { showToast } = useContext(ToastContext) || {};
  const editor = useItemFieldEditor({ item, fieldKey, onSaved: ({ updated, descriptor, itemId, undoPayload }) => {
    onItemUpdated?.(updated);
    setFieldKey('');
    setAnchor(null);
    showToast?.({ variant: 'success', sticky: true, title: `${descriptor.label} saved`, message: item.name,
      actions: [{ id: `retrieval-field-undo-${itemId}`, label: 'Undo', onClick: async () => {
        try {
          const restored = await editItem(itemId, undoPayload);
          onItemUpdated?.(restored);
          showToast?.({ variant: 'success', sticky: true, title: `${descriptor.label} restored`, message: item.name });
        } catch (error) {
          showToast?.({ variant: 'danger', sticky: true, title: 'Undo failed', message: readableSaveError(error?.message) || 'Could not undo this change.' });
        }
      } }],
    });
  } });
  const canEdit = (key) => detailResource?.status === 'ready' && Boolean(item)
    && typeof onItemUpdated === 'function' && Boolean(getItemFieldDescriptor(key, item));
  const close = () => { setFieldKey(''); setAnchor(null); setDiscardRequested(false); };
  const requestClose = () => {
    if (editor.saving) return;
    if (editor.isDirty) { setDiscardRequested(true); return; }
    close();
  };
  const open = (key, element) => {
    if (!canEdit(key) || editor.saving) return;
    if (editor.isActive && editor.isDirty) { setDiscardRequested(true); return; }
    setDiscardRequested(false);
    setAnchor(element);
    setFieldKey(key);
  };
  const discard = () => { if (editor.reset()) close(); };

  return { ...editor, error: readableSaveError(editor.error), item, anchor, fieldKey, canEdit, open,
    requestClose, discard, discardRequested, keepEditing: () => setDiscardRequested(false) };
}
