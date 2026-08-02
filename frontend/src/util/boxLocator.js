export function normalizeBoxId(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .trim();
}

export function compareNumericBoxIds(a, b) {
  const aNum = Number(a);
  const bNum = Number(b);
  const aValid = Number.isFinite(aNum);
  const bValid = Number.isFinite(bNum);

  if (aValid && bValid && aNum !== bNum) return aNum - bNum;
  return String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

export function matchesBoxIdPrefix(boxId, prefix) {
  const normalizedPrefix = normalizeBoxId(prefix);
  if (!normalizedPrefix) return true;
  return normalizeBoxId(boxId).startsWith(normalizedPrefix);
}

export function filterBoxTreeByIdPrefix(nodes, prefix) {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const normalizedPrefix = normalizeBoxId(prefix);
  if (!normalizedPrefix) return safeNodes;

  const matches = [];

  const collectMatches = (list) => {
    for (const node of list || []) {
      if (!node || typeof node !== 'object') continue;

      if (matchesBoxIdPrefix(node?.box_id, normalizedPrefix)) {
        matches.push(node);
        continue;
      }

      collectMatches(node?.childBoxes);
    }
  };

  collectMatches(safeNodes);
  return matches;
}
