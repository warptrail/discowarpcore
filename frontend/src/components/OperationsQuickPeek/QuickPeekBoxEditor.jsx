import { useContext, useRef, useState } from 'react';
import { updateBoxDetails } from '../../api/boxes';
import useShortIdAvailability from '../../hooks/useShortIdAvailability';
import BoxImageField from '../ImageFields/BoxImageField';
import { ToastContext } from '../Toast';
import QuickPeekFieldSheet from './QuickPeekFieldSheet';
import QuickPeekBoxLocationField from './QuickPeekBoxLocationField';
import { BOX_CARD_FIELDS, buildBoxFieldPatch, getBoxFieldDraft } from './operationsBoxFields';
import * as S from './QuickPeekItemEditor.styles';

export default function QuickPeekBoxEditor({ box, field, onClose, onSaved }) {
  // Snapshot on mount: refreshed data and responsive presentation must not reset a draft.
  const initial = useRef(box).current;
  const original = getBoxFieldDraft(initial, field);
  const [draft, setDraft] = useState(original);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const numberEntryStarted = useRef(false);
  const startNumberEntry = (event, value) => {
    if (field !== 'box_id' || numberEntryStarted.current || !/^\d+$/.test(value || '')) return;
    event.preventDefault();
    numberEntryStarted.current = true;
    setDraft(value.slice(0, 3));
    setError('');
  };
  const { showToast } = useContext(ToastContext) || {};
  const label = BOX_CARD_FIELDS.find((entry) => entry.key === field)?.label || field;
  const availability = useShortIdAvailability({ shortId: field === 'box_id' ? draft : initial.box_id,
    initialShortId: initial.box_id });
  const close = () => { if (!busy.current) onClose(); };
  const save = async (resolvePatch) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const patch = await resolvePatch();
      if (field === 'box_id' && (!availability.isValid || availability.shortIdChecking)) {
        throw new Error(availability.checkError || 'Choose an available three-digit number.');
      }
      const updated = await updateBoxDetails(initial._id, patch);
      onSaved?.({ ...initial, ...updated });
      showToast?.({ variant: 'success', title: 'UPDATED', message: `Box ${label} saved.`, timeoutMs: 2200 });
      onClose();
    } catch (failure) {
      const message = failure?.message || 'Could not save. Try again.';
      setError(message);
      showToast?.({ variant: 'danger', title: 'SAVE FAILED', message, timeoutMs: 5000 });
    } finally { busy.current = false; setSaving(false); }
  };
  const numberStatus = availability.shortIdChecking ? 'Checking number…'
    : availability.checkError || (!availability.isValid ? 'Use an available three-digit number.' : '');
  return <QuickPeekFieldSheet label={`box ${initial.box_id} ${label}`} busy={saving}
    heading={field === 'box_id' ? 'Box number' : `Box ${label}`}
    centered={field === 'box_id'}
    inline manageFocus onClose={close}>
    {field === 'photo' ? <>
      <BoxImageField box={initial} compact title="Photo" onBoxImageUpdated={(change) => {
        onSaved?.({ ...initial, image: change.image, imagePath: change.imagePath });
      }} onImageAction={(action) => showToast?.({ variant: action.kind === 'error' ? 'danger' : 'success',
        title: action.kind === 'error' ? 'PHOTO FAILED' : 'PHOTO UPDATED', message: action.message })} />
      <S.Actions><S.Button type="button" onClick={close}>Done</S.Button></S.Actions>
    </> : field === 'locationId' ? <QuickPeekBoxLocationField box={initial} saving={saving} onSave={save} onClose={close} /> :
      <form onSubmit={(event) => { event.preventDefault(); void save(() => buildBoxFieldPatch(field, draft)); }}>
        <S.Field>
          {['description', 'notes', 'tags'].includes(field)
            ? <S.TextArea data-field-autofocus aria-label={`Box ${label}`} rows={field === 'tags' ? 2 : 5}
                value={draft} disabled={saving} onChange={(event) => { setDraft(event.target.value); setError(''); }} />
            : <S.Input data-field-autofocus aria-label={`Box ${label}`} value={draft} disabled={saving}
                $boxNumber={field === 'box_id'}
                autoFocus={field === 'box_id'}
                onKeyDown={(event) => {
                  if (!event.ctrlKey && !event.metaKey && !event.altKey && /^\d$/.test(event.key)) startNumberEntry(event, event.key);
                }}
                onBeforeInput={(event) => startNumberEntry(event, event.data || event.nativeEvent?.data)}
                onPaste={(event) => {
                  if (field !== 'box_id') return;
                  const value = event.clipboardData.getData('text').trim();
                  startNumberEntry(event, value);
                }}
                inputMode={field === 'box_id' ? 'numeric' : undefined} maxLength={field === 'box_id' ? 3 : undefined}
                onChange={(event) => {
                  if (field === 'box_id') {
                    if (!/^\d{0,3}$/.test(event.target.value)) return;
                    numberEntryStarted.current = true;
                  }
                  setDraft(event.target.value); setError('');
                }} />}
        </S.Field>
        {field === 'box_id' && numberStatus ? <S.Hint role="status">{numberStatus}</S.Hint> : field === 'tags' ? <S.Hint>Comma-separated tags</S.Hint> : null}
        <S.Actions><S.Button type="button" disabled={saving} onClick={close}>Cancel</S.Button>
          <S.Button type="submit" $primary disabled={saving || draft === original ||
            field === 'box_id' && (!availability.isValid || availability.shortIdChecking)}>{saving ? 'Saving…' : 'Save'}</S.Button></S.Actions>
      </form>}
    {error ? <S.Error role="alert">{error}</S.Error> : null}
  </QuickPeekFieldSheet>;
}
