import { getImportBatchHref } from '../../api/intakeBatches';
import { formatItemCategory, normalizeItemCategory } from '../../util/itemCategories';
import { formatKeepPriorityLabel, normalizeKeepPriority } from '../../util/keepPriority';
import { getItemOwnershipContext } from '../../util/itemOwnership';
import { getAnswerPlacement } from '../InventoryQuickAnswer/answerPlacement';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function toText(value) {
  return String(value ?? '').trim();
}

function firstText(...values) {
  for (const value of values) {
    const text = toText(value);
    if (text) return text;
  }
  return '';
}

function humanize(value) {
  const text = toText(value).replace(/[_-]+/g, ' ');
  if (!text) return '—';
  return text.replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function latestDate(primaryValue, history) {
  if (primaryValue) return primaryValue;
  if (!Array.isArray(history) || !history.length) return null;
  return history[history.length - 1];
}

function normalizeEventDates(history, fallbackValue) {
  const values = Array.isArray(history) ? [...history] : [];
  if (fallbackValue) values.push(fallbackValue);

  const seen = new Set();
  return values.reduce((dates, value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return dates;
    const iso = date.toISOString();
    if (seen.has(iso)) return dates;
    seen.add(iso);
    dates.push({ date, iso, timestamp: date.getTime() });
    return dates;
  }, []);
}

function normalizeLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => ({
      label: toText(link?.label),
      url: toText(link?.url),
    }))
    .filter((link) => link.label && link.url);
}

function formatSourceBatch(sourceBatch, sourceBatchId) {
  const batch = sourceBatch && typeof sourceBatch === 'object' ? sourceBatch : null;
  const id = firstText(batch?.batchId, batch?.id, sourceBatchId);
  const label = firstText(batch?.batchName, batch?.label, id);
  return {
    id,
    label,
    href: id ? getImportBatchHref(id) : '',
  };
}

const EDITABLE_LABELS = {
  Name: 'name', Description: 'description', Notes: 'notes', Category: 'category', Tags: 'tags',
  Quantity: 'quantity', 'Estimated Value': 'value', 'Purchase Price': 'purchase-price',
  Consumable: 'consumable', Location: 'location', 'Keep Priority': 'keep-priority',
  'Primary Owner': 'primary-owner', Condition: 'condition', 'Acquisition Type': 'acquisition-type',
  'Date Acquired': 'date-acquired', 'Use History': 'usage-history', 'Check History': 'check-history',
  'Maintenance History': 'maintenance-history', 'Maintenance Notes': 'maintenance-notes',
  'External Links': 'external-links',
};

// Summary IDs are database IDs; only recorded physical IDs identify a box.
export function buildRetrievalItemAnswer(summary, detail = null) {
  const ownership = getItemOwnershipContext(detail || {});
  const full = detail && typeof detail === 'object' ? detail : {};
  const hasFullPlacement = detail && ('box' in detail || 'orphanedAt' in detail || 'breadcrumb' in detail);
  const unboxed = hasFullPlacement ? !ownership.isBoxed : !firstText(summary?.boxNumber, summary?.placementLabel);
  const box = unboxed ? null : ownership.box;
  const location = hasFullPlacement
    ? (unboxed ? full.location : ownership.effectiveLocation)
    : summary?.locationLabel;
  const recordedLocation = /^(unknown|orphaned)$/i.test(toText(location)) ? '' : toText(location);
  const placement = getAnswerPlacement({ ...(box || (unboxed ? full : {})), location: recordedLocation }, new Map());
  const boxTrail = (Array.isArray(full.breadcrumb) ? full.breadcrumb : [])
    .map((node) => ({ id: firstText(node?.box_id, node?.boxId), label: firstText(node?.label, node?.name) }))
    .filter((node) => node.id || node.label);
  return {
    id: firstText(full._id, full.id, summary?.id), name: firstText(full.name, summary?.name, 'Unnamed item'),
    item: { ...full, description: full.description ?? summary?.description ?? '', notes: full.notes ?? summary?.notes ?? '',
      category: formatItemCategory(full.category ?? summary?.categoryKey), tags: full.tags ?? summary?.tags ?? [],
      primaryOwnerName: full.primaryOwnerName ?? summary?.primaryOwnerName,
      keepPriority: formatKeepPriorityLabel(full.keepPriority ?? summary?.keepPriority), location: full.location || '' },
    box, boxId: unboxed ? '' : firstText(ownership.placementLabel, summary?.placementLabel, ownership.boxId, summary?.boxNumber),
    boxLabel: unboxed ? '' : firstText(ownership.boxLabel, summary?.boxName),
    boxRecordId: unboxed ? '' : firstText(ownership.boxMongoId, summary?.boxId),
    placement, boxTrail, path: placement.path, unboxed,
  };
}

