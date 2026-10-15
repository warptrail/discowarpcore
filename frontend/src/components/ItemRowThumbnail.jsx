import { useState } from 'react';
import { getItemTheme, getItemThemeCssVars } from '../util/inventoryColorTheme';
import * as S from '../styles/ItemRow.styles';

export default function ItemRowThumbnail({ sources = [], name, itemId, boxId, quantityLabel }) {
  const [failedSources, setFailedSources] = useState([]);
  const src = sources.find((candidate) => !failedSources.includes(candidate));
  const theme = getItemTheme(boxId, itemId, { selected: true, varied: true });
  const variant = theme.siblingVariant || 0;
  const positions = ['15% 25%', '80% 15%', '25% 80%', '85% 75%', '50% 15%'];
  const fallbackStyle = {
    ...getItemThemeCssVars(theme),
    '--item-gradient-angle': `${125 + (theme.paletteIndex || 0) * 31 + variant * 17}deg`,
    '--item-gradient-origin': positions[variant],
  };

  return <S.RowThumb>
    {src ? <S.RowThumbImage src={src} alt={`${name || 'Item'} thumbnail`}
      onError={() => setFailedSources((current) => current.includes(src) ? current : [...current, src])} />
      : <S.RowThumbPlaceholder style={fallbackStyle} aria-hidden="true" data-item-thumbnail-fallback />}
    {quantityLabel ? <S.ThumbnailQuantity>{quantityLabel}</S.ThumbnailQuantity> : null}
  </S.RowThumb>;
}
