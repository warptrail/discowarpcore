// backend/scripts/seed_garage_baseline.js
//
// Wipes DB then seeds a simple, garage-themed baseline:
// - Max nesting depth: 3 (root -> child -> grandchild)
// - 5 items in each box
//
// Run:
//   node backend/scripts/seed_garage_baseline.js

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

const Box = require('../models/Box');
const Item = require('../models/Item');

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/**
 * Creates 5 Item docs, returns their _id list.
 * Keep fields conservative to avoid schema mismatch.
 */
async function createItemsForBox(itemNames) {
  const docs = itemNames.map((name) => ({
    name,
    quantity: 1,
    tags: [],
    notes: '',
    location: '',
    orphanedAt: null,
  }));

  const created = await Item.insertMany(docs, { ordered: true });
  return created.map((d) => d._id);
}

async function createBox(
  { box_id, label, location, description, notes, tags, parentBox },
  itemNames,
) {
  const itemIds = await createItemsForBox(itemNames);

  const box = await Box.create({
    box_id, // 3-digit string is ideal for your UI/validators
    label,
    location,
    description,
    notes,
    tags,
    parentBox: parentBox ?? null,
    items: itemIds,
  });

  return box;
}

async function seed() {
  const MONGO_URI = mustEnv('MONGO_URI');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // 1) WIPE
  // Order doesn’t matter much, but wiping boxes first avoids dangling refs in memory during the run.
  await Box.deleteMany({});
  await Item.deleteMany({});
  console.log('🧼 Wiped: Box + Item collections');

  // 2) SEED (max depth 3)
  // Root level (depth 1)
  const rootA = await createBox(
    {
      box_id: '101',
      label: 'Garage: Main Shelf Bin',
      location: 'Garage',
      description: 'Primary shelf bin for common tools and supplies.',
      notes: 'Baseline seed box.',
      tags: ['garage', 'baseline'],
      parentBox: null,
    },
    [
      'Work Gloves',
      'Tape Measure',
      'Utility Knife',
      'Safety Glasses',
      'Pencil & Marker Set',
    ],
  );

  const rootB = await createBox(
    {
      box_id: '102',
      label: 'Garage: Workbench Drawer',
      location: 'Garage',
      description: 'Workbench drawer for hand tools.',
      notes: 'Baseline seed box.',
      tags: ['garage', 'tools', 'baseline'],
      parentBox: null,
    },
    [
      'Phillips Screwdriver',
      'Flathead Screwdriver',
      'Needle-nose Pliers',
      'Adjustable Wrench',
      'Box Cutter Blades',
    ],
  );

  // Children (depth 2)
  const childA1 = await createBox(
    {
      box_id: '111',
      label: 'Hardware Organizer (small parts)',
      location: 'Garage',
      description: 'Small fasteners and hardware.',
      notes: '',
      tags: ['hardware'],
      parentBox: rootA._id,
    },
    ['Wood Screws', 'Drywall Anchors', 'Assorted Washers', 'Nails', 'Zip Ties'],
  );

  const childA2 = await createBox(
    {
      box_id: '112',
      label: 'Painting & Patch Kit',
      location: 'Garage',
      description: 'Stuff you regret owning until you need it.',
      notes: '',
      tags: ['paint', 'repairs'],
      parentBox: rootA._id,
    },
    [
      'Spackle',
      'Putty Knife',
      'Painter’s Tape',
      'Small Roller',
      'Sandpaper Pack',
    ],
  );

  const childB1 = await createBox(
    {
      box_id: '121',
      label: 'Electrical Bits',
      location: 'Garage',
      description: 'Electrical odds and ends.',
      notes: '',
      tags: ['electrical'],
      parentBox: rootB._id,
    },
    [
      'Wire Nuts',
      'Electrical Tape',
      'Heat Shrink Tubing',
      'Outlet Tester',
      'Spare Extension Cord',
    ],
  );

  const childB2 = await createBox(
    {
      box_id: '122',
      label: 'Bike Tune-up Pouch',
      location: 'Garage',
      description: 'Quick bike maintenance kit.',
      notes: '',
      tags: ['bike'],
      parentBox: rootB._id,
    },
    ['Tire Levers', 'Patch Kit', 'Mini Pump', 'Chain Lube', 'Rag (shop towel)'],
  );

  // Grandchildren (depth 3)
  const grandA1 = await createBox(
    {
      box_id: '211',
      label: 'Anchor & Hook Tray',
      location: 'Garage',
      description: 'Wall anchors, hooks, hangers.',
      notes: '',
      tags: ['hardware', 'hang'],
      parentBox: childA1._id,
    },
    [
      'Picture Hooks',
      'Command Strips',
      'Wall Anchors (extra)',
      'Ceiling Hooks',
      'Small Carabiners',
    ],
  );

  const grandB2 = await createBox(
    {
      box_id: '222',
      label: 'Bike Spare Tubes',
      location: 'Garage',
      description: 'Backup tubes & related supplies.',
      notes: '',
      tags: ['bike', 'spares'],
      parentBox: childB2._id,
    },
    ['Tube 700x25', 'Tube 700x28', 'Valve Caps', 'CO2 Cartridge', 'Patch Glue'],
  );

  console.log('✅ Seed complete');
  console.log(
    [
      rootA.box_id,
      rootB.box_id,
      childA1.box_id,
      childA2.box_id,
      childB1.box_id,
      childB2.box_id,
      grandA1.box_id,
      grandB2.box_id,
    ]
      .map((id) => `• ${id}`)
      .join('\n'),
  );

  await mongoose.disconnect();
  console.log('👋 Disconnected');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exitCode = 1;
});
