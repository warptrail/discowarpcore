// BoxMetaPanel.jsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import fillerImg from '/src/assets/filler.jpeg'; // adjust path if not using Vite

const EMPTY_ARR = Object.freeze([]);

const Wrap = styled.section`
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid #222;
  border-radius: 16px;
  background: #131414;
`;

/* Header: label (big, centered) above digital Box ID */
const Header = styled.div`
  display: grid;
  gap: 10px;
  justify-items: center;
`;

const BoxTitle = styled.h2`
  margin: 0;
  text-align: center;
  font-size: clamp(1.25rem, 3.2vw, 1.8rem);
  font-weight: 900;
  color: #f2fff2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 92%;
`;

const ShortIdBlock = styled.div`
  display: grid;
  place-items: center;
  background: #000;
  border: 1px solid #1f4a30;
  border-radius: 14px;
  padding: 10px 14px;
  box-shadow: inset 0 0 12px rgba(0, 255, 135, 0.16);

  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  color: #39ff88;
  text-shadow: 0 0 6px rgba(57, 255, 136, 0.55),
    0 0 18px rgba(57, 255, 136, 0.28);
  font-size: clamp(1.6rem, 3.2vw, 2.2rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1;
`;

/* Text sections: consistent typography for location/description/notes/counts */
const TextBlock = styled.div`
  color: #dbdbdb;
  font-size: 0.95rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;

  strong {
    color: #a6f3bf;
    font-weight: 700;
  }
`;

/* Hierarchy links (stacked typography chips) */
const LinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const LinkChip = styled.button`
  all: unset;
  cursor: pointer;
  background: rgba(126, 224, 161, 0.08);
  border: 1px solid rgba(126, 224, 161, 0.25);
  border-radius: 12px;
  padding: 8px 10px;
  min-width: 160px;

  display: grid;
  grid-template-rows: auto auto;
  align-items: center;
  justify-items: center;
  gap: 2px;

  &:hover {
    background: rgba(126, 224, 161, 0.14);
    border-color: rgba(126, 224, 161, 0.45);
  }
`;

const ChipTop = styled.div`
  font-size: 0.92rem;
  color: #e8ffe8;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
  white-space: nowrap;
`;

const ChipBottom = styled.div`
  font-size: 0.82rem;
  color: #a6f3bf;
`;

/* Bottom row: image (left) and tags (right) */
const BottomGrid = styled.div`
  display: grid;
  align-items: start;
  gap: 12px;
  grid-template-columns: 140px 1fr; /* 👈 always 2 cols, even on mobile */

  @media (min-width: 900px) {
    grid-template-columns: 180px 1fr; /* scale up thumbnail a bit on wide screens */
  }
`;

const ImageSquare = styled.div`
  all: unset;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #2a2a2a;
  background: #0f0f0f;
  display: block;
  cursor: pointer; /* ready for full-view later */
  transition: transform 0.12s ease, border-color 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #3b3b3b;
  }
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const TagPanel = styled.div`
  display: grid;
  gap: 8px;
  align-content: start;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagChip = styled.span`
  all: unset;
  cursor: pointer;
  display: inline-block;

  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 999px;

  /* base size (desktop/tablet) */
  font-size: 0.9rem;
  font-weight: 600;
  color: #eaeaea;
  padding: 6px 10px;
  margin: 2px 0;

  /* nicer hit target on touch devices / small screens */
  @media (max-width: 740px) {
    font-size: 1rem;
    padding: 8px 12px;
  }

  &:hover {
    border-color: #3a3a3a;
    background: #222;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const NoTags = styled.div`
  padding: 12px;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#9aa6b2'};
  font-style: italic;
  opacity: 0.8;
`;

export default function BoxMetaPanel({
  box,
  onGoToBox, // fn(shortId) for parent/child navigation
  itemsCount: overrideItemsCount,
  totalQuantity: overrideTotalQty,
}) {
  if (!box) return null;

  const {
    label,
    box_id,
    description,
    notes,
    tags,
    imagePath,
    location,
    parentBox,
    children,
    boxes,
    items,
  } = box;

  // Safely derive items array without hooks
  const itemsHere = Array.isArray(items) ? items : EMPTY_ARR;

  // Compute base counts synchronously (cheap)
  const baseCount = itemsHere.length;
  const baseQty = itemsHere.reduce(
    (acc, it) => acc + (Number(it?.quantity ?? it?.qty ?? 1) || 0),
    0
  );

  // Allow upstream overrides (e.g., subtree totals)
  const count = overrideItemsCount ?? baseCount;
  const totalQty = overrideTotalQty ?? baseQty;

  const childBoxes = Array.isArray(children) ? children : boxes || [];

  if (!box) return null;

  const imgSrc = imagePath || fillerImg;
  const toShortId = (maybeObj) =>
    typeof maybeObj === 'object' && maybeObj !== null
      ? maybeObj.box_id
      : maybeObj;

  const parentShort = toShortId(parentBox);

  return (
    <Wrap>
      {/* Label + Digital ID */}
      <Header>
        <BoxTitle title={label || '(Unnamed Box)'}>
          {label || '(Unnamed Box)'}
        </BoxTitle>
        <ShortIdBlock>#{box_id}</ShortIdBlock>
      </Header>

      {/* Meta as uniform text blocks */}
      {location ? (
        <TextBlock>
          <strong>Location:</strong> {location}
        </TextBlock>
      ) : null}
      <TextBlock>
        <strong>Items:</strong> {count} • <strong>Total qty:</strong> {totalQty}
      </TextBlock>
      {description ? (
        <TextBlock>
          <strong>Description:</strong> {description}
        </TextBlock>
      ) : null}
      {notes ? (
        <TextBlock>
          <strong>Notes:</strong> {notes}
        </TextBlock>
      ) : null}

      {/* Parent + Children (stacked chips) */}
      {parentShort || childBoxes.length ? (
        <LinksRow>
          {parentShort && (
            <LinkChip onClick={() => onGoToBox?.(String(parentShort))}>
              <ChipTop>Parent</ChipTop>
              <ChipBottom>#{parentShort}</ChipBottom>
            </LinkChip>
          )}
          {childBoxes.map((cb) => {
            const short = toShortId(cb);
            const lbl =
              typeof cb === 'object' ? cb?.label || '(Unnamed)' : `Box`;
            const idText =
              typeof cb === 'object' ? `#${cb.box_id}` : `#${String(short)}`;
            return (
              <LinkChip
                key={`child-${idText}`}
                onClick={() => onGoToBox?.(String(short))}
              >
                <ChipTop>{lbl}</ChipTop>
                <ChipBottom>{idText}</ChipBottom>
              </LinkChip>
            );
          })}
        </LinksRow>
      ) : null}

      {/* Bottom split: image (left) and tags (right) */}
      <BottomGrid>
        <ImageSquare onClick={() => onOpenBoxImage?.(box_id)}>
          {' '}
          {/* optional handler */}
          <Img src={imgSrc} alt={label || 'Box image'} />
        </ImageSquare>

        <TagPanel>
          {Array.isArray(tags) && tags.length ? (
            <TagRow>
              {tags.map((t) => (
                <TagChip key={`boxtag-${t}`}>#{t}</TagChip>
              ))}
            </TagRow>
          ) : (
            <NoTags>no tags</NoTags>
          )}
        </TagPanel>
      </BottomGrid>
    </Wrap>
  );
}
