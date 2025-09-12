const express = require('express');
const router = express.Router();
const {
  getBoxDataStructureApi,
  getBoxByMongoIdApi,
  getBoxByShortIdApi,
  getAllBoxesApi,
  getBoxesByParentApi,
  checkBoxIdAvailability,
  createBoxApi,
  updateBoxApi,
  getBoxTreeByShortIdApi,
  getBoxTreeApi,
  deleteBoxByIdApi,
  deleteAllBoxesApi,
  getBoxesExcludingApi,
} = require('../controllers/boxController');

router.get('/', getAllBoxesApi);
router.get('/exclude/:id', getBoxesExcludingApi);
router.get('/byparent', getBoxesByParentApi);
router.get('/tree', getBoxTreeApi);
router.get('/by-mongo-id/:id', getBoxByMongoIdApi);
router.get('/by-short-id/:shortId', getBoxDataStructureApi); // yeah?
router.get('/by-box-id/:shortId', getBoxDataStructureApi); // back-compat alias
// router.get('/by-short-id/:shortId/tree', getBoxTreeByShortIdApi);
router.get('/check-id/:short_id', checkBoxIdAvailability);
router.post('/', createBoxApi);
router.patch('/:id', updateBoxApi);
router.delete('/all', deleteAllBoxesApi);
router.delete('/:id', deleteBoxByIdApi);

module.exports = router;
