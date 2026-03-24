import React, { useState } from 'react';
import MoveItemToOtherBox from './MoveItemToOtherBox';
import * as S from '../styles/ItemPage.styles';
import { getItemOwnershipContext } from '../util/itemOwnership';

export default function ItemContainerSection({
  item,
  pending = false,
  error = '',
  onMoveItem,
  onRemoveFromBox,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const ownership = getItemOwnershipContext(item);
  const box = ownership.box ?? null;
  const boxMongoId = ownership.boxMongoId || (box?._id ? String(box._id) : '');
  const boxShortId = ownership.boxId || (box?.box_id ? String(box.box_id) : '');
  const boxLabel =
    ownership.boxLabel ||
    box?.label ||
    (boxShortId ? `Box ${boxShortId}` : 'Current box');
  const isBoxed = ownership.isBoxed;
  const isGone = String(item?.item_status || '').toLowerCase() === 'gone';
  const boxHref = boxShortId ? `/boxes/${encodeURIComponent(boxShortId)}` : '';
  const resolvedLocation = String(ownership.effectiveLocation || '').trim();
  const locationSource = isGone
    ? 'Historical state'
    : ownership.effectiveLocationSource === 'box'
      ? 'Set on current box'
      : ownership.effectiveLocationSource === 'inherited'
        ? 'Inherited from parent box'
        : ownership.effectiveLocationSource === 'item'
          ? 'Item-level location'
          : 'No location metadata set';

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

  return (
    <S.ContainerCard aria-label="Box section">
      <S.ContainerTitle>Box</S.ContainerTitle>

      <S.ContainerBody>
        <S.ContainerRow $prominent>
          <S.ContainerLabel>Current box</S.ContainerLabel>
          <S.ContainerValue>
            {isGone ? (
              <S.ContainerMuted>No Longer Have</S.ContainerMuted>
            ) : isBoxed ? (
              <S.ContainerBoxValueGroup>
                {boxHref ? (
                  <S.ContainerPrimaryLink to={boxHref}>
                    {boxLabel}
                  </S.ContainerPrimaryLink>
                ) : (
                  <S.ContainerPrimaryValue>{boxLabel}</S.ContainerPrimaryValue>
                )}
                {boxShortId
                  ? (boxHref ? (
                      <S.ContainerChipLink to={boxHref}>
                        <S.ContainerBoxIdChip>BOX {boxShortId}</S.ContainerBoxIdChip>
                      </S.ContainerChipLink>
                    ) : (
                      <S.ContainerBoxIdChip>BOX {boxShortId}</S.ContainerBoxIdChip>
                    ))
                  : null}
              </S.ContainerBoxValueGroup>
            ) : (
              <S.ContainerMuted>None (orphaned)</S.ContainerMuted>
            )}
          </S.ContainerValue>
        </S.ContainerRow>

        <S.ContainerRow $prominent>
          <S.ContainerLabel>Location</S.ContainerLabel>
          <S.ContainerValue>
            {resolvedLocation ? (
              <S.ContainerPrimaryValue>{resolvedLocation}</S.ContainerPrimaryValue>
            ) : (
              <S.ContainerMuted>—</S.ContainerMuted>
            )}
          </S.ContainerValue>
        </S.ContainerRow>

        <S.ContainerRow>
          <S.ContainerLabel>Location source</S.ContainerLabel>
          <S.ContainerValue>
            <S.ContainerSecondaryValue>{locationSource}</S.ContainerSecondaryValue>
          </S.ContainerValue>
        </S.ContainerRow>
      </S.ContainerBody>

      <S.ContainerActions>
        {isGone ? (
          <S.ContainerMuted>
            Lifecycle actions for gone items are available in Edit mode.
          </S.ContainerMuted>
        ) : isBoxed ? (
          <>
            <S.ContainerButton
              type="button"
              disabled={pending}
              onClick={() => setShowPicker((prev) => !prev)}
            >
              Move item
            </S.ContainerButton>

            <S.ContainerButton
              type="button"
              disabled={pending || !boxMongoId}
              onClick={handleRemoveFromBox}
            >
              Remove from box
            </S.ContainerButton>
          </>
        ) : (
          <S.ContainerButton
            type="button"
            disabled={pending}
            onClick={() => setShowPicker((prev) => !prev)}
          >
            Place in box
          </S.ContainerButton>
        )}
      </S.ContainerActions>

      {showPicker ? (
        <S.ContainerPickerWrap>
          <MoveItemToOtherBox
            itemId={item?._id}
            currentBoxId={boxMongoId || null}
            onBoxSelected={handleSelectDestination}
          />
        </S.ContainerPickerWrap>
      ) : null}

      {error ? <S.ContainerError role="alert">{error}</S.ContainerError> : null}
    </S.ContainerCard>
  );
}
