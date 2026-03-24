const { getEventLogsPage } = require('../services/eventLogService');

async function getEventLogsApi(req, res) {
  try {
    const payload = await getEventLogsPage({
      limit: req.query.limit,
      offset: req.query.offset,
      eventType: req.query.eventType,
      entityType: req.query.entityType,
      entityId: req.query.entityId,
    });
    return res.status(200).json(payload);
  } catch (err) {
    console.error('❌ Error fetching event logs:', err);
    const message = err?.message || 'Failed to fetch logs';
    const status = /^invalid\s/i.test(message) ? 400 : 500;
    return res.status(status).json({
      error: status === 500 ? 'Failed to fetch logs' : message,
    });
  }
}

module.exports = {
  getEventLogsApi,
};
