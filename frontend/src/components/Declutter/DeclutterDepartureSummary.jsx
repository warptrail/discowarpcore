import * as S from './Declutter.styles';

export default function DeclutterDepartureSummary({ item }) {
  if (item?.disposition==='sold' && item.saleDetails) {
    const sale=item.saleDetails;
    return <S.SmallText>
      {sale.buyer ? `Sold to ${sale.buyer}. ` : ''}
      {sale.paymentType==='dollars' && sale.amountCents!=null ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(sale.amountCents/100) : ''}
      {sale.paymentType==='trade' && sale.tradedFor ? `Traded for ${sale.tradedFor}.` : ''}
    </S.SmallText>;
  }
  if (item?.disposition==='gifted' && item.giftDetails) {
    const gift=item.giftDetails;
    return <S.SmallText>{gift.recipient ? `Given to ${gift.recipient}. ` : ''}{gift.occasion}</S.SmallText>;
  }
  return null;
}
