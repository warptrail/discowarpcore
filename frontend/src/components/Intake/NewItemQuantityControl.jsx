import React from 'react';
import {
  QuantityButton,
  QuantityControl,
  QuantityValue,
} from './NewItemComposer.styles';

function normalizeQuantity(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

export default function NewItemQuantityControl({
  value = 1,
  onChange,
  min = 1,
  max = 9999,
  disabled = false,
}) {
  const safeValue = normalizeQuantity(value, min, max);

  return (
    <QuantityControl aria-label="Quantity">
      <QuantityButton
        type="button"
        onClick={() => onChange(normalizeQuantity(safeValue - 1, min, max))}
        aria-label="Decrease quantity"
        disabled={disabled || safeValue <= min}
      >
        −
      </QuantityButton>
      <QuantityValue
        id="new-item-quantity"
        type="number"
        inputMode="numeric"
        value={safeValue}
        min={min}
        max={max}
        step="1"
        aria-label="Quantity"
        onChange={(event) => {
          if (event.target.value === '') return;
          onChange(normalizeQuantity(event.target.value, min, max));
        }}
        onBlur={() => onChange(normalizeQuantity(safeValue, min, max))}
        disabled={disabled}
      />
      <QuantityButton
        type="button"
        onClick={() => onChange(normalizeQuantity(safeValue + 1, min, max))}
        aria-label="Increase quantity"
        disabled={disabled || safeValue >= max}
      >
        +
      </QuantityButton>
    </QuantityControl>
  );
}
