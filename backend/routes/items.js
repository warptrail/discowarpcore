const express = require('express');
const router = express.Router();
const { validateObjectIdParam } = require('../utils/validateObjectIdParam.js');

const {
  getAllItemsApi,
  getItemByIdApi,
  getOrphanedItemsApi,
  postItem,
  patchItem,
  deleteItemById,
  backfillOrphanedTimestampsApi,
} = require('../controllers/itemController');

router.get('/', getAllItemsApi);
router.get('/orphaned', getOrphanedItemsApi);
router.get('/:id', validateObjectIdParam('id'), getItemByIdApi);
router.post('/', postItem);
router.patch('/:id', patchItem);
router.delete('/:id', deleteItemById);
router.post(
  '/admin/backfill-orphaned-timestamps',
  backfillOrphanedTimestampsApi
);

module.exports = router;
