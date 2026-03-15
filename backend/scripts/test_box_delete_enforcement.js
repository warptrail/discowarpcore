const mongoose = require('mongoose');

const Box = require('../models/Box');
const Item = require('../models/Item');
const { deleteBoxById } = require('../services/boxService');

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const uri =
    process.env.MONGO_URI_TEST_DELETE_ENFORCEMENT ||
    'mongodb://127.0.0.1:27017/discowarpcore_delete_enforcement_test';

  await mongoose.connect(uri);
  console.log(`✅ Connected to MongoDB: ${uri}`);

  // Tree:
  // A (floor)
  // └─ B (delete target) [direct items: i1, i2]
  //    └─ C
  //       └─ D [item: i3]
  const i1 = await Item.create({ name: 'direct-item-1', orphanedAt: null });
  const i2 = await Item.create({ name: 'direct-item-2', orphanedAt: null });
  const i3 = await Item.create({ name: 'descendant-item-1', orphanedAt: null });

  const A = await Box.create({
    box_id: '910',
    label: 'A',
    parentBox: null,
    items: [],
  });
  const B = await Box.create({
    box_id: '911',
    label: 'B',
    parentBox: A._id,
    items: [i1._id, i2._id],
  });
  const C = await Box.create({
    box_id: '912',
    label: 'C',
    parentBox: B._id,
    items: [],
  });
  const D = await Box.create({
    box_id: '913',
    label: 'D',
    parentBox: C._id,
    items: [i3._id],
  });

  const result = await deleteBoxById(B._id);
  console.log('ℹ️ deleteBoxById result:', result);

  const [aAfter, bAfter, cAfter, dAfter] = await Promise.all([
    Box.findById(A._id).lean(),
    Box.findById(B._id).lean(),
    Box.findById(C._id).lean(),
    Box.findById(D._id).lean(),
  ]);

  const [i1After, i2After, i3After] = await Promise.all([
    Item.findById(i1._id).lean(),
    Item.findById(i2._id).lean(),
    Item.findById(i3._id).lean(),
  ]);

  invariant(!!aAfter, 'A should still exist');
  invariant(!bAfter, 'B should be deleted');

  invariant(!!cAfter, 'C should still exist');
  invariant(!!dAfter, 'D should still exist');
  invariant(cAfter.parentBox == null, 'C should be released to floor level');
  invariant(dAfter.parentBox == null, 'D should be released to floor level');

  invariant(!!i1After, 'i1 should still exist');
  invariant(!!i2After, 'i2 should still exist');
  invariant(!!i1After.orphanedAt, 'i1 should be orphaned');
  invariant(!!i2After.orphanedAt, 'i2 should be orphaned');
  invariant((i1After.location || '') === '', 'i1 location should be cleared');
  invariant((i2After.location || '') === '', 'i2 location should be cleared');

  invariant(!!i3After, 'i3 should still exist');
  invariant(i3After.orphanedAt == null, 'i3 should not be orphaned');

  const dHasI3 = (dAfter.items || []).some(
    (id) => String(id) === String(i3._id),
  );
  invariant(dHasI3, 'D should still contain i3');

  console.log('✅ Box deletion backend enforcement test passed');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Box deletion backend enforcement test failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
