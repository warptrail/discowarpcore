import { normalizeTagName } from '../../util/tagNavigation';

export function addQuickPeekTag(tags, value) {
  const tag = normalizeTagName(value);
  if (!tag || tags.some(existing => normalizeTagName(existing) === tag)) return null;
  return [...tags, tag];
}
export function removeQuickPeekTag(tags, value) {
  return tags.filter(tag => normalizeTagName(tag) !== normalizeTagName(value));
}
export function quickPeekTagRows(description) {
  return String(description || '').trim().length <= 160 ? 2 : 1;
}
