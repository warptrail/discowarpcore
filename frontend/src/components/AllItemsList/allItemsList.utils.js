import { formatItemCategory, normalizeItemCategory } from '../../util/itemCategories';
import { getItemOwnershipContext } from '../../util/itemOwnership';

const PRIORITY_ORDER = {
  essential: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const DISPOSITION_LABELS = {
  lost: 'Lost',
  stolen: 'Stolen',
  trashed: 'Trashed',
  recycled: 'Recycled',
  gifted: 'Gifted',
  donated: 'Donated',
};

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Active Inventory' },
  { value: 'gone', label: 'No Longer Have' },
  { value: 'all', label: 'Full History' },
];

export const BASE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'boxed', label: 'Boxed' },
  { value: 'orphaned', label: 'Orphaned' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'nonConsumable', label: 'Non-Consumable' },
];

export const SORT_OPTIONS = [
  { value: 'alpha', label: 'Alphabetical' },
  { value: 'box', label: 'Box ID' },
  { value: 'date', label: 'Date Added' },
  { value: 'keepPriority', label: 'Keep Priority' },
  { value: 'owner', label: 'Primary Owner' },
  { value: 'lastMaintained', label: 'Last Maintained' },
  { value: 'purchasePrice', label: 'Purchase Price (cents)' },
  { value: 'category', label: 'Category' },
  { value: 'dispositionAt', label: 'Disposition Date' },
];

function isFiniteDate(date) {
  return date instanceof Date && Number.isFinite(date.getTime());
}

function parseDateMs(value) {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function parseObjectIdMs(value) {
  const raw = String(value || '').trim();
  if (raw.length < 8) return 0;
  const seconds = Number.parseInt(raw.slice(0, 8), 16);
  if (!Number.isFinite(seconds)) return 0;
  return seconds * 1000;
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
  });
}

function compareByName(a, b) {
  return compareText(a?.name, b?.name);
}

function getStatusTone({ isGone, isOrphaned }) {
  if (isGone) return 'coral';
  if (isOrphaned) return 'amber';
  return 'teal';
}

function getDispositionTone(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'lost' || key === 'stolen') return 'coral';
  if (key === 'gifted' || key === 'donated') return 'lilac';
  if (key === 'recycled') return 'teal';
  if (key === 'trashed') return 'amber';
  return 'muted';
}

export function normalizeStatusFilter(value) {
  const next = String(value || '').trim().toLowerCase();
  if (next === 'active' || next === 'gone' || next === 'all') return next;
  return 'active';
}

export function isGoneItem(item) {
  return String(item?.item_status || '').trim().toLowerCase() === 'gone';
}

export function formatDispositionLabel(value) {
  const key = String(value || '').trim().toLowerCase();
  if (!key) return '—';
  return DISPOSITION_LABELS[key] || `${key.slice(0, 1).toUpperCase()}${key.slice(1)}`;
}

export function formatDateLabel(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (!isFiniteDate(date)) return '—';
  return DATE_FORMATTER.format(date);
}

export function summarizeText(value, maxLength = 92) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function getVisibleTags(tags, maxVisible = 4) {
  const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const visible = safeTags.slice(0, maxVisible);
  const overflow = Math.max(safeTags.length - visible.length, 0);
  return { visible, overflow, total: safeTags.length };
}

