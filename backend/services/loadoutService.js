const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');
const Item = require('../models/Item');
const Box = require('../models/Box');
require('../models/Location');
const { formatLocationName } = require('../utils/locationName');
const { itemPlacement } = require('../utils/boxCompartments');

const OCCASIONS = new Set(['camping', 'travel', 'roadtrip', 'festival', 'edc', 'emergency', 'custom']);
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const validId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

function normalizeLoadout(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Provide a valid loadout.');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 120) fail('Give your loadout a name of 1–120 characters.');
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (notes.length > 2000) fail('Notes must be 2,000 characters or fewer.');
  if (!OCCASIONS.has(body.occasion)) fail('Choose a valid occasion.');
  if (!Array.isArray(body.entries) || body.entries.length > 200) fail('A loadout can contain up to 200 entries.');
  const seenEntries = new Set();
  const seenItems = new Set();
  const entries = body.entries.map((entry) => {
    const label = typeof entry?.label === 'string' ? entry.label.trim() : '';
    if (!label || label.length > 160) fail('Each entry needs a label of 1–160 characters.');
    const id = entry.id || entry._id || String(new mongoose.Types.ObjectId());
    if (!validId(id) || seenEntries.has(id)) fail('Each checklist entry needs a unique valid ID.');
    seenEntries.add(id);
    const itemId = entry.itemId || null;
    if (itemId && (!validId(itemId) || seenItems.has(itemId))) fail('An inventory item can appear only once in this loadout.');
    if (itemId) seenItems.add(itemId);
    if (typeof entry.gathered !== 'boolean' || typeof entry.returned !== 'boolean') fail('Checklist values must be true or false.');
    if (entry.returned && !entry.gathered) fail('Gather an entry before marking it put away.');
    return { _id: id, label, itemId, gathered: entry.gathered, returned: entry.returned };
  });
  if (body.archived !== undefined && typeof body.archived !== 'boolean') fail('Invalid archive state.');
  return { name, notes, occasion: body.occasion, entries, archived: body.archived === true };
}

// Resolve placement from current inventory, including inherited locations and compartments.
// Loadouts never write to Item or Box, and a removed link remains visible as unavailable.
function inventoryContexts(items, boxes) {
  const boxesById = new Map(boxes.map(box => [String(box._id), box]));
  const boxByItem = new Map();
  boxes.forEach(box => (box.items || []).forEach(id => boxByItem.set(String(id), box)));
  return new Map(items.map(item => {
    const id = String(item._id);
    const gone = item.item_status === 'gone';
    const box = gone ? null : boxByItem.get(id);
    const visited = new Set();
    let cursor = box;
    let locationLabel = '';
    while (cursor && !visited.has(String(cursor._id))) {
      visited.add(String(cursor._id));
      locationLabel = formatLocationName(cursor.locationId) || cursor.location || '';
      if (locationLabel) break;
      cursor = boxesById.get(String(cursor.parentBox));
    }
    return [id, {
      id, name: item.name, unavailable: gone, quantity: item.quantity, missing: item.missing || { quantity: 0, revision: 0 },
      boxNumber: box?.box_id || '', boxName: box?.label || '',
      placementLabel: itemPlacement(box, item._id).placementLabel,
      locationLabel: locationLabel || item.location || '',
    }];
  }));
}

function toClient(loadout, contexts = new Map()) {
  return {
    id: String(loadout._id), name: loadout.name, notes: loadout.notes,
    occasion: loadout.occasion, revision: loadout.revision, archived: loadout.archived,
    updatedAt: loadout.updatedAt,
    entries: loadout.entries.map(entry => ({
      id: String(entry._id), label: entry.label,
      itemId: entry.itemId ? String(entry.itemId) : null,
      gathered: entry.gathered, returned: entry.returned,
      item: entry.itemId ? contexts.get(String(entry.itemId)) || { id: String(entry.itemId), name: entry.label, unavailable: true } : null,
    })),
  };
}

async function present(loadout) {
  const ids = loadout.entries.map(entry => entry.itemId).filter(Boolean);
  if (!ids.length) return toClient(loadout);
  const [items, boxes] = await Promise.all([
    Item.find({ _id: { $in: ids } }).select('_id name quantity missing item_status location').lean(),
    Box.find().select('_id box_id label parentBox location locationId items isComplexBox compartments itemCompartments')
      .populate('locationId', 'room vicinity specifics exactSpot').lean(),
  ]);
  return toClient(loadout, inventoryContexts(items, boxes));
}

async function validateNewLinks(entries, previous = []) {
  const previousIds = new Set(previous.map(entry => String(entry.itemId || '')));
  const ids = entries.map(entry => entry.itemId).filter(id => id && !previousIds.has(String(id)));
  if (!ids.length) return;
  const count = await Item.countDocuments({ _id: { $in: ids }, item_status: { $ne: 'gone' } });
  if (count !== ids.length) fail('One of the selected inventory items is no longer available. Refresh your search.', 409);
}

async function listLoadouts(archived = false) {
  const docs = await Loadout.find({ archived }).sort({ updatedAt: -1 }).lean();
  // The gallery only needs checklist counts; item context is loaded on opening a list.
  return docs.map(doc => toClient(doc));
}

async function getLoadout(id) {
  if (!validId(id)) fail('Invalid loadout ID.');
  const doc = await Loadout.findById(id).lean();
  if (!doc) fail('This loadout could not be found.', 404);
  return present(doc);
}

async function createLoadout(body) {
  const data = normalizeLoadout(body);
  await validateNewLinks(data.entries);
  return present((await Loadout.create(data)).toObject());
}

async function updateLoadout(id, body) {
  if (!validId(id)) fail('Invalid loadout ID.');
  const data = normalizeLoadout(body);
  if (!Number.isSafeInteger(body.revision) || body.revision < 0) fail('A valid revision is required.');
  const previous = await Loadout.findById(id).lean();
  if (!previous) fail('This loadout could not be found.', 404);
  await validateNewLinks(data.entries, previous.entries);
  const doc = await Loadout.findOneAndUpdate({ _id: id, revision: body.revision },
    { $set: data, $inc: { revision: 1 } }, { new: true, runValidators: true }).lean();
  if (!doc) fail('This loadout changed on another device. Reload it before saving again.', 409);
  return present(doc);
}

module.exports = { normalizeLoadout, inventoryContexts, listLoadouts, getLoadout, createLoadout, updateLoadout };
