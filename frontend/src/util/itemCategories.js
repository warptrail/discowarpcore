export const ITEM_CATEGORIES = [
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

export const DEFAULT_ITEM_CATEGORY = 'miscellaneous';

export function normalizeItemCategory(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (!normalized) return DEFAULT_ITEM_CATEGORY;
  return ITEM_CATEGORIES.includes(normalized)
    ? normalized
    : DEFAULT_ITEM_CATEGORY;
}

export function formatItemCategory(value) {
  const normalized = normalizeItemCategory(value);
  return normalized
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export const ITEM_CATEGORY_OPTIONS = ITEM_CATEGORIES.map((category) => ({
  value: category,
  label: formatItemCategory(category),
}));
