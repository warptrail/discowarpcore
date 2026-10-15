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
  const { outputFiles } = await requireFrontend('esbuild').build({ entryPoints: [path.join(frontend, 'src', file)], bundle: true, write: false, format: 'cjs', platform: 'node', mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react-router-dom', 'styled-components'], jsx: 'automatic', logLevel: 'silent' });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)((id) => id === 'styled-components' ? Object.assign(requireFrontend(id).default, requireFrontend(id)) : requireFrontend(id), module, module.exports);
  return module.exports;
}
function render(Component, props) {
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToStaticMarkup(sheet.collectStyles(React.createElement(Component, props)));
    return { html, css: sheet.getStyleTags() };
  } finally { sheet.seal(); }
}

test('Notes renders compact Markdown, GFM and literal query highlights in actual text', async () => {
  const { default: Notes } = await load('components/InventoryQuickAnswer/FinderItemNotes.jsx');
  const notes = '# Fish care\n\n**Keep dry** and *cool*.\n\n- fish supplies\n- second item\n\n1. First\n2. Second\n\n> Fish reminder\n\n`fish_code`\n\n```text\nfish storage\n```\n\n- [x] inspected\n- [ ] pending\n\n| Part | Status |\n| --- | --- |\n| fish | ready |\n\n[Manual](https://example.com/fish)\n\n~~old~~';
  const { html, css } = render(Notes, { notes, query: 'fish' });
  for (const element of ['<h1>', '<strong>', '<em>', '<ul>', '<ol>', '<blockquote>', '<code>', '<pre>', '<table>', '<del>']) assert.ok(html.includes(element), element);
  assert.ok(html.includes('type="checkbox"') && html.includes('disabled=""'));
  assert.equal((html.match(/<mark>/g) || []).length, 6);
  assert.ok(html.includes('href="https://example.com/fish"') && html.includes('rel="noopener noreferrer"'));
  assert.ok(!html.includes('**Keep dry**'));
  assert.ok(css.includes('font:400 .85rem/1.5'));
});

test('Notes keeps unsafe HTML inert, blocks unsafe links and does not fetch remote note images', async () => {
  const { default: Notes } = await load('components/InventoryQuickAnswer/FinderItemNotes.jsx');
  const notes = '<script>alert("fish")</script>\n\n<img src="/danger" onerror="alert(1)">\n\n[bad](javascript:alert%281%29) [encoded](javascript&colon;alert%281%29)\n\n![fish photo](https://example.com/remote.png)\n\n[Safe](https://example.com/manual)';
  const { html } = render(Notes, { notes, query: 'fish' });
  assert.ok(!/<script|<img|href="javascript|href="data:/i.test(html));
  assert.ok(html.includes('&lt;script&gt;') && html.includes('&lt;img'));
  assert.ok(html.includes('[Image: fish photo]'));
  assert.ok(!html.includes('remote.png'));
  assert.ok(html.includes('href="https://example.com/manual"'));
});

test('long Notes stays complete in an independent, bounded, keyboard-focusable scrolling region', async () => {
  const { default: Notes } = await load('components/InventoryQuickAnswer/FinderItemNotes.jsx');
  const notes = Array.from({ length: 80 }, (_, i) => `Paragraph ${i}: actual recorded note text.`).join('\n\n') + '\n\nFINAL NOTE';
  const { html, css } = render(Notes, { notes });
  assert.ok(html.includes('role="region" aria-label="Item notes" tabindex="0"'));
  assert.ok(html.includes('Paragraph 0') && html.includes('Paragraph 79') && html.includes('FINAL NOTE'));
  assert.ok(css.includes('max-height:360px;overflow:auto;overscroll-behavior:contain'));
  assert.ok(css.includes('flex:0 1 auto;min-height:0'));
  assert.ok(css.includes('scrollbar-width:thin'));
  const styles = await load('components/InventoryQuickAnswer/FinderItemFocus.styles.js');
  assert.ok(render(styles.Body, { $notes: true }).css.includes('display:flex;flex-direction:column;overflow:hidden'));
});

test('plain and empty Notes remain readable without inventing content', async () => {
  const { default: Notes } = await load('components/InventoryQuickAnswer/FinderItemNotes.jsx');
  assert.ok(render(Notes, { notes: 'Plain first line\nPlain second line' }).html.includes('Plain first line\nPlain second line'));
  for (const notes of ['', '   ', null, undefined]) {
    const { html } = render(Notes, { notes });
    assert.ok(html.includes('No notes recorded for this item.'));
    assert.ok(!html.includes('aria-label="Item notes"'));
  }
});
