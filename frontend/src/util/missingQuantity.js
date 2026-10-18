export function missingQuantityBounds(item, mode) {
  const total = Number.isSafeInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 0;
  const missing = Math.max(0, Number(item?.missing?.quantity || 0));
  return { min: mode === 'correction' ? 0 : mode === 'report' ? Math.max(1, missing) : 1,
    max: mode === 'found' ? Math.min(total, missing) : total };
}
export function initialMissingQuantity(item, mode) {
  return mode === 'report' ? Math.max(1, Number(item?.missing?.quantity || 0)) : Number(item?.missing?.quantity || 0);
}
export function isValidMissingQuantity(value, bounds) {
  const count = value === '' ? NaN : Number(value);
  return Number.isSafeInteger(count) && count >= bounds.min && count <= bounds.max;
}
