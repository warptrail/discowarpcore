// controllers/devController.js
const { orphanAllItemsSequential } = require('../services/devService');

// POST /api/dev/orphan/all-items-seq
async function orphanAllItemsSequentialApi(req, res) {
  try {
    const startAt = req.body?.startAt; // optional; service will default if undefined
    const result = await orphanAllItemsSequential(startAt); // ✅ capture the return value
    res.json(result); // ✅ return it
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = {
  orphanAllItemsSequentialApi,
};
