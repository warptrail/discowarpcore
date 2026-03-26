const Box = require('../models/Box');
const Item = require('../models/Item');
const {
  DEFAULT_ITEM_CATEGORY,
  normalizeItemCategory,
} = require('../utils/itemCategory');
const {
  ORPHANED_LABEL,
  formatBoxLabel,
  formatItemLabel,
  logEventBestEffort,
  quoteLabel,
  toIdString,
} = require('./eventLogService');

const AI_IMPORT_FALLBACK_SOURCE = 'ai_json_import';
const AI_IMPORT_SOURCE_MAX_LENGTH = 120;
const MAX_LOGGED_ERRORS = 8;

function createAiImportError(
  message,
  {
    status = 400,
    code = 'AI_IMPORT_INVALID_REQUEST',
    validationErrors = [],
    warnings = [],
    metrics = null,
  } = {}
) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.validationErrors = Array.isArray(validationErrors) ? validationErrors : [];
  err.warnings = Array.isArray(warnings) ? warnings : [];
  if (metrics && typeof metrics === 'object') {
    err.metrics = metrics;
  }
  return err;
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

function normalizeText(value) {
  if (value == null) return '';
  return String(value).trim();
}

function normalizeNullableText(value) {
  if (value == null) return null;
  const cleaned = String(value).trim();
  return cleaned ? cleaned : null;
}

function sanitizeSource(value) {
  const cleaned = normalizeText(value)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return AI_IMPORT_FALLBACK_SOURCE;
  return cleaned.slice(0, AI_IMPORT_SOURCE_MAX_LENGTH);
}

