import React, { useState, useRef, useLayoutEffect } from 'react';
import * as S from '../styles/ItemRow.styles';
import ItemDetails from './ItemDetails';

export default function ItemRow({
  item,
  isOpen = false,
  onOpen,
  accent = 'blue',
  pulsing = [], // array of pulsing IDs
  collapseDurMs = 300,
  effects,
  onTogglePulse,
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
      $pulsing={isPulsing}
      $collapseDurMs={collapseDurMs}
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
        style={{ height: `${targetHeight}px` }}
      >
        <div ref={contentRef}>
          <S.DetailsCard>
            <ItemDetails item={item} onTogglePulse={onTogglePulse} />
          </S.DetailsCard>
        </div>
      </S.Collapse>
    </S.Wrapper>
  );
}
