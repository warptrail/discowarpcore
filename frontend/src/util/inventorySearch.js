import { LOCATION_LEVELS } from './locationStructure.js';

const normalize = (value) => String(value ?? '').trim().toLowerCase();
const tags = (record) => Array.isArray(record?.tags) ? record.tags : [];
const searchText = (values) => normalize(values.filter(Boolean).join(' '));

// Search human inventory metadata, not database IDs, image paths or storage data.
export function getItemSearchText(item) {
  return searchText([
    item?.name, item?.label, item?.description, item?.notes, item?.category,
    item?.location, item?.primaryOwnerName, item?.keepPriority, ...tags(item),
  ]);
}

export function getBoxSearchText(box, locationPath = []) {
  const location = typeof box?.locationId === 'object' ? box.locationId : null;
  return searchText([
    box?.box_id, box?.label, box?.name, box?.location, ...locationPath,
    ...LOCATION_LEVELS.map((level) => location?.[level]),
    box?.description, box?.notes, ...tags(box),
  ]);
}

export function matchesInventoryQuery(box, query, scope = 'all') {
  const needle = normalize(query);
  const boxText = scope === 'items' ? '' : getBoxSearchText(box);
  const items = Array.isArray(box?.items) ? box.items : [];
  const itemText = scope === 'boxes' ? '' : items.map(getItemSearchText).join(' ');
  return searchText([boxText, itemText]).includes(needle);
}

export function getMatchingInventoryItems(box, query, scope = 'all') {
  const needle = normalize(query);
  if (!needle || scope === 'boxes') return [];
  return (Array.isArray(box?.items) ? box.items : []).filter((item) => getItemSearchText(item).includes(needle));
}

// Count physical matches once, not ancestors retained only to display a child.
// The caller supplies the same active controls used to filter the result tree.
export function countMatchingInventoryBoxes(boxes, matches) {
  const seen = new Set();
  const visit = (nodes) => {
    let count = 0;
    for (const box of nodes || []) {
      const key = box?._id || box?.box_id || box;
      const identity = typeof key === 'object' ? key : String(key);
      if (seen.has(identity)) continue;
      seen.add(identity);
      if (matches(box)) count += 1;
      count += visit(box.childBoxes);
    }
    return count;
  };
  return visit(boxes);
}