function normalizeTags(rawValue) {
  if (!Array.isArray(rawValue)) return [];

  const tags = [];
  const seen = new Set();

  for (const rawTag of rawValue) {
    const tag = normalizeText(rawTag);
    if (!tag) continue;

    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  return tags;
}

function normalizeQuantity(rawValue) {
  if (rawValue == null || rawValue === '') return 1;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function toValidationError({
  index = null,
  path = '',
  message = 'Invalid value.',
  code = 'INVALID_VALUE',
} = {}) {
  return {
    index,
    path,
    message,
    code,
  };
}

function isTopLevelValidationError(error = {}) {
  return error?.index == null;
}

function parseAiJsonText(rawJsonText) {
  const jsonText = String(rawJsonText ?? '');

  if (!jsonText.trim()) {
    throw createAiImportError('JSON input is required.', {
      code: 'AI_IMPORT_EMPTY_JSON',
      validationErrors: [
        toValidationError({
          path: 'jsonText',
          message: 'Provide JSON text to validate or import.',
          code: 'EMPTY_JSON',
        }),
      ],
    });
  }

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    throw createAiImportError('Malformed JSON payload.', {
      code: 'AI_IMPORT_INVALID_JSON',
      validationErrors: [
        toValidationError({
          path: 'jsonText',
          message: err?.message || 'Invalid JSON syntax.',
          code: 'INVALID_JSON',
        }),
      ],
    });
  }
}

function extractAiImportPayload(body = {}) {
  if (!isPlainObject(body)) {
    throw createAiImportError('Request body must be a JSON object.', {
      code: 'AI_IMPORT_INVALID_BODY',
      validationErrors: [
        toValidationError({
          path: '$',
          message: 'Request body must be a JSON object.',
          code: 'INVALID_BODY',
        }),
      ],
    });
  }

  if (typeof body.jsonText === 'string') {
    return {
      payload: parseAiJsonText(body.jsonText),
      inputMode: 'json_text',
      inputLength: body.jsonText.length,
    };
  }

  if (isPlainObject(body.payload)) {
    return {
      payload: body.payload,
      inputMode: 'payload_object',
      inputLength: 0,
    };
  }

  if ('items' in body || 'batchContext' in body) {
    return {
      payload: body,
      inputMode: 'payload_object',
      inputLength: 0,
    };
  }

  throw createAiImportError('Request must include jsonText or payload.', {
    code: 'AI_IMPORT_MISSING_INPUT',
    validationErrors: [
      toValidationError({
        path: '$',
        message: 'Expected jsonText (string) or payload (object).',
        code: 'MISSING_INPUT',
      }),
    ],
  });
}

function validateAndNormalizeAiImportPayload(rawPayload = {}) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(rawPayload)) {
    errors.push(
      toValidationError({
        path: '$',
        message: 'Top-level payload must be an object.',
        code: 'INVALID_PAYLOAD',
      })
    );
    return {
      valid: false,
      isImportable: false,
      receivedCount: 0,
      validCount: 0,
      failedCount: 0,
      validationErrors: errors,
      warnings,
      normalizedBatchContext: {
        location: null,
        box: null,
        source: AI_IMPORT_FALLBACK_SOURCE,
        itemCount: null,
      },
      normalizedItems: [],
    };
  }

  const rawBatchContext = isPlainObject(rawPayload.batchContext)
    ? rawPayload.batchContext
    : {};

  if (rawPayload.batchContext != null && !isPlainObject(rawPayload.batchContext)) {
    warnings.push('batchContext should be an object; defaults were applied.');
  }

  const normalizedBatchContext = {
    location: normalizeNullableText(rawBatchContext.location),
    box: normalizeNullableText(rawBatchContext.box),
    source: sanitizeSource(rawBatchContext.source),
    itemCount: null,
  };

  if (!normalizeText(rawBatchContext.source)) {
    warnings.push(`batchContext.source defaulted to "${AI_IMPORT_FALLBACK_SOURCE}".`);
  }

  if (rawBatchContext.itemCount != null && rawBatchContext.itemCount !== '') {
    const parsedItemCount = Number(rawBatchContext.itemCount);
    if (Number.isFinite(parsedItemCount) && parsedItemCount >= 0) {
      normalizedBatchContext.itemCount = Math.floor(parsedItemCount);
    } else {
      warnings.push('batchContext.itemCount must be a non-negative number when provided.');
    }
  }

  const rawItems = rawPayload.items;
  if (!Array.isArray(rawItems)) {
    errors.push(
      toValidationError({
        path: 'items',
        message: 'items must be a non-empty array.',
        code: 'INVALID_ITEMS_ARRAY',
      })
    );

    return {
      valid: false,
      isImportable: false,
      receivedCount: 0,
      validCount: 0,
      failedCount: 0,
      validationErrors: errors,
      warnings,
      normalizedBatchContext,
      normalizedItems: [],
    };
  }

  if (rawItems.length === 0) {
    errors.push(
      toValidationError({
        path: 'items',
        message: 'items must contain at least one entry.',
        code: 'EMPTY_ITEMS_ARRAY',
      })
    );
  }

  if (
    Number.isInteger(normalizedBatchContext.itemCount) &&
    normalizedBatchContext.itemCount !== rawItems.length
  ) {
    warnings.push(
      `batchContext.itemCount (${normalizedBatchContext.itemCount}) does not match items.length (${rawItems.length}).`
    );
  }

  const normalizedItems = [];

  rawItems.forEach((rawItem, index) => {
    if (!isPlainObject(rawItem)) {
      errors.push(
        toValidationError({
          index,
          path: `items[${index}]`,
          message: 'Item must be an object.',
          code: 'INVALID_ITEM',
        })
      );
      return;
    }

    const name = normalizeText(rawItem.name);
    if (!name) {
      errors.push(
        toValidationError({
          index,
          path: `items[${index}].name`,
          message: 'name is required and must be non-empty.',
          code: 'MISSING_NAME',
        })
      );
      return;
    }

    const description = rawItem.description == null ? '' : String(rawItem.description).trim();

    normalizedItems.push({
      index,
      name,
      description,
      category: normalizeItemCategory(rawItem.category),
      tags: normalizeTags(rawItem.tags),
      quantity: normalizeQuantity(rawItem.quantity),
      location:
        normalizeNullableText(rawItem.location) ?? normalizedBatchContext.location,
      box: normalizeNullableText(rawItem.box) ?? normalizedBatchContext.box,
    });
  });

  const receivedCount = rawItems.length;
  const validCount = normalizedItems.length;
  const failedCount = Math.max(0, receivedCount - validCount);
  const hasTopLevelErrors = errors.some((entry) => isTopLevelValidationError(entry));

  return {
    valid: errors.length === 0,
    isImportable: !hasTopLevelErrors && validCount > 0,
    receivedCount,
    validCount,
    failedCount,
    validationErrors: errors,
    warnings,
    normalizedBatchContext,
    normalizedItems,
  };
}

