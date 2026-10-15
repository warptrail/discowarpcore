export function normalizeTagName(value) {
  return String(value?.value ?? value ?? '').trim().replace(/^#+/, '').trim().toLowerCase().replace(/\s+/g, ' ');
}
export function getTagHref(value) {
  const tag = normalizeTagName(value);
  return tag ? `/tag/${encodeURIComponent(tag)}` : '/retrieval';
}
