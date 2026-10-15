import { useRef } from 'react';
import { createPortal } from 'react-dom';
import useDialogFocus from '../../hooks/useDialogFocus';
import * as S from './Retrieval.styles';

export default function RetrievalImageLightbox({
  isOpen = false,
  imageSrc = '',
  itemName = '',
  presentation = 'default',
  onClose,
}) {
  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, onClose, isOpen && Boolean(imageSrc));

  if (!isOpen || !imageSrc) return null;

  const title = String(itemName || '').trim();

  const lightbox = (
    <S.LightboxBackdrop
      onClick={onClose}
    >
      <S.LightboxPanel
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? `Image preview for ${title}` : 'Image preview'}
        tabIndex={-1}
        $presentation={presentation}
        onClick={(event) => event.stopPropagation()}
      >
        <S.LightboxCloseButton
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
        >
          ×
        </S.LightboxCloseButton>
        <S.LightboxImage
          $presentation={presentation}
          src={imageSrc}
          alt={title ? `${title} full image` : 'Full image preview'}
        />
        {title ? <S.LightboxCaption>{title}</S.LightboxCaption> : null}
      </S.LightboxPanel>
    </S.LightboxBackdrop>
  );

  if (typeof document === 'undefined') return lightbox;
  return createPortal(lightbox, document.body);
}
