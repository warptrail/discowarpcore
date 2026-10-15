const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const req = createRequire(path.join(frontend, 'package.json'));
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
async function load() {
  const { outputFiles } = await req('esbuild').build({
    entryPoints: [path.join(frontend, 'src/components/OperationsInventory/OperationsTreeInspector.jsx')],
    bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
    external: ['react', 'react-dom', 'styled-components'], logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)(
    id => id === 'styled-components' ? Object.assign(req(id).default, req(id)) : req(id), module, module.exports);
  return module.exports.TreeNode;
}
const node = { _id: 'root', box_id: '104', label: 'Scented Objects', items: [{ quantity: 2 }], childBoxes: [
  { _id: 'child', box_id: '119', label: 'Hair Dye Kit', items: [{ quantity: 4 }], childBoxes: [
    { _id: 'grandchild', box_id: '120', label: 'Accessories', items: [], childBoxes: [] },
  ] },
] };
async function render(expandedKeys = new Set(), isSearchExpanded = () => false) {
  const TreeNode = await load();
  return renderToStaticMarkup(React.createElement(TreeNode, { node, root: true, expandedKeys, isSearchExpanded, onToggle() {}, onInspect() {} }));
}
test('tree shows parent and direct children with usable names and quantities, keeping deeper branches collapsed', async () => {
  const html = await render();
  assert.ok(html.includes('Inspect box 104, Scented Objects'));
  assert.ok(html.includes('Inspect box 119, Hair Dye Kit'));
  assert.ok(html.includes('4 items'));
  assert.ok(html.includes('Expand nested boxes in 119'));
  assert.ok(!html.includes('Inspect box 120'));
});
test('manual descendant expansion exposes the real subtree with explicit child list relationships', async () => {
  const html = await render(new Set(['child']));
  assert.ok(html.includes('Inspect box 120, Accessories'));
  assert.ok(html.includes('Collapse nested boxes in 119'));
  assert.ok(html.includes('aria-controls="inspector-children-child"'));
  assert.ok(html.includes('id="inspector-children-child"'));
});
test('search reveals matching paths without mutating manual expansion state', async () => {
  const manual = new Set();
  const html = await render(manual, box => box._id === 'child');
  assert.ok(html.includes('Inspect box 120, Accessories'));
  assert.ok(html.includes('disabled=""'));
  assert.equal(manual.size, 0);
  assert.ok(!(await render(manual)).includes('Inspect box 120'));
});
