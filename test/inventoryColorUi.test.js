const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));
const React = frontendRequire('react');
const { renderToStaticMarkup } = frontendRequire('react-dom/server');
const { MemoryRouter } = frontendRequire('react-router-dom');
const { ServerStyleSheet } = frontendRequire('styled-components');
const esbuild = frontendRequire('esbuild');
const h = React.createElement;
async function load(file, portal = false) {
  const { outputFiles } = await esbuild.build({ entryPoints: [path.join(frontend, 'src', file)], bundle: true, write: false, format: 'cjs', platform: 'node', mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react-router-dom', 'styled-components'], jsx: 'automatic', loader: { '.webp': 'dataurl', '.csv': 'text' }, define: { 'import.meta.env': '{}' }, logLevel: 'silent' });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)((id) => id === 'styled-components' ? Object.assign(frontendRequire(id).default, frontendRequire(id)) : portal && id === 'react-dom' ? { createPortal: (child) => child } : frontendRequire(id), module, module.exports);
  return module.exports;
}
function render(Component, props = {}) {
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToStaticMarkup(sheet.collectStyles(h(MemoryRouter, null, h(Component, props))));
    return { html, css: sheet.getStyleTags() };
  } finally { sheet.seal(); }
}
const tree = { box_id: '105', label: 'Orange root', items: [], childBoxes: [{ box_id: '200', label: 'Teal child', location: 'Test shelf', items: [], childBoxes: [{ shortId: '701', label: 'Pink grandchild', items: [], childBoxes: [] }] }] };
test('Operations and shared entity rails keep identity in both selected states', async () => {
  for (const file of ['styles/BoxList.styles.js', 'styles/Lists.shared.styles.js', 'styles/BoxTree.styles.js']) {
    const styles = await load(file);
    const RailBack = styles.RailBack || styles.styledComponents.RailBack;
    for (const selected of [false, true]) {
      const { css } = render(RailBack, { $selected: selected });
      assert(css.includes('background:var(--box-primary, #8A8175)'), file);
      assert(!css.includes('var(--dw-amber)') && !css.includes('var(--dw-cyan)'), file);
    }
  }
});
test('condensed and ASCII nested trees scope each box independently', async () => {
  const { default: Tree } = await load('components/BoxTree.jsx');
  const { getBoxTheme } = await import('../frontend/src/util/inventoryColorTheme.js');
  // The root and immediately visible child must not share the root palette.
  for (const viewMode of ['condensed', 'full']) {
    const { html, css } = render(Tree, { node: tree, viewMode });
    for (const id of ['105', '200']) assert(html.includes(`--box-primary:${getBoxTheme(id).primary}`), `${viewMode}: ${id}`);
    assert(css.includes('var(--box-primary'), viewMode);
    if (viewMode === 'full') assert(html.includes(`--box-primary:${getBoxTheme('701').primary}`));
  }
});
test('Intake selection rows preserve all ten box families and a neutral Adrift destination', async () => {
  const { default: Selector } = await load('components/Intake/IntakeBoxSelectorPanel.jsx');
  const { getBoxTheme } = await import('../frontend/src/util/inventoryColorTheme.js');
  // One at a time avoids coupling this test to pagination size.
  for (let family = 0; family < 10; family++) {
    const box_id = `${family}00`; const box = { _id: `fixture-${box_id}`, box_id, label: 'Synthetic box' };
    const { html, css } = render(Selector, { boxes: [box], selectedBoxId: box._id });
    assert(html.includes(`--box-primary:${getBoxTheme(box_id).primary}`), box_id);
    assert(html.includes('--box-primary:#8A8175'), 'Adrift uses its own neutral scope');
    assert(css.includes('border-left-color:var(--box-primary, #8A8175)'));
  }
});
test('portaled box management carries its own box palette', async () => {
  const { default: Sheet } = await load('components/BoxDetailView/BoxManagementSheet.jsx', true);
  const previous = global.document;
  global.document = { body: {} };
  try {
    const { html, css } = render(Sheet, { open: true, boxId: '200', title: 'Synthetic teal box' });
    assert(html.includes('--box-primary:#4CC6C1'));
    assert(css.includes('border-top:3px solid var(--box-primary, #8A8175)'));
    assert(!css.includes('var(--dw-amber)'));
  } finally { if (previous === undefined) delete global.document; else global.document = previous; }
});
test('Quick Peek header and handle use the active box palette', async () => {
  const styles = await load('components/OperationsQuickPeek/OperationsQuickPeek.styles.js');
  for (const Component of [styles.DeckCap, styles.DetentHandle]) {
    const { css } = render(Component);
    assert(css.includes('var(--box-primary'));
    assert(!css.includes('var(--dw-amber)'));
  }
});
test('Retrieval result and box row rails retain provenance when opened or selected', async () => {
  const styles = await load('components/Retrieval/Retrieval.styles.js');
  for (const active of [false, true]) {
    const { css } = render(styles.BoxListRow, { $active: active, $boxColorRgb: '76, 198, 193' });
    assert(css.includes('border-left:3px solid rgb(76, 198, 193)'));
    const result = render(styles.ResultCard, { $expanded: active });
    assert(result.css.includes('background:var(--box-primary, #8A8175)'));
    assert(!result.css.includes('var(--dw-amber)'));
  }
});
