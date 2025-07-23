const express = require('express');
const router = express.Router();
const {
  addItemToBoxApi,
  removeItemFromBoxApi,
  moveItemApi,
} = require('../controllers/boxItemController');

router.patch('/:boxId/addItem', addItemToBoxApi);
router.patch('/:boxId/removeItem', removeItemFromBoxApi);
router.patch('/moveItem', moveItemApi);

module.exports = router;
