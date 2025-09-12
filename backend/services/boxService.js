// services/boxService.js
const Box = require('../models/Box');
const Item = require('../models/Item');

const { orphanAllItemsInBox } = require('./itemService');

const { computeStats, flattenBoxes } = require('../utils/boxHelpers');

async function getBoxByMongoId(id) {
  return await Box.findById(id);
}
async function getBoxByShortId(shortId) {
  const raw = String(shortId || '').trim();
  if (!raw) throw new Error('shortId required');

  // Try exact match first (covers zero-padded storage like "005"),
  // then try normalized form (e.g., "5").
  const normalized = raw.replace(/^0+/, '') || '0';

  const box =
    (await Box.findOne({ box_id: raw }).populate('items').lean()) ||
    (await Box.findOne({ box_id: normalized }).populate('items').lean());

  return box; // can be null if not found
}

// ! Main Function
async function getBoxDataStructure(
  shortId,
  {
    includeAncestors = false,
    includeStats = true,
    flat = 'none', // 'none' | 'items' | 'all'
  } = {}
) {
  // 1) Root box (by public short id)
  const root = await Box.findOne({ box_id: shortId })
    .select('_id box_id label name parentBox items')
    .lean();
  if (!root) return null;
  root.label = root.label ?? root.name ?? 'Box';

  // 2) Collect all descendant boxes (BFS)
  const nodesById = new Map([[String(root._id), root]]);
  const childrenByParent = new Map(); // parentId -> [child nodes]
  let frontier = [root._id];

  while (frontier.length) {
    const children = await Box.find({ parentBox: { $in: frontier } })
      .select('_id box_id label name parentBox items')
      .lean();

    for (const c of children) {
      c.label = c.label ?? c.name ?? 'Box';
      nodesById.set(String(c._id), c);
      const pid = String(c.parentBox);
      if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
      childrenByParent.get(pid).push(c);
    }
    frontier = children.map((c) => c._id);
  }

  // 3) Fetch all Items once, index by _id
  const allItemIds = [];
  for (const node of nodesById.values()) {
    if (Array.isArray(node.items)) allItemIds.push(...node.items);
  }

  let itemsById = new Map();
  if (allItemIds.length) {
    const allItems = await Item.find({ _id: { $in: allItemIds } }).lean();
    itemsById = new Map(allItems.map((i) => [String(i._id), i]));
  }

  // 4) Build hydrated nested tree
  function link(node) {
    const id = String(node._id);
    const itemDocs = Array.isArray(node.items)
      ? node.items.map((iid) => itemsById.get(String(iid))).filter(Boolean)
      : [];
    const kids = childrenByParent.get(id) || [];
    return {
      _id: node._id,
      box_id: node.box_id,
      label: node.label,
      parentBox: node.parentBox ? String(node.parentBox) : null,
      items: itemDocs,
      childBoxes: kids.map(link),
    };
  }
  const tree = link(root);

  // 5) Optional: ancestors for breadcrumb (root → … → parent)
  let ancestors;
  if (includeAncestors) {
    ancestors = [];
    let cur = root;
    while (cur.parentBox) {
      const parent = await Box.findById(cur.parentBox)
        .select('_id box_id label name parentBox')
        .lean();
      if (!parent) break;
      ancestors.push({
        _id: parent._id,
        box_id: parent.box_id,
        label: parent.label ?? parent.name ?? 'Box',
      });
      cur = parent;
    }
    ancestors.reverse();
  }

  // 6) Optional: stats (boxes, unique item names, total quantity)
  let stats;
  if (includeStats) {
    stats = computeStats(nodesById, itemsById);
  }

  // 7) Optional: server-side flat list of items (includes parent + parentPath)
  let flatItems;
  if (flat === 'items' || flat === 'all') {
    flatItems = flattenBoxes(tree); // already adds parent + parentPath
  }

  // 8) Response (additive)
  return {
    _id: root._id,
    box_id: root.box_id,
    label: root.label,
    tree,
    ...(includeAncestors ? { ancestors } : {}),
    ...(includeStats ? { stats } : {}),
    ...(flatItems ? { flatItems } : {}),
  };
}

