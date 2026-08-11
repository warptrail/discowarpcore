const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertDevelopmentResetTarget,
  inspectMongoTarget,
} = require('../backend/scripts/resetShared');

const SAFE_OPTIONS = {
  env: {},
  hostname: 'development-mac',
};

test('development reset accepts only a loopback development database', () => {
  const target = assertDevelopmentResetTarget(
    'mongodb://127.0.0.1:27017/discowarpcore_dev',
    SAFE_OPTIONS,
  );
  assert.equal(target.databaseName, 'discowarpcore_dev');
  assert.equal(target.safeDisplay, 'mongodb://127.0.0.1:27017/discowarpcore_dev');
});

test('development reset refuses production signals and production database names', () => {
  assert.throws(() => assertDevelopmentResetTarget(
    'mongodb://127.0.0.1:27017/discowarpcore_dev',
    { env: { NODE_ENV: 'production' }, hostname: 'development-mac' },
  ), /Production reset is disabled/);
  assert.throws(() => assertDevelopmentResetTarget(
    'mongodb://127.0.0.1:27017/discowarpcore_dev',
    { env: {}, hostname: 'neonazoth' },
  ), /Production reset is disabled/);
  assert.throws(() => assertDevelopmentResetTarget(
    'mongodb://127.0.0.1:27017/discowarpcore',
    SAFE_OPTIONS,
  ), /development\/test suffix required/);
});

test('development reset refuses remote MongoDB and redacts credentials', () => {
  assert.throws(() => assertDevelopmentResetTarget(
    'mongodb://inventory.example:27017/discowarpcore_dev',
    SAFE_OPTIONS,
  ), /non-loopback MongoDB host/);

  const target = inspectMongoTarget(
    'mongodb://secret-user:secret-pass@127.0.0.1:27017/discowarpcore_dev',
  );
  assert.equal(target.safeDisplay.includes('secret-user'), false);
  assert.equal(target.safeDisplay.includes('secret-pass'), false);
});
