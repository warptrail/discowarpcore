const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
let saveLocation;
let updateBox;
test.before(async () => {
  const { outputFiles } = await requireFrontend('esbuild').build({
    stdin: { contents: `export * from './components/Retrieval/retrievalBoxLocationModel';
      export { updateBoxDetails } from './api/boxes';`, resolveDir: path.join(frontend, 'src') },
    bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('module', 'exports', outputFiles[0].text)(module, module.exports);
  saveLocation = module.exports.saveRetrievalBoxLocation;
  updateBox = module.exports.updateBoxDetails;
});

test('overview location save resolves a path and patches only the owning box assignment', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  const box = { _id: 'box-record', box_id: '001', label: 'Drawer' };
  global.fetch = async (url, options) => {
    calls.push({ url, method: options.method, payload: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ box: { ...box, locationId: 'saved-path' } }) };
  };
  try {
    let resolved;
    const updated = await saveLocation(box, { room: ' Office ', vicinity: ' Main   shelf ' }, {
      resolveLocation: async (draft) => { resolved = draft; return { _id: 'saved-path' }; }, updateBox,
    });
    assert.deepEqual(resolved, { room: 'Office', vicinity: 'Main shelf', specifics: '', exactSpot: '' });
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/api\/boxes\/box-record$/);
    assert.equal(calls[0].method, 'PATCH');
    assert.deepEqual(calls[0].payload, { locationId: 'saved-path' });
    assert.equal(updated.label, 'Drawer');
  } finally { global.fetch = originalFetch; }
});

test('clearing a box location sends null and does not create a location', async () => {
  const calls = [];
  await saveLocation({ _id: 'box' }, {}, {
    resolveLocation: () => assert.fail('Empty paths must not create registry entries'),
    updateBox: async (id, patch) => { calls.push({ id, patch }); return {}; },
  });
  assert.deepEqual(calls, [{ id: 'box', patch: { locationId: null } }]);
});

test('invalid hierarchy and missing box identity cannot write or create paths', async () => {
  const dependencies = { resolveLocation: () => assert.fail('Must validate first'), updateBox: () => assert.fail('Must validate first') };
  await assert.rejects(saveLocation({ _id: 'box' }, { room: 'Office', specifics: 'Shelf' }, dependencies), /Complete each/);
  await assert.rejects(saveLocation({ _id: 'box' }, { vicinity: 'Closet' }, dependencies), /Complete each/);
  await assert.rejects(saveLocation({}, { room: 'Office' }, dependencies), /unavailable/);
});

test('location resolution and box save errors remain failures for the draft controller', async () => {
  await assert.rejects(saveLocation({ _id: 'box' }, { room: 'Office' }, {
    resolveLocation: async () => { throw new Error('Registry unavailable'); }, updateBox: () => assert.fail('No unresolved patch'),
  }), /Registry unavailable/);
  await assert.rejects(saveLocation({ _id: 'box' }, { room: 'Office' }, {
    resolveLocation: async () => ({ _id: 'path' }), updateBox: async () => { throw new Error('Box save failed'); },
  }), /Box save failed/);
});
