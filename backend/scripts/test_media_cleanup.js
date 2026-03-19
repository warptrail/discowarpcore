const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');

const TEST_MEDIA_ROOT =
  process.env.MEDIA_ROOT_TEST ||
  path.join(os.tmpdir(), `discowarpcore_media_cleanup_${Date.now()}`);
process.env.MEDIA_ROOT = TEST_MEDIA_ROOT;

const { ensureMediaDirs, MEDIA_ROOT, toMediaUrl } = require('../config/media');
const Box = require('../models/Box');
const Item = require('../models/Item');
const { deleteBoxById, setBoxImage } = require('../services/boxService');
const { hardDeleteItem, setItemImage } = require('../services/itemService');
const { safeDeleteMediaFile } = require('../utils/mediaCleanup');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function mediaPathsFor(type, stem) {
  const root = type === 'box' ? 'boxes' : 'items';
  return {
    original: `${root}/original/${stem}.jpg`,
    display: `${root}/display/${stem}.webp`,
    thumb: `${root}/thumb/${stem}.webp`,
  };
}

function buildImageMetadata(paths, stem) {
  return {
    originalName: `${stem}.jpg`,
    uploadedAt: new Date(),
    original: {
      storagePath: paths.original,
      url: toMediaUrl(paths.original),
      mimeType: 'image/jpeg',
      width: 100,
      height: 100,
      sizeBytes: 1000,
    },
    display: {
      storagePath: paths.display,
      url: toMediaUrl(paths.display),
      mimeType: 'image/webp',
      width: 80,
      height: 80,
      sizeBytes: 800,
    },
    thumb: {
      storagePath: paths.thumb,
      url: toMediaUrl(paths.thumb),
      mimeType: 'image/webp',
      width: 20,
      height: 20,
      sizeBytes: 200,
    },
  };
}

