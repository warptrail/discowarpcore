const express = require('express');
const { getRetrievalItemsApi } = require('../controllers/retrievalController');

const router = express.Router();

router.get('/items', getRetrievalItemsApi);

module.exports = router;
