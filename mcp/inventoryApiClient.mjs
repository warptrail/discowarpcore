const DEFAULT_API_BASE = 'http://127.0.0.1:7610/api';
const DEFAULT_TIMEOUT_MS = 10_000;

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

export function normalizeApiBase(value = DEFAULT_API_BASE) {
  const raw = toTrimmed(value).replace(/\/+$/, '');
  if (!raw) {
    throw new Error('DISCO_API_BASE must be a non-empty HTTP(S) URL');
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`DISCO_API_BASE is not a valid URL: ${raw}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`DISCO_API_BASE must use http or https: ${raw}`);
  }

  return parsed.toString().replace(/\/+$/, '');
}

function appendQuery(url, query = {}) {
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '') continue;

    const values = Array.isArray(value) ? value : [value];
    for (const entry of values) {
      if (entry == null || entry === '') continue;
      url.searchParams.append(key, String(entry));
    }
  }
}

function pathSegment(value, fieldName) {
  const normalized = toTrimmed(value);
  if (!normalized) throw new Error(`${fieldName} is required`);
  return encodeURIComponent(normalized);
}

export class InventoryApiError extends Error {
  constructor(message, { status = 0, method = 'GET', path = '', body = null } = {}) {
    super(message);
    this.name = 'InventoryApiError';
    this.status = status;
    this.method = method;
    this.path = path;
    this.body = body;
  }
}

export function createInventoryApiClient({
  baseUrl = process.env.DISCO_API_BASE || DEFAULT_API_BASE,
  fetchImpl = globalThis.fetch,
  timeoutMs = Number.parseInt(process.env.DISCO_MCP_TIMEOUT_MS || '', 10) || DEFAULT_TIMEOUT_MS,
} = {}) {
  const apiBase = normalizeApiBase(baseUrl);

  if (typeof fetchImpl !== 'function') {
    throw new Error('The inventory MCP requires a runtime with global fetch support');
  }

  async function request(path, { query = {}, method = 'GET' } = {}) {
    const url = new URL(`${apiBase}${path}`);
    appendQuery(url, query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new InventoryApiError(
          `Inventory API request timed out after ${timeoutMs}ms`,
          { method, path }
        );
      }
      throw new InventoryApiError(
        `Inventory API request failed: ${error?.message || String(error)}`,
        { method, path }
      );
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers?.get?.('content-type') || '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const detail = typeof body === 'string' ? body : body?.error || body?.message;
      throw new InventoryApiError(
        `Inventory API returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`,
        { status: response.status, method, path, body }
      );
    }

    return body;
  }

  return {
    getHealth() {
      return request('/health');
    },

    searchItems({
      q,
      category,
      tag,
      tagOperator,
      location,
      owner,
      keepPriority,
      sort,
      limit,
      offset,
    } = {}) {
      return request('/retrieval/items', {
        query: {
          q,
          category,
          tag,
          tagOperator,
          location,
          owner,
          keepPriority,
          sort,
          limit,
          offset,
        },
      });
    },

    searchBoxes({ q, group, location, limit, offset } = {}) {
      return request('/retrieval/boxes', {
        query: { q, group, location, limit, offset },
      });
    },

    getItem(itemId) {
      return request(`/items/${pathSegment(itemId, 'item_id')}`);
    },

    getBox({ shortId, includeAncestors = true, includeStats = true, flat = 'items' } = {}) {
      return request(`/boxes/by-short-id/${pathSegment(shortId, 'short_id')}`, {
        query: {
          ancestors: includeAncestors ? '1' : '0',
          stats: includeStats ? '1' : '0',
          flat,
        },
      });
    },

    listLocations() {
      return request('/locations');
    },
  };
}

