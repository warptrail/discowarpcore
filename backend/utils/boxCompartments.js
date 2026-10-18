const DEFAULT_COMPARTMENTS = [{ key: 'A', label: '' }, { key: 'B', label: '' }];

function getCompartments(box) {
  if (!box?.isComplexBox) return [];
  return box.compartments?.length >= 2 ? box.compartments : DEFAULT_COMPARTMENTS;
}

function flattenCompartments(box) {
  return getCompartments(box).flatMap((row) => [row, ...(row.children || [])]);
}

function getLeafCompartments(box) {
  return flattenCompartments(box).filter((row) => !row.children?.length);
}

function invalid(message) {
  return Object.assign(new Error(message), { status: 400, code: 'INVALID_COMPARTMENT' });
}

function validateCompartments(value, previous = []) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 26) {
    throw invalid('A complex box needs between 2 and 26 compartments.');
  }
  if (value.length < previous.length) throw invalid('Existing compartments cannot be removed.');
  return value.map((row, index) => {
    const key = String.fromCharCode(65 + index);
    if (row?.key !== key) throw invalid('Keep existing compartment letters in order.');
    const normalized = { key, label: String(row.label || '').trim().slice(0, 80) };
    if (row.children !== undefined && !Array.isArray(row.children)) throw invalid('Shelves must be an array.');
    const children = row.children || [];
    if (children.length > 99 || children.length < (previous[index]?.children?.length || 0)) {
      throw invalid('Keep existing shelves in order; a compartment supports up to 99 shelves.');
    }
    if (children.length) normalized.children = children.map((child, childIndex) => {
      const childKey = `${key}${childIndex + 1}`;
      if (child?.key !== childKey) throw invalid('Shelf keys must follow their cabinet, such as B1, B2, B3.');
      if (child.children !== undefined) throw invalid('Complex boxes stop at three layers: box, compartment, shelf.');
      return { key: childKey, label: String(child.label || '').trim().slice(0, 80) };
    });
    return normalized;
  });
}

function mapValue(map, id) {
  return map instanceof Map ? map.get(String(id)) : map?.[String(id)];
}

function getItemCompartment(box, itemId) {
  const leaves = getLeafCompartments(box);
  if (!leaves.length) return '';
  const key = mapValue(box.itemCompartments, itemId);
  return leaves.some((row) => row.key === key) ? key : leaves[0].key;
}

function getChildBoxCompartment(box, childId) {
  if (!box?.isComplexBox) return '';
  const key = mapValue(box.childBoxCompartments, childId);
  return getLeafCompartments(box).some((row) => row.key === key) ? key : '';
}

function resolveCompartment(box, requested) {
  const key = String(requested || '').trim().toUpperCase();
  const leaves = getLeafCompartments(box);
  if (!key) return leaves[0]?.key || '';
  if (!leaves.some((row) => row.key === key)) {
    throw invalid('Choose a storage compartment or shelf, not a subdivided cabinet.');
  }
  return key;
}

function compartmentContains(selectedKey, key) {
  return selectedKey === key || (/^[A-Z]$/.test(selectedKey) && new RegExp(`^${selectedKey}[1-9][0-9]*$`).test(key));
}

// The parent owns both placement maps, so subdivision and reassignment are one atomic write.
function reassignCompartments(existing, compartments, childIds, assignments = {}) {
  if (!assignments || typeof assignments !== 'object' || Array.isArray(assignments)) throw invalid('Reassignments must contain item and box maps.');
  const next = { ...existing, isComplexBox: true, compartments };
  const previous = { ...existing, isComplexBox: true };
  const itemMap = Object.fromEntries(existing.itemCompartments instanceof Map ? existing.itemCompartments : Object.entries(existing.itemCompartments || {}));
  const childMap = Object.fromEntries(existing.childBoxCompartments instanceof Map ? existing.childBoxCompartments : Object.entries(existing.childBoxCompartments || {}));
  for (const [kind, ids, map, lookup] of [
    ['items', (existing.items || []).map(String), itemMap, getItemCompartment],
    ['boxes', childIds.map(String), childMap, getChildBoxCompartment],
  ]) {
    const changes = assignments[kind] || {};
    if (typeof changes !== 'object' || Array.isArray(changes)) throw invalid('Reassignments must map record IDs to shelf keys.');
    if (Object.keys(changes).some((id) => !ids.includes(id))) throw invalid('Reassignments must belong directly to this box.');
    for (const id of ids) {
      const before = lookup(previous, id);
      const target = Object.hasOwn(changes, id) ? changes[id] : before;
      if (Object.hasOwn(changes, id) && !String(target || '').trim()) throw invalid('Choose an explicit shelf for every reassignment.');
      if (kind === 'boxes' && !target && !before) continue; // Preserve legacy unspecified placement.
      const resolved = resolveCompartment(next, target);
      if (before && !Object.hasOwn(changes, id) && resolved !== before) throw invalid('Assign every affected item and nested box to a shelf before saving.');
      if (target) map[id] = resolved;
    }
  }
  return { itemCompartments: itemMap, childBoxCompartments: childMap };
}

function itemPlacement(box, itemId) {
  const compartmentKey = getItemCompartment(box, itemId);
  return { compartmentKey, placementLabel: box ? `${box.box_id || ''}${compartmentKey}` : '' };
}

function withBoxCompartments(box) {
  if (!box) return box;
  return {
    ...box,
    isComplexBox: Boolean(box.isComplexBox),
    compartments: getCompartments(box),
    items: (box.items || []).map((item) => item && typeof item === 'object' && item.name !== undefined
      ? { ...item, ...itemPlacement(box, item._id) }
      : item),
  };
}

module.exports = { DEFAULT_COMPARTMENTS, getCompartments, flattenCompartments, getLeafCompartments, validateCompartments, getItemCompartment, getChildBoxCompartment, resolveCompartment, compartmentContains, reassignCompartments, itemPlacement, withBoxCompartments };
