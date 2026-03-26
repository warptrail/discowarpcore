// services/boxService.js
const Box = require('../models/Box');
const Item = require('../models/Item');
const Location = require('../models/Location');

const { orphanAllItemsInBox } = require('./itemService');
const { resolveBoxLocationFields } = require('./locationService');
const { withNormalizedItemCategory } = require('../utils/itemCategory');

const { computeStats, flattenBoxes } = require('../utils/boxHelpers');
const { wouldCreateCycle } = require('../utils/wouldCreateCycle');
const {
  buildEmptyImageMetadata,
  collectImageStoragePaths,
} = require('./imageMetadataService');
const { safeDeleteMediaFiles } = require('../utils/mediaCleanup');
const {
  FLOOR_LABEL,
  computeChangedFields,
  formatBoxLabel,
  hasMeaningfulValueChange,
  logEventBestEffort,
  quoteLabel,
  toIdString,
} = require('./eventLogService');

const ACTIVE_ITEM_FILTER = { item_status: { $ne: 'gone' } };
const DEFAULT_BOX_TREE_LIMIT = 50;
const MAX_BOX_TREE_LIMIT = 50;
const INVALID_BOX_GROUP_CODE = 'INVALID_BOX_GROUP';
const BOX_SORT_KEYS = new Set(['boxId', 'name', 'location', 'itemCount', 'group']);

function makeHttpError(status, code, message, extra = {}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  Object.assign(err, extra);
  return err;
}

function toTrimmedOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeOptionalBoxGroupInput(rawValue) {
  if (rawValue === undefined) {
    return { provided: false, value: undefined, clear: false };
  }

  if (rawValue === null) {
    return { provided: true, value: undefined, clear: true };
  }

  if (typeof rawValue !== 'string') {
    throw makeHttpError(
      400,
      INVALID_BOX_GROUP_CODE,
      'group must be a string when provided'
    );
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { provided: true, value: undefined, clear: true };
  }

  return { provided: true, value: trimmed, clear: false };
}

function toPlain(source) {
  if (!source) return null;
  if (typeof source.toObject === 'function') {
    return source.toObject({ virtuals: false });
  }
  return source;
}

function toBoxRef(box, fallback = FLOOR_LABEL) {
  if (!box) {
    return { id: null, label: fallback, box_id: null };
  }
  return {
    id: toIdString(box._id || box.id),
    label: formatBoxLabel(box, fallback),
    box_id: box.box_id || null,
  };
}

function collectLocationIds(nodes = []) {
  const ids = new Set();
  for (const node of nodes) {
    if (node?.locationId) ids.add(String(node.locationId));
  }
  return Array.from(ids);
}

async function buildLocationNameMap(nodes = []) {
  const ids = collectLocationIds(nodes);
  if (!ids.length) return new Map();
  const locations = await Location.find({ _id: { $in: ids } })
    .select('_id name')
    .lean();
  return new Map(locations.map((loc) => [String(loc._id), loc.name]));
}

function withLocation(box, locationNameMap) {
  const id = box?.locationId ? String(box.locationId) : null;
  const resolvedName = id ? locationNameMap.get(id) : null;
  return {
    ...box,
    locationId: id,
    location: resolvedName ?? box?.location ?? '',
  };
}

function toBoundedPositiveInteger(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  if (normalized < min) return min;
  if (normalized > max) return max;
  return normalized;
}

