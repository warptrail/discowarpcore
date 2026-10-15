import useMissingInventoryRefresh from '../MissingItems/useMissingInventoryRefresh';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ToastContext } from '../Toast';
import * as api from '../../api/loadouts';
import { getFixedLoadouts, loadoutBody } from './loadoutModel';

export default function useLoadouts(selectedId) {
  const [loadouts, setLoadouts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const selectionRef = useRef(selectedId);
  const { showToast } = useContext(ToastContext);

  const reload = useCallback(async (signal, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [gallery, detail] = await Promise.all([
        api.fetchLoadouts(signal), selectedId ? api.fetchLoadout(selectedId, signal) : null,
      ]);
      if (signal?.aborted) return;
      const fixed = getFixedLoadouts(gallery.loadouts);
      setLoadouts(fixed);
      if (detail && !fixed.some(loadout => loadout.id === detail.loadout.id)) {
        throw new Error('Choose one of your six loadouts.');
      }
      setSelected(detail?.loadout || null);
    } catch (failure) {
      if (!signal?.aborted) setError(failure.message);
    } finally {
      if (!signal?.aborted && !silent) setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    selectionRef.current = selectedId;
    const controller = new AbortController();
    reload(controller.signal);
    return () => controller.abort();
  }, [reload, selectedId]);

  useMissingInventoryRefresh(() => busyRef.current ? undefined : reload(undefined, { silent: true }));

  const mutate = async (operation) => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true); setError('');
    try {
      const { loadout } = await operation();
      if (selectionRef.current === loadout.id) setSelected(loadout);
      setLoadouts(current => getFixedLoadouts(current.map(row => row.id === loadout.id ? loadout : row)));
      return loadout;
    } catch (failure) {
      setError(failure.message);
      showToast({ title: 'Loadout could not be saved', message: failure.message, variant: 'danger', sticky: true });
      throw failure;
    } finally {
      busyRef.current = false; setBusy(false);
    }
  };

  const saveRecord = (loadout, changes) => mutate(() => api.saveLoadout(loadout.id, { ...loadoutBody(loadout), ...changes }));
  const update = (changes) => saveRecord(selected, changes);
  return { loadouts, selected, loading, busy, error, reload, update, saveRecord };
}
