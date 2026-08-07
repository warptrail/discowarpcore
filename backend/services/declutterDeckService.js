const mongoose = require('mongoose');

const DeclutterCandidate = require('../models/DeclutterCandidate');
const Item = require('../models/Item');
const Box = require('../models/Box');
const { writeBackendLog } = require('../utils/backendLogger');

const PLAYERS = DeclutterCandidate.PLAYERS;
const VOTES = DeclutterCandidate.VOTES;
const VISIBLE_VOTE_CHOICES = DeclutterCandidate.VISIBLE_VOTE_CHOICES;
const EXIT_PREFERENCES = DeclutterCandidate.EXIT_PREFERENCES;

const RELEASE_CHOICE_TO_PREFERENCE = Object.freeze({
  toss: 'discard',
  donate: 'donate',
  sell: 'sell',
  gift: 'gift',
});

const LEGACY_RELEASE_RESOLUTIONS = Object.freeze({
  ready_to_declutter: 'discard',
  ready_to_donate: 'donate',
  ready_to_sell: 'sell',
});

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizePlayer(value, { required = false } = {}) {
  const player = String(value || '').trim().toLowerCase();
  if (!player && !required) return '';
  if (!PLAYERS.includes(player)) {
    throw createHttpError(400, `Player must be one of: ${PLAYERS.join(', ')}.`);
  }
  return player;
}

function normalizeVote(value) {
  const choice = String(value || '').trim().toLowerCase();
  if (!VISIBLE_VOTE_CHOICES.includes(choice)) {
    throw createHttpError(400, `Vote must be one of: ${VISIBLE_VOTE_CHOICES.join(', ')}.`);
  }
  if (Object.prototype.hasOwnProperty.call(RELEASE_CHOICE_TO_PREFERENCE, choice)) {
    return {
      choice,
      decision: 'release',
      exitPreference: RELEASE_CHOICE_TO_PREFERENCE[choice],
    };
  }
  return { choice, decision: choice, exitPreference: null };
}

function assertObjectId(value, label) {
  const id = String(value || '').trim();
  if (!mongoose.isValidObjectId(id)) throw createHttpError(400, `Invalid ${label}.`);
  return id;
}

function assertItemIsReviewable(item) {
  if (String(item?.item_status || 'active').toLowerCase() !== 'active') {
    throw createHttpError(409, 'This inventory item is no longer active and cannot be in the Declutter Deck.');
  }
}

function emptyVotes() {
  return Object.fromEntries(
    PLAYERS.map((player) => [
      player,
      { decision: 'pending', exitPreference: null, decidedAt: null },
    ])
  );
}

function normalizeStoredVote(raw = {}) {
  const rawDecision = String(raw.decision || '').trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(RELEASE_CHOICE_TO_PREFERENCE, rawDecision)) {
    return {
      decision: 'release',
      exitPreference: RELEASE_CHOICE_TO_PREFERENCE[rawDecision],
      decidedAt: raw.decidedAt || null,
    };
  }
  if (rawDecision === 'release') {
    return {
      decision: 'release',
      exitPreference: EXIT_PREFERENCES.includes(raw.exitPreference)
        ? raw.exitPreference
        : 'discard',
      decidedAt: raw.decidedAt || null,
    };
  }
  return {
    decision: VOTES.includes(rawDecision) ? rawDecision : 'pending',
    exitPreference: null,
    decidedAt: raw.decidedAt || null,
  };
}

function normalizeVotes(candidateOrVotes) {
  const rawVotes = candidateOrVotes?.votes || candidateOrVotes || {};
  return Object.fromEntries(
    PLAYERS.map((player) => [player, normalizeStoredVote(rawVotes[player])])
  );
}

function getVisibleVoteChoice(vote) {
  const normalized = normalizeStoredVote(vote);
  if (normalized.decision !== 'release') return normalized.decision;
  if (normalized.exitPreference === 'donate') return 'donate';
  if (normalized.exitPreference === 'sell') return 'sell';
  if (normalized.exitPreference === 'gift') return 'gift';
  return 'toss';
}

function deriveStagingRoute(votes) {
  const normalized = normalizeVotes(votes);
  const preferences = PLAYERS.map((player) => normalized[player].exitPreference);
  if (PLAYERS.some((player) => normalized[player].decision !== 'release')) return null;
  const [first, second] = preferences;
  if (first === second) return first || 'discard';
  if (first === 'discard') return second;
  if (second === 'discard') return first;
  return 'needs_routing';
}

