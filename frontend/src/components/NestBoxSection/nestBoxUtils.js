export function collectDescendantBoxIds(root) {
  const ids = new Set();
  if (!root) return ids;

  const stack = Array.isArray(root?.childBoxes) ? [...root.childBoxes] : [];

  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;

    if (node?._id) ids.add(String(node._id));

    const kids = Array.isArray(node?.childBoxes) ? node.childBoxes : [];
    for (const child of kids) {
      if (child) stack.push(child);
    }
  }

  return ids;
}

export function buildDepthById(boxes) {
  const parentById = new Map();
  for (const b of boxes || []) {
    const id = b?._id != null ? String(b._id) : null;
    if (!id) continue;
    const parentId =
      b?.parentBox && b.parentBox._id != null ? String(b.parentBox._id) : null;
    parentById.set(id, parentId);
  }

  const memo = new Map();

  const depthOf = (id) => {
    const key = String(id);
    if (memo.has(key)) return memo.get(key);

    let depth = 0;
    let cur = key;
    const seen = new Set();

    while (true) {
      const p = parentById.get(cur);
      if (!p) break;

      if (seen.has(cur)) {
        depth = 0;
        break;
      }
      seen.add(cur);

      depth += 1;
      cur = p;
    }

    memo.set(key, depth);
    return depth;
  };

  const out = new Map();
  for (const id of parentById.keys()) out.set(id, depthOf(id));
  return out;
}

export function getParentChain({ boxes, localBoxTree }) {
  const byId = new Map((boxes || []).map((b) => [String(b?._id), b]));
  const chain = [];

  let p = localBoxTree?.parentBox;
  const seen = new Set();

  while (p) {
    const pid =
      typeof p === 'string'
        ? String(p)
        : p?._id != null
          ? String(p._id)
          : null;
    if (!pid || seen.has(pid)) break;
    seen.add(pid);

    const parentObj = typeof p === 'object' ? p : byId.get(pid) || { _id: pid };
    chain.push(parentObj);

    const next = byId.get(pid);
    p = next?.parentBox ?? null;
  }

  return chain.reverse();
}

export function getCurrentParentId(localBoxTree) {
  const p = localBoxTree?.parentBox;
  if (!p) return null;
  return typeof p === 'string'
    ? String(p)
    : p?._id != null
      ? String(p._id)
      : null;
}

export function getVisibleBoxes({
  boxes,
  descendantIds,
  sourceBoxMongoId,
  currentParentId,
  depthById,
}) {
  return (boxes || [])
    .filter(
      (b) =>
        !descendantIds.has(String(b?._id)) &&
        String(b?._id) !== String(sourceBoxMongoId) &&
        (currentParentId == null || String(b?._id) !== String(currentParentId)),
    )
    .sort((a, b) => {
      const da = depthById.get(String(a?._id)) ?? 0;
      const db = depthById.get(String(b?._id)) ?? 0;
      if (da !== db) return da - db;

      const na = Number(a?.box_id);
      const nb = Number(b?.box_id);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;

      return String(a?.box_id ?? '').localeCompare(String(b?.box_id ?? ''));
    });
}
