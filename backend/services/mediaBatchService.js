const MediaState = require('../models/MediaState');
const {
  processImageWithObjectGlow,
  syncDerivedVariantsForMedia,
} = require('./mediaProcessingService');
const {
  MEDIA_ERROR_CODES,
  createMediaError,
  toMediaErrorPayload,
} = require('./mediaErrors');

const SUPPORTED_BATCH_OPERATIONS = new Set([
  'process_missing_processed',
  'retry_failed_processing',
  'rebuild_derived_variants',
]);

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function toBoundedPositiveInteger(value, fallback = 25, { min = 1, max = 200 } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function parseDate(value, label) {
  if (value == null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      `${label} must be a valid date value.`
    );
  }
  return date;
}

function toNullableVariant(value) {
  if (value === null) return null;
  const normalized = toTrimmed(value).toLowerCase();
  if (!normalized) return null;
  if (normalized === 'original' || normalized === 'processed') {
    return normalized;
  }
  throw createMediaError(
    MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
    'Variant filters must be "original" or "processed".'
  );
}

function buildOperationQuery(operation) {
  if (operation === 'process_missing_processed') {
    return {
      $and: [
        {
          $or: [
            { processedPath: { $exists: false } },
            { processedPath: '' },
            { processedPath: null },
          ],
        },
        { processingStatus: { $ne: 'processing' } },
      ],
    };
  }

  if (operation === 'retry_failed_processing') {
    return { processingStatus: 'failed' };
  }

  if (operation === 'rebuild_derived_variants') {
    return { originalPath: { $nin: ['', null] } };
  }

  throw createMediaError(
    MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
    `Unsupported operation: ${operation}`,
  );
}

