import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import * as S from '../styles/ItemRow.styles';
import ItemDetails from './ItemDetails';
import EditItemDetailsForm from './EditItemDetailsForm';
import { getItemHomeHref } from '../api/itemDetails';
import { formatItemCategory, normalizeItemCategory } from '../util/itemCategories';
import useIsMobile from '../hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';

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
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const {
    _id,
    name,
    quantity,
    tags = [],
    parentBoxLabel,
    parentBoxId,
    description,
    category,
  } = item;
  const categoryLabel = formatItemCategory(normalizeItemCategory(category));
  const [localImage, setLocalImage] = useState(item?.image || null);
  const [localImagePath, setLocalImagePath] = useState(item?.imagePath || '');
  const collapsedThumbUrl =
    localImage?.thumb?.url ||
    localImage?.display?.url ||
    localImage?.original?.url ||
    localImage?.url ||
    localImagePath ||
    '';
  const itemForView = {
    ...item,
    image: localImage,
    imagePath: localImagePath,
  };

  const [editMode, setEditMode] = useState(false);
  const [targetHeight, setTargetHeight] = useState(0);
  const contentRef = useRef(null);
  const itemHomeHref = _id ? getItemHomeHref(_id) : null;
  const rowIsOpen = !isMobile && isOpen;

  // ---- measure helpers
  const measureNow = () => {
    const el = contentRef.current;
    if (!el) return;
    setTargetHeight(el.scrollHeight);
  };

  // Re-measure on open/edit/item switch (double rAF ensures subtree has swapped)
  useLayoutEffect(() => {
    if (!rowIsOpen) {
      setTargetHeight(0);
      return;
    }
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(measureNow);
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, [rowIsOpen, editMode, _id]); // depend on id (or item) to catch item changes

  // Track content growth (e.g., ItemDetails finishes loading)
  useEffect(() => {
    if (!rowIsOpen || !contentRef.current || typeof ResizeObserver === 'undefined')
      return;

    const ro = new ResizeObserver(() => {
      // Only adjust while open
      if (contentRef.current) setTargetHeight(contentRef.current.scrollHeight);
    });

    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [rowIsOpen]);

  useEffect(() => {
    if (isMobile && editMode) {
      setEditMode(false);
    }
  }, [isMobile, editMode]);

  useEffect(() => {
    setLocalImage(item?.image || null);
    setLocalImagePath(item?.imagePath || '');
  }, [_id, item?.image, item?.imagePath]);

  const handleRowClick = () => {
    if (!_id) return;

    if (isMobile) {
      navigate(getItemHomeHref(_id));
      return;
    }

    onOpen?.(rowIsOpen ? null : _id);
  };

  const handleToggleEdit = (e) => {
    e?.stopPropagation?.();
    if (!_id) return;
    if (isMobile) return;

    if (!rowIsOpen) {
      onOpen?.(_id);
      if (_id) triggerFlash?.(_id, 'yellow');
      setEditMode(true);
      return;
    }
    if (_id) triggerFlash?.(_id, 'yellow');
    setEditMode((prev) => !prev);
  };

  return (
    <S.Wrapper
      $accent={accent}
      $open={rowIsOpen}
      $pulsing={pulsing}
      $flashing={flashing}
      $flashColor={flashColor}
      $collapseDurMs={collapseDurMs}
      $height={targetHeight}
    >
      <S.Row onClick={handleRowClick} $open={rowIsOpen}>
        <S.RowHeader $open={rowIsOpen}>
          <S.RowMain>
            {!rowIsOpen && (
              <S.RowThumb>
                {collapsedThumbUrl ? (
                  <S.RowThumbImage src={collapsedThumbUrl} alt={`${name || 'Item'} thumbnail`} />
                ) : (
                  <S.RowThumbPlaceholder aria-hidden="true" />
                )}
              </S.RowThumb>
            )}

            <S.TitleGroup>
              {itemHomeHref ? (
                <S.TitleLink to={itemHomeHref} onClick={(e) => e.stopPropagation()}>
                  {name}
                </S.TitleLink>
              ) : (
                <S.Title>{name}</S.Title>
              )}
            </S.TitleGroup>
          </S.RowMain>

          <S.RowActions>
            {!rowIsOpen && quantity != null && <S.Qty>qty {quantity}</S.Qty>}
            {!isMobile && (
              <S.EditButton onClick={handleToggleEdit}>
                {rowIsOpen && editMode ? 'Close Edit' : 'Edit'}
              </S.EditButton>
            )}
          </S.RowActions>
        </S.RowHeader>

        {!isMobile && (
          <S.QuickView $collapsed={rowIsOpen}>
            {(parentBoxLabel || parentBoxId) && (
              <S.Breadcrumb>
                {parentBoxLabel} {!!parentBoxId && `(${parentBoxId})`}
              </S.Breadcrumb>
            )}
            <S.Breadcrumb>Category: {categoryLabel}</S.Breadcrumb>

            {!!tags.length && (
              <S.TagRow>
                {tags.map((t) => (
                  <S.Tag key={t}>{t}</S.Tag>
                ))}
              </S.TagRow>
            )}

            {description && <S.Description>{description}</S.Description>}
          </S.QuickView>
        )}
      </S.Row>

      {!isMobile && (
        <S.Collapse
          $open={rowIsOpen}
          $collapseDurMs={collapseDurMs}
          $height={targetHeight}
        >
          <div ref={contentRef}>
            <S.DetailsCard>
              {editMode ? (
                <EditItemDetailsForm
                  item={item}
                  triggerFlash={triggerFlash}
                  onItemImageUpdated={({ image, imagePath }) => {
                    setLocalImage(image || null);
                    setLocalImagePath(imagePath || '');
                  }}
                  onSaved={(updated) => {
                    onSaved?.(updated);
                  }}
                />
              ) : (
                <ItemDetails
                  itemId={_id}
                  itemData={itemForView}
                />
              )}
            </S.DetailsCard>
          </div>
        </S.Collapse>
      )}
    </S.Wrapper>
  );
}
