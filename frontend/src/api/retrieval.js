import { normalizeBoxAddress } from '../util/boxAddress';
import { API_BASE } from './API_BASE';

export const DEFAULT_RETRIEVAL_LIMIT = 25;

function appendCsvParam(params, key, values) {
  const safeValues = Array.isArray(values)
    ? values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    : [];

  if (!safeValues.length) return;
  params.set(key, safeValues.join(','));
}

export async function fetchRetrievalItemsPage(
  {
    q = '',
    addressScope = '',
    categories = [],
    tags = [],
    exactTag,
    tagOperator = 'or',
    locations = [],
    owners = [],
    keepPriorities = [],
    sort = '',
    shuffleSeed = '',
    limit = DEFAULT_RETRIEVAL_LIMIT,
    offset = 0,
  },
  { signal } = {}
) {
  const params = new URLSearchParams();
  const query = String(q || '').trim();
  if (query) params.set('q', query);
  if (addressScope) params.set('addressScope', normalizeBoxAddress(addressScope));

  appendCsvParam(params, 'category', categories);
  appendCsvParam(params, 'tag', tags);
  if (exactTag) (Array.isArray(exactTag) ? exactTag : [exactTag]).forEach(tag => params.append('exactTag', tag));
  if (tags.length > 1 && tagOperator === 'and') params.set('tagOperator', 'and');
  appendCsvParam(params, 'location', locations);
  appendCsvParam(params, 'owner', owners);
  appendCsvParam(params, 'keepPriority', keepPriorities);
  if (String(sort || '').trim()) params.set('sort', String(sort).trim());
  if (sort === 'random' && shuffleSeed) params.set('shuffleSeed', String(shuffleSeed).slice(0, 96));

  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const response = await fetch(`${API_BASE}/api/retrieval/items?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    throw new Error(failure.error?.message || failure.error || failure.message || `Failed to fetch retrieval items (${response.status})`);
  }

  return response.json();
}

export async function fetchRetrievalBoxesPage(
  {
    q = '',
    addressScope = '',
    boxIdPrefix = '',
    includeCabinets = false,
    tags = [],
    exactTag,
    tagOperator = 'or',
    tagSource,
    locations = [],
    rooms = [],
    sort = '',
    shuffleSeed = '',
    limit = DEFAULT_RETRIEVAL_LIMIT,
    offset = 0,
  },
  { signal } = {}
) {
  const params = new URLSearchParams();
  const query = String(q || '').trim();
  if (query) params.set('q', query);
  if (addressScope) params.set('addressScope', normalizeBoxAddress(addressScope));
  const scope = normalizeBoxAddress(addressScope || boxIdPrefix);
  if (scope) params.set('addressScope', scope);
  if (includeCabinets) params.set('includeCabinets', 'true');

  appendCsvParam(params, 'tag', tags);
  if (exactTag) (Array.isArray(exactTag) ? exactTag : [exactTag]).forEach(tag => params.append('exactTag', tag));
  if (tagSource === 'box') params.set('tagSource', 'box');
  if (tags.length > 1 && tagOperator === 'and') params.set('tagOperator', 'and');
  appendCsvParam(params, 'location', locations);
  appendCsvParam(params, 'room', rooms);
  if (String(sort || '').trim()) params.set('sort', String(sort).trim());
  if (sort === 'random' && shuffleSeed) params.set('shuffleSeed', String(shuffleSeed).slice(0, 96));
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const response = await fetch(`${API_BASE}/api/retrieval/boxes?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    throw new Error(failure.error?.message || failure.error || failure.message || `Failed to fetch retrieval boxes (${response.status})`);
  }

  return response.json();
}
