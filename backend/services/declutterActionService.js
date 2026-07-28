const DeclutterCandidate = require('../models/DeclutterCandidate');
const Item = require('../models/Item');
const Box = require('../models/Box');
const { attachItemToBox, detachItem } = require('./boxItemService');
const { markItemGone } = require('./itemService');
const { writeBackendLog, serializeError } = require('../utils/backendLogger');

const FINALIZING_STALE_MS = 5 * 60 * 1000;
const DESTRUCTION_TAG = 'marked_for_destruction';

function workflowLog(level, event, fields = {}) {
  writeBackendLog(level, `declutter.${event}`, fields);
}

async function rememberPreActionBox(candidate) {
  if (candidate.preActionBoxId) return candidate.preActionBoxId;
  const box = await Box.findOne({ items: candidate.itemId }).select('_id').lean();
  candidate.preActionBoxId = box?._id || null;
  if (candidate.preActionBoxId) {
    await DeclutterCandidate.updateOne(
      { _id: candidate._id, preActionBoxId: null },
      { $set: { preActionBoxId: candidate.preActionBoxId } }
    );
  }
  return candidate.preActionBoxId;
}

async function setExitState(itemId, exitState, { destruction = false } = {}) {
  const tagChange = destruction
    ? { $addToSet: { tags: DESTRUCTION_TAG } }
    : { $pull: { tags: DESTRUCTION_TAG } };
  return Item.findByIdAndUpdate(
    itemId,
    {
      $set: {
        declutterReadiness: 'ready_to_declutter',
        declutterExitState: exitState,
      },
      ...tagChange,
    },
    { new: true }
  );
}

async function routeConfirmedRelease(candidate, route = candidate.stagingRoute) {
  await rememberPreActionBox(candidate);
  if (route === 'discard') {
    await detachItem({ itemId: candidate.itemId });
    await setExitState(candidate.itemId, 'marked_for_destruction', { destruction: true });
    return { exitState: 'marked_for_destruction', boxId: null };
  }
  if (route === 'needs_routing') {
    await detachItem({ itemId: candidate.itemId });
    await setExitState(candidate.itemId, 'needs_routing');
    return { exitState: 'needs_routing', boxId: null };
  }

  const purpose = route === 'donate' ? 'donation_staging' : 'sale_staging';
  const defaultBox = await Box.findOne({
    declutterPurpose: purpose,
    declutterIsDefault: true,
  }).select('_id box_id label').lean();
  if (!defaultBox) {
    await detachItem({ itemId: candidate.itemId });
    await setExitState(candidate.itemId, 'needs_staging');
    workflowLog('warn', 'action.default_staging_missing', {
      candidateId: String(candidate._id),
      itemId: String(candidate.itemId),
      route,
      purpose,
    });
    return { exitState: 'needs_staging', boxId: null };
  }

  await attachItemToBox({
    itemId: candidate.itemId,
    boxId: defaultBox._id,
  });
  const exitState = route === 'donate' ? 'staged_for_donation' : 'staged_for_sale';
  await setExitState(candidate.itemId, exitState);
  workflowLog('info', 'action.staged', {
    candidateId: String(candidate._id),
    itemId: String(candidate.itemId),
    route,
    boxId: String(defaultBox._id),
    boxLabel: defaultBox.label,
  });
  return { exitState, boxId: defaultBox._id };
}

async function finalizeClaimedCandidate(candidate) {
  const item = await Item.findById(candidate.itemId);
  if (!item) {
    candidate.deckState = 'resolved';
    candidate.confirmationState = 'confirmed';
    candidate.confirmedAt = candidate.confirmedAt || new Date();
    candidate.resolvedAt = candidate.resolvedAt || candidate.confirmedAt;
    await candidate.save();
    return candidate;
  }
  if (item.item_status === 'gone') {
    item.declutterExitState = 'completed';
    item.tags = (item.tags || []).filter((tag) => tag !== DESTRUCTION_TAG);
    await item.save();
    candidate.deckState = 'resolved';
  } else if (candidate.resolution === 'kept') {
    item.declutterReadiness = 'kept';
    item.declutterExitState = 'none';
    item.tags = (item.tags || []).filter((tag) => tag !== DESTRUCTION_TAG);
    await item.save();
    candidate.deckState = 'resolved';
  } else {
    await routeConfirmedRelease(candidate);
    candidate.deckState = 'action';
  }
  const now = new Date();
  candidate.confirmationState = 'confirmed';
  candidate.confirmedAt = candidate.confirmedAt || now;
  candidate.resolvedAt = candidate.resolvedAt || now;
  await candidate.save();
  workflowLog('info', 'cooling_off.confirmed', {
    candidateId: String(candidate._id),
    itemId: String(candidate.itemId),
    resolution: candidate.resolution,
    stagingRoute: candidate.stagingRoute,
    deckState: candidate.deckState,
  });
  return candidate;
}

