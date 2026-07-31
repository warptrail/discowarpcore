#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const Item = require('../models/Item');
const MediaState = require('../models/MediaState');
const {
  toManagedAbsolutePath,
  getItemTinyPaths,
  readItemTinyMetadata,
  generateItemTinyDerivative,
} = require('../services/itemTinyImageService');

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function parsePositiveIntegerFlag(name, fallback, max) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  const parsed = Number.parseInt(String(raw || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function imagePathCandidates(item) {
  return [
    item?.image?.original?.storagePath,
    item?.image?.original?.url,
    item?.image?.display?.storagePath,
    item?.image?.display?.url,
    item?.image?.thumb?.storagePath,
    item?.image?.thumb?.url,
    item?.imagePath,
  ]
    .map(toManagedAbsolutePath)
    .filter(Boolean);
}

async function pathIsReadable(filePath) {
  if (!filePath) return false;
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

async function findMediaState(item, candidates) {
  const mediaId = toTrimmed(item?.image?.mediaId);
  if (mediaId) {
    const byId = await MediaState.findOne({ mediaId }).lean();
    if (byId) return byId;
  }

  if (!candidates.length) return null;
  return MediaState.findOne({ originalPath: { $in: candidates } }).lean();
}

async function resolveSources(item) {
  const candidates = imagePathCandidates(item);
  const mediaState = await findMediaState(item, candidates);
  const activeVariant = toTrimmed(mediaState?.activeVariant).toLowerCase() === 'processed'
    ? 'processed'
    : 'original';
  const activeSource = activeVariant === 'processed'
    ? toManagedAbsolutePath(mediaState?.processedPath)
    : toManagedAbsolutePath(mediaState?.originalPath);
  const identitySourceCandidates = [
    toManagedAbsolutePath(mediaState?.originalPath),
    ...candidates,
  ].filter(Boolean);
  const identitySource = identitySourceCandidates.find((candidate) =>
    Boolean(getItemTinyPaths(candidate))
  ) || '';
  const orderedSources = [activeSource, ...candidates]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);

  for (const sourcePath of orderedSources) {
    if (await pathIsReadable(sourcePath)) {
      return { sourcePath, identitySource, mediaState, activeVariant };
    }
  }

  return { sourcePath: '', identitySource, mediaState, activeVariant };
}

async function attachMetadata(item, metadata, mediaState, activeVariant) {
  await Item.updateOne(
    { _id: item._id },
    { $set: { 'image.tiny': metadata } },
    { runValidators: true }
  );

  if (mediaState?._id) {
    await MediaState.updateOne(
      { _id: mediaState._id },
      {
        $set: {
          tinyPath: toManagedAbsolutePath(metadata.storagePath),
          tinyDerivedFrom: activeVariant,
        },
      },
      { runValidators: true }
    );
  }
}

async function processItem(item, { apply, force }) {
  const existingStoragePath = toTrimmed(item?.image?.tiny?.storagePath);
  const existingUrl = toTrimmed(item?.image?.tiny?.url);
  if (!force && existingStoragePath && existingUrl) {
    const existingAbsolutePath = toManagedAbsolutePath(existingStoragePath);
    if (await pathIsReadable(existingAbsolutePath)) {
      return { status: 'skipped', reason: 'already_complete' };
    }
  }

  const { sourcePath, identitySource, mediaState, activeVariant } = await resolveSources(item);
  if (!identitySource || !getItemTinyPaths(identitySource)) {
    return { status: 'skipped', reason: 'unmanaged_source' };
  }
  if (!sourcePath) {
    return { status: 'failed', reason: 'missing_source' };
  }

  const tinyPaths = getItemTinyPaths(identitySource);
  const reusable = !force && await pathIsReadable(tinyPaths.absolutePath);
  if (!apply) {
    return { status: 'planned', reason: reusable ? 'attach_existing' : 'generate' };
  }

  let metadata;
  let generated = false;
  if (reusable) {
    metadata = await readItemTinyMetadata(tinyPaths);
    if (metadata.width !== 64 || metadata.height !== 64) {
      metadata = null;
    }
  }
  if (!metadata) {
    const generatedResult = await generateItemTinyDerivative({
      sourcePath,
      identitySourcePath: identitySource,
    });
    metadata = {
      storagePath: generatedResult.storagePath,
      url: generatedResult.url,
      mimeType: generatedResult.mimeType,
      width: generatedResult.width,
      height: generatedResult.height,
      sizeBytes: generatedResult.sizeBytes,
    };
    generated = true;
  }

  await attachMetadata(item, metadata, mediaState, activeVariant);
  return {
    status: generated ? 'generated' : 'attached',
    sizeBytes: Number(metadata.sizeBytes) || 0,
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const limit = parsePositiveIntegerFlag('limit', 100000, 100000);
  const concurrency = parsePositiveIntegerFlag('concurrency', 2, 8);

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const sourceQuery = {
    $or: [
      { 'image.original.storagePath': /\S/ },
      { 'image.original.url': /\S/ },
      { 'image.display.storagePath': /\S/ },
      { 'image.display.url': /\S/ },
      { 'image.thumb.storagePath': /\S/ },
      { 'image.thumb.url': /\S/ },
      { imagePath: /\S/ },
    ],
  };
  const query = force
    ? sourceQuery
    : {
        $and: [
          sourceQuery,
          {
            $or: [
              { 'image.tiny.storagePath': { $exists: false } },
              { 'image.tiny.storagePath': '' },
              { 'image.tiny.url': { $exists: false } },
              { 'image.tiny.url': '' },
            ],
          },
        ],
      };
  const items = await Item.find(query)
    .select('_id name image imagePath')
    .sort({ _id: 1 })
    .limit(limit)
    .lean();

  const summary = {
    operation: 'media.backfill.item_tiny',
    mode: apply ? 'apply' : 'dry-run',
    force,
    selected: items.length,
    planned: 0,
    generated: 0,
    attached: 0,
    skipped: 0,
    failed: 0,
    bytesWritten: 0,
    failures: [],
  };
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      try {
        const result = await processItem(item, { apply, force });
        if (result.status === 'planned') summary.planned += 1;
        else if (result.status === 'generated') summary.generated += 1;
        else if (result.status === 'attached') summary.attached += 1;
        else if (result.status === 'failed') {
          summary.failed += 1;
          summary.failures.push({ itemId: String(item._id), name: item.name, reason: result.reason });
        } else summary.skipped += 1;
        if (result.status === 'generated') {
          summary.bytesWritten += Number(result.sizeBytes) || 0;
        }
      } catch (error) {
        summary.failed += 1;
        summary.failures.push({
          itemId: String(item._id),
          name: item.name,
          reason: error?.message || String(error),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log(JSON.stringify({
    ...summary,
    nextStep: apply
      ? 'Re-run without --apply to confirm no eligible items remain.'
      : 'No data changed. Review this report, then rerun with --apply.',
  }, null, 2));
  if (summary.failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(JSON.stringify({
      operation: 'media.backfill.item_tiny',
      error: { name: error?.name, message: error?.message },
    }, null, 2));
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
