const {
  getRetrievalItemsPage,
  getRetrievalBoxesPage,
} = require('../services/retrievalService');

async function getRetrievalItemsApi(req, res) {
  try {
    const payload = await getRetrievalItemsPage({
      q: req.query.q,
      addressScope: req.query.addressScope,
      includeCabinets: req.query.includeCabinets,
      category: req.query.category,
      tag: req.query.tag,
      exactTag: req.query.exactTag,
      tagOperator: req.query.tagOperator,
      location: req.query.location,
      owner: req.query.owner,
      keepPriority: req.query.keepPriority,
      sort: req.query.sort,
      shuffleSeed: req.query.shuffleSeed,
      limit: req.query.limit,
      offset: req.query.offset,
    });

    return res.status(200).json(payload);
  } catch (err) {
    console.error('❌ Error fetching retrieval items page:', err);
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to fetch retrieval items' });
  }
}

module.exports = {
  getRetrievalItemsApi,
  getRetrievalBoxesApi,
};

async function getRetrievalBoxesApi(req, res) {
  try {
    const payload = await getRetrievalBoxesPage({
      q: req.query.q,
      addressScope: req.query.addressScope,
      includeCabinets: req.query.includeCabinets,
      boxPrefix: req.query.boxPrefix,
      tag: req.query.tag,
      exactTag: req.query.exactTag,
      tagSource: req.query.tagSource,
      tagOperator: req.query.tagOperator,
      location: req.query.location,
      room: req.query.room,
      sort: req.query.sort,
      shuffleSeed: req.query.shuffleSeed,
      limit: req.query.limit,
      offset: req.query.offset,
    });

    return res.status(200).json(payload);
  } catch (err) {
    console.error('❌ Error fetching retrieval boxes page:', err);
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to fetch retrieval boxes' });
  }
}
