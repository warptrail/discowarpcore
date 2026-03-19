const USD_DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

function formatCentsToUsdInput(cents) {
  if (cents == null || cents === '') return '';
  const numeric = Number(cents);
  if (!Number.isFinite(numeric)) return '';
  return (numeric / 100).toFixed(2);
}

function parseUsdInputToCents(value, { fieldLabel = 'Amount', allowEmpty = true } = {}) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    if (allowEmpty) return null;
    throw new Error(`${fieldLabel} is required.`);
  }

  if (!USD_DECIMAL_PATTERN.test(raw)) {
    throw new Error(
      `${fieldLabel} must be a non-negative USD amount with up to 2 decimals.`
    );
  }

  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${fieldLabel} must be a non-negative USD amount.`);
  }

  return Math.round(numeric * 100);
}

export { USD_DECIMAL_PATTERN, formatCentsToUsdInput, parseUsdInputToCents };
