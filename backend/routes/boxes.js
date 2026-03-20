const express = require('express');
const router = express.Router();
const { uploadSingleBoxImage } = require('../middleware/boxImageUpload');
const {
  getBoxDataStructureApi,
  getBoxByMongoIdApi,
  getBoxByShortIdApi,
  getBoxByShortIdSummaryApi,
  getAllBoxesApi,
  getBoxesByParentApi,
  checkBoxIdAvailability,
  createBoxApi,
  updateBoxApi,
  postBoxImageApi,
  deleteBoxImageApi,
  releaseChildrenToFloorApi,
  getBoxTreeByShortIdApi,
  getBoxTreeApi,
  exportBoxJsonApi,
  exportBoxCsvApi,
  exportBoxHtmlApi,
  exportBoxPdfApi,
  exportBoxQrCodeApi,
  exportBoxLabelHtmlApi,
  deleteBoxByIdApi,
  deleteAllBoxesApi,
  getBoxesExcludingApi,
} = require('../controllers/boxController');

router.get('/', getAllBoxesApi);
router.get('/exclude/:id', getBoxesExcludingApi);
router.get('/byparent', getBoxesByParentApi);
router.get('/tree', getBoxTreeApi);
router.get('/by-mongo-id/:id', getBoxByMongoIdApi);
router.get('/resolve-short-id/:shortId', getBoxByShortIdSummaryApi);
router.get('/by-short-id/:shortId', getBoxDataStructureApi); // yeah?
router.get('/by-box-id/:shortId', getBoxDataStructureApi); // back-compat alias
router.get('/:id/export.json', exportBoxJsonApi);
router.get('/:id/export.csv', exportBoxCsvApi);
router.get('/:id/export.html', exportBoxHtmlApi);
router.get('/:id/export.pdf', exportBoxPdfApi);
router.get('/:id/qrcode', exportBoxQrCodeApi);
router.get('/:id/export-label.html', exportBoxLabelHtmlApi);
// router.get('/by-short-id/:shortId/tree', getBoxTreeByShortIdApi);
router.get('/check-id/:short_id', checkBoxIdAvailability);
router.post('/', createBoxApi);
router.post('/:id/image', uploadSingleBoxImage, postBoxImageApi);
router.delete('/:id/image', deleteBoxImageApi);
router.patch('/:id', updateBoxApi);
router.post('/:id/release-children', releaseChildrenToFloorApi);
router.delete('/all', deleteAllBoxesApi);
router.delete('/:id', deleteBoxByIdApi);

module.exports = router;
