const express = require('express');

const {
  listLocationsApi,
  createLocationApi,
  renameLocationApi,
  deleteLocationApi,
} = require('../controllers/locationController');

const router = express.Router();

router.get('/', listLocationsApi);
router.post('/', createLocationApi);
router.patch('/:id', renameLocationApi);
router.delete('/:id', deleteLocationApi);

module.exports = router;
