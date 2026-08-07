const {
  getDeclutterDeck,
  getDeclutterHistory,
  nominateDeclutterCandidate,
  removeDeclutterCandidateByItem,
  voteOnDeclutterCandidate,
  resetOwnDeclutterVote,
  resetAllOwnDeclutterVotes,
  reopenDeclutterCandidate,
} = require('../services/declutterDeckService');
const {
  completeAction,
  getActionResources,
  reopenActionRound,
  rerouteAction,
  restoreActionAsKeep,
} = require('../services/declutterActionService');
const {
  getRequestId,
  roundDuration,
  serializeError,
  writeBackendLog,
} = require('../utils/backendLogger');

function safeRequestFields(req) {
  return {
    candidateId: String(req?.params?.candidateId || '') || undefined,
    itemId: String(req?.body?.itemId || req?.params?.itemId || '') || undefined,
    player: String(req?.body?.player || req?.query?.player || '') || undefined,
    vote: String(req?.body?.vote || '') || undefined,
  };
}

function logSuccess(req, operation, startedAt, fields = {}) {
  writeBackendLog('info', `declutter.${operation}.succeeded`, {
    requestId: getRequestId(req),
    operation,
    durationMs: roundDuration(startedAt),
    ...safeRequestFields(req),
    ...fields,
  });
}

function sendError(req, res, error, fallback, operation, startedAt) {
  const status = Number(error?.status || 500);
  writeBackendLog(status >= 500 ? 'error' : 'warn', `declutter.${operation}.failed`, {
    requestId: getRequestId(req),
    operation,
    status,
    durationMs: roundDuration(startedAt),
    ...safeRequestFields(req),
    error: serializeError(error),
  });
  return res.status(status).json({
    ok: false,
    error: error?.message || fallback,
    requestId: getRequestId(req),
  });
}

async function getDeclutterDeckApi(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const deck = await getDeclutterDeck(req.query);
    logSuccess(req, 'deck.load', startedAt, {
      activeCount: Number(deck?.counts?.active || 0),
      discussionCount: Number(deck?.counts?.discussion || 0),
      resolvedCount: Number(deck?.counts?.resolved || 0),
    });
    return res.status(200).json({ ok: true, ...deck });
  } catch (error) {
    return sendError(req, res, error, 'Failed to load the declutter deck.', 'deck.load', startedAt);
  }
}

async function getDeclutterHistoryApi(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const history = await getDeclutterHistory(req.query);
    logSuccess(req, 'history.load', startedAt, {
      filter: history.filter,
      route: history.route || undefined,
      count: history.total,
      page: history.page,
      pageSize: history.limit,
      totalPages: history.totalPages,
    });
    return res.status(200).json({ ok: true, ...history });
  } catch (error) {
    return sendError(req, res, error, 'Failed to load declutter history.', 'history.load', startedAt);
  }
}

async function postDeclutterCandidateApi(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const result = await nominateDeclutterCandidate(req.body || {});
    logSuccess(req, 'candidate.nominate', startedAt, {
      candidateId: result?.candidate?.id,
      itemId: result?.candidate?.itemId,
      created: Boolean(result?.created),
      reopened: Boolean(result?.reopened),
      deckState: result?.candidate?.deckState,
      resolution: result?.candidate?.resolution,
    });
    return res.status(result.created ? 201 : 200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(
      req,
      res,
      error,
      'Failed to nominate the declutter candidate.',
      'candidate.nominate',
      startedAt
    );
  }
}

async function deleteDeclutterCandidateByItemApi(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const result = await removeDeclutterCandidateByItem(req.params.itemId);
    logSuccess(req, 'candidate.remove', startedAt, result);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(
      req,
      res,
      error,
      'Failed to remove the declutter candidate.',
      'candidate.remove',
      startedAt
    );
  }
}

