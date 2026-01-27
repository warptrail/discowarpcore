// backend/scripts/seed.js
// Dev-only seed runner.
//
// Responsibilities:
// - Load env
// - Connect to MongoDB
// - Wipe dev data (reserved range by default, or full wipe with --all)
// - Load seed data (boxes, items, placements)
// - Call the seed engine
// - Disconnect
//
// This file is the ONLY place that is allowed to be destructive.

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const path = require('path');

const Box = require('../models/Box');
const Item = require('../models/Item');
const {
  createBoxesFromTrees,
  createItemsFromSeed,
  attachItemsToBoxes,
} = require('../utils/seedEngine');

// -----------------------------
// Safety guards
// -----------------------------

if (process.env.NODE_ENV === 'production') {
  throw new Error('❌ Seeding is disabled in production');
}

const ALLOW = process.env.ALLOW_DEV_SEED === 'true';
if (!ALLOW) {
  throw new Error('❌ Set ALLOW_DEV_SEED=true to run seed script');
}

// -----------------------------
// Config
// -----------------------------

// Reserved dev-only box_id range
const RANGE_START = 500;
const RANGE_END = 599;
const RESERVED_IDS = Array.from(
  { length: RANGE_END - RANGE_START + 1 },
  (_, i) => String(RANGE_START + i),
);

function makeReservedIdGenerator() {
  let idx = 0;
  return () => (idx < RESERVED_IDS.length ? RESERVED_IDS[idx++] : null);
}

function makeSequentialIdGenerator(start = 101) {
  let n = start;
  return () => String(n++);
}

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// -----------------------------
// Wipe helpers
// -----------------------------

async function wipeReservedRange() {
  const boxes = await Box.find({ box_id: { $in: RESERVED_IDS } });

  const itemIdSet = new Set();
  boxes.forEach((b) => {
    if (Array.isArray(b.items)) {
      b.items.forEach((id) => itemIdSet.add(String(id)));
    }
  });

  const itemIds = Array.from(itemIdSet);

  if (itemIds.length) {
    await Item.deleteMany({ _id: { $in: itemIds } });
  }
  await Box.deleteMany({ box_id: { $in: RESERVED_IDS } });

  return { deletedBoxes: boxes.length, deletedItems: itemIds.length };
}

async function wipeAll() {
  const itemRes = await Item.deleteMany({});
  const boxRes = await Box.deleteMany({});

  return {
    deletedBoxes: boxRes.deletedCount ?? 0,
    deletedItems: itemRes.deletedCount ?? 0,
  };
}

// -----------------------------
// Load seed data
// -----------------------------

function loadSeed(relPath) {
  // Resolve relative to this script
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(path.resolve(__dirname, relPath));
}

// -----------------------------
// Main
// -----------------------------

async function main() {
  const MONGO_URI = mustEnv('MONGO_URI');
  const wipeAllFlag = process.argv.includes('--all');

  const boxesSeed = loadSeed('../seed/garageBoxes.mock');
  const itemsSeed = loadSeed('../seed/garageItems.mock');
  const placementsSeed = loadSeed('../seed/garagePlacements.mock');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const wipeStats = wipeAllFlag ? await wipeAll() : await wipeReservedRange();
  console.log(`🧼 Wipe (${wipeAllFlag ? 'ALL' : 'RESERVED'}):`, wipeStats);

  const getNextBoxId = wipeAllFlag
    ? makeSequentialIdGenerator(101)
    : makeReservedIdGenerator();

  // 1) Create boxes (empty)
  const { boxByKey, rootBoxes } = await createBoxesFromTrees(
    boxesSeed,
    getNextBoxId,
  );
  console.log(
    `📦 Boxes created: ${boxByKey.size} (roots: ${rootBoxes.length})`,
  );

  // 2) Create items (orphaned)
  const { itemByKey } = await createItemsFromSeed(itemsSeed);
  console.log(`🧾 Items created: ${itemByKey.size}`);

  // 3) Attach items to boxes
  const attachStats = await attachItemsToBoxes(
    placementsSeed,
    boxByKey,
    itemByKey,
    {
      mode: 'set',
    },
  );
  console.log('🔗 Items attached:', attachStats);

  await mongoose.disconnect();
  console.log('👋 Seed complete');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exitCode = 1;
});
