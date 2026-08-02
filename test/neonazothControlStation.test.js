const assert = require('node:assert/strict');
const test = require('node:test');

const {
  REMOTE_COMPLETION_MARKER,
  RSYNC_EXCLUDES,
  findProtectedDryRunEntries,
  rsyncArgs,
  runCommand,
} = require('../scripts/neonazoth/control_station');

test('NeonAzoth rsync excludes local runtime state and production data', () => {
  const requiredExcludes = [
    '.runtime/',
    '.tarot/',
    'backend/media/',
    'backend/.env',
    'dump/',
    'var/',
    'test/output/',
    '**/.DS_Store',
    '*.log',
    '*.pid',
    '*.sock',
    '*.backup*',
    '*.bak-*',
  ];

  for (const entry of requiredExcludes) {
    assert.ok(RSYNC_EXCLUDES.includes(entry), `missing protected exclusion: ${entry}`);
  }

  const args = rsyncArgs({ dryRun: true });
  assert.equal(args[0], '-avzn');
  for (const entry of requiredExcludes) {
    const index = args.indexOf(entry);
    assert.ok(index > 0, `dry-run args missing protected exclusion: ${entry}`);
    assert.equal(args[index - 1], '--exclude');
  }
});

test('protected dry-run audit identifies unsafe transfer entries', () => {
  const output = [
    'Transfer starting: 4 files',
    'frontend/src/App.jsx',
    '.runtime/tarot-dock.sock',
    'deleting backend/.env.backup-20260620',
    'test/output/.DS_Store',
  ].join('\n');

  assert.deepEqual(findProtectedDryRunEntries(output), [
    '.runtime/tarot-dock.sock',
    'deleting backend/.env.backup-20260620',
    'test/output/.DS_Store',
  ]);
  assert.deepEqual(findProtectedDryRunEntries('frontend/src/App.jsx\n'), []);
});

test('completion sentinel safely releases a child that keeps the channel open', async () => {
  const result = await runCommand(
    process.execPath,
    [
      '-e',
      `console.log('${REMOTE_COMPLETION_MARKER}'); setInterval(() => {}, 1000);`,
    ],
    {
      inherit: false,
      completionMarker: REMOTE_COMPLETION_MARKER,
      completionGraceMs: 25,
    }
  );

  assert.equal(result.code, 0);
  assert.equal(result.completionSeen, true);
  assert.equal(result.forcedCloseAfterCompletion, true);
});
