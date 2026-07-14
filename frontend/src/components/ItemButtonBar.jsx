import React, { useState } from 'react';
import MoveItemToOtherBox from './MoveItemToOtherBox';
import * as S from '../styles/ItemPage.styles';
import { getItemOwnershipContext } from '../util/itemOwnership';

export default function ItemButtonBar({
  item,
  isEditing = false,
  pending = false,
  error = '',
  onMoveItem,
  onRemoveFromBox,
  onToggleConsumable,
  timestampActions = [],
}) {
  const [showPicker, setShowPicker] = useState(false);
  const ownership = getItemOwnershipContext(item);
  const box = ownership.box ?? null;
  const boxMongoId = ownership.boxMongoId || (box?._id ? String(box._id) : '');
  const isGone = String(item?.item_status || '').toLowerCase() === 'gone';
  const isConsumable = Boolean(item?.isConsumable);
  const resolvedTimestampActions = Array.isArray(timestampActions)
    ? timestampActions
    : [];

  if (!isEditing && resolvedTimestampActions.length === 0) {
    return null;
  }

  const handleSelectDestination = async ({
    destBoxId,
    destLabel,
    destShortId,
    isOrphanedDestination = false,
  }) => {
    if (isOrphanedDestination) {
      if (!boxMongoId || typeof onRemoveFromBox !== 'function') return;
      const ok = await onRemoveFromBox({ boxMongoId });
      if (ok) setShowPicker(false);
      return;
    }
    if (!destBoxId || typeof onMoveItem !== 'function') return;
    const ok = await onMoveItem({
      destBoxId,
      destLabel,
      destShortId,
      sourceBoxId: boxMongoId || undefined,
    });
    if (ok) setShowPicker(false);
  };

  const handleRemoveFromBox = async () => {
    if (!boxMongoId || typeof onRemoveFromBox !== 'function') return;
    const ok = await onRemoveFromBox({ boxMongoId });
    if (ok) setShowPicker(false);
  };

  const showPickerButton = () => setShowPicker((prev) => !prev);

  return (
    <S.ItemButtonBar aria-label={isEditing ? 'Item actions' : 'Item timestamps'}>
      {isEditing ? (
        <S.ContainerActions>
          {isGone ? (
            <S.ContainerMuted>
              Lifecycle actions for gone items are available in Edit mode.
            </S.ContainerMuted>
          ) : ownership.isBoxed ? (
            <>
              <S.ContainerButton type="button" disabled={pending} onClick={showPickerButton}>
                Move item
              </S.ContainerButton>
              <S.ContainerButton
                type="button"
                disabled={pending || !boxMongoId}
                onClick={handleRemoveFromBox}
              >
                Remove from box
              </S.ContainerButton>
              <S.ContainerButton
                type="button"
                disabled={pending}
                onClick={onToggleConsumable}
                $active={isConsumable}
              >
                {isConsumable ? 'Consumable on' : 'Consumable off'}
              </S.ContainerButton>
            </>
          ) : (
            <>
              <S.ContainerButton type="button" disabled={pending} onClick={showPickerButton}>
                Place in box
              </S.ContainerButton>
              <S.ContainerButton
                type="button"
                disabled={pending}
                onClick={onToggleConsumable}
                $active={isConsumable}
              >
                {isConsumable ? 'Consumable on' : 'Consumable off'}
              </S.ContainerButton>
            </>
          )}
        </S.ContainerActions>
      ) : resolvedTimestampActions.length ? (
        <S.ContainerTimestampSection>
          <S.ContainerTimestampLabel>Item timestamps</S.ContainerTimestampLabel>
          <S.ContainerTimestampActions>
            {resolvedTimestampActions.map((action) => (
              <S.ContainerTimestampButton
                key={action.id}
                type="button"
                $tone={action.tone}
                onClick={action.onClick}
                disabled={pending || action.disabled}
              >
                {action.label}
              </S.ContainerTimestampButton>
            ))}
          </S.ContainerTimestampActions>
        </S.ContainerTimestampSection>
      ) : null}

      {isEditing && showPicker ? (
        <S.ContainerPickerWrap>
          <MoveItemToOtherBox
            itemId={item?._id}
            currentBoxId={boxMongoId || null}
            onBoxSelected={handleSelectDestination}
          />
        </S.ContainerPickerWrap>
      ) : null}

      {error ? <S.ContainerError role="alert">{error}</S.ContainerError> : null}
    </S.ItemButtonBar>
  );
}
