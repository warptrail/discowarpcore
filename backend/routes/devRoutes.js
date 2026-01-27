// routes/devRoutes.js
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const mockData = require('../mock_data.json');

const { orphanAllItemsSequentialApi } = require('../controllers/devController');

// Orphan every item, 1-second apart starting at startAt (optional)
router.post('/orphan/all-items-seq', orphanAllItemsSequentialApi);

// PATCH /api/tools/backfill-items?key=dev123
// Helper: pick random element(s)
function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randSubset(arr, max = 3) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * max) + 1);
}

// PATCH /api/tools/backfill-items?key=dev123
router.patch('/backfill-items', async (req, res) => {
  try {
    if (req.query.key !== 'dev123') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    const items = await Item.find();

    for (const item of items) {
      // Date acquired
      if (!item.dateAcquired) {
        const yearsAgo = Math.floor(Math.random() * 5) + 1;
        const date = new Date();
        date.setFullYear(date.getFullYear() - yearsAgo);
        item.dateAcquired = date.toISOString();
      }

      // Usage history
      if (!item.usageHistory || item.usageHistory.length === 0) {
        const history = [];
        const numUses = Math.floor(Math.random() * 6) + 2; // 2–7
        const start = new Date(item.dateAcquired);

        for (let i = 0; i < numUses; i++) {
          const d = new Date(
            start.getTime() + Math.random() * (Date.now() - start.getTime()),
          );
          history.push(d.toISOString());
        }
        history.sort();
        item.usageHistory = history;
      }

      // Last used = most recent history
      item.dateLastUsed =
        item.usageHistory.length > 0
          ? item.usageHistory[item.usageHistory.length - 1]
          : null;

      // Other fields

      if (!item.description) item.description = randFrom(mockData.descriptions);
      if (!item.location) item.location = randFrom(mockData.locations);
      if (!item.notes) item.notes = randFrom(mockData.notes);
      if (!item.tags || item.tags.length === 0) {
        item.tags = randSubset(mockData.tags, 3);
      }
      if (!item.imagePath) item.imagePath = randFrom(mockData.imagePaths);
      if (!item.source) item.source = randFrom(mockData.sources);

      // Random valueCents ($1–$500)
      if (!item.valueCents || item.valueCents === 0) {
        item.valueCents = Math.floor(Math.random() * 50000) + 100;
      }

      await item.save();
    }

    res.json({ ok: true, count: items.length });
  } catch (err) {
    console.error('❌ Backfill error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
