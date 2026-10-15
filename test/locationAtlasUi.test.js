const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const { ServerStyleSheet } = requireFrontend('styled-components');
async function load(file) {
  const { outputFiles } = await requireFrontend('esbuild').build({ entryPoints: [path.join(frontend, 'src', file)], bundle: true, write: false, format: 'cjs', platform: 'node', mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react-router-dom', 'styled-components'], loader: { '.webp': 'dataurl' }, jsx: 'automatic', logLevel: 'silent' });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)((id) => id === 'styled-components' ? Object.assign(requireFrontend(id).default, requireFrontend(id)) : requireFrontend(id), module, module.exports);
  return module.exports;
}
function render(Component, props) {
  const sheet = new ServerStyleSheet();
  try { return { html: renderToStaticMarkup(sheet.collectStyles(React.createElement(Component, props))), css: sheet.getStyleTags() }; }
  finally { sheet.seal(); }
}
const locations = [{ _id: 'a', room: 'Garage', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Behind blue bin' }, { _id: 'b', room: 'Office' }];

test('atlas starts with readable branch exploration and preserves the diagram, scope and export actions', async () => {
  const { default: Atlas } = await load('components/Location/LocationHierarchyChart.jsx');
  const { html, css } = render(Atlas, { locations, scope: {} });
  assert.ok(html.includes('role="region" aria-label="House location branches" tabindex="0"'));
  assert.ok(html.includes('Behind blue bin') && html.includes('Focus Garage branch'));
  assert.ok(html.includes('Branches') && html.includes('Diagram') && html.includes('Download Mermaid'));
  assert.ok(html.includes('aria-controls=') && html.includes('aria-labelledby='));
  assert.ok(css.includes('height:clamp(500px, 68dvh, 840px)'));
  assert.ok(!html.includes('location-chart-'));
});

test('branch labels render as literal text, with no invented nodes or script markup', async () => {
  const { default: Explorer } = await load('components/Location/LocationBranchExplorer.jsx');
  const { html } = render(Explorer, { locations: [{ room: '<script>bad()</script>', vicinity: 'Shelf & tools' }] });
  assert.ok(html.includes('&lt;script&gt;bad()&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<small>Specifics</small>'));
  assert.ok(!html.includes('<small>Exact Spot</small>'));
});

test('branch nodes expose quiet name editing and one contextual actions trigger per tier', async () => {
  const { default: Explorer } = await load('components/Location/LocationBranchExplorer.jsx');
  const { html } = render(Explorer, { locations, editor: { editing: null, begin() {} }, onDelete() {}, onEditPath() {} });
  assert.ok(html.includes('Rename room Garage') && html.includes('Rename exact spot Garage'));
  assert.equal((html.match(/aria-expanded="false"/g) || []).length, 5);
  assert.ok(!html.includes('Delete branch') && !html.includes('Add vicinity under'));
});

test('a filtered parent confirms all saved descendant paths instead of silently changing its scope', async () => {
  const { default: Node } = await load('components/Location/LocationBranchNode.jsx');
  const { buildLocationBranches } = await load('components/Location/locationHierarchy.js');
  const room = buildLocationBranches([locations[0]])[0];
  const allLocations = [locations[0], { ...locations[0], _id: 'c', specifics: 'Bottom', exactSpot: '' }];
  const { html } = render(Node, { node: room, locations: [locations[0]], allLocations, openMenu: room.key,
    editor: { editing: null, begin() {} }, onMenu() {}, onDelete() {}, onEditPath() {} });
  assert.ok(html.includes('Delete · 2 paths'));
  assert.ok(!html.includes('Edit full path Garage'));
});

test('the console pins the full scope, ancestor navigation, counts and Search/Add actions', async () => {
  const { default: Console } = await load('components/Location/LocationConsole.jsx');
  const { html, css } = render(Console, { shown: 1, total: 2, scope: locations[0] });
  assert.ok(html.includes('1 / 2 paths'));
  assert.ok(html.includes('Show whole house'));
  assert.ok(html.includes('House › Garage › Shelf › Top › Behind blue bin'));
  assert.ok(html.includes('Show Garage room branch') && html.includes('Show Shelf vicinity branch'));
  assert.ok(html.includes('Search locations') && html.includes('Add location'));
  assert.ok(!html.includes('Open item finder'));
  assert.ok(css.includes('height:48px'));
});

test('map and saved-list controls have one owner in the header console', async () => {
  const { default: Atlas } = await load('components/Location/LocationHierarchyChart.jsx');
  const { default: List } = await load('components/Location/LocationList.jsx');
  const atlas = render(Atlas, { locations }).html;
  const list = render(List, { locations }).html;
  assert.ok(!atlas.includes('Filter location branches') && !atlas.includes('Current map scope'));
  assert.ok(!list.includes('type="search"'));
  assert.ok(list.includes('Edit Garage') && list.includes('Delete Garage'));
});

test('location search matches literal keywords across all four recorded tiers', async () => {
  const { findLocationPaths } = await load('components/Location/locationSearch.js');
  assert.deepEqual(findLocationPaths(locations, 'BLUE garage'), [locations[0]]);
  assert.deepEqual(findLocationPaths(locations, ' shelf  TOP '), [locations[0]]);
  assert.deepEqual(findLocationPaths(locations, 'garage office'), []);
  assert.deepEqual(findLocationPaths(locations, '.*'), []);
  assert.deepEqual(findLocationPaths(locations, ' '), locations);
});

test('location editor retains four-tier prerequisites, suggestions and explicit save/cancel controls', async () => {
  const { default: Editor } = await load('components/Location/LocationEditor.jsx');
  const { html } = render(Editor, { locations, draft: { room: 'Garage', vicinity: 'Shelf', specifics: '', exactSpot: '' }, editingId: 'a', embedded: true });
  assert.ok(html.includes('id="location-room"') && html.includes('required=""'));
  assert.ok(/id="location-exactSpot"[^>]*disabled=""/.test(html));
  assert.ok(html.includes('value="Top"'));
  assert.ok(html.includes('Save location') && html.includes('Cancel edit'));
  assert.ok(!html.includes('<h2>'));
});
