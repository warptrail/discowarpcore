require('dotenv').config({ path: './backend/.env' });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DeclutterCandidate = require('../models/DeclutterCandidate');
const Item = require('../models/Item');
const Box = require('../models/Box');

const shouldApply = process.argv.includes('--apply');
const WINDOW_MS = 24 * 60 * 60 * 1000;

function historyEntry(candidate, now) {
  return {
    votes: candidate.votes,
    deckState: candidate.deckState,
    confirmationState: candidate.confirmationState || '',
    resolution: candidate.resolution,
    stagingRoute: candidate.stagingRoute || null,
    consensusReachedAt: candidate.consensusReachedAt || null,
    confirmationExpiresAt: candidate.confirmationExpiresAt || null,
    confirmedAt: candidate.confirmedAt || null,
    resolvedAt: candidate.resolvedAt || null,
    notes: candidate.notes || '',
    reason: 'cooling_off_migration',
    archivedAt: now,
  };
}

async function migrate() {
  await connectDB(process.env.MONGO_URI);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MS);
  const candidates = await DeclutterCandidate.collection.find({}).toArray();
  const candidateOperations = [];

  for (const candidate of candidates) {
    if (candidate.confirmationState) continue;
    const consensus = ['kept', 'release_approved', 'ready_to_declutter', 'ready_to_donate', 'ready_to_sell']
      .includes(candidate.resolution);
    const set = consensus
      ? {
          deckState: 'cooling_off',
          confirmationState: 'cooling_off',
          consensusReachedAt: now,
          confirmationExpiresAt: expiresAt,
          confirmedAt: null,
          resolvedAt: null,
        }
      : {
          confirmationState: 'voting',
          consensusReachedAt: null,
          confirmationExpiresAt: null,
          confirmedAt: null,
        };
    candidateOperations.push({
      updateOne: {
        filter: { _id: candidate._id, confirmationState: { $exists: false } },
        update: {
          $set: set,
          ...(consensus ? { $push: { roundHistory: historyEntry(candidate, now) } } : {}),
        },
      },
    });
  }

  const report = {
    operation: 'declutter.cooling_off.migrate',
    mode: shouldApply ? 'apply' : 'dry-run',
    scannedCandidates: candidates.length,
    candidatesNeedingUpdate: candidateOperations.length,
    deadlineUtc: expiresAt.toISOString(),
    physicalInventoryMoves: 0,
  };

  if (shouldApply) {
    if (candidateOperations.length) {
      await DeclutterCandidate.collection.bulkWrite(candidateOperations, { ordered: false });
    }
    await Item.collection.updateMany(
      { declutterExitState: { $exists: false } },
      { $set: { declutterExitState: 'none' } }
    );
    await Box.collection.updateMany(
      { declutterPurpose: { $exists: false } },
      { $set: { declutterPurpose: 'standard', declutterIsDefault: false } }
    );
  }

  console.log(JSON.stringify({
    ...report,
    nextStep: shouldApply
      ? 'Migration applied. Re-running is safe.'
      : 'No data changed. Review this report, then rerun with --apply.',
  }, null, 2));
}

migrate()
  .catch((error) => {
    console.error(JSON.stringify({
      operation: 'declutter.cooling_off.migrate',
      mode: shouldApply ? 'apply' : 'dry-run',
      error: { name: error?.name, message: error?.message, stack: error?.stack },
    }, null, 2));
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
