// Physical identity stays three digits. An address is a view into that identity.
export function normalizeBoxAddress(value) {
  return String(value ?? '').trim().replace(/^#\s*/, '').toUpperCase();
}

export function parseBoxAddress(value) {
  const address = normalizeBoxAddress(value);
  const match = /^(\d{1,3})(?:([A-Z])([1-9]\d?)?)?$/.exec(address);
  if (!match || (match[2] && match[1].length !== 3)) return null;
  const [, boxId, cabinet = '', shelf = ''] = match;
  return { address, boxId, cabinet, shelf: shelf ? Number(shelf) : null,
    compartmentKey: `${cabinet}${shelf}`, complete: boxId.length === 3,
    kind: cabinet ? (shelf ? 'shelf' : 'cabinet') : (boxId.length === 3 ? 'box' : 'prefix') };
}

export function formatBoxAddress(boxId, compartmentKey = '') {
  const parsed = parseBoxAddress(`${boxId}${compartmentKey}`);
  return parsed?.complete ? parsed.address : '';
}

export function compareBoxAddresses(a, b) {
  return normalizeBoxAddress(a).localeCompare(normalizeBoxAddress(b), undefined, { numeric: true });
}
