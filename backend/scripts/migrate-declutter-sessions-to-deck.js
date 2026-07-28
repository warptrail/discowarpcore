require('dotenv').config({ path: './backend/.env' });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DeclutterCandidate = require('../models/DeclutterCandidate');
const DeclutterSession = require('../models/DeclutterSession');
const DeclutterSessionItem = require('../models/DeclutterSessionItem');
const Item = require('../models/Item');
const {
  deriveCandidateState,
  emptyVotes,
  normalizeVote,
} = require('../services/declutterDeckService');

function toVotes(row) {
  const votes = emptyVotes();
  for (const entry of Array.isArray(row?.playerDecisions) ? row.playerDecisions : []) {
    if (!votes[entry?.player]) continue;
    const normalized = ['keep', 'toss', 'donate', 'sell', 'unsure'].includes(entry?.decision)
      ? normalizeVote(entry.decision)
      : null;
    votes[entry.player] = {
      decision: normalized?.decision || 'pending',
      exitPreference: normalized?.exitPreference || null,
      decidedAt: entry?.decidedAt || null,
    };
  }
  if (!row?.playerDecisions?.length && votes[row?.decidedBy] && ['keep', 'toss', 'donate', 'sell', 'unsure'].includes(row?.decision)) {
    const normalized = normalizeVote(row.decision);
    votes[row.decidedBy] = {
      decision: normalized.decision,
      exitPreference: normalized.exitPreference,
      decidedAt: row.decidedAt || null,
    };
  }
  return votes;
}

async function migrate() {
  await connectDB(process.env.MONGO_URI);
  const activeSessionIds = await DeclutterSession.find({ status: 'active' }).distinct('_id');
  const rows = await DeclutterSessionItem.find({ sessionId: { $in: activeSessionIds } })
    .sort({ updatedAt: -1, _id: -1 })
    .lean();
  const newestByItemId = new Map();
  for (const row of rows) {
    const itemId = String(row?.itemId || '');
    if (itemId && !newestByItemId.has(itemId)) newestByItemId.set(itemId, row);
  }

  let migrated = 0;
  let skippedExisting = 0;
  for (const row of newestByItemId.values()) {
    const itemId = String(row.itemId);
    const item = await Item.findById(itemId).select('_id').lean();
    if (!item) continue;
    const exists = await DeclutterCandidate.exists({ itemId });
    if (exists) {
      skippedExisting += 1;
      continue;
    }
    const votes = toVotes(row);
    const state = deriveCandidateState(votes);
    await DeclutterCandidate.create({
      itemId,
      nominatedBy: ['discofish', 'laserfox'].includes(row.proposedBy) ? row.proposedBy : '',
      nominatedAt: row.createdAt || new Date(),
      votes,
      deckState: state.deckState,
      resolution: state.resolution,
      stagingRoute: state.stagingRoute,
      resolvedAt: state.deckState === 'resolved' ? row.decidedAt || new Date() : null,
      notes: String(row.notes || ''),
    });
    await Item.findByIdAndUpdate(itemId, { $set: { declutterReadiness: state.readiness } });
    migrated += 1;
  }
  console.log(JSON.stringify({ activeSessionCount: activeSessionIds.length, sourceRows: rows.length, migrated, skippedExisting }, null, 2));
  await mongoose.disconnect();
}

migrate().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
