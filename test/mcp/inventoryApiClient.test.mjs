import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInventoryApiClient,
  InventoryApiError,
  normalizeApiBase,
} from '../../mcp/inventoryApiClient.mjs';

function jsonResponse(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return name === 'content-type' ? 'application/json' : '';
      },
    },
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}

test('normalizes and validates the configured API base', () => {
  assert.equal(
    normalizeApiBase('http://example.test/api///'),
    'http://example.test/api'
  );
  assert.throws(
    () => normalizeApiBase('not-a-url'),
    /not a valid URL/
  );
  assert.throws(
    () => normalizeApiBase('file:///tmp/inventory'),
    /must use http or https/
  );
});

test('searchItems sends retrieval filters through the API', async () => {
  const calls = [];
  const client = createInventoryApiClient({
    baseUrl: 'http://example.test/api/',
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return jsonResponse({ items: [], total: 0 });
    },
  });

  const result = await client.searchItems({
    q: 'camera cables',
    tag: 'hdmi,usb',
    tagOperator: 'and',
    limit: 10,
    offset: 20,
  });

  const parsedUrl = new URL(calls[0].url);
  assert.equal(parsedUrl.pathname, '/api/retrieval/items');
  assert.equal(parsedUrl.searchParams.get('q'), 'camera cables');
  assert.equal(parsedUrl.searchParams.get('tag'), 'hdmi,usb');
  assert.equal(parsedUrl.searchParams.get('tagOperator'), 'and');
  assert.equal(parsedUrl.searchParams.get('limit'), '10');
  assert.equal(parsedUrl.searchParams.get('offset'), '20');
  assert.equal(calls[0].options.method, 'GET');
  assert.deepEqual(result, { items: [], total: 0 });
});

test('getBox requests the short-id box endpoint with safe defaults', async () => {
  const calls = [];
  const client = createInventoryApiClient({
    baseUrl: 'http://example.test/api',
    fetchImpl: async (url) => {
      calls.push(String(url));
      return jsonResponse({ ok: true, box: { box_id: '123' } });
    },
  });

  await client.getBox({ shortId: '123' });

  const parsedUrl = new URL(calls[0]);
  assert.equal(parsedUrl.pathname, '/api/boxes/by-short-id/123');
  assert.equal(parsedUrl.searchParams.get('ancestors'), '1');
  assert.equal(parsedUrl.searchParams.get('stats'), '1');
  assert.equal(parsedUrl.searchParams.get('flat'), 'items');
});

test('surfaces API failures without hiding the status or response body', async () => {
  const client = createInventoryApiClient({
    baseUrl: 'http://example.test/api',
    fetchImpl: async () => jsonResponse({ error: 'No such item' }, { status: 404 }),
  });

  await assert.rejects(
    () => client.getItem('missing-id'),
    (error) => {
      assert.ok(error instanceof InventoryApiError);
      assert.equal(error.status, 404);
      assert.deepEqual(error.body, { error: 'No such item' });
      assert.match(error.message, /HTTP 404/);
      return true;
    }
  );
});

