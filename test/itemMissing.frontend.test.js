const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const { MemoryRouter } = requireFrontend('react-router-dom');
let loaded;
async function components() {
  if (loaded) return loaded;
  const { outputFiles } = await requireFrontend('esbuild').build({
    stdin: { contents: `export { default as Status } from './components/MissingItems/MissingStatus';
      export { default as Actions } from './components/MissingItems/MissingActions';
      export { default as Alert } from './components/MissingItems/MissingAlertLink';
      export { default as BoxStatus } from './components/MissingItems/MissingBoxStatus';
      export { MissingItemsContext } from './components/MissingItems/MissingItemsContext';
      export { normalizeRetrievalItemsPage, normalizeRetrievalBoxesPage } from './components/Retrieval/retrievalModel';`,
      resolveDir: path.join(frontend, 'src'), loader: 'jsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
    external: ['react', 'react-dom', 'react-router-dom', 'styled-components'],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)(id => id === 'styled-components' ? Object.assign(requireFrontend(id).default, requireFrontend(id)) : requireFrontend(id), module, module.exports);
  loaded = module.exports; return loaded;
}
async function render(component, props, value = {}, route = '/operations') {
  const exports = await components();
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] },
    React.createElement(exports.MissingItemsContext.Provider, { value: { states: {}, items: [], summary: { records: 0, objects: 0 }, ...value } },
      React.createElement(exports[component], props))));
}
test('shared badges show missing quantities and an authoritative cleared flag overrides stale inventory', async () => {
  const item = { _id: 'one', quantity: 4, missing: { quantity: 2 } };
  assert.match(await render('Status', { item, home: true }), /2 of 4 missing · Recorded home/);
  assert.match(await render('Status', { item: { ...item, quantity: 1, missing: { quantity: 1 } } }), />Missing</);
  assert.equal(await render('Status', { item }, { states: { one: { missing: { quantity: 0 } } } }), '');
  assert.equal(await render('Status', { item: { ...item, item_status: 'gone' } }), '');
});
test('shared actions distinguish report, recovery and correction and suppress departed items', async () => {
  const item = { _id: 'one', name: 'Flashlight', quantity: 4 };
  assert.match(await render('Actions', { item }), /Mark missing/);
  const html = await render('Actions', { item }, { states: { one: { missing: { quantity: 2 } } } });
  for (const label of ['Found', 'Update missing count', 'Correct report']) assert.ok(html.includes(label));
  assert.equal(await render('Actions', { item: { ...item, item_status: 'gone' } }), '');
});
test('quiet alert preserves Operations search, clears stale peek and reports both count grains', async () => {
  const summary = { records: 1, objects: 2 };
  const html = await render('Alert', {}, { summary }, '/operations?q=flashlight&peek=043&item=one');
  assert.match(html, /1 item record, 2 objects missing/);
  const href = html.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&');
  const params = new URL(href, 'http://localhost').searchParams;
  assert.equal(params.get('q'), 'flashlight'); assert.equal(params.get('missing'), '1');
  assert.equal(params.has('peek'), false); assert.equal(params.has('item'), false);
  assert.equal(await render('Alert', {}, { summary: { records: 0, objects: 0 } }), '');
});
test('box indicators count directly contained affected records without counting descendants', async () => {
  const items = [{ _id: 'a', box: { _id: 'parent' } }, { _id: 'b', box: { _id: 'child' } }];
  const html = await render('BoxStatus', { box: { _id: 'parent' } }, { items, loading: false });
  assert.match(html, /1 item record missing/);
  assert.equal(await render('BoxStatus', { box: { _id: 'empty' } }, { items, loading: false }), '');
});
test('Retrieval normalization preserves missing state, inventory quantity and direct box counts', async () => {
  const { normalizeRetrievalItemsPage, normalizeRetrievalBoxesPage } = await components();
  const [item] = normalizeRetrievalItemsPage([{ id: 'one', name: 'Flashlight', quantity: 4, missing: { quantity: 2, revision: 3 } }]);
  assert.equal(item.quantity, 4); assert.equal(item.missing.quantity, 2); assert.equal(item.missing.revision, 3);
  const [box] = normalizeRetrievalBoxesPage([{ id: 'parent', boxId: '043', directItemCount: 4, directMissingCount: 1 }]);
  assert.equal(box.directMissingCount, 1); assert.equal(box.directItemCount, 4);
});

test('fresh server records supersede older cached missing state and inventory quantity', async () => {
  const item = { _id: 'one', quantity: 5, missing: { quantity: 3, revision: 4 }, updatedAt: '2026-10-13T02:00:00Z' };
  const stale = { states: { one: { quantity: 4, missing: { quantity: 0, revision: 3 }, updatedAt: '2026-10-13T01:00:00Z' } } };
  assert.match(await render('Status', { item }, stale), /3 of 5 missing/);
});
