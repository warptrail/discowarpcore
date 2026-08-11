const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertRemoteIdentity,
  isExpectedBackendProcess,
  normalizeCommandLine,
} = require('../scripts/neonazoth/restart_backend_remote');

test('guarded restart recognizes only the exact project backend process', () => {
  const projectRoot = '/home/warptrail/discowarpcore';
  assert.equal(isExpectedBackendProcess({
    commandLine: 'node\0backend/server.js\0',
    cwd: projectRoot,
  }, projectRoot), true);
  assert.equal(isExpectedBackendProcess({
    commandLine: 'node\0backend/server.js\0',
    cwd: '/home/warptrail/another-app',
  }, projectRoot), false);
  assert.equal(isExpectedBackendProcess({
    commandLine: 'node\0some-other-server.js\0',
    cwd: projectRoot,
  }, projectRoot), false);
});

test('guarded restart normalizes proc command lines and rejects another host', () => {
  assert.equal(normalizeCommandLine('node\0backend/server.js\0'), 'node backend/server.js');
  assert.doesNotThrow(() => assertRemoteIdentity({
    hostname: 'neonazoth',
    projectRoot: '/home/warptrail/discowarpcore',
  }));
  assert.throws(() => assertRemoteIdentity({
    hostname: 'quantumzephyr.local',
    projectRoot: '/home/warptrail/discowarpcore',
  }), /Refusing production restart/);
});
