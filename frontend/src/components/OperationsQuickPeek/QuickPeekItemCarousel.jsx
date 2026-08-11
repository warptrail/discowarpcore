import React, { useEffect, useState } from 'react';
import {
  getItemOriginalImageUrl,
  getItemPreviewImageCandidates,
} from '../../util/itemImage';
import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';
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
  const candidates = getItemPreviewImageCandidates(item);
  const candidateKey = candidates.join('\n');
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [framing, setFraming] = useState('square');
  const source = candidates[candidateIndex] || '';

  useEffect(() => {
    setCandidateIndex(0);
    setFraming('square');
  }, [candidateKey]);

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
        onError={() => setCandidateIndex((current) => current + 1)}
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
  inDeclutterDeck = false,
  declutterPending = false,
  onToggleDeclutterDeck,
  onOpenNotes,
}) {
  const itemId = String(item?._id || item?.id || '');
  const lightboxImageUrl = getItemOriginalImageUrl(item);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const name = String(item?.name || item?.label || 'Untitled item').trim();
  const category = String(item?.category || '').trim();
  const description = String(item?.description || '').trim();
  const itemNotes = String(item?.notes || '').trim();
  const tags = getTags(item);
  const hasDetails = Boolean(description || category || tags.length > 0);

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
            </S.ItemCarouselMeta>
          </S.ItemCarouselIdentity>

          {hasDetails ? (
            <S.ItemCarouselDetails>
              {description ? (
                <S.ItemCarouselDetail>
                  <S.ItemCarouselAnnotationLine>
                    <S.MetaLabel>Description</S.MetaLabel>
                    {itemNotes ? (
                      <S.ItemCarouselNoteButton
                        type="button"
                        aria-label={`Open notes for ${name}`}
                        title="Open item notes"
                        onClick={onOpenNotes}
                      >N</S.ItemCarouselNoteButton>
                    ) : null}
                  </S.ItemCarouselAnnotationLine>
                  <S.ItemCarouselDescription title={description}>
                    {description}
                  </S.ItemCarouselDescription>
                </S.ItemCarouselDetail>
              ) : null}
              {category ? (
                <S.ItemCarouselDetail>
                  <S.ItemCarouselCategoryLine>
                    <S.MetaLabel>Category</S.MetaLabel>
                    <S.ItemCarouselCategoryValue>{category}</S.ItemCarouselCategoryValue>
                    <S.ItemCarouselDeckButton
                      type="button"
                      $active={inDeclutterDeck}
                      aria-label={inDeclutterDeck ? `Remove ${name} from Declutter Deck` : `Add ${name} to Declutter Deck`}
                      aria-pressed={inDeclutterDeck}
                      title={inDeclutterDeck ? 'Remove from Declutter Deck' : 'Add from Declutter Deck'}
                      disabled={declutterPending || !itemId || item?.item_status === 'gone'}
                      onClick={onToggleDeclutterDeck}
                    >Deck</S.ItemCarouselDeckButton>
                  </S.ItemCarouselCategoryLine>
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
