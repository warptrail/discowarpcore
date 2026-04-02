const express = require('express');
const {
  getIntakeBatchesApi,
  getIntakeBatchApi,
  postCreateIntakeBatchApi,
  postUpdateIntakeBatchAssetsApi,
  postValidateIntakeBatchApi,
  postStageIntakeBatchApi,
  postImportIntakeBatchApi,
  deleteIntakeBatchApi,
} = require('../controllers/intakeBatchController');
const { uploadIntakeBatchAssets } = require('../middleware/intakeBatchUpload');

const router = express.Router();

router.get('/', getIntakeBatchesApi);
router.get('/:batchId', getIntakeBatchApi);
router.post('/', uploadIntakeBatchAssets, postCreateIntakeBatchApi);
router.post('/:batchId/assets', uploadIntakeBatchAssets, postUpdateIntakeBatchAssetsApi);
router.post('/:batchId/validate', postValidateIntakeBatchApi);
router.post('/:batchId/stage', postStageIntakeBatchApi);
router.post('/:batchId/import', postImportIntakeBatchApi);
router.delete('/:batchId', deleteIntakeBatchApi);

module.exports = router;
