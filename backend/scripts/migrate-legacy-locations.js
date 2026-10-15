const path = require('node:path');
const fs = require('node:fs/promises');
const { MongoClient } = require('mongoose').mongo;
const { assertDevelopmentResetTarget, resolveMongoUri } = require('./resetShared');
const { assertApiStopped } = require('./migrate-location-exact-spot');
const { migrateLegacyLocations, rollbackLegacyLocations } = require('./migrations/legacyLocationMigration');

function parseArgs(args) {
  const result = { apply: false };
  const known = new Set(['expected-database', 'expect-plan', 'rollback', 'report']);
  const seen = new Set();
  for (const arg of args) {
    if (arg === '--apply' || arg === '--dry-run') {
      if (seen.has('mode')) throw new Error('Choose one of --dry-run or --apply');
      result.apply = arg === '--apply'; seen.add('mode'); continue;
    }
    const match = arg.match(/^--([a-z-]+)=(.+)$/);
    if (!match || !known.has(match[1]) || seen.has(match[1])) throw new Error(`Unknown or duplicate argument: ${arg}`);
    result[match[1]] = match[2]; seen.add(match[1]);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(result['expected-database'] || '')) throw new Error('--expected-database=NAME is required');
  if (result.apply && !result.rollback && !/^[a-f0-9]{64}$/.test(result['expect-plan'] || '')) throw new Error('--apply requires --expect-plan=HASH from the reviewed dry run');
  if (result.rollback && result['expect-plan']) throw new Error('--expect-plan is not used with --rollback');
  return result;
}

function assertMongoDatabase(uri, expectedDatabase) {
  const parsed = new URL(uri);
  const database = decodeURIComponent(parsed.pathname.slice(1));
  if (parsed.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)
    || !expectedDatabase || database !== expectedDatabase
    || [...parsed.searchParams.keys()].some((key) => key.toLowerCase() === 'dbname')) {
    throw new Error('Refusing migration: expected database must exactly match the configured loopback target');
  }
  return database;
}

async function run({ args, uri, database, port, backupRoot }) {
  if (args.apply) await assertApiStopped(port);
  const manifest = JSON.parse(await fs.readFile(path.join(__dirname, 'migrations/legacy-location-map.json'), 'utf8'));
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(database);
    const options = { uri, backupRoot, apply: args.apply };
    const report = args.rollback
      ? await rollbackLegacyLocations(db, { ...options, snapshotPath: path.resolve(args.rollback) })
      : await migrateLegacyLocations(db, { ...options, manifest, expectedFingerprint: args['expect-plan'] });
    if (args.report) await fs.writeFile(path.resolve(args.report), JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify(report, null, 2));
    if (report.conflicts?.length) process.exitCode = 1;
    return report;
  } finally { await client.close(); }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const uri = resolveMongoUri();
  assertDevelopmentResetTarget(uri);
  const database = assertMongoDatabase(uri, args['expected-database']);
  await run({ args, uri, database, port: 7610, backupRoot: path.resolve(__dirname, '../../var/backups/legacy-locations') });
}
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { parseArgs, assertMongoDatabase, run };
