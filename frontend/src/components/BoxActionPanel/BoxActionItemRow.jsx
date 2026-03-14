import React from 'react';
import { getItemHomeHref } from '../../api/itemDetails';
import {
  ActionButton,
  ItemActions,
  ItemCard,
  ItemMain,
  ItemName,
  ItemNameLink,
  QtyPill,
} from './BoxActionPanel.styles';

export default function BoxActionItemRow({
  item,
  isMoving,
  isEditing,
  hasEditingFocus,
  isFocusedRow,
  isSelectingMoveTarget,
  zipProp,
  flashProp,
  isEntering,
  isPreEnter,
  onEdit,
  onMove,
  onOrphan,
}) {
  const itemName = item?.name || '(Unnamed Item)';
  const hasQuantity =
    item?.quantity !== null &&
    item?.quantity !== undefined &&
    item?.quantity !== '';
  const itemHref = item?._id ? getItemHomeHref(item._id) : null;

  return (
    <ItemCard
      $zip={zipProp}
      $flash={flashProp}
      $flashDelay={isEntering ? 280 : 0}
      $preEnter={isPreEnter}
      $focusMode={hasEditingFocus}
      $isFocused={isFocusedRow}
    >
      <ItemMain>
        {itemHref ? (
          <ItemNameLink to={itemHref} title={itemName}>
            {itemName}
          </ItemNameLink>
        ) : (
          <ItemName title={itemName}>{itemName}</ItemName>
        )}
      </ItemMain>

      {hasQuantity && <QtyPill>Qty {item.quantity}</QtyPill>}

      <ItemActions>
        <ActionButton
          type="button"
          $tone="primary"
          $active={isEditing}
          onClick={onEdit}
          disabled={isMoving}
        >
          {isEditing ? 'Editing' : 'Edit'}
        </ActionButton>

        <ActionButton
          type="button"
          $tone="neutral"
          $active={isSelectingMoveTarget}
          onClick={onMove}
          disabled={isMoving}
        >
          Move
        </ActionButton>

        <ActionButton
          type="button"
          $tone="danger"
          onClick={onOrphan}
          disabled={isMoving}
        >
          Orphan
        </ActionButton>
      </ItemActions>
    </ItemCard>
  );
}
