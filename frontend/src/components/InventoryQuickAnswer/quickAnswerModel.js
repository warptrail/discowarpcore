const normalize = (value) => String(value ?? '').trim().toLowerCase();
const text = (value) => String(value ?? '').trim();

// Shared with the nested Operations results: keep the existing matching behavior.
export function getMatchingInventoryItems(node, query, searchScope = 'all') {
  const needle = normalize(query);
  if (!needle || searchScope === 'boxes') return [];
  return (Array.isArray(node?.items) ? node.items : []).filter((item) => normalize([
    item?.name, item?.label, item?.description, item?.notes, item?.category,
    item?.primaryOwnerName, ...(Array.isArray(item?.tags) ? item.tags : []),
  ].filter(Boolean).join(' ')).includes(needle));
}

function pathFor(location, fallback = '') {
  if (location && typeof location === 'object') {
    const parts = ['room', 'vicinity', 'specifics', 'exactSpot'].map((key) => text(location[key])).filter(Boolean);
    if (parts.length) return parts;
  }
  return text(fallback).split(/\s*·\s*/).filter(Boolean);
}

export function buildQuickAnswers({ boxes = [], orphanedItems = [], locations = [], query = '' }) {
  const needle = normalize(query);
  if (!needle) return [];
  const registry = new Map(locations.map((location) => [String(location._id), location]));
  const candidates = [];
  const seen = new Set();
  const add = (item, box, path) => {
    const id = text(item?._id || item?.id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    const name = text(item.name || item.label) || 'Unnamed item';
    const normalizedName = normalize(name);
    const rank = normalizedName === needle ? 0 : normalizedName.startsWith(needle) ? 1 : normalizedName.includes(needle) ? 2 : 3;
    candidates.push({ id, item, name, nameMatch: rank < 3, rank,
      boxId: text(box?.box_id), boxLabel: text(box?.label),
      boxRecordId: text(box?._id), path, unboxed: !box,
    });
  };
  const visit = (nodes, ancestorPath = []) => {
    for (const box of nodes) {
      const structured = typeof box.locationId === 'object' ? box.locationId : registry.get(String(box.locationId));
      const ownPath = pathFor(structured, box.location);
      const path = ownPath.length ? ownPath : ancestorPath;
      for (const item of getMatchingInventoryItems(box, needle)) add(item, box, path.length ? path : pathFor(null, item.location));
      visit(box.childBoxes || [], path);
    }
  };
  visit(boxes);
  for (const item of orphanedItems) {
    // Orphaned candidates are already filtered by the Operations query and controls.
    add(item, null, pathFor(typeof item.locationId === 'object' ? item.locationId : registry.get(String(item.locationId)), item.location));
  }
  return candidates.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}
