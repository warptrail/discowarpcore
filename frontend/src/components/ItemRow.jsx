import React, { useState, useRef, useLayoutEffect } from 'react';
import * as S from '../styles/ItemRow.styles';
import ItemDetails from './ItemDetails';

export default function ItemRow({
  item,
  isOpen = false,
  onOpen,
  accent = 'blue',
  pulsing = false, // now boolean for this row
  flashing = false, // new prop
  collapseDurMs = 300,
  triggerFlash,
  startPulse,
  stopPulse,
}) {
  const {
    _id,
    name,
    quantity,
    tags = [],
    notes,
    parentBoxLabel,
    parentBoxId,
  } = item;
  const itemId = String(_id);

  const contentRef = useRef(null);
  const [targetHeight, setTargetHeight] = useState(0);

  // measure details height when open
  useLayoutEffect(() => {
    if (isOpen && contentRef.current) {
      setTargetHeight(contentRef.current.scrollHeight);
    } else {
      setTargetHeight(0);
    }
  }, [isOpen, item]);

  const handleRowClick = () => {
    onOpen?.(isOpen ? null : itemId);
  };

  const pulsingArray = Array.isArray(pulsing) ? pulsing : [];
  const isPulsing = pulsingArray.includes(itemId);

  return (
    <S.Wrapper
      $accent={accent}
      $open={isOpen}
      $pulsing={pulsing}
      $flashing={flashing}
      $collapseDurMs={collapseDurMs}
      $height={targetHeight}
    >
      <S.Row onClick={handleRowClick} $open={isOpen}>
        <S.Left>
          <S.Title>{name}</S.Title>

          {(parentBoxLabel || parentBoxId) && (
            <S.Breadcrumb>
              {parentBoxLabel} {!!parentBoxId && `(${parentBoxId})`}
            </S.Breadcrumb>
          )}

          {!!tags.length && (
            <S.TagRow>
              {tags.map((t) => (
                <S.Tag key={t}>{t}</S.Tag>
              ))}
            </S.TagRow>
          )}

          {notes && <S.Notes>{notes}</S.Notes>}
        </S.Left>

        <S.Right>{quantity != null && <S.Qty>x{quantity}</S.Qty>}</S.Right>
      </S.Row>

      <S.Collapse
        $open={isOpen}
        $collapseDurMs={collapseDurMs}
        $height={targetHeight} // 👈 pass as prop instead of inline style
      >
        <div ref={contentRef}>
          <S.DetailsCard>
            <ItemDetails
              item={item}
              onFlash={() => triggerFlash?.(item._id)}
              onStartPulse={() => startPulse?.(item._id)}
              onStopPulse={() => stopPulse?.(item._id)}
            />
          </S.DetailsCard>
        </div>
      </S.Collapse>
    </S.Wrapper>
  );
}
