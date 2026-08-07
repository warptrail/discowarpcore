const DeclutterCandidate = require('../models/DeclutterCandidate');
const Item = require('../models/Item');
const Box = require('../models/Box');
const { attachItemToBox, detachItem } = require('./boxItemService');
const { markItemGone } = require('./itemService');
const { writeBackendLog, serializeError } = require('../utils/backendLogger');
const {
  STAGING_BOX_PURPOSES,
  getBoxPurposeForRoute,
} = require('../utils/declutterBoxPurpose');

const DESTRUCTION_TAG = 'marked_for_destruction';
const COMPLETION_DISPOSITION_BY_ROUTE = Object.freeze({
  discard: 'trashed',
  donate: 'donated',
  sell: 'sold',
  gift: 'gifted',
});

function getCompletionDispositionForRoute(route) {
  return COMPLETION_DISPOSITION_BY_ROUTE[String(route || '').trim().toLowerCase()] || null;
}

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
    // A discard decision is only a pending physical action. Keep the item in
    // its original box while it is marked for destruction; the later Trash
    // Run completion calls markItemGone(), which removes it from active views.
    await setExitState(candidate.itemId, 'marked_for_destruction', { destruction: true });
    return {
      exitState: 'marked_for_destruction',
      boxId: candidate.preActionBoxId || null,
    };
  }
  if (route === 'needs_routing') {
    await detachItem({ itemId: candidate.itemId });
    await setExitState(candidate.itemId, 'needs_routing');
    return { exitState: 'needs_routing', boxId: null };
  }
  if (route === 'gift') {
    await Item.findByIdAndUpdate(candidate.itemId, {
      $set: {
        declutterReadiness: 'ready_to_declutter',
        declutterExitState: 'awaiting_gift',
        isIntendedGift: true,
      },
      $pull: { tags: DESTRUCTION_TAG },
    });
    workflowLog('info', 'action.gift_intent_confirmed', {
      candidateId: String(candidate._id),
      itemId: String(candidate.itemId),
      boxId: candidate.preActionBoxId ? String(candidate.preActionBoxId) : null,
    });
    return {
      exitState: 'awaiting_gift',
      boxId: candidate.preActionBoxId || null,
    };
  }

  // A democratic exit decision establishes intent, not physical placement.
  // Keep the item where it is until Actions explicitly chooses a staging box.
  await setExitState(candidate.itemId, 'needs_staging');
  workflowLog('info', 'action.staging_choice_needed', {
    candidateId: String(candidate._id),
    itemId: String(candidate.itemId),
    route,
    currentBoxId: candidate.preActionBoxId ? String(candidate.preActionBoxId) : null,
  });
  return { exitState: 'needs_staging', boxId: candidate.preActionBoxId || null };
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
  workflowLog('info', 'decision.confirmed', {
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

async function finalizeCandidateImmediately(candidate, { source = 'consensus' } = {}) {
  const finalized = await finalizeClaimedCandidate(candidate);
  workflowLog('info', 'decision.finalized_immediately', {
    source,
    candidateId: String(finalized._id),
    itemId: String(finalized.itemId),
    deckState: finalized.deckState,
    resolution: finalized.resolution,
    stagingRoute: finalized.stagingRoute,
  });
  return finalized;
}

async function reconcileLegacyCoolingCandidates({ limit = 100, source = 'deck_read' } = {}) {
  let confirmed = 0;
  for (let index = 0; index < limit; index += 1) {
    const candidate = await DeclutterCandidate.findOneAndUpdate(
      {
        deckState: 'cooling_off',
        confirmationState: { $ne: 'confirmed' },
      },
      {
        $set: {
          confirmationState: 'confirmed',
        },
      },
      { new: true, sort: { updatedAt: 1 } }
    );
    if (!candidate) break;
    workflowLog('info', 'legacy_cooling.promoting', {
      source,
      candidateId: String(candidate._id),
      itemId: String(candidate.itemId),
    });
    try {
      await finalizeCandidateImmediately(candidate, { source: 'legacy_cooling_reconciliation' });
      confirmed += 1;
    } catch (error) {
      workflowLog('error', 'legacy_cooling.promotion_failed', {
        source,
        candidateId: String(candidate._id),
        itemId: String(candidate.itemId),
        error: serializeError(error),
      });
      await DeclutterCandidate.updateOne(
        { _id: candidate._id, deckState: 'cooling_off' },
        { $set: { confirmationState: 'voting' } }
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
    confirmedAt: candidate.confirmedAt,
    actionCompletedAt: candidate.actionCompletedAt,
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
    declutterPurpose: { $in: STAGING_BOX_PURPOSES },
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

async function rerouteAction(candidateId, {
  player,
  route,
  boxId,
  leaveInPlace = false,
  reason = '',
} = {}) {
  const candidate = await DeclutterCandidate.findById(candidateId);
  if (!candidate || candidate.deckState !== 'action') throw Object.assign(new Error('Action candidate was not found.'), { status: 404 });
  if (candidate.stagingRoute === 'needs_routing' && player !== 'laserfox') {
    throw Object.assign(new Error('Laserfox resolves Needs Routing decisions.'), { status: 403 });
  }
  const normalizedRoute = ['discard', 'donate', 'sell', 'gift'].includes(route) ? route : '';
  if (!normalizedRoute) throw Object.assign(new Error('Route must be discard, donate, sell, or gift.'), { status: 400 });
  const previousRoute = candidate.stagingRoute;
  candidate.stagingRoute = normalizedRoute;
  if (leaveInPlace && ['donate', 'sell'].includes(normalizedRoute)) {
    await setExitState(candidate.itemId, 'needs_staging');
  } else if (boxId) {
    const expectedPurpose = getBoxPurposeForRoute(normalizedRoute);
    const box = await Box.findOne({ _id: boxId, declutterPurpose: expectedPurpose }).lean();
    if (!box) throw Object.assign(new Error('Choose a compatible staging box.'), { status: 400 });
    await attachItemToBox({ itemId: candidate.itemId, boxId: box._id });
    if (normalizedRoute === 'gift') {
      await Item.findByIdAndUpdate(candidate.itemId, {
        $set: {
          declutterReadiness: 'ready_to_declutter',
          declutterExitState: 'awaiting_gift',
          isIntendedGift: true,
        },
        $pull: { tags: DESTRUCTION_TAG },
      });
    } else {
      const exitState = {
        discard: 'marked_for_destruction',
        donate: 'staged_for_donation',
        sell: 'staged_for_sale',
      }[normalizedRoute];
      await setExitState(candidate.itemId, exitState, {
        destruction: normalizedRoute === 'discard',
      });
    }
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
  candidate.confirmedAt = null;
  candidate.actionCompletedAt = null;
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
  const expectedDisposition = getCompletionDispositionForRoute(candidate.stagingRoute);
  if (!expectedDisposition || disposition !== expectedDisposition) {
    throw Object.assign(new Error(`This action must be completed as ${expectedDisposition || 'a routed exit'}.`), { status: 400 });
  }
  const actionCompletedAt = new Date();
  const item = await markItemGone(candidate.itemId, {
    disposition,
    dispositionAt: actionCompletedAt,
    dispositionNotes: notes,
    lastActiveBoxId: candidate.preActionBoxId,
  });
  if (!item) throw Object.assign(new Error('Inventory item was not found.'), { status: 404 });
  await Item.findByIdAndUpdate(candidate.itemId, {
    $set: { declutterExitState: 'completed' },
    $pull: { tags: DESTRUCTION_TAG },
  });
  candidate.deckState = 'resolved';
  candidate.actionCompletedAt = actionCompletedAt;
  await candidate.save();
  workflowLog('info', 'action.physically_completed', {
    candidateId: String(candidate._id),
    itemId: String(candidate.itemId),
    disposition,
    actionCompletedAt,
  });
  return candidate;
}

module.exports = {
  completeAction,
  finalizeCandidateImmediately,
  getCompletionDispositionForRoute,
  getActionResources,
  reconcileLegacyCoolingCandidates,
  reopenActionRound,
  rerouteAction,
  restoreActionAsKeep,
  routeConfirmedRelease,
};
