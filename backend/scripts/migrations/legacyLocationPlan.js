const { createHash } = require('node:crypto');
const { BSON, ObjectId } = require('mongoose').mongo;
const {
  normalizeLocationPart, normalizeLocationStructure, locationStructureKey, formatLocationName,
} = require('../../utils/locationName');

const FIELDS = ['room', 'vicinity', 'specifics', 'exactSpot'];
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const labelKey = (value) => normalizeLocationPart(value).toLowerCase();
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
  }
  return value;
}
const serialize = (value) => JSON.stringify(sortKeys(BSON.EJSON.serialize(value, { relaxed: false })));
const sorted = (rows) => [...rows].sort((a, b) => String(a._id).localeCompare(String(b._id)));
const equal = (left, right) => serialize(left) === serialize(right);

function validatePath(value) {
  if (!value || typeof value !== 'object' || FIELDS.some((field) => value[field] != null && typeof value[field] !== 'string')) {
    throw new Error('Location tiers must be strings');
  }
  const path = normalizeLocationStructure(value);
  if (!path.room || (path.specifics && !path.vicinity) || (path.exactSpot && !path.specifics)) {
    throw new Error('Invalid Room → Vicinity → Specifics → Exact Spot path');
  }
  return path;
}

function compileMappings(manifest) {
  if (Number(manifest?.version) !== 1 || !Array.isArray(manifest.entries)) throw new Error('Invalid mapping manifest version');
  const mappings = new Map();
  for (const entry of manifest.entries) {
    const source = labelKey(entry.source);
    const target = validatePath(entry.target);
    if (!source || source === 'unknown') throw new Error('Unknown/empty locations cannot receive an invented path');
    for (const key of [source, labelKey(formatLocationName(target))]) {
      const existing = mappings.get(key);
      if (existing && locationStructureKey(existing.target) !== locationStructureKey(target)) {
        throw new Error(`Conflicting mapping for ${key}`);
      }
      mappings.set(key, { target, reason: entry.reason || 'Explicit mapping' });
    }
  }
  return mappings;
}

function fingerprint(snapshot, manifest) {
  return createHash('sha256').update(serialize({ manifest,
    locations: sorted(snapshot.locations), boxes: sorted(snapshot.boxes), items: sorted(snapshot.items),
    indexes: [...snapshot.indexes].sort((a, b) => a.name.localeCompare(b.name)),
  })).digest('hex');
}

function fieldState(document, fields) {
  return Object.fromEntries(fields.map((field) => [field, has(document, field)
    ? { present: true, value: document[field] } : { present: false }]));
}

function withFields(document, state) {
  const result = { ...document };
  for (const [field, saved] of Object.entries(state)) {
    if (saved.present) result[field] = saved.value;
    else delete result[field];
  }
  return result;
}

function fieldFilter(id, state) {
  const clauses = [{ _id: id }];
  for (const [field, saved] of Object.entries(state)) {
    clauses.push(saved.present ? { [field]: { $exists: true, $eq: saved.value } } : { [field]: { $exists: false } });
  }
  return { $and: clauses };
}

function fieldUpdate(state) {
  const $set = {}, $unset = {};
  for (const [field, saved] of Object.entries(state)) {
    if (saved.present) $set[field] = saved.value;
    else $unset[field] = '';
  }
  return { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) };
}

