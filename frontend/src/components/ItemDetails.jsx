import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import * as S from '../styles/ItemDetails.styles';
import { fetchItemDetails, patchItem, createAborter } from '../api/itemDetails';

export default function ItemDetails({
  item: listItem, // lightweight item from the row
  isOpen = false,
  isOpening = false,
  isClosing = false,
}) {
  const id = listItem?._id;
  const [fullItem, setFullItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const abortRef = useRef(null);

  // Fetch enriched item when the panel opens (breadcrumb, depth, topBox, etc.)
  useEffect(() => {
    if (!isOpen || !id) return;

    // cancel any in-flight
    abortRef.current?.cancel?.();
    abortRef.current = createAborter();

    setLoading(true);
    setErr(null);

    fetchItemDetails(id, { signal: abortRef.current.signal })
      .then((data) => setFullItem(data))
      .catch((e) => {
        if (e.name !== 'AbortError') setErr(e);
      })
      .finally(() => setLoading(false));

    return () => abortRef.current?.cancel?.();
  }, [isOpen, id]);

  // Prefer the enriched document once loaded
  const item = fullItem || listItem;
  if (!id || !item) return null;

  const {
    name,
    description,
    notes,
    quantity,
    imagePath,
    valueCents,
    purchaseDate,
    lastUsedAt,
    orphanedAt,
    location,
    box, // { _id, box_id, label, description }
    breadcrumb, // [{ _id, box_id, label }, ...]
    depth,
    topBox,
    shortId,
    createdAt,
    updatedAt,
  } = item;

  const imgSrc = useMemo(() => {
    // prefer the item image; else the provided example
    if (typeof imagePath === 'string' && imagePath.trim()) return imagePath;
    return 'https://imgur.com/sA9VT';
  }, [imagePath]);

  const boxShortId = box?.box_id ?? null;
  const boxLabel = box?.label ?? null;

  const breadcrumbTrail = useMemo(() => {
    if (!Array.isArray(breadcrumb) || breadcrumb.length === 0) return null;
    return breadcrumb.map((b) => b.box_id || '—').join(' › ');
  }, [breadcrumb]);

  const dollars =
    Number.isInteger(valueCents) && valueCents >= 0 ? valueCents / 100 : null;

  const showLocation =
    Boolean(orphanedAt) &&
    typeof location === 'string' &&
    location.trim().length > 0;

  const microBits = useMemo(() => {
    const bits = [];
    if (quantity != null) bits.push(`Qty: ${quantity}`);
    if (boxShortId) bits.push(`Box: ${boxShortId}`);
    if (shortId) bits.push(`Item: ${shortId}`);
    return bits;
  }, [quantity, boxShortId, shortId]);

  // Action: mark last-used now (PATCH with ISO timestamp)
  async function markLastUsedNow() {
    console.log('Filler fun');
  }

  // Link to full item page (adjust route if yours differs)
  const itemPageHref = `/items/${id}`;

  return (
    <S.DetailsCard
      data-open={isOpen ? 'true' : 'false'}
      data-opening={isOpening ? 'true' : 'false'}
      data-closing={isClosing ? 'true' : 'false'}
      aria-hidden={!isOpen && !isOpening}
    >
      <S.Wrapper>
        {/* Header */}
        <S.Header>
          <S.Thumb
            src={imgSrc}
            alt={name ? `${name} thumbnail` : 'Item thumbnail'}
          />
          <div>
            <S.Title>{name || 'Untitled item'}</S.Title>
            {description ? <S.SubTitle>{description}</S.SubTitle> : null}
            {microBits.length > 0 ? (
              <S.Micro aria-label="Item metadata">
                {microBits.join(' • ')}
              </S.Micro>
            ) : null}
          </div>
        </S.Header>

        {/* Actions */}
        <S.Actions>
          <S.Button onClick={markLastUsedNow} disabled={saving}>
            {saving ? 'Saving…' : 'Mark last used'}
          </S.Button>
          <S.LinkButton href={itemPageHref} aria-label="Open item home page">
            Open item page
          </S.LinkButton>
        </S.Actions>

        {/* Optional notes */}
        {notes ? <S.Notes>{notes}</S.Notes> : null}

        {/* GROUP: Location / Placement */}
        <S.Section>
          <S.SectionTitle>Placement</S.SectionTitle>
          <S.DataGrid>
            <dt>Path</dt>
            <dd>{breadcrumbTrail ?? '—'}</dd>

            <dt>Depth</dt>
            <dd>{Number.isFinite(depth) ? depth : '—'}</dd>

            <dt>Top</dt>
            <dd>
              {topBox?.box_id
                ? `${topBox.box_id} — ${topBox.label || ''}`.trim()
                : '—'}
            </dd>

            <dt>Box</dt>
            <dd>
              {boxShortId
                ? `${boxShortId}${boxLabel ? ` — ${boxLabel}` : ''}`
                : '—'}
            </dd>

            <dt>Location</dt>
            <dd>{showLocation ? location : '—'}</dd>
          </S.DataGrid>
        </S.Section>

        {/* GROUP: Value / Quantities */}
        <S.Section>
          <S.SectionTitle>Details</S.SectionTitle>
          <S.DataGrid>
            <dt>ID</dt>
            <dd>
              <S.Mono>{item?._id ?? '—'}</S.Mono>
            </dd>

            <dt>Quantity</dt>
            <dd>{quantity ?? '—'}</dd>

            <dt>Value</dt>
            <dd>{dollars != null ? fmtCurrency(dollars) : '—'}</dd>
          </S.DataGrid>
        </S.Section>

        {/* GROUP: Dates (clustered) */}
        <S.Section>
          <S.SectionTitle>Dates</S.SectionTitle>
          <S.DataGrid>
            <dt>Purchased</dt>
            <dd>{purchaseDate ? fmtDate(purchaseDate) : '—'}</dd>

            <dt>Last used</dt>
            <dd>{lastUsedAt ? fmtDate(lastUsedAt) : '—'}</dd>

            <dt>Orphaned</dt>
            <dd>{orphanedAt ? fmtDate(orphanedAt) : '—'}</dd>

            <dt>Created</dt>
            <dd>{createdAt ? fmtDate(createdAt) : '—'}</dd>

            <dt>Updated</dt>
            <dd>{updatedAt ? fmtDate(updatedAt) : '—'}</dd>
          </S.DataGrid>
        </S.Section>

        {/* Loading / error */}
        {loading && !fullItem ? <S.Skel>Loading item…</S.Skel> : null}
        {err ? <S.Error>Couldn’t load/save item.</S.Error> : null}
      </S.Wrapper>
    </S.DetailsCard>
  );
}

function fmtDate(d) {
  try {
    const dateObj = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dateObj.getTime())) return String(d);
    return dateObj.toLocaleString();
  } catch {
    return String(d);
  }
}

function fmtCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(n);
  } catch {
    return `$${Number(n).toFixed(2)}`;
  }
}
