// utils/boxHelpers.js
function computeStats(nodesById, itemsById) {
  const names = new Set();
  let totalItems = 0;

  for (const node of nodesById.values()) {
    if (!Array.isArray(node.items)) continue;
    for (const iid of node.items) {
      const it = itemsById.get(String(iid));
      if (!it) continue;
      const nm = String(it.name ?? '')
        .trim()
        .toLowerCase();
      if (nm) names.add(nm);
      totalItems += Number.isFinite(it.quantity) ? it.quantity : 1;
    }
  }

  return {
    boxes: nodesById.size,
    uniqueItems: names.size,
    totalItems,
  };
}

function flattenBoxes(tree) {
  const out = [];
  function walk(box, parentPath = []) {
    if (Array.isArray(box.items)) {
      for (const it of box.items) {
        out.push({
          ...it,
          parent: { _id: box._id, box_id: box.box_id, label: box.label },
          parentPath,
        });
      }
    }
    for (const child of box.childBoxes || []) {
      walk(child, [
        ...parentPath,
        { _id: box._id, box_id: box.box_id, label: box.label },
      ]);
    }
  }
  walk(tree);
  return out;
}

/**
 * Build quick lookup maps for boxes
 * @param {Array} boxes - array of lean Box docs
 */
function buildBoxMaps(boxes) {
  const byId = new Map();
  const parentOf = new Map();

  for (const b of boxes) {
    byId.set(String(b._id), b);
    if (b.parentBox) {
      parentOf.set(String(b._id), String(b.parentBox));
    }
  }

  return { byId, parentOf };
}

/**
 * Walk up from a leaf box to build breadcrumb and depth
 * @param {ObjectId|String} leafId - box _id of the leaf
 * @param {Object} maps - { byId, parentOf }
 */
function makeBreadcrumb(leafId, maps) {
  const breadcrumb = [];
  let currentId = String(leafId);
  let depth = 0;

  while (currentId) {
    const box = maps.byId.get(currentId);
    if (!box) break;

    breadcrumb.unshift({
      _id: box._id,
      box_id: box.box_id,
      label: box.label,
    });

    depth++;
    currentId = maps.parentOf.get(currentId);
  }

  const rootBox = breadcrumb.length > 0 ? breadcrumb[0] : null;
  return { breadcrumb, depth, rootBox };
}

module.exports = { computeStats, flattenBoxes, buildBoxMaps, makeBreadcrumb };
