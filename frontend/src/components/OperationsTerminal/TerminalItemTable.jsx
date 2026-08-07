import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getItemHomeHref } from '../../api/itemDetails';
import {
  getItemMicroThumbnailUrl,
  getItemThumbnailUrl,
} from '../../util/itemImage';
import * as S from './TerminalItemTable.styles';

function getItemId(item, index = 0) {
  return String(item?._id || item?.id || `item-${index}`);
}

function getItemName(item) {
  return String(item?.name || item?.label || 'Untitled item').trim();
}

function getItemQuantity(item) {
  const quantity = Number(item?.quantity);
  return Number.isFinite(quantity) ? quantity : 1;
}

function getItemTags(item) {
  if (Array.isArray(item?.tags)) return item.tags.filter(Boolean);
  return String(item?.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function ItemMicroThumbnail({ item }) {
  const microUrl = getItemMicroThumbnailUrl(item);
  const fallbackUrl = getItemThumbnailUrl(item);
  const [source, setSource] = useState(microUrl);

  useEffect(() => {
    setSource(microUrl);
  }, [microUrl]);

  if (!source) return <S.MicroThumbnailFallback aria-hidden="true" />;

  return (
    <S.MicroThumbnail
      src={source}
      alt=""
      width="30"
      height="30"
      loading="lazy"
      decoding="async"
      onError={() => {
        if (fallbackUrl && source !== fallbackUrl) setSource(fallbackUrl);
        else setSource('');
      }}
    />
  );
}

function ItemPreviewImage({ item, name }) {
  const imageUrl = getItemThumbnailUrl(item);
  const [source, setSource] = useState(imageUrl);

  useEffect(() => {
    setSource(imageUrl);
  }, [imageUrl]);

  if (!source) return <S.PreviewImageFallback aria-hidden="true">ITEM</S.PreviewImageFallback>;

  return (
    <S.PreviewImage
      src={source}
      alt={`Photo of ${name}`}
      decoding="async"
      onError={() => setSource('')}
    />
  );
}

function TerminalItemPreview({ item, itemId }) {
  const routeItemId = String(item?._id || item?.id || '').trim();
  const name = getItemName(item);
  const category = String(item?.category || '').trim();
  const description = String(item?.description || '').trim();
  const notes = String(item?.notes || '').trim();
  const tags = getItemTags(item);
  const hasDetails = Boolean(description || notes || tags.length > 0);

  return (
    <S.PreviewPanel id={`terminal-item-preview-${itemId}`} role="region" aria-label={`${name} details`}>
      <S.PreviewMedia>
        <ItemPreviewImage item={item} name={name} />
      </S.PreviewMedia>
      <S.PreviewContent>
        <S.PreviewIdentity>
          <div>
            <S.PreviewName>{name}</S.PreviewName>
            <S.PreviewMeta>
              <code>QTY {getItemQuantity(item)}</code>
              {category ? <span>{category}</span> : null}
            </S.PreviewMeta>
          </div>
          {routeItemId ? (
            <S.IconLink
              as={Link}
              to={getItemHomeHref(routeItemId)}
              aria-label={`Open full item page for ${name}`}
              title="Open full item"
            >
              ↗
            </S.IconLink>
          ) : null}
        </S.PreviewIdentity>

        {hasDetails ? (
          <S.PreviewDetails>
            {description ? <S.ClampedText>{description}</S.ClampedText> : null}
            {notes ? (
              <S.PreviewNote>
                <S.MetaLabel>Notes</S.MetaLabel>
                <S.ClampedText>{notes}</S.ClampedText>
              </S.PreviewNote>
            ) : null}
            {tags.length > 0 ? (
              <S.PreviewTags aria-label="Item tags">
                {tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </S.PreviewTags>
            ) : null}
          </S.PreviewDetails>
        ) : (
          <S.PreviewEmpty>No additional details recorded.</S.PreviewEmpty>
        )}
      </S.PreviewContent>
    </S.PreviewPanel>
  );
}

export default function TerminalItemTable({
  boxTitle,
  boxHref,
  panelId,
  items = [],
}) {
  const directItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const [selectedItemId, setSelectedItemId] = useState('');

  return (
    <S.Panel id={panelId} role="region" aria-label={`Direct items in ${boxTitle}`}>
      <S.PanelHeader>
        <S.PanelHeading>
          <span>Direct items</span>
          <code>{directItems.length}</code>
        </S.PanelHeading>
        <S.IconLink
          as={Link}
          to={boxHref}
          aria-label={`Open full box page for ${boxTitle}`}
          title="Open full box"
        >
          ↗
        </S.IconLink>
      </S.PanelHeader>

      {directItems.length === 0 ? (
        <S.EmptyState>No direct items in this box.</S.EmptyState>
      ) : (
        <S.ScrollArea>
          <S.ColumnHeader aria-hidden="true">
            <span>Item</span>
            <span>Category</span>
            <span>Qty</span>
          </S.ColumnHeader>
          <S.ItemList>
            {directItems.map((item, index) => {
              const itemId = getItemId(item, index);
              const name = getItemName(item);
              const category = String(item?.category || '').trim();
              const isSelected = selectedItemId === itemId;

              return (
                <S.ItemEntry key={itemId}>
                  <S.ItemButton
                    type="button"
                    aria-expanded={isSelected}
                    aria-controls={isSelected ? `terminal-item-preview-${itemId}` : undefined}
                    onClick={() => setSelectedItemId(isSelected ? '' : itemId)}
                  >
                    <ItemMicroThumbnail item={item} />
                    <S.ItemIdentity>
                      <S.ItemName>{name}</S.ItemName>
                      {category ? <S.MobileCategory>{category}</S.MobileCategory> : null}
                    </S.ItemIdentity>
                    <S.ItemCategory>{category || '—'}</S.ItemCategory>
                    <S.ItemQuantity aria-label={`Quantity ${getItemQuantity(item)}`}>
                      ×{getItemQuantity(item)}
                    </S.ItemQuantity>
                  </S.ItemButton>
                  {isSelected ? <TerminalItemPreview item={item} itemId={itemId} /> : null}
                </S.ItemEntry>
              );
            })}
          </S.ItemList>
        </S.ScrollArea>
      )}
    </S.Panel>
  );
}
