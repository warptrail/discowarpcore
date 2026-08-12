export const ITEM_OWNERS = [
  { id: 'discofish', label: 'Discofish', icon: '🐟', accent: '#38c9ff' },
  { id: 'laserfox', label: 'Laserfox', icon: '🦊', accent: '#b875ff' },
];

export const PRIMARY_OWNER_OPTIONS = [
  { value: '', label: 'Shared / unassigned' },
  ...ITEM_OWNERS.map((owner) => ({
    value: owner.id,
    label: `${owner.icon} ${owner.label}`,
    accent: owner.accent,
  })),
];

const LEGACY_OWNER_ALIASES = {
  alyssa: 'discofish',
  ryan: 'laserfox',
};

export function normalizePrimaryOwner(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return '';
  if (ITEM_OWNERS.some((owner) => owner.id === normalized)) return normalized;
  return LEGACY_OWNER_ALIASES[normalized] || String(value).trim();
}

export function formatPrimaryOwner(value) {
  const normalized = normalizePrimaryOwner(value);
  return ITEM_OWNERS.find((owner) => owner.id === normalized)?.label || normalized;
}
