export function sanitizeRetrievalPresentation(value) {
  return value === 'compact' || value === 'ascii' ? value : 'cards';
}

export function getVisibleRetrievalPresentation(value, { desktop = false } = {}) {
  const presentation = sanitizeRetrievalPresentation(value);
  if (desktop) return presentation;
  // Phones have one card size plus Terminal, even when desktop prefers small cards.
  return presentation === 'ascii' ? 'ascii' : 'cards';
}
