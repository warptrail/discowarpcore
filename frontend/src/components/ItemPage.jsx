import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ItemCentricViewPanel from '../components/ItemCentricViewPanel';

const API_BASE = 'http://localhost:5002'; // direct to Express, no Vite proxy

export default function ItemPage() {
  const { itemId } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!itemId) return;

    const abort = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${API_BASE}/api/items/${encodeURIComponent(itemId)}`;
        const res = await fetch(url, {
          signal: abort.signal,
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${text?.slice(0, 120)}`);
        }

        const json = await res.json(); // { ok, data }
        setItem(json?.data ?? null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('fetch item failed:', err);
          setError('Failed to load item.');
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => abort.abort();
  }, [itemId]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (error) return <div style={{ padding: 16 }}>{error}</div>;
  if (!item) return <div style={{ padding: 16 }}>Item not found.</div>;

  return (
    <ItemCentricViewPanel item={item} fallbackSrc="/assets/filler-item.png" />
  );
}