function summarizeValidationErrors(errors = [], limit = MAX_LOGGED_ERRORS) {
  const source = Array.isArray(errors) ? errors : [];
  return source.slice(0, limit).map((entry) => ({
    index: entry?.index ?? null,
    path: String(entry?.path || '').trim(),
    message: String(entry?.message || '').trim(),
    code: String(entry?.code || '').trim() || 'INVALID_VALUE',
  }));
}

function buildDestinationSummary(createdEntries = []) {
  const entries = Array.isArray(createdEntries) ? createdEntries : [];
  if (!entries.length) {
    return {
      type: 'orphaned',
      box_id: null,
      box_label: ORPHANED_LABEL,
    };
  }

  const boxMap = new Map();
  let orphanedCount = 0;

  entries.forEach((entry) => {
    if (entry?.boxRef?.id) {
      boxMap.set(entry.boxRef.id, entry.boxRef);
    } else {
      orphanedCount += 1;
    }
  });

  if (!boxMap.size) {
    return {
      type: 'orphaned',
      box_id: null,
      box_label: ORPHANED_LABEL,
    };
  }

  if (boxMap.size === 1 && orphanedCount === 0) {
    const [, onlyBox] = boxMap.entries().next().value;
    return {
      type: 'box',
      box_id: onlyBox.id,
      box_label: onlyBox.label,
      box_short_id: onlyBox.box_id || null,
    };
  }

  const boxes = Array.from(boxMap.values())
    .slice(0, 3)
    .map((entry) => ({
      box_id: entry.id,
      box_short_id: entry.box_id || null,
      box_label: entry.label,
    }));

  return {
    type: 'mixed',
    box_id: null,
    box_label: 'Mixed destination',
    orphaned_count: orphanedCount,
    box_count: boxMap.size,
    boxes,
  };
}

function buildBatchSummary({
  status,
  source,
  createdCount,
  validCount,
  failedCount,
} = {}) {
  const safeSource = normalizeText(source);
  const sourceSuffix =
    safeSource && safeSource !== AI_IMPORT_FALLBACK_SOURCE
      ? ` (source: ${safeSource})`
      : '';

  if (status === 'failed') {
    return `AI JSON import failed (${failedCount} issue${failedCount === 1 ? '' : 's'})${sourceSuffix}`;
  }

  if (status === 'partial_success') {
    return `AI JSON import partial success (${createdCount}/${validCount} created)${sourceSuffix}`;
  }

  return `AI JSON import created ${createdCount} item${createdCount === 1 ? '' : 's'}${sourceSuffix}`;
}

function toBoxRef(box) {
  if (!box) {
    return {
      id: null,
      label: ORPHANED_LABEL,
      box_id: null,
    };
  }

  return {
    id: toIdString(box._id || box.id),
    label: formatBoxLabel(box, ORPHANED_LABEL),
    box_id: box.box_id || null,
  };
}

