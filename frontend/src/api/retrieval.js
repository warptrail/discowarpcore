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
    categories = [],
    tags = [],
    tagOperator = 'or',
    locations = [],
    owners = [],
    keepPriorities = [],
    sort = '',
    limit = DEFAULT_RETRIEVAL_LIMIT,
    offset = 0,
  },
  { signal } = {}
) {
  const params = new URLSearchParams();
  const query = String(q || '').trim();
  if (query) params.set('q', query);

  appendCsvParam(params, 'category', categories);
  appendCsvParam(params, 'tag', tags);
  if (tags.length > 1 && tagOperator === 'and') params.set('tagOperator', 'and');
  appendCsvParam(params, 'location', locations);
  appendCsvParam(params, 'owner', owners);
  appendCsvParam(params, 'keepPriority', keepPriorities);
  if (String(sort || '').trim()) params.set('sort', String(sort).trim());

  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const response = await fetch(`${API_BASE}/api/retrieval/items?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch retrieval items (${response.status})`);
  }

  return response.json();
}

export async function fetchRetrievalBoxesPage(
  {
    q = '',
    boxIdPrefix = '',
    groups = [],
    tags = [],
    tagOperator = 'or',
    locations = [],
    sort = '',
    limit = DEFAULT_RETRIEVAL_LIMIT,
    offset = 0,
  },
  { signal } = {}
) {
  const params = new URLSearchParams();
  const query = String(q || '').trim();
  if (query) params.set('q', query);
  const normalizedBoxIdPrefix = String(boxIdPrefix || '').replace(/\D/g, '').slice(0, 3);
  if (normalizedBoxIdPrefix) params.set('boxPrefix', normalizedBoxIdPrefix);

  appendCsvParam(params, 'group', groups);
  appendCsvParam(params, 'tag', tags);
  if (tags.length > 1 && tagOperator === 'and') params.set('tagOperator', 'and');
  appendCsvParam(params, 'location', locations);
  if (String(sort || '').trim()) params.set('sort', String(sort).trim());
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const response = await fetch(`${API_BASE}/api/retrieval/boxes?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch retrieval boxes (${response.status})`);
  }

  return response.json();
}
