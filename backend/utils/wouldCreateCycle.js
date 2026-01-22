// backend/utils/wouldCreateCycle.js
const mongoose = require('mongoose');
const Box = require('../models/Box');

/**
 * Returns true if setting source.parentBox = dest would create a cycle.
 *
 * Rule:
 * - Reject if source === dest
 * - Reject if dest is a descendant of source
 *
 * We detect "dest is descendant of source" by walking *up* from dest via parentBox.
 * If we ever hit source, we'd create a cycle.
 */
async function wouldCreateCycle(sourceId, destId) {
  if (!destId) return false; // moving to top-level (parentBox = null) is always safe

  const s = String(sourceId);
  const d = String(destId);

  if (!mongoose.isValidObjectId(s) || !mongoose.isValidObjectId(d)) {
    const err = new Error('Invalid sourceId or destId');
    err.status = 400;
    err.code = 'INVALID_OBJECT_ID';
    throw err;
  }

  if (s === d) return true;

  // Walk up from dest -> root; if we see source anywhere, dest is inside source subtree.
  const seen = new Set(); // extra safety if DB already contains a cycle somehow
  let curId = d;

  while (curId) {
    if (curId === s) return true;
    if (seen.has(curId)) {
      // DB is already cyclic; treat as unsafe
      return true;
    }
    seen.add(curId);

    const cur = await Box.findById(curId, { parentBox: 1 }).lean();
    if (!cur) break; // destination missing => let caller throw "not found" if desired

    curId = cur.parentBox ? String(cur.parentBox) : null;
  }

  return false;
}

module.exports = { wouldCreateCycle };
