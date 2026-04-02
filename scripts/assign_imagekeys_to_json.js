#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const {
  BATCHES_ROOT,
  getBatchLayout,
  parseArgs,
  resolveRepoPath,
  slugify,
  toTrimmed,
} = require('./intakeWorkspace');

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function buildUniqueImageKey(baseKey, seenKeys) {
  let candidate = baseKey;
  let counter = 2;

  while (seenKeys.has(candidate)) {
    candidate = `${baseKey}-${counter}`;
    counter += 1;
  }

  seenKeys.add(candidate);
  return candidate;
}

function assignMissingImageKeys(payload = {}, { overwrite = false } = {}) {
  if (!isPlainObject(payload)) {
    throw new Error('Expected top-level JSON object.');
  }

  const sourceItems = Array.isArray(payload.items) ? payload.items : [];
  const seenKeys = new Set(
    sourceItems
      .map((item) => toTrimmed(item?.imageKey))
      .filter(Boolean)
  );

  let assignedCount = 0;
  let skippedCount = 0;

  const items = sourceItems.map((item, index) => {
    if (!isPlainObject(item)) {
      skippedCount += 1;
      return item;
    }

    const currentImageKey = toTrimmed(item.imageKey);
    if (currentImageKey && !overwrite) {
      return item;
    }

    const name = toTrimmed(item.name);
    if (!name) {
      skippedCount += 1;
      return item;
    }

    if (currentImageKey && overwrite) {
      seenKeys.delete(currentImageKey);
    }

    const baseKey = slugify(name, `item-${index + 1}`);
    const imageKey = buildUniqueImageKey(baseKey, seenKeys);
    assignedCount += 1;

    return {
      ...item,
      imageKey,
    };
  });

  return {
    payload: {
      ...payload,
      items,
    },
    assignedCount,
    skippedCount,
    totalItemCount: sourceItems.length,
  };
}

async function main() {
  const args = parseArgs();
  const batchDir = resolveRepoPath(args['batch-dir'], path.join(BATCHES_ROOT, 'example-batch'));
  const layout = getBatchLayout(batchDir);
  const inputPath = resolveRepoPath(args.json, layout.mergedInventoryJson);
  const outputPath = resolveRepoPath(args.output, inputPath);
  const overwrite = args.overwrite === true;

  const raw = await fs.readFile(inputPath, 'utf8');
  const parsed = JSON.parse(raw);
  const result = assignMissingImageKeys(parsed, { overwrite });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(result.payload, null, 2)}\n`, 'utf8');

  console.log(`Updated JSON: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Assigned imageKey values: ${result.assignedCount}`);
  console.log(`Skipped items: ${result.skippedCount}`);
  console.log(`Total items: ${result.totalItemCount}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Failed to assign imageKey values: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  assignMissingImageKeys,
};
