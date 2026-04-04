const mongoose = require('mongoose');

const VALIDATION_STATUSES = ['not_validated', 'passed', 'failed'];
const IMPORT_STATUSES = ['not_imported', 'success', 'failed'];
const PROCESSING_STATUSES = [
  'not_requested',
  'queued',
  'in_progress',
  'partial',
  'complete',
  'failed',
];
const ARCHIVE_STATUSES = ['active', 'archived'];

const storedFilePathsSchema = new mongoose.Schema(
  {
    aiJsonPath: { type: String, default: '' },
    mappingCsvPath: { type: String, default: '' },
    collagePath: { type: String, default: '' },
    originalImagesDirPath: { type: String, default: '' },
    stagedImagesDirPath: { type: String, default: '' },
    imageKeyMappingCsvPath: { type: String, default: '' },
  },
  { _id: false }
);

const sourceManifestSchema = new mongoose.Schema(
  {
    aiJsonOriginalFilename: { type: String, default: '' },
    mappingCsvOriginalFilename: { type: String, default: '' },
    collageOriginalFilename: { type: String, default: '' },
    imageOriginalFilenames: { type: [String], default: [] },
    imageCount: { type: Number, default: 0 },
    imagesIncluded: { type: Boolean, default: false },
    storedFilePaths: { type: storedFilePathsSchema, default: () => ({}) },
  },
  { _id: false }
);

const validationSnapshotSchema = new mongoose.Schema(
  {
    status: { type: String, enum: VALIDATION_STATUSES, default: 'not_validated' },
    validatedAt: { type: Date, default: null },
    totalItems: { type: Number, default: 0 },
    itemsWithImageKeysCount: { type: Number, default: 0 },
    rowCount: { type: Number, default: 0 },
    readyCount: { type: Number, default: 0 },
    missingCount: { type: Number, default: 0 },
    ambiguousCount: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    csvSourceFilesCount: { type: Number, default: 0 },
    originalImageFilesCount: { type: Number, default: 0 },
    validationErrors: { type: [String], default: [] },
    validationWarnings: { type: [String], default: [] },
  },
  { _id: false }
);

const importSnapshotSchema = new mongoose.Schema(
  {
    status: { type: String, enum: IMPORT_STATUSES, default: 'not_imported' },
    importedAt: { type: Date, default: null },
    createdItemCount: { type: Number, default: 0 },
    updatedItemCount: { type: Number, default: 0 },
    skippedItemCount: { type: Number, default: 0 },
    failedItemCount: { type: Number, default: 0 },
    importedItemIds: { type: [String], default: [] },
    importErrorSummary: { type: String, default: '' },
  },
  { _id: false }
);

const processingSummarySchema = new mongoose.Schema(
  {
    status: { type: String, enum: PROCESSING_STATUSES, default: 'not_requested' },
    queuedCount: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    lastRequestedAt: { type: Date, default: null },
  },
  { _id: false }
);

const archiveStateSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ARCHIVE_STATUSES, default: 'active' },
    archivedAt: { type: Date, default: null },
    archiveReason: { type: String, default: '' },
    sourceFilesDeletedAt: { type: Date, default: null },
  },
  { _id: false }
);

const identitySchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, trim: true },
    batchName: { type: String, default: '', trim: true },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const packageSnapshotSchema = new mongoose.Schema(
  {
    ingestedAt: { type: Date, default: null },
    originalPackageFilename: { type: String, default: '' },
    manifest: { type: mongoose.Schema.Types.Mixed, default: undefined },
    structureSummary: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    schemaVersion: { type: Number, default: 3 },
    batchDir: { type: String, required: true, trim: true },
    identity: { type: identitySchema, required: true },
    sourceManifest: { type: sourceManifestSchema, default: () => ({}) },
    validationSnapshot: { type: validationSnapshotSchema, default: () => ({}) },
    importSnapshot: { type: importSnapshotSchema, default: () => ({}) },
    archiveState: { type: archiveStateSchema, default: () => ({}) },
    processingSummary: { type: processingSummarySchema, default: () => ({}) },
    packageSnapshot: { type: packageSnapshotSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

batchSchema.index({ 'identity.batchId': 1 }, { unique: true });

module.exports = mongoose.models.Batch || mongoose.model('Batch', batchSchema);
