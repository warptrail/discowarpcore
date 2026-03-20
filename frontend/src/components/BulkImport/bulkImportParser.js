export const BULK_IMPORT_ITEM_NAME_MAX_LENGTH = 160;

export function parseBulkImportText(rawText, maxLength = BULK_IMPORT_ITEM_NAME_MAX_LENGTH) {
  const text = String(rawText ?? '');
  const lines = text.split(/\r?\n/);

  const items = [];
  let ignoredBlankLines = 0;
  let truncatedLines = 0;

  for (const line of lines) {
    const trimmed = String(line || '').trim();
    if (!trimmed) {
      ignoredBlankLines += 1;
      continue;
    }

    let nextName = trimmed;
    if (nextName.length > maxLength) {
      nextName = nextName.slice(0, maxLength).trim();
      truncatedLines += 1;
    }

    if (!nextName) {
      ignoredBlankLines += 1;
      continue;
    }

    items.push(nextName);
  }

  return {
    items,
    totalLines: lines.length,
    ignoredBlankLines,
    truncatedLines,
    maxLength,
  };
}
