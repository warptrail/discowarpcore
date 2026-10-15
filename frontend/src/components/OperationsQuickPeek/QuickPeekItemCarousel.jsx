import QuickPeekItemFacts from './QuickPeekItemFacts';
import QuickPeekItemTags from './QuickPeekItemTags';
import MissingStatus from '../MissingItems/MissingStatus';
import React, { useEffect, useState } from 'react';
import { getItemPlaceholderGradientStyle } from '../../util/itemPlaceholderGradient';
import {
  getItemOriginalImageUrl,
  getItemPreviewImageCandidates,
} from '../../util/itemImage';
import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';
import * as S from './OperationsQuickPeek.styles';
import QuickPeekItemEditor from './QuickPeekItemEditor';
import { getItemOwnershipContext } from '../../util/itemOwnership';

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
    return <S.ItemCarouselImageFallback aria-hidden="true" style={getItemPlaceholderGradientStyle(item)} />;
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
  onItemUpdated,
  boxed = true,
  position,
  total,
  transitionDirection,
  canSelectPrevious,
  canSelectNext,
  onPrevious,
  onNext,
  notePanel = null,
}) {
  const itemId = String(item?._id || item?.id || '');
  const lightboxImageUrl = getItemOriginalImageUrl(item);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const name = String(item?.name || item?.label || 'Untitled item').trim();
  const description = String(item?.description || '').trim();
  const tags = getTags(item);
  const edit = (field, label, content) => <QuickPeekItemEditor item={item} field={field} label={label} onSaved={onItemUpdated}>{content}</QuickPeekItemEditor>;

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
          {notePanel || <ItemPreviewImage item={item} name={name} />}

          {!notePanel && lightboxImageUrl ? (
            <S.ItemCarouselLightboxTrigger
              type="button"
              aria-label={`Open original image for ${name}`}
              onClick={openLightbox}
            />
          ) : null}

        {!notePanel ? <><S.ItemCarouselArrow
          type="button"
          aria-label="Previous item"
          $side="previous"
          disabled={!canSelectPrevious}
          onClick={onPrevious}
        >
          ⟨
        </S.ItemCarouselArrow>

        <S.ItemCarouselArrow
          type="button"
          aria-label="Next item"
          $side="next"
          disabled={!canSelectNext}
          onClick={onNext}
        >
          ⟩
        </S.ItemCarouselArrow></> : null}
        </S.ItemCarouselMedia>

        <S.ItemCarouselBody data-tag-scroll-key="operations-peek-item">
          <S.ItemCarouselIdentity>
            <MissingStatus item={item} home />
            <S.ItemCarouselName>{edit('name', 'Name', name)}</S.ItemCarouselName>
            <QuickPeekItemFacts key={itemId} item={item} onSaved={onItemUpdated} />
          </S.ItemCarouselIdentity>

          {(
            <S.ItemCarouselDetails>
              {(
                <S.ItemCarouselDetail>
                  <S.ItemCarouselAnnotationLine>
                    <S.MetaLabel>Description</S.MetaLabel>
                  </S.ItemCarouselAnnotationLine>
                  <S.ItemCarouselDescription as="div" title={description}>
                    {edit('description', 'Description', description)}
                  </S.ItemCarouselDescription>
                </S.ItemCarouselDetail>
              )}
              {(
                <S.ItemCarouselTags aria-label="Item tags">
                  <QuickPeekItemTags key={itemId} item={item} tags={tags} name={name} description={description} onSaved={onItemUpdated} />
                </S.ItemCarouselTags>
              )}
            </S.ItemCarouselDetails>
          )}

          {!boxed && getItemOwnershipContext(item).isOrphaned ? edit('location', 'Location', item.location) : null}
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
