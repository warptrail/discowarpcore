export function getSearchTerms(query = '') {
  return [...new Set(String(query).trim().toLowerCase().split(/\s+/).filter(Boolean))];
}

// Literal matching, not a RegExp or HTML replacement: user text stays plain text.
export function splitSearchHighlights(text, terms = []) {
  const value = String(text ?? '');
  const needles = terms.map((term) => String(term).toLowerCase()).filter(Boolean);
  const lower = value.toLowerCase();
  const parts = [];
  let cursor = 0;
  while (cursor < value.length) {
    const hit = needles.map((term) => ({ index: lower.indexOf(term, cursor), term }))
      .filter(({ index }) => index >= 0)
      .sort((a, b) => a.index - b.index || b.term.length - a.term.length)[0];
    if (!hit) { parts.push({ text: value.slice(cursor), match: false }); break; }
    if (hit.index > cursor) parts.push({ text: value.slice(cursor, hit.index), match: false });
    parts.push({ text: value.slice(hit.index, hit.index + hit.term.length), match: true });
    cursor = hit.index + hit.term.length;
  }
  return parts;
}

export function getSearchExcerpt(text, terms, { length = 220, context = 60 } = {}) {
  const value = String(text ?? '');
  const positions = terms.filter(Boolean).map((term) => value.toLowerCase().indexOf(term)).filter((index) => index >= 0);
  const first = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, first - context);
  const end = Math.min(value.length, Math.max(start + length, first + Math.max(0, ...terms.map((term) => term.length))));
  return `${start ? '…' : ''}${value.slice(start, end)}${end < value.length ? '…' : ''}`;
}
