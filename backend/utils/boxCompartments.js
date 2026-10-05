const DEFAULT_COMPARTMENTS = [{ key: 'A', label: '' }, { key: 'B', label: '' }];

function getCompartments(box) {
  if (!box?.isComplexBox) return [];
  return box.compartments?.length >= 2 ? box.compartments : DEFAULT_COMPARTMENTS;
}

function validateCompartments(value, previous = []) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 26) {
    throw Object.assign(new Error('A complex box needs between 2 and 26 compartments.'), { status: 400 });
  }
  const rows = value.map((row, index) => ({
    key: String.fromCharCode(65 + index),
    label: String(row?.label || '').trim().slice(0, 80),
  }));
  if (value.some((row, index) => row?.key !== rows[index].key) || value.length < previous.length) {
    throw Object.assign(new Error('Keep existing compartment letters in order. New compartments are added at the end.'), { status: 400 });
  }
  return rows;
}

function getItemCompartment(box, itemId) {
  const compartments = getCompartments(box);
  if (!compartments.length) return '';
  const assignments = box.itemCompartments;
  const key = assignments instanceof Map ? assignments.get(String(itemId)) : assignments?.[String(itemId)];
  return compartments.some((row) => row.key === key) ? key : 'A';
}

function resolveCompartment(box, requested) {
  const key = String(requested || '').trim().toUpperCase();
  if (!key) return box?.isComplexBox ? 'A' : '';
  if (!getCompartments(box).some((row) => row.key === key)) {
    throw Object.assign(new Error('Choose a valid compartment in the destination box.'), { status: 400 });
  }
  return key;
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

module.exports = { DEFAULT_COMPARTMENTS, getCompartments, validateCompartments, getItemCompartment, resolveCompartment, itemPlacement, withBoxCompartments };
