const mongoose = require('mongoose');

const Box = require('../models/Box');
const Item = require('../models/Item');
const { EventLog } = require('../models/EventLog');
const {
  createBox,
  updateBox,
  setBoxImage,
  clearBoxImage,
  deleteBoxById,
  releaseChildrenToFloor,
} = require('../services/boxService');
const {
  createItem,
  bulkCreateItems,
  updateItem,
  setItemImage,
  clearItemImage,
  hardDeleteItem,
  markItemGone,
  restoreItemToActive,
} = require('../services/itemService');
const {
  createItemInBox,
  addItemToBox,
  addItemsToBox,
  moveItemBetweenBoxes,
  removeItemFromBox,
  emptyBoxItems,
  detachItem,
} = require('../services/boxItemService');
const { getEventLogsPage } = require('../services/eventLogService');

const REQUIRED_EVENT_TYPES = [
  'box_created',
  'box_updated',
  'box_moved',
  'box_nested',
  'box_unnested',
  'box_destroyed',
  'box_photo_updated',
  'item_created',
  'item_updated',
  'item_moved',
  'items_bulk_imported',
  'item_marked_gone',
  'item_reclaimed',
  'item_deleted',
  'item_photo_updated',
];

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildFakeImage(seed) {
  return {
    originalName: `${seed}.jpg`,
    uploadedAt: new Date(),
    original: {
      storagePath: `/tmp/${seed}-original.jpg`,
      url: `/media/${seed}-original.jpg`,
      mimeType: 'image/jpeg',
      width: 1200,
      height: 800,
      sizeBytes: 123456,
    },
    display: {
      storagePath: `/tmp/${seed}-display.jpg`,
      url: `/media/${seed}-display.jpg`,
      mimeType: 'image/jpeg',
      width: 800,
      height: 533,
      sizeBytes: 67890,
    },
    thumb: {
      storagePath: `/tmp/${seed}-thumb.jpg`,
      url: `/media/${seed}-thumb.jpg`,
      mimeType: 'image/jpeg',
      width: 320,
      height: 213,
      sizeBytes: 23456,
    },
  };
}

async function countEventsByType(eventType) {
  return EventLog.countDocuments({ event_type: eventType });
}

async function totalEvents() {
  return EventLog.countDocuments({});
}

