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

module.exports = { computeStats, flattenBoxes };
