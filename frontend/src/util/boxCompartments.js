export function getCompartments(box) {
  if (!box?.isComplexBox) return [];
  return box.compartments?.length >= 2 ? box.compartments : [{ key: 'A', label: '' }, { key: 'B', label: '' }];
}

export function getItemCompartment(box, item) {
  if (!box?.isComplexBox) return '';
  const key = box.itemCompartments?.[String(item?._id || item?.id || item)] || item?.compartmentKey;
  return getCompartments(box).some((row) => row.key === key) ? key : 'A';
}

export function compartmentAddress(box, key = '') {
  return `${box?.box_id || ''}${key}`;
}
