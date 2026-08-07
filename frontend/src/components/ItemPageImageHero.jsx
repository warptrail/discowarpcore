import { useMemo, useState } from 'react';

import RetrievalImageLightbox from './Retrieval/RetrievalImageLightbox';
import { getItemPreviewImageUrl } from '../util/itemImage';
import { formatItemCategory, normalizeItemCategory } from '../util/itemCategories';
import * as S from '../styles/ItemPageConsoleView.styles';

function withCacheBuster(url, cacheKey) {
  const raw = String(url || '').trim();
  if (!raw || !cacheKey || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }

  const separator = raw.includes('?') ? '&' : '?';
  return `${raw}${separator}v=${encodeURIComponent(cacheKey)}`;
}

export default function ItemPageImageHero({
  item,
  imageUrlOverride = '',
  imageRefreshToken = 0,
  imageEditorOpen = false,
  onEditImage,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageUrl = useMemo(
    () => withCacheBuster(
      imageUrlOverride || getItemPreviewImageUrl(item),
      imageRefreshToken
    ),
    [imageRefreshToken, imageUrlOverride, item]
  );
  const category = formatItemCategory(normalizeItemCategory(item?.category));
  const status = String(item?.item_status || '').toLowerCase() === 'gone'
    ? 'No longer have'
    : 'Active';

  return (
    <>
      <S.WikiHero aria-label="Item visual record">
        {imageUrl ? (
          <S.WikiImageButton
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Open full-size ${item?.name || 'item'} image`}
          >
            <S.WikiImage src={imageUrl} alt={`${item?.name || 'Item'} visual record`} />
            <S.WikiImageCaption>
              <S.WikiImageKicker>Visual record</S.WikiImageKicker>
              <S.WikiImageAction>Open full size ↗</S.WikiImageAction>
            </S.WikiImageCaption>
          </S.WikiImageButton>
        ) : (
          <S.WikiImagePlaceholder>
            <S.WikiImageKicker>Visual record</S.WikiImageKicker>
            <span>No image archived</span>
          </S.WikiImagePlaceholder>
        )}

        <S.WikiFactRail aria-label="Item quick facts">
          <S.WikiFact>
            <S.WikiFactLabel>Category</S.WikiFactLabel>
            <S.WikiFactValue>{category || '—'}</S.WikiFactValue>
          </S.WikiFact>
          <S.WikiFact>
            <S.WikiFactLabel>Quantity</S.WikiFactLabel>
            <S.WikiFactValue>{item?.quantity ?? '—'}</S.WikiFactValue>
          </S.WikiFact>
          <S.WikiFact>
            <S.WikiFactLabel>Status</S.WikiFactLabel>
            <S.WikiFactValue>{status}</S.WikiFactValue>
          </S.WikiFact>
        </S.WikiFactRail>

        {typeof onEditImage === 'function' ? (
          <S.WikiHeroCommandRail>
            <S.WikiHeroCommandCopy>
              <strong>MEDIA CHANNEL //</strong>
              <span>{imageUrl ? 'Original and processed variants available.' : 'No visual record stored.'}</span>
            </S.WikiHeroCommandCopy>
            <S.WikiHeroEditButton
              type="button"
              $active={imageEditorOpen}
              aria-expanded={imageEditorOpen}
              aria-controls="item-page-media-editor"
              onClick={onEditImage}
            >
              {imageEditorOpen ? 'Close image console' : 'Edit image'}
            </S.WikiHeroEditButton>
          </S.WikiHeroCommandRail>
        ) : null}
      </S.WikiHero>

      <RetrievalImageLightbox
        isOpen={lightboxOpen}
        imageSrc={imageUrl}
        itemName={item?.name || ''}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
