import { formatItemCategory } from '../../util/itemCategories';
import { formatKeepPriorityLabel } from '../../util/keepPriority';

export const DECISION_OPTIONS = [
  { value: 'pending', label: 'Pending Review', shortLabel: 'Pending', tone: 'pending' },
  { value: 'keep', label: 'Keep', shortLabel: 'Keep', tone: 'keep' },
  { value: 'toss', label: 'Toss', shortLabel: 'Toss', tone: 'toss' },
  { value: 'donate', label: 'Donate', shortLabel: 'Donate', tone: 'donate' },
  { value: 'sell', label: 'Sell', shortLabel: 'Sell', tone: 'sell' },
  { value: 'unsure', label: 'Unsure', shortLabel: 'Unsure', tone: 'unsure' },
];

export const DECISION_FILTER_OPTIONS = [
  { value: 'all', label: 'All Decisions' },
  ...DECISION_OPTIONS,
];

const DECISION_VALUES = new Set(DECISION_OPTIONS.map((option) => option.value));

export function normalizeDecision(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return DECISION_VALUES.has(normalized) ? normalized : 'pending';
}

export function getDecisionMeta(value) {
  const decision = normalizeDecision(value);
  return (
    DECISION_OPTIONS.find((option) => option.value === decision) ||
    DECISION_OPTIONS[0]
  );
}

export function createEmptyCounts() {
  return DECISION_OPTIONS.reduce(
    (counts, option) => {
      counts[option.value] = 0;
      return counts;
    },
    { total: 0 }
  );
}

export function countSessionItems(items = []) {
  const counts = createEmptyCounts();
  for (const entry of Array.isArray(items) ? items : []) {
    const decision = normalizeDecision(entry?.decision);
    counts.total += 1;
    counts[decision] += 1;
  }
  return counts;
}

export function getSessionCounts(session, fallbackItems = []) {
  const counts = session?.counts && typeof session.counts === 'object'
    ? { ...createEmptyCounts(), ...session.counts }
    : countSessionItems(fallbackItems);
  counts.total = Number(counts.total || 0);
  return counts;
}

export function getItemId(item) {
  return String(item?._id || item?.id || '').trim();
}

export function getSessionItemItem(sessionItem) {
  return sessionItem?.item && typeof sessionItem.item === 'object'
    ? sessionItem.item
    : null;
}

export function getSessionItemKey(sessionItem) {
  return String(sessionItem?._id || sessionItem?.id || sessionItem?.itemId || '').trim();
}

export function getItemName(item) {
  return String(item?.name || 'Unnamed item').trim() || 'Unnamed item';
}

export function getItemTags(item) {
  return Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [];
}

export function getItemCategoryLabel(item) {
  return String(item?.categoryLabel || formatItemCategory(item?.category)).trim();
}

export function getItemKeepPriorityLabel(item) {
  return String(
    item?.keepPriorityLabel || formatKeepPriorityLabel(item?.keepPriority) || ''
  ).trim();
}

export function getItemOwnerLabel(item) {
  return String(item?.primaryOwnerName || item?.ownerLabel || '').trim();
}

export function getItemThumbnailUrl(item) {
  return String(
    item?.thumbnailUrl ||
      item?.image?.thumb?.url ||
      item?.image?.display?.url ||
      item?.image?.processed?.url ||
      item?.image?.original?.url ||
      item?.imagePath ||
      ''
  ).trim();
}

export function getItemPreviewImageUrl(item) {
  return String(
    item?.previewImageUrl ||
      item?.thumbnailUrl ||
      item?.image?.display?.url ||
      item?.image?.processed?.url ||
      item?.image?.original?.url ||
      item?.imagePath ||
      ''
  ).trim();
}

export function getItemBoxLabel(item) {
  const box = item?.box && typeof item.box === 'object' ? item.box : null;
  if (!box) return 'No box assigned';

  return [box.box_id ? `#${box.box_id}` : '', box.label]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Assigned box';
}

export function getItemLocationLabel(item) {
  return String(
    item?.box?.locationName ||
      item?.box?.location ||
      item?.inheritedLocation ||
      item?.location ||
      ''
  ).trim();
}

export function getReviewedCount(counts) {
  return Math.max(0, Number(counts?.total || 0) - Number(counts?.pending || 0));
}
