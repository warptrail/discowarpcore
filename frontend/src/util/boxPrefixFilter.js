const VALID_BOX_PREFIXES = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

export function normalizeBoxPrefix(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'all') return 'all';
  if (VALID_BOX_PREFIXES.has(normalized)) return normalized;
  return 'all';
}

export function getBoxShortId(box) {
  const raw = box?.box_id ?? box?.boxId ?? box?.id ?? '';
  const value = String(raw).trim();
  if (!value) return '';
  return value.padStart(3, '0');
}

export function boxMatchesPrefix(box, selectedPrefix) {
  const prefix = normalizeBoxPrefix(selectedPrefix);
  if (prefix === 'all') return true;
  return getBoxShortId(box).startsWith(prefix);
}

export function filterBoxTreeByPrefix(boxes, selectedPrefix) {
  const prefix = normalizeBoxPrefix(selectedPrefix);
  const safeBoxes = Array.isArray(boxes) ? boxes : [];
  if (prefix === 'all') return safeBoxes;

  const filterNode = (node) => {
    if (!node || typeof node !== 'object') return null;

    if (boxMatchesPrefix(node, prefix)) {
      return {
        ...node,
        childBoxes: Array.isArray(node.childBoxes) ? node.childBoxes : [],
      };
    }

    const childBoxes = (Array.isArray(node.childBoxes) ? node.childBoxes : [])
      .map(filterNode)
      .filter(Boolean);

    if (!childBoxes.length) return null;

    return {
      ...node,
      childBoxes,
    };
  };

  return safeBoxes.map(filterNode).filter(Boolean);
}
