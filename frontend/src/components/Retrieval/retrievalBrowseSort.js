import { hasRetrievalFinderFilters } from './retrievalFinderCue.js';

export function createRetrievalShuffleSeed() {
  const crypto = globalThis.crypto;
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  // HTTP LAN pages can expose random values without the secure-context UUID API.
  if (typeof crypto?.getRandomValues === 'function') {
    const values = crypto.getRandomValues(new Uint32Array(4));
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('');
  }
  // This seed controls display order only; it is not a security token.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function initialBrowseSort(filters, defaultSort) {
  return hasRetrievalFinderFilters(filters) ? defaultSort : 'random';
}

export function sortAfterFilterChange(currentSort, filters, defaultSort) {
  // Clearing filters doesn't unexpectedly shuffle a list being examined.
  return hasRetrievalFinderFilters(filters) ? defaultSort : currentSort;
}

export function sortAfterFieldClick(currentSort, field) {
  const base = String(currentSort || '').replace(/_desc$/, '');
  if (base === field) return 'random';
  return `${field}${String(currentSort || '').endsWith('_desc') ? '_desc' : ''}`;
}
