const mongoose = require('mongoose');

function requireDatabaseReady(_req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    ok: false,
    error: 'Database is unavailable',
    code: 'DATABASE_UNAVAILABLE',
  });
}

module.exports = {
  requireDatabaseReady,
};
