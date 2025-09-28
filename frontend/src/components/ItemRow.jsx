import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import * as S from '../styles/ItemRow.styles';
import ItemDetails from './ItemDetails';
import EditItemDetailsForm from './EditItemDetailsForm';

export default function ItemRow({
  item,
  isOpen = false,
  onOpen,
  onSaved,
  accent = 'blue',
  pulsing = [],
  collapseDurMs = 300,
  flashing = false,
  flashColor = 'blue',
  triggerFlash,
  startPulse,
  stopPulse,
}) {
  const {
    _id,
    name,
    quantity,
    tags = [],
    parentBoxLabel,
    parentBoxId,
    notes,
  } = item;

  const [editMode, setEditMode] = useState(false);
  const [targetHeight, setTargetHeight] = useState(0);
  const contentRef = useRef(null);

  // ---- measure helpers
  const measureNow = () => {
    const el = contentRef.current;
    if (!el) return;
    setTargetHeight(el.scrollHeight);
  };

  // Re-measure on open/edit/item switch (double rAF ensures subtree has swapped)
  useLayoutEffect(() => {
    if (!isOpen) {
      setTargetHeight(0);
      return;
    }
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(measureNow);
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, [isOpen, editMode, _id]); // depend on id (or item) to catch item changes

  // Track content growth (e.g., ItemDetails finishes loading)
  useEffect(() => {
    if (!isOpen || !contentRef.current || typeof ResizeObserver === 'undefined')
      return;

    const ro = new ResizeObserver(() => {
      // Only adjust while open
      if (contentRef.current) setTargetHeight(contentRef.current.scrollHeight);
    });

    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [isOpen]);

  const handleRowClick = () => onOpen?.(isOpen ? null : _id);
  const handleToggleEdit = (e) => {
    e.stopPropagation();
    setEditMode((prev) => !prev);
  };

  return (
    <S.Wrapper
      $accent={accent}
      $open={isOpen}
      $pulsing={pulsing}
      $flashing={flashing}
      $flashColor={flashColor}
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

        <S.Right>
          {quantity != null && <S.Qty>x{quantity}</S.Qty>}
          {isOpen && (
            <S.EditButton onClick={handleToggleEdit}>
              {editMode ? 'Close Edit' : 'Edit'}
            </S.EditButton>
          )}
        </S.Right>
      </S.Row>

      <S.Collapse
        $open={isOpen}
        $collapseDurMs={collapseDurMs}
        $height={targetHeight}
      >
        <div ref={contentRef}>
          <S.DetailsCard>
            {editMode ? (
              <EditItemDetailsForm
                item={item}
                triggerFlash={triggerFlash}
                onSaved={(updated) => {
                  onSaved?.(updated);
                }}
              />
            ) : (
              <ItemDetails
                itemId={_id}
                triggerFlash={triggerFlash}
                onStartPulse={() => startPulse?.(_id)}
                onStopPulse={() => stopPulse?.(_id)}
              />
            )}
          </S.DetailsCard>
        </div>
      </S.Collapse>
    </S.Wrapper>
  );
}
