import ItemThumbnailMedia from './ItemThumbnailMedia';
import * as S from '../styles/ItemRow.styles';

export default function ItemRowThumbnail({ item, sources = [], name, itemId, boxId, quantityLabel }) {
  return <S.RowThumb>
    <span style={{ position: 'absolute', inset: 0 }}>
      <ItemThumbnailMedia item={item || { name, _id: itemId }} sources={sources} boxId={boxId}
        imageAs={S.RowThumbImage} alt={`${name || 'Item'} thumbnail`} />
    </span>
    {quantityLabel ? <S.ThumbnailQuantity>{quantityLabel}</S.ThumbnailQuantity> : null}
  </S.RowThumb>;
}
