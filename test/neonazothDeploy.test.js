const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RSYNC_EXCLUDES,
  lanUrl,
  parseRemoteProbe,
  rsyncArgs,
} = require('../scripts/neonazoth/deploy_source');

test('chatty deploy keeps the source-only protected rsync contract', () => {
  const args = rsyncArgs({ dryRun: false });

  assert.equal(args[0], '-avz');
  assert.ok(args.includes('--human-readable'));
  assert.ok(args.includes('--progress'));
  assert.ok(args.includes('--stats'));
  assert.ok(args.includes('--delete'));

  for (const entry of RSYNC_EXCLUDES) {
    const index = args.indexOf(entry);
    assert.ok(index > 0, `missing exclusion: ${entry}`);
    assert.equal(args[index - 1], '--exclude');
  }
});

test('remote probe output becomes a usable LAN status record', () => {
  assert.deepEqual(
    parseRemoteProbe([
      'hostname=neonazoth',
      'primary_ip=192.168.1.37',
      'all_ips=192.168.1.37 10.0.0.12 127.0.0.1',
      'health_code=200',
    ].join('\n')),
    {
      hostname: 'neonazoth',
      primaryIp: '192.168.1.37',
      allIps: ['192.168.1.37', '10.0.0.12', '127.0.0.1'],
      healthCode: '200',
    }
  );
  assert.equal(lanUrl('192.168.1.37'), 'http://192.168.1.37:5002');
});

test('remote probe tolerates missing optional values', () => {
  assert.deepEqual(parseRemoteProbe('hostname=neonazoth\n'), {
    hostname: 'neonazoth',
    primaryIp: '',
    allIps: [],
    healthCode: '',
  });
});
