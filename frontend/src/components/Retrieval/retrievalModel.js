import { getItemHomeHref } from '../../api/itemDetails';
import { formatItemCategory, normalizeItemCategory } from '../../util/itemCategories';
import { formatKeepPriorityLabel, normalizeKeepPriority } from '../../util/keepPriority';
import { getItemOwnershipContext } from '../../util/itemOwnership';

const UNKNOWN_LOCATION_LABEL = 'Unknown Location';
const UNKNOWN_BOX_NAME = 'Unknown Box';
const ORPHANED_BOX_NAME = 'ORPHANED';

const toTrimmed = (value) => (value == null ? '' : String(value).trim());

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const next = toTrimmed(value);
    if (next) return next;
  }
  return '';
};

const normalizeText = (value) =>
  toTrimmed(value)
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizeFacetKey = (value) => normalizeText(value);

const compareLabel = (a, b) =>
  String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
  });

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

function normalizeDateHistory(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => {
      if (value == null) return '';
      if (value instanceof Date) return value.toISOString();
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
      return toTrimmed(value);
    })
    .filter(Boolean);
}

function readTreeNodes(rawTree) {
  if (Array.isArray(rawTree)) return rawTree;
  if (Array.isArray(rawTree?.boxes)) return rawTree.boxes;
  if (Array.isArray(rawTree?.tree)) return rawTree.tree;
  return [];
}