function toAbsolutePath(storagePath) {
  return path.join(MEDIA_ROOT, storagePath);
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function writeMediaFile(storagePath, content = 'test-image') {
  const absolutePath = toAbsolutePath(storagePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content);
  return absolutePath;
}

async function createImageBundle(type, stem) {
  const paths = mediaPathsFor(type, stem);
  const image = buildImageMetadata(paths, stem);
  await Promise.all([
    writeMediaFile(paths.original, `${stem}:original`),
    writeMediaFile(paths.display, `${stem}:display`),
    writeMediaFile(paths.thumb, `${stem}:thumb`),
  ]);
  return image;
}

async function assertImageFiles(image, expectedExists, label) {
  const storagePaths = [
    image?.original?.storagePath,
    image?.display?.storagePath,
    image?.thumb?.storagePath,
  ].filter(Boolean);

  for (const storagePath of storagePaths) {
    const exists = await pathExists(toAbsolutePath(storagePath));
    invariant(
      exists === expectedExists,
      `${label}: expected ${storagePath} exists=${expectedExists}, got ${exists}`,
    );
  }
}

let nextBoxIdSeed = 930;
function nextBoxId() {
  nextBoxIdSeed += 1;
  return String(nextBoxIdSeed);
}

async function scenarioDeleteBoxOwnImageOnly() {
  const deletedBoxImage = await createImageBundle('box', 'delete-target-box');
  const childBoxImage = await createImageBundle('box', 'child-box-preserved');
  const orphanedItemImage = await createImageBundle('item', 'orphaned-item-preserved');
  const descendantItemImage = await createImageBundle(
    'item',
    'descendant-item-preserved',
  );

  const directItem = await Item.create({
    name: 'direct-item',
    orphanedAt: null,
    image: orphanedItemImage,
    imagePath: orphanedItemImage.display.url,
  });

  const descendantItem = await Item.create({
    name: 'descendant-item',
    orphanedAt: null,
    image: descendantItemImage,
    imagePath: descendantItemImage.display.url,
  });

  const root = await Box.create({
    box_id: nextBoxId(),
    label: 'root',
    parentBox: null,
    items: [],
  });

  const deletedTarget = await Box.create({
    box_id: nextBoxId(),
    label: 'delete-target',
    parentBox: root._id,
    items: [directItem._id],
    image: deletedBoxImage,
    imagePath: deletedBoxImage.display.url,
  });

  const child = await Box.create({
    box_id: nextBoxId(),
    label: 'child',
    parentBox: deletedTarget._id,
    items: [descendantItem._id],
    image: childBoxImage,
    imagePath: childBoxImage.display.url,
  });

  await deleteBoxById(deletedTarget._id);

  const [deletedAfter, childAfter, directItemAfter, descendantItemAfter] =
    await Promise.all([
      Box.findById(deletedTarget._id).lean(),
      Box.findById(child._id).lean(),
      Item.findById(directItem._id).lean(),
      Item.findById(descendantItem._id).lean(),
    ]);

  invariant(!deletedAfter, 'Scenario 1: deleted box should be removed');
  await assertImageFiles(
    deletedBoxImage,
    false,
    'Scenario 1: deleted box image files should be removed',
  );

  invariant(!!childAfter, 'Scenario 2: child box should still exist');
  invariant(
    childAfter.parentBox == null,
    'Scenario 2: child box should be reparented to floor level',
  );
  await assertImageFiles(
    childBoxImage,
    true,
    'Scenario 2: child box image files should be preserved',
  );

  invariant(!!directItemAfter, 'Scenario 3: direct item should still exist');
  invariant(
    !!directItemAfter.orphanedAt,
    'Scenario 3: direct item should be orphaned after parent box delete',
  );
  await assertImageFiles(
    orphanedItemImage,
    true,
    'Scenario 3: orphaned direct item image files should be preserved',
  );

  invariant(
    descendantItemAfter?.orphanedAt == null,
    'Scenario 3: descendant item should not be orphaned',
  );
  await assertImageFiles(
    descendantItemImage,
    true,
    'Scenario 3: descendant item image files should be preserved',
  );
}

async function scenarioDeleteItemImage() {
  const itemImage = await createImageBundle('item', 'delete-item-target');
  const item = await Item.create({
    name: 'item-delete-target',
    orphanedAt: null,
    image: itemImage,
    imagePath: itemImage.display.url,
  });

  const holder = await Box.create({
    box_id: nextBoxId(),
    label: 'holder',
    parentBox: null,
    items: [item._id],
  });

  const deleted = await hardDeleteItem(item._id);
  invariant(!!deleted, 'Scenario 4: hardDeleteItem should return deleted item');

  const [itemAfter, holderAfter] = await Promise.all([
    Item.findById(item._id).lean(),
    Box.findById(holder._id).lean(),
  ]);
  invariant(!itemAfter, 'Scenario 4: item should be removed');
  await assertImageFiles(
    itemImage,
    false,
    'Scenario 4: deleted item image files should be removed',
  );

  const holderStillHasItem = (holderAfter?.items || []).some(
    (entry) => String(entry) === String(item._id),
  );
  invariant(
    !holderStillHasItem,
    'Scenario 4: deleted item should be removed from containing box.items',
  );
}

async function scenarioReplaceBoxImageRemovesOld() {
  const oldImage = await createImageBundle('box', 'replace-box-old');
  const newImage = await createImageBundle('box', 'replace-box-new');

  const box = await Box.create({
    box_id: nextBoxId(),
    label: 'replace-box',
    parentBox: null,
    items: [],
    image: oldImage,
    imagePath: oldImage.display.url,
  });

  const updated = await setBoxImage(box._id, newImage);
  invariant(!!updated, 'Scenario 5: setBoxImage should update an existing box');
  invariant(
    updated.imagePath === newImage.display.url,
    'Scenario 5: box imagePath should point to new display URL',
  );

  await assertImageFiles(
    oldImage,
    false,
    'Scenario 5: old box image files should be removed after replace',
  );
  await assertImageFiles(
    newImage,
    true,
    'Scenario 5: new box image files should remain after replace',
  );
}

async function scenarioReplaceItemImageRemovesOld() {
  const oldImage = await createImageBundle('item', 'replace-item-old');
  const newImage = await createImageBundle('item', 'replace-item-new');

  const item = await Item.create({
    name: 'replace-item',
    orphanedAt: null,
    image: oldImage,
    imagePath: oldImage.display.url,
  });

  const updated = await setItemImage(item._id, newImage);
  invariant(!!updated, 'Scenario 6: setItemImage should update an existing item');
  invariant(
    updated.imagePath === newImage.display.url,
    'Scenario 6: item imagePath should point to new display URL',
  );

  await assertImageFiles(
    oldImage,
    false,
    'Scenario 6: old item image files should be removed after replace',
  );
  await assertImageFiles(
    newImage,
    true,
    'Scenario 6: new item image files should remain after replace',
  );
}

async function scenarioMissingOldFileDoesNotCrash() {
  const missingPaths = mediaPathsFor('item', 'missing-old-item');
  const staleImage = buildImageMetadata(missingPaths, 'missing-old-item');
  const newImage = await createImageBundle('item', 'missing-old-item-new');

  const item = await Item.create({
    name: 'missing-old-file-item',
    orphanedAt: null,
    image: staleImage,
    imagePath: staleImage.display.url,
  });

  const updated = await setItemImage(item._id, newImage);
  invariant(
    !!updated,
    'Scenario 7: replacement should succeed when old file is already missing',
  );
  await assertImageFiles(
    newImage,
    true,
    'Scenario 7: new item image files should remain after successful replace',
  );
}

async function scenarioRefusePathTraversal() {
  const outsidePath = path.join(
    os.tmpdir(),
    `discowarpcore_media_cleanup_outside_${Date.now()}.txt`,
  );
  await fs.writeFile(outsidePath, 'outside-media-root');

  const absoluteRefusal = await safeDeleteMediaFile(outsidePath, {
    label: 'media-cleanup-test',
  });
  invariant(
    absoluteRefusal.reason === 'outside-media-root',
    'Scenario 8: absolute outside path should be refused',
  );
  invariant(
    await pathExists(outsidePath),
    'Scenario 8: outside absolute file must not be deleted',
  );

  const traversalRefusal = await safeDeleteMediaFile('../../etc/passwd', {
    label: 'media-cleanup-test',
  });
  invariant(
    traversalRefusal.reason === 'outside-media-root',
    'Scenario 8: traversal path should be refused',
  );

  await fs.unlink(outsidePath).catch(() => {});
}

async function run() {
  const mongoUri =
    process.env.MONGO_URI_TEST_MEDIA_CLEANUP ||
    'mongodb://127.0.0.1:27017/discowarpcore_media_cleanup_test';

  ensureMediaDirs();
  console.log(`✅ Using MEDIA_ROOT: ${MEDIA_ROOT}`);

  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to MongoDB: ${mongoUri}`);

  await Promise.all([Box.deleteMany({}), Item.deleteMany({})]);

  await scenarioDeleteBoxOwnImageOnly();
  console.log('✅ Scenarios 1-3 passed');

  await scenarioDeleteItemImage();
  console.log('✅ Scenario 4 passed');

  await scenarioReplaceBoxImageRemovesOld();
  console.log('✅ Scenario 5 passed');

  await scenarioReplaceItemImageRemovesOld();
  console.log('✅ Scenario 6 passed');

  await scenarioMissingOldFileDoesNotCrash();
  console.log('✅ Scenario 7 passed');

  await scenarioRefusePathTraversal();
  console.log('✅ Scenario 8 passed');

  console.log('✅ Media cleanup test script passed all scenarios');
}

run()
  .catch((err) => {
    console.error('❌ Media cleanup test script failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await Promise.all([Box.deleteMany({}), Item.deleteMany({})]);
    } catch {
      // ignore cleanup errors
    }
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    try {
      await fs.rm(MEDIA_ROOT, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });
