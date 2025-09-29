import React from 'react';
import * as S from '../styles/QuantityInput.styles';

export default function QuantityInput({ value = 1, onChange }) {
  const clamp = (num) => Math.max(1, Math.min(99, num));

  const handleDecrement = () => {
    const next = clamp(value - 1);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = clamp(value + 1);
    onChange(next);
  };

  const handleDirectInput = (e) => {
    let num = parseInt(e.target.value, 10);
    if (isNaN(num)) num = value;
    onChange(clamp(num));
  };

  return (
    <S.Wrapper>
      <S.Button type="button" onClick={handleDecrement}>
        ➖
      </S.Button>
      <S.Input
        type="number"
        value={value}
        onChange={handleDirectInput}
        min="1"
        max="99"
      />
      <S.Button type="button" onClick={handleIncrement}>
        ➕
      </S.Button>
    </S.Wrapper>
  );
}
