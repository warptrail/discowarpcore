import { getSearchTerms } from '../../util/searchHighlight.js';

// Explain hidden matches without dumping every metadata field into a small card.
export function getAnswerMatchFields(answer, query) {
  const terms = getSearchTerms(query);
  const item = answer.item || {};
  const box = answer.box || {};
  return [
    ['Tags', Array.isArray(item.tags) ? item.tags.join(', ') : ''],
    ['Description', item.description], ['Notes', item.notes], ['Category', item.category],
    ['Label', item.label !== answer.name ? item.label : ''],
    ['Owner', item.primaryOwnerName], ['Keep priority', item.keepPriority],
    ['Item location', item.location && !answer.path.join(' › ').includes(item.location) ? item.location : ''],
    ['Box tags', Array.isArray(box.tags) ? box.tags.join(', ') : ''],
    ['Box description', box.description], ['Box notes', box.notes],
  ].filter(([, value]) => value && terms.some((term) => String(value).toLowerCase().includes(term)))
    .map(([label, value]) => ({ label, value: String(value) }));
}
