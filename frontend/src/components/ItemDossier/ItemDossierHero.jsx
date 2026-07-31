import React from 'react';
import * as S from './ItemDossier.styles';

export default function ItemDossierHero({
  itemName,
  thumbnailUrl,
  canOpenImageLightbox,
  onOpenImageLightbox,
}) {
  const title = itemName || 'Unnamed item';

  if (!thumbnailUrl) return null;

  return (
    <S.ImageButton
      type="button"
      onClick={canOpenImageLightbox ? onOpenImageLightbox : undefined}
      disabled={!canOpenImageLightbox}
      $interactive={canOpenImageLightbox}
      aria-label={
        canOpenImageLightbox ? `Open full-size image for ${title}` : undefined
      }
    >
      <S.Image src={thumbnailUrl} alt={`${title} thumbnail`} />
      {canOpenImageLightbox ? (
        <S.ExpandMark aria-hidden="true">⌗</S.ExpandMark>
      ) : null}
    </S.ImageButton>
  );
}
