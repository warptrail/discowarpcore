const mongoose = require('mongoose');

const Box = require('../models/Box');
const Location = require('../models/Location');
const {
  normalizeLocationName,
  locationCompareKey,
} = require('../utils/locationName');

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findByNormalizedName(normalizedName) {
  if (!normalizedName) return null;
  return Location.findOne({
    name: { $regex: new RegExp(`^${escapeRegExp(normalizedName)}$`, 'i') },
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
  return Location.find().sort({ name: 1 }).collation({ locale: 'en', strength: 2 });
}

async function createLocation({ name }) {
  const normalized = normalizeLocationName(name);
  if (!normalized) {
    throw makeHttpError(400, 'INVALID_LOCATION_NAME', 'Location name is required');
  }

  const existing = await findByNormalizedName(normalized);
  if (existing) {
    throw makeHttpError(409, 'LOCATION_EXISTS', 'Location already exists');
  }

  return Location.create({ name: normalized });
}

async function renameLocation(id, { name }) {
  if (!mongoose.isValidObjectId(id)) {
    throw makeHttpError(400, 'INVALID_LOCATION_ID', 'Invalid location id');
  }

  const normalized = normalizeLocationName(name);
  if (!normalized) {
    throw makeHttpError(400, 'INVALID_LOCATION_NAME', 'Location name is required');
  }

  const existing = await Location.findById(id);
  if (!existing) {
    throw makeHttpError(404, 'LOCATION_NOT_FOUND', 'Location not found');
  }

  const dupe = await findByNormalizedName(normalized);
  if (dupe && String(dupe._id) !== String(id)) {
    throw makeHttpError(409, 'LOCATION_EXISTS', 'Location already exists');
  }

  existing.name = normalized;
  await existing.save();

  await Box.updateMany({ locationId: existing._id }, { $set: { location: existing.name } });
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

async function resolveOrCreateLocationFromLegacyString(location) {
  const normalized = normalizeLocationName(location);
  if (!normalized) return null;

  const existing = await findByNormalizedName(normalized);
  if (existing) return existing;

  return Location.create({ name: normalized });
}

async function resolveBoxLocationFields({ locationId, location }) {
  if (locationId !== undefined) {
    if (locationId === null || String(locationId).trim() === '') {
      return { locationId: null, location: '' };
    }
    const found = await resolveLocationById(locationId);
    return { locationId: found._id, location: found.name };
  }

  if (location !== undefined) {
    const found = await resolveOrCreateLocationFromLegacyString(location);
    if (!found) return { locationId: null, location: '' };
    return { locationId: found._id, location: found.name };
  }

  return null;
}

async function backfillBoxLocations() {
  const locations = await listLocations();
  const locationByKey = new Map(
    locations.map((loc) => [locationCompareKey(loc.name), loc]),
  );
  const locationById = new Map(
    locations.map((loc) => [String(loc._id), loc]),
  );

  const boxes = await Box.find()
    .select('_id location locationId')
    .lean();

  if (!boxes.length) {
    return { scanned: 0, linked: 0, createdLocations: 0, syncedNames: 0 };
  }

  let createdLocations = 0;
  const ops = [];

  for (const box of boxes) {
    const currentLocationId = box.locationId ? String(box.locationId) : '';
    const legacyName = normalizeLocationName(box.location);

    if (currentLocationId) {
      const mapped = locationById.get(currentLocationId);
      if (mapped && legacyName !== mapped.name) {
        ops.push({
          updateOne: {
            filter: { _id: box._id },
            update: { $set: { location: mapped.name } },
          },
        });
      } else if (!mapped && legacyName) {
        const key = locationCompareKey(legacyName);
        let loc = locationByKey.get(key);
        if (!loc) {
          loc = await Location.create({ name: legacyName });
          createdLocations += 1;
          locationByKey.set(key, loc);
          locationById.set(String(loc._id), loc);
        }
        ops.push({
          updateOne: {
            filter: { _id: box._id },
            update: { $set: { locationId: loc._id, location: loc.name } },
          },
        });
      }
      continue;
    }

    if (!legacyName) continue;

    const key = locationCompareKey(legacyName);
    let loc = locationByKey.get(key);
    if (!loc) {
      loc = await Location.create({ name: legacyName });
      createdLocations += 1;
      locationByKey.set(key, loc);
      locationById.set(String(loc._id), loc);
    }

    ops.push({
      updateOne: {
        filter: { _id: box._id },
        update: { $set: { locationId: loc._id, location: loc.name } },
      },
    });
  }

  if (ops.length) {
    await Box.bulkWrite(ops, { ordered: false });
  }

  const linked = ops.filter((op) => op.updateOne.update.$set.locationId).length;
  const syncedNames = ops.length - linked;

  return {
    scanned: boxes.length,
    linked,
    syncedNames,
    createdLocations,
  };
}

module.exports = {
  listLocations,
  createLocation,
  renameLocation,
  deleteLocation,
  resolveBoxLocationFields,
  backfillBoxLocations,
};
