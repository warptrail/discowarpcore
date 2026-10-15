const test = require('node:test');
const assert = require('node:assert/strict');
const { assertProductionTarget } = require('../backend/scripts/migrate-location-exact-spot-production');
const valid = { uri: 'mongodb://127.0.0.1:27017/discowarpcore', expectedDatabase: 'discowarpcore', hostname: 'neonazoth', username: 'warptrail', platform: 'linux', cwd: '/home/warptrail/discowarpcore', realRoot: '/home/warptrail/discowarpcore' };
test('production migration pins host, account, canonical root and exact local database', () => {
  assert.equal(assertProductionTarget(valid), 'discowarpcore');
  for (const override of [
    { hostname: 'mac-mini' }, { username: 'root' }, { platform: 'darwin' },
    { cwd: '/tmp/discowarpcore' }, { realRoot: '/home/warptrail/other' },
    { uri: 'mongodb://remote/discowarpcore' }, { expectedDatabase: 'other' },
    { uri: 'mongodb://127.0.0.1/discowarpcore_dev', expectedDatabase: 'discowarpcore_dev' },
    { uri: 'mongodb://127.0.0.1/discowarpcore?dbName=other' },
  ]) assert.throws(() => assertProductionTarget({ ...valid, ...override }), /Refusing production migration/);
});
