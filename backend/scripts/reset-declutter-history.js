require('dotenv').config({ path: './backend/.env' });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DeclutterCandidate = require('../models/DeclutterCandidate');
const DeclutterSession = require('../models/DeclutterSession');
const DeclutterSessionItem = require('../models/DeclutterSessionItem');
const Item = require('../models/Item');

const shouldApply = process.argv.includes('--apply');
const includeLegacy = process.argv.includes('--include-legacy');
const DESTRUCTION_TAG = 'marked_for_destruction';

const itemDeclutterFilter = {
  $or: [
    { declutterReadiness: { $ne: 'not_considered' } },
    { declutterExitState: { $ne: 'none' } },
    { tags: DESTRUCTION_TAG },
  ],
};

function logReport(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

async function resetDeclutterHistory() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in backend/.env');
  }

  await connectDB(process.env.MONGO_URI);

  const [candidateCount, affectedItemCount, legacySessionCount, legacyItemCount] =
    await Promise.all([
      DeclutterCandidate.countDocuments({}),
      Item.countDocuments(itemDeclutterFilter),
      DeclutterSession.countDocuments({}),
      DeclutterSessionItem.countDocuments({}),
    ]);

  const report = {
    operation: 'declutter.history.reset',
    mode: shouldApply ? 'apply' : 'dry-run',
    scope: {
      activeCandidatesToDelete: candidateCount,
      inventoryItemsToClear: affectedItemCount,
      legacySessionsToDelete: includeLegacy ? legacySessionCount : 0,
      legacySessionItemsToDelete: includeLegacy ? legacyItemCount : 0,
      legacyArchivesPreserved: !includeLegacy,
    },
    preserves: [
      'inventory items and physical box membership',
      'item_status and physical disposition history',
      'boxes, staging configuration, and Gift Box settings',
      'isIntendedGift values',
    ],
  };

  if (!shouldApply) {
    logReport({
      ...report,
      nextStep:
        'No data changed. Re-run with --apply to reset the active Declutter system. Add --include-legacy only if the archived session collections should also be erased.',
    });
    return;
  }

  const candidateResult = await DeclutterCandidate.deleteMany({});
  const itemResult = await Item.updateMany(itemDeclutterFilter, {
    $set: {
      declutterReadiness: 'not_considered',
      declutterExitState: 'none',
    },
    $pull: { tags: DESTRUCTION_TAG },
  });

  let legacySessionResult = { deletedCount: 0 };
  let legacyItemResult = { deletedCount: 0 };
  if (includeLegacy) {
    legacyItemResult = await DeclutterSessionItem.deleteMany({});
    legacySessionResult = await DeclutterSession.deleteMany({});
  }

  logReport({
    ...report,
    result: {
      activeCandidatesDeleted: candidateResult.deletedCount,
      inventoryItemsCleared: itemResult.modifiedCount,
      legacySessionsDeleted: legacySessionResult.deletedCount,
      legacySessionItemsDeleted: legacyItemResult.deletedCount,
    },
    nextStep: 'Reset complete. Re-running this command is safe and will make no further changes.',
  });
}

resetDeclutterHistory()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          operation: 'declutter.history.reset',
          mode: shouldApply ? 'apply' : 'dry-run',
          outcome: 'failed',
          error: {
            name: error?.name || 'Error',
            message: error?.message || String(error),
            stack: error?.stack || null,
          },
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
