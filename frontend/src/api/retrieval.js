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
    locations = [],
    owners = [],
    keepPriorities = [],
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
  appendCsvParam(params, 'location', locations);
  appendCsvParam(params, 'owner', owners);
  appendCsvParam(params, 'keepPriority', keepPriorities);

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
    groups = [],
    locations = [],
    limit = DEFAULT_RETRIEVAL_LIMIT,
    offset = 0,
  },
  { signal } = {}
) {
  const params = new URLSearchParams();
  const query = String(q || '').trim();
  if (query) params.set('q', query);

  appendCsvParam(params, 'group', groups);
  appendCsvParam(params, 'location', locations);
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
