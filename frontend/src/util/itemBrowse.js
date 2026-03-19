import { normalizeItemCategory } from './itemCategories';

export function normalizeItemQuery(value) {
  return String(value || '').trim().toLowerCase();
}

export function itemTagsText(tags) {
  if (!Array.isArray(tags)) return '';
  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag;
      if (tag && typeof tag === 'object') return String(tag.value ?? '').trim();
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

export function matchesItemQuery(item, query, context = {}) {
  const normalizedQuery = normalizeItemQuery(query);
  if (!normalizedQuery) return true;

  const { boxLabel, boxId, pathLabels } = context || {};
  const tags = itemTagsText(item?.tags);
  const breadcrumb = Array.isArray(pathLabels) ? pathLabels.join(' ') : '';

  const haystack = normalizeItemQuery(
    [
      item?.name,
      item?.description,
      item?.notes,
      normalizeItemCategory(item?.category),
      tags,
      boxLabel,
      boxId,
      breadcrumb,
      item?.parentBoxLabel,
      item?.parentBoxId,
    ]
      .filter(Boolean)
      .join(' '),
  );

  return haystack.includes(normalizedQuery);
}

export function compareItemsByMode(a, b, sortMode = 'recentlyAdded') {
  switch (sortMode) {
    case 'oldestAdded': {
      const diff = compareNullableDate(a?.createdAt, b?.createdAt, 'asc');
      if (diff !== 0) return diff;
      break;
    }
    case 'recentlyUpdated': {
      const diff = compareNullableDate(a?.updatedAt, b?.updatedAt, 'desc');
      if (diff !== 0) return diff;
      break;
    }
    case 'recentlyAcquired': {
      const diff = compareNullableDate(a?.dateAcquired, b?.dateAcquired, 'desc');
      if (diff !== 0) return diff;
      break;
    }
    case 'oldestAcquired': {
      const diff = compareNullableDate(a?.dateAcquired, b?.dateAcquired, 'asc');
      if (diff !== 0) return diff;
      break;
    }
    case 'recentlyUsed': {
      const diff = compareNullableDate(a?.dateLastUsed, b?.dateLastUsed, 'desc');
      if (diff !== 0) return diff;
      break;
    }
    case 'leastRecentlyUsed': {
      const diff = compareNullableDate(a?.dateLastUsed, b?.dateLastUsed, 'asc');
      if (diff !== 0) return diff;
      break;
    }
    case 'nameAsc': {
      const diff = compareText(a?.name, b?.name);
      if (diff !== 0) return diff;
      break;
    }
    case 'nameDesc': {
      const diff = compareText(b?.name, a?.name);
      if (diff !== 0) return diff;
      break;
    }
    case 'categoryAsc': {
      const diff = compareText(
        normalizeItemCategory(a?.category),
        normalizeItemCategory(b?.category),
      );
      if (diff !== 0) return diff;
      break;
    }
    case 'categoryDesc': {
      const diff = compareText(
        normalizeItemCategory(b?.category),
        normalizeItemCategory(a?.category),
      );
      if (diff !== 0) return diff;
      break;
    }
    case 'ownerAsc': {
      const diff = compareText(a?.primaryOwnerName, b?.primaryOwnerName);
      if (diff !== 0) return diff;
      break;
    }
    case 'ownerDesc': {
      const diff = compareText(b?.primaryOwnerName, a?.primaryOwnerName);
      if (diff !== 0) return diff;
      break;
    }
    case 'valueDesc': {
      const diff = compareNullableNumber(a?.valueCents, b?.valueCents, 'desc');
      if (diff !== 0) return diff;
      break;
    }
    case 'valueAsc': {
      const diff = compareNullableNumber(a?.valueCents, b?.valueCents, 'asc');
      if (diff !== 0) return diff;
      break;
    }
    case 'recentlyAdded':
    default: {
      const diff = compareNullableDate(a?.createdAt, b?.createdAt, 'desc');
      if (diff !== 0) return diff;
      break;
    }
  }

  const byName = compareText(a?.name, b?.name);
  if (byName !== 0) return byName;
  return compareText(String(a?._id ?? a?.id ?? ''), String(b?._id ?? b?.id ?? ''));
}

function compareNullableDate(a, b, direction = 'desc') {
  const aMs = parseDateMs(a);
  const bMs = parseDateMs(b);

  if (aMs == null && bMs == null) return 0;
  if (aMs == null) return 1;
  if (bMs == null) return -1;

  return direction === 'asc' ? aMs - bMs : bMs - aMs;
}

function parseDateMs(value) {
  if (!value) return null;
  const ms =
    value instanceof Date ? value.getTime() : Date.parse(String(value).trim());
  return Number.isFinite(ms) ? ms : null;
}

function compareNullableNumber(a, b, direction = 'desc') {
  const aNum = toFiniteNumber(a);
  const bNum = toFiniteNumber(b);

  if (aNum == null && bNum == null) return 0;
  if (aNum == null) return 1;
  if (bNum == null) return -1;

  return direction === 'asc' ? aNum - bNum : bNum - aNum;
}

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}
