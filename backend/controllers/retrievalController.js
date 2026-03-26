const {
  getRetrievalItemsPage,
  getRetrievalBoxesPage,
} = require('../services/retrievalService');

async function getRetrievalItemsApi(req, res) {
  try {
    const payload = await getRetrievalItemsPage({
      q: req.query.q,
      category: req.query.category,
      tag: req.query.tag,
      location: req.query.location,
      owner: req.query.owner,
      keepPriority: req.query.keepPriority,
      limit: req.query.limit,
      offset: req.query.offset,
    });

    return res.status(200).json(payload);
  } catch (err) {
    console.error('❌ Error fetching retrieval items page:', err);
    return res.status(500).json({ error: 'Failed to fetch retrieval items' });
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
      group: req.query.group,
      location: req.query.location,
      limit: req.query.limit,
      offset: req.query.offset,
    });

    return res.status(200).json(payload);
  } catch (err) {
    console.error('❌ Error fetching retrieval boxes page:', err);
    return res.status(500).json({ error: 'Failed to fetch retrieval boxes' });
  }
}
