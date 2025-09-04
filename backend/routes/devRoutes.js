// routes/devRoutes.js
const express = require('express');
const router = express.Router();
const {
  orphanAllItemsSequentialApi,
  seedNestedApi,
  deleteSeedNestedApi,
} = require('../controllers/devController');

// Orphan every item, 1-second apart starting at startAt (optional)
router.post('/orphan/all-items-seq', orphanAllItemsSequentialApi);
router.post('/seed-nested', seedNestedApi);
router.delete('/seed-nested', deleteSeedNestedApi);

module.exports = router;
