const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));
const React = frontendRequire('react');
const { renderToStaticMarkup } = frontendRequire('react-dom/server');
const { ServerStyleSheet } = frontendRequire('styled-components');
const esbuild = frontendRequire('esbuild');

async function load(file) {
  const { outputFiles } = await esbuild.build({
    entryPoints: [path.join(frontend, 'src', file)], bundle: true, write: false,
    format: 'cjs', platform: 'node', mainFields: ['module', 'main'],
    external: ['react', 'react-dom', 'react-router-dom', 'styled-components'],
    jsx: 'automatic', loader: { '.webp': 'dataurl', '.csv': 'text' },
    define: { 'import.meta.env': '{}' }, logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)(
    (id) => id === 'styled-components' ? Object.assign(frontendRequire(id).default, frontendRequire(id)) : frontendRequire(id), module, module.exports,
  );
  return module.exports.default;
}

function render(Component, props) {
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToStaticMarkup(sheet.collectStyles(React.createElement(Component, props)));
    return { html, css: sheet.getStyleTags() };
  } finally { sheet.seal(); }
}

const identity = {
  shortId: '001', label: 'Synthetic box', shortIdValid: true, unchanged: true,
  shortIdAvail: true, isValid: true, locationId: '', tags: ['fixture'],
};

test('compact identity extraction honors the same section boundaries as the full form', async () => {
  const Fields = await load('components/BoxForms/BoxIdentityFields.jsx');
  const onlyIdentity = render(Fields, { ...identity, compact: true, showOrganization: false }).html;
  assert.ok(onlyIdentity.includes('value="001"') && onlyIdentity.includes('value="Synthetic box"'));
  assert.ok(!onlyIdentity.includes('Clear assigned location') && !onlyIdentity.includes('Add a box tag'));
  const onlyOrganization = render(Fields, { ...identity, compact: true, showIdentity: false }).html;
  assert.ok(onlyOrganization.includes('Add a box tag') && onlyOrganization.includes('Vicinity'));
  assert.ok(!onlyOrganization.includes('id="box-short-id"') && !onlyOrganization.includes('id="box-label"'));
  const existingForm = render(Fields, { ...identity, compact: true }).html;
  assert.ok(existingForm.includes('id="box-short-id"') && existingForm.includes('Add a box tag'));
});

test('paged editing retains all fields while excluding inactive pages from focus and display', async () => {
  const Pages = await load('components/BoxForms/BoxEditPages.jsx');
  const { html } = render(Pages, {
    identity, description: 'Synthetic description draft', notes: 'Synthetic notes draft',
    isComplexBox: false, declutter: { purpose: 'standard' },
    image: { box: { label: 'Synthetic box' }, boxId: 'synthetic-box' },
  });
  assert.equal((html.match(/role="tab"/g) || []).length, 6);
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 5);
  assert.equal((html.match(/hidden="" inert=""/g) || []).length, 4);
  assert.equal((html.match(/<textarea /g) || []).length, 2);
  assert.ok(html.includes('Synthetic description draft') && html.includes('Synthetic notes draft'));
  assert.ok(html.includes('aria-label="Previous"') || html.includes('>Previous</button>'));
  assert.ok(html.includes('aria-label="Page 1 of 6"'));
  assert.ok(!html.includes('type="submit"'));
});

test('render picker opens on the saved token page and bounds choices without losing navigation', async () => {
  const Picker = await load('components/Processing/RenderTokenOptionPicker.jsx');
  const options = Array.from({ length: 11 }, (_, index) => ({ id: `token-${index}`, label: `Token ${index}` }));
  const paged = render(Picker, { options, currentValue: 'token-7', pageSize: 4 }).html;
  assert.equal((paged.match(/aria-pressed=/g) || []).length, 4);
  assert.ok(paged.includes('Token 7') && paged.includes('aria-pressed="true"'));
  assert.ok(!paged.includes('Token 0') && !paged.includes('Token 8'));
  assert.ok(paged.includes('Previous render tokens') && paged.includes('Next render tokens'));
  const original = render(Picker, { options, currentValue: 'token-7' }).html;
  assert.equal((original.match(/aria-pressed=/g) || []).length, 11);
  assert.ok(!original.includes('Next render tokens'));
});

test('media page presentation keeps upload and rendering actions available without duplicate previews', async () => {
  const Media = await load('components/ImageFields/ImageAssetField.jsx');
  const props = {
    imageState: { activeUrl: '/synthetic-photo.svg' }, uploadAction: { label: 'Upload Photo', onUpload: () => {} },
    processAction: { label: 'Process Image', onClick: () => {} },
    renderTokens: { mode: 'explicit', background: 'midnight', glow: 'standard' },
    renderTokenOptions: { background: [{ id: 'midnight', label: 'Midnight' }], glow: [{ id: 'standard', label: 'Standard' }] },
    onRenderTokenChange: () => {}, compact: true,
  };
  const photo = render(Media, { ...props, workspacePage: 'photo' }).html;
  assert.ok(photo.includes('Upload Photo') && photo.includes('Process Image') && photo.includes('/synthetic-photo.svg'));
  assert.ok(!photo.includes('Render profile'));
  const rendering = render(Media, { ...props, workspacePage: 'render' }).html;
  assert.ok(rendering.includes('Render profile') && rendering.includes('Token mode') && rendering.includes('Process Image'));
  assert.ok(!rendering.includes('Upload Photo') && !rendering.includes('/synthetic-photo.svg'));
  const original = render(Media, props).html;
  assert.ok(original.includes('Upload Photo') && original.includes('Customize Render profile'));
});
