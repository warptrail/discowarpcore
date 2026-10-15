import { MISSING_INVENTORY_REFRESH_EVENT } from './useMissingInventoryRefresh';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMissingItems } from '../../api/itemMissing';
import { fetchItemDetails } from '../../api/itemDetails';
import { BOX_RECORD_UPDATED_EVENT } from '../../constants/inventoryFinderEvents';
import { ToastContext } from '../Toast';
import { MissingItemsContext } from './MissingItemsContext';
import MissingItemSheet from './MissingItemSheet';

export default function MissingItemsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ records: 0, objects: 0 });
  const [states, setStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const [tick, setTick] = useState(0);
  const requestId = useRef(0);
  const { showToast } = useContext(ToastContext) || {};
  const refresh = useCallback(() => setTick(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const first = await fetchMissingItems({ limit: 100 }, controller.signal);
        const remaining = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(first.total / 100) - 1) }, (_, index) =>
          fetchMissingItems({ limit: 100, offset: (index + 1) * 100 }, controller.signal)));
        if (controller.signal.aborted) return;
        const next = [first, ...remaining].flatMap(page => page.items);
        setItems(next); setSummary(first.summary); setError('');
        if (tick > 0) window.dispatchEvent(new CustomEvent(MISSING_INVENTORY_REFRESH_EVENT));
        setStates(previous => {
          const result = Object.fromEntries(Object.entries(previous).map(([id, value]) => [id, { ...value, missing: { ...value.missing, quantity: 0 } }]));
          next.forEach(item => { result[String(item._id)] = { ...previous[String(item._id)], ...item }; });
          return result;
        });
      } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [tick]);
  useEffect(() => {
    const visibleRefresh = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = window.setInterval(visibleRefresh, 30000);
    window.addEventListener('focus', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    window.addEventListener(BOX_RECORD_UPDATED_EVENT, visibleRefresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', visibleRefresh);
      document.removeEventListener('visibilitychange', visibleRefresh); window.removeEventListener(BOX_RECORD_UPDATED_EVENT, visibleRefresh); };
  }, [refresh]);
  const open = useCallback(async (item, mode, onSaved) => {
    const id = ++requestId.current;
    try {
      const fresh = await fetchItemDetails(item._id || item.id);
      if (id === requestId.current) setActive({ item: fresh, mode, onSaved });
    } catch (err) { showToast?.({ id: 'missing-item-feedback', variant: 'danger', title: 'Could not open missing report', message: err.message, sticky: true }); }
  }, [showToast]);
  const saved = updated => {
    setStates(previous => ({ ...previous, [updated._id]: updated }));
    active?.onSaved?.(updated);
    window.requestAnimationFrame(() => window.dispatchEvent(new CustomEvent(MISSING_INVENTORY_REFRESH_EVENT)));
    refresh();
    window.dispatchEvent(new CustomEvent(BOX_RECORD_UPDATED_EVENT));
  };
  const value = useMemo(() => ({ items, summary, states, loading, error, open, refresh }), [items, summary, states, loading, error, open, refresh]);
  return <MissingItemsContext.Provider value={value}>{children}
    {active && <MissingItemSheet key={`${active.item._id}-${active.mode}`} {...active} onClose={() => setActive(null)} onSaved={saved} />}
  </MissingItemsContext.Provider>;
}