async function postDeclutterCandidateVoteApi(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const candidate = await voteOnDeclutterCandidate(req.params.candidateId, req.body || {});
    const player = String(req?.body?.player || '').trim().toLowerCase();
    const savedVote = candidate?.votes?.[player] || {};
    logSuccess(req, 'candidate.vote', startedAt, {
      candidateId: candidate?.id,
      itemId: candidate?.itemId,
      normalizedDecision: savedVote?.decision,
      exitPreference: savedVote?.exitPreference,
      deckState: candidate?.deckState,
      resolution: candidate?.resolution,
      stagingRoute: candidate?.stagingRoute,
    });
    return res.status(200).json({ ok: true, candidate });
  } catch (error) {
    return sendError(
      req,
      res,
      error,
      'Failed to save the declutter vote.',
      'candidate.vote',
      startedAt
    );
  }
}

async function postDeclutterCandidateReopenApi(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const candidate = await reopenDeclutterCandidate(req.params.candidateId);
    logSuccess(req, 'candidate.reopen', startedAt, {
      candidateId: candidate?.id,
      itemId: candidate?.itemId,
      deckState: candidate?.deckState,
      resolution: candidate?.resolution,
    });
    return res.status(200).json({ ok: true, candidate });
  } catch (error) {
    return sendError(
      req,
      res,
      error,
      'Failed to reopen the declutter candidate.',
      'candidate.reopen',
      startedAt
    );
  }
}

function actionHandler(operation, action, fallback) {
  return async (req, res) => {
    const startedAt = process.hrtime.bigint();
    try {
      const candidate = await action(req.params.candidateId, req.body || {});
      logSuccess(req, operation, startedAt, {
        candidateId: String(candidate?._id || candidate?.id || ''),
        itemId: String(candidate?.itemId || ''),
        deckState: candidate?.deckState,
        resolution: candidate?.resolution,
        stagingRoute: candidate?.stagingRoute,
      });
      return res.status(200).json({ ok: true, candidate });
    } catch (error) {
      return sendError(req, res, error, fallback, operation, startedAt);
    }
  };
}

const postDeclutterCandidateResetVoteApi = actionHandler(
  'candidate.vote_reset',
  resetOwnDeclutterVote,
  'Failed to reset your vote.'
);

async function postDeclutterResetAllVotesApi(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const result = await resetAllOwnDeclutterVotes(req.body || {});
    logSuccess(req, 'candidate.vote_reset_all', startedAt, result);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(
      req,
      res,
      error,
      'Failed to reset your decisions.',
      'candidate.vote_reset_all',
      startedAt
    );
  }
}
const postDeclutterActionRerouteApi = actionHandler(
  'action.reroute',
  rerouteAction,
  'Failed to reroute the action.'
);
const postDeclutterActionRestoreKeepApi = actionHandler(
  'action.restore_keep',
  restoreActionAsKeep,
  'Failed to restore the item as Keep.'
);
const postDeclutterActionReopenApi = actionHandler(
  'action.reopen_vote',
  reopenActionRound,
  'Failed to open a fresh voting round.'
);
const postDeclutterActionCompleteApi = actionHandler(
  'action.complete',
  completeAction,
  'Failed to complete the physical disposition.'
);

async function getDeclutterActionResourcesApi(req, res) {
  const startedAt = process.hrtime.bigint();
  try {
    const resources = await getActionResources();
    logSuccess(req, 'action.resources_load', startedAt, {
      stagingBoxCount: resources.stagingBoxes.length,
    });
    return res.status(200).json({ ok: true, ...resources });
  } catch (error) {
    return sendError(req, res, error, 'Failed to load action resources.', 'action.resources_load', startedAt);
  }
}

module.exports = {
  getDeclutterDeckApi,
  getDeclutterHistoryApi,
  postDeclutterCandidateApi,
  deleteDeclutterCandidateByItemApi,
  postDeclutterCandidateVoteApi,
  postDeclutterCandidateReopenApi,
  postDeclutterCandidateResetVoteApi,
  postDeclutterResetAllVotesApi,
  getDeclutterActionResourcesApi,
  postDeclutterActionRerouteApi,
  postDeclutterActionRestoreKeepApi,
  postDeclutterActionReopenApi,
  postDeclutterActionCompleteApi,
};
