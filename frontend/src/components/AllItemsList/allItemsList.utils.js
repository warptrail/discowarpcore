import {
  ITEM_CATEGORIES,
  formatItemCategory,
  normalizeItemCategory,
} from '../../util/itemCategories';
import { deriveImageProcessingEligibility } from '../Processing/imageProcessingEligibility';
import {
  formatKeepPriorityLabel,
  KEEP_PRIORITY_ORDER,
  keepPriorityTone,
  normalizeKeepPriority,
} from '../../util/keepPriority';
import { getItemOwnershipContext } from '../../util/itemOwnership';

const DISPOSITION_LABELS = {
  consumed: 'Consumed',
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
  { value: 'batch', label: 'Batch Focused' },
];

export const BASE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'boxed', label: 'Boxed' },
  { value: 'orphaned', label: 'Orphaned' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'nonConsumable', label: 'Non-Consumable' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

export const SORT_OPTIONS = [
  { value: 'alpha', label: 'Alphabetical' },
  { value: 'batch', label: 'Source Batch' },
  { value: 'box', label: 'Box ID' },
  { value: 'date', label: 'Date Added' },
  { value: 'keepPriority', label: 'Keep Priority' },
  { value: 'owner', label: 'Primary Owner' },
  { value: 'lastMaintained', label: 'Last Maintained' },
  { value: 'purchasePrice', label: 'Purchase Price (cents)' },
  { value: 'category', label: 'Category' },
  { value: 'dispositionAt', label: 'Disposition Date' },
];

export const COLOR_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'batch', label: 'Batch' },
  { value: 'location', label: 'Location' },
  { value: 'box', label: 'Box' },
  { value: 'status', label: 'Status' },
];

export const BATCH_ACTION_MODE_OPTIONS = [
  { value: 'process', label: 'Process' },
  { value: 'reprocess', label: 'Re-process' },
  { value: 'revert', label: 'Revert' },
];

const BASE_FILTER_VALUES = new Set(BASE_FILTER_OPTIONS.map((option) => option.value));
const SORT_VALUES = new Set(SORT_OPTIONS.map((option) => option.value));
const COLOR_BY_VALUES = new Set(COLOR_BY_OPTIONS.map((option) => option.value));
const BATCH_ACTION_MODE_VALUES = new Set(BATCH_ACTION_MODE_OPTIONS.map((option) => option.value));

export function normalizeColorBy(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return COLOR_BY_VALUES.has(normalized) ? normalized : 'none';
}

export function normalizeBatchActionMode(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return BATCH_ACTION_MODE_VALUES.has(normalized) ? normalized : 'process';
}

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

function normalizeSearchFragment(value) {
  return String(value || '').trim().toLowerCase();
}

function pushSearchFragment(parts, value) {
  const fragment = normalizeSearchFragment(value);
  if (fragment) parts.push(fragment);
}

function pushTagFragments(parts, tags) {
  const safeTags = Array.isArray(tags) ? tags : [];
  for (const tag of safeTags) {
    if (typeof tag === 'string') {
      pushSearchFragment(parts, tag);
      continue;
    }
    pushSearchFragment(parts, tag?.value || tag?.label || '');
  }
}

function pushLinkFragments(parts, links) {
  const safeLinks = Array.isArray(links) ? links : [];
  for (const link of safeLinks) {
    pushSearchFragment(parts, link?.label);
    pushSearchFragment(parts, link?.url);
  }
}