// todo this needs to become the function above ⬆️↙️
async function getBoxTreeByShortId(shortId) {
  // 1) Root
  const root = await Box.findOne({ box_id: shortId }).lean();
  if (!root) return null;

  // 2) Gather ALL descendant boxes in breadth-first batches to avoid N+1
  const byId = new Map([[String(root._id), root]]);
  const childrenByParent = new Map(); // parentId -> Box[]
  let frontier = [root._id];

  while (frontier.length) {
    const children = await Box.find({ parentBox: { $in: frontier } }).lean();

    // index them
    for (const c of children) {
      byId.set(String(c._id), c);
      const pid = String(c.parentBox);
      if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
      childrenByParent.get(pid).push(c);
    }

    // next layer
    frontier = children.map((c) => c._id);
  }

  // 3) Fetch ALL items for ALL boxes once, then map back in
  const allItemIdCandidates = [];
  for (const b of byId.values()) {
    if (Array.isArray(b.items)) {
      // Only collect ObjectIds; we’ll rehydrate these into full docs
      for (const id of b.items) {
        if (id && typeof id === 'object') allItemIdCandidates.push(id);
      }
    }
  }

  let itemsById = new Map();
  if (allItemIdCandidates.length) {
    const allItems = await Item.find({
      _id: { $in: allItemIdCandidates },
    }).lean();
    itemsById = new Map(allItems.map((i) => [String(i._id), i]));
  }

  // 4) Build the nested tree (non-mutating copies if you prefer)
  function link(node) {
    // Attach full item docs
    const itemDocs = Array.isArray(node.items)
      ? node.items
          .map((i) => itemsById.get(String(i)) || i) // if already full doc, keep it
          .filter(Boolean)
      : [];

    // Attach children
    const kids = childrenByParent.get(String(node._id)) || [];
    const childBoxes = kids.map(link);

    // Return with conventional fields
    return {
      ...node,
      items: itemDocs,
      childBoxes,
    };
  }

  const tree = link(root);

  // (Optional small cleanup) strip __v if you don’t want it in the response
  // const stripMeta = (n) => ({
  //   ...Object.fromEntries(Object.entries(n).filter(([k]) => k !== '__v')),
  //   items: n.items.map(i => Object.fromEntries(Object.entries(i).filter(([k]) => k !== '__v'))),
  //   childBoxes: n.childBoxes.map(stripMeta),
  // });
  // return stripMeta(tree);

  return tree;
}

async function getAllBoxes() {
  return Box.find()
    .populate({
      path: 'parentBox',
      select: '_id box_id description', // 👈 Only these fields
    })
    .populate('items') // Leave items fully populated (or adjust as needed)
    .lean();
}

async function getBoxesExcludingId(id) {
  return await Box.find({ _id: { $ne: id } }).sort({ label: 1 });
}

/**
 * Recursive function that populates all children and items of a given box.
 */

async function populateChildren(box) {
  // Find all child boxes where this box is the parent
  const children = await Box.find({ parentBox: box._id }).lean();

  // For each child box, recursively fetch its own children
  for (let child of children) {
    // Populate items inside the child box
    child.items = await Item.find({ _id: { $in: child.items } }).lean();

    child.childBoxes = await populateChildren(child);
  }

  return children;
}

/**
 * Get all top-level boxes and build their full tree recursively.
 */

async function getBoxTree() {
  const topLevelBoxes = await Box.find({ parentBox: null }).lean();

  for (let box of topLevelBoxes) {
    box.items = await Item.find({ _id: { $in: box.items } }).lean();
    box.childBoxes = await populateChildren(box);
  }

  return topLevelBoxes;
}

async function getBoxesByParent(parentId) {
  const filter =
    parentId === 'null' ? { parentBox: null } : { parentBox: parentId };
  console.log(filter);
  return Box.find(filter).populate('parentBox');
}

async function createBox(data) {
  return Box.create(data);
}

async function updateBox(id, data) {
  return Box.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

// Delete a single box by its Mongo _id.
// Orphans items first, then removes the box.
async function deleteBoxById(id, { orphanItems = true } = {}) {
  // Ensure the box exists
  const box = await Box.findById(id);
  if (!box) {
    const err = new Error('Box not found');
    err.status = 404;
    throw err;
  }

  // Detach (or delete) items that belonged to this box
  if (orphanItems) {
    await orphanAllItemsInBox(Item, box._id);
  } else {
    await Item.deleteMany({ boxId: box._id });
  }

  // Delete the box itself
  await Box.deleteOne({ _id: box._id });

  return { ok: true, deleted: 1, boxId: String(box._id) };
}

// Your earlier bulk helper (unchanged pattern)
async function deleteAllBoxes({ Box, Item }) {
  const allBoxes = await Box.find({});
  const boxIds = allBoxes.map((b) => b._id);

  await Promise.all(boxIds.map((id) => orphanAllItemsInBox(Item, id)));
  await Box.deleteMany({});

  return boxIds.length;
}

module.exports = {
  getBoxDataStructure,
  getBoxByMongoId,
  getBoxByShortId,
  getBoxesByParent,
  createBox,
  updateBox,
  getBoxTreeByShortId,
  getBoxTree,
  getAllBoxes,
  getBoxesExcludingId,
  deleteBoxById,
  deleteAllBoxes,
};
