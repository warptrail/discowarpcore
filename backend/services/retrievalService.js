const Item = require('../models/Item');
const Box = require('../models/Box');
const { normalizeItemCategory } = require('../utils/itemCategory');
const { buildBoxMaps, makeBreadcrumb } = require('../utils/boxHelpers');
const {
  formatKeepPriorityLabel,
  normalizeKeepPriorityValue,
} = require('../utils/keepPriority');

const ACTIVE_ITEM_FILTER = { item_status: { $ne: 'gone' } };

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const UNKNOWN_LOCATION_LABEL = 'Unknown Location';
const UNKNOWN_BOX_NAME = 'Unknown Box';
const ORPHANED_BOX_NAME = 'ORPHANED';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const next = toTrimmed(value);
    if (next) return next;
  }
  return '';
}

function normalizeText(value) {
  return toTrimmed(value)
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeFacetKey(value) {
  return normalizeText(value);
}

function compareLabel(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
  });
}

function compareBoxNumber(a, b) {
  const aNumber = Number(a);
  const bNumber = Number(b);
  const aIsNumeric = Number.isFinite(aNumber);
  const bIsNumeric = Number.isFinite(bNumber);

  if (aIsNumeric && bIsNumeric && aNumber !== bNumber) {
    return aNumber - bNumber;
  }

  return compareLabel(a, b);
}

