// controllers/devController.js
const {
  orphanAllItemsSequential,
  seedFromMocks,
  wipeReservedRange,
} = require('../services/devService');

// POST /api/dev/orphan/all-items-seq
async function orphanAllItemsSequentialApi(req, res) {
  try {
    const startAt = req.body?.startAt; // optional ISO string (defaults to 2000-01-01T00:00:00Z in service)
    orphanAllItemsSequential(startAt);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// POST /api/dev/seed-nested
async function seedNestedApi(req, res) {
  try {
    const result = await seedFromMocks();
    res.json(result);
  } catch (e) {
    const status = e.status || 400;
    res.status(status).json({ error: e.message });
  }
}

// DELETE /api/dev/seed-nested
async function deleteSeedNestedApi(req, res) {
  try {
    const result = await wipeReservedRange();
    res.json(result);
  } catch (e) {
    const status = e.status || 400;
    res.status(status).json({ error: e.message });
  }
}

module.exports = {
  orphanAllItemsSequentialApi,
  seedNestedApi,
  deleteSeedNestedApi,
};
