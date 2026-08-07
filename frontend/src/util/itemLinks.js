const LINK_LABEL_MAX_LENGTH = 80;

function normalizeLinksForForm(links) {
  if (!Array.isArray(links)) return [];

  return links
    .map((row) => ({
      label: String(row?.label || '').trim(),
      url: String(row?.url || '').trim(),
    }))
    .filter((row) => row.label || row.url);
}

function isValidExternalUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeLinksForSave(links) {
  if (!Array.isArray(links)) return [];

  const normalized = [];
  for (let index = 0; index < links.length; index += 1) {
    const row = links[index];
    const label = String(row?.label || '').trim();
    const url = String(row?.url || '').trim();

    if (!label && !url) continue;
    if (!label) throw new Error(`Link ${index + 1}: label is required.`);
    if (label.length > LINK_LABEL_MAX_LENGTH) {
      throw new Error(
        `Link ${index + 1}: label must be ${LINK_LABEL_MAX_LENGTH} characters or fewer.`,
      );
    }
    if (!url) throw new Error(`Link ${index + 1}: url is required.`);
    if (!isValidExternalUrl(url)) {
      throw new Error(
        `Link ${index + 1}: url must be a valid http/https URL.`,
      );
    }

    normalized.push({ label, url });
  }

  return normalized;
}

export {
  LINK_LABEL_MAX_LENGTH,
  isValidExternalUrl,
  normalizeLinksForForm,
  sanitizeLinksForSave,
};
