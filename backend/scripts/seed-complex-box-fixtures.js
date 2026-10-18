// Additive dev fixtures. Dry run by default; never invokes the destructive seed runner.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { getLeafCompartments, validateCompartments } = require('../utils/boxCompartments');

const FIXTURE_TAG = 'mock-complex-box-v1';
const shelves = (key, labels) => labels.map((label, index) => ({ key: `${key}${index + 1}`, label }));
const FIXTURES = [
  { key: 'snap-on', label: '[MOCK] Big red Snap-on tool chest', compartments: Array.from({ length: 6 }, (_, index) => ({ key: String.fromCharCode(65 + index), label: `Drawer ${index + 1}` })), names: ['Socket set', 'Combination wrench', 'Screwdriver', 'Pliers', 'Torque wrench', 'Hex key set'] },
  { key: 'bookshelf', label: '[MOCK] Bookshelf', compartments: [
    { key: 'A', label: 'Open top shelf' }, { key: 'B', label: 'Open middle shelf' }, { key: 'C', label: 'Open bottom shelf' },
    { key: 'D', label: 'Lower cabinet', children: shelves('D', ['Upper shelf', 'Lower shelf']) },
  ], names: ['Novel', 'Reference book', 'Art book', 'Photo album', 'Notebook'] },
  { key: 'kitchen', label: '[MOCK] Upper L-shaped kitchen cupboards', compartments: Array.from('ABCDEFG', (key) => ({ key, label: `Cabinet ${key}`, ...('BCDFG'.includes(key) ? { children: shelves(key, ['Top shelf', 'Middle shelf', 'Bottom shelf']) } : {}) })), names: ['Serving bowl', 'Mug', 'Dinner plate', 'Cereal bowl', 'Tea tin', 'Coffee tin', 'Sugar jar', 'Spice jar', 'Measuring cup', 'Mixing bowl', 'Serving platter', 'Storage container', 'Water glass', 'Wine glass', 'Pitcher', 'Baking dish', 'Small plate'] },
];

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function run({ apply = false } = {}) {
  const env = require('dotenv').parse(fs.readFileSync(require('node:path').join(__dirname, '../.env')));
  const uri = env.MONGO_URI;
  assert.equal(env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production', false, 'Fixtures are disabled in production.');
  assert.match(uri || '', /^mongodb:\/\/(?:127\.0\.0\.1|localhost):27017\/discowarpcore_dev(?:\?|$)/, 'Fixtures require the pinned local discowarpcore_dev target.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    assert.equal(mongoose.connection.name, 'discowarpcore_dev');
    const Box = require('../models/Box');
    const Item = require('../models/Item');
    const { createBox } = require('../services/boxService');
    const { createItemInBox } = require('../services/boxItemService');
    const originalBoxes = await Box.collection.find({}).toArray();
    const originalItems = await Item.collection.find({}).toArray();
    const available = Array.from({ length: 100 }, (_, i) => String(500 + i)).filter((id) => !originalBoxes.some((box) => box.box_id === id));
    const result = [];
    for (const fixture of FIXTURES) {
      const marker = `${FIXTURE_TAG}-${fixture.key}`;
      const existing = originalBoxes.filter((box) => box.tags?.includes(marker));
      assert.ok(existing.length <= 1, `Duplicate fixture marker: ${marker}`);
      if (existing.length) {
        result.push({ box_id: existing[0].box_id, label: existing[0].label, state: 'existing-preserved' });
        continue;
      }
      const boxId = available.shift();
      assert.ok(boxId, 'Not enough unused IDs in 500–599.');
      const compartments = validateCompartments(fixture.compartments);
      const leaves = getLeafCompartments({ isComplexBox: true, compartments });
      assert.equal(leaves.length, fixture.names.length);
      result.push({ box_id: boxId, label: fixture.label, state: apply ? 'created' : 'planned', items: leaves.length });
      if (!apply) continue;
      const box = await createBox({ box_id: boxId, label: fixture.label, description: 'Mock development fixture. Not a record of real household inventory.', tags: [FIXTURE_TAG, marker], isComplexBox: true, compartments, locationId: null });
      for (const [index, leaf] of leaves.entries()) {
        await createItemInBox(box._id, { name: `[MOCK] ${fixture.names[index]}`, quantity: 1, tags: [FIXTURE_TAG, marker], notes: 'Mock development fixture.', compartmentKey: leaf.key });
      }
      const stored = await Box.findById(box._id).lean();
      assert.equal(stored.items.length, leaves.length);
      assert.deepEqual(new Set(Object.values(stored.itemCompartments)), new Set(leaves.map((leaf) => leaf.key)));
      assert.equal(await Item.countDocuments({ _id: { $in: stored.items } }), leaves.length);
    }
    for (const [collection, originals] of [[Box.collection, originalBoxes], [Item.collection, originalItems]]) {
      const after = await collection.find({ _id: { $in: originals.map((record) => record._id) } }).toArray();
      const byId = new Map(after.map((record) => [String(record._id), fingerprint(record)]));
      for (const record of originals) assert.equal(byId.get(String(record._id)), fingerprint(record), `Existing record changed: ${record._id}`);
    }
    console.log(JSON.stringify({ database: mongoose.connection.name, apply, fixtures: result, existingInventoryUnchanged: true }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) run({ apply: process.argv.includes('--apply') }).catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { FIXTURES, FIXTURE_TAG, run };