function toCategoryLabel(categoryKey) {
  return String(categoryKey || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeFilterValues(raw) {
  const seen = new Set();
  const values = [];
  const input = Array.isArray(raw) ? raw : [raw];

  for (const entry of input) {
    if (entry == null) continue;
    const parts = String(entry)
      .split(',')
      .map((part) => normalizeFacetKey(part))
      .filter(Boolean);

    for (const part of parts) {
      if (seen.has(part)) continue;
      seen.add(part);
      values.push(part);
    }
  }

  return values;
}

function parseLimit(rawLimit) {
  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function parseOffset(rawOffset) {
  const parsed = Number.parseInt(rawOffset, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function uniqueTrimmedValues(values) {
  const seen = new Set();
  const next = [];

  for (const rawValue of Array.isArray(values) ? values : []) {
    const value = toTrimmed(rawValue);
    if (!value) continue;

    const key = normalizeFacetKey(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(value);
  }

  return next;
}

function buildLocationPath(locationLabel, boxPath) {
  const normalizedLocation = normalizeText(locationLabel);
  const normalizedPath = normalizeText(boxPath);

  if (locationLabel && boxPath) {
    if (
      normalizedPath &&
      normalizedLocation &&
      normalizedPath.startsWith(normalizedLocation)
    ) {
      return boxPath;
    }
    return `${locationLabel} > ${boxPath}`;
  }

  return locationLabel || boxPath || '';
}

function buildSearchText(parts) {
  return normalizeText(parts.filter(Boolean).join(' '));
}

function getItemImageUrl(item) {
  return firstNonEmpty(
    item?.image?.thumb?.url,
    item?.image?.display?.url,
    item?.image?.original?.url,
    item?.image?.url,
    item?.imagePath
  );
}

function getItemPreviewImageUrl(item) {
  return firstNonEmpty(
    item?.image?.display?.url,
    item?.image?.original?.url,
    item?.image?.thumb?.url,
    item?.image?.url,
    item?.imagePath
  );
}

function getBoxContext(item, maps, itemToLeafBoxId) {
  const itemId = String(item?._id || '');
  const leafId = itemToLeafBoxId.get(itemId);
  const leafBox = leafId ? maps.byId.get(leafId) : null;
  const isOrphaned = Boolean(item?.orphanedAt);

  const breadcrumbData = leafId ? makeBreadcrumb(leafId, maps) : null;
  const breadcrumb = Array.isArray(breadcrumbData?.breadcrumb)
    ? breadcrumbData.breadcrumb
    : [];
  const boxPath = breadcrumb
    .map((node) => firstNonEmpty(node?.label, node?.box_id))
    .filter(Boolean)
    .join(' > ');

  const boxNumber = firstNonEmpty(leafBox?.box_id);
  const boxName = firstNonEmpty(
    leafBox?.label,
    boxNumber ? `Box ${boxNumber}` : '',
    isOrphaned ? ORPHANED_BOX_NAME : '',
    UNKNOWN_BOX_NAME
  );
  const leafGroup = firstNonEmpty(leafBox?.group);
  let resolvedGroup = '';
  let groupCursor = firstNonEmpty(leafId);
  while (groupCursor) {
    const node = maps.byId.get(groupCursor);
    if (!node) break;
    const groupValue = firstNonEmpty(node?.group);
    if (groupValue) {
      resolvedGroup = groupValue;
      break;
    }
    groupCursor = firstNonEmpty(maps.parentOf.get(groupCursor));
  }
  const groupLabel = firstNonEmpty(leafGroup, resolvedGroup);
  const locationLabel = firstNonEmpty(
    leafBox?.location,
    item?.location,
    UNKNOWN_LOCATION_LABEL
  );
  const locationPath = firstNonEmpty(
    buildLocationPath(locationLabel, boxPath),
    locationLabel,
    boxPath,
    UNKNOWN_LOCATION_LABEL
  );

  const boxId = firstNonEmpty(leafBox?._id);
  const boxKey = boxId ? `mongo:${boxId}` : boxNumber ? `short:${boxNumber}` : '';

  return {
    boxId,
    boxNumber,
    boxName,
    boxPath,
    boxKey,
    groupLabel,
    locationLabel,
    locationPath,
    locationKey: normalizeFacetKey(locationLabel || UNKNOWN_LOCATION_LABEL),
  };
}

function mapToSortedOptions(optionMap) {
  return Array.from(optionMap.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => compareLabel(a.label, b.label));
}

function collectFilterOptions(items) {
  const categoryLabelByKey = new Map();
  const tagLabelByKey = new Map();
  const locationLabelByKey = new Map();
  const ownerLabelByKey = new Map();
  const keepPriorityLabelByKey = new Map();

  for (const item of items) {
    if (item.categoryKey) {
      categoryLabelByKey.set(item.categoryKey, item.categoryLabel);
    }

    if (item.locationKey) {
      locationLabelByKey.set(
        item.locationKey,
        firstNonEmpty(item.locationLabel, UNKNOWN_LOCATION_LABEL)
      );
    }

    if (item.ownerKey) {
      ownerLabelByKey.set(item.ownerKey, item.primaryOwnerName);
    }

    if (item.keepPriorityKey) {
      keepPriorityLabelByKey.set(item.keepPriorityKey, item.keepPriorityLabel);
    }

    const tags = Array.isArray(item.tags) ? item.tags : [];
    for (const tag of tags) {
      const key = normalizeFacetKey(tag);
      if (!key || tagLabelByKey.has(key)) continue;
      tagLabelByKey.set(key, tag);
    }
  }

  return {
    categories: mapToSortedOptions(categoryLabelByKey),
    tags: mapToSortedOptions(tagLabelByKey),
    locations: mapToSortedOptions(locationLabelByKey),
    owners: mapToSortedOptions(ownerLabelByKey),
    keepPriorities: mapToSortedOptions(keepPriorityLabelByKey),
  };
}

function buildRetrievalItems(itemDocs, boxDocs) {
  const maps = buildBoxMaps(boxDocs);
  const itemToLeafBoxId = new Map();

  for (const box of boxDocs) {
    const boxId = firstNonEmpty(box?._id);
    if (!boxId) continue;
    for (const itemId of Array.isArray(box?.items) ? box.items : []) {
      const nextItemId = firstNonEmpty(itemId);
      if (!nextItemId) continue;
      itemToLeafBoxId.set(nextItemId, boxId);
    }
  }

  const retrievalItems = [];
  const itemNameById = new Map();

  for (const item of itemDocs) {
    const id = firstNonEmpty(item?._id);
    if (!id) continue;

    const name = firstNonEmpty(item?.name, 'Unnamed item');
    const description = firstNonEmpty(item?.description);
    const notes = firstNonEmpty(item?.notes, item?.maintenanceNotes);
    const primaryOwnerName = firstNonEmpty(item?.primaryOwnerName);
    const ownerKey = normalizeFacetKey(primaryOwnerName);
    const keepPriority = normalizeKeepPriorityValue(item?.keepPriority);
    const keepPriorityKey = normalizeFacetKey(keepPriority);
    const keepPriorityLabel = formatKeepPriorityLabel(keepPriority);
    const categoryKey = normalizeItemCategory(item?.category);
    const categoryLabel = toCategoryLabel(categoryKey);
    const tags = uniqueTrimmedValues(item?.tags);
    const tagKeys = tags.map((tag) => normalizeFacetKey(tag));
    const usageHistory = Array.isArray(item?.usageHistory)
      ? item.usageHistory.filter(Boolean)
      : [];
    const checkHistory = Array.isArray(item?.checkHistory)
      ? item.checkHistory.filter(Boolean)
      : [];
    const maintenanceHistory = Array.isArray(item?.maintenanceHistory)
      ? item.maintenanceHistory.filter(Boolean)
      : [];
    const isConsumable =
      Boolean(item?.isConsumable) ||
      tags.some((tag) => normalizeFacetKey(tag) === 'consumable');

    const boxContext = getBoxContext(item, maps, itemToLeafBoxId);
    const searchText = buildSearchText([
      name,
      description,
      notes,
      keepPriority,
      keepPriorityLabel,
      categoryLabel,
      item?.category,
      tags.join(' '),
      boxContext.boxName,
      boxContext.boxNumber,
      boxContext.groupLabel,
      boxContext.locationLabel,
      boxContext.locationPath,
      boxContext.boxPath,
      item?.location,
      primaryOwnerName,
      isConsumable ? 'consumable' : 'non consumable',
    ]);

    const retrievalItem = {
      id,
      name,
      description,
      notes,
      categoryKey,
      categoryLabel,
      tags,
      tagKeys,
      boxId: boxContext.boxId,
      boxNumber: boxContext.boxNumber,
      boxName: boxContext.boxName,
      boxPath: boxContext.boxPath,
      boxKey: boxContext.boxKey,
      groupLabel: boxContext.groupLabel,
      locationLabel: boxContext.locationLabel,
      locationPath: boxContext.locationPath,
      locationKey: boxContext.locationKey,
      primaryOwnerName,
      keepPriority: keepPriority || '',
      keepPriorityKey,
      keepPriorityLabel,
      ownerKey,
      isConsumable,
      usageHistory,
      checkHistory,
      maintenanceHistory,
      searchText,
      imageUrl: getItemImageUrl(item),
      previewImageUrl: getItemPreviewImageUrl(item),
      siblingItems: [],
    };

    retrievalItems.push(retrievalItem);
    itemNameById.set(id, name);
  }

  for (const item of retrievalItems) {
    const leafBoxId = itemToLeafBoxId.get(item.id);
    const leafBox = leafBoxId ? maps.byId.get(leafBoxId) : null;
    const siblingNames = [];

    for (const siblingIdRaw of Array.isArray(leafBox?.items) ? leafBox.items : []) {
      const siblingId = firstNonEmpty(siblingIdRaw);
      if (!siblingId || siblingId === item.id) continue;
      const siblingName = itemNameById.get(siblingId);
      if (!siblingName) continue;
      siblingNames.push(siblingName);
    }

    item.siblingItems = siblingNames.sort(compareLabel);
  }

  return retrievalItems.sort((a, b) => {
    const byLocation = compareLabel(a.locationLabel, b.locationLabel);
    if (byLocation !== 0) return byLocation;

    const byBox = compareBoxNumber(a.boxNumber, b.boxNumber);
    if (byBox !== 0) return byBox;

    return compareLabel(a.name, b.name);
  });
}

function filterRetrievalItems(
  items,
  {
    query,
    categoryFilters,
    tagFilters,
    locationFilters,
    ownerFilters,
    keepPriorityFilters,
  }
) {
  const normalizedQuery = normalizeText(query);

  return items.filter((item) => {
    if (normalizedQuery && !String(item.searchText || '').includes(normalizedQuery)) {
      return false;
    }

    if (categoryFilters.length && !categoryFilters.includes(item.categoryKey)) {
      return false;
    }

    if (locationFilters.length && !locationFilters.includes(item.locationKey)) {
      return false;
    }

    if (ownerFilters.length && !ownerFilters.includes(item.ownerKey)) {
      return false;
    }

    if (
      keepPriorityFilters.length &&
      !keepPriorityFilters.includes(item.keepPriorityKey)
    ) {
      return false;
    }

    if (tagFilters.length) {
      const tagKeys = Array.isArray(item.tagKeys) ? item.tagKeys : [];
      const hasMatchingTag = tagKeys.some((tagKey) => tagFilters.includes(tagKey));
      if (!hasMatchingTag) return false;
    }

    return true;
  });
}

function toClientItem(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    notes: item.notes,
    categoryKey: item.categoryKey,
    categoryLabel: item.categoryLabel,
    tags: item.tags,
    boxId: item.boxId,
    boxNumber: item.boxNumber,
    boxName: item.boxName,
    boxPath: item.boxPath,
    groupLabel: item.groupLabel,
    locationLabel: item.locationLabel,
    locationPath: item.locationPath,
    primaryOwnerName: item.primaryOwnerName,
    keepPriority: item.keepPriority,
    keepPriorityLabel: item.keepPriorityLabel,
    isConsumable: item.isConsumable,
    usageHistory: item.usageHistory,
    checkHistory: item.checkHistory,
    maintenanceHistory: item.maintenanceHistory,
    imageUrl: item.imageUrl,
    previewImageUrl: item.previewImageUrl,
    siblingItems: item.siblingItems,
  };
}

function buildRetrievalBoxes(boxDocs = []) {
  const safeBoxes = Array.isArray(boxDocs) ? boxDocs : [];
  const maps = buildBoxMaps(safeBoxes);
  const childCountByParentId = new Map();

  for (const box of safeBoxes) {
    const parentId = firstNonEmpty(box?.parentBox);
    if (!parentId) continue;
    const current = childCountByParentId.get(parentId) || 0;
    childCountByParentId.set(parentId, current + 1);
  }

  const resolveEffectiveGroupLabel = (leafBoxId) => {
    let cursor = firstNonEmpty(leafBoxId);

    while (cursor) {
      const node = maps.byId.get(cursor);
      if (!node) break;

      const groupValue = firstNonEmpty(node?.group);
      if (groupValue) return groupValue;

      cursor = firstNonEmpty(maps.parentOf.get(cursor));
    }

    return '';
  };

  return safeBoxes
    .map((box) => {
      const mongoId = firstNonEmpty(box?._id);
      if (!mongoId) return null;

      const boxId = firstNonEmpty(box?.box_id);
      const boxLabel = firstNonEmpty(
        box?.label,
        box?.name,
        boxId ? `Box ${boxId}` : '',
        UNKNOWN_BOX_NAME
      );
      const groupLabel = firstNonEmpty(
        box?.group,
        resolveEffectiveGroupLabel(mongoId)
      );
      const groupKey = normalizeFacetKey(groupLabel);
      const locationLabel = firstNonEmpty(box?.location, UNKNOWN_LOCATION_LABEL);
      const locationKey = normalizeFacetKey(locationLabel);
      const breadcrumbData = makeBreadcrumb(mongoId, maps);
      const pathLabels = Array.isArray(breadcrumbData?.breadcrumb)
        ? breadcrumbData.breadcrumb
            .map((segment) => firstNonEmpty(segment?.label, segment?.box_id))
            .filter(Boolean)
        : [];
      const boxPath = pathLabels.join(' > ');
      const directItemCount = Array.isArray(box?.items) ? box.items.length : 0;
      const childBoxCount = childCountByParentId.get(mongoId) || 0;
      const searchText = buildSearchText([
        boxId,
        boxLabel,
        groupLabel,
        locationLabel,
        boxPath,
      ]);

      return {
        id: mongoId,
        boxId,
        boxLabel,
        groupLabel,
        groupKey,
        locationLabel,
        locationKey,
        boxPath,
        directItemCount,
        childBoxCount,
        searchText,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const byLocation = compareLabel(a.locationLabel, b.locationLabel);
      if (byLocation !== 0) return byLocation;

      const byBox = compareBoxNumber(a.boxId, b.boxId);
      if (byBox !== 0) return byBox;

      return compareLabel(a.boxLabel, b.boxLabel);
    });
}

function collectBoxFilterOptions(boxes) {
  const groupLabelByKey = new Map();
  const locationLabelByKey = new Map();

  for (const box of boxes) {
    if (box.groupKey && box.groupLabel) {
      if (!groupLabelByKey.has(box.groupKey)) {
        groupLabelByKey.set(box.groupKey, box.groupLabel);
      }
    }

    if (!box.locationKey) continue;
    if (!locationLabelByKey.has(box.locationKey)) {
      locationLabelByKey.set(box.locationKey, firstNonEmpty(box.locationLabel, UNKNOWN_LOCATION_LABEL));
    }
  }

  return {
    groups: mapToSortedOptions(groupLabelByKey),
    locations: mapToSortedOptions(locationLabelByKey),
  };
}

function filterRetrievalBoxes(items, { query, locationFilters, groupFilters }) {
  const normalizedQuery = normalizeText(query);
  const rawQuery = toTrimmed(query);
  const numericPrefix = /^\d+$/.test(rawQuery) ? rawQuery : '';

  return items.filter((item) => {
    if (groupFilters.length && !groupFilters.includes(item.groupKey)) {
      return false;
    }

    if (locationFilters.length && !locationFilters.includes(item.locationKey)) {
      return false;
    }

    if (!normalizedQuery) return true;

    const textMatch = String(item.searchText || '').includes(normalizedQuery);
    if (textMatch) return true;

    if (numericPrefix && String(item.boxId || '').startsWith(numericPrefix)) {
      return true;
    }

    return false;
  });
}

function toClientBox(item) {
  return {
    id: item.id,
    boxId: item.boxId,
    boxLabel: item.boxLabel,
    groupLabel: item.groupLabel,
    locationLabel: item.locationLabel,
    boxPath: item.boxPath,
    directItemCount: item.directItemCount,
    childBoxCount: item.childBoxCount,
  };
}

async function getRetrievalItemsPage(params = {}) {
  const query = toTrimmed(params.q);
  const categoryFilters = normalizeFilterValues(params.category);
  const tagFilters = normalizeFilterValues(params.tag);
  const locationFilters = normalizeFilterValues(params.location);
  const ownerFilters = normalizeFilterValues(params.owner);
  const keepPriorityFilters = normalizeFilterValues(params.keepPriority);
  const limit = parseLimit(params.limit);
  const offset = parseOffset(params.offset);

  const [itemDocs, boxDocs] = await Promise.all([
    Item.find(ACTIVE_ITEM_FILTER)
      .select(
        '_id name description notes maintenanceNotes category tags location image imagePath primaryOwnerName keepPriority orphanedAt isConsumable usageHistory checkHistory maintenanceHistory'
      )
      .lean(),
    Box.find().select('_id box_id label group location parentBox items').lean(),
  ]);

  const retrievalItems = buildRetrievalItems(itemDocs, boxDocs);
  const filteredItems = filterRetrievalItems(retrievalItems, {
    query,
    categoryFilters,
    tagFilters,
    locationFilters,
    ownerFilters,
    keepPriorityFilters,
  });

  const total = filteredItems.length;
  const pagedItems = filteredItems.slice(offset, offset + limit).map(toClientItem);

  return {
    items: pagedItems,
    total,
    limit,
    offset,
    hasMore: offset + pagedItems.length < total,
    filters: collectFilterOptions(retrievalItems),
  };
}

async function getRetrievalBoxesPage(params = {}) {
  const query = toTrimmed(params.q);
  const groupFilters = normalizeFilterValues(params.group);
  const locationFilters = normalizeFilterValues(params.location);
  const limit = parseLimit(params.limit);
  const offset = parseOffset(params.offset);

  const boxDocs = await Box.find()
    .select('_id box_id label name group location parentBox items')
    .lean();

  const retrievalBoxes = buildRetrievalBoxes(boxDocs);
  const filteredBoxes = filterRetrievalBoxes(retrievalBoxes, {
    query,
    groupFilters,
    locationFilters,
  });

  const total = filteredBoxes.length;
  const pagedBoxes = filteredBoxes.slice(offset, offset + limit).map(toClientBox);

  return {
    boxes: pagedBoxes,
    total,
    limit,
    offset,
    hasMore: offset + pagedBoxes.length < total,
    filters: collectBoxFilterOptions(retrievalBoxes),
  };
}

module.exports = {
  getRetrievalItemsPage,
  getRetrievalBoxesPage,
};
