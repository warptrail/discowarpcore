import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QuickPeekBoxHeader from './QuickPeekBoxHeader';
import QuickPeekItemList from './QuickPeekItemList';
import * as S from './OperationsQuickPeek.styles';

const HORIZONTAL_SWIPE_THRESHOLD = 54;
const VERTICAL_DETENT_THRESHOLD = 42;

function getBoxImageUrl(box) {
  return (
    box?.image?.thumb?.url ||
    box?.image?.display?.url ||
    box?.image?.original?.url ||
    box?.image?.url ||
    box?.imagePath ||
    ''
  );
}

function getTags(box) {
  if (Array.isArray(box?.tags)) return box.tags.filter(Boolean);
  return String(box?.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function OperationsBoxQuickPeek({
  box,
  position,
  total,
  expanded,
  transitionDirection,
  canSelectPrevious,
  canSelectNext,
  onPrevious,
  onNext,
  onToggleExpanded,
  onSetExpanded,
  onClose,
  onOpenFullBox,
}) {
  const gestureRef = useRef(null);
  const sheetRef = useRef(null);
  const [headerBottom, setHeaderBottom] = useState(140);
  const boxId = box?.box_id;
  const title = String(box?.label || box?.name || 'Untitled box').trim();
  const imageUrl = getBoxImageUrl(box);
  const description = String(box?.description || '').trim();
  const notes = String(box?.notes || '').trim();
  const tags = getTags(box);
  const childBoxes = Array.isArray(box?.childBoxes) ? box.childBoxes : [];
  const items = Array.isArray(box?.items) ? box.items : [];

  useEffect(() => {
    if (!boxId) return;
    sheetRef.current?.focus({ preventScroll: true });
  }, [boxId]);

  useEffect(() => {
    if (!box) return undefined;

    const handleOutsideClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (sheetRef.current?.contains(target)) return;
      if (target.closest('[data-operations-box-preview-trigger]')) return;
      if (target.closest('header')) return;
      onClose?.();
    };

    document.addEventListener('click', handleOutsideClick, true);
    return () =>
      document.removeEventListener('click', handleOutsideClick, true);
  }, [box, onClose]);

  useEffect(() => {
    if (!box) return undefined;

    const appHeader = document.querySelector('#root header');
    let frameId = 0;

    const measureHeader = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const bottom = appHeader?.getBoundingClientRect().bottom;
        if (!Number.isFinite(bottom)) return;
        setHeaderBottom(Math.max(8, Math.round(bottom) + 8));
      });
    };

    const resizeObserver =
      appHeader && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measureHeader)
        : null;

    resizeObserver?.observe(appHeader);
    window.addEventListener('resize', measureHeader);
    window.addEventListener('scroll', measureHeader, { passive: true });
    measureHeader();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureHeader);
      window.removeEventListener('scroll', measureHeader);
    };
  }, [box]);

  if (!box || typeof document === 'undefined') return null;

  const handlePointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('button, a')) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const finishGesture = (event) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    const vertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.2;

    if (horizontal && Math.abs(deltaX) >= HORIZONTAL_SWIPE_THRESHOLD) {
      if (deltaX < 0) onNext?.();
      else onPrevious?.();
      return;
    }

    if (vertical && Math.abs(deltaY) >= VERTICAL_DETENT_THRESHOLD) {
      onSetExpanded?.(deltaY < 0);
    }
  };

  const cancelGesture = () => {
    gestureRef.current = null;
  };

  return createPortal(
    <S.Deck
      ref={sheetRef}
      id="operations-box-quick-peek"
      role="complementary"
      aria-label={`Quick peek at box ${title}`}
      tabIndex={-1}
      $expanded={expanded}
      style={{ '--operations-quick-peek-top': `${headerBottom}px` }}
    >
      <QuickPeekBoxHeader
        box={box}
        position={position}
        total={total}
        expanded={expanded}
        canSelectPrevious={canSelectPrevious}
        canSelectNext={canSelectNext}
        onPrevious={onPrevious}
        onNext={onNext}
        onToggleExpanded={onToggleExpanded}
        onClose={onClose}
        onPointerDown={handlePointerDown}
        onPointerUp={finishGesture}
        onPointerCancel={cancelGesture}
      />

      <S.DeckContent
        key={box.box_id}
        $direction={transitionDirection}
      >
        <S.BoxSnapshot>
          {imageUrl ? (
            <S.BoxImage src={imageUrl} alt={`${title} box`} />
          ) : (
            <S.BoxImageFallback aria-hidden="true">BOX</S.BoxImageFallback>
          )}

          <S.BoxSnapshotText>
            {description ? (
              <S.BoxDescription>{description}</S.BoxDescription>
            ) : null}
            {notes ? (
              <S.BoxNotes>
                <S.MetaLabel>Notes</S.MetaLabel>
                {notes}
              </S.BoxNotes>
            ) : null}
            {tags.length > 0 ? (
              <S.TagLine aria-label="Box tags">
                {tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </S.TagLine>
            ) : null}
          </S.BoxSnapshotText>
        </S.BoxSnapshot>

        <S.ItemsHeader>
          <span>Direct items</span>
          <S.ItemsCount>
            {items.length} {items.length === 1 ? 'entry' : 'entries'}
          </S.ItemsCount>
        </S.ItemsHeader>

        <QuickPeekItemList items={items} />

        {childBoxes.length > 0 ? (
          <S.NestedBoxes>
            <summary>
              Nested boxes
              <span>{childBoxes.length}</span>
            </summary>
            <S.NestedBoxList>
              {childBoxes.map((child) => (
                <li key={child?._id || child?.box_id}>
                  <code>#{child?.box_id}</code>
                  {child?.label || child?.name || 'Untitled box'}
                </li>
              ))}
            </S.NestedBoxList>
          </S.NestedBoxes>
        ) : null}
      </S.DeckContent>

      <S.OpenFullBoxButton
        type="button"
        $expanded={expanded}
        onClick={onOpenFullBox}
      >
        Open full box
        <S.OpenFullBoxIcon
          aria-hidden="true"
          viewBox="0 0 20 20"
          focusable="false"
        >
          <path d="M6 14 14 6" />
          <path d="M8 6h6v6" />
        </S.OpenFullBoxIcon>
      </S.OpenFullBoxButton>
    </S.Deck>,
    document.body,
  );
}