async function reconcileGoneActionItems() {
  const rows = await DeclutterCandidate.find({
    deckState: 'action',
    confirmationState: 'confirmed',
  }).select('_id itemId');
  if (!rows.length) return 0;
  const goneIds = await Item.distinct('_id', {
    _id: { $in: rows.map((row) => row.itemId) },
    item_status: 'gone',
  });
  if (!goneIds.length) return 0;
  await Item.updateMany(
    { _id: { $in: goneIds } },
    { $set: { declutterExitState: 'completed' }, $pull: { tags: DESTRUCTION_TAG } }
  );
  const result = await DeclutterCandidate.updateMany(
    { itemId: { $in: goneIds }, deckState: 'action' },
    { $set: { deckState: 'resolved' } }
  );
  return result.modifiedCount || result.nModified || 0;
}

async function reconcileExpiredDeclutterCandidates({ limit = 100, source = 'sweep' } = {}) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - FINALIZING_STALE_MS);
  await DeclutterCandidate.updateMany(
    {
      confirmationState: 'finalizing',
      updatedAt: { $lte: staleBefore },
    },
    { $set: { confirmationState: 'cooling_off' } }
  );

  let confirmed = 0;
  for (let index = 0; index < limit; index += 1) {
    const candidate = await DeclutterCandidate.findOneAndUpdate(
      {
        deckState: 'cooling_off',
        confirmationState: 'cooling_off',
        confirmationExpiresAt: { $lte: now },
      },
      { $set: { confirmationState: 'finalizing' } },
      { new: true, sort: { confirmationExpiresAt: 1 } }
    );
    if (!candidate) break;
    workflowLog('info', 'cooling_off.claimed', {
      source,
      candidateId: String(candidate._id),
      itemId: String(candidate.itemId),
    });
    try {
      await finalizeClaimedCandidate(candidate);
      confirmed += 1;
    } catch (error) {
      workflowLog('error', 'cooling_off.finalize_failed', {
        source,
        candidateId: String(candidate._id),
        itemId: String(candidate.itemId),
        error: serializeError(error),
      });
      await DeclutterCandidate.updateOne(
        { _id: candidate._id, confirmationState: 'finalizing' },
        { $set: { confirmationState: 'cooling_off' } }
      );
    }
  }
  const completedElsewhere = await reconcileGoneActionItems();
  return { confirmed, completedElsewhere };
}

function archiveRound(candidate, reason) {
  return {
    votes: candidate.votes,
    deckState: candidate.deckState,
    confirmationState: candidate.confirmationState,
    resolution: candidate.resolution,
    stagingRoute: candidate.stagingRoute,
    consensusReachedAt: candidate.consensusReachedAt,
    confirmationExpiresAt: candidate.confirmationExpiresAt,
    confirmedAt: candidate.confirmedAt,
    resolvedAt: candidate.resolvedAt,
    notes: candidate.notes,
    reason,
    archivedAt: new Date(),
  };
}

async function restorePreActionPlacement(candidate) {
  await Item.findByIdAndUpdate(candidate.itemId, {
    $set: { declutterExitState: 'none' },
    $pull: { tags: DESTRUCTION_TAG },
  });
  const boxExists = candidate.preActionBoxId
    ? await Box.exists({ _id: candidate.preActionBoxId })
    : null;
  if (boxExists) {
    await attachItemToBox({ itemId: candidate.itemId, boxId: candidate.preActionBoxId });
  } else {
    await detachItem({ itemId: candidate.itemId });
  }
}

async function getActionResources() {
  const stagingBoxes = await Box.find({
    declutterPurpose: { $in: ['donation_staging', 'sale_staging'] },
  })
    .select('_id box_id label declutterPurpose declutterIsDefault')
    .sort({ declutterPurpose: 1, declutterIsDefault: -1, label: 1 })
    .lean();
  return {
    stagingBoxes: stagingBoxes.map((box) => ({
      ...box,
      id: String(box._id),
      _id: String(box._id),
    })),
  };
}

async function rerouteAction(candidateId, { player, route, boxId, reason = '' } = {}) {
  const candidate = await DeclutterCandidate.findById(candidateId);
  if (!candidate || candidate.deckState !== 'action') throw Object.assign(new Error('Action candidate was not found.'), { status: 404 });
  if (candidate.stagingRoute === 'needs_routing' && player !== 'laserfox') {
    throw Object.assign(new Error('Laserfox resolves Needs Routing decisions.'), { status: 403 });
  }
  const normalizedRoute = ['discard', 'donate', 'sell'].includes(route) ? route : '';
  if (!normalizedRoute) throw Object.assign(new Error('Route must be discard, donate, or sell.'), { status: 400 });
  const previousRoute = candidate.stagingRoute;
  candidate.stagingRoute = normalizedRoute;
  if (boxId && ['donate', 'sell'].includes(normalizedRoute)) {
    const expectedPurpose = normalizedRoute === 'donate' ? 'donation_staging' : 'sale_staging';
    const box = await Box.findOne({ _id: boxId, declutterPurpose: expectedPurpose }).lean();
    if (!box) throw Object.assign(new Error('Choose a compatible staging box.'), { status: 400 });
    await attachItemToBox({ itemId: candidate.itemId, boxId: box._id });
    await setExitState(
      candidate.itemId,
      normalizedRoute === 'donate' ? 'staged_for_donation' : 'staged_for_sale'
    );
  } else {
    await routeConfirmedRelease(candidate, normalizedRoute);
  }
  candidate.actionOverride = {
    player: player || '',
    action: 'reroute',
    reason,
    previousRoute,
    nextRoute: normalizedRoute,
    at: new Date(),
  };
  await candidate.save();
  return candidate;
}