function buildFilterQuery(rawFilter = {}) {
  const filter = rawFilter && typeof rawFilter === 'object' ? rawFilter : {};
  const clauses = [];

  const processingStatus = toTrimmed(filter.processingStatus).toLowerCase();
  if (processingStatus) {
    clauses.push({ processingStatus });
  }

  const activeVariant = toTrimmed(filter.activeVariant).toLowerCase();
  if (activeVariant) {
    clauses.push({ activeVariant });
  }

  if (Object.prototype.hasOwnProperty.call(filter, 'displayDerivedFrom')) {
    const displayDerivedFrom = toNullableVariant(filter.displayDerivedFrom);
    clauses.push({ displayDerivedFrom });
  }

  if (Object.prototype.hasOwnProperty.call(filter, 'thumbDerivedFrom')) {
    const thumbDerivedFrom = toNullableVariant(filter.thumbDerivedFrom);
    clauses.push({ thumbDerivedFrom });
  }

  if (Object.prototype.hasOwnProperty.call(filter, 'hasProcessedPath')) {
    const hasProcessedPath = toBoolean(filter.hasProcessedPath, true);
    if (hasProcessedPath) {
      clauses.push({ processedPath: { $nin: ['', null] } });
    } else {
      clauses.push({ $or: [{ processedPath: '' }, { processedPath: null }] });
    }
  }

  const processedPath = toTrimmed(filter.processedPath);
  if (processedPath) {
    clauses.push({ processedPath });
  }

  const processedAtAfter = parseDate(filter.processedAtAfter, 'processedAtAfter');
  const processedAtBefore = parseDate(filter.processedAtBefore, 'processedAtBefore');
  if (processedAtAfter || processedAtBefore) {
    const condition = {};
    if (processedAtAfter) condition.$gte = processedAtAfter;
    if (processedAtBefore) condition.$lte = processedAtBefore;
    clauses.push({ processedAt: condition });
  }

  if (Object.prototype.hasOwnProperty.call(filter, 'processedAtMissing')) {
    const processedAtMissing = toBoolean(filter.processedAtMissing, false);
    if (processedAtMissing) {
      clauses.push({ processedAt: null });
    }
  }

  const originalPath = toTrimmed(filter.originalPath);
  if (originalPath) {
    clauses.push({ originalPath });
  }

  if (!clauses.length) return {};
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

function mergeQueries(...queries) {
  const active = queries.filter((query) => query && Object.keys(query).length > 0);
  if (!active.length) return {};
  if (active.length === 1) return active[0];
  return { $and: active };
}

function summarizeRecordForDryRun(record, operation) {
  return {
    originalPath: String(record?.originalPath || ''),
    processedPath: String(record?.processedPath || ''),
    activeVariant: String(record?.activeVariant || ''),
    processingStatus: String(record?.processingStatus || ''),
    operation,
    status: 'planned',
  };
}

function summarizeFailure(record, operation, error) {
  const normalizedError = toMediaErrorPayload(error, {
    code: MEDIA_ERROR_CODES.OBJECT_GLOW_PROCESS_FAILED,
    message: 'Batch item operation failed',
  });

  return {
    originalPath: String(record?.originalPath || ''),
    processedPath: String(record?.processedPath || ''),
    activeVariant: String(record?.activeVariant || ''),
    processingStatus: String(record?.processingStatus || ''),
    operation,
    status: 'failed',
    error: normalizedError,
  };
}

async function runOperationForRecord(operation, record) {
  const originalPath = toTrimmed(record?.originalPath);
  const processedPath = toTrimmed(record?.processedPath);

  if (!originalPath) {
    return {
      status: 'skipped',
      summary: {
        originalPath: '',
        processedPath,
        activeVariant: String(record?.activeVariant || ''),
        processingStatus: String(record?.processingStatus || ''),
        operation,
        status: 'skipped',
        reason: 'missing_original_path',
      },
    };
  }

  if (operation === 'rebuild_derived_variants') {
    const processingState = await syncDerivedVariantsForMedia(originalPath);
    return {
      status: 'succeeded',
      summary: {
        originalPath,
        processedPath: String(processingState?.processedPath || processedPath),
        activeVariant: String(processingState?.activeVariant || ''),
        processingStatus: String(processingState?.processingStatus || ''),
        operation,
        status: 'succeeded',
      },
    };
  }

  const outcome = await processImageWithObjectGlow(
    originalPath,
    processedPath || undefined
  );

  return {
    status: 'succeeded',
    summary: {
      originalPath,
      processedPath: String(outcome?.processingState?.processedPath || processedPath),
      activeVariant: String(outcome?.processingState?.activeVariant || ''),
      processingStatus: String(outcome?.processingState?.processingStatus || ''),
      operation,
      status: 'succeeded',
    },
  };
}

async function runMediaBatchOperation({ operation, filter, limit, dryRun } = {}) {
  const normalizedOperation = toTrimmed(operation).toLowerCase();
  if (!SUPPORTED_BATCH_OPERATIONS.has(normalizedOperation)) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      `operation must be one of: ${Array.from(SUPPORTED_BATCH_OPERATIONS).join(', ')}`,
    );
  }

  const safeLimit = toBoundedPositiveInteger(limit, 25, { min: 1, max: 200 });
  const isDryRun = toBoolean(dryRun, false);

  const operationQuery = buildOperationQuery(normalizedOperation);
  const filterQuery = buildFilterQuery(filter || {});
  const combinedQuery = mergeQueries(operationQuery, filterQuery);

  const matchedCount = await MediaState.countDocuments(combinedQuery);
  const selected = await MediaState.find(combinedQuery)
    .sort({ updatedAt: 1, _id: 1 })
    .limit(safeLimit)
    .lean();

  const records = [];
  let attemptedCount = 0;
  let succeededCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const record of selected) {
    if (isDryRun) {
      records.push(summarizeRecordForDryRun(record, normalizedOperation));
      attemptedCount += 1;
      continue;
    }

    attemptedCount += 1;
    try {
      const result = await runOperationForRecord(normalizedOperation, record);
      records.push(result.summary);
      if (result.status === 'skipped') {
        skippedCount += 1;
      } else {
        succeededCount += 1;
      }
    } catch (error) {
      failedCount += 1;
      records.push(summarizeFailure(record, normalizedOperation, error));
    }
  }

  return {
    operation: normalizedOperation,
    dryRun: isDryRun,
    matchedCount,
    attemptedCount,
    succeededCount,
    failedCount,
    skippedCount,
    records,
  };
}

module.exports = {
  SUPPORTED_BATCH_OPERATIONS,
  runMediaBatchOperation,
};
