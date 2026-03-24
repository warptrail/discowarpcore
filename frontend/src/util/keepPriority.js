export const KEEP_PRIORITY_SCALE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'essential', label: 'Essential' },
];

export const KEEP_PRIORITY_REMOVAL_OPTIONS = [
  { value: 'decommissioned', label: 'Decommissioned' },
];

export const KEEP_PRIORITY_ORDER = {
  essential: 0,
  high: 1,
  medium: 2,
  low: 3,
  decommissioned: 4,
};

const KEEP_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  essential: 'Essential',
  decommissioned: 'Decommissioned',
};

export function normalizeKeepPriority(value) {
  if (value == null || value === '') return '';
  const normalized = String(value).trim().toLowerCase();
  if (!normalized || normalized === 'unspecified') return '';
  if (normalized === 'normal') return 'medium';
  return normalized;
}

export function formatKeepPriorityLabel(value) {
  const key = normalizeKeepPriority(value);
  if (!key) return '';
  return (
    KEEP_PRIORITY_LABELS[key] ||
    `${key.slice(0, 1).toUpperCase()}${key.slice(1)}`
  );
}

export function keepPriorityTone(value) {
  const key = normalizeKeepPriority(value);
  if (key === 'decommissioned') return 'decommissioned';
  if (key === 'low') return 'low';
  if (key === 'medium') return 'medium';
  if (key === 'high') return 'high';
  if (key === 'essential') return 'essential';
  return 'muted';
}

export function isDecommissionedKeepPriority(value) {
  return normalizeKeepPriority(value) === 'decommissioned';
}
