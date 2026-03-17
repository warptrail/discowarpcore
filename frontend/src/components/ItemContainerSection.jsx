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

  const handleSelectDestination = async ({
    destBoxId,
    destLabel,
    destShortId,
  }) => {
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
    <S.ContainerCard aria-label="Container section">
      <S.ContainerTitle>Container</S.ContainerTitle>

      <S.ContainerBody>
        <S.ContainerRow>
          <S.ContainerLabel>Current box</S.ContainerLabel>
          <S.ContainerValue>
            {isBoxed ? (
              boxShortId ? (
                <S.ContainerLink to={`/boxes/${encodeURIComponent(boxShortId)}`}>
                  {boxLabel}
                </S.ContainerLink>
              ) : (
                boxLabel
              )
            ) : (
              <S.ContainerMuted>None (orphaned)</S.ContainerMuted>
            )}
          </S.ContainerValue>
        </S.ContainerRow>

        <S.ContainerRow>
          <S.ContainerLabel>Location source</S.ContainerLabel>
          <S.ContainerValue>
            {isBoxed
              ? 'Inherited from parent box'
              : 'Uses item-level location'}
          </S.ContainerValue>
        </S.ContainerRow>
      </S.ContainerBody>

      <S.ContainerActions>
        {isBoxed ? (
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
            currentBoxId={boxMongoId || null}
            onBoxSelected={handleSelectDestination}
          />
        </S.ContainerPickerWrap>
      ) : null}

      {error ? <S.ContainerError role="alert">{error}</S.ContainerError> : null}
    </S.ContainerCard>
  );
}