function buildBoxLookup(rawTree) {
  const byMongoId = new Map();
  const byShortId = new Map();
  const nodes = readTreeNodes(rawTree);

  const visit = (node, ancestorLabels = [], inheritedLocation = '', inheritedGroup = '') => {
    if (!node || typeof node !== 'object') return;

    const boxNumber = firstNonEmpty(node.box_id, node.boxId, node.shortId);
    const boxMongoId = firstNonEmpty(node._id, node.id);
    const boxName = firstNonEmpty(
      node.label,
      node.name,
      boxNumber ? `Box ${boxNumber}` : '',
      UNKNOWN_BOX_NAME,
    );

    const pathLabels = [...ancestorLabels, boxName].filter(Boolean);
    const boxPath = pathLabels.join(' > ');
    const locationLabel = firstNonEmpty(
      node.location,
      node.locationName,
      node.locationLabel,
      inheritedLocation,
    );
    const groupLabel = firstNonEmpty(
      node.groupLabel,
      node.group,
      inheritedGroup,
    );

    const locationPath =
      locationLabel && boxPath
        ? `${locationLabel} > ${boxPath}`
        : locationLabel || boxPath;

    const entry = {
      boxNumber,
      boxName,
      boxMongoId,
      boxPath,
      locationLabel,
      locationPath,
      groupLabel,
    };

    if (boxMongoId) byMongoId.set(boxMongoId, entry);
    if (boxNumber) byShortId.set(boxNumber, entry);

    const children = Array.isArray(node.childBoxes) ? node.childBoxes : [];
    for (const child of children) {
      visit(child, pathLabels, locationLabel || inheritedLocation, groupLabel || inheritedGroup);
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return { byMongoId, byShortId };
}

function getBreadcrumbPath(item) {
  const breadcrumb = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  const labels = breadcrumb
    .map((node) =>
      firstNonEmpty(node?.label, node?.name, node?.box_id, node?.boxId),
    )
    .filter(Boolean);

  return labels.join(' > ');
}

function buildLocationPath(locationLabel, boxPath) {
  const normalizedLocation = normalizeText(locationLabel);
  const normalizedPath = normalizeText(boxPath);

  if (locationLabel && boxPath) {
    if (normalizedPath && normalizedLocation && normalizedPath.startsWith(normalizedLocation)) {
      return boxPath;
    }
    return `${locationLabel} > ${boxPath}`;
  }

  return locationLabel || boxPath || '';
}

function buildSearchText(parts) {
  return normalizeText(parts.filter(Boolean).join(' '));
}

function getItemHref(itemId) {
  if (!itemId) return '';

  try {
    return getItemHomeHref(itemId);
  } catch {
    return '';
  }
}

function getItemImageUrl(item) {
  return firstNonEmpty(
    item?.image?.thumb?.url,
    item?.image?.display?.url,
    item?.image?.original?.url,
    item?.image?.url,
    item?.imagePath,
  );
}

function isItemOrphaned(item) {
  return Boolean(item?.orphanedAt || item?.isOrphaned || item?.orphaned);
}

function getBoxHref(boxNumber) {
  const shortId = firstNonEmpty(boxNumber);
  if (!shortId) return '';

  return `/boxes/${encodeURIComponent(shortId)}`;
}

function getItemBoxContext(item, boxLookup) {
  const ownership = getItemOwnershipContext(item);
  const orphaned = isItemOrphaned(item);

  const boxMongoId = firstNonEmpty(
    ownership.boxMongoId,
    item?.box?._id,
    item?.box?.id,
    item?.parentBox,
  );

  const boxNumber = firstNonEmpty(
    ownership.boxId,
    item?.box?.box_id,
    item?.box?.boxId,
    item?.box_id,
    item?.boxId,
    item?.parentBoxId,
  );

  const lookupEntry =
    (boxMongoId ? boxLookup.byMongoId.get(boxMongoId) : null) ||
    (boxNumber ? boxLookup.byShortId.get(boxNumber) : null) ||
    null;

  const breadcrumbPath = getBreadcrumbPath(item);
  const boxPath = firstNonEmpty(lookupEntry?.boxPath, breadcrumbPath);

  const locationLabel = firstNonEmpty(
    lookupEntry?.locationLabel,
    ownership.inheritedLocation,
    item?.location,
  );
  const groupLabel = firstNonEmpty(
    lookupEntry?.groupLabel,
    ownership.effectiveBoxGroup,
    ownership.inheritedGroup,
    item?.boxGroupLabel,
    item?.groupLabel,
  );

  const locationPath = firstNonEmpty(
    lookupEntry?.locationPath,
    buildLocationPath(locationLabel, boxPath),
    locationLabel,
    boxPath,
  );

  const boxName = firstNonEmpty(
    lookupEntry?.boxName,
    ownership.boxLabel,
    item?.box?.label,
    item?.box?.name,
    boxNumber ? `Box ${boxNumber}` : '',
    orphaned ? ORPHANED_BOX_NAME : '',
    UNKNOWN_BOX_NAME,
  );

  const boxKey = boxMongoId
    ? `mongo:${boxMongoId}`
    : boxNumber
      ? `short:${boxNumber}`
      : '';

  return {
    boxMongoId,
    boxNumber,
    boxName,
    boxPath,
    boxKey,
    locationLabel: locationLabel || UNKNOWN_LOCATION_LABEL,
    locationPath: locationPath || locationLabel || UNKNOWN_LOCATION_LABEL,
    locationKey: normalizeFacetKey(locationLabel || UNKNOWN_LOCATION_LABEL),
    groupLabel,
  };
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

export function buildRetrievalItems(rawItems, rawTree) {
  const safeItems = Array.isArray(rawItems) ? rawItems : [];
  const boxLookup = buildBoxLookup(rawTree);

  const base = [];

  for (const item of safeItems) {
    const id = firstNonEmpty(item?._id, item?.id);
    if (!id) continue;

    const name = firstNonEmpty(item?.name, 'Unnamed item');
    const description = firstNonEmpty(item?.description);
    const notes = firstNonEmpty(item?.notes, item?.maintenanceNotes);
    const categoryKey = normalizeItemCategory(item?.category);
    const categoryLabel = formatItemCategory(categoryKey);
    const keepPriority = normalizeKeepPriority(item?.keepPriority);
    const keepPriorityLabel = formatKeepPriorityLabel(keepPriority);
    const keepPriorityKey = normalizeFacetKey(keepPriority);
    const tags = uniqueTrimmedValues(item?.tags);
    const tagKeys = tags.map((tag) => normalizeFacetKey(tag));

    const context = getItemBoxContext(item, boxLookup);

    const searchText = buildSearchText([
      name,
      description,
      notes,
      keepPriority,
      keepPriorityLabel,
      categoryLabel,
      item?.category,
      tags.join(' '),
      context.boxName,
      context.boxNumber,
      context.groupLabel,
      context.locationLabel,
      context.locationPath,
      context.boxPath,
      getBreadcrumbPath(item),
    ]);

    base.push({
      id,
      name,
      description,
      notes,
      categoryKey,
      categoryLabel,
      keepPriority,
      keepPriorityLabel,
      keepPriorityKey,
      tags,
      tagKeys,
      boxId: context.boxMongoId,
      boxNumber: context.boxNumber,
      boxName: context.boxName,
      boxPath: context.boxPath,
      boxKey: context.boxKey,
      boxGroupLabel: context.groupLabel,
      groupLabel: context.groupLabel,
      locationLabel: context.locationLabel,
      locationPath: context.locationPath,
      locationKey: context.locationKey,
      searchText,
      imageUrl: getItemImageUrl(item),
      boxHref: getBoxHref(context.boxNumber),
      itemHref: getItemHref(id),
    });
  }

  const siblingMap = new Map();

  for (const item of base) {
    if (!item.boxKey) continue;
    if (!siblingMap.has(item.boxKey)) siblingMap.set(item.boxKey, []);
    siblingMap.get(item.boxKey).push({ id: item.id, name: item.name });
  }

  return base
    .map((item) => {
      const siblings = siblingMap.get(item.boxKey) || [];
      const siblingItems = siblings
        .filter((sibling) => sibling.id !== item.id)
        .map((sibling) => sibling.name)
        .sort(compareLabel);

      return {
        ...item,
        siblingItems,
      };
    })
    .sort((a, b) => {
      const byLocation = compareLabel(a.locationLabel, b.locationLabel);
      if (byLocation !== 0) return byLocation;

      const byBox = compareBoxNumber(a.boxNumber, b.boxNumber);
      if (byBox !== 0) return byBox;

      return compareLabel(a.name, b.name);
    });
}

function mapToSortedOptions(optionMap) {
  return Array.from(optionMap.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => compareLabel(a.label, b.label));
}

export function collectRetrievalFilterOptions(items) {
  const safeItems = Array.isArray(items) ? items : [];

  const categoryLabelByKey = new Map();
  const tagLabelByKey = new Map();
  const locationLabelByKey = new Map();
  const keepPriorityLabelByKey = new Map();

  for (const item of safeItems) {
    if (item.categoryKey) {
      categoryLabelByKey.set(
        item.categoryKey,
        firstNonEmpty(item.categoryLabel, formatItemCategory(item.categoryKey)),
      );
    }

    if (item.locationKey) {
      locationLabelByKey.set(
        item.locationKey,
        firstNonEmpty(item.locationLabel, UNKNOWN_LOCATION_LABEL),
      );
    }

    if (item.keepPriorityKey) {
      keepPriorityLabelByKey.set(item.keepPriorityKey, item.keepPriorityLabel);
    }

    const tags = Array.isArray(item.tags) ? item.tags : [];
    for (const tag of tags) {
      const key = normalizeFacetKey(tag);
      if (!key) continue;
      if (!tagLabelByKey.has(key)) {
        tagLabelByKey.set(key, tag);
      }
    }
  }

  return {
    categories: mapToSortedOptions(categoryLabelByKey),
    tags: mapToSortedOptions(tagLabelByKey),
    locations: mapToSortedOptions(locationLabelByKey),
    keepPriorities: mapToSortedOptions(keepPriorityLabelByKey),
    categoryLabelByKey,
    tagLabelByKey,
    locationLabelByKey,
    keepPriorityLabelByKey,
  };
}

function normalizeFilterList(list) {
  const seen = new Set();
  const values = [];

  for (const value of Array.isArray(list) ? list : []) {
    const key = normalizeFacetKey(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    values.push(key);
  }

  return values;
}

export function filterRetrievalItems(items, { query, filters }) {
  const safeItems = Array.isArray(items) ? items : [];
  const normalizedQuery = normalizeText(query);
  const categoryFilters = normalizeFilterList(filters?.categories);
  const tagFilters = normalizeFilterList(filters?.tags);
  const locationFilters = normalizeFilterList(filters?.locations);
  const keepPriorityFilters = normalizeFilterList(filters?.keepPriorities);

  return safeItems.filter((item) => {
    if (normalizedQuery && !String(item.searchText || '').includes(normalizedQuery)) {
      return false;
    }

    if (categoryFilters.length && !categoryFilters.includes(item.categoryKey)) {
      return false;
    }

    if (locationFilters.length && !locationFilters.includes(item.locationKey)) {
      return false;
    }

    if (tagFilters.length) {
      const tagKeys = Array.isArray(item.tagKeys) ? item.tagKeys : [];
      const hasTag = tagKeys.some((tagKey) => tagFilters.includes(tagKey));
      if (!hasTag) return false;
    }

    if (keepPriorityFilters.length && !keepPriorityFilters.includes(item.keepPriorityKey)) {
      return false;
    }

    return true;
  });
}

export function buildActiveFilterChips(filters, options) {
  const chips = [];

  const categories = normalizeFilterList(filters?.categories);
  const tags = normalizeFilterList(filters?.tags);
  const locations = normalizeFilterList(filters?.locations);
  const owners = normalizeFilterList(filters?.owners);
  const keepPriorities = normalizeFilterList(filters?.keepPriorities);

  for (const key of categories) {
    const label = options?.categoryLabelByKey?.get(key) || key;
    chips.push({ type: 'categories', key, label: `Category: ${label}` });
  }

  for (const key of locations) {
    const label = options?.locationLabelByKey?.get(key) || key;
    chips.push({ type: 'locations', key, label: `Location: ${label}` });
  }

  for (const key of tags) {
    const label = options?.tagLabelByKey?.get(key) || key;
    chips.push({ type: 'tags', key, label: `Tag: ${label}` });
  }

  for (const key of owners) {
    const label = options?.ownerLabelByKey?.get(key) || key;
    chips.push({ type: 'owners', key, label: `Owner: ${label}` });
  }

  for (const key of keepPriorities) {
    const label = options?.keepPriorityLabelByKey?.get(key) || key;
    chips.push({ type: 'keepPriorities', key, label: `Keep: ${label}` });
  }

  return chips;
}

function normalizeOptionRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const key = normalizeFacetKey(row?.key);
      const label = firstNonEmpty(row?.label, row?.key);
      if (!key || !label) return null;
      return { key, label };
    })
    .filter(Boolean)
    .sort((a, b) => compareLabel(a.label, b.label));
}

export function normalizeRetrievalFilterOptions(rawFilters) {
  const categories = normalizeOptionRows(rawFilters?.categories);
  const tags = normalizeOptionRows(rawFilters?.tags);
  const groups = normalizeOptionRows(rawFilters?.groups);
  const locations = normalizeOptionRows(rawFilters?.locations);
  const owners = normalizeOptionRows(rawFilters?.owners);
  const keepPriorities = normalizeOptionRows(rawFilters?.keepPriorities);

  const categoryLabelByKey = new Map(categories.map((option) => [option.key, option.label]));
  const tagLabelByKey = new Map(tags.map((option) => [option.key, option.label]));
  const groupLabelByKey = new Map(groups.map((option) => [option.key, option.label]));
  const locationLabelByKey = new Map(locations.map((option) => [option.key, option.label]));
  const ownerLabelByKey = new Map(owners.map((option) => [option.key, option.label]));
  const keepPriorityLabelByKey = new Map(
    keepPriorities.map((option) => [option.key, option.label]),
  );

  return {
    categories,
    tags,
    groups,
    locations,
    owners,
    keepPriorities,
    categoryLabelByKey,
    tagLabelByKey,
    groupLabelByKey,
    locationLabelByKey,
    ownerLabelByKey,
    keepPriorityLabelByKey,
  };
}

export function normalizeRetrievalItemsPage(rawItems) {
  const safeItems = Array.isArray(rawItems) ? rawItems : [];

  return safeItems
    .map((rawItem) => {
      const id = firstNonEmpty(rawItem?.id, rawItem?._id);
      if (!id) return null;

      const categoryKey = normalizeItemCategory(rawItem?.categoryKey || rawItem?.category);
      const tags = uniqueTrimmedValues(rawItem?.tags);
      const keepPriority = normalizeKeepPriority(rawItem?.keepPriority);
      const orphaned = isItemOrphaned(rawItem);
      const explicitConsumable = rawItem?.isConsumable;
      const hasConsumableTag = tags.some(
        (tag) => normalizeFacetKey(tag) === 'consumable',
      );
      const isConsumable = explicitConsumable == null
        ? hasConsumableTag
        : Boolean(explicitConsumable);

      return {
        id,
        name: firstNonEmpty(rawItem?.name, 'Unnamed item'),
        description: firstNonEmpty(rawItem?.description),
        notes: firstNonEmpty(rawItem?.notes),
        categoryKey,
        categoryLabel: firstNonEmpty(
          rawItem?.categoryLabel,
          formatItemCategory(categoryKey)
        ),
        keepPriority,
        keepPriorityLabel: firstNonEmpty(
          rawItem?.keepPriorityLabel,
          formatKeepPriorityLabel(keepPriority),
        ),
        tags,
        boxId: firstNonEmpty(rawItem?.boxId, rawItem?.boxMongoId),
        boxNumber: firstNonEmpty(rawItem?.boxNumber),
        boxName: firstNonEmpty(
          rawItem?.boxName,
          orphaned ? ORPHANED_BOX_NAME : '',
          UNKNOWN_BOX_NAME,
        ),
        boxPath: firstNonEmpty(rawItem?.boxPath),
        boxGroupLabel: firstNonEmpty(rawItem?.boxGroupLabel, rawItem?.groupLabel),
        groupLabel: firstNonEmpty(rawItem?.groupLabel, rawItem?.boxGroupLabel),
        locationLabel: firstNonEmpty(rawItem?.locationLabel, UNKNOWN_LOCATION_LABEL),
        locationPath: firstNonEmpty(rawItem?.locationPath, UNKNOWN_LOCATION_LABEL),
        primaryOwnerName: firstNonEmpty(rawItem?.primaryOwnerName),
        isConsumable,
        usageHistory: normalizeDateHistory(rawItem?.usageHistory),
        checkHistory: normalizeDateHistory(rawItem?.checkHistory),
        maintenanceHistory: normalizeDateHistory(rawItem?.maintenanceHistory),
        imageUrl: firstNonEmpty(rawItem?.imageUrl),
        previewImageUrl: firstNonEmpty(rawItem?.previewImageUrl, rawItem?.imageUrl),
        siblingItems: uniqueTrimmedValues(rawItem?.siblingItems),
        itemHref: getItemHref(id),
        boxHref: getBoxHref(rawItem?.boxNumber),
      };
    })
    .filter(Boolean);
}

export function normalizeRetrievalBoxesPage(rawBoxes) {
  const safeBoxes = Array.isArray(rawBoxes) ? rawBoxes : [];

  return safeBoxes
    .map((rawBox) => {
      const id = firstNonEmpty(rawBox?.id, rawBox?._id);
      if (!id) return null;

      const boxId = firstNonEmpty(rawBox?.boxId, rawBox?.box_id);
      const boxLabel = firstNonEmpty(rawBox?.boxLabel, rawBox?.label, UNKNOWN_BOX_NAME);
      const notes = firstNonEmpty(rawBox?.notes);
      const groupLabel = firstNonEmpty(rawBox?.groupLabel, rawBox?.group);
      const locationLabel = firstNonEmpty(rawBox?.locationLabel, rawBox?.location, UNKNOWN_LOCATION_LABEL);
      const boxPath = firstNonEmpty(rawBox?.boxPath);
      const directItemCount = Number.isFinite(Number(rawBox?.directItemCount))
        ? Number(rawBox.directItemCount)
        : 0;
      const childBoxCount = Number.isFinite(Number(rawBox?.childBoxCount))
        ? Number(rawBox.childBoxCount)
        : 0;

      return {
        id,
        boxId,
        boxLabel,
        notes,
        groupLabel,
        locationLabel,
        locationKey: normalizeFacetKey(locationLabel),
        boxPath,
        directItemCount,
        childBoxCount,
        boxHref: boxId ? getBoxHref(boxId) : '',
      };
    })
    .filter(Boolean);
}
