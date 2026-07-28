const { randomUUID } = require('crypto');

const LEVEL_METHODS = {
  debug: 'log',
  info: 'log',
  warn: 'warn',
  error: 'error',
};

function roundDuration(startedAt) {
  return Number((Number(process.hrtime.bigint() - startedAt) / 1e6).toFixed(2));
}

function serializeError(error) {
  if (!error) return null;
  const serialized = {
    name: String(error.name || 'Error'),
    message: String(error.message || error),
  };
  if (error.code != null) serialized.code = String(error.code);
  if (error.stack) serialized.stack = String(error.stack).split('\n').slice(0, 8).join('\n');
  return serialized;
}

function writeBackendLog(level, event, fields = {}) {
  const normalizedLevel = LEVEL_METHODS[level] ? level : 'info';
  const record = {
    timestamp: new Date().toISOString(),
    level: normalizedLevel,
    event,
    ...fields,
  };
  console[LEVEL_METHODS[normalizedLevel]](`[backend] ${JSON.stringify(record)}`);
  return record;
}

function getRequestId(req) {
  return String(req?.requestId || '').trim();
}

function backendRequestLogger(req, res, next) {
  const incomingRequestId = String(req.get?.('x-request-id') || '').trim();
  req.requestId = incomingRequestId.slice(0, 128) || randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const startedAt = process.hrtime.bigint();
  let logged = false;

  const logCompletion = (outcome) => {
    if (logged) return;
    logged = true;
    const status = Number(res.statusCode || 0);
    const level = outcome === 'aborted' || status >= 500
      ? 'error'
      : status >= 400
        ? 'warn'
        : 'info';
    writeBackendLog(level, 'http.request.completed', {
      requestId: req.requestId,
      method: req.method,
      path: String(req.originalUrl || req.url || '').split('?')[0],
      queryKeys: Object.keys(req.query || {}).sort(),
      status,
      outcome,
      durationMs: roundDuration(startedAt),
      responseBytes: Number(res.getHeader('content-length') || 0) || undefined,
    });
  };

  res.once('finish', () => logCompletion('completed'));
  res.once('close', () => {
    if (!res.writableFinished) logCompletion('aborted');
  });
  next();
}

module.exports = {
  backendRequestLogger,
  getRequestId,
  roundDuration,
  serializeError,
  writeBackendLog,
};
