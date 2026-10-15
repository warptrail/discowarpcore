import { useRef, useState } from 'react';
import ObsidianPrismSheet from '../Sheets/ObsidianPrismSheet';
import LocationEditor from './LocationEditor';
import { EMPTY_LOCATION } from '../../util/locationStructure';
import { locationLabel } from './locationHierarchy';
import * as S from './Location.styles';

export default function LocationEditorSheet({ locations, draft, editingId, busy, message, onChange, onSave, onClear, onClose }) {
  const [discardRequested, setDiscardRequested] = useState(false);
  const contentRef = useRef(null);
  const original = locations.find((location) => location._id === editingId) || EMPTY_LOCATION;
  const dirty = Object.keys(EMPTY_LOCATION).some((key) => String(draft[key] || '') !== String(original[key] || ''));
  const beforeClose = () => {
    if (busy) return false;
    if (dirty) { setDiscardRequested(true); return false; }
    return true;
  };
  return <ObsidianPrismSheet compact keepHeaderVisible layer={1}
    title={editingId ? 'Edit location' : 'Add location'} context={editingId ? locationLabel(original) : 'Room → Vicinity → Specifics → Exact Spot'}
    closeLabel="Close location editor" initialFocusSelector="#location-room" returnFocusSelector="#location-console-mount button[aria-label='Search locations']" beforeClose={beforeClose} onClose={onClose}
    footer={discardRequested ? <S.SheetActions>
      <S.Message role="alert">Discard unsaved changes?</S.Message>
      <S.Button type="button" disabled={busy} onClick={() => {
        setDiscardRequested(false);
        requestAnimationFrame(() => contentRef.current?.querySelector('input')?.focus({ preventScroll: true }));
      }}>Keep editing</S.Button>
      <S.Button type="button" disabled={busy} onClick={onClose}>Discard changes</S.Button>
    </S.SheetActions> : undefined}>
    <S.SheetContent ref={contentRef}>
      {message?.error && message.text ? <S.Message $error role="alert">{message.text}</S.Message> : null}
      <LocationEditor locations={locations} draft={draft} editingId={editingId} busy={busy} embedded
        onChange={onChange} onSave={onSave} onCancel={editingId ? onClose : onClear} />
    </S.SheetContent>
  </ObsidianPrismSheet>;
}
