const {
  AI_IMPORT_FALLBACK_SOURCE,
  validateAndNormalizeAiImportPayload,
} = require('../services/aiJsonImportService');

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const singleValid = validateAndNormalizeAiImportPayload({
    batchContext: {
      location: 'Garage Shelf',
      box: '101',
      source: 'vision_pipeline_v1',
      itemCount: 1,
    },
    items: [
      {
        name: 'Hammer',
        description: '16oz claw hammer',
        category: 'Tools',
        tags: ['metal', 'heavy'],
        quantity: 2,
      },
    ],
  });

  invariant(singleValid.valid === true, 'Expected singleValid.valid to be true');
  invariant(singleValid.isImportable === true, 'Expected singleValid.isImportable true');
  invariant(singleValid.receivedCount === 1, 'Expected singleValid.receivedCount === 1');
  invariant(singleValid.validCount === 1, 'Expected singleValid.validCount === 1');
  invariant(singleValid.normalizedItems[0].category === 'tools', 'Expected normalized category tools');
  invariant(singleValid.normalizedItems[0].location === 'Garage Shelf', 'Expected batch location fallback');
  invariant(singleValid.normalizedItems[0].box === '101', 'Expected batch box fallback');

  const perItemOverride = validateAndNormalizeAiImportPayload({
    batchContext: {
      location: 'Hall Closet',
      box: '201',
      source: 'batch_override_test',
      itemCount: 2,
    },
    items: [
      {
        name: 'Extension Cord',
        description: '',
        category: 'Hardware',
      },
      {
        name: 'Portable Fan',
        description: 'Summer backup fan',
        location: 'Guest Room',
        box: '305',
        extraUnknownField: 'ignore me',
      },
    ],
  });

  invariant(perItemOverride.valid === true, 'Expected perItemOverride.valid to be true');
  invariant(
    perItemOverride.normalizedItems[0].location === 'Hall Closet' &&
      perItemOverride.normalizedItems[0].box === '201',
    'Expected first item to inherit batch location/box'
  );
  invariant(
    perItemOverride.normalizedItems[1].location === 'Guest Room' &&
      perItemOverride.normalizedItems[1].box === '305',
    'Expected second item to override batch location/box'
  );

  const missingItems = validateAndNormalizeAiImportPayload({
    batchContext: { source: 'missing_items' },
  });
  invariant(missingItems.valid === false, 'Expected missingItems.valid false');
  invariant(missingItems.isImportable === false, 'Expected missingItems.isImportable false');
  invariant(
    missingItems.validationErrors.some((entry) => entry.path === 'items'),
    'Expected missing items validation error'
  );

  const emptyNames = validateAndNormalizeAiImportPayload({
    batchContext: { source: 'empty_names' },
    items: [
      { name: '   ', description: 'blank name one' },
      { name: '', description: 'blank name two' },
    ],
  });
  invariant(emptyNames.valid === false, 'Expected emptyNames.valid false');
  invariant(emptyNames.isImportable === false, 'Expected emptyNames.isImportable false');
  invariant(emptyNames.validCount === 0, 'Expected emptyNames.validCount 0');

  const defaultsCase = validateAndNormalizeAiImportPayload({
    batchContext: {
      location: null,
      box: null,
      source: '',
      itemCount: 1,
    },
    items: [
      {
        name: 'Mystery Item',
        description: null,
        category: 'not_a_real_category',
        tags: 'not-an-array',
        quantity: 'not-a-number',
        confidence: 0.43,
      },
    ],
  });

  invariant(defaultsCase.valid === true, 'Expected defaultsCase.valid true');
  invariant(
    defaultsCase.normalizedBatchContext.source === AI_IMPORT_FALLBACK_SOURCE,
    'Expected fallback source when source is blank'
  );
  invariant(
    defaultsCase.normalizedItems[0].description === '',
    'Expected null description to normalize to empty string'
  );
  invariant(
    defaultsCase.normalizedItems[0].category === 'miscellaneous',
    'Expected invalid category to default to miscellaneous'
  );
  invariant(
    Array.isArray(defaultsCase.normalizedItems[0].tags) &&
      defaultsCase.normalizedItems[0].tags.length === 0,
    'Expected invalid tags to default to []'
  );
  invariant(
    defaultsCase.normalizedItems[0].quantity === 1,
    'Expected invalid quantity to default to 1'
  );

  const mixedValidity = validateAndNormalizeAiImportPayload({
    batchContext: {
      source: 'mixed_validity',
      itemCount: 2,
    },
    items: [
      {
        name: 'Good Item',
        description: 'valid row',
      },
      {
        name: '   ',
        description: 'invalid row',
      },
    ],
  });

  invariant(mixedValidity.valid === false, 'Expected mixedValidity.valid false');
  invariant(mixedValidity.isImportable === true, 'Expected mixedValidity.isImportable true');
  invariant(mixedValidity.validCount === 1, 'Expected mixedValidity.validCount 1');
  invariant(mixedValidity.failedCount === 1, 'Expected mixedValidity.failedCount 1');

  console.log('✅ AI JSON import validation tests passed');
}

run();
