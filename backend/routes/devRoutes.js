// routes/devRoutes.js
const express = require('express');
const router = express.Router();
const { orphanAllItemsSequentialApi } = require('../controllers/devController');

// …other dev routes

// Orphan every item, 1-second apart starting at startAt (optional)
router.post('/orphan/all-items-seq', orphanAllItemsSequentialApi);

module.exports = router;
