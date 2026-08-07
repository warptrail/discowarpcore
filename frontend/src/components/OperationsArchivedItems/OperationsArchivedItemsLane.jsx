import React from 'react';
import { Link } from 'react-router-dom';
import { getItemHomeHref } from '../../api/itemDetails';
import { getItemMicroThumbnailUrl } from '../../util/itemImage';
import { formatItemCategory } from '../../util/itemCategories';
import * as S from './OperationsArchivedItemsLane.styles';

function ArchivedItemRow({ item }) {
  const imageUrl = getItemMicroThumbnailUrl(item);
  const quantity = Math.max(1, Number(item?.quantity) || 1);
  const box = item?.operationsBox;
  const context = box?.box_id
    ? `Last in #${box.box_id}${box?.label ? ` · ${box.label}` : ''}`
    : 'Former box unavailable';

  return (
    <S.ItemLink to={getItemHomeHref(item._id)}>
      <S.Thumbnail aria-hidden="true">
        {imageUrl ? <img src={imageUrl} alt="" loading="lazy" decoding="async" /> : <span>◇</span>}
      </S.Thumbnail>
      <S.ItemCopy>
        <S.ItemName>{item?.name || 'Untitled item'}</S.ItemName>
        <S.ItemMeta>
          <span>{formatItemCategory(item?.category) || 'Uncategorized'}</span>
          <span>{context}</span>
        </S.ItemMeta>
      </S.ItemCopy>
      <S.Quantity>×{quantity}</S.Quantity>
    </S.ItemLink>
  );
}

export default function OperationsArchivedItemsLane({
  items = [],
  totalCount = 0,
  loading = false,
  error = '',
}) {
  return (
    <S.Lane aria-label="No longer have items">
      <S.SignalRail aria-hidden="true" />
      <S.Header>
        <div>
          <S.Kicker>ARCHIVE // RELEASED INVENTORY</S.Kicker>
          <S.Title>No longer have</S.Title>
          <S.Subtitle>Items recorded for history, outside active storage</S.Subtitle>
        </div>
        <S.Count>
          <strong>{loading ? '…' : items.length}</strong>
          <span>{items.length === 1 ? 'match' : 'matches'} / {totalCount}</span>
        </S.Count>
      </S.Header>

      {loading ? <S.Message>Scanning archive…</S.Message> : null}
      {!loading && error ? <S.Message $error>{error}</S.Message> : null}
      {!loading && !error && items.length === 0 ? (
        <S.Message>No archived items match these controls.</S.Message>
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <S.ItemList>
          {items.map((item) => <ArchivedItemRow key={item._id} item={item} />)}
        </S.ItemList>
      ) : null}
      <S.AllItemsLink to="/all-items?status=gone">Open complete archive <span aria-hidden="true">➜</span></S.AllItemsLink>
    </S.Lane>
  );
}
