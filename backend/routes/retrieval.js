const express = require('express');
const {
  getRetrievalItemsApi,
  getRetrievalBoxesApi,
} = require('../controllers/retrievalController');

const router = express.Router();

router.get('/items', getRetrievalItemsApi);
router.get('/boxes', getRetrievalBoxesApi);

module.exports = router;
