// routes/devRoutes.js
const express = require('express');
const router = express.Router();
const { orphanAllItemsSequentialApi } = require('../controllers/devController');
const {
  seedNestedApi,
  deleteSeedNestedApi,
} = require('../controllers/devSeedController');

// Orphan every item, 1-second apart starting at startAt (optional)
router.post('/orphan/all-items-seq', orphanAllItemsSequentialApi);

// Seed and delete mock data
router.post('/seed-nested', seedNestedApi);
router.delete('/seed-nested', deleteSeedNestedApi);

module.exports = router;
