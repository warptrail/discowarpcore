import { useEffect } from 'react';
import * as S from './Retrieval.styles';

export default function RetrievalImageLightbox({
  isOpen = false,
  imageSrc = '',
  itemName = '',
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (typeof onClose === 'function') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

  const title = String(itemName || '').trim();

  return (
    <S.LightboxBackdrop
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Image preview for ${title}` : 'Image preview'}
      onClick={onClose}
    >
      <S.LightboxPanel onClick={(event) => event.stopPropagation()}>
        <S.LightboxCloseButton
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
          autoFocus
        >
          ×
        </S.LightboxCloseButton>
        <S.LightboxImage
          src={imageSrc}
          alt={title ? `${title} full image` : 'Full image preview'}
        />
        {title ? <S.LightboxCaption>{title}</S.LightboxCaption> : null}
      </S.LightboxPanel>
    </S.LightboxBackdrop>
  );
}
