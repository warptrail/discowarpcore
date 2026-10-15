const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const { MemoryRouter } = requireFrontend('react-router-dom');
const { ServerStyleSheet } = requireFrontend('styled-components');

async function load(file, exportName = 'default') {
  const { outputFiles } = await requireFrontend('esbuild').build({
    entryPoints: [path.join(frontend, 'src/components/OperationsQuickPeek', file)],
    bundle: true, write: false, format: 'cjs', platform: 'node', mainFields: ['module', 'main'],
    external: ['react', 'react-dom', 'react-router-dom', 'styled-components', '../Intake/IntakeQuickItemMaker', '../Intake/IntakeMoveExistingTab'], jsx: 'automatic',
    define: { 'import.meta.env': '{}' }, logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)((id) => id === 'styled-components'
    ? Object.assign(requireFrontend(id).default, requireFrontend(id)) : requireFrontend(id), module, module.exports);
  return exportName ? module.exports[exportName] : module.exports;
}
function render(component) {
  const sheet = new ServerStyleSheet();
  try {
    return { html: renderToStaticMarkup(sheet.collectStyles(React.createElement(MemoryRouter, null, component))), css: sheet.getStyleTags() };
  } finally { sheet.seal(); }
}
const item = { _id: 'synthetic-item', name: 'Test hood', category: 'Clothing', description: 'Test description', quantity: 1, tags: ['test'] };

test('item header uses quiet side metadata and one rail for placement, actions and navigation', async () => {
  const Controls = await load('QuickPeekItemActionPanel.jsx');
  const Header = await load('QuickPeekBoxHeader.jsx');
  const output = render(React.createElement(Header, {
    box: { box_id: '100', label: 'Test trunk', location: 'Living Room' }, itemFocused: true,
    itemPosition: 13, itemTotal: 17,
    onReturnToItems: () => {}, onClose: () => {}, onToggleExpanded: () => {},
    itemActionPanel: React.createElement(Controls, { embedded: true, item, box: { _id: 'synthetic-source' }, onOpenFullItem: () => {}, onToggleDeclutterDeck: () => {} }),
  }));
  for (const label of ['Open actions for Test hood', 'Change placement for Test hood', 'Add Test hood to Declutter Deck', 'Open full item: Test hood']) {
    assert.ok(output.html.includes(`aria-label="${label}"`));
  }
  assert.equal((output.html.match(/data-control="deck"/g) || []).length, 1);
  assert.ok(output.html.includes('13 / 17') && !output.html.includes('Item 13 / 17') && output.html.includes('#100') && output.html.includes('Living Room'));
  assert.ok(output.html.includes('aria-label="Item 13 of 17"'));
  assert.ok(!output.html.includes('8 / 52') && !output.html.includes('data-control="position"'));
  assert.equal((output.html.match(/data-control="placement"/g) || []).length, 1);
  assert.ok(output.html.includes('data-control="deck" aria-label="Add Test hood to Declutter Deck" aria-pressed="false" aria-busy="false"'));
  assert.ok(output.html.includes('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'));
  assert.ok(!output.html.includes('>Deck</button>'));
  assert.ok(output.css.includes('min-width:44px;height:44px'));
  assert.ok(output.css.includes('padding:2px;gap:2px;border:1px solid var(--dw-border)'));
  assert.ok(output.css.includes('background:var(--dw-surface-raised)'));
  for (const label of ['Return to box item list', 'Expand box quick peek', 'Close box quick peek']) assert.ok(output.html.includes(`aria-label="${label}"`));
  assert.equal((output.html.match(/aria-label="Quick Peek controls"/g) || []).length, 1);
  assert.ok(output.html.indexOf('aria-label="Item 13 of 17"') < output.html.indexOf('Recorded location'));
  assert.ok(!output.html.includes('data-quick-peek-close-edge'));
  assert.ok(output.css.includes('font-size:.65rem;font-weight:400;white-space:nowrap'));
  assert.match(output.css, /prefers-reduced-motion:\s*reduce/);
});

test('header locations preserve all four registry tiers, wrap long values, and do not infer legacy tiers', async () => {
  const Header = await load('QuickPeekBoxHeader.jsx');
  const props = { box: { box_id: '091', label: 'Test scale', locationId: 'saved-location' }, locations: [
    { _id: 'saved-location', room: 'Garage', vicinity: 'North Shelf', specifics: 'Concrete Ledge', exactSpot: 'Behind the blue toolbox' },
  ] };
  const { html, css } = render(React.createElement(Header, props));
  for (const text of ['Room', 'Vicinity', 'Specifics', 'Exact spot', 'Garage', 'North Shelf', 'Concrete Ledge', 'Behind the blue toolbox']) assert.ok(html.includes(text));
  assert.equal((html.match(/data-recorded="true"/g) || []).length, 4);
  assert.ok(css.includes('overflow-wrap:anywhere'));
  assert.ok(css.includes('grid-template-columns:repeat(4, minmax(0, 1fr))'));
  assert.ok(css.includes('grid-template-columns:repeat(2, minmax(0, 1fr))'));
  const partial = render(React.createElement(Header, { box: { locationId: { room: 'Office' } } })).html;
  assert.equal((partial.match(/Not recorded/g) || []).length, 3);
  const legacy = render(React.createElement(Header, { box: { location: 'Office · unknown legacy shelf' } })).html;
  assert.ok(legacy.includes('Recorded location') && legacy.includes('Office · unknown legacy shelf'));
  assert.ok(!legacy.includes('data-quick-peek-location'));
  const adrift = render(React.createElement(Header, { box: { systemType: 'orphaned' } })).html;
  assert.ok(adrift.includes('No box assigned') && !adrift.includes('data-quick-peek-location'));
});

test('sheet resizing has one toolbar control, dock has one close, and Close uses whole-panel dismissal', async () => {
  const Header = await load('QuickPeekBoxHeader.jsx');
  const expanded = render(React.createElement(Header, { itemFocused: true, expanded: true })).html;
  assert.equal((expanded.match(/data-quick-peek-drag-handle/g) || []).length, 1);
  assert.ok(expanded.includes('aria-label="Collapse box quick peek" aria-expanded="true"'));
  const docked = render(React.createElement(Header, { itemFocused: true, docked: true })).html;
  assert.ok(docked.includes('Close box inspector') && !docked.includes('data-quick-peek-drag-handle'));
  assert.equal((docked.match(/Close box inspector/g) || []).length, 1);
  const source = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/OperationsBoxQuickPeek.jsx'), 'utf8');
  assert.ok(source.includes('onClose={onDismiss || onClose}'));
  const controls = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/QuickPeekHeaderControls.jsx'), 'utf8');
  for (const event of ['onPointerDown', 'onPointerUp', 'onPointerCancel']) assert.ok(controls.includes(`${event}?.(event)`));
});

test('box browsing merges navigation into the control center with no duplicate header rail', async () => {
  const Header = await load('QuickPeekBoxHeader.jsx');
  const Center = await load('QuickPeekControlCenter.jsx');
  const Navigation = await load('QuickPeekHeaderControls.jsx');
  const header = render(React.createElement(Header, { box: { box_id: '001', label: 'Test drawer' } })).html;
  assert.ok(!header.includes('Quick Peek controls') && !header.includes('Close box quick peek'));
  const output = render(React.createElement(Center, {
    notesOpen: false, count: 36, sortLabel: 'Name', sortSymbol: 'A↕',
    navigationControls: React.createElement(Navigation, { embedded: true, expanded: true }),
  }));
  for (const label of ['Quick Peek views and actions', 'Sort items by Name', 'Open full box', 'Collapse box quick peek', 'Close box quick peek']) {
    assert.ok(output.html.includes(`aria-label="${label}"`));
  }
  assert.equal((output.html.match(/data-quick-peek-drag-handle/g) || []).length, 1);
  assert.equal((output.html.match(/aria-label="Close box quick peek"/g) || []).length, 1);
  assert.ok(output.html.includes('Items') && output.html.includes('Notes'));
  assert.ok(output.html.includes('aria-label="Notes" title="Box notes"'));
  assert.ok(!output.html.includes('>Notes<'));
  assert.ok(!output.html.includes('>Open full box'));
  assert.ok(output.css.includes('min-height:44px;min-width:44px'));
  assert.ok(output.css.includes('data-quick-peek-drag-handle]{touch-action:none'));
  assert.ok(output.css.includes('padding:0;border:0;border-radius:0;background:transparent'));
  const notes = render(React.createElement(Center, { notesOpen: true, count: 36, sortLabel: 'Name', isAdrift: true })).html;
  assert.match(notes, /aria-label="Sort items by Name"[^>]*disabled=""/);
  assert.ok(!notes.includes('aria-label="Open all items"'));
  assert.ok(!notes.includes('aria-label="Open full box"'));
  const source = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/OperationsBoxQuickPeek.jsx'), 'utf8');
  const footer = source.slice(source.indexOf('<QuickPeekControlCenter'));
  for (const prop of ['onToggleExpanded={handleDetentClick}', 'onClose={onDismiss || onClose}', 'onPointerDown={handlePointerDown}', 'onPointerUp={finishGesture}', 'onPointerCancel={cancelGesture}']) {
    assert.ok(footer.includes(prop));
  }
});

test('box item-plus control is labelled, lazy, box-aware, and reuses existing composers and move Undo', async () => {
  const Add = await load('QuickPeekAddItems.jsx');
  const boxed = render(React.createElement(Add, { box: { _id: 'synthetic-box', box_id: '091' } })).html;
  assert.ok(boxed.includes('aria-label="Add item to this box"') && boxed.includes('aria-haspopup="dialog"'));
  assert.ok(!boxed.includes('role="dialog"'));
  const unboxed = render(React.createElement(Add, { box: { systemType: 'orphaned' } })).html;
  assert.ok(unboxed.includes('aria-label="Create unboxed item"') && !unboxed.includes('disabled=""'));
  assert.match(render(React.createElement(Add, { box: {} })).html, /disabled=""/);
  const source = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/QuickPeekAddItems.jsx'), 'utf8');
  for (const contract of ["lazy(() => import('../Intake/IntakeQuickItemMaker'))", "lazy(() => import('../Intake/IntakeMoveExistingTab'))", 'useDialogFocus(dialogRef, close, view !== null)', 'currentBox={box}', "targetBox={isAdrift ? null : box}", 'sourceCompartmentKey', 'showPlacementUndo', 'sticky: true', 'disabled={busy}']) assert.ok(source.includes(contract));
  const main = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/OperationsBoxQuickPeek.jsx'), 'utf8');
  assert.ok(main.includes('addItemsControl={<QuickPeekAddItems key={boxId} box={box} expanded={expanded} onItemsChanged={onItemSaved} />}'));
});

test('add-item choices share a borderless compact command rail with accessible targets and reduced motion', async () => {
  const S = await load('QuickPeekAddItems.styles.js', null);
  const { html, css } = render(React.createElement(S.ChoiceRail, { role: 'group', 'aria-label': 'Add item choices' },
    React.createElement(S.Choice, { type: 'button', 'aria-label': 'Create item here' }, 'Create'),
    React.createElement(S.Choice, { type: 'button', 'aria-label': 'Move existing item here' }, 'Move')));
  assert.ok(html.includes('aria-label="Create item here"') && html.includes('aria-label="Move existing item here"'));
  assert.ok(css.includes('grid-template-columns:repeat(2, minmax(0, 1fr))'));
  assert.ok(css.includes('min-height:48px;min-width:0'));
  assert.ok(css.includes('border:0;border-radius:2px;background:transparent'));
  assert.ok(css.includes('outline-offset:-2px'));
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  const source = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/QuickPeekAddItems.jsx'), 'utf8');
  assert.ok(source.includes('<S.ChoiceRail role="group" aria-label="Add item choices">'));
  assert.ok(source.includes("view !== 'menu' ? <small>"));
});

const captureProps = {
  name: 'Synthetic sensor', description: 'Small device', notes: '', tags: [], tagDraft: '',
  category: 'miscellaneous', mode: 'inBox', targetBoxId: 'synthetic-box', quantity: 1,
  onNameChange() {}, onDescriptionChange() {}, onNotesChange() {}, onTagsChange() {},
  onTagDraftChange() {}, onStageTag() {}, onCategoryChange() {}, onSubmit() {}, onCancel() {},
};

test('Quick Peek console capture is opt-in, with icon-led metadata and accessible compact actions', async () => {
  const Capture = await load('../Intake/QuickItemCaptureForm.jsx');
  const { html, css } = render(React.createElement(Capture, { ...captureProps, variant: 'console', canSubmit: true }));
  for (const label of ['Quick item capture', 'Item name', 'Quick item metadata', 'Full item intake', 'Cancel']) {
    assert.ok(html.includes(`aria-label="${label}"`));
  }
  assert.ok(html.includes('aria-expanded="true"') && html.includes('data-filled="true"'));
  assert.ok(html.includes('>Capture</span>') && !html.includes('>Cancel</button>'));
  assert.ok(html.includes('focusable="false"') && html.includes('required=""'));
  assert.ok(css.includes('min-height:56px') && css.includes('min-height:44px;min-width:44px'));
  assert.ok(css.includes('border-radius:2px 12px 2px 2px') && css.includes('background:var(--dw-cyan)'));
  assert.ok(css.includes('max-height:160px;overflow:auto'));
  assert.ok(css.includes('outline:none;border-color:var(--dw-cyan)'));
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  const parent = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/QuickPeekAddItems.jsx'), 'utf8');
  const maker = fs.readFileSync(path.join(frontend, 'src/components/Intake/IntakeQuickItemMaker.jsx'), 'utf8');
  assert.ok(parent.includes('compact captureVariant="console"') && maker.includes('variant={captureVariant}'));
});

test('default compact capture retains its original presentation and console busy state blocks save and cancel', async () => {
  const Capture = await load('../Intake/QuickItemCaptureForm.jsx');
  const original = render(React.createElement(Capture, { ...captureProps, canSubmit: true }));
  assert.ok(original.html.includes('>Full item intake</a>') && original.html.includes('>Cancel</button>'));
  assert.ok(!original.css.includes('min-height:56px') && !original.html.includes('<svg'));
  const busy = render(React.createElement(Capture, { ...captureProps, variant: 'console', busy: true, canSubmit: false })).html;
  assert.match(busy, /<button(?=[^>]*aria-label="Cancel")(?=[^>]*disabled="")[^>]*>/);
  assert.match(busy, /type="submit"[^>]*disabled=""/);
  assert.ok(busy.includes('aria-disabled="true"') && busy.includes('Saving…'));
});

test('box-only header has no box-position counter and placement is unavailable for gone or unidentified items', async () => {
  const Header = await load('QuickPeekBoxHeader.jsx');
  const Controls = await load('QuickPeekItemActionPanel.jsx');
  const { html } = render(React.createElement(Header, {
    box: { box_id: '100', label: 'Test trunk' }, itemFocused: false, itemPosition: 13, itemTotal: 17,
  }));
  assert.ok(!html.includes('Item 13') && !html.includes('role="status"'));
  for (const candidate of [{ name: 'Missing identity' }, { ...item, item_status: 'gone' }]) {
    assert.match(render(React.createElement(Controls, { item: candidate, box: { _id: 'synthetic-source' } })).html, /data-control="placement"[^>]*disabled=""/);
  }
  assert.ok(!render(React.createElement(Controls, { item })).html.includes('data-control="placement"'));
});

test('focused item header has a transparent keyboard-accessible return surface separate from its controls', async () => {
  const Header = await load('QuickPeekBoxHeader.jsx');
  const props = {
    box: { box_id: '001', label: 'Test drawer', location: 'Office' },
    itemFocused: true, onReturnToItems: () => {}, canSelectPrevious: true, canSelectNext: true,
    itemActionPanel: React.createElement('div', { role: 'group', 'aria-label': 'Synthetic item controls' },
      React.createElement('button', { type: 'button' }, 'Synthetic action')),
  };
  const { html, css } = render(React.createElement(Header, props));
  assert.match(html, /<button[^>]*aria-label="Return to box item list from header"[^>]*data-quick-peek-return-to-items="true"[^>]*><\/button>/);
  assert.ok(html.includes('aria-label="Previous box"') && html.includes('aria-label="Next box"'));
  assert.ok(html.indexOf('aria-label="Synthetic item controls"') > html.indexOf('data-quick-peek-return-to-items'));
  assert.ok(css.includes('inset:0;z-index:0;min-height:44px'));
  assert.ok(css.includes('background:transparent;cursor:pointer;touch-action:none'));
  assert.ok(css.includes('outline:2px solid var(--dw-cyan);outline-offset:-2px'));
  for (const overrides of [{ itemFocused: false }, { onReturnToItems: undefined }]) {
    assert.ok(!render(React.createElement(Header, { ...props, ...overrides })).html.includes('data-quick-peek-return-to-items'));
  }
  const adrift = render(React.createElement(Header, { ...props, box: { systemType: 'orphaned', label: 'Items Adrift' } })).html;
  assert.ok(adrift.includes('aria-label="Return to unboxed item list from header"'));
  const source = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/OperationsBoxQuickPeek.jsx'), 'utf8');
  assert.ok(source.includes('onReturnToItems={backToItemList}'));
});

test('compact placement picker puts its label in the placeholder and keeps a persistent accessible name', async () => {
  const Picker = await load('../MoveItemToOtherBox.jsx');
  const compact = render(React.createElement(Picker, {
    compact: true, filterTrailingControl: React.createElement('button', { 'aria-label': 'Close placement controls' }),
  }));
  assert.ok(compact.html.includes('placeholder="Move to box #…"'));
  assert.ok(compact.html.includes('aria-label="Destination box ID prefix search"'));
  assert.ok(compact.html.includes('aria-label="Close placement controls"'));
  assert.ok(!compact.html.includes('>Destination Box ID</label>'));
  assert.ok(compact.css.includes('grid-template-columns:minmax(0, 1fr) auto'));
  const standard = render(React.createElement(Picker)).html;
  assert.ok(standard.includes('>Destination Box ID</label>'));
  assert.ok(standard.includes('placeholder="Type box ID prefix (e.g. 107)"'));
});

test('Deck retains accessible selected, pending, missing-item and gone-item states', async () => {
  const Controls = await load('QuickPeekItemActionPanel.jsx');
  const selected = render(React.createElement(Controls, { item, inDeclutterDeck: true })).html;
  assert.ok(selected.includes('aria-label="Remove Test hood from Declutter Deck" aria-pressed="true"'));
  assert.ok(selected.includes('m7 14 2 2 4-4'));
  const pending = render(React.createElement(Controls, { item, declutterPending: true })).html;
  assert.match(pending, /data-control="deck"[^>]*aria-busy="true"[^>]*disabled=""/);
  assert.ok(pending.includes('Updating Declutter Deck…'));
  for (const candidate of [{ name: 'Missing identity' }, { ...item, item_status: 'gone' }]) {
    assert.match(render(React.createElement(Controls, { item: candidate })).html, /data-control="deck"[^>]*disabled=""/);
  }
});

test('item carousel retains metadata without its old duplicate Deck control', async () => {
  const Carousel = await load('QuickPeekItemCarousel.jsx');
  const { html } = render(React.createElement(Carousel, { item, position: 13, total: 17 }));
  for (const text of ['Test hood', 'Description', 'Test description', 'Category', 'Clothing', '#test']) assert.ok(html.includes(text));
  assert.ok(!html.includes('Declutter Deck') && !html.includes('>Deck</button>'));
  assert.ok(html.includes('aria-label="Previous item"') && html.includes('aria-label="Next item"'));
});

test('header uses the existing shared Deck controller rather than a new mutation or duplicate carousel action', () => {
  const source = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/OperationsBoxQuickPeek.jsx'), 'utf8');
  const header = source.slice(source.indexOf('<QuickPeekBoxHeader'), source.indexOf('<S.DeckContent'));
  const carousel = source.slice(source.indexOf('<QuickPeekItemCarousel'), source.indexOf('<S.ItemsHeader'));
  assert.ok(header.includes('onToggleDeclutterDeck={toggleDeclutterDeck}'));
  assert.ok(header.includes('inDeclutterDeck={inDeclutterDeck}') && header.includes('declutterPending={declutterPending}'));
  assert.ok(!header.includes('includeDeck={false}'));
  assert.ok(!carousel.includes('onToggleDeclutterDeck') && !carousel.includes('inDeclutterDeck'));
});

test('both quick-update popovers use the mobile sheet scroll boundary and toolbar gestures do not drag the sheet', () => {
  const source = fs.readFileSync(path.join(frontend, 'src/components/OperationsQuickPeek/QuickPeekItemActionPanel.jsx'), 'utf8');
  assert.equal((source.match(/data-quick-peek-scroll-region/g) || []).length, 2);
  const toolbar = source.slice(source.indexOf('<Controls.Toolbar'), source.indexOf('<Controls.Button'));
  for (const event of ['onPointerDown', 'onPointerUp', 'onPointerCancel']) assert.ok(toolbar.includes(`${event}={(event) => event.stopPropagation()}`));
});
