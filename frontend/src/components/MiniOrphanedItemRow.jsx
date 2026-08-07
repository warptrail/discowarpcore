import React from 'react';
import { Link } from 'react-router-dom';

import { getItemHomeHref } from '../api/itemDetails';
import { formatItemCategory } from '../util/itemCategories';
import { getItemMicroThumbnailUrl } from '../util/itemImage';
import * as S from './MiniOrphanedList.styles';

export default function MiniOrphanedItemRow({
  item,
  assigning,
  assignmentBusy,
  assignLabel,
  boxMongoId,
  formatOrphanedTime,
  onAssign,
}) {
  const itemId = String(item?._id || '').trim();
  const itemName = String(item?.name || '').trim() || '(Unnamed Item)';
  const imageUrl = getItemMicroThumbnailUrl(item);
  const categoryLabel = formatItemCategory(item?.category);
  const locationLabel = String(item?.location || '').trim();

  return (
    <S.ItemRow>
      <S.ThumbFrame aria-hidden="true">
        {imageUrl ? <S.ThumbImage src={imageUrl} alt="" /> : <S.ThumbPlaceholder />}
      </S.ThumbFrame>

      <S.ItemIdentity>
        {itemId ? (
          <S.NameLink as={Link} to={getItemHomeHref(itemId)} title={itemName}>
            {itemName}
          </S.NameLink>
        ) : (
          <S.Name title={itemName}>{itemName}</S.Name>
        )}

        <S.MetaLine>
          <S.MetaItem>{categoryLabel}</S.MetaItem>
          <S.MetaItem>qty {item?.quantity ?? 1}</S.MetaItem>
          <S.MetaItem>{formatOrphanedTime(item?.orphanedAt)}</S.MetaItem>
          {locationLabel ? <S.MetaItem>{locationLabel}</S.MetaItem> : null}
        </S.MetaLine>
      </S.ItemIdentity>

      <S.AssignButton
        type="button"
        onClick={() => onAssign(item)}
        disabled={!boxMongoId || assignmentBusy}
        aria-label={`${assignLabel} ${itemName}`}
      >
        {assigning ? 'Working…' : assignLabel}
      </S.AssignButton>
    </S.ItemRow>
  );
}