function toItemRef(item) {
  if (!item) {
    return {
      id: null,
      label: 'Item',
    };
  }

  return {
    id: toIdString(item._id || item.id),
    label: formatItemLabel(item),
  };
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveBoxReference(rawReference, cache = new Map()) {
  const reference = normalizeNullableText(rawReference);
  if (!reference) {
    return {
      ok: true,
      box: null,
      matchedBy: 'none',
      reference: null,
    };
  }

  const key = reference.toLowerCase();
  if (cache.has(key)) {
    return cache.get(key);
  }

  let result;

  if (/^\d{3}$/.test(reference)) {
    const box = await Box.findOne({ box_id: reference })
      .select('_id box_id label location')
      .lean();

    if (!box) {
      result = {
        ok: false,
        code: 'BOX_NOT_FOUND',
        message: `Box reference "${reference}" was not found.`,
        reference,
      };
    } else {
      result = {
        ok: true,
        box,
        matchedBy: 'box_id',
        reference,
      };
    }

    cache.set(key, result);
    return result;
  }

  if (Box.isValidId(reference)) {
    const box = await Box.findById(reference)
      .select('_id box_id label location')
      .lean();

    if (!box) {
      result = {
        ok: false,
        code: 'BOX_NOT_FOUND',
        message: `Box reference "${reference}" was not found.`,
        reference,
      };
    } else {
      result = {
        ok: true,
        box,
        matchedBy: 'mongo_id',
        reference,
      };
    }

    cache.set(key, result);
    return result;
  }

  const labelMatches = await Box.find({
    label: {
      $regex: `^${escapeRegex(reference)}$`,
      $options: 'i',
    },
  })
    .select('_id box_id label location')
    .limit(2)
    .lean();

  if (labelMatches.length === 1) {
    result = {
      ok: true,
      box: labelMatches[0],
      matchedBy: 'label',
      reference,
    };
    cache.set(key, result);
    return result;
  }

  if (labelMatches.length > 1) {
    result = {
      ok: false,
      code: 'AMBIGUOUS_BOX_LABEL',
      message: `Box label "${reference}" matches multiple boxes. Use a 3-digit box ID.`,
      reference,
    };
    cache.set(key, result);
    return result;
  }

  result = {
    ok: false,
    code: 'BOX_NOT_FOUND',
    message: `Box reference "${reference}" was not found.`,
    reference,
  };
  cache.set(key, result);
  return result;
}

async function logAiImportBatchEvent({
  status,
  source,
  phase,
  receivedCount,
  validCount,
  createdCount,
  failedCount,
  destination,
  createdItemIds,
  warnings,
  validationErrors,
  batchContext,
  inputMode,
  inputLength,
} = {}) {
  const safeStatus =
    status === 'success' || status === 'partial_success' || status === 'failed'
      ? status
      : 'failed';

  const safeSource = sanitizeSource(source);
  const errorSummary = summarizeValidationErrors(validationErrors, MAX_LOGGED_ERRORS);
  const summary = buildBatchSummary({
    status: safeStatus,
    source: safeSource,
    createdCount: Number(createdCount) || 0,
    validCount: Number(validCount) || 0,
    failedCount: Number(failedCount) || 0,
  });

  const entityId =
    Array.isArray(createdItemIds) && createdItemIds.length
      ? String(createdItemIds[0])
      : 'ai-json-import';

  await logEventBestEffort(
    {
      event_type: 'items_bulk_imported',
      entity_type: 'item',
      entity_id: entityId,
      entity_label: 'AI JSON Import',
      summary,
      details: {
        count: Number(createdCount) || 0,
        import_event_type: 'ai_import_batch',
        import_mode: 'ai_json',
        import_status: safeStatus,
        import_phase: String(phase || '').trim() || 'import',
        source: safeSource,
        received_count: Number(receivedCount) || 0,
        valid_count: Number(validCount) || 0,
        created_count: Number(createdCount) || 0,
        failed_count: Number(failedCount) || 0,
        destination: destination || {
          type: 'orphaned',
          box_id: null,
          box_label: ORPHANED_LABEL,
        },
        batch_context: {
          location: normalizeNullableText(batchContext?.location),
          box: normalizeNullableText(batchContext?.box),
        },
        input_mode: String(inputMode || '').trim() || 'json_text',
        input_length: Number(inputLength) || 0,
        warning_count: Array.isArray(warnings) ? warnings.length : 0,
        validation_error_count: errorSummary.length,
        validation_errors: errorSummary,
      },
    },
    {
      label: `items_bulk_imported:ai_json:${safeStatus}`,
    }
  );
}

async function validateAiJsonImport(body = {}) {
  let extracted;

  try {
    extracted = extractAiImportPayload(body);
  } catch (err) {
    const validationErrors = Array.isArray(err?.validationErrors)
      ? err.validationErrors
      : [
          toValidationError({
            path: '$',
            message: err?.message || 'Invalid request.',
            code: 'INVALID_REQUEST',
          }),
        ];

    await logAiImportBatchEvent({
      status: 'failed',
      phase: 'validation',
      source: AI_IMPORT_FALLBACK_SOURCE,
      receivedCount: 0,
      validCount: 0,
      createdCount: 0,
      failedCount: validationErrors.length,
      destination: {
        type: 'orphaned',
        box_id: null,
        box_label: ORPHANED_LABEL,
      },
      createdItemIds: [],
      warnings: err?.warnings || [],
      validationErrors,
      batchContext: null,
      inputMode: typeof body?.jsonText === 'string' ? 'json_text' : 'payload_object',
      inputLength: typeof body?.jsonText === 'string' ? body.jsonText.length : 0,
    });

    throw err;
  }

  const validation = validateAndNormalizeAiImportPayload(extracted.payload);

  if (!validation.valid) {
    await logAiImportBatchEvent({
      status: 'failed',
      phase: 'validation',
      source: validation.normalizedBatchContext.source,
      receivedCount: validation.receivedCount,
      validCount: validation.validCount,
      createdCount: 0,
      failedCount: validation.failedCount,
      destination: {
        type: 'orphaned',
        box_id: null,
        box_label: ORPHANED_LABEL,
      },
      createdItemIds: [],
      warnings: validation.warnings,
      validationErrors: validation.validationErrors,
      batchContext: validation.normalizedBatchContext,
      inputMode: extracted.inputMode,
      inputLength: extracted.inputLength,
    });

    const err = createAiImportError('AI JSON import validation failed.', {
      code: 'AI_IMPORT_VALIDATION_FAILED',
      validationErrors: validation.validationErrors,
      warnings: validation.warnings,
      metrics: {
        receivedCount: validation.receivedCount,
        validCount: validation.validCount,
        failedCount: validation.failedCount,
        isImportable: validation.isImportable,
      },
    });
    throw err;
  }

  return {
    valid: validation.valid,
    isImportable: validation.isImportable,
    source: validation.normalizedBatchContext.source,
    receivedCount: validation.receivedCount,
    validCount: validation.validCount,
    failedCount: validation.failedCount,
    warnings: validation.warnings,
    validationErrors: validation.validationErrors,
    normalizedBatchContext: validation.normalizedBatchContext,
    normalizedCount: validation.normalizedItems.length,
  };
}

async function importAiJsonItems(body = {}) {
  let extracted;
  let validation;

  try {
    extracted = extractAiImportPayload(body);
    validation = validateAndNormalizeAiImportPayload(extracted.payload);
  } catch (err) {
    const source = AI_IMPORT_FALLBACK_SOURCE;
    const validationErrors = Array.isArray(err?.validationErrors)
      ? err.validationErrors
      : [
          toValidationError({
            path: '$',
            message: err?.message || 'Invalid request.',
            code: 'INVALID_REQUEST',
          }),
        ];

    await logAiImportBatchEvent({
      status: 'failed',
      phase: 'import',
      source,
      receivedCount: 0,
      validCount: 0,
      createdCount: 0,
      failedCount: validationErrors.length,
      destination: {
        type: 'orphaned',
        box_id: null,
        box_label: ORPHANED_LABEL,
      },
      createdItemIds: [],
      warnings: err?.warnings || [],
      validationErrors,
      batchContext: null,
      inputMode: typeof body?.jsonText === 'string' ? 'json_text' : 'payload_object',
      inputLength: typeof body?.jsonText === 'string' ? body.jsonText.length : 0,
    });

    throw err;
  }

  if (!validation.isImportable) {
    await logAiImportBatchEvent({
      status: 'failed',
      phase: 'import',
      source: validation.normalizedBatchContext.source,
      receivedCount: validation.receivedCount,
      validCount: validation.validCount,
      createdCount: 0,
      failedCount: Math.max(1, validation.failedCount),
      destination: {
        type: 'orphaned',
        box_id: null,
        box_label: ORPHANED_LABEL,
      },
      createdItemIds: [],
      warnings: validation.warnings,
      validationErrors: validation.validationErrors,
      batchContext: validation.normalizedBatchContext,
      inputMode: extracted.inputMode,
      inputLength: extracted.inputLength,
    });

    const err = createAiImportError('AI JSON payload is not importable.', {
      code: 'AI_IMPORT_NOT_IMPORTABLE',
      validationErrors: validation.validationErrors,
      warnings: validation.warnings,
      metrics: {
        receivedCount: validation.receivedCount,
        validCount: validation.validCount,
        failedCount: validation.failedCount,
        isImportable: validation.isImportable,
      },
    });
    throw err;
  }

  const createdItemIds = [];
  const createdEntries = [];
  const failures = validation.validationErrors
    .filter((entry) => !isTopLevelValidationError(entry))
    .map((entry) => ({
      index: entry.index,
      code: entry.code,
      message: entry.message,
      path: entry.path,
      stage: 'validation',
    }));
  const warnings = [...validation.warnings];
  const boxResolutionCache = new Map();

  for (const normalizedItem of validation.normalizedItems) {
    let targetBoxRef = null;

    if (normalizedItem.box) {
      const resolved = await resolveBoxReference(normalizedItem.box, boxResolutionCache);
      if (!resolved.ok) {
        failures.push({
          index: normalizedItem.index,
          name: normalizedItem.name,
          code: resolved.code || 'BOX_RESOLUTION_FAILED',
          message: resolved.message || 'Failed to resolve box reference.',
          path: `items[${normalizedItem.index}].box`,
          stage: 'import',
        });
        continue;
      }

      targetBoxRef = toBoxRef(resolved.box);
    }

    const itemPayload = {
      name: normalizedItem.name,
      description: normalizedItem.description,
      category: normalizedItem.category || DEFAULT_ITEM_CATEGORY,
      tags: normalizedItem.tags,
      quantity: normalizedItem.quantity,
      location: normalizedItem.location || '',
      source: validation.normalizedBatchContext.source,
      orphanedAt: targetBoxRef?.id ? null : new Date(),
    };

    try {
      const created = await Item.create(itemPayload);
      const createdItemRef = toItemRef(created);
      const createdBoxRef =
        targetBoxRef?.id
          ? { ...targetBoxRef }
          : { id: null, label: ORPHANED_LABEL, box_id: null };

      if (targetBoxRef?.id) {
        const attachResult = await Box.updateOne(
          { _id: targetBoxRef.id },
          { $addToSet: { items: created._id } }
        );

        if (!attachResult?.matchedCount) {
          await Item.updateOne(
            { _id: created._id },
            { $set: { orphanedAt: new Date() } }
          );

          warnings.push(
            `Box ${targetBoxRef.box_id || targetBoxRef.id} disappeared during import; item "${createdItemRef.label}" was imported as orphaned.`
          );
          createdBoxRef.id = null;
          createdBoxRef.box_id = null;
          createdBoxRef.label = ORPHANED_LABEL;
        }
      }

      createdItemIds.push(createdItemRef.id);
      createdEntries.push({
        id: createdItemRef.id,
        label: createdItemRef.label,
        boxRef: createdBoxRef,
        index: normalizedItem.index,
      });

      await logEventBestEffort(
        {
          event_type: 'item_created',
          entity_type: 'item',
          entity_id: createdItemRef.id,
          entity_label: createdItemRef.label,
          summary: `Created item ${quoteLabel(createdItemRef.label)}`,
          details: {
            to_box_id: createdBoxRef.id,
            to_box_label: createdBoxRef.label,
            import_event_type: 'ai_import_batch',
            import_mode: 'ai_json',
            source: validation.normalizedBatchContext.source,
            import_index: normalizedItem.index,
          },
        },
        {
          label: `item_created:${createdItemRef.id}`,
        }
      );
    } catch (err) {
      failures.push({
        index: normalizedItem.index,
        name: normalizedItem.name,
        code: 'ITEM_CREATE_FAILED',
        message: err?.message || 'Failed to create item.',
        path: `items[${normalizedItem.index}]`,
        stage: 'import',
      });
    }
  }

  const createdCount = createdEntries.length;
  const failedCount = failures.length;
  const status =
    createdCount === 0
      ? 'failed'
      : failedCount > 0
      ? 'partial_success'
      : 'success';

  const destination = buildDestinationSummary(createdEntries);

  await logAiImportBatchEvent({
    status,
    phase: 'import',
    source: validation.normalizedBatchContext.source,
    receivedCount: validation.receivedCount,
    validCount: validation.validCount,
    createdCount,
    failedCount,
    destination,
    createdItemIds,
    warnings,
    validationErrors: failures,
    batchContext: validation.normalizedBatchContext,
    inputMode: extracted.inputMode,
    inputLength: extracted.inputLength,
  });

  return {
    status,
    source: validation.normalizedBatchContext.source,
    receivedCount: validation.receivedCount,
    validCount: validation.validCount,
    createdCount,
    failedCount,
    createdItemIds,
    destination,
    warnings,
    validationErrors: failures,
    batchContext: validation.normalizedBatchContext,
  };
}

module.exports = {
  AI_IMPORT_FALLBACK_SOURCE,
  validateAndNormalizeAiImportPayload,
  validateAiJsonImport,
  importAiJsonItems,
};
