// controllers/devController.js
const devService = require('../services/devService');

// POST /api/dev/orphan/all-items-seq
async function orphanAllItemsSequentialApi(req, res) {
  try {
    const startAt = req.body?.startAt; // optional ISO string (defaults to 2000-01-01T00:00:00Z in service)
    const result = await devService.orphanAllItemsSequential(startAt);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { orphanAllItemsSequentialApi };
