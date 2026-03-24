const { EVENT_TYPES, EventLog } = require('../models/EventLog');

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 25;

const ORPHANED_LABEL = 'Orphaned';
const FLOOR_LABEL = 'Floor';

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

function isObjectIdLike(value) {
  if (!value) return false;
  if (typeof value === 'string') return false;
  return (
    value?._bsontype === 'ObjectId' ||
    (typeof value.toHexString === 'function' && typeof value.toString === 'function')
  );
}

function toIdString(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (isObjectIdLike(value)) return String(value);
  if (typeof value === 'object' && value._id != null) return toIdString(value._id);
  return String(value);
}

function normalizeForDiff(value) {
  if (value === undefined) return '__undefined__';
  if (value === null) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isObjectIdLike(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForDiff(entry));
  }

  if (isPlainObject(value)) {
    const out = {};
    Object.keys(value)
      .sort()
      .forEach((key) => {
        out[key] = normalizeForDiff(value[key]);
      });
    return out;
  }

  return value;
}

function getValueAtPath(source, path) {
  if (!source || !path) return undefined;
  const parts = String(path).split('.');
  let cur = source;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function hasMeaningfulValueChange(beforeValue, afterValue) {
  const left = JSON.stringify(normalizeForDiff(beforeValue));
  const right = JSON.stringify(normalizeForDiff(afterValue));
  return left !== right;
}

function computeChangedFields(beforeDoc, afterDoc, candidateFields = []) {
  const uniqueFields = [];
  const seen = new Set();

  for (const rawField of candidateFields || []) {
    const field = String(rawField || '').trim();
    if (!field || seen.has(field)) continue;
    seen.add(field);
    uniqueFields.push(field);
  }

  const changed = [];
  for (const field of uniqueFields) {
    const beforeValue = getValueAtPath(beforeDoc, field);
    const afterValue = getValueAtPath(afterDoc, field);
    if (hasMeaningfulValueChange(beforeValue, afterValue)) {
      changed.push(field);
    }
  }
  return changed;
}

function toTrimmedLabel(value) {
  if (value == null) return '';
  return String(value).trim();
}

function quoteLabel(label) {
  return `"${String(label || '').replace(/"/g, '\\"')}"`;
}

function formatBoxLabel(box, fallback = FLOOR_LABEL) {
  if (!box) return fallback;
  if (typeof box === 'string') {
    const value = toTrimmedLabel(box);
    return value || fallback;
  }
  const label = toTrimmedLabel(box.label || box.name);
  if (label) return label;
  const shortId = toTrimmedLabel(box.box_id);
  if (shortId) return `Box ${shortId}`;
  const id = toTrimmedLabel(toIdString(box._id || box.id));
  return id ? `Box ${id}` : fallback;
}

function formatItemLabel(item, fallback = 'Item') {
  if (!item) return fallback;
  if (typeof item === 'string') {
    const value = toTrimmedLabel(item);
    return value || fallback;
  }
  const name = toTrimmedLabel(item.name || item.label);
  if (name) return name;
  const id = toTrimmedLabel(toIdString(item._id || item.id));
  return id ? `Item ${id}` : fallback;
}

function normalizeDetails(details) {
  if (details == null) return undefined;
  if (Array.isArray(details)) return { entries: details };
  if (!isPlainObject(details)) return { value: details };

  const out = {};
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

function sanitizeLimit(raw) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_LIMIT;
  return Math.min(parsed, MAX_PAGE_LIMIT);
}

function sanitizeOffset(raw) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

async function logEvent(payload = {}) {
  const eventType = String(payload.event_type || '').trim();
  if (!EVENT_TYPES.includes(eventType)) {
    throw new Error(`Unsupported event_type: ${eventType || '<empty>'}`);
  }

  const entityType = String(payload.entity_type || '').trim();
  if (entityType !== 'box' && entityType !== 'item') {
    throw new Error(`Unsupported entity_type: ${entityType || '<empty>'}`);
  }

  const entityId = toIdString(payload.entity_id);
  if (!entityId) throw new Error('entity_id is required');

  const summary = String(payload.summary || '').trim();
  if (!summary) throw new Error('summary is required');

  return EventLog.create({
    created_at: payload.created_at || undefined,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    entity_label: String(payload.entity_label || '').trim() || entityId,
    summary,
    details: normalizeDetails(payload.details),
  });
}

async function logEventBestEffort(payload = {}, { label = '' } = {}) {
  try {
    return await logEvent(payload);
  } catch (err) {
    const prefix = label ? ` (${label})` : '';
    console.error(`⚠️ Event log write failed${prefix}:`, err?.message || err);
    return null;
  }
}

async function getEventLogsPage({
  limit,
  offset,
  eventType,
  entityType,
  entityId,
} = {}) {
  const safeLimit = sanitizeLimit(limit);
  const safeOffset = sanitizeOffset(offset);
  const safeEventType = String(eventType || '').trim().toLowerCase();
  const safeEntityType = String(entityType || '').trim().toLowerCase();
  const safeEntityId = String(entityId || '').trim();

  if (safeEventType && !EVENT_TYPES.includes(safeEventType)) {
    throw new Error('Invalid eventType filter.');
  }

  if (safeEntityType && safeEntityType !== 'box' && safeEntityType !== 'item') {
    throw new Error('Invalid entityType filter.');
  }

  const query = {};
  if (safeEventType) query.event_type = safeEventType;
  if (safeEntityType) query.entity_type = safeEntityType;
  if (safeEntityId) query.entity_id = safeEntityId;

  const [total, entries] = await Promise.all([
    EventLog.countDocuments(query),
    EventLog.find(query)
      .sort({ created_at: -1, _id: -1 })
      .skip(safeOffset)
      .limit(safeLimit)
      .lean(),
  ]);

  return {
    entries,
    total,
    limit: safeLimit,
    offset: safeOffset,
    hasMore: safeOffset + entries.length < total,
  };
}

module.exports = {
  EVENT_TYPES,
  ORPHANED_LABEL,
  FLOOR_LABEL,
  quoteLabel,
  toIdString,
  normalizeForDiff,
  hasMeaningfulValueChange,
  computeChangedFields,
  formatBoxLabel,
  formatItemLabel,
  logEvent,
  logEventBestEffort,
  getEventLogsPage,
};
