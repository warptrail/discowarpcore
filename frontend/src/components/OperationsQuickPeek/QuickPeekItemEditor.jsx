import { useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { editItem } from '../../api/editItem';
import { ITEM_CATEGORIES, formatItemCategory } from '../../util/itemCategories';
import { ToastContext } from '../Toast';
import * as S from './QuickPeekItemEditor.styles';

export default function QuickPeekItemEditor({ item, field, label, children, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const cancelled = useRef(false);
  const { showToast } = useContext(ToastContext) || {};
  const original = field === 'tags' ? (item.tags || []).join(', ') : String(item[field] ?? '');
  const open = () => { cancelled.current = false; setDraft(original); setError(''); setEditing(true); };
  const save = async (value = draft) => {
    if (busy.current || cancelled.current) return;
    if (value === original) { setEditing(false); return; }
    let parsed = value.trim();
    if (field === 'quantity') parsed = Number(value);
    if (field === 'tags') parsed = [...new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean))];
    if ((field === 'name' && !parsed) || (field === 'quantity' && (!Number.isInteger(parsed) || parsed < 1))) {
      setError(field === 'name' ? 'Name is required.' : 'Quantity must be a whole number of at least 1.');
      return;
    }
    busy.current = true; setSaving(true); setError('');
    try {
      const updated = await editItem(item._id || item.id, { [field]: parsed });
      onSaved?.(updated);
      setEditing(false);
      showToast?.({ variant: 'success', title: 'UPDATED', message: `${label} saved.`, timeoutMs: 2200 });
    } catch (failure) {
      const message = failure?.message || 'Could not save. Try again.';
      setError(message);
      showToast?.({ variant: 'danger', title: 'SAVE FAILED', message, timeoutMs: 5000 });
    } finally { busy.current = false; setSaving(false); }
  };
  const trigger = <S.FieldTrigger type="button" aria-label={`Edit ${label}`} onClick={open}>{children || `Add ${label.toLowerCase()}`}</S.FieldTrigger>;
  if (!editing) return trigger;
  const props = {
    autoFocus: true, 'aria-label': label, value: draft, disabled: saving,
    onChange: (event) => { setDraft(event.target.value); setError(''); },
    onBlur: () => { void save(); },
    onKeyDown: (event) => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelled.current = true; setEditing(false); }
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void save(); }
    },
  };
  return <>{trigger}{createPortal(<S.EditorOverlay onMouseDown={(event) => {
    if (event.target === event.currentTarget) void save();
  }}>
    <S.EditorDialog role="dialog" aria-modal="true" aria-label={`Edit ${label}`} onKeyDown={(event) => {
      if (event.key === 'Tab') { event.preventDefault(); void save(); }
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelled.current = true; setEditing(false); }
    }}>
    <S.Heading>{label}<S.CancelEdit type="button" aria-label="Cancel field edit" disabled={saving} onMouseDown={(event) => event.preventDefault()} onClick={() => { cancelled.current = true; setEditing(false); }}>×</S.CancelEdit></S.Heading>
    <S.InlineEditor>
    {field === 'category' ? <S.Select {...props} onChange={(event) => { setDraft(event.target.value); void save(event.target.value); }}>
      {ITEM_CATEGORIES.map((category) => <option key={category} value={category}>{formatItemCategory(category)}</option>)}
    </S.Select> : ['description', 'tags'].includes(field) ? <S.TextArea {...props} rows={field === 'description' ? 3 : 2} /> : <S.Input {...props} type={field === 'quantity' ? 'number' : 'text'} min={field === 'quantity' ? 1 : undefined} />}
    {saving ? <S.Hint>Saving…</S.Hint> : <S.Hint>{field === 'tags' ? 'Comma-separated · ' : ''}Enter or leave field to save · Esc cancels</S.Hint>}
    {error ? <S.Error role="alert">{error}</S.Error> : null}
  </S.InlineEditor>
    </S.EditorDialog>
  </S.EditorOverlay>, document.getElementById('operations-box-quick-peek') || document.body)}</>;
}
