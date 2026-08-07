import React, { useContext, useEffect, useState } from 'react';
import {
  getItemOriginalImageUrl,
  getItemPreviewImageUrl,
  getItemThumbnailUrl,
} from '../../util/itemImage';
import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';
import { ToastContext } from '../Toast';
import useItemDeclutterDeck from '../../hooks/useItemDeclutterDeck';
import * as S from './OperationsQuickPeek.styles';

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
  const imageUrl = getItemPreviewImageUrl(item);
  const fallbackUrl = getItemThumbnailUrl(item);
  const [source, setSource] = useState(imageUrl);
  const [framing, setFraming] = useState('square');

  useEffect(() => {
    setSource(imageUrl);
    setFraming('square');
  }, [imageUrl]);

  if (!source) {
    return <S.ItemCarouselImageFallback aria-hidden="true">ITEM</S.ItemCarouselImageFallback>;
  }

  return (
    <>
      <S.ItemCarouselImageBackdrop
        src={source}
        alt=""
        aria-hidden="true"
        decoding="async"
      />
      <S.ItemCarouselImage
        src={source}
        alt={`Photo of ${name}`}
        decoding="async"
        $framing={framing}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (!naturalWidth || !naturalHeight) return;

          if (naturalHeight > naturalWidth * 1.15) {
            setFraming('portrait');
          } else if (naturalWidth > naturalHeight * 1.15) {
            setFraming('landscape');
          } else {
            setFraming('square');
          }
        }}
        onError={() => {
          setSource((currentSource) =>
            fallbackUrl && currentSource !== fallbackUrl ? fallbackUrl : '',
          );
        }}
      />
    </>
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
  onDeclutterStateChange,
}) {
  const itemId = String(item?._id || item?.id || '');
  const lightboxImageUrl = getItemOriginalImageUrl(item);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { showToast, hideToast } = useContext(ToastContext) || {};
  const {
    declutterPending,
    inDeclutterDeck,
    toggleDeclutterDeck,
  } = useItemDeclutterDeck({
    item,
    showToast,
    hideToast,
    onStateChange: onDeclutterStateChange,
  });
  const name = String(item?.name || item?.label || 'Untitled item').trim();
  const category = String(item?.category || '').trim();
  const description = String(item?.description || '').trim();
  const notes = String(item?.notes || '').trim();
  const tags = getTags(item);
  const hasDetails = Boolean(description || notes || tags.length > 0);

  useEffect(() => {
    setLightboxOpen(false);
  }, [itemId]);

  const openLightbox = () => {
    if (lightboxImageUrl) setLightboxOpen(true);
  };

  return (
    <S.ItemCarousel
      $direction={transitionDirection}
      aria-label={`Item ${position} of ${total}: ${name}`}
    >
      <S.ItemCarouselCard>
        <S.ItemCarouselMedia
          $interactive={Boolean(lightboxImageUrl)}
        >
          <ItemPreviewImage item={item} name={name} />

          {lightboxImageUrl ? (
            <S.ItemCarouselLightboxTrigger
              type="button"
              aria-label={`Open original image for ${name}`}
              onClick={openLightbox}
            />
          ) : null}

        <S.ItemCarouselArrow
          type="button"
          aria-label="Previous item"
          $side="previous"
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

        <S.ItemCarouselDeckToggle
          type="button"
          $active={inDeclutterDeck}
          aria-label={inDeclutterDeck ? `Remove ${name} from Declutter Deck` : `Add ${name} to Declutter Deck`}
          aria-pressed={inDeclutterDeck}
          title={inDeclutterDeck ? 'Remove from Declutter Deck' : 'Add to Declutter Deck'}
          disabled={declutterPending || !itemId || item?.item_status === 'gone'}
          onClick={toggleDeclutterDeck}
        >
          <S.ItemDeckIcon aria-hidden="true" viewBox="0 0 20 20" focusable="false">
            <path d="M5.5 6.5h9v10h-9z" />
            <path d="M7.5 3.5h7v3" />
            {inDeclutterDeck ? <path d="m8 11 1.5 1.5L12.5 9" /> : <path d="M10 9v5M7.5 11.5h5" />}
          </S.ItemDeckIcon>
        </S.ItemCarouselDeckToggle>

        <S.ItemCarouselArrow
          type="button"
          aria-label="Next item"
          $side="next"
          disabled={!canSelectNext}
          onClick={onNext}
        >
          ›
        </S.ItemCarouselArrow>
        </S.ItemCarouselMedia>

        <S.ItemCarouselBody>
          <S.ItemCarouselIdentity>
            <S.ItemCarouselName>{name}</S.ItemCarouselName>
            <S.ItemCarouselMeta>
              <code>QTY {quantityLabel(item)}</code>
              {category ? <span>{category}</span> : null}
            </S.ItemCarouselMeta>
          </S.ItemCarouselIdentity>

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
        </S.ItemCarouselBody>
      </S.ItemCarouselCard>

      <RetrievalImageLightbox
        isOpen={lightboxOpen}
        imageSrc={lightboxImageUrl}
        itemName={name}
        onClose={() => setLightboxOpen(false)}
      />
    </S.ItemCarousel>
  );
}