// PATCH responses can contain an unpopulated box reference. Keep fetched placement
// while updating the edited record and the visible search summary together.
export function applyRetrievalItemUpdate(summary, detail, updated) {
  const full = { ...(detail || {}), ...(updated || {}) };
  if (detail?.box && updated?.box && typeof updated.box !== 'object'
    && String(updated.box) === String(detail.box._id || detail.box.id)) full.box = detail.box;
  const answer = buildRetrievalItemAnswer(summary, full);
  const nextSummary = { ...summary,
    ...Object.fromEntries(['name', 'description', 'notes', 'tags', 'keepPriority', 'primaryOwnerName', 'isConsumable',
      'usageHistory', 'checkHistory', 'maintenanceHistory'].filter((key) => key in full).map((key) => [key, full[key]])),
    categoryKey: normalizeItemCategory(full.category ?? summary.categoryKey),
    categoryLabel: formatItemCategory(full.category ?? summary.categoryKey),
    keepPriorityLabel: formatKeepPriorityLabel(full.keepPriority ?? summary.keepPriority),
  };
  if (answer.unboxed && 'location' in full) {
    nextSummary.locationLabel = toText(full.location) || 'Unknown';
    nextSummary.locationPath = nextSummary.locationLabel;
  }
  return { detail: full, summary: nextSummary };
}

