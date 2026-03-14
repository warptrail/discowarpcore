import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../api/API_BASE';
import ItemDetails from './ItemDetails';
import ItemPageBreadcrumb from './ItemPageBreadcrumb';
import * as S from '../styles/ItemPage.styles';

export default function ItemPage() {
  const { itemId } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!itemId) {
      setLoading(false);
      setNotFound(false);
      setItem(null);
      setError('Missing item id.');
      return undefined;
    }

    const abort = new AbortController();
    let isAlive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        const url = `${API_BASE}/api/items/${encodeURIComponent(itemId)}`;
        const res = await fetch(url, {
          signal: abort.signal,
          headers: { Accept: 'application/json' },
        });

        if (res.status === 404) {
          if (!isAlive) return;
          setItem(null);
          setNotFound(true);
          return;
        }

        if (!res.ok) {
          const raw = await res.text().catch(() => '');
          let body = null;
          if (raw) {
            try {
              body = JSON.parse(raw);
            } catch {
              body = null;
            }
          }
          const message =
            body?.error ||
            body?.message ||
            raw ||
            `Request failed (${res.status})`;
          throw new Error(message);
        }

        const json = await res.json().catch(() => ({}));
        const nextItem = json?.data ?? null;

        if (!isAlive) return;
        if (!nextItem) {
          setItem(null);
          setNotFound(true);
          return;
        }

        setItem(nextItem);
      } catch (err) {
        if (err?.name !== 'AbortError' && isAlive) {
          console.error('fetch item failed:', err);
          setItem(null);
          setError(err?.message || 'Failed to load item.');
        }
      } finally {
        if (isAlive) setLoading(false);
      }
    })();

    return () => {
      isAlive = false;
      abort.abort();
    };
  }, [itemId]);

  if (loading) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard>Loading item details…</S.StateCard>
      </S.Page>
    );
  }

  if (error) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard $tone="error">{error}</S.StateCard>
      </S.Page>
    );
  }

  if (notFound || !item) {
    return (
      <S.Page>
        <ItemPageBreadcrumb itemId={itemId} />
        <S.StateCard $tone="error">Item not found.</S.StateCard>
      </S.Page>
    );
  }

  return (
    <S.Page>
      <ItemPageBreadcrumb item={item} itemId={itemId} />

      <S.TitleBar>
        <S.Title>{item?.name || 'Unnamed Item'}</S.Title>
        <S.Meta>Item ID {item?._id || itemId}</S.Meta>
      </S.TitleBar>

      <ItemDetails itemId={itemId} itemData={item} />
    </S.Page>
  );
}