async function run() {
  const uri =
    process.env.MONGO_URI_TEST_EVENT_LOGGING ||
    'mongodb://127.0.0.1:27017/discowarpcore_event_logging_test';

  await mongoose.connect(uri);
  console.log(`✅ Connected to MongoDB: ${uri}`);

  await Promise.all([EventLog.deleteMany({}), Box.deleteMany({}), Item.deleteMany({})]);
  console.log('🧹 Cleared test collections');

  const root = await createBox({ box_id: '901', label: 'Root Box' });
  const parentB = await createBox({ box_id: '902', label: 'Parent B' });
  const child = await createBox({ box_id: '903', label: 'Child Box' });

  await updateBox(root._id, { description: 'Utility shelf' });
  const boxUpdatedBeforeNoop = await countEventsByType('box_updated');
  await updateBox(root._id, { description: 'Utility shelf' });
  const boxUpdatedAfterNoop = await countEventsByType('box_updated');
  invariant(
    boxUpdatedAfterNoop === boxUpdatedBeforeNoop,
    'box_updated should not be emitted for no-op updates'
  );

  await updateBox(child._id, { parentBox: root._id });
  await updateBox(child._id, { parentBox: parentB._id });
  await updateBox(child._id, { parentBox: null });

  const releaseParent = await createBox({ box_id: '904', label: 'Release Parent' });
  await createBox({ box_id: '905', label: 'Release Child 1', parentBox: releaseParent._id });
  await createBox({ box_id: '906', label: 'Release Child 2', parentBox: releaseParent._id });

  const unnestBeforeRelease = await countEventsByType('box_unnested');
  const releaseResult = await releaseChildrenToFloor(releaseParent._id);
  const unnestAfterRelease = await countEventsByType('box_unnested');
  invariant(
    releaseResult.modifiedCount === 2,
    'releaseChildrenToFloor should release exactly two children in this scenario'
  );
  invariant(
    unnestAfterRelease - unnestBeforeRelease === 2,
    'releaseChildrenToFloor should emit one box_unnested event per released child'
  );

  await setBoxImage(root._id, buildFakeImage('box-root'));
  await clearBoxImage(root._id);

  const bulkImportBefore = await countEventsByType('items_bulk_imported');
  const bulkImportResult = await bulkCreateItems({
    names: ['Bulk Item 1', '', 'Bulk Item 2'],
    boxId: root.box_id,
    sourceFileName: 'garage_items.txt',
  });
  invariant(
    Number(bulkImportResult.createdCount || 0) === 2,
    'bulkCreateItems should create exactly two valid items in this scenario'
  );
  const bulkImportAfter = await countEventsByType('items_bulk_imported');
  invariant(
    bulkImportAfter === bulkImportBefore + 1,
    'bulkCreateItems should emit one items_bulk_imported event'
  );

  const latestBulkImportEvent = await EventLog.findOne({
    event_type: 'items_bulk_imported',
  })
    .sort({ created_at: -1, _id: -1 })
    .lean();
  invariant(!!latestBulkImportEvent, 'Expected items_bulk_imported log entry');
  invariant(
    latestBulkImportEvent?.details?.count === 2,
    'items_bulk_imported details.count should match created item count'
  );
  invariant(
    latestBulkImportEvent?.details?.destination?.type === 'box',
    'items_bulk_imported destination.type should be "box" for box imports'
  );
  invariant(
    latestBulkImportEvent?.details?.source_file_name === 'garage_items.txt',
    'items_bulk_imported should include source_file_name when provided'
  );

  const standaloneItem = await createItem({ name: 'Flashlight', notes: '' });
  await updateItem(standaloneItem._id, { notes: 'Ready bag' });
  const itemUpdatedBeforeNoop = await countEventsByType('item_updated');
  await updateItem(standaloneItem._id, { notes: 'Ready bag' });
  const itemUpdatedAfterNoop = await countEventsByType('item_updated');
  invariant(
    itemUpdatedAfterNoop === itemUpdatedBeforeNoop,
    'item_updated should not be emitted for no-op updates'
  );

  const itemCreatedBeforeCreateInBox = await countEventsByType('item_created');
  const itemMovedBeforeCreateInBox = await countEventsByType('item_moved');
  const inBoxItem = await createItemInBox(root._id, { name: 'Bike Pump' });
  const itemCreatedAfterCreateInBox = await countEventsByType('item_created');
  const itemMovedAfterCreateInBox = await countEventsByType('item_moved');
  invariant(
    itemCreatedAfterCreateInBox === itemCreatedBeforeCreateInBox + 1,
    'createItemInBox should emit exactly one item_created event'
  );
  invariant(
    itemMovedAfterCreateInBox === itemMovedBeforeCreateInBox,
    'createItemInBox should not emit item_moved'
  );

  await addItemToBox(root._id, standaloneItem._id);
  await moveItemBetweenBoxes(undefined, parentB._id, standaloneItem._id);
  await removeItemFromBox(parentB._id, standaloneItem._id);
  await addItemsToBox(root._id, [standaloneItem._id]);
  await emptyBoxItems(root._id);
  await addItemToBox(parentB._id, standaloneItem._id);
  await detachItem({ itemId: standaloneItem._id });
  await addItemToBox(parentB._id, standaloneItem._id);

  await markItemGone(standaloneItem._id, {
    disposition: 'donated',
    disposition_notes: 'Spring cleanup',
  });
  await restoreItemToActive(standaloneItem._id);
  await setItemImage(standaloneItem._id, buildFakeImage('item-standalone'));
  await clearItemImage(standaloneItem._id);
  await hardDeleteItem(standaloneItem._id);

  const deleteParent = await createBox({ box_id: '907', label: 'Delete Parent' });
  await createBox({ box_id: '908', label: 'Delete Child', parentBox: deleteParent._id });
  await deleteBoxById(deleteParent._id);

  const eventsBeforeFailure = await totalEvents();
  let failedAsExpected = false;
  try {
    await updateBox(releaseParent._id, { parentBox: releaseParent._id });
  } catch {
    failedAsExpected = true;
  }
  invariant(failedAsExpected, 'Expected self-parent update to fail');
  const eventsAfterFailure = await totalEvents();
  invariant(
    eventsAfterFailure === eventsBeforeFailure,
    'Failed mutations should not emit new audit events'
  );

  for (const eventType of REQUIRED_EVENT_TYPES) {
    const count = await countEventsByType(eventType);
    invariant(count > 0, `Expected at least one ${eventType} event`);
  }

  const nestedEvent = await EventLog.findOne({ event_type: 'box_nested' })
    .sort({ created_at: -1, _id: -1 })
    .lean();
  invariant(!!nestedEvent, 'Expected at least one box_nested event document');
  invariant(
    !!nestedEvent?.details?.to_box_id && !!nestedEvent?.details?.to_box_label,
    'box_nested events should include destination box details'
  );

  const movedEvent = await EventLog.findOne({ event_type: 'item_moved' })
    .sort({ created_at: -1, _id: -1 })
    .lean();
  invariant(!!movedEvent, 'Expected at least one item_moved event document');
  invariant(
    movedEvent.summary.includes('Moved item'),
    'item_moved summary should be human-readable'
  );
  invariant(
    movedEvent?.details?.from_box_label && movedEvent?.details?.to_box_label,
    'item_moved events should include from/to labels'
  );

  const pageOne = await getEventLogsPage({ limit: 5, offset: 0 });
  const pageTwo = await getEventLogsPage({ limit: 5, offset: 5 });
  invariant(pageOne.limit === 5 && pageOne.offset === 0, 'pageOne limit/offset mismatch');
  invariant(pageTwo.limit === 5 && pageTwo.offset === 5, 'pageTwo limit/offset mismatch');
  invariant(
    pageOne.hasMore === (pageOne.total > pageOne.limit),
    'pageOne.hasMore should match total/limit'
  );

  const directTopTen = await EventLog.find({})
    .sort({ created_at: -1, _id: -1 })
    .limit(10)
    .lean();
  invariant(
    pageOne.entries.length > 0 && directTopTen.length > 0,
    'Expected log entries for pagination verification'
  );
  invariant(
    String(pageOne.entries[0]._id) === String(directTopTen[0]._id),
    'GET logs pagination should return newest-first'
  );
  if (pageTwo.entries.length && directTopTen.length > 5) {
    invariant(
      String(pageTwo.entries[0]._id) === String(directTopTen[5]._id),
      'GET logs offset pagination should align with sorted query order'
    );
  }

  const createInBoxEntry = await EventLog.findOne({
    event_type: 'item_created',
    entity_id: String(inBoxItem._id),
  })
    .sort({ created_at: -1, _id: -1 })
    .lean();
  invariant(!!createInBoxEntry, 'Expected item_created entry for createItemInBox');
  invariant(
    !!createInBoxEntry?.details?.to_box_id,
    'createItemInBox item_created entry should include destination box details'
  );

  console.log('✅ Event logging integration test passed');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Event logging integration test failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
