const test = require('node:test');
const assert = require('node:assert/strict');
const { validateMissingRequest, buildMissingUpdate } = require('../backend/utils/itemMissing');
const item = () => ({ quantity: 4, item_status: 'active', missing: { quantity: 2, revision: 3, reportedBy: 'discofish', reportedAt: new Date('2026-10-13T00:00:00Z'), note: 'Look near the sofa' } });
const body = extra => ({ profile: 'laserfox', expectedQuantity: 4, expectedRevision: 3, quantity: 2, action: 'report', ...extra });

test('reports replace total instead of incrementing, preserving inventory quantity', () => {
  const original = item(); const before = structuredClone(original);
  const count = validateMissingRequest(original, body({ quantity: 3 }));
  const update = buildMissingUpdate(original, { quantity: count, action: 'report', profile: 'laserfox', note: 'Still looking', placement: { boxId: '043' } });
  assert.equal(update.$set.missing.quantity, 3);
  assert.equal(update.$set.missing.revision, 4);
  assert.equal(update.$set.missing.reportedBy, 'discofish');
  assert.deepEqual(original, before);
  assert.equal(update.$set.quantity, undefined);
});
test('partial recovery remains missing; complete recovery clears current report but retains history', () => {
  const original = item();
  assert.equal(validateMissingRequest(original, body({ recoveredQuantity: 1 }), true), 1);
  const partial = buildMissingUpdate(original, { quantity: 1, action: 'found', profile: 'laserfox' });
  assert.equal(partial.$set.missing.quantity, 1);
  assert.equal(partial.$set.missing.note, original.missing.note);
  const complete = buildMissingUpdate({ ...original, missing: partial.$set.missing }, { quantity: 0, action: 'found', profile: 'discofish' });
  assert.equal(complete.$set.missing.reportedAt, null);
  assert.equal(complete.$push.missingHistory.action, 'found');
  assert.equal(complete.$push.missingHistory.before, 1);
});
test('stale revision or quantity and departed records are conflicts', () => {
  for (const request of [body({ expectedRevision: 2 }), body({ expectedQuantity: 5 })]) {
    assert.throws(() => validateMissingRequest(item(), request), error => error.status === 409);
  }
  assert.throws(() => validateMissingRequest({ ...item(), item_status: 'gone' }, body()), error => error.status === 409);
});
test('integer bounds, selected profile, note bounds and explicit correction are enforced', () => {
  for (const count of [-1, 0, 1.5, 5, '2', null]) assert.throws(() => validateMissingRequest(item(), body({ quantity: count })));
  for (const count of [0, 3, 1.5]) assert.throws(() => validateMissingRequest(item(), body({ recoveredQuantity: count }), true));
  assert.throws(() => validateMissingRequest(item(), body({ profile: '' })));
  assert.throws(() => validateMissingRequest(item(), body({ note: 'x'.repeat(2001) })));
  assert.throws(() => validateMissingRequest({ ...item(), quantity: 0 }, body()));
  assert.throws(() => validateMissingRequest(item(), body({ quantity: 1 })));
  assert.equal(validateMissingRequest(item(), body({ action: 'correction', quantity: 0 })), 0);
});
test('legacy active items start a new report at revision one', () => {
  const original = { quantity: 1 };
  assert.equal(validateMissingRequest(original, { profile: 'discofish', expectedQuantity: 1, expectedRevision: 0, quantity: 1, action: 'report' }), 1);
  const update = buildMissingUpdate(original, { quantity: 1, action: 'report', profile: 'discofish' });
  assert.equal(update.$set.missing.revision, 1);
  assert.equal(update.$push.missingHistory.before, 0);
});
