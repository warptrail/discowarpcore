// Accepts the raw tree your API returns for /by-short-id/:shortId/tree
// and returns flat maps + the root id.
//
// Works whether node.items are full docs or ObjectIds/strings.

export function normalizeBoxTree(rootNode) {
  const boxesById = new Map();
  const itemsById = new Map();
  const childrenByBoxId = new Map();

  function visit(node) {
    const id = String(node._id);

    // --- Collect items ---
    const itemIds = [];
    if (Array.isArray(node.items)) {
      for (const it of node.items) {
        // items can be either ObjectIds/strings OR full docs
        const itemId = String(it?._id ?? it);
        itemIds.push(itemId);

        // If we were given a full doc, stash it
        if (it && typeof it === 'object' && it._id) {
          if (!itemsById.has(itemId)) itemsById.set(itemId, it);
        }
      }
    }

    // --- Record children relationships ---
    const kids = Array.isArray(node.childBoxes) ? node.childBoxes : [];
    const childIds = kids.map((k) => String(k._id));
    childrenByBoxId.set(id, childIds);

    // --- Store the box itself (but replace items with just ids) ---
    // Keep all original fields (label, box_id, imagePath, etc.)
    boxesById.set(id, { ...node, items: itemIds });

    // --- Recurse into children ---
    for (const kid of kids) visit(kid);
  }

  visit(rootNode);

  return {
    rootId: String(rootNode._id),
    boxesById, // Map<boxId, boxDocWithItemIds>
    itemsById, // Map<itemId, itemDoc> (may be empty if API sent only ids)
    childrenByBoxId, // Map<boxId, boxId[]>
  };
}
