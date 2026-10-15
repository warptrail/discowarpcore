// Same planner/engine as development, but a separate explicit, host-pinned entry point.
const path = require('node:path');
const { assertProductionTarget } = require('./migrate-location-exact-spot-production');
const { parseArgs, assertMongoDatabase, run } = require('./migrate-legacy-locations');
const ROOT = '/home/warptrail/discowarpcore';

async function main() {
  require('dotenv').config({ path: path.join(ROOT, 'backend/.env'), override: true, quiet: true });
  const args = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGO_URI;
  const database = assertProductionTarget({ uri, expectedDatabase: args['expected-database'] });
  assertMongoDatabase(uri, database);
  await run({ args, uri, database, port: 5002, backupRoot: path.join(ROOT, 'var/backups/legacy-locations-production') });
}
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { main };
