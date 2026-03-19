const DAY_MS = 1000 * 60 * 60 * 24;

function normalizeDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeDateHistoryForSave(values) {
  if (!Array.isArray(values)) return [];

  const unique = new Set();
  values.forEach((value) => {
    const normalized = normalizeDateInputValue(value);
    if (normalized) unique.add(normalized);
  });

  return Array.from(unique).sort();
}

function buildEditableDateHistory(historyValues, fallbackSingleValue = null) {
  const normalized = normalizeDateHistoryForSave(historyValues);
  if (normalized.length) return normalized;

  const fallback = normalizeDateInputValue(fallbackSingleValue);
  return fallback ? [fallback] : [];
}

function getLatestDateFromHistory(historyValues, fallbackSingleValue = null) {
  const normalized = normalizeDateHistoryForSave(historyValues);
  if (normalized.length) return normalized[normalized.length - 1];
  return normalizeDateInputValue(fallbackSingleValue);
}

function getIntervalDaysFromHistory(historyValues) {
  const normalized = normalizeDateHistoryForSave(historyValues);
  if (normalized.length < 2) return null;

  const previous = new Date(normalized[normalized.length - 2]);
  const latest = new Date(normalized[normalized.length - 1]);
  if (Number.isNaN(previous.getTime()) || Number.isNaN(latest.getTime())) {
    return null;
  }

  const days = Math.round((latest.getTime() - previous.getTime()) / DAY_MS);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

export {
  normalizeDateInputValue,
  normalizeDateHistoryForSave,
  buildEditableDateHistory,
  getLatestDateFromHistory,
  getIntervalDaysFromHistory,
};
