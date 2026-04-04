#!/usr/bin/env node

const path = require('path');
const {
  BATCHES_ROOT,
  createBatchId,
  ensureBatchStructure,
  getExternalIntakeRoot,
  parseArgs,
  resolveRepoPath,
} = require('./intakeWorkspace');

async function main() {
  const args = parseArgs();
  const requestedName = args.name || args._[0] || 'batch';
  const batchId = createBatchId(requestedName);
  const batchesRoot = resolveRepoPath(args['batches-root'], getExternalIntakeRoot() || BATCHES_ROOT);
  const batchDir = path.join(batchesRoot, batchId);
  const layout = await ensureBatchStructure(batchDir);

  console.log(`Created intake batch: ${path.relative(process.cwd(), layout.batchDir)}`);
  console.log(`- merged JSON: ${path.relative(process.cwd(), layout.mergedInventoryJson)}`);
  console.log(`- image-order CSV: ${path.relative(process.cwd(), layout.imageOrderCsv)}`);
  console.log(`- mapping CSV: ${path.relative(process.cwd(), layout.imageKeyMappingCsv)}`);
  console.log(`- original images: ${path.relative(process.cwd(), layout.originalImagesDir)}`);
  console.log(`- staged images: ${path.relative(process.cwd(), layout.stagedImagesDir)}`);
}

main().catch((error) => {
  console.error(`Failed to create intake batch: ${error.message}`);
  process.exit(1);
});
