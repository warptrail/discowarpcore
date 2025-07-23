const express = require('express');
const router = express.Router();
const {
  getBoxByMongoIdApi,
  getBoxByBoxIdApi,
  getAllBoxesApi,
  getBoxesByParentApi,
  checkBoxIdAvailability,
  createBoxApi,
  updateBoxApi,
  getBoxTreeByBoxIdApi,
  getBoxTreeApi,
  deleteBoxApi,
} = require('../controllers/boxController');

router.get('/', getAllBoxesApi);
router.get('/:box_id/tree', getBoxTreeByBoxIdApi);
router.get('/byparent', getBoxesByParentApi);
router.get('/tree', getBoxTreeApi);
router.get('/by-mongo-id/:id', getBoxByMongoIdApi);
router.get('/by-box-id/:box_id', getBoxByBoxIdApi);
router.get('/check-id/:box_id', checkBoxIdAvailability);
router.post('/', createBoxApi);
router.patch('/:id', updateBoxApi);
router.delete('/:id', deleteBoxApi);

module.exports = router;
