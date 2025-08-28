const express = require('express');
const router = express.Router();
const {
  postCreateItemInBox,
  patchAttachExistingItem,
  patchAddItems,
  patchRemoveItemFromBox,
  patchMoveItem,
  patchEmptyBoxItems,
} = require('../controllers/boxItemController');

router.post('/boxes/:boxMongoId/items', postCreateItemInBox);
router.patch('/:boxMongoId/addItem', patchAttachExistingItem);
router.patch('/:boxMongoId/addItems', patchAddItems);
router.patch('/:boxMongoId/removeItem', patchRemoveItemFromBox);
router.patch('/moveItem', patchMoveItem);
router.patch('/:boxMongoId/empty', patchEmptyBoxItems);

module.exports = router;
