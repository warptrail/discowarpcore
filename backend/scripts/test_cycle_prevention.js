// backend/scripts/test_cycle_prevention.js
const mongoose = require('mongoose');
const Box = require('../models/Box');
const { updateBox } = require('../services/boxService');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/box-db'); // adjust to your app’s DB name/URI
  await Box.deleteMany({});

  // Create chain: A -> B -> C
  const A = await Box.create({
    box_id: '900',
    label: 'A',
    parentBox: null,
    items: [],
  });
  const B = await Box.create({
    box_id: '901',
    label: 'B',
    parentBox: A._id,
    items: [],
  });
  const C = await Box.create({
    box_id: '902',
    label: 'C',
    parentBox: B._id,
    items: [],
  });

  // 1) direct parent (illegal): set A.parentBox = A
  await expectReject('self-parent', () =>
    updateBox(A._id, { parentBox: A._id }),
  );

  // 2) deep descendant (illegal): set A.parentBox = C
  await expectReject('deep descendant', () =>
    updateBox(A._id, { parentBox: C._id }),
  );

  // 3) legal reparent: set C.parentBox = A (was under B)
  await expectResolve('legal reparent', () =>
    updateBox(C._id, { parentBox: A._id }),
  );

  console.log('✅ Cycle prevention tests finished');
  await mongoose.disconnect();
}

async function expectReject(name, fn) {
  try {
    await fn();
    console.error(`❌ Expected rejection (${name}) but it succeeded`);
  } catch (err) {
    console.log(`✅ Rejected (${name}) ->`, err.code, err.status, err.message);
  }
}

async function expectResolve(name, fn) {
  const r = await fn();
  console.log(`✅ Resolved (${name}) -> parentBox:`, String(r.parentBox));
}

run().catch((e) => {
  console.error('❌ Test runner failed:', e);
  process.exit(1);
});
