import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { getItemHomeHref } from '../api/itemDetails';
import RetrievalImageLightbox from './Retrieval/RetrievalImageLightbox';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../styles/tokens';

function getItemId(item) {
  return String(item?._id ?? item?.id ?? '').trim();
}

function getItemName(item) {
  return String(item?.name || '(Unnamed Item)').trim();
}

function getItemThumbnailUrl(item) {
  return String(
    item?.image?.thumb?.url ||
      item?.image?.display?.url ||
      item?.image?.original?.url ||
      item?.image?.url ||
      item?.imagePath ||
      ''
  ).trim();
}

function getBoxContext(item) {
  const label = String(item?.parentBoxLabel || '').trim();
  const boxId = String(item?.parentBoxId || '').trim();

  if (label && boxId) return `${label} (#${boxId})`;
  if (label) return label;
  if (boxId) return `Box #${boxId}`;
  return '';
}

export default function CondensedBoxItemList({
  items,
  emptyMessage = 'This box has no items.',
  selectionEnabled = false,
  selectedItemIds,
  onSelectionChange,
}) {
  const [expandedImage, setExpandedImage] = useState(null);
  const list = Array.isArray(items) ? items : [];
  const selectedIds = selectedItemIds instanceof Set ? selectedItemIds : new Set();

  if (!list.length) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <>
      <List aria-label="Condensed box item list">
        {list.map((item) => {
          const id = getItemId(item);
          if (!id) return null;

          const itemName = getItemName(item);
          const thumbnailUrl = getItemThumbnailUrl(item);
          const itemHref = getItemHomeHref(id);
          const boxContext = getBoxContext(item);
          const isSelected = selectedIds.has(id);
          const quantity =
            item?.quantity !== null &&
            item?.quantity !== undefined &&
            item?.quantity !== ''
              ? item.quantity
              : null;

          return (
            <Row key={id} $selectionEnabled={selectionEnabled}>
              {selectionEnabled ? (
                <SelectCell>
                  <SelectCheckbox
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) =>
                      onSelectionChange?.(id, event.target.checked)
                    }
                    aria-label={`Select ${itemName}`}
                  />
                </SelectCell>
              ) : null}

              {thumbnailUrl ? (
                <ThumbButton
                  type="button"
                  onClick={() =>
                    setExpandedImage({
                      src: thumbnailUrl,
                      name: itemName,
                    })
                  }
                  aria-label={`Expand image for ${itemName}`}
                >
                  <ThumbImage src={thumbnailUrl} alt={`${itemName} thumbnail`} loading="lazy" />
                </ThumbButton>
              ) : (
                <ThumbPlaceholder aria-hidden="true" />
              )}

              <ItemText>
                <ItemNameLink to={itemHref}>{itemName}</ItemNameLink>
                {boxContext ? <ItemContext>{boxContext}</ItemContext> : null}
              </ItemText>

              {quantity !== null ? (
                <QuantityPill $selectionEnabled={selectionEnabled}>
                  Qty {quantity}
                </QuantityPill>
              ) : null}
            </Row>
          );
        })}
      </List>

      <RetrievalImageLightbox
        isOpen={Boolean(expandedImage)}
        imageSrc={expandedImage?.src || ''}
        itemName={expandedImage?.name || ''}
        onClose={() => setExpandedImage(null)}
      />
    </>
  );
}

const List = styled.ul`
  list-style: none;
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  background: #0d1012;
`;

const Row = styled.li`
  display: grid;
  grid-template-columns: ${({ $selectionEnabled }) =>
    $selectionEnabled ? '34px 64px minmax(0, 1fr) auto' : '64px minmax(0, 1fr) auto'};
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.52rem 0.7rem;
  background: #13181c;

  &:nth-child(even) {
    background: #182026;
  }

  &:hover {
    background: #1d282c;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: ${({ $selectionEnabled }) =>
      $selectionEnabled ? '30px 54px minmax(0, 1fr)' : '54px minmax(0, 1fr)'};
    gap: 0.52rem;
    padding: 0.42rem 0.5rem;
  }
`;

const SelectCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SelectCheckbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #4ec77b;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.52);
    outline-offset: 2px;
  }
`;

const thumbFrame = `
  width: 56px;
  height: 56px;
  border-radius: 10px;
`;

const ThumbButton = styled.button`
  ${thumbFrame};
  display: block;
  padding: 0;
  border: 1px solid rgba(127, 215, 255, 0.24);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  cursor: zoom-in;

  &:hover {
    border-color: rgba(127, 215, 255, 0.58);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.26);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 48px;
    height: 48px;
    border-radius: 8px;
  }
`;

const ThumbImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbPlaceholder = styled.div`
  ${thumbFrame};
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.018)),
    rgba(255, 255, 255, 0.025);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 48px;
    height: 48px;
    border-radius: 8px;
  }
`;

const ItemText = styled.div`
  display: grid;
  gap: 0.18rem;
  min-width: 0;
`;

const ItemNameLink = styled(Link)`
  min-width: 0;
  color: #edf5f7;
  font-size: 0.96rem;
  font-weight: 760;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    color: #9ee8e1;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const ItemContext = styled.span`
  min-width: 0;
  color: rgba(230, 237, 243, 0.56);
  font-size: 0.74rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const QuantityPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 0.5rem;
  border-radius: 999px;
  border: 1px solid rgba(167, 182, 255, 0.34);
  background: rgba(167, 182, 255, 0.1);
  color: #dce4ff;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-column: ${({ $selectionEnabled }) => ($selectionEnabled ? '3' : '2')};
    justify-self: start;
    min-height: 24px;
    padding: 0 0.4rem;
    font-size: ${MOBILE_FONT_XS};
  }
`;

const EmptyState = styled.div`
  border: 1px dashed rgba(255, 255, 255, 0.14);
  border-radius: ${MOBILE_PANEL_RADIUS};
  color: rgba(230, 237, 243, 0.72);
  padding: 0.75rem;
  text-align: center;
`;
