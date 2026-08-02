import React, { useEffect, useRef, useState } from 'react';
import { getItemThumbnailUrl } from '../../util/itemImage';
import * as S from './OperationsQuickPeek.styles';

const HORIZONTAL_SWIPE_THRESHOLD = 48;

function quantityLabel(item) {
  const quantity = Number(item?.quantity);
  return Number.isFinite(quantity) ? quantity : 1;
}

function getTags(item) {
  if (Array.isArray(item?.tags)) return item.tags.filter(Boolean);
  return String(item?.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function ItemPreviewImage({ item, name }) {
  const imageUrl = getItemThumbnailUrl(item);
  const [source, setSource] = useState(imageUrl);

  useEffect(() => {
    setSource(imageUrl);
  }, [imageUrl]);

  if (!source) {
    return <S.ItemCarouselImageFallback aria-hidden="true">ITEM</S.ItemCarouselImageFallback>;
  }

  return (
    <S.ItemCarouselImage
      src={source}
      alt={`Photo of ${name}`}
      decoding="async"
      onError={() => setSource('')}
    />
  );
}

export default function QuickPeekItemCarousel({
  item,
  position,
  total,
  transitionDirection,
  canSelectPrevious,
  canSelectNext,
  onPrevious,
  onNext,
  onBack,
}) {
  const gestureRef = useRef(null);
  const name = String(item?.name || item?.label || 'Untitled item').trim();
  const category = String(item?.category || '').trim();
  const description = String(item?.description || '').trim();
  const notes = String(item?.notes || '').trim();
  const tags = getTags(item);
  const hasDetails = Boolean(description || notes || tags.length > 0);

  const handlePointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('button, a')) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerUp = (event) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (
      Math.abs(deltaX) < HORIZONTAL_SWIPE_THRESHOLD ||
      Math.abs(deltaX) <= Math.abs(deltaY) * 1.2
    ) {
      return;
    }

    if (deltaX < 0) onNext?.();
    else onPrevious?.();
  };

  const cancelGesture = () => {
    gestureRef.current = null;
  };

  return (
    <S.ItemCarousel
      $direction={transitionDirection}
      aria-label={`Item ${position} of ${total}: ${name}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelGesture}
    >
      <S.ItemCarouselNavigation>
        <S.ItemCarouselArrow
          type="button"
          aria-label="Previous item"
          disabled={!canSelectPrevious}
          onClick={onPrevious}
        >
          ‹
        </S.ItemCarouselArrow>

        <S.ItemCarouselReturn
          type="button"
          aria-label="Back to direct items"
          onClick={onBack}
        >
          <S.ItemListIcon aria-hidden="true" viewBox="0 0 20 20">
            <path d="M7 5h9M7 10h9M7 15h9" />
            <path d="M3.5 5h.01M3.5 10h.01M3.5 15h.01" />
          </S.ItemListIcon>
          <S.ItemCarouselPosition>{position} / {total}</S.ItemCarouselPosition>
        </S.ItemCarouselReturn>

        <S.ItemCarouselArrow
          type="button"
          aria-label="Next item"
          disabled={!canSelectNext}
          onClick={onNext}
        >
          ›
        </S.ItemCarouselArrow>
      </S.ItemCarouselNavigation>

      <S.ItemCarouselHero>
        <ItemPreviewImage item={item} name={name} />
        <S.ItemCarouselIdentity>
          <S.ItemCarouselName>{name}</S.ItemCarouselName>
          <S.ItemCarouselMeta>
            <code>QTY {quantityLabel(item)}</code>
            {category ? <span>{category}</span> : null}
          </S.ItemCarouselMeta>
        </S.ItemCarouselIdentity>
      </S.ItemCarouselHero>

      {hasDetails ? (
        <S.ItemCarouselDetails>
          {description ? (
            <S.ItemCarouselDetail>
              <S.MetaLabel>Description</S.MetaLabel>
              <p>{description}</p>
            </S.ItemCarouselDetail>
          ) : null}
          {notes ? (
            <S.ItemCarouselDetail>
              <S.MetaLabel>Notes</S.MetaLabel>
              <p>{notes}</p>
            </S.ItemCarouselDetail>
          ) : null}
          {tags.length > 0 ? (
            <S.ItemCarouselTags aria-label="Item tags">
              {tags.map((tag) => <span key={tag}>#{tag}</span>)}
            </S.ItemCarouselTags>
          ) : null}
        </S.ItemCarouselDetails>
      ) : (
        <S.ItemCarouselEmpty>No additional details recorded.</S.ItemCarouselEmpty>
      )}
    </S.ItemCarousel>
  );
}
