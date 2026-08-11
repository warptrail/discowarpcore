import React, { useId } from 'react';
import * as S from '../styles/QuantityInput.styles';

export default function QuantityInput({
  value = 1,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  id,
  name,
  disabled = false,
  ariaLabel = 'Quantity',
  fullWidth = false,
  compact = false,
}) {
  const generatedId = useId();
  const inputId = id || `quantity-input-${generatedId}`;
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : min;
  const clamp = (num) => Math.max(min, Math.min(max, num));
  const normalize = (num) => clamp(Math.round(num / step) * step);

  const handleDecrement = () => {
    onChange(normalize(safeValue - step));
  };

  const handleIncrement = () => {
    onChange(normalize(safeValue + step));
  };

  const handleDirectInput = (event) => {
    if (event.target.value === '') return;
    const next = Number(event.target.value);
    if (Number.isFinite(next)) onChange(normalize(next));
  };

  return (
    <S.Wrapper $fullWidth={fullWidth} $disabled={disabled} $compact={compact}>
      <S.Button
        type="button"
        $compact={compact}
        onClick={handleDecrement}
        aria-label={`Decrease ${ariaLabel.toLowerCase()}`}
        disabled={disabled || safeValue <= min}
      >
        −
      </S.Button>
      <S.ValueShell $fullWidth={fullWidth}>
        {!compact ? <S.ValueKicker aria-hidden="true">QTY</S.ValueKicker> : null}
        <S.Input
          $compact={compact}
          id={inputId}
          name={name}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={handleDirectInput}
          onBlur={() => onChange(normalize(safeValue))}
          min={min}
          max={max}
          step={step}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={safeValue}
          disabled={disabled}
        />
      </S.ValueShell>
      <S.Button
        type="button"
        $compact={compact}
        onClick={handleIncrement}
        aria-label={`Increase ${ariaLabel.toLowerCase()}`}
        disabled={disabled || safeValue >= max}
      >
        +
      </S.Button>
    </S.Wrapper>
  );
}
