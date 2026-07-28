const {
  deriveCandidateState,
  normalizeVotes,
} = require('../services/declutterDeckService');

function buildReleaseMigration(candidate = {}) {
  const votes = normalizeVotes(candidate);
  const state = deriveCandidateState(votes);
  const resolvedAt =
    state.deckState === 'resolved'
      ? candidate.resolvedAt || candidate.updatedAt || candidate.createdAt || null
      : null;

  return {
    candidateUpdate: {
      votes,
      deckState: state.deckState,
      resolution: state.resolution,
      stagingRoute: state.stagingRoute,
      resolvedAt,
    },
    itemUpdate: {
      declutterReadiness: state.readiness,
    },
  };
}

module.exports = {
  buildReleaseMigration,
};