function toSearchToken(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSearchQuery(value) {
  return toSearchToken(value).replace(/\s+/g, ' ');
}

function normalizeGroupFilter(value) {
  return toSearchToken(value);
}

function normalizeBoxSortBy(value, { fallback = 'boxId', allowEmpty = false } = {}) {
  const normalized = String(value || '').trim();
  if (!normalized) return allowEmpty ? '' : fallback;
  if (BOX_SORT_KEYS.has(normalized)) return normalized;
  return allowEmpty ? '' : fallback;
}

function compareText(left, right) {
  return String(left || '').localeCompare(String(right || ''), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

function sumItemQty(items) {
  return (items || []).reduce((sum, item) => {
    const quantity = Number(item?.quantity);
    if (Number.isFinite(quantity)) return sum + quantity;
    return sum + 1;
  }, 0);
}

function getNodeItemCount(node) {
  return sumItemQty(node?.items);
}

function compareBoxIds(left, right) {
  const leftNum = Number(left?.box_id);
  const rightNum = Number(right?.box_id);
  const leftValid = Number.isFinite(leftNum);
  const rightValid = Number.isFinite(rightNum);
  if (leftValid && rightValid && leftNum !== rightNum) {
    return leftNum - rightNum;
  }
  return compareText(String(left?.box_id || ''), String(right?.box_id || ''));
}

function compareBoxes(left, right, sortBy = 'boxId') {
  const normalizedSortBy = normalizeBoxSortBy(sortBy);
  const leftName = normalizeSearchQuery(left?.label || left?.name || '');
  const rightName = normalizeSearchQuery(right?.label || right?.name || '');

  if (normalizedSortBy === 'location') {
    const diff = compareText(
      normalizeSearchQuery(left?.location || ''),
      normalizeSearchQuery(right?.location || '')
    );
    if (diff !== 0) return diff;
    const nameDiff = compareText(leftName, rightName);
    if (nameDiff !== 0) return nameDiff;
    return compareBoxIds(left, right);
  }

  if (normalizedSortBy === 'group') {
    const leftGroup = normalizeGroupFilter(left?.group);
    const rightGroup = normalizeGroupFilter(right?.group);
    const leftEmpty = !leftGroup;
    const rightEmpty = !rightGroup;
    if (leftEmpty !== rightEmpty) return leftEmpty ? 1 : -1;

    const diff = compareText(leftGroup, rightGroup);
    if (diff !== 0) return diff;
    const nameDiff = compareText(leftName, rightName);
    if (nameDiff !== 0) return nameDiff;
    return compareBoxIds(left, right);
  }

  if (normalizedSortBy === 'itemCount') {
    const diff = getNodeItemCount(right) - getNodeItemCount(left);
    if (diff !== 0) return diff;
    const nameDiff = compareText(leftName, rightName);
    if (nameDiff !== 0) return nameDiff;
    return compareBoxIds(left, right);
  }

  if (normalizedSortBy === 'name') {
    const diff = compareText(leftName, rightName);
    if (diff !== 0) return diff;
    return compareBoxIds(left, right);
  }

  const diff = compareBoxIds(left, right);
  if (diff !== 0) return diff;
  return compareText(leftName, rightName);
}

function sortBoxTree(nodes = [], sortBy = 'boxId') {
  const normalizedSortBy = normalizeBoxSortBy(sortBy);

  return [...nodes]
    .map((node) => ({
      ...node,
      childBoxes: sortBoxTree(
        Array.isArray(node?.childBoxes) ? node.childBoxes : [],
        normalizedSortBy
      ),
    }))
    .sort((left, right) => compareBoxes(left, right, normalizedSortBy));
}

function buildBoxSearchText(node) {
  const tags = Array.isArray(node?.tags) ? node.tags.join(' ') : '';
  return normalizeSearchQuery(
    [
      node?.box_id,
      node?.label,
      node?.name,
      node?.group,
      node?.location,
      node?.description,
      node?.notes,
      tags,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function boxMatchesFilters(node, { normalizedQuery = '', normalizedGroup = '' } = {}) {
  if (normalizedGroup) {
    const boxGroup = normalizeGroupFilter(node?.group);
    if (!boxGroup || boxGroup !== normalizedGroup) {
      return false;
    }
  }

  if (normalizedQuery) {
    const searchText = buildBoxSearchText(node);
    if (!searchText.includes(normalizedQuery)) {
      return false;
    }
  }

  return true;
}

function filterBoxTreeNode(node, { normalizedQuery = '', normalizedGroup = '' } = {}) {
  if (!node || typeof node !== 'object') return null;

  const children = Array.isArray(node.childBoxes)
    ? node.childBoxes
        .map((child) => filterBoxTreeNode(child, { normalizedQuery, normalizedGroup }))
        .filter(Boolean)
    : [];

  const selfMatches = boxMatchesFilters(node, { normalizedQuery, normalizedGroup });
  if (!selfMatches && !children.length) return null;

  return {
    ...node,
    childBoxes: children,
  };
}

function sortDistinctLabels(values = []) {
  return [...values].sort((left, right) =>
    String(left || '').localeCompare(String(right || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    })
  );
}

async function getDistinctBoxGroups() {
  const raw = await Box.distinct('group', {
    group: { $exists: true, $nin: [null, ''] },
  });

  const byKey = new Map();
  for (const entry of raw || []) {
    const label = String(entry || '').trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, label);
    }
  }

  return sortDistinctLabels([...byKey.values()]);
}

async function getBoxByMongoId(id) {
  const box = await Box.findById(id).populate('locationId', 'name').lean();
  if (!box) return null;
  return {
    ...box,
    locationId: box.locationId?._id ? String(box.locationId._id) : null,
    location: box.locationId?.name ?? box.location ?? '',
  };
}
async function getBoxByShortId(shortId) {
  const raw = String(shortId || '').trim();
  if (!raw) throw new Error('shortId required');

  // Try exact match first (covers zero-padded storage like "005"),
  // then try normalized form (e.g., "5").
  const normalized = raw.replace(/^0+/, '') || '0';

  const box =
    (await Box.findOne({ box_id: raw })
      .populate({ path: 'items', match: ACTIVE_ITEM_FILTER })
      .populate('locationId', 'name')
      .lean()) ||
    (await Box.findOne({ box_id: normalized })
      .populate({ path: 'items', match: ACTIVE_ITEM_FILTER })
      .populate('locationId', 'name')
      .lean());

  if (!box) return null;
  return {
    ...box,
    items: Array.isArray(box.items)
      ? box.items.map((item) => withNormalizedItemCategory(item))
      : [],
    locationId: box.locationId?._id ? String(box.locationId._id) : null,
    location: box.locationId?.name ?? box.location ?? '',
  };
}

async function resolveBoxByShortId(shortId) {
  const raw = String(shortId || '').trim();
  if (!raw) throw new Error('shortId required');

  const normalized = raw.replace(/^0+/, '') || '0';
  const box =
    (await Box.findOne({ box_id: raw })
      .select('_id box_id label name group location locationId imagePath image')
      .populate('locationId', 'name')
      .lean()) ||
    (await Box.findOne({ box_id: normalized })
      .select('_id box_id label name group location locationId imagePath image')
      .populate('locationId', 'name')
      .lean());

  if (!box) return null;

  return {
    _id: String(box._id),
    box_id: box.box_id,
    label: box.label ?? box.name ?? 'Box',
    group: box.group ?? null,
    locationId: box.locationId?._id ? String(box.locationId._id) : null,
    location: box.locationId?.name ?? box.location ?? '',
    imagePath: box.imagePath ?? '',
    image: box.image ?? null,
  };
}

// ! Main Function
async function getBoxDataStructure(
  shortId,
  {
    includeAncestors = false,
    includeStats = true,
    flat = 'none', // 'none' | 'items' | 'all'
  } = {},
) {
  // 1) Root box (by public short id)
  const root = await Box.findOne({ box_id: shortId })
    .select(
      '_id box_id label name group tags parentBox items location locationId imagePath image'
    )
    .lean();
  if (!root) return null;
  root.label = root.label ?? root.name ?? 'Box';

  // 2) Collect all descendant boxes (BFS)
  const nodesById = new Map([[String(root._id), root]]);
  const childrenByParent = new Map(); // parentId -> [child nodes]
  let frontier = [root._id];

  while (frontier.length) {
    const children = await Box.find({ parentBox: { $in: frontier } })
      .select(
        '_id box_id label name group tags parentBox items location locationId imagePath image'
      )
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

  const locationNameMap = await buildLocationNameMap(Array.from(nodesById.values()));

  // 3) Fetch all Items once, index by _id
  const allItemIds = [];
  for (const node of nodesById.values()) {
    if (Array.isArray(node.items)) allItemIds.push(...node.items);
  }

  let itemsById = new Map();
  if (allItemIds.length) {
    const allItems = await Item.find({
      ...ACTIVE_ITEM_FILTER,
      _id: { $in: allItemIds },
    }).lean();
    allItems.forEach((item) => withNormalizedItemCategory(item));
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
      group: node.group ?? null,
      tags: Array.isArray(node.tags)
        ? node.tags
            .map((tag) => String(tag || '').trim())
            .filter(Boolean)
        : [],
      imagePath: node.imagePath ?? '',
      image: node.image ?? null,
      parentBox: node.parentBox ? String(node.parentBox) : null,
      locationId: node.locationId ? String(node.locationId) : null,
      location: node.locationId
        ? locationNameMap.get(String(node.locationId)) ?? node.location ?? ''
        : node.location ?? '',
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
    group: root.group ?? null,
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

  const locationNameMap = await buildLocationNameMap(Array.from(byId.values()));

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
      ...ACTIVE_ITEM_FILTER,
      _id: { $in: allItemIdCandidates },
    }).lean();
    allItems.forEach((item) => withNormalizedItemCategory(item));
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
      locationId: node.locationId ? String(node.locationId) : null,
      location: node.locationId
        ? locationNameMap.get(String(node.locationId)) ?? node.location ?? ''
        : node.location ?? '',
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

async function getAllBoxes({ q = '', group = '', sortBy = '' } = {}) {
  const normalizedQuery = normalizeSearchQuery(q);
  const normalizedGroup = normalizeGroupFilter(group);
  const normalizedSortBy = normalizeBoxSortBy(sortBy, { allowEmpty: true });
  const boxes = await Box.find()
    .populate({
      path: 'parentBox',
      select: '_id box_id description', // 👈 Only these fields
    })
    .populate('locationId', 'name')
    .populate({ path: 'items', match: ACTIVE_ITEM_FILTER })
    .lean();
  const filtered = boxes
    .map((box) => ({
      ...box,
      items: Array.isArray(box.items)
        ? box.items.map((item) => withNormalizedItemCategory(item))
        : [],
      locationId: box.locationId?._id ? String(box.locationId._id) : null,
      location: box.locationId?.name ?? box.location ?? '',
    }))
    .filter((box) => boxMatchesFilters(box, { normalizedQuery, normalizedGroup }));

  if (!normalizedSortBy) return filtered;
  return [...filtered].sort((left, right) =>
    compareBoxes(left, right, normalizedSortBy)
  );
}

async function getBoxesExcludingId(id) {
  return await Box.find({ _id: { $ne: id } }).sort({ label: 1 });
}

/**
 * Recursive function that populates all children and items of a given box.
 */

async function populateChildren(box) {
  // Find all child boxes where this box is the parent
  const children = await Box.find({ parentBox: box._id })
    .sort({ box_id: 1, _id: 1 })
    .lean();
  const locationNameMap = await buildLocationNameMap(children);

  // For each child box, recursively fetch its own children
  for (let i = 0; i < children.length; i += 1) {
    let child = children[i];
    // Populate items inside the child box
    child = withLocation(child, locationNameMap);
    child.items = await Item.find({
      ...ACTIVE_ITEM_FILTER,
      _id: { $in: child.items },
    }).lean();
    child.items = child.items.map((item) => withNormalizedItemCategory(item));

    child.childBoxes = await populateChildren(child);
    children[i] = child;
  }

  return children;
}

/**
 * Get all top-level boxes and build their full tree recursively.
 */

async function getBoxTree({
  page = 1,
  limit = DEFAULT_BOX_TREE_LIMIT,
  q = '',
  group = '',
  sortBy = 'boxId',
} = {}) {
  const safeRequestedPage = toBoundedPositiveInteger(page, 1, { min: 1 });
  const safeLimit = toBoundedPositiveInteger(limit, DEFAULT_BOX_TREE_LIMIT, {
    min: 1,
    max: MAX_BOX_TREE_LIMIT,
  });
  const normalizedQuery = normalizeSearchQuery(q);
  const normalizedGroup = normalizeGroupFilter(group);
  const normalizedSortBy = normalizeBoxSortBy(sortBy);
  const hasFilters = Boolean(normalizedQuery || normalizedGroup);
  const needsInMemorySort = normalizedSortBy !== 'boxId';
  const needsInMemoryPaging = hasFilters || needsInMemorySort;

  const topLevelQuery = { parentBox: null };
  let total = 0;
  let totalPages = 1;
  let safePage = safeRequestedPage;
  let topLevelBoxes = [];

  if (needsInMemoryPaging) {
    topLevelBoxes = await Box.find(topLevelQuery)
      .sort({ box_id: 1, _id: 1 })
      .lean();
  } else {
    total = await Box.countDocuments(topLevelQuery);
    totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;
    safePage = Math.min(safeRequestedPage, totalPages);
    const skip = (safePage - 1) * safeLimit;

    topLevelBoxes = await Box.find(topLevelQuery)
      .sort({ box_id: 1, _id: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();
  }
  const locationNameMap = await buildLocationNameMap(topLevelBoxes);

  for (let i = 0; i < topLevelBoxes.length; i += 1) {
    let box = topLevelBoxes[i];
    box = withLocation(box, locationNameMap);
    box.items = await Item.find({
      ...ACTIVE_ITEM_FILTER,
      _id: { $in: box.items },
    }).lean();
    box.items = box.items.map((item) => withNormalizedItemCategory(item));
    box.childBoxes = await populateChildren(box);
    topLevelBoxes[i] = box;
  }

  let items = topLevelBoxes;
  if (hasFilters) {
    items = topLevelBoxes
      .map((node) => filterBoxTreeNode(node, { normalizedQuery, normalizedGroup }))
      .filter(Boolean);
  }

  if (needsInMemorySort) {
    items = sortBoxTree(items, normalizedSortBy);
  }

  if (needsInMemoryPaging) {
    total = items.length;
    totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;
    safePage = Math.min(safeRequestedPage, totalPages);
    const start = (safePage - 1) * safeLimit;
    items = items.slice(start, start + safeLimit);
  }

  const groups = await getDistinctBoxGroups();

  return {
    items,
    tree: items,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    filters: {
      groups,
    },
  };
}

async function getBoxesByParent(parentId) {
  const filter =
    parentId === 'null' ? { parentBox: null } : { parentBox: parentId };
  console.log(filter);
  const boxes = await Box.find(filter)
    .populate('parentBox')
    .populate('locationId', 'name')
    .lean();
  return boxes.map((box) => ({
    ...box,
    locationId: box.locationId?._id ? String(box.locationId._id) : null,
    location: box.locationId?.name ?? box.location ?? '',
  }));
}

async function createBox(data) {
  const payload = { ...data };
  const groupInput = normalizeOptionalBoxGroupInput(
    data && Object.prototype.hasOwnProperty.call(data, 'group')
      ? data.group
      : undefined
  );
  if (groupInput.provided) {
    if (groupInput.clear) {
      delete payload.group;
    } else {
      payload.group = groupInput.value;
    }
  }
  const resolvedLocation = await resolveBoxLocationFields({
    locationId:
      data && Object.prototype.hasOwnProperty.call(data, 'locationId')
        ? data.locationId
        : undefined,
    location:
      data && Object.prototype.hasOwnProperty.call(data, 'location')
        ? data.location
        : undefined,
  });
  if (resolvedLocation) {
    payload.locationId = resolvedLocation.locationId;
    payload.location = resolvedLocation.location;
  }
  const created = await Box.create(payload);
  const createdPlain = toPlain(created);
  const createdRef = toBoxRef(createdPlain, 'Box');

  let parentRef = { id: null, label: FLOOR_LABEL, box_id: null };
  if (createdPlain?.parentBox) {
    const parent = await Box.findById(createdPlain.parentBox)
      .select('_id box_id label')
      .lean();
    parentRef = toBoxRef(parent || { _id: createdPlain.parentBox }, 'Box');
  }

  await logEventBestEffort(
    {
      event_type: 'box_created',
      entity_type: 'box',
      entity_id: createdRef.id,
      entity_label: createdRef.label,
      summary: `Created box ${quoteLabel(createdRef.label)}`,
      details: {
        box_id: createdRef.box_id,
        group: toTrimmedOrNull(createdPlain?.group),
        parent_box_id: parentRef.id,
        parent_box_label: parentRef.label,
      },
    },
    { label: `box_created:${createdRef.id}` }
  );

  return created;
}

async function updateBox(id, data) {
  const patch = { ...data };
  const patchFields = new Set(Object.keys(patch));
  const groupInput = normalizeOptionalBoxGroupInput(
    data && Object.prototype.hasOwnProperty.call(data, 'group')
      ? data.group
      : undefined
  );
  let unsetGroup = false;
  if (groupInput.provided) {
    patchFields.add('group');
    if (groupInput.clear) {
      unsetGroup = true;
      delete patch.group;
    } else {
      patch.group = groupInput.value;
    }
  }
  const existing = await Box.findById(id).lean();

  const resolvedLocation = await resolveBoxLocationFields({
    locationId:
      data && Object.prototype.hasOwnProperty.call(data, 'locationId')
        ? data.locationId
        : undefined,
    location:
      data &&
      !Object.prototype.hasOwnProperty.call(data, 'locationId') &&
      Object.prototype.hasOwnProperty.call(data, 'location')
        ? data.location
        : undefined,
  });
  if (resolvedLocation) {
    patch.locationId = resolvedLocation.locationId;
    patch.location = resolvedLocation.location;
  }

  // Only guard when a parent change is being requested.
  // IMPORTANT: allow explicit null to unparent.
  //
  // The `in` operator checks for *property presence*, not truthiness.
  // This allows `{ parentBox: null }` to be treated as intentional.
  if ('parentBox' in patch) {
    const destId = patch.parentBox; // may be null

    // Load the existing box so we can compare current state
    if (!existing) {
      const err = new Error('Box not found');
      err.status = 404;
      err.code = 'BOX_NOT_FOUND';
      throw err;
    }

    // Guard 1: prevent no-op moves
    // If the box is already nested in the requested parent,
    // this update would do nothing.
    if (String(existing.parentBox ?? null) === String(destId ?? null)) {
      const err = new Error(
        'Box is already nested in the specified parent (no-op move).',
      );
      err.status = 400;
      err.code = 'NO_OP_MOVE';
      throw err;
    }

    // Guard 2: prevent cycles (DAG invariant)
    const cycle = await wouldCreateCycle(id, destId);
    if (cycle) {
      const err = new Error(
        destId
          ? 'Illegal nesting: destination is inside the source subtree (cycle prevented).'
          : 'Illegal nesting: cannot set parentBox to itself.',
      );
      err.status = 409;
      err.code = 'CYCLE_DETECTED';
      throw err;
    }
  }

  if (!existing) {
    return null;
  }

  // Perform the update
  const setDoc = { ...patch };
  const updateDoc = unsetGroup
    ? {
        ...(Object.keys(setDoc).length ? { $set: setDoc } : {}),
        $unset: { group: 1 },
      }
    : setDoc;

  const updated = await Box.findByIdAndUpdate(id, updateDoc, {
    new: true,
    runValidators: true,
  });
  if (!updated) return null;

  const updatedPlain = toPlain(updated);
  const boxRef = toBoxRef(updatedPlain, 'Box');

  const parentChanged = hasMeaningfulValueChange(
    existing.parentBox ?? null,
    updatedPlain.parentBox ?? null
  );
  if (parentChanged) {
    const fromParentId = toIdString(existing.parentBox);
    const toParentId = toIdString(updatedPlain.parentBox);
    const parentIds = [fromParentId, toParentId].filter(Boolean);

    const parentMap = new Map();
    if (parentIds.length) {
      const parentDocs = await Box.find({ _id: { $in: parentIds } })
        .select('_id box_id label')
        .lean();
      parentDocs.forEach((entry) => parentMap.set(String(entry._id), entry));
    }

    const fromParentRef = fromParentId
      ? toBoxRef(parentMap.get(fromParentId) || { _id: fromParentId }, 'Box')
      : { id: null, label: FLOOR_LABEL, box_id: null };
    const toParentRef = toParentId
      ? toBoxRef(parentMap.get(toParentId) || { _id: toParentId }, 'Box')
      : { id: null, label: FLOOR_LABEL, box_id: null };

    let parentEventType = 'box_moved';
    let parentSummary = `Moved box ${quoteLabel(boxRef.label)} from ${quoteLabel(
      fromParentRef.label
    )} to ${quoteLabel(toParentRef.label)}`;

    if (!fromParentId && toParentId) {
      parentEventType = 'box_nested';
      parentSummary = `Nested box ${quoteLabel(boxRef.label)} into ${quoteLabel(
        toParentRef.label
      )}`;
    } else if (fromParentId && !toParentId) {
      parentEventType = 'box_unnested';
      parentSummary = `Unnested box ${quoteLabel(boxRef.label)} to ${toParentRef.label}`;
    }

    await logEventBestEffort(
      {
        event_type: parentEventType,
        entity_type: 'box',
        entity_id: boxRef.id,
        entity_label: boxRef.label,
        summary: parentSummary,
        details: {
          from_box_id: fromParentRef.id,
          from_box_label: fromParentRef.label,
          to_box_id: toParentRef.id,
          to_box_label: toParentRef.label,
        },
      },
      { label: `${parentEventType}:${boxRef.id}` }
    );
  }

  const nonParentCandidates = Array.from(patchFields).filter(
    (field) => field !== 'parentBox'
  );
  const changedNonParentFields = computeChangedFields(
    existing,
    updatedPlain,
    nonParentCandidates
  );
  if (changedNonParentFields.length) {
    const groupChanged = changedNonParentFields.includes('group');
    await logEventBestEffort(
      {
        event_type: 'box_updated',
        entity_type: 'box',
        entity_id: boxRef.id,
        entity_label: boxRef.label,
        summary: `Updated box ${quoteLabel(boxRef.label)} fields: ${changedNonParentFields.join(
          ', '
        )}`,
        details: {
          changed_fields: changedNonParentFields,
          ...(groupChanged
            ? {
                previous_group: toTrimmedOrNull(existing?.group),
                group: toTrimmedOrNull(updatedPlain?.group),
              }
            : {}),
        },
      },
      { label: `box_updated:${boxRef.id}` }
    );
  }

  return updated;
}

async function setBoxImage(id, image) {
  const current = await Box.findById(id)
    .select('_id box_id label image imagePath')
    .lean();
  if (!current) return null;

  const previousPaths = collectImageStoragePaths(current);
  const nextPaths = new Set(collectImageStoragePaths({ image, imagePath: '' }));

  const updated = await Box.findByIdAndUpdate(
    id,
    {
      image,
      imagePath: image?.display?.url || image?.original?.url || '',
    },
    { new: true, runValidators: true }
  );

  if (!updated) return null;

  const updatedPlain = toPlain(updated);
  const stalePaths = previousPaths.filter((entry) => !nextPaths.has(entry));

  await safeDeleteMediaFiles(stalePaths, {
    label: `box-image-replace:${id}`,
  });

  const changedFields = computeChangedFields(current, updatedPlain, [
    'image',
    'imagePath',
  ]);
  if (changedFields.length) {
    const boxRef = toBoxRef(updatedPlain, 'Box');
    await logEventBestEffort(
      {
        event_type: 'box_photo_updated',
        entity_type: 'box',
        entity_id: boxRef.id,
        entity_label: boxRef.label,
        summary: `Updated photo for box ${quoteLabel(boxRef.label)}`,
        details: {
          changed_fields: changedFields,
        },
      },
      { label: `box_photo_updated:${boxRef.id}` }
    );
  }

  return updated;
}

async function clearBoxImage(id) {
  const current = await Box.findById(id)
    .select('_id box_id label image imagePath')
    .lean();
  if (!current) return null;

  const updated = await Box.findByIdAndUpdate(
    id,
    {
      image: buildEmptyImageMetadata(),
      imagePath: '',
    },
    { new: true, runValidators: true }
  );
  if (!updated) return null;

  const updatedPlain = toPlain(updated);
  const changedFields = computeChangedFields(current, updatedPlain, [
    'image',
    'imagePath',
  ]);
  if (changedFields.length) {
    const boxRef = toBoxRef(updatedPlain, 'Box');
    await logEventBestEffort(
      {
        event_type: 'box_photo_updated',
        entity_type: 'box',
        entity_id: boxRef.id,
        entity_label: boxRef.label,
        summary: `Updated photo for box ${quoteLabel(boxRef.label)}`,
        details: {
          changed_fields: changedFields,
        },
      },
      { label: `box_photo_updated:${boxRef.id}` }
    );
  }

  return updated;
}

async function collectDescendantBoxIds(rootBoxId) {
  const descendants = [];
  let frontier = [rootBoxId];

  while (frontier.length) {
    const children = await Box.find({ parentBox: { $in: frontier } })
      .select('_id')
      .lean();

    if (!children.length) break;

    const childIds = children.map((child) => child._id);
    descendants.push(...childIds);
    frontier = childIds;
  }

  return descendants;
}

// Delete a single box by its Mongo _id.
// Orphans direct items, releases all descendants to floor, then removes the box.
async function deleteBoxById(id, { orphanItems = true } = {}) {
  // Ensure the box exists
  const box = await Box.findById(id)
    .select('_id box_id label parentBox items image imagePath')
    .lean();
  if (!box) {
    const err = new Error('Box not found');
    err.status = 404;
    throw err;
  }
  const boxRef = toBoxRef(box, 'Box');

  const ownImagePaths = collectImageStoragePaths(box);

  // Detach (or delete) items that belonged to this box
  if (orphanItems) {
    await orphanAllItemsInBox(box._id);
  } else if (Array.isArray(box.items) && box.items.length) {
    await Item.deleteMany({ _id: { $in: box.items } });
  }

  // Release all descendants to floor level so no box references a deleted parent chain.
  const descendantIds = await collectDescendantBoxIds(box._id);
  let descendants = [];
  if (descendantIds.length) {
    descendants = await Box.find({ _id: { $in: descendantIds } })
      .select('_id box_id label parentBox')
      .lean();

    await Box.updateMany(
      { _id: { $in: descendantIds } },
      { $set: { parentBox: null } },
    );

    const parentMap = new Map([[String(box._id), box]]);
    descendants.forEach((entry) => parentMap.set(String(entry._id), entry));

    for (const child of descendants) {
      const childRef = toBoxRef(child, 'Box');
      const fromParentId = toIdString(child.parentBox);
      const fromParentRef = fromParentId
        ? toBoxRef(parentMap.get(fromParentId) || { _id: fromParentId }, 'Box')
        : { id: null, label: FLOOR_LABEL, box_id: null };

      await logEventBestEffort(
        {
          event_type: 'box_unnested',
          entity_type: 'box',
          entity_id: childRef.id,
          entity_label: childRef.label,
          summary: `Unnested box ${quoteLabel(childRef.label)} to ${FLOOR_LABEL}`,
          details: {
            from_box_id: fromParentRef.id,
            from_box_label: fromParentRef.label,
            to_box_id: null,
            to_box_label: FLOOR_LABEL,
            reason: 'ancestor_box_destroyed',
            destroyed_box_id: boxRef.id,
            destroyed_box_label: boxRef.label,
          },
        },
        { label: `box_unnested:${childRef.id}` }
      );
    }
  }

  // Delete the box itself
  await Box.deleteOne({ _id: box._id });

  await logEventBestEffort(
    {
      event_type: 'box_destroyed',
      entity_type: 'box',
      entity_id: boxRef.id,
      entity_label: boxRef.label,
      summary: `Destroyed box ${quoteLabel(boxRef.label)}`,
      details: {
        orphaned_item_count: Array.isArray(box.items) ? box.items.length : 0,
        released_descendant_count: descendantIds.length,
      },
    },
    { label: `box_destroyed:${boxRef.id}` }
  );

  // Cleanup only the deleted box's own media files.
  await safeDeleteMediaFiles(ownImagePaths, {
    label: `box-delete:${box._id}`,
  });

  return {
    ok: true,
    deleted: 1,
    boxId: String(box._id),
    releasedDescendantCount: descendantIds.length,
    orphanedItemCount: Array.isArray(box.items) ? box.items.length : 0,
  };
}

async function deleteAllBoxes() {
  const allBoxes = await Box.find().select('_id items').lean();
  const boxIds = allBoxes.map((b) => b._id);

  const itemIds = new Set();
  for (const box of allBoxes) {
    for (const itemId of box.items || []) {
      itemIds.add(String(itemId));
    }
  }

  const itemIdList = Array.from(itemIds);
  if (itemIdList.length) {
    await Item.updateMany(
      { ...ACTIVE_ITEM_FILTER, _id: { $in: itemIdList } },
      { $set: { orphanedAt: new Date(), location: '' } }
    );
  }

  await Box.deleteMany({});

  return boxIds.length;
}

async function releaseChildrenToFloor(boxId) {
  // Validate id
  if (!Box.isValidId(boxId)) {
    const err = new Error('Invalid box id');
    err.status = 400;
    err.code = 'INVALID_OBJECT_ID';
    throw err;
  }

  // Ensure parent exists (optional but nice UX)
  const parent = await Box.findById(boxId).select('_id box_id label').lean();
  if (!parent) {
    const err = new Error('Box not found');
    err.status = 404;
    err.code = 'BOX_NOT_FOUND';
    throw err;
  }

  const children = await Box.find({ parentBox: boxId })
    .select('_id box_id label parentBox')
    .lean();

  // Perform the one-level flatten (direct children only)
  const result = await Box.releaseChildrenToFloor(boxId);

  const modifiedCount = result.modifiedCount ?? result.nModified ?? 0;

  if (modifiedCount > 0 && children.length) {
    const parentRef = toBoxRef(parent, 'Box');

    for (const child of children) {
      const childRef = toBoxRef(child, 'Box');
      await logEventBestEffort(
        {
          event_type: 'box_unnested',
          entity_type: 'box',
          entity_id: childRef.id,
          entity_label: childRef.label,
          summary: `Unnested box ${quoteLabel(childRef.label)} to ${FLOOR_LABEL}`,
          details: {
            from_box_id: parentRef.id,
            from_box_label: parentRef.label,
            to_box_id: null,
            to_box_label: FLOOR_LABEL,
            reason: 'release_children_to_floor',
          },
        },
        { label: `box_unnested:${childRef.id}` }
      );
    }
  }

  return { modifiedCount };
}

module.exports = {
  getBoxDataStructure,
  getBoxByMongoId,
  getBoxByShortId,
  resolveBoxByShortId,
  getBoxesByParent,
  createBox,
  updateBox,
  setBoxImage,
  clearBoxImage,
  getBoxTreeByShortId,
  getBoxTree,
  getAllBoxes,
  getBoxesExcludingId,
  deleteBoxById,
  deleteAllBoxes,
  releaseChildrenToFloor,
};
