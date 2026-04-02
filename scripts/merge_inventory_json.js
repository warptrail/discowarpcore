#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const {
  BATCHES_ROOT,
  getBatchLayout,
  parseArgs,
  resolveRepoPath,
  toTrimmed,
} = require('./intakeWorkspace');

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const args = parseArgs();
  const batchDir = resolveRepoPath(args['batch-dir'], path.join(BATCHES_ROOT, 'example-batch'));
  const layout = getBatchLayout(batchDir);
  const outputPath = resolveRepoPath(args.output, layout.mergedInventoryJson);
  const inputPaths = args._.map((entry) => resolveRepoPath(entry, entry));

  if (!inputPaths.length) {
    throw new Error('Provide one or more input JSON files.');
  }

  const merged = {
    batchContext: null,
    items: [],
  };

  for (const inputPath of inputPaths) {
    const payload = await readJsonFile(inputPath);
    if (!isPlainObject(payload)) {
      throw new Error(`Expected top-level object in ${inputPath}`);
    }
    if (!merged.batchContext && isPlainObject(payload.batchContext)) {
      merged.batchContext = payload.batchContext;
    }
    if (Array.isArray(payload.items)) {
      merged.items.push(...payload.items);
    }
  }

  if (!merged.batchContext) {
    merged.batchContext = {
      source: toTrimmed(args.source) || 'ai_json_import',
    };
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

  console.log(`Merged ${inputPaths.length} file(s) into ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Item count: ${merged.items.length}`);
}

main().catch((error) => {
  console.error(`Failed to merge inventory JSON: ${error.message}`);
  process.exit(1);
});
