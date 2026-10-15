const express = require('express');
const service = require('../services/loadoutService');
const router = express.Router();

const handle = (action, status = 200) => async (req, res) => {
  try { res.status(status).json(await action(req)); }
  catch (error) {
    if (!error.status) console.error('Loadout request failed:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Could not save or load your loadouts. Please try again.' });
  }
};

router.get('/', handle(async req => ({ loadouts: await service.listLoadouts(req.query.archived === '1') })));
router.post('/', handle(async req => ({ loadout: await service.createLoadout(req.body) }), 201));
router.get('/:id', handle(async req => ({ loadout: await service.getLoadout(req.params.id) })));
router.put('/:id', handle(async req => ({ loadout: await service.updateLoadout(req.params.id, req.body) })));

module.exports = router;