function buildItemSearchText(item, {
  categoryLabel,
  keepPriorityKey,
  keepPriorityLabel,
  ownerLabel,
  statusLabel,
  dispositionLabel,
  quantityLabel,
  tags,
  sourceBatchLabel,
  sourceBatchId,
  sourceBatchArchiveLabel,
}) {
  const parts = [];

  // Item-owned fields only; intentionally excludes all box context.
  pushSearchFragment(parts, item?.name);
  pushSearchFragment(parts, item?.description);
  pushSearchFragment(parts, item?.notes);
  pushSearchFragment(parts, item?.disposition_notes);
  pushSearchFragment(parts, item?.maintenanceNotes);
  pushSearchFragment(parts, item?.category);
  pushSearchFragment(parts, categoryLabel);
  pushSearchFragment(parts, item?.primaryOwnerName);
  pushSearchFragment(parts, ownerLabel);
  pushSearchFragment(parts, item?.keepPriority);
  pushSearchFragment(parts, keepPriorityKey);
  pushSearchFragment(parts, keepPriorityLabel);
  pushSearchFragment(parts, item?.sourceBatchId);
  pushSearchFragment(parts, sourceBatchId);
  pushSearchFragment(parts, item?.sourceBatch?.batchId);
  pushSearchFragment(parts, item?.sourceBatch?.batchName);
  pushSearchFragment(parts, sourceBatchLabel);
  pushSearchFragment(parts, sourceBatchArchiveLabel);
  pushSearchFragment(parts, item?.condition);
  pushSearchFragment(parts, item?.acquisitionType);
  pushSearchFragment(parts, item?.item_status);
  pushSearchFragment(parts, statusLabel);
  pushSearchFragment(parts, item?.disposition);
  pushSearchFragment(parts, dispositionLabel);
  pushSearchFragment(parts, quantityLabel);
  pushSearchFragment(parts, item?.quantity);
  pushSearchFragment(parts, item?.isConsumable ? 'consumable' : 'non-consumable');
  pushTagFragments(parts, tags);
  pushLinkFragments(parts, item?.links);

  return parts.join(' ');
}

function getStatusTone({ isGone, isOrphaned }) {
  if (isGone) return 'coral';
  if (isOrphaned) return 'amber';
  return 'teal';
}

function getDispositionTone(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'consumed') return 'teal';
  if (key === 'lost' || key === 'stolen') return 'coral';
  if (key === 'gifted' || key === 'donated') return 'lilac';
  if (key === 'recycled') return 'teal';
  if (key === 'trashed') return 'amber';
  return 'muted';
}

export function normalizeStatusFilter(value) {
  const next = String(value || '').trim().toLowerCase();
  if (next === 'active' || next === 'gone' || next === 'all' || next === 'batch') return next;
  return 'active';
}

export function normalizeItemFilter(value) {
  const next = String(value || '').trim();
  if (!next) return 'all';
  if (BASE_FILTER_VALUES.has(next)) return next;
  if (next.startsWith('category:')) {
    const category = normalizeItemCategory(next.slice('category:'.length));
    if (ITEM_CATEGORIES.includes(category)) {
      return `category:${category}`;
    }
  }
  if (next.startsWith('batch:')) {
    const batchId = String(next.slice('batch:'.length) || '').trim();
    if (batchId) return `batch:${batchId}`;
  }
  return 'all';
}