function deriveCandidateState(rawVotes, { now = new Date() } = {}) {
  const votes = normalizeVotes(rawVotes);
  const discofish = votes.discofish.decision;
  const laserfox = votes.laserfox.decision;
  if (discofish === 'pending' || laserfox === 'pending') {
    return {
      deckState: 'active',
      resolution: 'pending',
      readiness: 'in_deck',
      stagingRoute: null,
      confirmationState: 'voting',
      consensusReachedAt: null,
    };
  }
  if (discofish === 'unsure' || laserfox === 'unsure') {
    return {
      deckState: 'discussion',
      resolution: 'review_later',
      readiness: 'in_deck',
      stagingRoute: null,
      confirmationState: 'voting',
      consensusReachedAt: null,
    };
  }
  if (discofish === 'keep' && laserfox === 'keep') {
    return {
      deckState: 'resolved',
      resolution: 'kept',
      readiness: 'kept',
      stagingRoute: null,
      confirmationState: 'confirmed',
      consensusReachedAt: now,
    };
  }
  if (discofish === 'release' && laserfox === 'release') {
    return {
      deckState: 'action',
      resolution: 'release_approved',
      readiness: 'ready_to_declutter',
      stagingRoute: deriveStagingRoute(votes),
      confirmationState: 'confirmed',
      consensusReachedAt: now,
    };
  }
  return {
    deckState: 'discussion',
    resolution: 'conflict',
    readiness: 'in_deck',
    stagingRoute: null,
    confirmationState: 'voting',
    consensusReachedAt: null,
  };
}

function getCanonicalResolution(candidate, votes) {
  if (LEGACY_RELEASE_RESOLUTIONS[candidate.resolution]) return 'release_approved';
  return candidate.resolution;
}

function getCanonicalStagingRoute(candidate, votes) {
  if (candidate.stagingRoute) return candidate.stagingRoute;
  if (LEGACY_RELEASE_RESOLUTIONS[candidate.resolution]) {
    return LEGACY_RELEASE_RESOLUTIONS[candidate.resolution];
  }
  return deriveStagingRoute(votes);
}

function toClientItem(item) {
  if (!item) return null;
  const id = String(item._id || item.id || '').trim();
  return { ...item, id, _id: id };
}

function toClientCandidate(candidate, item, player = '') {
  const votes = normalizeVotes(candidate);
  const otherPlayer = player ? PLAYERS.find((entry) => entry !== player) : '';
  const myDecision = player ? votes[player].decision : 'pending';
  const otherDecision = otherPlayer ? votes[otherPlayer].decision : 'pending';
  const myVote = player ? getVisibleVoteChoice(votes[player]) : 'pending';
  const otherVote = otherPlayer ? getVisibleVoteChoice(votes[otherPlayer]) : 'pending';
  const partnerHasVoted = otherDecision !== 'pending';
  const clientVotes = Object.fromEntries(
    PLAYERS.map((votePlayer) => [
      votePlayer,
      {
        ...votes[votePlayer],
        selection: getVisibleVoteChoice(votes[votePlayer]),
      },
    ])
  );
  if (candidate.deckState === 'active' && myVote === 'pending' && partnerHasVoted) {
    clientVotes[otherPlayer] = {
      ...clientVotes[otherPlayer],
      decision: 'hidden',
      exitPreference: null,
      selection: 'hidden',
    };
  }
  return {
    id: String(candidate._id || candidate.id || ''),
    itemId: String(candidate.itemId || ''),
    nominatedBy: candidate.nominatedBy || '',
    nominatedAt: candidate.nominatedAt || null,
    votes: clientVotes,
    deckState: candidate.deckState,
    resolution: getCanonicalResolution(candidate, votes),
    stagingRoute: getCanonicalStagingRoute(candidate, votes),
    confirmationState: candidate.confirmationState || 'voting',
    consensusReachedAt: candidate.consensusReachedAt || null,
    confirmedAt: candidate.confirmedAt || null,
    actionCompletedAt: candidate.actionCompletedAt || null,
    preActionBoxId: candidate.preActionBoxId ? String(candidate.preActionBoxId) : null,
    actionOverride: candidate.actionOverride || null,
    resolvedAt: candidate.resolvedAt || null,
    notes: candidate.notes || '',
    createdAt: candidate.createdAt || null,
    updatedAt: candidate.updatedAt || null,
    myVote,
    otherVote:
      candidate.deckState === 'active' && myVote === 'pending' && partnerHasVoted
        ? 'hidden'
        : otherVote,
    partnerHasVoted,
    needsMyVote: candidate.deckState === 'active' && myVote === 'pending',
    otherVotedFirst:
      candidate.deckState === 'active' && myDecision === 'pending' && otherDecision !== 'pending',
    item: toClientItem(item),
  };
}

