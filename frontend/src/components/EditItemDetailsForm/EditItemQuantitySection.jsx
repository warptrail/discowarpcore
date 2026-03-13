import React from 'react';
import QuantityInput from '../QuantityInput';
import * as S from '../../styles/EditItemDetailsForm.styles';

export default function EditItemQuantitySection({ quantity, onQuantityChange }) {
  return (
    <S.Field>
      <S.Label>Quantity</S.Label>
      <QuantityInput value={quantity} onChange={onQuantityChange} />
    </S.Field>
  );
}
