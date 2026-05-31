const express = require('express');
const { validateObjectIdParam } = require('../utils/validateObjectIdParam');
const {
  deleteDeclutterSessionApi,
  deleteDeclutterSessionItemApi,
  getDeclutterSessionByIdApi,
  getDeclutterSessionsForItemApi,
  getDeclutterSessionsApi,
  patchDeclutterSessionApi,
  patchDeclutterSessionItemApi,
  postDeclutterSessionResetApi,
  postDeclutterSessionApi,
  postDeclutterSessionItemsApi,
} = require('../controllers/declutterSessionController');

const router = express.Router();

router.get('/', getDeclutterSessionsApi);
router.post('/', postDeclutterSessionApi);
router.get(
  '/items/:itemId/sessions',
  validateObjectIdParam('itemId'),
  getDeclutterSessionsForItemApi
);
router.get(
  '/:sessionId',
  validateObjectIdParam('sessionId'),
  getDeclutterSessionByIdApi
);
router.patch(
  '/:sessionId',
  validateObjectIdParam('sessionId'),
  patchDeclutterSessionApi
);
router.delete(
  '/:sessionId',
  validateObjectIdParam('sessionId'),
  deleteDeclutterSessionApi
);
router.post(
  '/:sessionId/reset',
  validateObjectIdParam('sessionId'),
  postDeclutterSessionResetApi
);
router.post(
  '/:sessionId/items',
  validateObjectIdParam('sessionId'),
  postDeclutterSessionItemsApi
);
router.patch(
  '/:sessionId/items/:itemId',
  validateObjectIdParam('sessionId'),
  validateObjectIdParam('itemId'),
  patchDeclutterSessionItemApi
);
router.delete(
  '/:sessionId/items/:itemId',
  validateObjectIdParam('sessionId'),
  validateObjectIdParam('itemId'),
  deleteDeclutterSessionItemApi
);

module.exports = router;
