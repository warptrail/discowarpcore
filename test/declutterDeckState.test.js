const test = require('node:test');
const assert = require('node:assert/strict');

const {
  deriveCandidateState,
  deriveSharedResolutionState,
  emptyVotes,
  getVisibleVoteChoice,
  getRecommendedDiscussionChoice,
  matchesHistoryFilter,
  matchesHistoryRoute,
  normalizeVote,
  toClientCandidate,
} = require('../backend/services/declutterDeckService');
const {
  buildReleaseMigration,
} = require('../backend/utils/declutterReleaseMigration');
const Item = require('../backend/models/Item');
const { shouldSetGiftIntent } = require('../backend/services/boxItemService');
const {
  getCompletionDispositionForRoute,
} = require('../backend/services/declutterActionService');

function voteFor(choice, decidedAt = null) {
  if (choice === 'pending') {
    return { decision: 'pending', exitPreference: null, decidedAt };
  }
  const normalized = normalizeVote(choice);
  return {
    decision: normalized.decision,
    exitPreference: normalized.exitPreference,
    decidedAt,
  };
}

const NOW = new Date('2026-07-27T12:00:00.000Z');

function stateFor(discofish, laserfox) {
  const votes = emptyVotes();
  votes.discofish = voteFor(discofish);
  votes.laserfox = voteFor(laserfox);
  return deriveCandidateState(votes, { now: NOW });
}

const votingFields = {
  confirmationState: 'voting',
  consensusReachedAt: null,
};

const confirmedFields = {
  confirmationState: 'confirmed',
  consensusReachedAt: NOW,
};

test('visible choices normalize to canonical decisions and exit preferences', () => {
  assert.deepEqual(normalizeVote('keep'), {
    choice: 'keep',
    decision: 'keep',
    exitPreference: null,
  });
  assert.deepEqual(normalizeVote('toss'), {
    choice: 'toss',
    decision: 'release',
    exitPreference: 'discard',
  });
  assert.deepEqual(normalizeVote('donate'), {
    choice: 'donate',
    decision: 'release',
    exitPreference: 'donate',
  });
  assert.deepEqual(normalizeVote('sell'), {
    choice: 'sell',
    decision: 'release',
    exitPreference: 'sell',
  });
  assert.deepEqual(normalizeVote('gift'), {
    choice: 'gift',
    decision: 'release',
    exitPreference: 'gift',
  });
  assert.deepEqual(normalizeVote('unsure'), {
    choice: 'unsure',
    decision: 'unsure',
    exitPreference: null,
  });
});

test('physical departure completion enforces the agreed route disposition', () => {
  assert.equal(getCompletionDispositionForRoute('discard'), 'trashed');
  assert.equal(getCompletionDispositionForRoute('donate'), 'donated');
  assert.equal(getCompletionDispositionForRoute('sell'), 'sold');
  assert.equal(getCompletionDispositionForRoute('gift'), 'gifted');
  assert.equal(getCompletionDispositionForRoute('needs_routing'), null);
});

test('approved-to-leave history excludes items that have already departed', () => {
  const candidate = { resolution: 'release_approved', deckState: 'resolved' };

  assert.equal(matchesHistoryFilter(candidate, {
    item_status: 'active',
    declutterExitState: 'staged_for_sale',
  }, 'release_approved'), true);
  assert.equal(matchesHistoryFilter(candidate, {
    item_status: 'gone',
    declutterExitState: 'completed',
  }, 'release_approved'), false);
  assert.equal(matchesHistoryFilter(candidate, {
    item_status: 'gone',
    declutterExitState: 'completed',
  }, 'physically_completed'), true);
});

test('history route filters prefer actual disposition over the planned route', () => {
  const candidate = { stagingRoute: 'discard' };

  assert.equal(matchesHistoryRoute(candidate, {
    item_status: 'active',
    disposition: null,
  }, 'discard'), true);
  assert.equal(matchesHistoryRoute(candidate, {
    item_status: 'gone',
    disposition: 'donated',
  }, 'donate'), true);
  assert.equal(matchesHistoryRoute(candidate, {
    item_status: 'gone',
    disposition: 'donated',
  }, 'discard'), false);
});

