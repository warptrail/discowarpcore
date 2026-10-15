const Item = require('../models/Item');
const { getMissingItems, getMissingSummary, saveMissing } = require('../services/itemMissingService');
function handler(work) {
  return async (req, res) => {
    try { res.json({ ok: true, data: await work(req) }); }
    catch (error) {
      const status = error.status || 500;
      const data = req.params.id ? await Item.findItemById(req.params.id).catch(() => null) : undefined;
      res.status(status).json({ ok: false, error: error.message, ...(data ? { data } : {}) });
    }
  };
}
module.exports = {
  getMissingItemsApi: handler(req => getMissingItems(req.query)),
  getMissingSummaryApi: handler(() => getMissingSummary()),
  patchMissingApi: handler(req => saveMissing(req.params.id, req.body)),
  patchFoundApi: handler(req => saveMissing(req.params.id, req.body, true)),
};
