import { useState } from 'react';
import DeclutterGlyph from './DeclutterGlyph';
import * as R from './DeclutterReviewCard.styles';

export default function DeclutterReviewPhoto({ src, name }) {
  const [failedUrl, setFailedUrl] = useState('');
  return <R.Photo>
    {src && src !== failedUrl
      ? <img src={src} alt={name} onError={() => setFailedUrl(src)} />
      : <><DeclutterGlyph name="photo" /><span>{src ? 'Photo unavailable' : 'No photo recorded'}</span></>}
  </R.Photo>;
}
