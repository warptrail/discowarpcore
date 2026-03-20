const { getEventLogsPage } = require('../services/eventLogService');

async function getEventLogsApi(req, res) {
  try {
    const payload = await getEventLogsPage({
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return res.status(200).json(payload);
  } catch (err) {
    console.error('❌ Error fetching event logs:', err);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
}

module.exports = {
  getEventLogsApi,
};
