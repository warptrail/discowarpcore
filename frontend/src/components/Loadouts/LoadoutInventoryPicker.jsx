import { useEffect, useRef, useState } from 'react';
import { fetchRetrievalItemsPage } from '../../api/retrieval';
import { occasionStyle } from './occasionPresets';
import * as S from './Loadouts.styles';

export default function LoadoutInventoryPicker({ loadout, entry, onSelect, onClose, busy }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const resultsRef = useRef(null);
  const linkedIds = new Set(loadout.entries.filter(row => row.id !== entry?.id).map(row => row.itemId));

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const result = await fetchRetrievalItemsPage({ q: query, sort: 'name', limit: 20, offset }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setItems(result.items); setTotal(result.total);
        resultsRef.current?.scrollIntoView({ block: 'nearest' });
      } catch (failure) { if (!controller.signal.aborted) setError(failure.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, offset, retry]);

  const choose = async item => {
    try { if (await onSelect(item)) onClose(); }
    catch (failure) { setError(failure.message); }
  };

  return <S.Sheet compact layer={2} title={entry ? `Link ${entry.label}` : 'Add inventory items'}
    context="Search by name, tag, box or location" onClose={onClose} style={occasionStyle(loadout.occasion)}
    initialFocusSelector="#loadout-inventory-search" beforeClose={() => !busy}>
    <S.Body>
      <S.Label htmlFor="loadout-inventory-search">Find an inventory item<S.Input type="search" id="loadout-inventory-search" value={query} onChange={event => { setQuery(event.target.value); setOffset(0); setLoading(true); }} placeholder="Search your inventory…" /></S.Label>
      <S.Muted style={{ marginTop: 12 }}>{entry ? `Choose the inventory record for “${entry.label}”.` : 'Items keep their home box and can belong to other loadouts too.'}</S.Muted>
      {error && <S.Error role="alert">{error}<S.Button $quiet onClick={() => setRetry(value => value + 1)}>Retry search</S.Button></S.Error>}
      <div ref={resultsRef} aria-busy={loading || busy} style={{ marginTop: 16 }}>
        {loading ? <S.Muted role="status">Searching inventory…</S.Muted> : <>
          <S.Progress><span>{total ? `${offset + 1}–${offset + items.length} of ${total} results` : 'No matching items. Try a different name or tag.'}</span></S.Progress>
          {items.map(item => <S.PickerResult key={item.id} type="button" disabled={busy || linkedIds.has(item.id)} onClick={() => choose(item)} aria-label={`${linkedIds.has(item.id) ? 'Already linked' : 'Link'} ${item.name}`}>
            <div><strong>{item.name}</strong><small>{item.placementLabel ? `#${item.placementLabel} · ${item.boxName}` : 'Items Adrift'} · {item.locationLabel === 'Unknown Location' ? 'Location not recorded' : item.locationLabel || 'Location not recorded'}</small></div>
            <span>{linkedIds.has(item.id) ? 'Linked' : '＋'}</span>
          </S.PickerResult>)}
          {total > 20 && <S.Actions style={{ marginTop: 14 }}><S.Button type="button" disabled={busy || offset === 0} onClick={() => { setLoading(true); setOffset(value => Math.max(0, value - 20)); }}>Previous</S.Button><S.Button type="button" disabled={busy || offset + items.length >= total} onClick={() => { setLoading(true); setOffset(value => value + 20); }}>Next</S.Button></S.Actions>}
        </>}
      </div>
    </S.Body>
  </S.Sheet>;
}
