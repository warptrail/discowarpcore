const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const missingCount = item => Number(item?.missing?.quantity || 0);
const missingRevision = item => Number(item?.missing?.revision || 0);
function validateMissingRequest(item, body, found = false) {
  if (!['discofish', 'laserfox'].includes(body.profile)) fail('Choose Discofish or Laserfox before saving.');
  if (item.item_status === 'gone') fail('Restore this departed item before reporting it missing.', 409);
  if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) fail('Correct the inventory quantity to a positive whole number first.');
  if (body.expectedQuantity !== item.quantity || body.expectedRevision !== missingRevision(item)) fail('This item changed on another device. Review the refreshed record and try again.', 409);
  const count = found ? body.recoveredQuantity : body.quantity;
  if (!Number.isSafeInteger(count) || count < (found ? 1 : 0) || count > (found ? missingCount(item) : item.quantity)) fail(found ? 'Recovery must be between one and the missing quantity.' : 'Missing quantity must be between zero and the inventory quantity.');
  if (!found && !['report', 'correction'].includes(body.action)) fail('Choose report or correction.');
  if (!found && body.action === 'report' && count < missingCount(item)) fail('Use Found or Correct report to reduce the missing count.');
  if (!found && body.action === 'report' && count === 0) fail('Report at least one missing object.');
  if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 2000)) fail('Notes must be text of at most 2,000 characters.');
  return count;
}
function buildMissingUpdate(item, { quantity, action, profile, note = '', placement, fromPlacement, at = new Date() }) {
  const before = missingCount(item);
  const revision = missingRevision(item) + 1;
  return {
    $set: { missing: { quantity, revision,
      reportedAt: quantity ? (before ? item.missing.reportedAt : at) : null,
      reportedBy: quantity ? (before ? item.missing.reportedBy : profile) : '',
      note: quantity ? (action === 'found' ? item.missing.note || '' : note.trim()) : '',
    } },
    $push: { missingHistory: { action, profile, at, before, after: quantity, revision, note: note.trim(), placement, fromPlacement } },
  };
}
module.exports = { fail, missingCount, missingRevision, validateMissingRequest, buildMissingUpdate };
