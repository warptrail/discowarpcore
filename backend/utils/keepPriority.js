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

// Retention controls never perform a departure; the lifecycle owns this value.
function applyKeepPriorityLifecycle(patch, current = {}) {
  const status = String(patch.item_status || current.item_status || 'active').toLowerCase();
  if (status === 'gone') {
    if ('keepPriority' in patch && normalizeKeepPriorityValue(patch.keepPriority) !== 'decommissioned') {
      throw Object.assign(new Error('Keep priority is locked at Removal/decommissioned for gone items.'), { status: 400 });
    }
    patch.keepPriority = 'decommissioned';
  } else if (normalizeKeepPriorityValue(patch.keepPriority) === 'decommissioned') {
    throw Object.assign(new Error('Use the departure workflow to remove an item; decommissioned is not an active keep priority.'), { status: 400 });
  } else if (current.item_status === 'gone' && !('keepPriority' in patch)) {
    patch.keepPriority = null;
  }
  return patch;
}
module.exports.applyKeepPriorityLifecycle = applyKeepPriorityLifecycle;
