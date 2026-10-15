import { useContext, useRef, useState } from 'react';
import useLocationRegistry from '../../hooks/useLocationRegistry';
import { updateBoxDetails } from '../../api/boxes';
import { ToastContext } from '../Toast';
import { boxLocationDraft, saveRetrievalBoxLocation } from './retrievalBoxLocationModel';

export default function useRetrievalBoxLocationEditor({ item, detailResource, onBoxUpdated }) {
  const registry = useLocationRegistry();
  const [session, setSession] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [discardRequested, setDiscardRequested] = useState(false);
  const busy = useRef(false);
  const { showToast } = useContext(ToastContext) || {};
  const canEdit = () => detailResource?.status === 'ready' && Boolean(item?.box?._id)
    && typeof onBoxUpdated === 'function' && !registry.loading && !registry.error;
  const isDirty = Boolean(session) && JSON.stringify(boxLocationDraft(draft)) !== JSON.stringify(session.baseline);
  const close = () => { setSession(null); setDiscardRequested(false); setError(''); };
  const requestClose = () => {
    if (busy.current) return;
    if (isDirty) setDiscardRequested(true);
    else close();
  };
  const open = (_key, anchor) => {
    if (!canEdit() || busy.current) return;
    const box = item.box;
    const locationId = String(box.locationId?._id || box.locationId || '');
    const baseline = boxLocationDraft(registry.locations.find((entry) => String(entry._id) === locationId) || box.locationId);
    setSession({ box, anchor, locationId, baseline });
    setDraft(baseline); setError(''); setDiscardRequested(false);
  };
  const save = async () => {
    if (!session || !isDirty || busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const updated = await saveRetrievalBoxLocation(session.box, draft, {
        resolveLocation: registry.createLocationInline, updateBox: updateBoxDetails,
      });
      onBoxUpdated(updated);
      close();
      showToast?.({ variant: 'success', sticky: true, title: 'Box location saved',
        message: `Box ${session.box.box_id} · Applies to items in this box.`,
        actions: [{ id: `retrieval-box-location-undo-${session.box._id}`, label: 'Undo', onClick: async () => {
          try {
            const restored = await updateBoxDetails(session.box._id, { locationId: session.locationId || null });
            onBoxUpdated({ ...session.box, ...restored });
            showToast?.({ variant: 'success', sticky: true, title: 'Box location restored', message: `Box ${session.box.box_id}` });
          } catch (failure) {
            showToast?.({ variant: 'danger', sticky: true, title: 'Undo failed', message: failure.message });
          }
        } }],
      });
    } catch (failure) { setError(failure.message || 'Could not save the box location.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return { ...registry, item, session, anchor: session?.anchor, draft, saving, error, isDirty,
    fieldKey: session ? 'box-location' : '', descriptor: { label: `Box ${session?.box.box_id || ''} location` },
    isActive: Boolean(session), canEdit, open, setDraft, save, requestClose, discardRequested,
    keepEditing: () => setDiscardRequested(false), discard: () => { if (!busy.current) close(); } };
}
