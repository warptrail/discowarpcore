const test = require('node:test');
const assert = require('node:assert/strict');
const { applyKeepPriorityLifecycle, KEEP_PRIORITY_VALUES } = require('../backend/utils/keepPriority');

test('only confirmed departures lock keep priority; orphaned and missing active inventory remain editable', () => {
  assert.ok(KEEP_PRIORITY_VALUES.includes('decommissioned'));
  assert.deepEqual(applyKeepPriorityLifecycle({ notes: 'Archive' }, { item_status: 'gone', disposition: 'lost', keepPriority: 'high' }),
    { notes: 'Archive', keepPriority: 'decommissioned' });
  assert.throws(() => applyKeepPriorityLifecycle({ keepPriority: 'low' }, { item_status: 'gone' }), /locked/);
  assert.throws(() => applyKeepPriorityLifecycle({ keepPriority: 'decommissioned' }, { item_status: 'active' }), /departure workflow/);
  assert.deepEqual(applyKeepPriorityLifecycle({ keepPriority: 'essential' }, { item_status: 'active', missing: { quantity: 1 }, orphanedAt: new Date() }), { keepPriority: 'essential' });
  assert.deepEqual(applyKeepPriorityLifecycle({ item_status: 'active' }, { item_status: 'gone' }), { item_status: 'active', keepPriority: null });
  assert.deepEqual(applyKeepPriorityLifecycle({ item_status: 'gone', disposition: 'donated' }), { item_status: 'gone', disposition: 'donated', keepPriority: 'decommissioned' });
});

test('gone documents persist decommissioned and serialize old departed priorities as locked', async () => {
  const Item = require('../backend/models/Item');
  const item = new Item({ name: 'Retired item', item_status: 'gone', disposition: 'lost', keepPriority: 'high' });
  await item.validate();
  assert.equal(item.keepPriority, 'decommissioned');
  item.keepPriority = 'low';
  assert.equal(item.toJSON().keepPriority, 'decommissioned');
});
