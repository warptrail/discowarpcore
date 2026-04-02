const express = require('express');
const {
  postMediaProcessTestApi,
  postMediaBatchTestApi,
  postMediaJobEnqueueApi,
  getMediaJobStatusApi,
  getMediaJobsApi,
} = require('../controllers/mediaController');
const {
  getMediaStateByIdApi,
  getBatchImportReadySummaryApi,
  postBatchImportProcessReadyApi,
} = require('../controllers/entityMediaController');

const router = express.Router();
const MEDIA_TEST_ROUTES_ENABLED =
  process.env.ENABLE_MEDIA_TEST_ROUTES === 'true' ||
  process.env.NODE_ENV !== 'production';

router.post('/jobs/process', postMediaJobEnqueueApi);
router.get('/jobs', getMediaJobsApi);
router.get('/jobs/:jobId', getMediaJobStatusApi);
router.get('/batch-import/ready-summary', getBatchImportReadySummaryApi);
router.post('/batch-import/process-ready', postBatchImportProcessReadyApi);

if (MEDIA_TEST_ROUTES_ENABLED) {
  // Temporary media processing test endpoint; non-final API surface.
  router.post('/process-test', postMediaProcessTestApi);
  // Temporary admin/testing endpoint; non-final API surface.
  router.post('/admin/batch-test', postMediaBatchTestApi);
}

router.get('/:mediaId', getMediaStateByIdApi);

module.exports = router;
