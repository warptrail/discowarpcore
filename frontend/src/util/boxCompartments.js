export function getCompartments(box) {
  if (!box?.isComplexBox) return [];
  return box.compartments?.length >= 2 ? box.compartments : [{ key: 'A', label: '' }, { key: 'B', label: '' }];
}

export function flattenCompartments(box) {
  return getCompartments(box).flatMap((row) => [row, ...(row.children || []).map((child) => ({ ...child, parentLabel: row.label || `Compartment ${row.key}` }))]);
}

export function getLeafCompartments(box) {
  return flattenCompartments(box).filter((row) => !row.children?.length);
}

export function getItemCompartment(box, item) {
  const leaves = getLeafCompartments(box);
  const key = box?.itemCompartments?.[String(item?._id || item?.id || item)] || item?.compartmentKey;
  return leaves.some((row) => row.key === key) ? key : leaves[0]?.key || '';
}

export function compartmentContains(selectedKey, key) {
  return selectedKey === key || (/^[A-Z]$/.test(selectedKey) && new RegExp(`^${selectedKey}[1-9][0-9]*$`).test(key));
}

export function compartmentAddress(box, key = '') {
  return `${box?.box_id || ''}${key}`;
}

export function compartmentLabel(row) {
  return [row.parentLabel, row.label || (row.parentLabel ? `Shelf ${row.key.slice(1)}` : `Compartment ${row.key}`)].filter(Boolean).join(' · ');
}

export function scopeBoxToCompartment(box, selectedKey) {
  if (!box || !selectedKey) return box;
  return {
    ...box,
    compartmentKey: selectedKey,
    items: (box.items || []).filter((item) => compartmentContains(selectedKey, getItemCompartment(box, item))),
    childBoxes: (box.childBoxes || []).filter((child) => compartmentContains(selectedKey, child.parentCompartmentKey || box.childBoxCompartments?.[child._id] || '')),
  };
}
