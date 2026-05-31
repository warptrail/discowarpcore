const {
  addItemsToDeclutterSession,
  createDeclutterSession,
  deleteDeclutterSession,
  getDeclutterSessionDetail,
  listDeclutterSessions,
  listDeclutterSessionsForItem,
  removeItemFromDeclutterSession,
  resetDeclutterSession,
  updateDeclutterSession,
  updateDeclutterSessionItem,
} = require('../services/declutterSessionService');

function sendError(res, err, fallbackMessage) {
  const status = Number(err?.status || 500);
  return res.status(status).json({
    ok: false,
    code: err?.code || 'DECLUTTER_SESSION_ERROR',
    error: err?.message || fallbackMessage,
  });
}

async function getDeclutterSessionsApi(req, res) {
  try {
    const sessions = await listDeclutterSessions({ status: req.query.status });
    return res.status(200).json({ ok: true, sessions });
  } catch (err) {
    console.error('❌ Error listing declutter sessions:', err);
    return sendError(res, err, 'Failed to list declutter sessions.');
  }
}

async function getDeclutterSessionsForItemApi(req, res) {
  try {
    const sessions = await listDeclutterSessionsForItem(req.params.itemId, {
      status: req.query.status || 'active',
    });
    return res.status(200).json({ ok: true, sessions });
  } catch (err) {
    console.error('❌ Error listing declutter sessions for item:', err);
    return sendError(res, err, 'Failed to list declutter sessions for item.');
  }
}

async function postDeclutterSessionApi(req, res) {
  try {
    const session = await createDeclutterSession(req.body || {});
    return res.status(201).json({ ok: true, session });
  } catch (err) {
    console.error('❌ Error creating declutter session:', err);
    return sendError(res, err, 'Failed to create declutter session.');
  }
}

async function getDeclutterSessionByIdApi(req, res) {
  try {
    const payload = await getDeclutterSessionDetail(req.params.sessionId);
    return res.status(200).json({ ok: true, ...payload });
  } catch (err) {
    console.error('❌ Error loading declutter session:', err);
    return sendError(res, err, 'Failed to load declutter session.');
  }
}

async function patchDeclutterSessionApi(req, res) {
  try {
    const session = await updateDeclutterSession(
      req.params.sessionId,
      req.body || {}
    );
    return res.status(200).json({ ok: true, session });
  } catch (err) {
    console.error('❌ Error updating declutter session:', err);
    return sendError(res, err, 'Failed to update declutter session.');
  }
}

async function deleteDeclutterSessionApi(req, res) {
  try {
    const result = await deleteDeclutterSession(req.params.sessionId);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('❌ Error deleting declutter session:', err);
    return sendError(res, err, 'Failed to delete declutter session.');
  }
}

async function postDeclutterSessionResetApi(req, res) {
  try {
    const result = await resetDeclutterSession(req.params.sessionId);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('❌ Error resetting declutter session:', err);
    return sendError(res, err, 'Failed to reset declutter session.');
  }
}

async function postDeclutterSessionItemsApi(req, res) {
  try {
    const result = await addItemsToDeclutterSession(
      req.params.sessionId,
      req.body || {}
    );
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('❌ Error adding declutter session items:', err);
    return sendError(res, err, 'Failed to add items to declutter session.');
  }
}

async function patchDeclutterSessionItemApi(req, res) {
  try {
    const sessionItem = await updateDeclutterSessionItem(
      req.params.sessionId,
      req.params.itemId,
      req.body || {}
    );
    return res.status(200).json({ ok: true, sessionItem });
  } catch (err) {
    console.error('❌ Error updating declutter session item:', err);
    return sendError(res, err, 'Failed to update declutter session item.');
  }
}

async function deleteDeclutterSessionItemApi(req, res) {
  try {
    const result = await removeItemFromDeclutterSession(
      req.params.sessionId,
      req.params.itemId
    );
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('❌ Error removing declutter session item:', err);
    return sendError(res, err, 'Failed to remove declutter session item.');
  }
}

module.exports = {
  getDeclutterSessionsApi,
  getDeclutterSessionsForItemApi,
  postDeclutterSessionApi,
  getDeclutterSessionByIdApi,
  patchDeclutterSessionApi,
  deleteDeclutterSessionApi,
  postDeclutterSessionResetApi,
  postDeclutterSessionItemsApi,
  patchDeclutterSessionItemApi,
  deleteDeclutterSessionItemApi,
};
