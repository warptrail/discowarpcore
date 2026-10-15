import { useState } from 'react';
import { getItemPreviewImageCandidates } from '../../util/itemImage';
import * as S from './FinderItemFocus.styles';

export default function FinderItemPhoto({ item, name, imageUrl, onPreviewImage, className, emptyContent }) {
  const candidates = [...new Set([...getItemPreviewImageCandidates(item), imageUrl].filter(Boolean))];
  const [attempt, setAttempt] = useState(0);
  const src = candidates[attempt];
  const content = src
    ? <img src={src} alt={name} decoding="async" onError={() => setAttempt((index) => index + 1)} />
    : emptyContent ?? <figcaption>No item photo recorded</figcaption>;
  return onPreviewImage && src
    ? <S.PhotoButton className={className} type="button" aria-label={`Preview image for ${name}`}
      onClick={() => onPreviewImage({ src, name })}>{content}</S.PhotoButton>
    : <S.Photo className={className}>{content}</S.Photo>;
}
