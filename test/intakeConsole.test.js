const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const { MemoryRouter } = requireFrontend('react-router-dom');
const { ServerStyleSheet } = requireFrontend('styled-components');

async function load(file, exportName = 'default') {
  const { outputFiles } = await requireFrontend('esbuild').build({
    entryPoints: [path.join(frontend, 'src/components/Intake', file)],
    bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
    mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react-router-dom', 'styled-components'],
    loader: { '.csv': 'text' }, define: { 'import.meta.env': '{}' }, logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)((id) => id === 'styled-components'
    ? Object.assign(requireFrontend(id).default, requireFrontend(id)) : requireFrontend(id), module, module.exports);
  return module.exports[exportName];
}

function render(Component, props = {}) {
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToStaticMarkup(sheet.collectStyles(React.createElement(MemoryRouter, null,
      React.createElement(Component, props))));
    return { html, css: sheet.getStyleTags() };
  } finally { sheet.seal(); }
}

const box = { _id: 'synthetic-box', box_id: '091', label: 'Navigation equipment case', location: 'Garage' };
const draft = { version: 1, name: 'Synthetic draft item', quantity: 3, description: 'Quick Peek description',
  tags: ['draft'], notes: 'Preserve this note', category: 'electronics', mode: 'inBox', targetBoxId: box._id };

test('Intake navigation keeps all four labelled actions with quiet SVG active segments', async () => {
  const { html, css } = render(await load('IntakeWorkspaceTabs.jsx'), { activeView: 'organize', onChange() {} });
  for (const label of ['New item', 'Current box', 'Organize', 'Edit box']) assert.ok(html.includes(`<span>${label}</span>`));
  assert.equal((html.match(/<svg /g) || []).length, 4);
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
  assert.match(html, /id="intake-workspace-tab-organize"[^>]*aria-current="page"/);
  assert.match(css, /min-height:56px/);
  assert.match(css, /prefers-reduced-motion/);
});

test('full capture preserves Quick Peek draft, accessible name, quantity and boxed destination', async () => {
  const { html, css } = render(await load('IntakeQuickItemMaker.jsx'), {
    showTitle: false, initialDraft: draft, mode: 'inBox', targetBox: box, onChangeTargetBox() {},
  });
  assert.match(html, /for="new-item-name"[^>]*>Item name<\/label>/);
  assert.match(html, /id="new-item-name"[^>]*value="Synthetic draft item"/);
  assert.ok(html.includes('placeholder="Item name"'));
  assert.match(html, /id="new-item-quantity"[^>]*value="3"/);
  assert.ok(html.includes('Add to Navigation equipment case') && html.includes('#091'));
  assert.equal((html.match(/data-filled="true"/g) || []).length, 3);
  assert.ok(!html.includes('A new item enters') && !html.includes('Whatchya'));
  assert.match(css, /min-height:56px/);
  assert.match(css, /box-shadow:inset 0 2px 8px/);
  assert.match(css, /background:var\(--dw-cyan\)/);
  assert.match(css, /clip:rect\(0, 0, 0, 0\)/);
});

test('Adrift capture remains distinct from boxed capture and compact header variant is unchanged', async () => {
  const Maker = await load('IntakeQuickItemMaker.jsx');
  const adrift = render(Maker, { showTitle: false, initialDraft: draft }).html;
  assert.ok(adrift.includes('Items Adrift') && adrift.includes('Add to Items Adrift'));
  assert.ok(!adrift.includes('Navigation equipment case'));
  const compact = render(Maker, { compact: true, initialDraft: draft, onCancel() {} }).html;
  assert.ok(compact.includes('Cancel') && !compact.includes('Item capture'));
});

