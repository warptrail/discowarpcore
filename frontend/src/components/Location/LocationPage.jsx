import { useContext, useMemo, useRef, useState } from 'react';
import { EMPTY_LOCATION, updateLocationDraft } from '../../util/locationStructure';
import useLocationRegistry from '../../hooks/useLocationRegistry';
import { ToastContext } from '../Toast';
import LocationEditor from './LocationEditor';
import LocationList from './LocationList';
import LocationHierarchyChart from './LocationHierarchyChart';
import LocationMapScope from './LocationMapScope';
import { getLocationMapScope, LOCATION_MAP_TIERS, locationLabel } from './locationHierarchy';
import * as S from './Location.styles';

const EMPTY = EMPTY_LOCATION;
export default function LocationPage() {
  const registry = useLocationRegistry();
  const toast = useContext(ToastContext);
  const editor = useRef(null);
  const [requestedScope, setRequestedScope] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });
  const { scope, options, locations: visible } = useMemo(() => getLocationMapScope(registry.locations, requestedScope), [registry.locations, requestedScope]);
  const changeScope = (level, value) => {
    const next = { ...scope, [level]: value };
    const index = LOCATION_MAP_TIERS.findIndex((tier) => tier.key === level);
    for (const tier of LOCATION_MAP_TIERS.slice(index + 1)) next[tier.key] = '';
    setRequestedScope(next);
  };
  const clear = () => { setDraft(EMPTY); setEditingId(''); };
  const edit = (location) => {
    setEditingId(location._id);
    setDraft({ room: location.room, vicinity: location.vicinity || '', specifics: location.specifics || '', exactSpot: location.exactSpot || '' });
    setMessage({ text: '', error: false });
    editor.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    editor.current?.querySelector('input')?.focus({ preventScroll: true });
  };
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage({ text: '', error: false });
    try {
      const saved = editingId ? await registry.renameLocationInline(editingId, draft) : await registry.createLocationInline(draft);
      setRequestedScope({ ...EMPTY, room: saved.room });
      setMessage({ text: `${editingId ? 'Saved' : 'Ready'}: ${locationLabel(saved)}`, error: false });
      clear();
    } catch (error) {
      setMessage({ text: error.message || 'Could not save location.', error: true });
    } finally { setBusy(false); }
  };
  const remove = async (location) => {
    toast?.hideToast?.();
    setBusy(true);
    try {
      await registry.deleteLocationInline(location._id);
      if (editingId === location._id) clear();
      setMessage({ text: `Deleted ${locationLabel(location)}.`, error: false });
    } catch (error) {
      setMessage({ text: error.message || 'Could not delete location.', error: true });
    } finally { setBusy(false); }
  };
  const requestDelete = (location) => toast?.showToast?.({
    title: 'Delete location?', message: locationLabel(location), variant: 'warning', sticky: true,
    actions: [
      { label: 'Delete location', onClick: () => void remove(location), kind: 'primary' },
      { label: 'Cancel', onClick: () => toast.hideToast(), kind: 'ghost' },
    ],
  });
  return (
    <S.Page>
      <S.Hero><h1>Location</h1><p>Chart your house from Room → Vicinity → Specifics → Exact Spot.
        Save a room alone, an area within it, or an exact storage spot, then use those locations when assigning boxes.</p></S.Hero>
      <LocationMapScope scope={scope} options={options} pathCount={visible.length}
        loading={registry.loading} busy={busy} onChange={changeScope} onReset={() => setRequestedScope(EMPTY)}
        onRefresh={() => registry.refreshLocations().catch(() => {})} />
      {registry.error && <S.Message $error role="alert">{registry.error} Use Refresh to try again.</S.Message>}
      {message.text && <S.Message $error={message.error} role={message.error ? 'alert' : 'status'}>{message.text}</S.Message>}
      {!registry.loading && <LocationHierarchyChart locations={visible} />}
      <S.Layout>
        <LocationList locations={visible} editingId={editingId} busy={busy} onEdit={edit} onDelete={requestDelete} />
        <div ref={editor} style={{ scrollMarginTop: 'calc(var(--dw-header-height, 80px) + 1rem)' }}>
          <LocationEditor locations={registry.locations} draft={draft} editingId={editingId} busy={busy}
            onChange={(name, value) => setDraft((current) => updateLocationDraft(current, name, value))}
            onSave={save} onCancel={clear} />
        </div>
      </S.Layout>
    </S.Page>
  );
}
