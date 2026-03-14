const ITEM_CATEGORIES = [
  'miscellaneous',
  'tools',
  'hardware',
  'automotive',
  'cleaning',
  'kitchen',
  'appliances',
  'electronics',
  'office',
  'books',
  'clothing',
  'bathroom',
  'medical',
  'decor',
  'furniture',
  'garden',
  'camping',
  'hobbies',
  'toys',
  'games',
  'seasonal',
];

const DEFAULT_ITEM_CATEGORY = 'miscellaneous';

function normalizeItemCategory(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (!normalized) return DEFAULT_ITEM_CATEGORY;
  return ITEM_CATEGORIES.includes(normalized)
    ? normalized
    : DEFAULT_ITEM_CATEGORY;
}

function withNormalizedItemCategory(item) {
  if (!item || typeof item !== 'object') return item;
  item.category = normalizeItemCategory(item.category);
  return item;
}

module.exports = {
  ITEM_CATEGORIES,
  DEFAULT_ITEM_CATEGORY,
  normalizeItemCategory,
  withNormalizedItemCategory,
};
