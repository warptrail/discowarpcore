export const BOX_CARD_FIELDS = [
  { key: 'box_id', label: 'number', path: 'm12 3 9 5v8l-9 5-9-5V8l9-5Zm-9 5 9 5 9-5M12 13v8M7.5 5.5l9 5' },
  { key: 'label', label: 'name', path: 'm4 16-1 5 5-1L20 8l-4-4L4 16Zm10-10 4 4' },
  { key: 'locationId', label: 'location', path: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
  { key: 'tags', label: 'tags', path: 'M3 3h8l10 10-8 8L3 11V3Zm4 4h.01' },
  { key: 'description', label: 'description', path: 'M4 4h16v16H4V4Zm4 5h8M8 12h8M8 15h5' },
  { key: 'notes', label: 'notes', path: 'M5 3h10l5 5v13H5V3Zm10 0v6h5M8 13h9M8 17h6' },
  { key: 'photo', label: 'photo', path: 'M3 6h18v15H3V6Zm4 0 2-3h6l2 3M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' },
];

export function getBoxFieldDraft(box, field) {
  if (field === 'tags') return (box.tags || []).join(', ');
  return String(box[field] ?? '');
}

export function buildBoxFieldPatch(field, draft) {
  if (!['box_id', 'label', 'tags', 'description', 'notes'].includes(field)) {
    throw new Error('Unsupported box text field.');
  }
  const value = String(draft ?? '').trim();
  if (field === 'box_id' && !/^\d{3}$/.test(value)) throw new Error('Use exactly three digits.');
  if (field === 'label' && !value) throw new Error('Name is required.');
  return { [field]: field === 'tags'
    ? [...new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean))]
    : value };
}