export function prepareItemForList(item) {
  const ownership = getItemOwnershipContext(item);
  const isGone = isGoneItem(item);
  const orphanedAtMs = parseDateMs(item?.orphanedAt);
  const isOrphaned = !isGone && orphanedAtMs > 0;
  const isBoxed = ownership.isBoxed;
  const normalizedCategory = normalizeItemCategory(item?.category);
  const categoryLabel = formatItemCategory(normalizedCategory);
  const disposition = String(item?.disposition || '').trim().toLowerCase();
  const dispositionLabel = formatDispositionLabel(disposition);
  const dispositionNotes = String(item?.disposition_notes || '').trim();
  const dispositionNotesPreview = summarizeText(dispositionNotes, 100);
  const boxId = ownership.boxId || '';
  const boxLabel = ownership.boxLabel || '';
  const boxDescription = ownership.boxDescription || '';

  return {
    ...item,
    _allItems: {
      ownership,
      isGone,
      isOrphaned,
      isUnassigned: !isGone && !isBoxed && !isOrphaned,
      isBoxed,
      statusLabel: isGone ? 'No Longer Have' : isOrphaned ? 'Orphaned' : 'Active',
      statusTone: getStatusTone({ isGone, isOrphaned }),
      normalizedCategory,
      categoryLabel,
      tags: Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [],
      disposition,
      dispositionLabel,
      dispositionTone: getDispositionTone(disposition),
      dispositionAtLabel: formatDateLabel(item?.disposition_at),
      dispositionAtMs: parseDateMs(item?.disposition_at),
      hasDispositionNotes: Boolean(dispositionNotes),
      dispositionNotes,
      dispositionNotesPreview,
      boxId,
      boxLabel,
      boxDescription,
      boxHref: boxId ? `/boxes/${encodeURIComponent(boxId)}` : '',
      hasHistoricalBox: Boolean(!isBoxed && (boxId || boxLabel || boxDescription)),
      locationLabel: ownership.inheritedLocation || String(item?.location || '').trim(),
      orphanedAtLabel: formatDateLabel(item?.orphanedAt),
      orphanedAtMs,
      createdAtMs: parseObjectIdMs(item?._id),
      lastMaintainedAtMs: parseDateMs(item?.lastMaintainedAt),
      keepPriorityRank:
        PRIORITY_ORDER[String(item?.keepPriority || '').trim().toLowerCase()] ?? 4,
      ownerLabel: String(item?.primaryOwnerName || '').trim(),
      purchasePriceCents: Number.isFinite(item?.purchasePriceCents)
        ? item.purchasePriceCents
        : -1,
      quantityLabel:
        item?.quantity == null || item?.quantity === ''
          ? '—'
          : String(item.quantity),
    },
  };
}

export function filterAndSortItems(items, { statusFilter, filter, sortBy }) {
  const next = Array.isArray(items) ? [...items] : [];

  const filtered = next.filter((item) => {
    const meta = item?._allItems;
    if (!meta) return false;

    if (statusFilter === 'active' && meta.isGone) return false;
    if (statusFilter === 'gone' && !meta.isGone) return false;

    if (filter === 'boxed') return meta.isBoxed;
    if (filter === 'orphaned') return meta.isOrphaned;
    if (filter === 'consumable') return Boolean(item?.isConsumable);
    if (filter === 'nonConsumable') return !item?.isConsumable;
    if (String(filter || '').startsWith('category:')) {
      const selectedCategory = String(filter).slice('category:'.length);
      return meta.normalizedCategory === selectedCategory;
    }

    return true;
  });

  filtered.sort((a, b) => {
    const aMeta = a?._allItems || {};
    const bMeta = b?._allItems || {};

    if (sortBy === 'box') {
      const byBox = compareText(aMeta.boxId, bMeta.boxId);
      if (byBox !== 0) return byBox;
      return compareByName(a, b);
    }

    if (sortBy === 'date') {
      if (aMeta.createdAtMs !== bMeta.createdAtMs) {
        return bMeta.createdAtMs - aMeta.createdAtMs;
      }
      return compareByName(a, b);
    }

    if (sortBy === 'keepPriority') {
      if (aMeta.keepPriorityRank !== bMeta.keepPriorityRank) {
        return aMeta.keepPriorityRank - bMeta.keepPriorityRank;
      }
      return compareByName(a, b);
    }

    if (sortBy === 'owner') {
      const byOwner = compareText(aMeta.ownerLabel, bMeta.ownerLabel);
      if (byOwner !== 0) return byOwner;
      return compareByName(a, b);
    }

    if (sortBy === 'lastMaintained') {
      if (aMeta.lastMaintainedAtMs !== bMeta.lastMaintainedAtMs) {
        return bMeta.lastMaintainedAtMs - aMeta.lastMaintainedAtMs;
      }
      return compareByName(a, b);
    }

    if (sortBy === 'purchasePrice') {
      if (aMeta.purchasePriceCents !== bMeta.purchasePriceCents) {
        return bMeta.purchasePriceCents - aMeta.purchasePriceCents;
      }
      return compareByName(a, b);
    }

    if (sortBy === 'category') {
      const byCategory = compareText(aMeta.normalizedCategory, bMeta.normalizedCategory);
      if (byCategory !== 0) return byCategory;
      return compareByName(a, b);
    }

    if (sortBy === 'dispositionAt') {
      if (aMeta.dispositionAtMs !== bMeta.dispositionAtMs) {
        return bMeta.dispositionAtMs - aMeta.dispositionAtMs;
      }
      return compareByName(a, b);
    }

    return compareByName(a, b);
  });

  return filtered;
}
