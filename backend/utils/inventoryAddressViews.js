const { parseBoxAddress } = require('../../shared/boxAddress.mjs');
const { getCompartments, flattenCompartments, getItemCompartment, getChildBoxCompartment, compartmentContains } = require('./boxCompartments');

const id = value => String(value?._id || value || '');
const text = values => values.filter(Boolean).join(' ').toLowerCase();
const invalid = message => Object.assign(new Error(message), { status: 400, code: 'INVALID_ADDRESS' });

function createAddressIndex(boxes, items = []) {
  const byId = new Map(boxes.map(box => [id(box), box]));
  const byNumber = new Map(boxes.map(box => [box.box_id, box]));
  const itemsById = new Map(items.map(item => [id(item), item]));
  const children = new Map();
  for (const box of boxes) {
    const parent = id(box.parentBox);
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(box);
  }
  function collect(box, key = '') {
    const boxIds = new Set(), itemIds = new Set();
    const visit = (current, selected = '') => {
      if (!current || boxIds.has(id(current))) return;
      boxIds.add(id(current));
      for (const item of current.items || []) {
        if (itemsById.has(id(item)) && (!selected || compartmentContains(selected, getItemCompartment(current, id(item))))) itemIds.add(id(item));
      }
      for (const child of children.get(id(current)) || []) {
        if (!selected || compartmentContains(selected, getChildBoxCompartment(current, id(child)))) visit(child);
      }
    };
    visit(box, key);
    return { boxIds, itemIds };
  }
  function resolve(value) {
    if (!value) return null;
    const parsed = parseBoxAddress(value);
    if (!parsed) throw invalid('Invalid address. Use 504, 504B, or 504B1–504B99.');
    if (!parsed.complete) {
      const boxIds = new Set(), itemIds = new Set();
      for (const owner of boxes.filter(box => box.box_id.startsWith(parsed.boxId))) {
        const found = collect(owner);
        found.boxIds.forEach(key => boxIds.add(key)); found.itemIds.forEach(key => itemIds.add(key));
      }
      return { ...parsed, boxIds, itemIds };
    }
    const owner = byNumber.get(parsed.boxId);
    if (!owner || (parsed.compartmentKey && !flattenCompartments(owner).some(row => row.key === parsed.compartmentKey))) {
      throw invalid(`Address #${parsed.address} does not exist.`);
    }
    return { ...parsed, owner, ...collect(owner, parsed.compartmentKey) };
  }
  function trail(box, itemId) {
    const parts = [], seen = new Set();
    let current = box, key = itemId ? getItemCompartment(box, itemId) : '';
    while (current && !seen.has(id(current))) {
      seen.add(id(current));
      const row = flattenCompartments(current).find(row => row.key === key);
      parts.unshift(`${current.box_id}${key} ${current.label || ''} ${row?.label || ''}`.trim());
      const parent = byId.get(id(current.parentBox));
      key = getChildBoxCompartment(parent, id(current));
      current = parent;
    }
    return parts.join(' > ');
  }
  return { byId, byNumber, itemsById, children, collect, resolve, trail };
}

function buildAddressViews(physicalRows, index, includeCabinets) {
  return physicalRows.flatMap(row => {
    const owner = index.byId.get(row.id);
    const all = index.collect(owner);
    const itemText = ids => [...ids].map(key => {
      const item = index.itemsById.get(key);
      return item ? text([item.name, item.description, item.notes, item.category, ...(item.tags || []), index.trail(index.byId.get(row.id), key)]) : '';
    }).join(' ');
    const root = { ...row, kind: 'box', resultKey: `box:${row.id}`, ownerBoxMongoId: row.id, address: row.boxId,
      searchText: text([row.searchText, ...flattenCompartments(owner).map(part => `${row.boxId}${part.key} ${part.label}`), itemText(all.itemIds)]),
      scopedItemIds: [...all.itemIds], scopeBoxIds: [...all.boxIds] };
    if (!includeCabinets) return [root];
    return [root, ...getCompartments(owner).map(cabinet => {
      const scoped = index.collect(owner, cabinet.key);
      const direct = (owner.items || []).filter(item => compartmentContains(cabinet.key, getItemCompartment(owner, id(item))));
      const itemTags = [...new Set([...scoped.itemIds].flatMap(id => index.itemsById.get(id)?.tags || []))];
      return { ...root, itemTags, tagKeys: itemTags.map(tag => tag.toLowerCase()), kind: 'cabinet', resultKey: `cabinet:${row.id}:${cabinet.key}`, address: `${row.boxId}${cabinet.key}`,
        compartmentKey: cabinet.key, ownerBoxLabel: row.boxLabel, boxLabel: cabinet.label || `Compartment ${cabinet.key}`,
        shelfCount: cabinet.children?.length || 0, shelves: cabinet.children || [], isComplexBox: false,
        directItemCount: direct.length, scopedItemCount: scoped.itemIds.size, childBoxCount: scoped.boxIds.size - 1,
        scopedItemIds: [...scoped.itemIds], scopeBoxIds: [...scoped.boxIds],
        searchText: text([`${row.boxId}${cabinet.key}`, cabinet.label, ...(cabinet.children || []).map(part => `${row.boxId}${part.key} ${part.label}`), row.locationLabel, row.tags.join(' '), itemText(scoped.itemIds)]) };
    })];
  });
}

function viewInScope(row, scope) {
  if (!scope) return true;
  if (!scope.complete) return scope.boxIds.has(row.ownerBoxMongoId);
  if (row.boxId === scope.boxId) return !scope.cabinet || (row.kind === 'cabinet' && row.compartmentKey === scope.cabinet);
  return scope.boxIds.has(row.ownerBoxMongoId);
}
module.exports = { createAddressIndex, buildAddressViews, viewInScope, parseBoxAddress };