test('optional metadata retains labelled independent disclosures, busy protection and bounded notes', async () => {
  const { html } = render(await load('IntakeOptionalDetails.jsx'), { ...draft, tagDraft: '', disabled: true });
  for (const id of ['description', 'tags', 'notes']) assert.ok(html.includes(`aria-controls="new-item-${id}-panel"`));
  assert.equal((html.match(/disabled=""/g) || []).length, 4);
  assert.equal((html.match(/data-filled="true"/g) || []).length, 3);
  const textarea = render(await load('IntakeOptionalDetails.styles.js', 'TextArea'), { 'aria-label': 'Notes', defaultValue: 'Long note' });
  assert.match(textarea.css, /max-height:240px/);
  assert.match(textarea.css, /overflow-y:auto/);
});

test('item photo sources keep two pickers, with uncertain camera disabled and library available', async () => {
  const PhotoControl = await load('NewItemPhotoControl.jsx');
  const { html } = render(PhotoControl);
  assert.equal((html.match(/type="file"/g) || []).length, 2);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Take photo<\/button>/);
  assert.match(html, /<button(?![^>]*disabled=)[^>]*>Choose photo<\/button>/);
  assert.ok(!html.includes('Add photo') && !html.includes('capture="environment"'));
  const busy = render(PhotoControl, { disabled: true }).html;
  assert.equal((busy.match(/disabled=""/g) || []).length, 4, 'Both buttons and file inputs are protected');
  const selected = render(PhotoControl, { photoFile: { name: 'synthetic.jpg' }, previewUrl: '/synthetic-preview.jpg' }).html;
  assert.ok(selected.includes('alt="New item preview"') && selected.includes('Remove photo'));
  assert.ok(selected.includes('Process with Object Glow after adding'));
  assert.equal((selected.match(/type="file"/g) || []).length, 2);
});

test('current-box rail preserves Add, Change, Edit and explicit full navigation', async () => {
  const Actions = await load('IntakeDestinationActions.jsx');
  const { html, css } = render(Actions, { box });
  for (const label of ['Add item', 'Change', 'Edit']) assert.ok(html.includes(label));
  assert.ok(html.includes('href="/boxes/091"') && html.includes('Open full workspace for Navigation equipment case'));
  assert.match(css, /min-height:44px/);
  assert.ok(!css.includes('border-left:3px'));
  const choices = render(Actions, { box, chooseOpen: true }).html;
  assert.ok(choices.includes('Choose box') && choices.includes('Create box'));
  assert.ok(!choices.includes('href="/boxes/091"'));
});

test('box editor has a scoped console skin and retains all four location inputs and save/cancel', async () => {
  const { html, css } = render(await load('IntakeBoxEditorPanel.jsx'), { box });
  for (const label of ['Room', 'Vicinity', 'Specifics', 'Exact Spot', 'Save changes', 'Cancel']) assert.ok(html.includes(label));
  assert.ok(html.includes('Navigation equipment case'));
  assert.match(css, /grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /max-height:240px/);
  assert.match(css, /background:var\(--dw-cyan\)/);
  const empty = render(await load('IntakeBoxEditorPanel.jsx')).html;
  assert.ok(empty.includes('Choose current box') && !empty.includes('Save changes'));
});

test('routing scope retains its modal, labelled Close and pressed filter state', async () => {
  const { html, css } = render(await load('IntakeActivityFiltersSheet.jsx'), { open: true, onlyOrphanedItems: true });
  assert.ok(html.includes('role="dialog" aria-modal="true"'));
  assert.ok(html.includes('aria-label="Close activity filters"'));
  assert.ok(html.includes('aria-pressed="true"'));
  assert.match(css, /min-height:44px/);
  assert.match(css, /prefers-reduced-motion/);
});

test('post-save notes stay compact and accessible while Save/Add another keep their actions', async () => {
  const { html, css } = render(await load('NewItemPostSaveDetails.jsx'), { item: { _id: 'synthetic-item', ...draft } });
  assert.ok(html.includes('aria-label="Edit Notes"'));
  assert.ok(html.includes('title="Preserve this note"'));
  assert.ok(html.includes('Add another'));
  assert.match(css, /-webkit-line-clamp:2/);
});
