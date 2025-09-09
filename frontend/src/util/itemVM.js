// src/utils/itemVM.js
/**
 * A single, unified view-model for ItemRow to consume
 * No matter where the item came from (tree or flat list), we produce this shape:
 *
 * {
 *   id: string,            // item _id
 *   name: string,          // item name
 *   tags: string[],        // normalized tag list
 *   quantity: number|null, // optional
 *   notes: string|null,    // optional
 *   parent: {              // context about the box it lives in
 *     _id: string,
 *     shortId: string,
 *     name: string,
 *     path: string[],      // breadcrumbs from root → parent
 *   }
 * }
 */

// Safe getters so mismatched data never explodes UI
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v) => (typeof v === 'number' ? v : v == null ? null : Number(v));

/**
 * Build a breadcrumb path (array of shortIds or names) from ancestors
 * ancestors: [{ _id, shortId, name }, ...] root → current parent
 */
export function makePathFromAncestors(ancestors = [], use = 'shortId') {
  return ancestors.map((a) => str(a?.[use] ?? a?.name ?? ''));
}

/**
 * Adapt a raw item + its parent box context to the ItemVM
 */
export function toItemVM(rawItem, parentBox, ancestors = []) {
  if (!rawItem) return null;
  const id = str(rawItem._id || rawItem.id);
  const parent = parentBox
    ? {
        _id: str(parentBox._id),
        shortId: str(parentBox.shortId),
        name: str(parentBox.name),
        path: makePathFromAncestors(ancestors, 'shortId'),
      }
    : {
        _id: '',
        shortId: '',
        name: '',
        path: [],
      };

  return {
    id,
    name: str(rawItem.name),
    tags: arr(rawItem.tags),
    quantity: num(rawItem.quantity),
    notes: str(rawItem.notes ?? ''),
    parent,
  };
}

/**
 * Walk a normalized box tree and yield ItemVMs for every item under each box.
 * Pass the current node as `node`, plus a list of ancestors (root → parent).
 */
export function* walkTreeForItemVMs(node, ancestors = []) {
  if (!node) return;

  const here = { _id: node._id, shortId: node.shortId, name: node.name };
  const nextAnc = [...ancestors, here];

  // Items in this box
  if (Array.isArray(node.items)) {
    for (const it of node.items) {
      const vm = toItemVM(it, here, ancestors); // parent is 'here', path is ancestors
      if (vm) yield vm;
    }
  }

  // Recurse into child boxes
  if (Array.isArray(node.childBoxes)) {
    for (const child of node.childBoxes) {
      yield* walkTreeForItemVMs(child, nextAnc);
    }
  }
}

/**
 * From a flat list (e.g., `flattenBoxes` output) build ItemVMs.
 * We assume each flat item optionally carries some parent box info, or you pass a map.
 */
export function makeItemVMsFromFlat(
  flatItems,
  parentLookupByBoxId = new Map()
) {
  const vms = [];
  for (const it of flatItems || []) {
    const parentBox =
      it.parent ||
      parentLookupByBoxId.get(it.parentId || it.boxId || it.parent?._id) ||
      null;

    const ancestors =
      parentBox && Array.isArray(parentBox.ancestors)
        ? parentBox.ancestors
        : [];

    const vm = toItemVM(it, parentBox, ancestors);
    if (vm) vms.push(vm);
  }
  return vms;
}
