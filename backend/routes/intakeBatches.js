const express = require('express');
const {
  getIntakeBatchesApi,
  getIntakeBatchApi,
  postIngestIntakeBatchPackageApi,
  postCreateSimpleJsonIntakeBatchApi,
  postCreateIntakeBatchApi,
  postUpdateIntakeBatchAssetsApi,
  postUpdateIntakeBatchDestinationApi,
  patchRenameIntakeBatchApi,
  postValidateIntakeBatchApi,
  postStageIntakeBatchApi,
  postImportIntakeBatchApi,
  postProcessIntakeBatchSelectedItemsApi,
  deleteIntakeBatchApi,
  deleteIntakeBatchPermanentlyApi,
  postRecreateIntakeBatchLocalFolderApi,
} = require('../controllers/intakeBatchController');
const {
  uploadIntakeBatchAssets,
  uploadIntakeBatchPackage,
  uploadSimpleIntakeBatchJson,
} = require('../middleware/intakeBatchUpload');

const router = express.Router();

router.get('/', getIntakeBatchesApi);
router.post('/package', uploadIntakeBatchPackage, postIngestIntakeBatchPackageApi);
router.post('/simple-json', uploadSimpleIntakeBatchJson, postCreateSimpleJsonIntakeBatchApi);
router.get('/:batchId', getIntakeBatchApi);
router.post('/', uploadIntakeBatchAssets, postCreateIntakeBatchApi);
router.post('/:batchId/assets', uploadIntakeBatchAssets, postUpdateIntakeBatchAssetsApi);
router.post('/:batchId/destination', postUpdateIntakeBatchDestinationApi);
router.patch('/:batchId/name', patchRenameIntakeBatchApi);
router.post('/:batchId/validate', postValidateIntakeBatchApi);
router.post('/:batchId/stage', postStageIntakeBatchApi);
router.post('/:batchId/import', postImportIntakeBatchApi);
router.post('/:batchId/process-selected', postProcessIntakeBatchSelectedItemsApi);
router.post('/:batchId/recreate-local-folder', postRecreateIntakeBatchLocalFolderApi);
router.delete('/:batchId/permanent', deleteIntakeBatchPermanentlyApi);
router.delete('/:batchId', deleteIntakeBatchApi);

module.exports = router;
