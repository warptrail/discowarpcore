const {
  HARD_CONFIRM_FLAG,
  BATCHES_ROOT,
  resolveMongoUri,
  assertDevelopmentResetTarget,
  dropDatabase,
  wipeIntakeState,
  wipeMediaState,
  disconnectMongooseQuietly,
} = require('./resetShared');

function usageMessage() {
  return `Usage: npm run reset:development:hard -- ${HARD_CONFIRM_FLAG}`;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes(HARD_CONFIRM_FLAG)) {
    console.error('❌ Refusing to run destructive reset without explicit confirmation flag.');
    console.error(usageMessage());
    process.exit(1);
  }

  const mongoUri = resolveMongoUri();
  let mongoTarget;
  let dbDropped = false;
  let intakeWiped = false;
  let mediaWiped = false;
  let liveMediaPath = '';
  let intakeRoots = null;

  try {
    mongoTarget = assertDevelopmentResetTarget(mongoUri);
    console.log(`[reset] db=${mongoTarget.databaseName}`);
    console.log(`[reset] mongoTarget=${mongoTarget.safeDisplay}`);
    console.log(`[reset] batches=${BATCHES_ROOT}`);
    console.log('[reset] mode=hard (database + intake provenance + media)');

    await dropDatabase(mongoUri, mongoTarget.databaseName);
    dbDropped = true;
    console.log(`✅ Dropped database: ${mongoTarget.databaseName}`);

    intakeRoots = await wipeIntakeState();
    intakeWiped = true;
    console.log(`✅ Wiped repo intake provenance state: ${intakeRoots.repoIntakeRoot}`);
    console.log(`✅ Recreated repo batches root: ${intakeRoots.repoBatchesRoot}`);
    if (intakeRoots.externalIntakeRoot && intakeRoots.externalIntakeRoot !== intakeRoots.repoIntakeRoot) {
      console.log(`✅ Wiped external intake provenance root: ${intakeRoots.externalIntakeRoot}`);
      console.log(`✅ Recreated external intake root: ${intakeRoots.externalIntakeRoot}`);
    }

    liveMediaPath = await wipeMediaState();
    mediaWiped = true;
    console.log(`✅ Wiped media directory: ${liveMediaPath}`);
    console.log(`✅ Recreated media directory structure at: ${liveMediaPath}`);

    console.log('Hard reset completed.');
    console.log(`- database dropped: ${dbDropped}`);
    console.log(`- intake provenance wiped: ${intakeWiped}`);
    console.log(`- media wiped: ${mediaWiped}`);
    console.log('- media directory recreated: true');
  } catch (err) {
    console.error('❌ Hard reset failed.');
    console.error(`- database dropped: ${dbDropped}`);
    console.error(`- intake provenance wiped: ${intakeWiped}`);
    console.error(`- media wiped: ${mediaWiped}`);
    if (err?.message) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error(err);
    }
    process.exit(1);
  } finally {
    await disconnectMongooseQuietly();
  }
}

main();