export function normalizeSortBy(value) {
  const next = String(value || '').trim();
  if (SORT_VALUES.has(next)) return next;
  return 'alpha';
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

export function getItemThumbnailUrl(item) {
  const activeVariant = String(item?.image?.activeVariant || '').trim().toLowerCase();
  const processingStatus = String(item?.image?.processingStatus || '').trim().toLowerCase();
  const processedUrl = String(item?.image?.processed?.url || '').trim();
  const displayUrl = String(item?.image?.display?.url || '').trim();
  const thumbUrl = String(item?.image?.thumb?.url || '').trim();
  const originalUrl = String(
    item?.image?.original?.url || item?.image?.url || item?.imagePath || '',
  ).trim();
  const revision = buildImageRevisionToken(item, {
    activeVariant,
    processingStatus,
    processedUrl,
    displayUrl,
    thumbUrl,
  });

  if (activeVariant === 'processed') {
    return withImageRevision(displayUrl || thumbUrl || processedUrl || originalUrl, revision);
  }

  return withImageRevision(String(
    displayUrl ||
      thumbUrl ||
      originalUrl ||
      processedUrl ||
      '',
  ).trim(), revision);
}

export function getItemLightboxUrl(item) {
  const activeVariant = String(item?.image?.activeVariant || '').trim().toLowerCase();
  const processingStatus = String(item?.image?.processingStatus || '').trim().toLowerCase();
  const processedUrl = String(item?.image?.processed?.url || '').trim();
  const displayUrl = String(item?.image?.display?.url || '').trim();
  const thumbUrl = String(item?.image?.thumb?.url || '').trim();
  const originalUrl = String(
    item?.image?.original?.url || item?.image?.url || item?.imagePath || '',
  ).trim();
  const revision = buildImageRevisionToken(item, {
    activeVariant,
    processingStatus,
    processedUrl,
    displayUrl,
    thumbUrl,
  });

  if (activeVariant === 'processed') {
    return withImageRevision(
      String(displayUrl || processedUrl || originalUrl || thumbUrl || '').trim(),
      revision,
    );
  }

  return withImageRevision(
    String(displayUrl || originalUrl || processedUrl || thumbUrl || '').trim(),
    revision,
  );
}

function buildImageRevisionToken(
  item,
  { activeVariant, processingStatus, processedUrl, displayUrl, thumbUrl },
) {
  const candidates = [
    item?.image?.updatedAt,
    item?.image?.processedAt,
    item?.image?.processed?.updatedAt,
    item?.image?.display?.updatedAt,
    item?.image?.thumb?.updatedAt,
    item?.updatedAt,
    item?.lastMaintainedAt,
    activeVariant,
    processingStatus,
    processedUrl,
    displayUrl,
    thumbUrl,
  ];

  const serialized = candidates
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join('|');

  return serialized || String(item?._id || '').trim();
}

function withImageRevision(url, revision) {
  const normalizedUrl = String(url || '').trim();
  const normalizedRevision = String(revision || '').trim();
  if (!normalizedUrl || !normalizedRevision) return normalizedUrl;
  if (normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) {
    return normalizedUrl;
  }

  const hashIndex = normalizedUrl.indexOf('#');
  const baseUrl = hashIndex >= 0 ? normalizedUrl.slice(0, hashIndex) : normalizedUrl;
  const hash = hashIndex >= 0 ? normalizedUrl.slice(hashIndex) : '';
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}v=${encodeURIComponent(normalizedRevision)}${hash}`;
}

function getItemProcessingMeta(item) {
  const activeVariant = String(item?.image?.activeVariant || '').trim().toLowerCase();
  const processingStatus = String(item?.image?.processingStatus || '').trim().toLowerCase();
  const processedUrl = String(item?.image?.processed?.url || item?.image?.processed?.path || '').trim();
  const hasProcessableImage = hasProcessableImageSource(item);
  const eligibility = deriveImageProcessingEligibility({
    activeVariant,
    processingStatus,
    hasProcessedOutput: Boolean(processedUrl),
    hasProcessableImage,
  });

  return {
    ...eligibility,
    isBatchProcessable: eligibility.canProcessImage,
  };
}

export function getBatchActionEligibility(meta, mode = 'process') {
  const normalizedMode = normalizeBatchActionMode(mode);
  const safeMeta = meta || {};

  if (safeMeta.isProcessingInFlight) {
    return {
      selectable: false,
      reason: 'Image is currently processing',
    };
  }

  if (normalizedMode === 'revert') {
    if (safeMeta.canRevertImage) {
      return {
        selectable: true,
        reason: '',
      };
    }
    return {
      selectable: false,
      reason: 'Image is not processed',
    };
  }

  if (normalizedMode === 'reprocess') {
    if (!safeMeta.hasProcessableImage) {
      return {
        selectable: false,
        reason: 'No source image available',
      };
    }
    if (safeMeta.canReprocessImage) {
      return {
        selectable: true,
        reason: '',
      };
    }
    return {
      selectable: false,
      reason: 'Image is not processed yet',
    };
  }

  if (!safeMeta.hasProcessableImage) {
    return {
      selectable: false,
      reason: 'No source image available',
    };
  }

  if (safeMeta.canProcessImage) {
    return {
      selectable: true,
      reason: '',
    };
  }

  return {
    selectable: false,
    reason: 'Already processed',
  };
}

function hasProcessableImageSource(item) {
  return Boolean(
    String(
      item?.image?.original?.url ||
        item?.image?.original?.path ||
        item?.image?.display?.url ||
        item?.image?.thumb?.url ||
        item?.image?.url ||
        item?.imagePath ||
        '',
    ).trim(),
  );
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
  const keepPriorityKey = normalizeKeepPriority(item?.keepPriority);
  const keepPriorityLabel = formatKeepPriorityLabel(keepPriorityKey);
  const boxId = ownership.boxId || '';
  const boxLabel = ownership.boxLabel || '';
  const boxDescription = ownership.boxDescription || '';
  const tags = Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [];
  const ownerLabel = String(item?.primaryOwnerName || '').trim();
  const statusLabel = isGone ? 'No Longer Have' : isOrphaned ? 'Orphaned' : 'Active';
  const sourceBatchId = String(item?.sourceBatchId || '').trim();
  const sourceBatch = item?.sourceBatch && typeof item.sourceBatch === 'object'
    ? item.sourceBatch
    : null;
  const sourceBatchArchiveStatus = String(sourceBatch?.archiveStatus || '').trim().toLowerCase();
  const sourceBatchArchiveLabel =
    sourceBatchArchiveStatus === 'archived' ? 'archived batch' : sourceBatchId ? 'active batch' : '';
  const sourceBatchLabel = String(
    sourceBatch?.batchName ||
    sourceBatch?.label ||
    sourceBatch?.batchId ||
    ''
  ).trim();
  const sourceBatchDisplayLabel = sourceBatchLabel || sourceBatchId || 'Batch';
  const sourceBatchSortKey = `${String(sourceBatch?.batchId || sourceBatchId || '').trim()} ${sourceBatchDisplayLabel}`.trim();
  const processingMeta = getItemProcessingMeta(item);
  const quantityLabel =
    item?.quantity == null || item?.quantity === ''
      ? '—'
      : String(item.quantity);
  const searchText = buildItemSearchText(item, {
    categoryLabel,
    keepPriorityKey,
    keepPriorityLabel,
    ownerLabel,
    statusLabel,
    dispositionLabel,
    quantityLabel,
    tags,
    sourceBatchLabel,
    sourceBatchId,
    sourceBatchArchiveLabel,
  });

  return {
    ...item,
    _allItems: {
      ownership,
      isGone,
      isOrphaned,
      isUnassigned: !isGone && !isBoxed && !isOrphaned,
      isBoxed,
      statusLabel,
      statusTone: getStatusTone({ isGone, isOrphaned }),
      normalizedCategory,
      categoryLabel,
      tags,
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
      sourceBatchHref: sourceBatch?.batchId || sourceBatchId
        ? `/import?batch=${encodeURIComponent(sourceBatch?.batchId || sourceBatchId)}`
        : '',
      hasHistoricalBox: Boolean(!isBoxed && (boxId || boxLabel || boxDescription)),
      locationLabel: ownership.inheritedLocation || String(item?.location || '').trim(),
      orphanedAtLabel: formatDateLabel(item?.orphanedAt),
      orphanedAtMs,
      createdAtMs: parseObjectIdMs(item?._id),
      lastMaintainedAtMs: parseDateMs(item?.lastMaintainedAt),
      keepPriorityRank:
        KEEP_PRIORITY_ORDER[keepPriorityKey] ?? 5,
      keepPriorityKey,
      keepPriorityLabel,
      keepPriorityTone: keepPriorityTone(keepPriorityKey),
      ownerLabel,
      sourceBatchId,
      sourceBatch,
      sourceBatchLabel: sourceBatchDisplayLabel,
      sourceBatchSortKey,
      sourceBatchArchiveStatus,
      sourceBatchArchiveLabel,
      hasSourceBatch: Boolean(sourceBatchId),
      purchasePriceCents: Number.isFinite(item?.purchasePriceCents)
        ? item.purchasePriceCents
        : -1,
      quantityLabel,
      thumbnailUrl: getItemThumbnailUrl(item),
      lightboxImageUrl: getItemLightboxUrl(item),
      hasProcessableImage: processingMeta.hasProcessableImage,
      hasProcessedOutput: processingMeta.hasProcessedOutput,
      isAlreadyProcessed: processingMeta.isAlreadyProcessed,
      isProcessingInFlight: processingMeta.isInFlight,
      canProcessImage: processingMeta.canProcessImage,
      canReprocessImage: processingMeta.canReprocessImage,
      canRevertImage: processingMeta.canRevertImage,
      isBatchProcessable: processingMeta.isBatchProcessable,
      processingStatus: processingMeta.processingStatus,
      activeVariant: processingMeta.activeVariant,
      searchText,
    },
  };
}

function compareItemsBySort(a, b, sortBy) {
  const aMeta = a?._allItems || {};
  const bMeta = b?._allItems || {};

  if (sortBy === 'batch') {
    const byBatch = compareText(aMeta.sourceBatchSortKey, bMeta.sourceBatchSortKey);
    if (byBatch !== 0) return byBatch;
    return compareByName(a, b);
  }

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
}

export function filterAndSortItems(
  items,
  {
    statusFilter,
    filter,
    sortBy,
    searchQuery,
    batchFocused = false,
  }
) {
  const next = Array.isArray(items) ? [...items] : [];
  const normalizedSearchQuery = normalizeSearchFragment(searchQuery);

  const filtered = next.filter((item) => {
    const meta = item?._allItems;
    if (!meta) return false;

    if (
      normalizedSearchQuery &&
      !String(meta.searchText || '').includes(normalizedSearchQuery)
    ) {
      return false;
    }

    if (statusFilter === 'active' && meta.isGone) return false;
    if (statusFilter === 'gone' && !meta.isGone) return false;

    if (filter === 'boxed') return meta.isBoxed;
    if (filter === 'orphaned') return meta.isOrphaned;
    if (filter === 'consumable') return Boolean(item?.isConsumable);
    if (filter === 'nonConsumable') return !item?.isConsumable;
    if (filter === 'decommissioned') return meta.keepPriorityKey === 'decommissioned';
    if (String(filter || '').startsWith('category:')) {
      const selectedCategory = String(filter).slice('category:'.length);
      return meta.normalizedCategory === selectedCategory;
    }
    if (String(filter || '').startsWith('batch:')) {
      const selectedBatchId = String(filter).slice('batch:'.length).trim();
      return meta.sourceBatchId === selectedBatchId;
    }

    return true;
  });

  filtered.sort((a, b) => {
    if (batchFocused) {
      const byBatch = compareText(
        a?._allItems?.sourceBatchSortKey || a?._allItems?.sourceBatchId || 'zzzz-no-batch',
        b?._allItems?.sourceBatchSortKey || b?._allItems?.sourceBatchId || 'zzzz-no-batch',
      );
      if (byBatch !== 0) return byBatch;
      if (sortBy !== 'batch') {
        const withinBatch = compareItemsBySort(a, b, sortBy);
        if (withinBatch !== 0) return withinBatch;
      }
    }

    return compareItemsBySort(a, b, sortBy);
  });

  return filtered;
}
