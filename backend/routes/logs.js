const express = require('express');
const { getEventLogsApi } = require('../controllers/eventLogController');

const router = express.Router();

router.get('/', getEventLogsApi);

module.exports = router;
