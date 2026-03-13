const {
  listLocations,
  createLocation,
  renameLocation,
  deleteLocation,
} = require('../services/locationService');

function handleLocationError(res, err, fallback = 'Location request failed') {
  if (err?.status) {
    return res.status(err.status).json({
      ok: false,
      error: err.message || fallback,
      code: err.code,
      ...(Number.isFinite(err.inUseCount) ? { inUseCount: err.inUseCount } : {}),
    });
  }

  console.error('❌ Location controller error:', err);
  return res.status(500).json({ ok: false, error: fallback });
}

async function listLocationsApi(_req, res) {
  try {
    const locations = await listLocations();
    return res.json({ ok: true, locations });
  } catch (err) {
    return handleLocationError(res, err, 'Failed to list locations');
  }
}

async function createLocationApi(req, res) {
  try {
    const location = await createLocation({ name: req.body?.name });
    return res.status(201).json({ ok: true, location });
  } catch (err) {
    return handleLocationError(res, err, 'Failed to create location');
  }
}

async function renameLocationApi(req, res) {
  try {
    const location = await renameLocation(req.params.id, { name: req.body?.name });
    return res.json({ ok: true, location });
  } catch (err) {
    return handleLocationError(res, err, 'Failed to rename location');
  }
}

async function deleteLocationApi(req, res) {
  try {
    const result = await deleteLocation(req.params.id);
    return res.json({ ok: true, ...result });
  } catch (err) {
    return handleLocationError(res, err, 'Failed to delete location');
  }
}

module.exports = {
  listLocationsApi,
  createLocationApi,
  renameLocationApi,
  deleteLocationApi,
};
