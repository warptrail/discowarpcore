// controllers/devSeedController.js
const {
  seedFromMocks,
  wipeReservedRange,
} = require('../services/devSeedService');

async function seedNestedApi(req, res) {
  try {
    const result = await seedFromMocks();
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function deleteSeedNestedApi(req, res) {
  try {
    const result = await wipeReservedRange();
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { seedNestedApi, deleteSeedNestedApi };