test('gift intent defaults false and entering a gift box sets it only when needed', () => {
  const item = new Item({ name: 'Future present' });
  assert.equal(item.isIntendedGift, false);
  assert.equal(shouldSetGiftIntent(item, { isGiftBox: true }), true);
  assert.equal(shouldSetGiftIntent({ isIntendedGift: true }, { isGiftBox: true }), false);
  assert.equal(shouldSetGiftIntent({ isIntendedGift: false }, { isGiftBox: false }), false);
});

test('pending votes keep a candidate in the active deck', () => {
  assert.deepEqual(stateFor('keep', 'pending'), {
    deckState: 'active',
    resolution: 'pending',
    readiness: 'in_deck',
    stagingRoute: null,
    ...votingFields,
  });
});

test('pending takes precedence over Unsure until both players have decided', () => {
  assert.deepEqual(stateFor('unsure', 'pending'), {
    deckState: 'active',
    resolution: 'pending',
    readiness: 'in_deck',
    stagingRoute: null,
    ...votingFields,
  });
});

test('matching Keep votes resolve immediately', () => {
  assert.deepEqual(stateFor('keep', 'keep'), {
    deckState: 'resolved',
    resolution: 'kept',
    readiness: 'kept',
    stagingRoute: null,
    ...confirmedFields,
  });
});

const releasePairings = [
  ['toss', 'toss', 'discard'],
  ['toss', 'donate', 'donate'],
  ['donate', 'toss', 'donate'],
  ['toss', 'sell', 'sell'],
  ['sell', 'toss', 'sell'],
  ['donate', 'donate', 'donate'],
  ['sell', 'sell', 'sell'],
  ['toss', 'gift', 'gift'],
  ['gift', 'toss', 'gift'],
  ['gift', 'gift', 'gift'],
  ['donate', 'gift', 'needs_routing'],
  ['gift', 'donate', 'needs_routing'],
  ['sell', 'gift', 'needs_routing'],
  ['gift', 'sell', 'needs_routing'],
  ['donate', 'sell', 'needs_routing'],
  ['sell', 'donate', 'needs_routing'],
];

for (const [first, second, stagingRoute] of releasePairings) {
  test(`${first} + ${second} approves release through ${stagingRoute}`, () => {
    assert.deepEqual(stateFor(first, second), {
      deckState: 'action',
      resolution: 'release_approved',
      readiness: 'ready_to_declutter',
      stagingRoute,
      ...confirmedFields,
    });
  });
}

for (const releaseChoice of ['toss', 'donate', 'sell', 'gift']) {
  test(`Keep + ${releaseChoice} routes the candidate to discussion`, () => {
    assert.deepEqual(stateFor('keep', releaseChoice), {
      deckState: 'discussion',
      resolution: 'conflict',
      readiness: 'in_deck',
      stagingRoute: null,
      ...votingFields,
    });
  });
}

const unsurePairings = [
  ['keep', 'resolved', 'kept', null],
  ['toss', 'action', 'release_approved', 'discard'],
  ['donate', 'action', 'release_approved', 'donate'],
  ['sell', 'action', 'release_approved', 'sell'],
  ['gift', 'action', 'release_approved', 'gift'],
];

for (const [decisiveChoice, deckState, resolution, stagingRoute] of unsurePairings) {
  test(`Unsure + ${decisiveChoice} accepts the decisive choice`, () => {
    assert.deepEqual(stateFor('unsure', decisiveChoice), {
      deckState,
      resolution,
      readiness: decisiveChoice === 'keep' ? 'kept' : 'ready_to_declutter',
      stagingRoute,
      ...confirmedFields,
    });
  });
}

test('Unsure + Unsure defaults to Keep', () => {
  assert.deepEqual(stateFor('unsure', 'unsure'), {
    deckState: 'resolved',
    resolution: 'kept',
    readiness: 'kept',
    stagingRoute: null,
    ...confirmedFields,
  });
});

test('a shared discussion decision can explicitly override the inferred outcome', () => {
  assert.deepEqual(deriveSharedResolutionState('toss', { now: NOW }), {
    deckState: 'action',
    resolution: 'release_approved',
    readiness: 'ready_to_declutter',
    stagingRoute: 'discard',
    ...confirmedFields,
  });
  assert.deepEqual(deriveSharedResolutionState('keep', { now: NOW }), {
    deckState: 'resolved',
    resolution: 'kept',
    readiness: 'kept',
    stagingRoute: null,
    ...confirmedFields,
  });
});