async function restoreActionAsKeep(candidateId, { player, reason = '' } = {}) {
  const candidate = await DeclutterCandidate.findById(candidateId);
  if (!candidate || candidate.deckState !== 'action') throw Object.assign(new Error('Action candidate was not found.'), { status: 404 });
  await restorePreActionPlacement(candidate);
  await Item.findByIdAndUpdate(candidate.itemId, {
    $set: { declutterReadiness: 'kept', declutterExitState: 'none' },
  });
  const previousRoute = candidate.stagingRoute;
  candidate.roundHistory.push(archiveRound(candidate, reason || 'restored_as_keep'));
  candidate.deckState = 'resolved';
  candidate.resolution = 'kept';
  candidate.stagingRoute = null;
  candidate.actionOverride = {
    player: player || '',
    action: 'restore_keep',
    reason,
    previousRoute,
    nextRoute: null,
    at: new Date(),
  };
  await candidate.save();
  return candidate;
}

async function reopenActionRound(candidateId, { player, reason = '' } = {}) {
  const candidate = await DeclutterCandidate.findById(candidateId);
  if (!candidate || !['action', 'resolved'].includes(candidate.deckState)) {
    throw Object.assign(new Error('Confirmed candidate was not found.'), { status: 404 });
  }
  const item = await Item.findById(candidate.itemId).lean();
  if (!item || item.item_status === 'gone') throw Object.assign(new Error('Gone inventory cannot be reopened.'), { status: 409 });
  await restorePreActionPlacement(candidate);
  candidate.roundHistory.push(archiveRound(candidate, reason || 'fresh_vote_round'));
  candidate.votes = {
    discofish: { decision: 'pending', exitPreference: null, decidedAt: null },
    laserfox: { decision: 'pending', exitPreference: null, decidedAt: null },
  };
  candidate.deckState = 'active';
  candidate.confirmationState = 'voting';
  candidate.resolution = 'pending';
  candidate.stagingRoute = null;
  candidate.consensusReachedAt = null;
  candidate.confirmationExpiresAt = null;
  candidate.confirmedAt = null;
  candidate.resolvedAt = null;
  candidate.actionOverride = {
    player: player || '',
    action: 'reopen_vote',
    reason,
    previousRoute: null,
    nextRoute: null,
    at: new Date(),
  };
  await candidate.save();
  await Item.findByIdAndUpdate(candidate.itemId, {
    $set: { declutterReadiness: 'in_deck', declutterExitState: 'none' },
  });
  return candidate;
}

async function completeAction(candidateId, { disposition, notes = '' } = {}) {
  const candidate = await DeclutterCandidate.findById(candidateId);
  if (!candidate || candidate.deckState !== 'action') throw Object.assign(new Error('Action candidate was not found.'), { status: 404 });
  const allowed = {
    discard: 'trashed',
    donate: 'donated',
    sell: 'sold',
  };
  const expectedDisposition = allowed[candidate.stagingRoute];
  if (!expectedDisposition || disposition !== expectedDisposition) {
    throw Object.assign(new Error(`This action must be completed as ${expectedDisposition || 'a routed exit'}.`), { status: 400 });
  }
  const item = await markItemGone(candidate.itemId, {
    disposition,
    dispositionNotes: notes,
    lastActiveBoxId: candidate.preActionBoxId,
  });
  if (!item) throw Object.assign(new Error('Inventory item was not found.'), { status: 404 });
  await Item.findByIdAndUpdate(candidate.itemId, {
    $set: { declutterExitState: 'completed' },
    $pull: { tags: DESTRUCTION_TAG },
  });
  candidate.deckState = 'resolved';
  await candidate.save();
  workflowLog('info', 'action.physically_completed', {
    candidateId: String(candidate._id),
    itemId: String(candidate.itemId),
    disposition,
  });
  return candidate;
}

let sweepTimer = null;
function startDeclutterConfirmationSweep({ intervalMs = 60_000 } = {}) {
  if (sweepTimer) return sweepTimer;
  reconcileExpiredDeclutterCandidates({ source: 'startup' }).catch((error) => {
    workflowLog('error', 'sweep.failed', { source: 'startup', error: serializeError(error) });
  });
  sweepTimer = setInterval(() => {
    reconcileExpiredDeclutterCandidates({ source: 'interval' }).catch((error) => {
      workflowLog('error', 'sweep.failed', { source: 'interval', error: serializeError(error) });
    });
  }, intervalMs);
  sweepTimer.unref?.();
  workflowLog('info', 'sweep.started', { intervalMs });
  return sweepTimer;
}

module.exports = {
  completeAction,
  getActionResources,
  reconcileExpiredDeclutterCandidates,
  reopenActionRound,
  rerouteAction,
  restoreActionAsKeep,
  routeConfirmedRelease,
  startDeclutterConfirmationSweep,
};
