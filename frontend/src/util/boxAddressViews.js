import { parseBoxAddress } from './boxAddress.js';
import { getCompartments, flattenCompartments, scopeBoxToCompartment, getItemCompartment } from './boxCompartments.js';

export const viewAddress = box => box?.address || box?.box_id || '';
export function collectPlacedItems(box) {
  const seenItems = new Set(), seenBoxes = new Set(), result = [];
  const visit = (node, trail = []) => {
    const boxKey = String(node._id || node.box_id);
    if (seenBoxes.has(boxKey)) return;
    seenBoxes.add(boxKey);
    const storageTrail = key => {
      const row = flattenCompartments(node).find(row => row.key === key);
      return [...trail, `#${node.box_id}${key} ${node.label || ''} ${row?.label || ''}`.trim()];
    };
    for (const item of node.items || []) {
      const key = String(item._id || item.id);
      if (seenItems.has(key)) continue;
      seenItems.add(key);
      const compartment = getItemCompartment(node, item);
      result.push({ ...item, ownerBoxMongoId: node._id, ownerBoxId: node.box_id,
        placementLabel: `${node.box_id}${compartment}`, placementTrail: storageTrail(compartment).join(' > ') });
    }
    for (const child of node.childBoxes || []) {
      const key = child.parentCompartmentKey || node.childBoxCompartments?.[child._id] || '';
      visit(child, storageTrail(key));
    }
  };
  if (box) visit(box);
  return result;
}

export function cabinetView(owner, key) {
  const cabinet = getCompartments(owner).find(row => row.key === key?.[0]);
  if (!cabinet || !flattenCompartments(owner).some(row => row.key === key)) return null;
  const scoped = scopeBoxToCompartment(owner, key);
  return { ...scoped, kind: 'cabinet', resultKey: `cabinet:${owner._id}:${cabinet.key}`, ownerBoxMongoId: owner._id,
    boxId: owner.box_id, address: `${owner.box_id}${key}`, compartmentKey: key, ownerBox: owner,
    ownerBoxLabel: owner.label, label: cabinet.label || `Compartment ${cabinet.key}`,
    directChildBoxCount: scoped.childBoxes?.length || 0,
    shelfCount: cabinet.children?.length || 0, shelves: cabinet.children || [], compartments: [cabinet], isComplexBox: false,
    items: collectPlacedItems(scoped), _scopeChildBoxes: scoped.childBoxes, childBoxes: [] };
}

export function buildBoxViewTree(boxes) {
  return (boxes || []).flatMap(box => [
    { ...box, kind: 'box', resultKey: `box:${box._id}`, ownerBoxMongoId: box._id, boxId: box.box_id,
      address: box.box_id, ownerBox: box, childBoxes: buildBoxViewTree(box.childBoxes) },
    ...getCompartments(box).map(row => cabinetView(box, row.key)),
  ]);
}

export function findAddressView(boxes, value) {
  const parsed = parseBoxAddress(value);
  if (!parsed?.complete) return null;
  for (const box of boxes || []) {
    if (box.kind === 'cabinet') continue;
    if (box.box_id === parsed.boxId) return parsed.compartmentKey ? cabinetView(box.ownerBox || box, parsed.compartmentKey) : box;
    const match = findAddressView(box.childBoxes, value);
    if (match) return match;
  }
  return null;
}

export function scopeBoxViews(boxes, value) {
  if (!value) return boxes;
  const parsed = parseBoxAddress(value);
  if (!parsed) return [];
  if (parsed.compartmentKey) {
    const view = findAddressView(boxes, value);
    return view ? [{ ...view, scopedAddress: view.address, address: `${parsed.boxId}${parsed.cabinet}` }] : [];
  }
  const result = [];
  for (const box of boxes || []) {
    if (String(box.box_id).startsWith(parsed.boxId)) result.push(box);
    else result.push(...scopeBoxViews(box.childBoxes, value));
  }
  return result;
}

// Keep the owning box first; reverse only its section rows for descending IDs.
export function compareFamilyViews(a, b, sortBy, sortDirection) {
  if (a.kind !== b.kind) return a.kind === 'cabinet' ? 1 : -1;
  const direction = sortBy === 'boxId' && sortDirection === 'desc' ? -1 : 1;
  return viewAddress(a).localeCompare(viewAddress(b), undefined, { numeric: true }) * direction;
}
