// src/components/BoxMetaPanel.jsx
// Shows high-level box meta (title/id/location/counts/parent/children/tags).
// Child-box chips migrated here from BoxDetailView.
// Minimal, dark-mode, slight LCARS; no ARIA; beginner-friendly comments.

// import React, { useMemo } from 'react';
import { styledComponents as S } from '../styles/BoxMetaPanel.styles';
import fillerImg from '../assets/filler.jpeg'; // adjust if not using Vite

export default function BoxMetaPanel({
  box,
  onGoToBox, // function(shortId) to navigate
  itemsCount: overrideItemsCount,
  totalQuantity: overrideTotalQty,
}) {
  if (!box) return null;

  // Destructure typical fields you’ve been using
  const {
    label,
    box_id,
    _id,
    description,
    notes,
    tags,
    imagePath,
    location,
    parentBox,
    childBoxes, // API-populated on your frontend
    items, // optional: if panel is used without overrides
  } = box;

  // 🔧 compute synchronously — no hooks needed
  const itemsCount =
    typeof overrideItemsCount === 'number'
      ? overrideItemsCount
      : Array.isArray(items)
      ? items.length
      : 0;

  const totalQuantity =
    typeof overrideTotalQty === 'number'
      ? overrideTotalQty
      : Array.isArray(items)
      ? items.reduce((sum, it) => sum + Number(it.quantity || 0), 0)
      : 0;

  const toShortId = (maybeObj) =>
    typeof maybeObj === 'object' && maybeObj !== null
      ? maybeObj.box_id ?? maybeObj.shortId ?? maybeObj._id
      : maybeObj;

  const parentShort = toShortId(parentBox);
  const imgSrc = imagePath || fillerImg;
  const children = Array.isArray(childBoxes) ? childBoxes : [];

  return (
    <S.Wrap>
      {/* Top: thumbnail + core meta */}
      <S.TopGrid>
        <S.ImageSquare onClick={() => onGoToBox?.(box_id || _id)}>
          <S.ThumbImg src={imgSrc} alt="" />
        </S.ImageSquare>

        <S.Core>
          <S.Title>{label || 'Untitled box'}</S.Title>
          <S.Subtle>Digital ID: #{box_id || _id}</S.Subtle>

          {location ? <S.Subtle>Location: {location}</S.Subtle> : null}

          {/* quick stats */}
          <S.Row>
            <S.Stat>{itemsCount} items</S.Stat>
            <S.Stat>Total qty: {totalQuantity}</S.Stat>
            {parentShort ? (
              <S.Chip onClick={() => onGoToBox?.(parentShort)}>
                ↑ Parent: #{parentShort}
              </S.Chip>
            ) : null}
          </S.Row>
        </S.Core>
      </S.TopGrid>

      <S.Divider />

      {/* Child boxes (migrated from BoxDetailView) */}
      <S.SectionHeader>
        <S.SectionTitle>Child boxes (box_id)</S.SectionTitle>
      </S.SectionHeader>

      {children.length > 0 ? (
        <S.ChipRow>
          {children.map((c) => {
            const sid = toShortId(c);
            return (
              <S.Chip
                key={c._id || c.box_id || sid}
                onClick={() => onGoToBox?.(sid)}
                title={c.label || c.name || (sid ? `#${sid}` : 'Open box')}
              >
                {c.box_id || c.shortId || c._id}
              </S.Chip>
            );
          })}
        </S.ChipRow>
      ) : (
        <S.Muted>No child boxes</S.Muted>
      )}

      {/* Tags (optional but handy in meta) */}
      {!!tags?.length && (
        <>
          <S.Divider />
          <S.SectionHeader>
            <S.SectionTitle>Tags</S.SectionTitle>
          </S.SectionHeader>
          <S.TagRow>
            {tags.map((t, i) => (
              <S.Tag key={`tag-${i}`}>{t}</S.Tag>
            ))}
          </S.TagRow>
        </>
      )}

      {/* Description / Notes (kept minimal; expand later if you want rich text) */}
      {(description || notes) && (
        <>
          <S.Divider />
          {description ? <S.Subtle>{description}</S.Subtle> : null}
          {notes ? <S.Subtle>{notes}</S.Subtle> : null}
        </>
      )}
    </S.Wrap>
  );
}
