const KEEP_PRIORITY_VALUES = [
  'low',
  'medium',
  'high',
  'essential',
  'decommissioned',
];

const KEEP_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  essential: 'Essential',
  decommissioned: 'Decommissioned',
};

function normalizeKeepPriorityValue(value) {
  if (value == null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized || normalized === 'unspecified') return null;
  if (normalized === 'normal') return 'medium';
  return normalized;
}

function isValidKeepPriority(value) {
  return KEEP_PRIORITY_VALUES.includes(value);
}

function formatKeepPriorityLabel(value) {
  const key = normalizeKeepPriorityValue(value);
  if (!key) return '';
  return (
    KEEP_PRIORITY_LABELS[key] ||
    `${key.slice(0, 1).toUpperCase()}${key.slice(1)}`
  );
}

module.exports = {
  KEEP_PRIORITY_VALUES,
  KEEP_PRIORITY_LABELS,
  normalizeKeepPriorityValue,
  isValidKeepPriority,
  formatKeepPriorityLabel,
};
