const test = require('node:test');
const assert = require('node:assert/strict');

const {
  deriveCandidateState,
  emptyVotes,
  getVisibleVoteChoice,
  normalizeVote,
  toClientCandidate,
} = require('../backend/services/declutterDeckService');
const {
  buildReleaseMigration,
} = require('../backend/utils/declutterReleaseMigration');

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
const EXPIRES = new Date('2026-07-28T12:00:00.000Z');

function stateFor(discofish, laserfox) {
  const votes = emptyVotes();
  votes.discofish = voteFor(discofish);
  votes.laserfox = voteFor(laserfox);
  return deriveCandidateState(votes, { now: NOW });
}

const votingFields = {
  confirmationState: 'voting',
  consensusReachedAt: null,
  confirmationExpiresAt: null,
};

const coolingFields = {
  confirmationState: 'cooling_off',
  consensusReachedAt: NOW,
  confirmationExpiresAt: EXPIRES,
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
  assert.deepEqual(normalizeVote('unsure'), {
    choice: 'unsure',
    decision: 'unsure',
    exitPreference: null,
  });
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

test('matching Keep votes enter the cooling-off lane', () => {
  assert.deepEqual(stateFor('keep', 'keep'), {
    deckState: 'cooling_off',
    resolution: 'kept',
    readiness: 'in_deck',
    stagingRoute: null,
    ...coolingFields,
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
  ['donate', 'sell', 'needs_routing'],
  ['sell', 'donate', 'needs_routing'],
];

for (const [first, second, stagingRoute] of releasePairings) {
  test(`${first} + ${second} approves release through ${stagingRoute}`, () => {
    assert.deepEqual(stateFor(first, second), {
      deckState: 'cooling_off',
      resolution: 'release_approved',
      readiness: 'in_deck',
      stagingRoute,
      ...coolingFields,
    });
  });
}

for (const releaseChoice of ['toss', 'donate', 'sell']) {
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

for (const otherChoice of ['keep', 'toss', 'donate', 'sell', 'unsure']) {
  test(`Unsure + ${otherChoice} defers the candidate`, () => {
    assert.deepEqual(stateFor('unsure', otherChoice), {
      deckState: 'discussion',
      resolution: 'review_later',
      readiness: 'in_deck',
      stagingRoute: null,
      ...votingFields,
    });
  });
}

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
    declutterReadiness: 'in_deck',
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
