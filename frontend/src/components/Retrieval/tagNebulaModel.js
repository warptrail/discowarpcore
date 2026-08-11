function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function scoreFuzzyMatch(label, query) {
  const source = normalize(label);
  const needle = normalize(query);
  if (!source || !needle) return null;
  if (source === needle) return 0;
  if (source.startsWith(needle)) return 10 + source.length - needle.length;

  const wordIndex = source.split(/\s+/).findIndex((word) => word.startsWith(needle));
  if (wordIndex >= 0) return 30 + wordIndex * 4 + source.length - needle.length;

  const substringIndex = source.indexOf(needle);
  if (substringIndex >= 0) return 60 + substringIndex * 3 + source.length - needle.length;

  let sourceIndex = 0;
  let firstMatch = -1;
  let previousMatch = -1;
  let gapPenalty = 0;

  for (const character of needle) {
    const matchIndex = source.indexOf(character, sourceIndex);
    if (matchIndex < 0) return null;
    if (firstMatch < 0) firstMatch = matchIndex;
    if (previousMatch >= 0) gapPenalty += matchIndex - previousMatch - 1;
    previousMatch = matchIndex;
    sourceIndex = matchIndex + 1;
  }

  return 100 + firstMatch * 3 + gapPenalty * 5 + source.length - needle.length;
}

export function rankTagOptions(options, query, selectedKeys = [], limit = 10) {
  const selected = new Set((Array.isArray(selectedKeys) ? selectedKeys : []).map(normalize));
  const needle = normalize(query);
  if (!needle) return [];

  return (Array.isArray(options) ? options : [])
    .map((option) => {
      const key = normalize(option?.key);
      const label = String(option?.label || option?.key || '').trim();
      if (!key || !label || selected.has(key)) return null;
      const score = Math.min(
        scoreFuzzyMatch(label, needle) ?? Number.POSITIVE_INFINITY,
        scoreFuzzyMatch(key, needle) ?? Number.POSITIVE_INFINITY,
      );
      return Number.isFinite(score) ? { ...option, key, label, score } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.score - right.score || left.label.localeCompare(right.label))
    .slice(0, limit);
}
