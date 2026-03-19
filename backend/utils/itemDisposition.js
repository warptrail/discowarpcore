const ITEM_STATUSES = Object.freeze(['active', 'gone']);

const ITEM_DISPOSITIONS = Object.freeze([
  'lost',
  'stolen',
  'trashed',
  'recycled',
  'gifted',
  'donated',
]);

function normalizeItemStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  return ITEM_STATUSES.includes(raw) ? raw : 'active';
}

function normalizeDisposition(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim().toLowerCase();
  return ITEM_DISPOSITIONS.includes(raw) ? raw : null;
}

function isGoneStatus(value) {
  return normalizeItemStatus(value) === 'gone';
}

module.exports = {
  ITEM_STATUSES,
  ITEM_DISPOSITIONS,
  normalizeItemStatus,
  normalizeDisposition,
  isGoneStatus,
};
