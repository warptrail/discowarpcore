const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');

const {
  backendRequestLogger,
  serializeError,
  writeBackendLog,
} = require('../backend/utils/backendLogger');

function captureConsole(method, action) {
  const original = console[method];
  const entries = [];
  console[method] = (value) => entries.push(String(value));
  try {
    action();
  } finally {
    console[method] = original;
  }
  return entries;
}

test('backend request logs are single-line structured records without query values', () => {
  const req = {
    method: 'GET',
    originalUrl: '/api/declutter-deck?player=laserfox&token=do-not-log',
    query: { player: 'laserfox', token: 'do-not-log' },
    get: (name) => (name === 'x-request-id' ? 'test-request-42' : ''),
  };
  const res = new EventEmitter();
  res.statusCode = 200;
  res.writableFinished = true;
  res.headers = {};
  res.setHeader = (name, value) => { res.headers[name.toLowerCase()] = value; };
  res.getHeader = (name) => res.headers[String(name).toLowerCase()];

  const entries = captureConsole('log', () => {
    backendRequestLogger(req, res, () => {});
    res.emit('finish');
  });

  assert.equal(entries.length, 1);
  assert.ok(entries[0].startsWith('[backend] '));
  assert.equal(entries[0].includes('laserfox'), false);
  assert.equal(entries[0].includes('do-not-log'), false);
  const record = JSON.parse(entries[0].slice('[backend] '.length));
  assert.equal(record.event, 'http.request.completed');
  assert.equal(record.requestId, 'test-request-42');
  assert.equal(record.path, '/api/declutter-deck');
  assert.deepEqual(record.queryKeys, ['player', 'token']);
  assert.equal(res.headers['x-request-id'], 'test-request-42');
});

test('backend error records keep useful bounded diagnostics', () => {
  const error = new Error('database unavailable');
  error.code = 'ECONNREFUSED';
  const serialized = serializeError(error);
  assert.equal(serialized.name, 'Error');
  assert.equal(serialized.message, 'database unavailable');
  assert.equal(serialized.code, 'ECONNREFUSED');
  assert.ok(serialized.stack.split('\n').length <= 8);

  const entries = captureConsole('error', () => {
    writeBackendLog('error', 'declutter.deck.load.failed', {
      requestId: 'request-7',
      error: serialized,
    });
  });
  const record = JSON.parse(entries[0].slice('[backend] '.length));
  assert.equal(record.level, 'error');
  assert.equal(record.event, 'declutter.deck.load.failed');
  assert.equal(record.error.code, 'ECONNREFUSED');
});
