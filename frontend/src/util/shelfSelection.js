import { compareBoxAddresses } from './boxAddress.js';
import { getItemCompartment, scopeBoxToCompartment } from './boxCompartments.js';
import { collectPlacedItems } from './boxAddressViews.js';

export function readShelfSelection(raw, cabinetKey, shelves, fallback = '') {
  const valid = new Set(shelves.map(row => row.key));
  const keys = raw ? String(raw).split(',') : [fallback];
  return [...new Set(keys.filter(key => key[0] === cabinetKey[0] && valid.has(key)))].sort(compareBoxAddresses);
}

export function toggleShelfSelection(selected, key) {
  return selected.includes(key) ? selected.filter(value => value !== key) : [...selected, key].sort(compareBoxAddresses);
}

// Scope only the owner's direct placements; physical descendants travel with
// their containing box and retain their own item ownership.
export function scopeBoxToShelves(owner, cabinetKey, selected = []) {
  if (!owner) return null;
  if (!selected.length) return scopeBoxToCompartment(owner, cabinetKey[0]);
  return { ...owner,
    items: (owner.items || []).filter(item => selected.includes(getItemCompartment(owner, item))),
    childBoxes: (owner.childBoxes || []).filter(child => selected.includes(child.parentCompartmentKey || owner.childBoxCompartments?.[child._id] || '')),
  };
}

export function countShelfItems(owner, cabinetKey, shelves) {
  if (!owner) return null;
  return Object.fromEntries([cabinetKey[0], ...shelves.map(row => row.key)].map(key => [key,
    collectPlacedItems(scopeBoxToCompartment(owner, key)).length,
  ]));
}
