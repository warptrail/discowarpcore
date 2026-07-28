require('dotenv').config({ path: './backend/.env' });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DeclutterCandidate = require('../models/DeclutterCandidate');
const Item = require('../models/Item');
const { buildReleaseMigration } = require('../utils/declutterReleaseMigration');

const shouldApply = process.argv.includes('--apply');

function comparable(value) {
  return JSON.stringify(value, (_key, entry) => {
    if (entry instanceof Date) return entry.toISOString();
    if (entry && typeof entry.toObject === 'function') return entry.toObject();
    return entry;
  });
}

function candidateNeedsUpdate(candidate, candidateUpdate) {
  const current = {
    votes: candidate.votes,
    deckState: candidate.deckState,
    resolution: candidate.resolution,
    stagingRoute: candidate.stagingRoute || null,
    resolvedAt: candidate.resolvedAt || null,
  };
  return comparable(current) !== comparable(candidateUpdate);
}

async function migrate() {
  await connectDB(process.env.MONGO_URI);
  const [candidates, legacyReadyToLeaveItems, legacyReviewLaterItems] = await Promise.all([
    DeclutterCandidate.collection.find({}).toArray(),
    Item.collection.countDocuments({
      declutterReadiness: { $in: ['ready_to_donate', 'ready_to_sell'] },
    }),
    Item.collection.countDocuments({ declutterReadiness: 'review_later' }),
  ]);
  const candidateOperations = [];
  const itemOperations = [];
  const readinessCounts = {};
  const resolutionCounts = {};
  const stagingCounts = {};

  for (const candidate of candidates) {
    const migration = buildReleaseMigration(candidate);
    const { candidateUpdate, itemUpdate } = migration;

    resolutionCounts[candidateUpdate.resolution] =
      (resolutionCounts[candidateUpdate.resolution] || 0) + 1;
    readinessCounts[itemUpdate.declutterReadiness] =
      (readinessCounts[itemUpdate.declutterReadiness] || 0) + 1;
    const stagingKey = candidateUpdate.stagingRoute || 'none';
    stagingCounts[stagingKey] = (stagingCounts[stagingKey] || 0) + 1;

    if (candidateNeedsUpdate(candidate, candidateUpdate)) {
      candidateOperations.push({
        updateOne: {
          filter: { _id: candidate._id },
          update: { $set: candidateUpdate },
        },
      });
    }
    itemOperations.push({
      updateOne: {
        filter: { _id: candidate.itemId },
        update: { $set: itemUpdate },
      },
    });
  }

  if (shouldApply) {
    if (candidateOperations.length) {
      await DeclutterCandidate.collection.bulkWrite(candidateOperations, { ordered: false });
    }
    if (itemOperations.length) {
      await Item.bulkWrite(itemOperations, { ordered: false });
    }
    await Item.collection.updateMany(
      { declutterReadiness: { $in: ['ready_to_donate', 'ready_to_sell'] } },
      { $set: { declutterReadiness: 'ready_to_declutter' } }
    );
    await Item.collection.updateMany(
      { declutterReadiness: 'review_later' },
      { $set: { declutterReadiness: 'in_deck' } }
    );
  }

  console.log(
    JSON.stringify(
      {
        operation: 'declutter.release_decisions.migrate',
        mode: shouldApply ? 'apply' : 'dry-run',
        scannedCandidates: candidates.length,
        candidatesNeedingUpdate: candidateOperations.length,
        inventoryReadinessUpdates: itemOperations.length,
        legacyReadinessValuesToCollapse:
          legacyReadyToLeaveItems + legacyReviewLaterItems,
        resolutionCounts,
        stagingCounts,
        readinessCounts,
        nextStep: shouldApply
          ? 'Migration applied. Re-running with --apply is safe.'
          : 'No data changed. Re-run with --apply after reviewing this report.',
      },
      null,
      2
    )
  );
}

migrate()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          operation: 'declutter.release_decisions.migrate',
          mode: shouldApply ? 'apply' : 'dry-run',
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
