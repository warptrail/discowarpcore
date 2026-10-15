import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBoxFieldPatch, getBoxFieldDraft } from '../frontend/src/components/OperationsQuickPeek/operationsBoxFields.js';

test('field saves patch only the selected field and keep box numbers as strings', () => {
  assert.deepEqual(buildBoxFieldPatch('box_id', '007'), { box_id: '007' });
  assert.deepEqual(buildBoxFieldPatch('label', ' New name '), { label: 'New name' });
  assert.deepEqual(buildBoxFieldPatch('notes', 'Line one\nLine two'), { notes: 'Line one\nLine two' });
  assert.deepEqual(buildBoxFieldPatch('description', ''), { description: '' });
});
test('invalid identities and accidental nontext writes are rejected', () => {
  for (const id of ['7', '0007', 'abc']) assert.throws(() => buildBoxFieldPatch('box_id', id));
  assert.throws(() => buildBoxFieldPatch('label', '  '), /Name is required/);
  for (const field of ['locationId', 'photo', 'parentBox', 'items', 'compartments']) {
    assert.throws(() => buildBoxFieldPatch(field, ''), /Unsupported/);
  }
});
test('tags round trip and saves trim, deduplicate and clear without changing other fields', () => {
  assert.equal(getBoxFieldDraft({ tags: ['art', 'crafts'] }, 'tags'), 'art, crafts');
  assert.deepEqual(buildBoxFieldPatch('tags', ' art, crafts,art, ,'), { tags: ['art', 'crafts'] });
  assert.deepEqual(buildBoxFieldPatch('tags', ''), { tags: [] });
  assert.equal(getBoxFieldDraft({}, 'notes'), '');
});

test('box API sends selected-field patches and surfaces a rejected save', async () => {
  // Bundle the frontend's extensionless imports just as Vite does, without a server.
  const { createRequire } = await import('node:module');
  const frontendRequire = createRequire(new URL('../frontend/package.json', import.meta.url));
  const { outputFiles } = await frontendRequire('esbuild').build({
    entryPoints: [new URL('../frontend/src/api/boxes.js', import.meta.url).pathname],
    bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('module', 'exports', outputFiles[0].text)(module, module.exports);
  const { updateBoxDetails } = module.exports;
  const originalFetch = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url, method: options.method, body: JSON.parse(options.body) });
      return { ok: true, json: async () => ({ ok: true, box: { _id: 'box-mongo-id', label: 'Renamed' } }) };
    };
    const updated = await updateBoxDetails('box-mongo-id', buildBoxFieldPatch('label', 'Renamed'));
    assert.equal(updated.label, 'Renamed');
    assert.deepEqual(calls, [{ url: '/api/boxes/box-mongo-id', method: 'PATCH', body: { label: 'Renamed' } }]);
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'Box ID is already in use' }) });
    await assert.rejects(updateBoxDetails('box-mongo-id', { box_id: '007' }), /Box ID is already in use/);
  } finally { globalThis.fetch = originalFetch; }
});
