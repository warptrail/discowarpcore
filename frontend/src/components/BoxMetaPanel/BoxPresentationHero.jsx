import React, { useEffect, useMemo, useState } from 'react';

import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';
import * as S from '../../styles/BoxMetaPanel.styles';

function getPlaceholderStyle(box) {
  const source = `${box?.box_id || ''}:${box?.label || box?.name || ''}`;
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const seed = hash >>> 0;
  return {
    '--placeholder-primary-x': `${20 + (seed % 55)}%`,
    '--placeholder-primary-y': `${18 + ((seed >>> 6) % 56)}%`,
    '--placeholder-secondary-x': `${18 + ((seed >>> 12) % 60)}%`,
    '--placeholder-secondary-y': `${16 + ((seed >>> 18) % 62)}%`,
    '--placeholder-wash-angle': `${42 + ((seed >>> 24) % 112)}deg`,
  };
}

export default function BoxPresentationHero({
  box,
  boxId,
  title,
  group,
  location,
  description,
  tags,
  notes,
  imageUrl,
  lightboxUrl,
}) {
  const [source, setSource] = useState(imageUrl);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const placeholderStyle = useMemo(() => getPlaceholderStyle(box), [box]);

  useEffect(() => {
    setSource(imageUrl);
    setLightboxOpen(false);
  }, [boxId, imageUrl]);

  return (
    <>
      <S.PresentationHero>
        <S.HeroMediaStage>
          {source ? (
            <>
              <S.HeroImageBackdrop src={source} alt="" aria-hidden="true" />
              <S.HeroImageButton
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Open full image for ${title}`}
              >
                <S.HeroImage
                  src={source}
                  alt={`${title} image`}
                  onError={() => setSource('')}
                />
                <S.HeroExpandHint aria-hidden="true">↗</S.HeroExpandHint>
              </S.HeroImageButton>
            </>
          ) : (
            <S.HeroImagePlaceholder
              style={placeholderStyle}
              role="img"
              aria-label={`No image available for ${title}`}
            />
          )}
        </S.HeroMediaStage>

        <S.HeroHeaderCard>
          <S.CurrentBox
            aria-current="page"
            aria-label={`Current box ${title}`}
            title={`${title}${boxId ? ` (${boxId})` : ''}`}
          >
            <S.CurrentBoxId>{boxId}</S.CurrentBoxId>
            <S.CurrentBoxMain>
              <S.CurrentBoxTitle>{title}</S.CurrentBoxTitle>
              <S.CurrentBoxInfoRow>
                {group ? (
                  <S.CurrentBoxLocationChip $variant="group">
                    <S.CurrentBoxLocationLabel $variant="group">Group</S.CurrentBoxLocationLabel>
                    <S.CurrentBoxLocationValue>{group}</S.CurrentBoxLocationValue>
                  </S.CurrentBoxLocationChip>
                ) : null}
                <S.CurrentBoxLocationChip $variant="location" $empty={!location}>
                  <S.CurrentBoxLocationLabel $variant="location" $empty={!location}>
                    Location
                  </S.CurrentBoxLocationLabel>
                  <S.CurrentBoxLocationValue>{location || 'Unassigned'}</S.CurrentBoxLocationValue>
                </S.CurrentBoxLocationChip>
              </S.CurrentBoxInfoRow>
            </S.CurrentBoxMain>
          </S.CurrentBox>

          <S.HeroMetadata>
            {description ? (
              <S.MetaPreviewBlock>
                <S.MetaPreviewLabel>Description</S.MetaPreviewLabel>
                <S.MetaPreviewText>{description}</S.MetaPreviewText>
              </S.MetaPreviewBlock>
            ) : null}
            {tags.length ? (
              <S.MetaPreviewBlock>
                <S.MetaPreviewLabel>Tags</S.MetaPreviewLabel>
                <S.CurrentBoxTagsRow>
                  {tags.map((tag) => <S.CurrentBoxTag key={tag}>{tag}</S.CurrentBoxTag>)}
                </S.CurrentBoxTagsRow>
              </S.MetaPreviewBlock>
            ) : null}
            {notes ? (
              <S.MetaPreviewBlock>
                <S.MetaPreviewLabel>Notes</S.MetaPreviewLabel>
                <S.MetaPreviewText>{notes}</S.MetaPreviewText>
              </S.MetaPreviewBlock>
            ) : null}
          </S.HeroMetadata>
        </S.HeroHeaderCard>
      </S.PresentationHero>

      <RetrievalImageLightbox
        isOpen={lightboxOpen && Boolean(source)}
        imageSrc={lightboxUrl || source}
        itemName={title}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