async function syncItemReadiness(itemId, readiness) {
  await Item.findByIdAndUpdate(itemId, { $set: { declutterReadiness: readiness } });
}

async function hydrateCandidates(candidates, player) {
  const itemIds = candidates.map((candidate) => candidate.itemId).filter(Boolean);
  const [items, boxes] = itemIds.length
    ? await Promise.all([
        Item.find({ _id: { $in: itemIds } })
          .select('_id name quantity description notes tags image imagePath category keepPriority primaryOwnerName item_status disposition disposition_at disposition_notes declutterReadiness declutterExitState isIntendedGift location orphanedAt')
          .lean(),
        Box.find({ items: { $in: itemIds } })
          .select('_id box_id label group location locationId items')
          .populate('locationId', 'name')
          .lean(),
      ])
    : [[], []];
  const boxByItemId = new Map();
  for (const box of boxes) {
    for (const boxedItemId of Array.isArray(box?.items) ? box.items : []) {
      const normalizedItemId = String(boxedItemId || '');
      if (!boxByItemId.has(normalizedItemId)) boxByItemId.set(normalizedItemId, box);
    }
  }
  for (const item of items) {
    const box = boxByItemId.get(String(item._id));
    if (!box) continue;
    item.box = {
      id: String(box._id),
      box_id: box.box_id || '',
      label: box.label || '',
      group: box.group || '',
      locationName: box?.locationId?.name || box.location || '',
    };
  }
  const byId = new Map(items.map((item) => [String(item._id), item]));
  return candidates.map((candidate) =>
    toClientCandidate(candidate, byId.get(String(candidate.itemId)) || null, player)
  );
}

function sortActiveCandidates(left, right) {
  if (left.otherVotedFirst !== right.otherVotedFirst) return left.otherVotedFirst ? -1 : 1;
  if (left.needsMyVote !== right.needsMyVote) return left.needsMyVote ? -1 : 1;
  return String(left.updatedAt || '').localeCompare(String(right.updatedAt || ''));
}

