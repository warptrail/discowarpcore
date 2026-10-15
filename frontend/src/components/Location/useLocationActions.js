import { useCallback, useContext, useEffect, useState } from 'react';
import { EMPTY_LOCATION, updateLocationDraft } from '../../util/locationStructure';
import { ToastContext } from '../Toast';
import { locationLabel } from './locationHierarchy';

export default function useLocationActions(registry, onSaved) {
  const { showToast, hideToast, toast } = useContext(ToastContext);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_LOCATION);
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });
  const { error, loading, refreshLocations } = registry;
  useEffect(() => {
    if (error) showToast({ id: 'location-load-error', title: 'Could not load locations', message: error, variant: 'danger', sticky: true,
      actions: [{ label: 'Retry', onClick: () => refreshLocations().catch(() => {}) }] });
    else if (!loading) hideToast('location-load-error');
  }, [error, loading, refreshLocations, showToast, hideToast]);

  const clear = () => { setDraft(EMPTY_LOCATION); setEditingId(''); };
  const cancelDelete = () => hideToast('location-delete-confirm');
  const restoreBranchFocus = options => {
    if (options.focusId) requestAnimationFrame(() => {
      const target = document.getElementById(options.focusId) || document.querySelector('#location-console-mount button[aria-haspopup="dialog"]');
      target?.focus({ preventScroll: true });
    });
  };
  const add = () => {
    cancelDelete(); clear(); setMessage({ text: '', error: false }); setEditorOpen(true);
  };
  const edit = location => {
    cancelDelete(); setEditingId(location._id);
    setDraft(Object.fromEntries(Object.keys(EMPTY_LOCATION).map(key => [key, location[key] || ''])));
    setMessage({ text: '', error: false }); setEditorOpen(true);
  };
  const close = () => { clear(); setEditorOpen(false); };
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage({ text: '', error: false });
    showToast({ id: 'location-saving', title: 'Saving location…', message: locationLabel(draft), loading: true, dismissible: false, sticky: true });
    try {
      const saved = editingId ? await registry.renameLocationInline(editingId, draft) : await registry.createLocationInline(draft);
      showToast({ id: 'location-saved', title: editingId ? 'Location saved' : 'Location ready', message: locationLabel(saved), variant: 'success', sticky: true,
        actions: [{ label: 'Show location', onClick: () => onSaved(saved) }] });
      close(); onSaved(saved);
    } catch (failure) {
      const text = failure.message || 'Could not save location.';
      setMessage({ text, error: true });
      showToast({ id: 'location-save-error', title: 'Location was not saved', message: text, variant: 'danger', sticky: true });
    } finally { setBusy(false); }
  };
  const remove = async (locations, options = {}) => {
    hideToast('location-delete-confirm'); setBusy(true);
    const label = options.label || locationLabel(locations[0]);
    let deleted = 0;
    showToast({ id: 'location-deleting', title: options.branch ? 'Deleting branch…' : 'Deleting location…', message: label, loading: true, dismissible: false, sticky: true });
    try {
      for (const location of locations) {
        await registry.deleteLocationInline(location._id); deleted += 1;
        if (editingId === location._id) close();
      }
      showToast({ id: 'location-deleted', title: options.branch ? 'Branch deleted' : 'Location deleted',
        message: `${label}${locations.length > 1 ? ` · ${deleted} paths removed` : ''}`, variant: 'success', sticky: true });
    } catch (failure) {
      showToast({ id: 'location-delete-error', title: deleted ? 'Branch partly deleted' : 'Location was not deleted',
        message: `${deleted ? `${deleted} of ${locations.length} paths removed. ` : ''}${failure.message || 'Could not delete location.'}`, variant: 'danger', sticky: true });
    } finally { setBusy(false); restoreBranchFocus(options); }
  };
  const requestDelete = (location, options = {}) => {
    const locations = Array.isArray(location) ? location : [location];
    if (!locations.length || busy) return;
    const cancel = () => { cancelDelete(); restoreBranchFocus(options); };
    showToast({ id: 'location-delete-confirm', title: options.branch ? 'Delete branch?' : 'Delete location?', onClose: cancel,
      message: locations.length > 1 ? `${options.label} · ${locations.length} saved paths, including descendants` : locationLabel(locations[0]), variant: 'warning', sticky: true,
      actions: [{ label: options.branch ? 'Delete branch' : 'Delete location', onClick: () => void remove(locations, options), kind: 'primary' },
        { label: 'Cancel', onClick: cancel, kind: 'ghost' }] });
  };
  const dismissToast = () => {
    if (typeof toast?.onClose === 'function') { toast.onClose(); return; }
    hideToast(toast?.id);
  };
  const changeDraft = useCallback((name, value) => setDraft(current => updateLocationDraft(current, name, value)), []);
  return { editorOpen, draft, editingId, busy, message, toast, add, edit, close, clear, save, requestDelete, cancelDelete, dismissToast, changeDraft };
}
