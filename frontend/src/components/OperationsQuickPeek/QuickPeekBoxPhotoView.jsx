import React, { useEffect, useState } from 'react';
import RetrievalImageLightbox from '../Retrieval/RetrievalImageLightbox';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekBoxPhotoView({
  box,
  imageUrl,
  fallbackUrl = '',
  onShowItems,
}) {
  const title = String(box?.label || box?.name || 'Untitled box').trim();
  const [source, setSource] = useState(imageUrl || fallbackUrl);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setSource(imageUrl || fallbackUrl);
    setLightboxOpen(false);
  }, [box?.box_id, fallbackUrl, imageUrl]);

  return (
    <S.BoxPhotoView aria-label={`Photo preview for ${title}`}>
      <S.BoxPhotoStage>
        {source ? (
          <>
            <S.BoxPhotoBackdrop
              src={source}
              alt=""
              aria-hidden="true"
              decoding="async"
            />
            <S.BoxPhotoImageButton
              type="button"
              aria-label={`Open full image for ${title}`}
              onClick={() => setLightboxOpen(true)}
            >
              <S.BoxPhotoImage
                src={source}
                alt={`Photo of ${title}`}
                decoding="async"
                onError={() => {
                  setSource((current) =>
                    fallbackUrl && current !== fallbackUrl ? fallbackUrl : '',
                  );
                }}
              />
              <S.BoxPhotoExpandHint aria-hidden="true">
                <svg viewBox="0 0 20 20" focusable="false">
                  <path d="M7 3H3v4M13 3h4v4M7 17H3v-4M13 17h4v-4" />
                </svg>
              </S.BoxPhotoExpandHint>
            </S.BoxPhotoImageButton>
          </>
        ) : (
          <S.BoxPhotoFallback>No box photo available</S.BoxPhotoFallback>
        )}

        <S.BoxPhotoItemsButton
          type="button"
          aria-label={`Show items in ${title}`}
          title="Show box items"
          onClick={onShowItems}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
            <path d="M7 5h9M7 10h9M7 15h9" />
            <path d="M3.5 5h.01M3.5 10h.01M3.5 15h.01" />
          </svg>
        </S.BoxPhotoItemsButton>
      </S.BoxPhotoStage>

      <RetrievalImageLightbox
        isOpen={lightboxOpen}
        imageSrc={source}
        itemName={title}
        onClose={() => setLightboxOpen(false)}
      />
    </S.BoxPhotoView>
  );
}