function buildPlan(snapshot, manifest, { now = new Date(), newId = () => new ObjectId() } = {}) {
  const mappings = compileMappings(manifest);
  const conflicts = [], paths = new Map(), byId = new Map(), inserts = [], changes = [], mappingUses = new Map();
  for (const location of snapshot.locations) {
    try {
      const target = validatePath(location);
      const key = locationStructureKey(target);
      if (paths.has(key)) throw new Error('Duplicate normalized registered path');
      paths.set(key, location);
      byId.set(String(location._id), location);
    } catch (error) { conflicts.push({ collection: 'locations', id: String(location._id), reason: error.message }); }
  }
  function resolve(label, collection, document) {
    const normalized = labelKey(label);
    if (!normalized || normalized === 'unknown') return null;
    const mapping = mappings.get(normalized);
    // Existing canonical labels are safe even when not in the legacy manifest.
    const registered = [...paths.values()].find((location) => labelKey(formatLocationName(location)) === normalized);
    if (!mapping && !registered) {
      conflicts.push({ collection, id: String(document._id), label, reason: 'Unmapped legacy label; review the manifest before writing' });
      return null;
    }
    const target = mapping?.target || validatePath(registered);
    const key = locationStructureKey(target);
    let location = paths.get(key);
    if (!location) {
      location = { _id: newId(), ...target, createdAt: now, updatedAt: now, __v: 0 };
      inserts.push(location);
      paths.set(key, location);
    }
    const useKey = `${normalized}\u001f${key}`;
    const use = mappingUses.get(useKey) || { source: normalizeLocationPart(label), target: validatePath(location), boxes: 0, items: 0,
      reason: mapping?.reason || 'Already registered canonical path' };
    use[collection] += 1;
    mappingUses.set(useKey, use);
    return location;
  }
  for (const box of snapshot.boxes) {
    const fields = ['location', 'locationId'];
    const before = fieldState(box, fields);
    let location = null;
    if (box.locationId != null) {
      location = byId.get(String(box.locationId));
      if (!location) { conflicts.push({ collection: 'boxes', id: String(box._id), reason: 'Dangling locationId' }); continue; }
      if (labelKey(box.location) && labelKey(box.location) !== 'unknown') {
        const legacy = resolve(box.location, 'boxes', box);
        if (legacy && locationStructureKey(legacy) !== locationStructureKey(location)) {
          conflicts.push({ collection: 'boxes', id: String(box._id), reason: 'Legacy string disagrees with the existing structured assignment' });
          continue;
        }
      }
    } else location = resolve(box.location, 'boxes', box);
    if (!location) continue;
    const after = { location: { present: false }, locationId: { present: true, value: location._id } };
    if (!equal(before, after)) changes.push({ collection: 'boxes', id: box._id, before, after });
  }
  for (const item of snapshot.items) {
    const location = resolve(item.location, 'items', item);
    if (!location) continue;
    const before = fieldState(item, ['location']);
    const after = { location: { present: true, value: formatLocationName(location) } };
    if (!equal(before, after)) changes.push({ collection: 'items', id: item._id, before, after });
  }
  return { version: 1, fingerprint: fingerprint(snapshot, manifest), conflicts, inserts, changes,
    mappings: [...mappingUses.values()].sort((a, b) => a.source.localeCompare(b.source)),
    counts: { boxes: snapshot.boxes.length, items: snapshot.items.length, locations: snapshot.locations.length },
    pending: { locations: inserts.length, boxes: changes.filter((entry) => entry.collection === 'boxes').length,
      items: changes.filter((entry) => entry.collection === 'items').length },
    unknown: { boxes: snapshot.boxes.filter((box) => !box.locationId && (!labelKey(box.location) || labelKey(box.location) === 'unknown')).length,
      items: snapshot.items.filter((item) => !labelKey(item.location) || labelKey(item.location) === 'unknown').length },
  };
}

function expectedSnapshot(before, plan) {
  const result = { ...before, locations: [...before.locations, ...plan.inserts] };
  for (const collection of ['boxes', 'items']) {
    const changes = new Map(plan.changes.filter((change) => change.collection === collection).map((change) => [String(change.id), change]));
    result[collection] = before[collection].map((document) => {
      const change = changes.get(String(document._id));
      return change ? withFields(document, change.after) : document;
    });
  }
  return result;
}

function sameSnapshot(left, right) {
  return ['locations', 'boxes', 'items'].every((collection) => equal(sorted(left[collection]), sorted(right[collection])))
    && equal([...left.indexes].sort((a, b) => a.name.localeCompare(b.name)), [...right.indexes].sort((a, b) => a.name.localeCompare(b.name)));
}

// A rollback tolerates a partially applied plan but never overwrites later edits.
function assertRollbackSafe(current, saved, plan) {
  const expected = expectedSnapshot(saved, plan);
  for (const collection of ['boxes', 'items']) {
    const afterById = new Map(expected[collection].map((document) => [String(document._id), document]));
    const beforeById = new Map(saved[collection].map((document) => [String(document._id), document]));
    if (current[collection].length !== beforeById.size) throw new Error(`Rollback refused: ${collection} record count changed`);
    for (const document of current[collection]) {
      const id = String(document._id);
      if (!equal(document, beforeById.get(id)) && !equal(document, afterById.get(id))) {
        throw new Error(`Rollback refused: ${collection}/${id} has unrelated or later edits`);
      }
    }
  }
  const originals = new Map(saved.locations.map((document) => [String(document._id), document]));
  const inserted = new Map(plan.inserts.map((document) => [String(document._id), document]));
  for (const document of current.locations) {
    if (!equal(document, originals.get(String(document._id)) || inserted.get(String(document._id)))) {
      throw new Error('Rollback refused: location registry changed');
    }
    originals.delete(String(document._id));
  }
  if (originals.size || !equal([...current.indexes].sort((a, b) => a.name.localeCompare(b.name)),
    [...saved.indexes].sort((a, b) => a.name.localeCompare(b.name)))) {
    throw new Error('Rollback refused: original locations or indexes changed');
  }
}

module.exports = { buildPlan, compileMappings, fingerprint, expectedSnapshot, sameSnapshot, assertRollbackSafe,
  fieldState, fieldFilter, fieldUpdate, equal };
