const { randomUUID } = require('node:crypto');

// A database lease serializes placement and missing-state edits across devices.
async function withItemMutationLock(id, work, existingToken) {
  const Item = require('../models/Item');
  if (existingToken) {
    if (!await Item.exists({ _id: id, 'mutationLease.token': existingToken, 'mutationLease.until': { $gt: new Date() } })) {
      throw Object.assign(new Error('The item update expired. Refresh and try again.'), { status: 409 });
    }
    return work(existingToken);
  }
  const token = randomUUID();
  const now = new Date();
  const claimed = await Item.findOneAndUpdate({ _id: id, $or: [
    { 'mutationLease.token': { $exists: false } },
    { 'mutationLease.until': { $lte: now } },
  ] }, { $set: { mutationLease: { token, until: new Date(now.getTime() + 120000) } } },
  { new: true, timestamps: false }).select('_id').lean();
  if (!claimed) {
    const exists = await Item.exists({ _id: id });
    throw Object.assign(new Error(exists ? 'This item is being updated. Refresh and try again.' : 'Item not found'),
      { status: exists ? 409 : 404 });
  }
  try { return await work(token); }
  finally { await Item.updateOne({ _id: id, 'mutationLease.token': token }, { $unset: { mutationLease: 1 } }, { timestamps: false }); }
}

module.exports = { withItemMutationLock };