async function getDeclutterDeck({ player } = {}) {
  const activePlayer = normalizePlayer(player, { required: true });
  const { reconcileLegacyCoolingCandidates } = require('./declutterActionService');
  await reconcileLegacyCoolingCandidates({ limit: 100, source: 'deck_read' });
  const candidateItemIds = await DeclutterCandidate.distinct('itemId');
  const activeItemIds = await Item.distinct('_id', {
    _id: { $in: candidateItemIds },
    item_status: 'active',
  });
  const eligibleCandidateFilter = { itemId: { $in: activeItemIds } };
  const [activeRows, discussionRows, actionRows, resolvedRows, metricRows, physicallyCompleted] = await Promise.all([
    DeclutterCandidate.find({ ...eligibleCandidateFilter, deckState: 'active' }).sort({ updatedAt: 1, _id: 1 }).lean(),
    DeclutterCandidate.find({ ...eligibleCandidateFilter, deckState: 'discussion' }).sort({ updatedAt: -1, _id: -1 }).limit(100).lean(),
    DeclutterCandidate.find({ ...eligibleCandidateFilter, deckState: 'action' }).sort({ confirmedAt: -1, _id: -1 }).lean(),
    DeclutterCandidate.find({ deckState: 'resolved' }).sort({ resolvedAt: -1, _id: -1 }).limit(40).lean(),
    DeclutterCandidate.aggregate([
      { $match: eligibleCandidateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$deckState', 'active'] }, 1, 0] } },
          discussion: { $sum: { $cond: [{ $eq: ['$deckState', 'discussion'] }, 1, 0] } },
          action: { $sum: { $cond: [{ $eq: ['$deckState', 'action'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$deckState', 'resolved'] }, 1, 0] } },
          discofishReviewed: { $sum: { $cond: [{ $ne: ['$votes.discofish.decision', 'pending'] }, 1, 0] } },
          laserfoxReviewed: { $sum: { $cond: [{ $ne: ['$votes.laserfox.decision', 'pending'] }, 1, 0] } },
          discofishKeepVotes: { $sum: { $cond: [{ $eq: ['$votes.discofish.decision', 'keep'] }, 1, 0] } },
          laserfoxKeepVotes: { $sum: { $cond: [{ $eq: ['$votes.laserfox.decision', 'keep'] }, 1, 0] } },
          discofishReleaseVotes: { $sum: { $cond: [{ $eq: ['$votes.discofish.decision', 'release'] }, 1, 0] } },
          laserfoxReleaseVotes: { $sum: { $cond: [{ $eq: ['$votes.laserfox.decision', 'release'] }, 1, 0] } },
          discofishUnsureVotes: { $sum: { $cond: [{ $eq: ['$votes.discofish.decision', 'unsure'] }, 1, 0] } },
          laserfoxUnsureVotes: { $sum: { $cond: [{ $eq: ['$votes.laserfox.decision', 'unsure'] }, 1, 0] } },
          kept: { $sum: { $cond: [{ $eq: ['$resolution', 'kept'] }, 1, 0] } },
          releaseApproved: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$resolution',
                    [
                      'release_approved',
                      'ready_to_declutter',
                      'ready_to_donate',
                      'ready_to_sell',
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          unsure: { $sum: { $cond: [{ $eq: ['$resolution', 'review_later'] }, 1, 0] } },
          stagingDiscard: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$stagingRoute', 'discard'] },
                    { $eq: ['$resolution', 'ready_to_declutter'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          stagingDonate: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$stagingRoute', 'donate'] },
                    { $eq: ['$resolution', 'ready_to_donate'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          stagingSell: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$stagingRoute', 'sell'] },
                    { $eq: ['$resolution', 'ready_to_sell'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          stagingGift: {
            $sum: { $cond: [{ $eq: ['$stagingRoute', 'gift'] }, 1, 0] },
          },
          stagingNeedsRouting: {
            $sum: { $cond: [{ $eq: ['$stagingRoute', 'needs_routing'] }, 1, 0] },
          },
        },
      },
    ]),
    Item.countDocuments({ declutterExitState: 'completed' }),
  ]);
  const activeLength = activeRows.length;
  const discussionLength = discussionRows.length;
  const actionLength = actionRows.length;
  const hydrated = await hydrateCandidates(
    [...activeRows, ...discussionRows, ...actionRows, ...resolvedRows],
    activePlayer
  );
  const activeCandidates = hydrated.slice(0, activeLength).sort(sortActiveCandidates);
  const discussionCandidates = hydrated.slice(activeLength, activeLength + discussionLength);
  const actionCandidates = hydrated.slice(
    activeLength + discussionLength,
    activeLength + discussionLength + actionLength
  );
  const resolvedCandidates = hydrated.slice(
    activeLength + discussionLength + actionLength
  );
  const metrics = {
    total: 0,
    active: 0,
    discussion: 0,
    action: 0,
    resolved: 0,
    discofishReviewed: 0,
    laserfoxReviewed: 0,
    discofishKeepVotes: 0,
    laserfoxKeepVotes: 0,
    discofishReleaseVotes: 0,
    laserfoxReleaseVotes: 0,
    discofishUnsureVotes: 0,
    laserfoxUnsureVotes: 0,
    kept: 0,
    releaseApproved: 0,
    unsure: 0,
    stagingDiscard: 0,
    stagingDonate: 0,
    stagingSell: 0,
    stagingGift: 0,
    stagingNeedsRouting: 0,
    physicallyCompleted,
    ...(metricRows[0] || {}),
  };
  delete metrics._id;
  return {
    activeCandidates,
    discussionCandidates,
    actionCandidates,
    resolvedCandidates,
    counts: {
      active: metrics.active,
      discussion: metrics.discussion,
      action: metrics.action,
      resolved: metrics.resolved,
    },
    metrics,
    stagingTotals: {
      discard: metrics.stagingDiscard,
      donate: metrics.stagingDonate,
      sell: metrics.stagingSell,
      gift: metrics.stagingGift,
      needsRouting: metrics.stagingNeedsRouting,
    },
  };
}

const HISTORY_FILTERS = new Set([
  'all',
  'resolved',
  'active',
  'discussion',
  'action',
  'kept',
  'release_approved',
  'physically_completed',
]);
const HISTORY_ROUTE_FILTERS = new Set(['discard', 'donate', 'sell', 'gift']);
const HISTORY_ROUTE_BY_DISPOSITION = Object.freeze({
  trashed: 'discard',
  donated: 'donate',
  sold: 'sell',
  gifted: 'gift',
});

function matchesHistoryFilter(candidate, item, filter) {
  if (!filter || filter === 'all') return true;
  const isPhysicallyCompleted = item?.declutterExitState === 'completed'
    || String(item?.item_status || '').trim().toLowerCase() === 'gone';
  if (filter === 'physically_completed') return isPhysicallyCompleted;
  if (filter === 'kept') return candidate.resolution === 'kept';
  if (filter === 'release_approved') {
    return !isPhysicallyCompleted
      && ['release_approved', 'ready_to_declutter', 'ready_to_donate', 'ready_to_sell']
      .includes(candidate.resolution);
  }
  return candidate.deckState === filter;
}

function matchesHistoryRoute(candidate, item, routeFilter) {
  if (!routeFilter) return true;
  const dispositionRoute = HISTORY_ROUTE_BY_DISPOSITION[
    String(item?.disposition || '').trim().toLowerCase()
  ];
  const isPhysicallyCompleted = item?.declutterExitState === 'completed'
    || String(item?.item_status || '').trim().toLowerCase() === 'gone';
  const authoritativeRoute = isPhysicallyCompleted && dispositionRoute
    ? dispositionRoute
    : String(candidate?.stagingRoute || '').trim().toLowerCase();
  return authoritativeRoute === routeFilter;
}

async function getDeclutterHistory({ filter = 'all', route = '', player = '', page = 1, limit = 10 } = {}) {
  const normalizedFilter = HISTORY_FILTERS.has(String(filter || '').trim().toLowerCase())
    ? String(filter || '').trim().toLowerCase()
    : 'all';
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const requestedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedRoute = String(route || '').trim().toLowerCase() === 'toss'
    ? 'discard'
    : String(route || '').trim().toLowerCase();
  const routeFilter = HISTORY_ROUTE_FILTERS.has(normalizedRoute) ? normalizedRoute : '';
  const candidates = await DeclutterCandidate.find({})
    .sort({ resolvedAt: -1, updatedAt: -1, _id: -1 })
    .lean();
  const hydrated = await hydrateCandidates(candidates, normalizePlayer(player));
  const filtered = hydrated.filter((candidate) => (
    matchesHistoryFilter(candidate, candidate.item, normalizedFilter)
      && matchesHistoryRoute(candidate, candidate.item, routeFilter)
  ));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  return {
    filter: normalizedFilter,
    route: routeFilter,
    candidates: filtered.slice(offset, offset + pageSize),
    total,
    page: currentPage,
    limit: pageSize,
    totalPages,
  };
}

async function nominateDeclutterCandidate(payload = {}) {
  const itemId = assertObjectId(payload.itemId, 'itemId');
  const nominatedBy = normalizePlayer(payload.nominatedBy);
  const item = await Item.findById(itemId).lean();
  if (!item) throw createHttpError(404, 'Inventory item was not found.');
  assertItemIsReviewable(item);

  const existing = await DeclutterCandidate.findOne({ itemId });
  if (existing?.confirmationState === 'confirmed') {
    throw createHttpError(409, 'This item has a confirmed result. Use an explicit Actions command to reopen it.');
  }
  if (existing && existing.deckState !== 'resolved') {
    return { candidate: toClientCandidate(existing.toObject(), item, nominatedBy), created: false, reopened: false };
  }

  const nextValues = {
    itemId,
    nominatedBy,
    nominatedAt: new Date(),
    votes: emptyVotes(),
    deckState: 'active',
    resolution: 'pending',
    stagingRoute: null,
    resolvedAt: null,
    confirmationState: 'voting',
    consensusReachedAt: null,
    confirmedAt: null,
    actionCompletedAt: null,
    preActionBoxId: null,
    actionOverride: {},
    notes: String(payload.notes || '').trim().slice(0, 2000),
  };
  const candidate = existing
    ? await DeclutterCandidate.findByIdAndUpdate(existing._id, { $set: nextValues }, { new: true })
    : await DeclutterCandidate.create(nextValues);
  await syncItemReadiness(itemId, 'in_deck');
  return {
    candidate: toClientCandidate(candidate.toObject(), item, nominatedBy),
    created: !existing,
    reopened: Boolean(existing),
  };
}

async function removeDeclutterCandidateByItem(itemId) {
  const normalizedItemId = assertObjectId(itemId, 'itemId');
  const candidate = await DeclutterCandidate.findOne({ itemId: normalizedItemId });
  if (!candidate) {
    return { removed: false, itemId: normalizedItemId };
  }
  if (candidate.deckState === 'resolved') {
    throw createHttpError(409, 'A completed Declutter Deck decision cannot be removed. Reopen it to start a new round.');
  }

  await DeclutterCandidate.deleteOne({ _id: candidate._id });
  await syncItemReadiness(normalizedItemId, 'not_considered');
  return { removed: true, itemId: normalizedItemId };
}

async function voteOnDeclutterCandidate(candidateId, payload = {}) {
  const id = assertObjectId(candidateId, 'candidateId');
  const player = normalizePlayer(payload.player, { required: true });
  const vote = normalizeVote(payload.vote);
  const candidate = await DeclutterCandidate.findById(id);
  if (!candidate) throw createHttpError(404, 'Declutter candidate was not found.');
  if (candidate.deckState !== 'active') {
    throw createHttpError(409, 'This decision is locked. Use an Actions command to reopen a confirmed result.');
  }
  const item = await Item.findById(candidate.itemId).select('_id item_status').lean();
  if (!item) throw createHttpError(404, 'Inventory item was not found.');
  assertItemIsReviewable(item);

  candidate.votes = normalizeVotes(candidate);
  const previousVote = candidate.votes[player];
  if (
    previousVote.decision === vote.decision &&
    previousVote.exitPreference === vote.exitPreference
  ) {
    return (await hydrateCandidates([candidate.toObject()], player))[0];
  }
  candidate.votes[player] = {
    decision: vote.decision,
    exitPreference: vote.exitPreference,
    decidedAt: new Date(),
  };
  candidate.markModified('votes');
  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    candidate.notes = String(payload.notes || '').trim().slice(0, 2000);
  }
  const state = deriveCandidateState(candidate.votes);
  candidate.deckState = state.deckState;
  candidate.resolution = state.resolution;
  candidate.stagingRoute = state.stagingRoute;
  candidate.confirmationState = state.confirmationState;
  candidate.consensusReachedAt = state.consensusReachedAt;
  candidate.confirmedAt = null;
  candidate.resolvedAt = null;
  await candidate.save();
  await syncItemReadiness(candidate.itemId, state.readiness);
  let finalizedCandidate = candidate;
  if (state.confirmationState === 'confirmed') {
    const { finalizeCandidateImmediately } = require('./declutterActionService');
    finalizedCandidate = await finalizeCandidateImmediately(candidate, { source: 'vote_consensus' });
  }
  writeBackendLog('info', state.confirmationState === 'confirmed'
    ? 'declutter.candidate.consensus_confirmed'
    : 'declutter.candidate.vote_changed', {
    candidateId: String(candidate._id),
    itemId: String(candidate.itemId),
    player,
    deckState: state.deckState,
    resolution: state.resolution,
  });
  return (await hydrateCandidates([finalizedCandidate.toObject()], player))[0];
}

async function resetOwnDeclutterVote(candidateId, payload = {}) {
  const id = assertObjectId(candidateId, 'candidateId');
  const player = normalizePlayer(payload.player, { required: true });
  const candidate = await DeclutterCandidate.findById(id);
  if (!candidate) throw createHttpError(404, 'Declutter candidate was not found.');
  if (candidate.deckState !== 'active') {
    throw createHttpError(409, 'Confirmed decisions can only be changed through Actions.');
  }
  const item = await Item.findById(candidate.itemId).select('_id item_status').lean();
  if (!item) throw createHttpError(404, 'Inventory item was not found.');
  assertItemIsReviewable(item);
  candidate.votes = normalizeVotes(candidate);
  if (candidate.votes[player].decision === 'pending') {
    return (await hydrateCandidates([candidate.toObject()], player))[0];
  }
  candidate.votes[player] = { decision: 'pending', exitPreference: null, decidedAt: null };
  candidate.markModified('votes');
  const state = deriveCandidateState(candidate.votes);
  candidate.deckState = state.deckState;
  candidate.resolution = state.resolution;
  candidate.stagingRoute = state.stagingRoute;
  candidate.confirmationState = state.confirmationState;
  candidate.consensusReachedAt = state.consensusReachedAt;
  candidate.confirmedAt = null;
  candidate.resolvedAt = null;
  await candidate.save();
  await syncItemReadiness(candidate.itemId, 'in_deck');
  writeBackendLog('info', 'declutter.candidate.vote_reset', {
    candidateId: String(candidate._id),
    itemId: String(candidate.itemId),
    player,
  });
  return (await hydrateCandidates([candidate.toObject()], player))[0];
}

async function resetAllOwnDeclutterVotes(payload = {}) {
  const player = normalizePlayer(payload.player, { required: true });
  const candidates = await DeclutterCandidate.find({
    deckState: 'active',
    [`votes.${player}.decision`]: { $ne: 'pending' },
  });
  const resetIds = [];
  for (const candidate of candidates) {
    candidate.votes = normalizeVotes(candidate);
    candidate.votes[player] = { decision: 'pending', exitPreference: null, decidedAt: null };
    candidate.markModified('votes');
    const state = deriveCandidateState(candidate.votes);
    candidate.deckState = state.deckState;
    candidate.resolution = state.resolution;
    candidate.stagingRoute = state.stagingRoute;
    candidate.confirmationState = state.confirmationState;
    candidate.consensusReachedAt = state.consensusReachedAt;
    candidate.confirmedAt = null;
    candidate.resolvedAt = null;
    await candidate.save();
    await syncItemReadiness(candidate.itemId, 'in_deck');
    resetIds.push(String(candidate._id));
  }
  writeBackendLog('info', 'declutter.candidate.vote_reset_all', {
    player,
    resetCount: resetIds.length,
    candidateIds: resetIds,
  });
  return { player, resetCount: resetIds.length, candidateIds: resetIds };
}

async function reopenDeclutterCandidate(candidateId) {
  const id = assertObjectId(candidateId, 'candidateId');
  const existing = await DeclutterCandidate.findById(id);
  if (!existing) throw createHttpError(404, 'Declutter candidate was not found.');
  const item = await Item.findById(existing.itemId).select('_id item_status').lean();
  if (!item) throw createHttpError(404, 'Inventory item was not found.');
  assertItemIsReviewable(item);
  if (existing.confirmationState === 'confirmed') {
    throw createHttpError(409, 'Confirmed decisions can only be reopened through Actions.');
  }
  const historyEntry = {
    votes: normalizeVotes(existing),
    deckState: existing.deckState,
    confirmationState: existing.confirmationState || 'voting',
    resolution: existing.resolution,
    stagingRoute: existing.stagingRoute,
    consensusReachedAt: existing.consensusReachedAt,
    confirmedAt: existing.confirmedAt,
    resolvedAt: existing.resolvedAt,
    notes: existing.notes,
    reason: 'discussion_reopened',
    archivedAt: new Date(),
  };
  const candidate = await DeclutterCandidate.findByIdAndUpdate(
    id,
    {
      $set: {
        votes: emptyVotes(),
        deckState: 'active',
        resolution: 'pending',
        stagingRoute: null,
        resolvedAt: null,
        confirmationState: 'voting',
        consensusReachedAt: null,
        confirmedAt: null,
      },
      $push: { roundHistory: historyEntry },
    },
    { new: true }
  );
  if (!candidate) throw createHttpError(404, 'Declutter candidate was not found.');
  await syncItemReadiness(candidate.itemId, 'in_deck');
  return (await hydrateCandidates([candidate.toObject()], ''))[0];
}

module.exports = {
  getDeclutterDeck,
  getDeclutterHistory,
  matchesHistoryFilter,
  matchesHistoryRoute,
  nominateDeclutterCandidate,
  removeDeclutterCandidateByItem,
  voteOnDeclutterCandidate,
  resetOwnDeclutterVote,
  resetAllOwnDeclutterVotes,
  reopenDeclutterCandidate,
  deriveCandidateState,
  deriveStagingRoute,
  emptyVotes,
  getVisibleVoteChoice,
  normalizeStoredVote,
  normalizeVote,
  normalizeVotes,
  toClientCandidate,
  hydrateCandidates,
  normalizePlayer,
  createHttpError,
  assertItemIsReviewable,
};
