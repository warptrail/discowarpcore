const mongoose = require('mongoose');

const Box = require('../models/Box');
const Location = require('../models/Location');
const {
  normalizeLocationStructure,
} = require('../utils/locationName');

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findByStructure(structure) {
  const normalized = normalizeLocationStructure(structure);
  if (!normalized.room) return null;
  return Location.findOne({
    room: { $regex: new RegExp(`^${escapeRegExp(normalized.room)}$`, 'i') },
    vicinity: { $regex: new RegExp(`^${escapeRegExp(normalized.vicinity)}$`, 'i') },
    specifics: { $regex: new RegExp(`^${escapeRegExp(normalized.specifics)}$`, 'i') },
  });
}

function makeHttpError(status, code, message, extra = {}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  Object.assign(err, extra);
  return err;
}

async function listLocations() {
  return Location.find()
    .sort({ room: 1, vicinity: 1, specifics: 1 })
    .collation({ locale: 'en', strength: 2 });
}

function normalizeLocationInput(input = {}) {
  const source = input?.location ?? input;
  const structure = normalizeLocationStructure(source);
  if (!structure.room) {
    throw makeHttpError(400, 'INVALID_LOCATION_ROOM', 'Room is required');
  }
  if (structure.specifics && !structure.vicinity) {
    throw makeHttpError(400, 'INVALID_LOCATION_HIERARCHY', 'Specifics requires a vicinity');
  }
  return structure;
}

async function createLocation(input) {
  const normalized = normalizeLocationInput(input);
  const existing = await findByStructure(normalized);
  if (existing) {
    throw makeHttpError(409, 'LOCATION_EXISTS', 'Location already exists');
  }

  return Location.create(normalized);
}

async function renameLocation(id, input) {
  if (!mongoose.isValidObjectId(id)) {
    throw makeHttpError(400, 'INVALID_LOCATION_ID', 'Invalid location id');
  }

  const normalized = normalizeLocationInput(input);

  const existing = await Location.findById(id);
  if (!existing) {
    throw makeHttpError(404, 'LOCATION_NOT_FOUND', 'Location not found');
  }

  const dupe = await findByStructure(normalized);
  if (dupe && String(dupe._id) !== String(id)) {
    throw makeHttpError(409, 'LOCATION_EXISTS', 'Location already exists');
  }

  existing.set(normalized);
  await existing.save();

  return existing;
}

async function deleteLocation(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw makeHttpError(400, 'INVALID_LOCATION_ID', 'Invalid location id');
  }

  const existing = await Location.findById(id).lean();
  if (!existing) {
    throw makeHttpError(404, 'LOCATION_NOT_FOUND', 'Location not found');
  }

  const inUseCount = await Box.countDocuments({ locationId: id });
  if (inUseCount > 0) {
    throw makeHttpError(
      409,
      'LOCATION_IN_USE',
      `Location is in use by ${inUseCount} box${inUseCount === 1 ? '' : 'es'}`,
      { inUseCount },
    );
  }

  await Location.deleteOne({ _id: id });
  return { deleted: true, id: String(id) };
}

async function resolveLocationById(locationId) {
  if (!locationId) return null;
  if (!mongoose.isValidObjectId(locationId)) {
    throw makeHttpError(400, 'INVALID_LOCATION_ID', 'Invalid location id');
  }

  const location = await Location.findById(locationId);
  if (!location) {
    throw makeHttpError(404, 'LOCATION_NOT_FOUND', 'Location not found');
  }
  return location;
}

async function resolveBoxLocationFields({ locationId }) {
  if (locationId !== undefined) {
    if (locationId === null || String(locationId).trim() === '') {
      return { locationId: null };
    }
    const found = await resolveLocationById(locationId);
    return { locationId: found._id };
  }

  return null;
}

async function backfillBoxLocations() {
  return { skipped: true, reason: 'legacy location migration retired' };
}

module.exports = {
  listLocations,
  createLocation,
  renameLocation,
  deleteLocation,
  normalizeLocationInput,
  resolveBoxLocationFields,
  backfillBoxLocations,
};