test('discussion recommendations make specific and decisive choices win', () => {
  assert.equal(getRecommendedDiscussionChoice({
    discofish: voteFor('toss'),
    laserfox: voteFor('sell'),
  }), 'sell');
  assert.equal(getRecommendedDiscussionChoice({
    discofish: voteFor('unsure'),
    laserfox: voteFor('gift'),
  }), 'gift');
  assert.equal(getRecommendedDiscussionChoice({
    discofish: voteFor('unsure'),
    laserfox: voteFor('unsure'),
  }), 'keep');
  assert.equal(getRecommendedDiscussionChoice({
    discofish: voteFor('keep'),
    laserfox: voteFor('toss'),
  }), null);
});

test('stored release votes retain their original visible choice', () => {
  assert.equal(
    getVisibleVoteChoice({ decision: 'release', exitPreference: 'discard' }),
    'toss'
  );
  assert.equal(
    getVisibleVoteChoice({ decision: 'release', exitPreference: 'donate' }),
    'donate'
  );
  assert.equal(
    getVisibleVoteChoice({ decision: 'release', exitPreference: 'sell' }),
    'sell'
  );
  assert.equal(
    getVisibleVoteChoice({ decision: 'release', exitPreference: 'gift' }),
    'gift'
  );
});

test('partner decision and exit preference stay private until the current player votes', () => {
  const candidate = toClientCandidate(
    {
      _id: 'candidate-fixture',
      itemId: 'item-fixture',
      votes: {
        discofish: voteFor('pending'),
        laserfox: voteFor('donate'),
      },
      deckState: 'active',
      resolution: 'pending',
      stagingRoute: null,
    },
    null,
    'discofish'
  );

  assert.equal(candidate.partnerHasVoted, true);
  assert.equal(candidate.otherVote, 'hidden');
  assert.equal(candidate.votes.laserfox.decision, 'hidden');
  assert.equal(candidate.votes.laserfox.exitPreference, null);
  assert.equal(candidate.votes.laserfox.selection, 'hidden');
});

test('migration converts legacy release-family votes and preserves timestamps', () => {
  const discofishAt = new Date('2026-01-02T03:04:05.000Z');
  const laserfoxAt = new Date('2026-01-03T03:04:05.000Z');
  const migration = buildReleaseMigration({
    votes: {
      discofish: { decision: 'toss', decidedAt: discofishAt },
      laserfox: { decision: 'donate', decidedAt: laserfoxAt },
    },
    resolution: 'ready_to_donate',
    deckState: 'resolved',
    resolvedAt: laserfoxAt,
  });

  assert.deepEqual(migration.candidateUpdate.votes, {
    discofish: {
      decision: 'release',
      exitPreference: 'discard',
      decidedAt: discofishAt,
    },
    laserfox: {
      decision: 'release',
      exitPreference: 'donate',
      decidedAt: laserfoxAt,
    },
  });
  assert.equal(migration.candidateUpdate.resolution, 'release_approved');
  assert.equal(migration.candidateUpdate.stagingRoute, 'donate');
  assert.deepEqual(migration.itemUpdate, {
    declutterReadiness: 'ready_to_declutter',
  });
  assert.equal(
    Object.prototype.hasOwnProperty.call(migration.itemUpdate, 'item_status'),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(migration.itemUpdate, 'disposition'),
    false
  );
});

test('release migration is idempotent', () => {
  const resolvedAt = new Date('2026-02-01T00:00:00.000Z');
  const first = buildReleaseMigration({
    votes: {
      discofish: { decision: 'donate', decidedAt: resolvedAt },
      laserfox: { decision: 'sell', decidedAt: resolvedAt },
    },
    resolution: 'ready_to_sell',
    deckState: 'resolved',
    resolvedAt,
  });
  const second = buildReleaseMigration({
    ...first.candidateUpdate,
    itemId: 'fixture-item',
  });

  assert.deepEqual(second.candidateUpdate, first.candidateUpdate);
  assert.deepEqual(second.itemUpdate, first.itemUpdate);
});
