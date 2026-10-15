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
test('Operations search carousel uses item thumbnails, accessible item/box links and compact reduced-motion cards', async () => {
  const { default: Carousel } = await load('components/InventoryQuickAnswer/QuickAnswerCarousel.jsx');
  const { html, css } = render(Carousel, { answers: [{ id: 'fish', item: { image: { tiny: { url: '/media/items/fish.webp' } } }, name: 'Fish', nameMatch: true, boxId: '121', boxLabel: 'Council Chambers', path: ['Office', 'Closet'] }], onSelect: () => {} });
  assert.ok(html.includes('src="/media/items/fish.webp"'));
  assert.ok(html.includes('Locate Fish'));
  assert.ok(html.includes('findItem=fish'));
  assert.ok(!html.includes('item=fish'));
  assert.ok(html.includes('aria-haspopup="dialog"'));
  assert.ok(html.includes('Open box 121'));
  assert.ok(!html.includes('item=undefined'));
  assert.match(html, /aria-label="Previous matching item"[^>]*disabled=""/);
  assert.match(html, /aria-label="Next matching item"[^>]*disabled=""/);
  assert.ok(html.includes('>Item finder</span>'));
  assert.ok(html.includes('Office › Closet'));
  assert.ok(css.includes('perspective:900px'));
  assert.ok(css.includes('scroll-snap-type:x mandatory'));
  assert.ok(css.includes('height:76px'));
  assert.ok(css.includes('height:104px'));
  assert.ok(css.includes('grid-template-columns:44px minmax(0, 1fr) 44px'));
  assert.ok(css.includes('-webkit-line-clamp:2'));
  assert.ok(css.includes('scrollbar-width:none'));
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
test('finder starts with location and a larger photo, progressively revealing highlighted metadata without box contents', async () => {
  const { default: Details } = await load('components/InventoryQuickAnswer/FinderItemDetails.jsx');
  const props = { query: 'fish', answer: { id: 'fish', name: 'Fish toy', boxId: '121', boxLabel: 'Fish collection', path: ['Office', 'Blue fish bin'],
    placement: { tiers: { room: 'Office', vicinity: '', specifics: '', exactSpot: 'Blue fish bin' }, legacyLabel: '' },
    box: { items: [{ name: 'DO NOT RENDER OTHER BOX ITEMS' }] },
    item: { name: 'Fish toy', description: 'A wind-up fish toy', notes: 'Gift', category: 'Toys', quantity: 2, keepPriority: 'High', location: 'Old shelf', tags: ['fish', 'windup'], image: { display: { url: '/media/items/fish-display.webp' } } } } };
  const { html, css } = render(Details, props);
  assert.ok(html.includes('aria-label="Four-tier location"'));
  for (const label of ['Room', 'Vicinity', 'Specifics', 'Exact spot']) assert.ok(html.includes(`<dt>${label}</dt>`));
  assert.equal((html.match(/Not recorded/g) || []).length, 2);
  assert.ok(html.includes('src="/media/items/fish-display.webp" alt="Fish toy"'));
  assert.ok(html.includes('Quantity 2') && html.includes('Toys'));
  assert.ok(!html.includes('Description') && !html.includes('>Tags<') && !html.includes('Notes'));
  assert.equal((html.match(/<mark /g) || []).length, 3);
  assert.ok(!html.includes('DO NOT RENDER OTHER BOX ITEMS'));
  assert.ok(css.includes('height:280px'));
  assert.ok(css.includes('height:200px'));
  assert.ok(css.includes('@container (max-width: 600px)'));
  const details = render(Details, { ...props, view: 'details' }).html;
  assert.ok(details.includes('Description') && details.includes('Category'));
  assert.ok(!details.includes('>Notes<') && !details.includes('Gift'));
  assert.ok(details.includes('Keep priority') && details.includes('High'));
  assert.ok(details.includes('Recorded item location') && details.includes('Old shelf'));
  assert.ok(!details.includes('Four-tier location') && !details.includes('DO NOT RENDER OTHER BOX ITEMS'));
  assert.equal((details.match(/<mark /g) || []).length, 3);
  const tags = render(Details, { ...props, view: 'tags' }).html;
  assert.ok(tags.includes('aria-label="Item tags"') && tags.includes('windup'));
  assert.ok(!tags.includes('Description') && !tags.includes('Four-tier location'));
  assert.equal((tags.match(/<mark /g) || []).length, 3);
  for (const output of [html, details, tags]) {
    assert.ok(output.includes('id="finder-focus-title"'));
    assert.ok(output.includes('#121') && output.includes('collection'));
  }
  const legacy = render(Details, { query: '', answer: { ...props.answer, unboxed: true, boxId: '', boxLabel: '', placement: { tiers: {}, legacyLabel: 'Garage shelf' }, item: {} } });
  assert.equal((legacy.html.match(/Not recorded/g) || []).length, 4);
  assert.ok(legacy.html.includes('Recorded location: Garage shelf'));
  assert.ok(legacy.html.includes('not currently assigned to a box'));
  assert.ok(legacy.html.includes('No item photo recorded'));
});
test('compact and expanded finder share one frame, count and 44px arrow pair', async () => {
  const { default: Frame } = await load('components/InventoryQuickAnswer/FinderMatchFrame.jsx');
  for (const expanded of [false, true]) {
    const { html, css } = render(Frame, { index: 12, total: 19, expanded, onStep: () => {}, onClose: expanded ? () => {} : undefined, children: h('div', null, 'Item content') });
    assert.ok(html.includes(expanded ? 'Expanded matching item finder' : 'Matching item carousel'));
    assert.ok(html.includes('13 / 19'));
    assert.equal((html.match(/aria-label="Previous matching item"/g) || []).length, 1);
    assert.equal((html.match(/aria-label="Next matching item"/g) || []).length, 1);
    assert.equal(html.includes('Close item focus'), expanded);
    assert.ok(css.includes('width:44px;min-height:44px'));
    if (expanded) assert.ok(css.includes('grid-template-rows:44px minmax(0, 1fr)'));
  }
  const loading = render(Frame, { index: -1, total: 0, expanded: true }).html;
  assert.ok(loading.includes('— / 0'));
  assert.equal((loading.match(/disabled=""/g) || []).length, 2);
});
test('expanded finder has icon-only information and navigation controls with accessible pressed states', async () => {
  const { default: Controls } = await load('components/InventoryQuickAnswer/FinderItemControls.jsx');
  const answer = { id: 'fish', name: 'Fish toy', boxId: '121' };
  for (const view of ['location', 'details', 'tags', 'notes']) {
    const { html, css } = render(Controls, { answer, view, onViewChange: () => {}, search: '?q=fish&findItem=fish' });
    assert.equal((html.match(/<button /g) || []).length, 4);
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
    assert.match(html, new RegExp(`aria-label="Show item ${view}"[^>]*aria-pressed="true"`));
    assert.equal((html.match(/aria-controls="finder-item-information"/g) || []).length, 4);
    assert.ok(html.includes('aria-label="Open box #121"') && html.includes('href="/operations?q=fish&amp;peek=121"'));
    assert.ok(html.includes('aria-label="Open item page for Fish toy"') && html.includes('href="/items/fish"'));
    assert.ok(!html.includes('findItem=') && !html.includes('>Full item page<') && !html.includes('>Open box<'));
    assert.equal((html.match(/<svg /g) || []).length, 6);
    assert.ok(css.includes('width:44px;height:44px'));
  }
  const unboxed = render(Controls, { answer: { ...answer, boxId: '', unboxed: true }, view: 'location' }).html;
  assert.ok(unboxed.includes('Open Items Adrift') && unboxed.includes('peek=adrift'));
  const missing = render(Controls, { view: 'location' }).html;
  assert.equal((missing.match(/disabled=""/g) || []).length, 4);
  assert.ok(!missing.includes('<a '));
});
test('finder focus styling slides down with reduced-motion support and bounded scrolling', async () => {
  const styles = await load('components/InventoryQuickAnswer/FinderItemFocus.styles.js');
  const { html, css } = render(styles.Panel, { role: 'dialog', 'aria-modal': true });
  assert.ok(html.includes('role="dialog" aria-modal="true"'));
  assert.ok(css.includes('translateY(-14px)'));
  assert.ok(css.includes('240ms ease-out'));
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.ok(render(styles.Body).css.includes('overflow:auto'));
  assert.ok(render(styles.Body).css.includes('overscroll-behavior:contain'));
  assert.ok(render(styles.IconButton).css.includes('width:44px;height:44px'));
});
test('explicit box Quick Peek clears item focus without changing its established navigation contract', async () => {
  const { getOperationsItemPeekNavigation } = await load('util/operationsItemNavigation.js');
  const navigation = getOperationsItemPeekNavigation({ search: '?q=fish&findItem=one', state: { retained: true, finderFocusReturn: '/operations?q=fish' }, boxId: '102', itemId: 'two' });
  assert.equal(navigation.to, '/operations?q=fish&peek=102&item=two');
  assert.equal(navigation.state.retained, true);
  assert.equal(navigation.state.operationsQuickPeekEntry, true);
  assert.equal(navigation.state.operationsQuickPeekItemEntry, false);
  assert.equal('finderFocusReturn' in navigation.state, false);
});
test('inline match rows embed an accessible full-item icon without a separate button line or nested links', async () => {
  const { default: Matches } = await load('components/InventorySearchMatches.jsx');
  const items = [{ _id: 'fish', name: 'Fish beach towel', description: 'A fish towel', tags: ['fish'] }, { _id: 'long', name: 'Long fish item name that must never overlap its page icon' }];
  for (const compact of [false, true]) {
    const { html, css } = render(Matches, { items, query: 'fish', boxId: '102', compact });
    assert.equal((html.match(/<li(?:\s|>)/g) || []).length, 2);
    assert.equal((html.match(/<a /g) || []).length, 4);
    assert.equal((html.match(/title="Open full item page"/g) || []).length, 2);
    const pageAction = html.match(/<a[^>]*aria-label="Open item page for Fish beach towel"[^>]*><svg/);
    assert.ok(pageAction && pageAction[0].includes('href="/items/fish"'));
    assert.ok(html.includes('peek=102&amp;item=fish'));
    assert.ok(!html.includes('>Open item page<') && !html.includes('>Open<'));
    assert.ok(!/<a[^>]*>(?:(?!<\/a>).)*<a/s.test(html), 'links remain siblings');
    assert.ok(compact ? html.includes('Details: A fish towel') && html.includes('Tags: fish')
      : html.includes('Matched in details') && html.includes('Matched in tags'));
    assert.ok(css.includes('position:absolute;top:10px;right:6px'));
    assert.ok(css.includes('width:44px;height:44px'));
    assert.ok(css.includes('padding-right:44px'));
    assert.ok(css.includes('background:transparent'));
    if (compact) {
      assert.ok(css.includes('top:2px;right:0'));
      assert.ok(css.includes('min-height:48px;box-sizing:border-box'));
      assert.ok(css.includes('padding:3px 48px 3px 6px'));
      assert.ok(css.includes('white-space:normal;overflow-wrap:anywhere'));
      assert.ok(html.includes('tabindex="0"') && !html.includes('Matched in tags'));
    }
  }
});
test('finder shelf removes its outer frame and rail without changing other console messages', async () => {
  const { default: Carousel } = await load('components/InventoryQuickAnswer/QuickAnswerCarousel.jsx');
  const answers = ['one', 'two'].map((id) => ({ id, item: {}, name: id, nameMatch: true, boxId: '', unboxed: true, path: [] }));
  const multiple = render(Carousel, { answers, onSelect: () => {} });
  assert.equal((multiple.html.match(/<button /g) || []).length, 2);
  assert.ok(!multiple.html.includes('disabled=""'));
  const { Shell } = await load('components/InventoryQuickAnswer/QuickAnswerCarousel.styles.js');
  const shelf = render(Shell);
  assert.ok(shelf.css.includes('border:0;border-radius:0'));
  assert.ok(shelf.css.includes('grid-template-rows:18px minmax(0, 1fr)'));
  assert.ok(shelf.css.includes('::after{content:'));
  assert.ok(shelf.css.includes('bottom:-1px;height:5px'));
  assert.ok(shelf.css.includes('0 14px 18px -7px'));
  const { default: Slot } = await load('components/Toast/ConsoleMessageSlot.jsx');
  const themeStyle = { '--box-primary': '#e8b15c', '--box-primary-rgb': '232,177,92' };
  const message = { active: true, height: 108, presentation: 'finder-shelf', themeStyle, content: h('span', null, 'Finder') };
  const featured = render(Slot, { message });
  assert.ok(featured.html.includes('data-presentation="finder-shelf"'));
  assert.ok(featured.css.includes('height:108px'));
  assert.ok(featured.css.includes('height:104px'));
  assert.ok(featured.css.includes('padding:0;border-top:0;border-left:0;overflow:visible'));
  assert.ok(!featured.css.includes('border-left-color:var(--box-primary)'));
  const ordinary = render(Slot, { message: { active: true, themeStyle, content: 'Other message' } });
  assert.ok(ordinary.css.includes('height:76px'));
  assert.ok(ordinary.css.includes('border-left:3px solid transparent'));
  assert.ok(ordinary.css.includes('border-left-color:var(--box-primary)'));
  assert.ok(!ordinary.html.includes('data-presentation'));
  const collapsed = render(Slot, { message: { ...message, active: false } });
  assert.ok(collapsed.css.includes('height:0'));
  assert.ok(collapsed.css.includes('overflow:hidden'));
  assert.ok(collapsed.html.includes('inert=""'));
});
test('finder highlights every visible keyword and explains hidden metadata without replacing the item name', async () => {
  const { default: Carousel } = await load('components/InventoryQuickAnswer/QuickAnswerCarousel.jsx');
  const answer = { id: 'fixture', item: { tags: ['fish'], description: 'Fish decoration' }, name: 'wind-up FISH toy', nameMatch: true, boxId: '001', boxLabel: 'Fish shelf', path: ['Fishing room'] };
  const visible = render(Carousel, { answers: [answer], query: 'fish', onSelect: () => {} });
  assert.equal((visible.html.match(/<mark /g) || []).length, 4);
  assert.ok(visible.html.includes('Tags:</b>'));
  assert.ok(visible.html.includes('Keyword matched in tags, description'));
  assert.ok(visible.css.includes('-webkit-line-clamp:1'));
  const hidden = render(Carousel, { answers: [{ ...answer, name: 'Ceramic cup', nameMatch: false, item: { category: 'fishware' }, boxLabel: 'Plain box', path: ['Office'] }], query: 'fish', onSelect: () => {} });
  assert.ok(hidden.html.includes('Category:</b>'));
  assert.ok(hidden.html.includes('>Ceramic cup</span>'));
  assert.ok(!hidden.html.includes('Possible:'));
});
test('Operations console log retains Toast actions, dismissal, content and a separate finder icon dock', async () => {
  const { default: Log } = await load('components/OperationsFilters/OperationsConsoleLog.jsx');
  const action = () => {};
  const dismiss = () => {};
  const toast = { title: 'Confirm change', message: 'Review first', sticky: true, actions: [{ label: 'Confirm', onClick: action }], content: h('span', null, 'Preview'), dismissible: true };
  const element = Log({ toast, onClose: dismiss });
  const forwarded = element.props.children[0].props.children.props;
  assert.equal(forwarded.actions, toast.actions);
  assert.equal(forwarded.content, toast.content);
  assert.equal(forwarded.onClose, dismiss);
  assert.equal(forwarded.open, true);
  assert.equal(forwarded.presentation, 'console-log');
  const { html, css } = render(Log, { toast, onClose: dismiss });
  assert.equal((html.match(/>Confirm change</g) || []).length, 1);
  assert.ok(html.includes('>Confirm</button>'));
  assert.ok(html.includes('Dismiss notification'));
  assert.ok(html.includes('id="operations-finder-actions-mount"'));
  assert.ok(css.includes('min-height:32px;margin:0'));
  assert.ok(!render(Log, { toast: { ...toast, dismissible: false } }).html.includes('Dismiss notification'));
  assert.ok(render(Log, { consoleMessage: { active: true, summary: '9 matching items' } }).html.includes('9 matching items'));
  assert.equal(Log({ toast: { ...toast, presentation: 'item-field' }, onClose: dismiss }).props.children[0].props.children.props.presentation, 'item-field');
});
test('Operations console reports matching items and boxes compactly with correct plurals and Toast precedence', async () => {
  const { default: Log } = await load('components/OperationsFilters/OperationsConsoleLog.jsx');
  const message = { active: true, summary: '19 matching items', matchingBoxCount: 6 };
  const { html, css } = render(Log, { consoleMessage: message });
  assert.ok(html.includes('19 matching items'));
  assert.ok(html.includes('6 matching boxes'));
  assert.equal((html.match(/role="status"/g) || []).length, 1);
  assert.ok(css.includes('flex-wrap:wrap'));
  assert.ok(render(Log, { consoleMessage: { ...message, matchingBoxCount: 1 } }).html.includes('1 matching box</span>'));
  assert.ok(render(Log, { consoleMessage: { ...message, matchingBoxCount: 0 } }).html.includes('0 matching boxes'));
  assert.ok(!render(Log, { consoleMessage: { ...message, summary: 'Searching…', matchingBoxCount: null } }).html.includes('matching boxes'));
  assert.ok(!render(Log, { consoleMessage: { ...message, active: false } }).html.includes('matching boxes'));
  assert.ok(!render(Log, { consoleMessage: message, toast: { title: 'Confirm', message: 'Review first' } }).html.includes('matching boxes'));
});
test('idle console uses a quiet house marquee with pause, next, reduced motion and no live tip announcements', async () => {
  const { default: Log } = await load('components/OperationsFilters/OperationsConsoleLog.jsx');
  const idle = render(Log, {});
  assert.ok(idle.html.includes('aria-label="Console tips" aria-live="off"'));
  assert.ok(idle.html.includes('Home console') && idle.html.includes('confirmations and Undo'));
  assert.ok(idle.html.includes('aria-label="Pause console tips"') && idle.html.includes('aria-label="Next console tip"'));
  assert.ok(!idle.html.includes('Console ready'));
  assert.ok(idle.html.includes('m1.5 7 6.5-5.5L14.5 7'));
  assert.ok(idle.css.includes('height:32px'));
  assert.ok(idle.css.includes('hue-rotate(360deg)') && idle.css.includes('drop-shadow(0 0 3px currentColor)'));
  assert.match(idle.css, /prefers-reduced-motion:\s*reduce/);
  assert.ok(idle.css.includes('animation-play-state:paused'));
  assert.doesNotMatch(idle.css, /:hover\s+\[data-console-scroll\]/);
  assert.match(idle.css, /:has\(:focus-visible\)\s+\[data-console-scroll\]/);
  for (const props of [{ toast: { title: 'Confirm', message: 'Review first' } }, { consoleMessage: { active: true, summary: 'Searching…' } }, { consoleMessage: { active: true, summary: 'Search unavailable' } }]) {
    const output = render(Log, props);
    assert.ok(!output.html.includes('aria-label="Console tips"'));
    assert.ok(!output.css.includes('hue-rotate(360deg)'));
  }
});
test('Operations view/actions panel groups three icon targets without a visible Actions heading', async () => {
  const { default: Controls } = await load('components/OperationsInventory/OperationsConsoleControls.jsx');
  const { html, css } = render(Controls, { viewMode: 'cards' });
  assert.equal((html.match(/<button /g) || []).length, 3);
  assert.equal((html.match(/<svg /g) || []).length, 3);
  assert.ok(html.includes('aria-label="Inventory actions" title="Inventory actions" aria-expanded="false"'));
  assert.ok(!html.includes('>Actions<'));
  assert.ok(css.includes('width:44px;min-height:44px'));
});
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
test('Quick Peek header and location tiers use the active box palette', async () => {
  const styles = await load('components/OperationsQuickPeek/OperationsQuickPeek.styles.js');
  for (const Component of [styles.DeckCap, styles.HeaderLocationTier]) {
    const { css } = render(Component);
    assert(css.includes('var(--box-primary'));
    assert(!css.includes('var(--dw-amber)'));
  }
});
test('Retrieval result and box row rails retain provenance when opened or selected', async () => {
  const styles = await load('components/Retrieval/Retrieval.styles.js');
  for (const active of [false, true]) {
    const { css } = render(styles.BoxListRow, { $active: active, $boxColorRgb: '76, 198, 193' });
    assert(css.includes('border-left:3px solid var(--box-primary, #8A8175)'));
    const result = render(styles.ResultCard, { $expanded: active });
    assert(result.css.includes('background:var(--box-primary, #8A8175)'));
    assert(!result.css.includes('var(--dw-amber)'));
  }
});

test('Retrieval framing switches between purple Items and green Boxes without amber rails', async () => {
  const styles = await load('components/Retrieval/Retrieval.styles.js');
  const { RETRIEVAL_MODE_COLORS } = await import('../frontend/src/styles/tokens.js');
  for (const mode of ['items', 'boxes']) {
    const Framing = () => h(styles.PageShell, { $mode: mode },
      h(styles.ControlsPanel), h(styles.ResultsHeader), h(styles.SearchInput),
      h(styles.ModeToggleGroup, null, h(styles.ModeToggleButton, { $active: true }, mode)));
    const { css } = render(Framing);
    assert.ok(css.includes(`--retrieval-mode-accent:${RETRIEVAL_MODE_COLORS[mode]}`), mode);
    assert.ok(css.includes('border-left-color:var(--retrieval-mode-accent, var(--dw-violet))'));
    assert.ok(!css.includes('var(--dw-amber)'), mode);
    assert.ok(css.includes('var(--dw-cyan)'), 'Keyboard focus stays cyan');
  }
});

test('Retrieval search owns its mode accent so detached forms retain the correct color', async () => {
  const { default: Form } = await load('components/Retrieval/RetrievalSearchForm.jsx');
  const { RETRIEVAL_MODE_COLORS } = await import('../frontend/src/styles/tokens.js');
  for (const mode of ['items', 'boxes']) {
    const { html, css } = render(Form, { mode });
    assert.ok(html.includes(`aria-label="${mode === 'boxes' ? 'Box' : 'Item'} retrieval controls"`));
    assert.ok(css.includes(`--retrieval-mode-accent:${RETRIEVAL_MODE_COLORS[mode]}`));
    assert.ok(css.includes('border-left-color:var(--retrieval-mode-accent)'));
    assert.ok(!html.includes('aria-label="Retrieval mode"'), 'Mode selection lives in the header, not the finder');
  }
});

test('Retrieval search glow shifts only border hues with steady focus and reduced-motion fallbacks', async () => {
  const { SearchInput } = await load('components/Retrieval/Retrieval.styles.js');
  const { html, css } = render(SearchInput, { 'aria-label': 'Find Items', value: 'fixture', readOnly: true });
  assert.ok(html.includes('value="fixture"'));
  assert.ok(css.includes('16s ease-in-out infinite'));
  assert.ok(css.includes('border-top-color:color-mix(in srgb, var(--dw-violet) 66%, transparent)'));
  assert.ok(css.includes('border-left-color:var(--retrieval-mode-accent, var(--dw-violet))'));
  assert.match(css, /:focus\{animation:none;border-top-color:var\(--dw-cyan\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[^}]*animation:none/);
  assert.match(css, /:focus,[^{]*:focus-visible\{outline:none;/);
  assert.match(css, /:focus::placeholder\{opacity:0;/);
  assert.ok(css.includes('caret-color:var(--dw-cyan)'));
  assert.ok(!css.includes('hue-rotate') && !css.includes('transform:'));
});

test('Retrieval header controls report items or boxes and preserve the existing presentation modes', async () => {
  const { RetrievalConsoleControls } = await load('components/Retrieval/RetrievalConsoleControls.jsx');
  const items = render(RetrievalConsoleControls, { shown: 25, total: 484, presentation: 'ascii', onPresentationChange: () => {} });
  assert.ok(items.html.includes('aria-label="25 shown / 484 items"'));
  assert.ok(!items.html.includes('matches'));
  assert.match(items.html, /aria-label="Terminal view"[^>]*aria-pressed="true"/);
  assert.ok(items.html.includes('aria-label="Cards view"'));
  assert.ok(items.css.includes('min-height:44px'));
  const boxes = render(RetrievalConsoleControls, { mode: 'boxes', shown: 25, total: 51, loading: true });
  assert.ok(boxes.html.includes('aria-label="25 shown / 51 boxes"'));
  assert.ok(boxes.html.includes('aria-busy="true"'));
  assert.ok(!boxes.html.includes('Terminal view'));
  const scoped = render(RetrievalConsoleControls, { scope: { label: 'fixture' }, shown: 2, total: 2 });
  assert.ok(scoped.html.includes('2 shown / 2 tagged items'));
  assert.ok(!scoped.html.includes('role="tablist"'), 'Tag routes stay item-only');
});

test('Retrieval desktop shares three labelled views across items and boxes while mobile has one card size and Terminal', async () => {
  const { RetrievalConsoleControls } = await load('components/Retrieval/RetrievalConsoleControls.jsx');
  for (const mode of ['items', 'boxes']) {
    for (const [presentation, activeLabel] of [['cards', 'Large cards'], ['compact', 'Small cards'], ['ascii', 'Terminal']]) {
      const { html } = render(RetrievalConsoleControls, { mode, desktop: true, presentation, onPresentationChange: () => {} });
      for (const label of ['Large cards', 'Small cards', 'Terminal']) assert.ok(html.includes(`${label} view`));
      assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
      assert.match(html, new RegExp(`aria-label="${activeLabel} view"[^>]*aria-pressed="true"`));
    }
  }
  const mobile = render(RetrievalConsoleControls, { presentation: 'compact', onPresentationChange: () => {} }).html;
  assert.match(mobile, /aria-label="Cards view"[^>]*aria-pressed="true"/);
  assert.ok(mobile.includes('Terminal view') && !mobile.includes('Small cards'));
  const mobileBoxes = render(RetrievalConsoleControls, { mode: 'boxes', presentation: 'compact', onPresentationChange: () => {} }).html;
  assert.ok(mobileBoxes.includes('Cards view') && mobileBoxes.includes('Terminal view'));
  assert.ok(!mobileBoxes.includes('Small cards'));
});

test('Retrieval small item cards keep placement, thumbnail preview and accessible identity while omitting extra visible metadata', async () => {
  const { default: Row } = await load('components/Retrieval/RetrievalResultRow.jsx');
  const item = { id: 'fixture', name: 'Long item name', boxNumber: '501', boxName: 'Gifts from Spain',
    locationLabel: 'Office · Closet · Top Shelf - Left', categoryKey: 'gifts', categoryLabel: 'Gifts', tags: ['keepsake'], imageUrl: '/media/fixture.webp' };
  const small = render(Row, { item, smallCard: true, onToggle: () => {} });
  const visible = small.html.replace(/<[^>]*>/g, '');
  assert.equal(visible, 'Office · Closet · Top Shelf - Left501');
  assert.ok(small.html.includes('Open item panel for Long item name'));
  assert.ok(small.html.includes('Preview image for Long item name'));
  assert.ok(small.html.includes('src="/media/fixture.webp"'));
  assert.ok(small.html.includes('aria-controls="retrieval-row-panel-fixture"'));
  const regular = render(Row, { item }).html;
  assert.ok(regular.includes('Long item name') && regular.includes('Item tags: #keepsake'));
  const unboxed = render(Row, { item: { id: 'unboxed', name: 'Unassigned' }, smallCard: true }).html;
  assert.ok(unboxed.includes('No box assigned') && unboxed.includes('>Unknown</span>'));
});

test('Retrieval box rows preserve inspection and cube thumbnails across large, small and Terminal presentations', async () => {
  const { default: Row } = await load('components/Retrieval/RetrievalBoxResultRow.jsx');
  const box = { id: 'fixture', boxId: '501', boxLabel: 'Gifts from Spain', locationLabel: 'Office · Closet',
    tags: ['keepsake'], directItemCount: 4, childBoxCount: 1 };
  const normal = render(Row, { box }).html;
  assert.ok(normal.includes('Gifts from Spain') && normal.includes('#keepsake') && normal.includes('4 items'));
  const small = render(Row, { box, presentation: 'compact', isActive: true }).html;
  assert.equal(small.replace(/<[^>]*>/g, ''), 'Office · Closet501');
  assert.ok(small.includes('Inspect box 501, Gifts from Spain') && small.includes('aria-pressed="true"'));
  assert.ok(small.includes('<svg'), 'Missing box photos retain the deterministic cube');
  const terminal = render(Row, { box, presentation: 'ascii', isActive: true }).html;
  assert.ok(terminal.includes('#501 · Gifts from Spain') && terminal.includes('Office · Closet'));
  assert.ok(terminal.includes('data-retrieval-box-result="501"') && terminal.includes('aria-pressed="true"'));
  const mobile = render(Row, { box, isMobile: true, isActive: true, panelId: 'inline-fixture' }).html;
  assert.ok(mobile.includes('aria-expanded="true"') && mobile.includes('aria-controls="inline-fixture"'));
});

test('reshuffle moves out of the header into the centered finder action row', async () => {
  const { RetrievalConsoleControls } = await load('components/Retrieval/RetrievalConsoleControls.jsx');
  const header = render(RetrievalConsoleControls);
  assert.ok(!header.html.includes('Reshuffle items'));
  const { default: Panel } = await load('components/Retrieval/RetrievalControlPanel.jsx');
  const { html, css } = render(Panel, { onReshuffle: () => {}, shuffled: true });
  assert.ok(html.includes('aria-label="Reshuffle items"'));
  assert.ok(html.indexOf('Reshuffle items') < html.indexOf('More filters'));
  assert.ok(html.indexOf('More filters') < html.indexOf('Reset all filters'));
  assert.ok(html.includes('aria-label="Retrieval finder actions"'));
  assert.ok(css.includes('font-weight:350'));
  assert.match(html, /aria-label="Reshuffle items"[^>]*aria-pressed="true"/);
  assert.ok(css.includes('min-width:44px'));
  const { default: Rail } = await load('components/Retrieval/RetrievalSortRail.jsx');
  const options = ['random', 'location', 'name', 'box', 'tag'].map((key) => ({ key, label: key }));
  const rail = render(Rail, { sortOptions: options, selectedSort: 'random' });
  assert.equal((rail.html.match(/aria-label="Sort by /g) || []).length, 4);
  assert.ok(!rail.html.includes('Sort by random'));
});

test('Retrieval header keeps stable portal hosts and compact controls with reduced-motion support', async () => {
  const { default: Console } = await load('components/Retrieval/RetrievalHeaderConsole.jsx');
  const { html, css } = render(Console, { compact: true, trigger: h('button', { 'aria-label': 'Toggle retrieval search' }) });
  assert.equal((html.match(/id="retrieval-header-controls-mount"/g) || []).length, 1);
  assert.equal((html.match(/id="retrieval-console-search-mount"/g) || []).length, 1);
  assert.ok(css.includes('overflow-y:auto'));
  assert.ok(css.includes('100dvh - 180px'));
  assert.equal((html.match(/id="retrieval-console-finder-mount"/g) || []).length, 1);
  assert.ok(html.includes('data-compact="true"'));
  assert.ok(css.includes('var(--header-progress, 0)'));
  assert.ok(css.includes('min-width:44px'));
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('finder button cues retain a stable touch target, accessible state and reduced-motion fallback', async () => {
  const { RetrievalFinderToggleButton: Toggle } = await load('components/Retrieval/RetrievalFinderToggle.jsx');
  const filtered = render(Toggle, { minimized: true, filtersActive: true, inviting: true, children: h('svg') });
  assert.ok(filtered.html.includes('data-cue="filtered"'));
  assert.ok(filtered.html.includes('aria-expanded="false"'));
  assert.ok(filtered.html.includes('aria-controls="retrieval-controls-panel retrieval-search-panel"'));
  assert.ok(filtered.html.includes('Show retrieval controls · Filters active'));
  assert.ok(filtered.css.includes('3.2s ease-in-out infinite'));
  assert.ok(filtered.css.includes('18s ease-in-out infinite'));
  assert.ok(filtered.css.includes('width:44px;height:44px'));
  assert.ok(filtered.css.includes('rotate(360deg)'));
  assert.match(filtered.css, /prefers-reduced-motion:\s*reduce/);
  const open = render(Toggle, { minimized: false, filtersActive: true });
  assert.ok(open.html.includes('data-cue="quiet"'));
  assert.ok(open.html.includes('aria-expanded="true"'));
  assert.ok(open.html.includes('Hide retrieval controls · Filters active'));
});

test('Retrieval replaces the primary Sort heading with a decorative icon-panel backdrop', async () => {
  const { default: Controls } = await load('components/Retrieval/RetrievalControlPanel.jsx');
  const { html, css } = render(Controls, {
    selectedSort: 'name', sortOptions: [{ key: 'name', label: 'Item Name' }, { key: 'name_desc', label: 'Item Name (Descending)' }],
  });
  assert.equal((html.match(/>Sort</g) || []).length, 1);
  assert.match(html, /<span[^>]*aria-hidden="true"[^>]*>Sort<\/span>/);
  assert.ok(html.includes('aria-label="Sort by Item Name"'));
  assert.ok(html.includes('aria-label="Sort direction: Ascending"'));
  assert.ok(css.includes('pointer-events:none'));
  assert.ok(css.includes('opacity:.075'));
  assert.ok(css.includes('>button{position:relative;z-index:1;}'));
  assert.ok(css.includes('min-height:44px'));
});

test('shared sort backdrop is opt-in and advanced selection keeps a readable name', async () => {
  const { default: Sort } = await load('components/Retrieval/SortFieldPanel.jsx');
  const options = [{ key: 'name', label: 'Name', icon: h('svg') }];
  assert.ok(!render(Sort, { options, iconOnly: true }).html.includes('>Sort</span>'));
  const { default: Controls } = await load('components/Retrieval/RetrievalControlPanel.jsx');
  const { html } = render(Controls, {
    selectedSort: 'priority', sortOptions: [{ key: 'name', label: 'Item Name' }, { key: 'priority', label: 'Keep Priority' }],
  });
  assert.ok(html.includes('>Keep Priority</span>'));
});

test('hidden Retrieval finder retains its children, removes layout and keyboard access, and respects reduced motion', async () => {
  const { default: Presence } = await load('components/Retrieval/RetrievalFinderPresence.jsx');
  const children = h('input', { defaultValue: 'retained draft', 'aria-label': 'Draft fixture' });
  const closed = render(Presence, { visible: false, children });
  assert.match(closed.html, /data-phase="closed"/);
  assert.match(closed.html, /aria-hidden="true" inert=""/);
  assert.match(closed.html, /value="retained draft"/);
  assert.ok(closed.css.includes("[data-phase='closed']{display:none;}"));
  assert.match(closed.css, /prefers-reduced-motion:\s*reduce/);
  assert.ok(closed.css.includes('240ms cubic-bezier(.22, 1, .36, 1) both'));
  assert.ok(closed.css.includes('grid-template-rows:0fr'));
  assert.ok(closed.css.includes('transform:translateY(-100%)'));
  assert.ok(!closed.css.includes('opacity:'));
  const open = render(Presence, { visible: true, children });
  assert.match(open.html, /data-phase="open"/);
  assert.match(open.html, /aria-hidden="false"/);
  assert.ok(!open.html.includes('inert=""'));
});

test('Retrieval centers the extension tab and enables reset for mutable filters without changing sort', async () => {
  const { default: Controls } = await load('components/Retrieval/RetrievalControlPanel.jsx');
  const props = { selectedSort: 'name', sortOptions: [{ key: 'name', label: 'Item Name' }] };
  const idle = render(Controls, props);
  assert.match(idle.html, /data-filters-active="false"/);
  assert.match(idle.html, /aria-label="Reset all filters"[^>]*disabled=""/);
  const active = render(Controls, { ...props, activeChips: [{ type: 'categories', key: 'clothing', label: 'Category: Clothing' }] });
  assert.match(active.html, /data-filters-active="true"/);
  assert.ok(!/aria-label="Reset all filters"[^>]*disabled/.test(active.html));
  assert.ok(!active.html.includes('>Clear all<'));
  assert.ok(active.css.includes('margin:0 auto'));
  assert.ok(active.css.includes(":not([open])>summary"));
  assert.ok(active.css.includes('text-shadow:0 0 8px'));
  assert.ok(!/aria-label="Reset all filters"[^>]*disabled/.test(render(Controls, { ...props, hasSearchFilters: true }).html));
});

test('Operations and Retrieval share finder composition with route-specific filter adapters', async () => {
  const { default: Operations } = await load('components/OperationsFilters/OperationsControlPanel.jsx');
  const operations = render(Operations, { locations: [{ _id: 'fixture', room: 'Garage', vicinity: 'Shelf' }],
    sortBy: 'boxId', sortDirection: 'asc', locationFilter: 'all', categoryFilter: 'all', ownerFilter: 'all', keepPriorityFilter: 'all' });
  const { default: Retrieval } = await load('components/Retrieval/RetrievalControlPanel.jsx');
  const retrieval = render(Retrieval, { selectedSort: 'random' });
  for (const output of [operations, retrieval]) {
    assert.ok(output.html.includes('data-shared-finder-panel="true"'));
    assert.ok(output.html.includes('Reset all filters'));
  }
  assert.ok(retrieval.css.includes('font-weight:350'));
  assert.ok(operations.html.includes('data-location-layer="room"'));
  assert.ok(operations.html.includes('>Sort</span>'));
  assert.ok(!operations.html.includes('Reshuffle'));
  assert.match(operations.html, /aria-label="More filters" title="More filters" aria-expanded="false"/);
  assert.ok(!operations.html.includes('>More filters<'));
  assert.ok(!operations.html.includes('>Reset<'));
});

test('stacked Location renders one icon carousel over the shared painted wall', async () => {
  const { default: Picker } = await load('components/InventoryFilters/LocationBranchFilter.jsx');
  const locations = [{ room: 'Bedroom', vicinity: 'Closet' }, { room: 'Garage', vicinity: 'North Shelf', specifics: 'Ledge', exactSpot: 'Blue bin' }];
  const root = render(Picker, { locations, stacked: true, extraRoomOptions: [{ key: '[Unknown]', label: '[Unknown]' }] });
  assert.match(root.html, /data-location-layer="room"/);
  assert.match(root.html, /aria-hidden="true"[^>]*>Rooms<\/span>/);
  assert.match(root.html, /aria-label="Bedroom"[^>]*title="Room: Bedroom"[^>]*><svg/);
  assert.match(root.html, /aria-label="\[Unknown\]"/);
  assert.ok(!root.html.includes('aria-expanded'));
  assert.ok(!root.html.includes('Browse Room options'));
  assert.ok(!root.html.includes('Location All locations'));
  assert.equal((root.html.match(/aria-label="Filter by /g) || []).length, 1);
  assert.ok(root.css.includes('opacity:.075'));
  assert.ok(root.css.includes('scroll-snap-type:x proximity'));
  assert.ok(root.css.includes('scrollbar-width:none'));
  assert.match(root.css, /::-webkit-scrollbar\{display:none;/);
  assert.ok(root.css.includes('height:50px'));
  assert.ok(root.css.includes('height:48px'));
  assert.ok(root.css.includes('min-height:44px'));
  assert.ok(root.css.includes('opacity:.72'));
  assert.ok(root.css.includes('opacity:.23'));
  assert.ok(root.css.includes('touch-action:pan-x pan-y'));
  assert.match(root.html, /data-canonical="true"/);
  assert.match(root.html, /data-looping="false"/);
  assert.match(root.css, /prefers-reduced-motion:\s*reduce/);
  const deep = render(Picker, { locations, stacked: true, value: locations[1] });
  assert.match(deep.html, /data-location-layer="exactSpot"/);
  assert.equal((deep.html.match(/aria-label="Filter by /g) || []).length, 1);
  assert.match(deep.html, /aria-label="Browse Room options"/);
  assert.match(deep.html, /aria-label="Clear selected location"/);
  assert.ok(deep.css.includes('height:94px'));
  assert.ok(!deep.html.includes('aria-expanded'));
  assert.match(deep.html, /aria-label="Blue bin"[^>]*aria-pressed="true"/);
  assert.ok(!deep.html.includes('aria-label="Filter by vicinity"'));
  const original = render(Picker, { locations, value: locations[1] });
  assert.ok(!original.html.includes('data-location-layer'));
  assert.match(original.html, /aria-expanded="true"/);
  assert.equal((original.html.match(/aria-label="Filter by /g) || []).length, 4);
});

test('Location selections retain reset without duplicating descendant chips', async () => {
  const { default: Controls } = await load('components/Retrieval/RetrievalControlPanel.jsx');
  const { html } = render(Controls, {
    activeChips: [{ type: 'locations', key: 'garage', label: 'Location: Garage' }],
    selectedSort: 'name', sortOptions: [{ key: 'name', label: 'Item Name' }],
  });
  assert.ok(!html.includes('Remove Location:'));
  assert.ok(!/aria-label="Reset all filters"[^>]*disabled/.test(html));
  assert.match(html, /data-filters-active="false"/);
});
