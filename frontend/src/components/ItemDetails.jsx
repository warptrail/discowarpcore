import React, { useMemo, useEffect } from 'react';
import * as S from '../styles/ItemDetails.styles';

export default function ItemDetails({
  item,
  isOpen = false,
  isOpening = false,
  isClosing = false,
  onTogglePulse,
}) {
  if (!item) return null;

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
    // enriched
    box, // { _id, box_id, label, description }
    breadcrumb, // [{ _id, box_id, label }, ...]
    depth, // number
    topBox, // first of breadcrumb or null
    shortId, // optional
    createdAt,
    updatedAt,
  } = item;

  useEffect(() => {
    if (item) {
      console.log('📦 ItemDetails props.item:', item);
    }
  }, [item]); // logs whenever the item changes

  const thumbSrc = useMemo(() => {
    return imagePath || null;
  }, [imagePath]);

  const boxShortId = box?.box_id ?? null;
  const boxLabel = box?.label ?? null;

  const breadcrumbTrail = useMemo(() => {
    if (!Array.isArray(breadcrumb) || breadcrumb.length === 0) return null;
    // Show e.g. "526 › 528 › 529 › 530"
    const chain = breadcrumb.map((b) => b.box_id || '—').join(' › ');
    return chain;
  }, [breadcrumb]);

  const microBits = useMemo(() => {
    const bits = [];
    if (quantity != null) bits.push(`Qty: ${quantity}`);
    if (boxShortId) bits.push(`Box: ${boxShortId}`);
    if (shortId) bits.push(`Item: ${shortId}`);
    return bits;
  }, [quantity, boxShortId, shortId]);

  const dollars = useMemo(() => {
    if (Number.isInteger(valueCents) && valueCents >= 0)
      return valueCents / 100;
    return null;
  }, [valueCents]);

  const showLocation =
    Boolean(orphanedAt) &&
    typeof location === 'string' &&
    location.trim().length > 0;

  return (
    <S.DetailsCard
      data-open={isOpen ? 'true' : 'false'}
      data-opening={isOpening ? 'true' : 'false'}
      data-closing={isClosing ? 'true' : 'false'}
      aria-hidden={!isOpen && !isOpening}
    >
      <S.Wrapper>
        <S.Header>
          {thumbSrc ? (
            <S.Thumb
              src={thumbSrc}
              alt={name ? `${name} thumbnail` : 'Item thumbnail'}
            />
          ) : null}

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

        {notes ? <S.Notes>{notes}</S.Notes> : null}

        {/* 🔘 Button to trigger parent-controlled animation */}
        <S.LastUsedButton onClick={onTogglePulse}>
          Trigger Glow
        </S.LastUsedButton>

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
          <dt>Value</dt>
          <dd>{dollars != null ? fmtCurrency(dollars) : '—'}</dd>
          <dt>Purchased</dt>
          <dd>{purchaseDate ? fmtDate(purchaseDate) : '—'}</dd>
          <dt>Last used</dt>
          <dd>{lastUsedAt ? fmtDate(lastUsedAt) : '—'}</dd>
          <dt>Orphaned</dt>
          <dd>{orphanedAt ? fmtDate(orphanedAt) : '—'}</dd>
          <dt>Location</dt>
          <dd>{showLocation ? location : '—'}</dd>
          <dt>Created</dt>
          <dd>{createdAt ? fmtDate(createdAt) : '—'}</dd>
          <dt>Updated</dt>
          <dd>{updatedAt ? fmtDate(updatedAt) : '—'}</dd>
        </S.DataGrid>
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