export function getRetrievalItemControlModel(resolvedItem, fullItem) {
  const answer = buildRetrievalItemAnswer(resolvedItem, fullItem);
  const description = toText(fullItem?.description ?? resolvedItem?.description);
  const tags = (fullItem?.tags ?? resolvedItem?.tags ?? []).map(toText).filter(Boolean);
  const boxNumber = answer.boxId;
  const externalLinks = normalizeLinks(fullItem?.links);
  const sourceBatch = formatSourceBatch(fullItem?.sourceBatch, fullItem?.sourceBatchId);
  const isConsumable = Boolean(fullItem?.isConsumable ?? resolvedItem?.isConsumable);
  const lifecycleHistories = ({
    usage: Array.isArray(fullItem?.usageHistory)
      ? fullItem.usageHistory
      : Array.isArray(resolvedItem?.usageHistory)
        ? resolvedItem.usageHistory
        : [],
    checks: Array.isArray(fullItem?.checkHistory)
      ? fullItem.checkHistory
      : Array.isArray(resolvedItem?.checkHistory)
        ? resolvedItem.checkHistory
        : [],
    maintenance: Array.isArray(fullItem?.maintenanceHistory)
      ? fullItem.maintenanceHistory
      : Array.isArray(resolvedItem?.maintenanceHistory)
        ? resolvedItem.maintenanceHistory
        : [],
  });

  const logProvenance = (() => {
    const entries = [];
    if (fullItem?.acquisitionType && fullItem.acquisitionType !== 'unknown') {
      entries.push({ label: 'Acquisition', value: humanize(fullItem.acquisitionType) });
    }
    if (toText(fullItem?.source)) {
      entries.push({ label: 'Source', value: humanize(fullItem.source) });
    }
    if (sourceBatch.label) {
      entries.push({
        label: 'Source Batch',
        value: sourceBatch.label,
        href: sourceBatch.href,
      });
    }
    return entries;
  })();

  const logEvents = (() => {
    const events = [];
    const appendEvents = (history, fallbackValue, tone, label) => {
      normalizeEventDates(history, fallbackValue).forEach((entry) => {
        events.push({
          ...entry,
          key: `${tone}-${entry.iso}`,
          tone,
          label,
        });
      });
    };

    appendEvents(
      lifecycleHistories.usage,
      firstText(fullItem?.dateLastUsed, resolvedItem?.dateLastUsed),
      'used',
      'Used',
    );
    appendEvents(
      lifecycleHistories.checks,
      firstText(fullItem?.lastCheckedAt, resolvedItem?.lastCheckedAt),
      'checked',
      'Checked',
    );
    appendEvents(
      lifecycleHistories.maintenance,
      firstText(fullItem?.lastMaintainedAt, resolvedItem?.lastMaintainedAt),
      'maintained',
      isConsumable ? 'Consumed / serviced' : 'Maintained',
    );
    appendEvents([], firstText(fullItem?.dateAcquired, resolvedItem?.dateAcquired), 'acquired', 'Acquired');

    return events.sort((left, right) => right.timestamp - left.timestamp);
  })();

  const dataPages = (() => {
    const ownership = getItemOwnershipContext(fullItem || {});
    const box = ownership.box || fullItem?.box || null;
    const keepPriority = normalizeKeepPriority(
      fullItem?.keepPriority ?? resolvedItem?.keepPriority,
    );
    const keepPriorityLabel = formatKeepPriorityLabel(
      fullItem?.keepPriority ?? resolvedItem?.keepPriorityLabel ?? keepPriority,
    );
    const categoryValue = fullItem?.category ?? resolvedItem?.categoryKey;
    const categoryLabel = categoryValue
      ? formatItemCategory(normalizeItemCategory(categoryValue))
      : firstText(resolvedItem?.categoryLabel);
    const placementState = answer.unboxed
      ? 'Orphaned'
      : 'Assigned';
    const usageHistory = lifecycleHistories.usage;
    const checkHistory = lifecycleHistories.checks;
    const maintenanceHistory = lifecycleHistories.maintenance;
    const tagsValue = tags.length ? tags.join(' · ') : '—';
    const linksValue = externalLinks.length
      ? externalLinks.map((link) => link.label).join(' · ')
      : '—';
    const sourceValue = firstText(fullItem?.source, resolvedItem?.source) || '—';
    const boxValue = boxNumber || box?.label
      ? [boxNumber ? `#${boxNumber}` : '', box?.label || resolvedItem?.boxName || '']
        .filter(Boolean)
        .join(' · ')
      : '—';
    const historyValue = (history) => history.length
      ? history.map(formatDate).join(' · ')
      : '—';
    const itemName = firstText(fullItem?.name, resolvedItem?.name) || '—';
    const descriptionValue = toText(fullItem?.description ?? resolvedItem?.description) || '—';
    const locationValue = answer.placement.path.join(' · ') || '—';
    const valueValue = fullItem?.valueCents != null && Number.isFinite(Number(fullItem.valueCents))
      ? usdFormatter.format(fullItem.valueCents / 100)
      : fullItem?.value != null && Number.isFinite(Number(fullItem.value))
        ? usdFormatter.format(Number(fullItem.value))
        : '—';
    const purchasePriceValue = fullItem?.purchasePriceCents != null && Number.isFinite(Number(fullItem.purchasePriceCents))
      ? usdFormatter.format(Number(fullItem.purchasePriceCents) / 100)
      : '—';
    const dateAcquiredValue = formatDate(fullItem?.dateAcquired || resolvedItem?.dateAcquired);
    const sourceBatchRecord = firstText(fullItem?.sourceBatchId, resolvedItem?.sourceBatchId) || '—';
    const sourceBatchStatus = firstText(fullItem?.sourceBatch?.archiveStatus) || '—';
    const page = (key, label, rows) => ({ key, label, rows: rows.map((row) => ({ ...row, fieldKey: EDITABLE_LABELS[row.label] || '' })) });

    return [
      page('identity', 'Identity', [
        { label: 'Name', value: itemName },
        { label: 'Description', value: descriptionValue },
        { label: 'Notes', value: toText(fullItem?.notes ?? resolvedItem?.notes) || '—' },
        { label: 'Category', value: categoryLabel || '—' },
        { label: 'Tags', value: tagsValue },
        { label: 'Inventory State', value: humanize(fullItem?.item_status || 'active') },
        { label: 'Placement State', value: placementState },
      ]),
      page('inventory', 'Inventory', [
        { label: 'Quantity', value: fullItem?.quantity != null && Number.isFinite(Number(fullItem.quantity)) ? String(fullItem.quantity) : '—' },
        { label: 'Estimated Value', value: valueValue },
        { label: 'Purchase Price', value: purchasePriceValue },
        { label: 'Consumable', value: isConsumable ? 'Yes' : 'No' },
        { label: 'Declutter Readiness', value: humanize(fullItem?.declutterReadiness) },
        { label: 'Declutter State', value: humanize(fullItem?.declutterExitState) },
      ]),
      page('placement', 'Placement', [
        { label: 'Assignment', value: placementState },
        { label: 'Box', value: boxValue },
        { label: 'Location', value: locationValue },
        { label: 'Depth', value: fullItem?.depth ?? '—' },
        { label: 'Top Box', value: fullItem?.topBox?.label || fullItem?.topBox?.box_id || '—' },
        { label: 'Orphaned At', value: formatDate(fullItem?.orphanedAt) },
      ]),
      page('retention', 'Retention', [
        { label: 'Keep Priority', value: keepPriorityLabel || '—' },
        { label: 'Primary Owner', value: firstText(fullItem?.primaryOwnerName, resolvedItem?.primaryOwnerName) || '—' },
        { label: 'Condition', value: humanize(fullItem?.condition) },
        { label: 'Acquisition Type', value: humanize(fullItem?.acquisitionType) },
        { label: 'Date Acquired', value: dateAcquiredValue },
      ]),
      page('activity', 'Activity', [
        { label: 'Last Used', value: formatDate(latestDate(fullItem?.dateLastUsed, usageHistory)) },
        { label: 'Last Checked', value: formatDate(latestDate(fullItem?.lastCheckedAt, checkHistory)) },
        { label: 'Use History', value: historyValue(usageHistory) },
        { label: 'Check History', value: historyValue(checkHistory) },
        { label: 'Average Interval', value: Number.isFinite(fullItem?.avgUseIntervalDays) ? `${fullItem.avgUseIntervalDays} days` : '—' },
        { label: 'Disposition', value: humanize(fullItem?.disposition) },
        { label: 'Disposition At', value: formatDate(fullItem?.disposition_at) },
        { label: 'Disposition Notes', value: firstText(fullItem?.disposition_notes) || '—' },
      ]),
      page('care', 'Care', [
        { label: 'Last Maintained', value: formatDate(latestDate(fullItem?.lastMaintainedAt, maintenanceHistory)) },
        { label: 'Maintenance Interval', value: Number.isFinite(fullItem?.maintenanceIntervalDays) ? `${fullItem.maintenanceIntervalDays} days` : '—' },
        { label: 'Maintenance History', value: historyValue(maintenanceHistory) },
        { label: 'Maintenance Notes', value: firstText(fullItem?.maintenanceNotes) || '—' },
      ]),
      page('provenance', 'Provenance', [
        { label: 'Source', value: sourceValue },
        { label: 'Source Batch', value: sourceBatch.label || '—' },
        { label: 'Source Batch Record', value: sourceBatchRecord },
        { label: 'Batch Status', value: sourceBatchStatus },
        { label: 'Batch Imported', value: formatDate(fullItem?.sourceBatch?.importedAt) },
        { label: 'Batch Archived', value: formatDate(fullItem?.sourceBatch?.archivedAt) },
        { label: 'External Links', value: linksValue },
      ]),
      page('admin', 'Admin', [
        { label: 'Item ID', value: fullItem?._id || resolvedItem?.id || '—' },
        { label: 'Image Path', value: firstText(fullItem?.imagePath) || '—' },
        { label: 'Created', value: formatDate(fullItem?.createdAt || fullItem?.created_at) },
        { label: 'Updated', value: formatDate(fullItem?.updatedAt || fullItem?.updated_at) },
      ]),
    ];
  })();

  const lifecycleTelemetry = (() => {
    const telemetry = [
      {
        label: 'Latest Used',
        value: formatDate(latestDate(fullItem?.dateLastUsed, lifecycleHistories.usage)),
      },
      { label: 'Use Events', value: String(lifecycleHistories.usage.length) },
      {
        label: 'Latest Checked',
        value: formatDate(latestDate(fullItem?.lastCheckedAt, lifecycleHistories.checks)),
      },
      { label: 'Check Events', value: String(lifecycleHistories.checks.length) },
      {
        label: 'Latest Maintained',
        value: formatDate(latestDate(fullItem?.lastMaintainedAt, lifecycleHistories.maintenance)),
      },
      { label: 'Service Events', value: String(lifecycleHistories.maintenance.length) },
    ];

    if (Number.isFinite(fullItem?.maintenanceIntervalDays)) {
      telemetry.push({
        label: 'Maintenance Interval',
        value: `${fullItem.maintenanceIntervalDays} days`,
      });
    }
    if (Number.isFinite(fullItem?.avgUseIntervalDays)) {
      telemetry.push({
        label: 'Average Use Interval',
        value: `${fullItem.avgUseIntervalDays} days`,
      });
    }
    return telemetry;
  })();


  return { answer, description, tags, isConsumable, logProvenance, logEvents,
    externalLinks, dataPages, lifecycleTelemetry };
}

export { formatDate };
