const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');
const { MemoryRouter } = requireFrontend('react-router-dom');

async function load(file) {
  const source = typeof file === 'string' ? { entryPoints: [path.join(frontend, 'src', file)] }
    : { stdin: { contents: file.contents, resolveDir: path.join(frontend, 'src'), loader: 'jsx' } };
  const { outputFiles } = await requireFrontend('esbuild').build({ ...source, bundle: true, write: false, format: 'cjs', platform: 'node', mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react-router-dom', 'styled-components'], jsx: 'automatic', logLevel: 'silent' });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)((id) => id === 'styled-components' ? Object.assign(requireFrontend(id).default, requireFrontend(id)) : requireFrontend(id), module, module.exports);
  return module.exports;
}
const summary = { id: 'item1', name: 'Adapter', description: 'Old description', notes: 'Old notes', categoryKey: 'electronics',
  tags: ['audio'], boxId: 'databaseBoxId', boxNumber: '201', placementLabel: '201:A', boxName: 'Audio box',
  locationLabel: 'Garage · Shelf', itemHref: '/items/item1', boxHref: '/boxes/201' };
const detail = { _id: 'item1', name: 'Adapter', description: '', notes: '', category: 'electronics', tags: ['audio'], quantity: 1,
  box: { _id: 'databaseBoxId', box_id: '201', placementLabel: '201:A', label: 'Audio box', locationId: {
    room: 'Garage', vicinity: 'Work bench', specifics: 'Upper shelf', exactSpot: 'Left edge',
  } }, usageHistory: [], checkHistory: [], maintenanceHistory: [] };

let model;
test.before(async () => { model = await load('components/Retrieval/retrievalItemControlModel.js'); });

test('Overview retains recorded four-tier location and compartment identity, without substituting the database ID', () => {
  const answer = model.buildRetrievalItemAnswer(summary, detail);
  assert.equal(answer.boxId, '201:A');
  assert.equal(answer.boxRecordId, 'databaseBoxId');
  assert.deepEqual(answer.placement.tiers, { room: 'Garage', vicinity: 'Work bench', specifics: 'Upper shelf', exactSpot: 'Left edge' });
  assert.equal(answer.item.description, '');
  assert.equal(answer.item.notes, '');
});

test('item panels inherit the physical box palette for compartments and retain neutral unboxed colors', async () => {
  const { getRetrievalItemPanelTheme } = await load('components/Retrieval/retrievalItemPanelTheme.js');
  const { getBoxTheme } = await load('util/inventoryColorTheme.js');
  const compartment = getRetrievalItemPanelTheme({ ...summary, boxNumber: '201', placementLabel: '201:A' });
  assert.equal(compartment['--box-primary'], getBoxTheme('201').primary);
  assert.equal(getRetrievalItemPanelTheme({ boxNumber: '001' })['--box-primary'], getBoxTheme('001').primary);
  assert.equal(getRetrievalItemPanelTheme({ boxId: 'databaseBoxId' })['--box-primary'], getBoxTheme(null).primary);
});

test('legacy and missing locations stay explicit, and a fetched unboxed record overrides its old summary', () => {
  const fallback = model.buildRetrievalItemAnswer(summary);
  assert.equal(fallback.placement.legacyLabel, 'Garage · Shelf');
  assert.deepEqual(Object.values(fallback.placement.tiers), ['', '', '', '']);
  const unboxed = model.buildRetrievalItemAnswer(summary, { _id: 'item1', box: null, location: '' });
  assert.equal(unboxed.unboxed, true);
  assert.equal(unboxed.boxId, '');
  assert.equal(unboxed.placement.legacyLabel, '');
  assert.deepEqual(Object.values(unboxed.placement.tiers), ['', '', '', '']);
  assert.equal(model.buildRetrievalItemAnswer({ id: 'orphan', locationLabel: 'Unknown' }).placement.legacyLabel, '');
});

test('a boxed item legacy label does not override the fetched empty box location', () => {
  const fetched = { ...detail, location: 'Office', box: { ...detail.box, location: '', locationId: null } };
  const resolved = { ...summary, locationLabel: 'Office' };
  const answer = model.buildRetrievalItemAnswer(resolved, fetched);
  assert.equal(answer.placement.legacyLabel, '');
  assert.deepEqual(Object.values(answer.placement.tiers), ['', '', '', '']);
  const rows = model.getRetrievalItemControlModel(resolved, fetched).dataPages.flatMap((page) => page.rows);
  assert.equal(rows.find((row) => row.label === 'Location').value, '—');
  assert.ok(!rows.some((row) => /legacy.*location/i.test(row.label)));
  assert.ok(!rows.some((row) => row.value === 'Office'));
});

test('field saves merge into result summaries while retaining populated location and honoring cleared text', () => {
  const next = model.applyRetrievalItemUpdate(summary, detail, { _id: 'item1', box: 'databaseBoxId',
    name: 'Updated adapter', category: 'clothing', description: '', notes: '', tags: [] });
  assert.deepEqual(next.detail.box, detail.box);
  assert.equal(next.summary.name, 'Updated adapter');
  assert.equal(next.summary.categoryKey, 'clothing');
  assert.equal(next.summary.description, '');
  assert.equal(next.summary.notes, '');
  assert.deepEqual(next.summary.tags, []);
  assert.equal(next.summary.boxNumber, '201');
  assert.equal(next.summary.locationLabel, summary.locationLabel);
  const adrift = model.applyRetrievalItemUpdate({ ...summary, boxNumber: '', placementLabel: '' }, { _id: 'item1', box: null }, { location: 'Front porch' });
  assert.equal(adrift.summary.locationLabel, 'Front porch');
});

test('all five sections expose supported quick edits while inherited location and consumable care stay read-only', async () => {
  // Load together so the presenter and provider share one context instance.
  const { Panel, Provider } = await load({ contents: `
    export { default as Panel } from './components/Retrieval/RetrievalExpandedPanel.jsx';
    export { default as Provider } from './components/Retrieval/RetrievalItemEditorProvider.jsx';
  ` });
  const render = (activeSectionKey, itemDetail = detail) => renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(Provider, { item: itemDetail, detailResource: { status: 'ready' }, onItemUpdated: () => {} },
      React.createElement(Panel, { item: summary, panelId: 'test-panel', detailResource: { status: 'ready', data: itemDetail },
        activeSectionKey, onLifecycleAction: () => {} }))));
  const overview = render('overview');
  assert.equal((overview.match(/role="tab"/g) || []).length, 5);
  for (const section of ['Overview', 'Notes', 'Log', 'Data', 'Commands']) assert.ok(overview.includes(section));
  assert.ok(overview.includes('Left edge'));
  for (const label of ['Name', 'Category', 'Quantity', 'Description', 'Tags']) assert.ok(overview.includes(`aria-label="Edit ${label}"`));
  assert.ok(!overview.includes('aria-label="Edit Location"'));
  assert.ok(render('overview', { ...detail, box: null, location: 'Shelf' }).includes('aria-label="Edit Location"'));
  assert.ok(render('commands').includes('aria-label="Edit Usage history"'));
  assert.ok(render('log').includes('aria-label="Edit Check history"'));
  const metadata = render('data');
  assert.ok(metadata.includes('aria-label="Edit Name"'));
  assert.ok(metadata.includes('aria-label="Edit Notes"'));
  assert.ok(!metadata.includes('aria-label="Edit Location"'));
  const consumable = render('data', { ...detail, isConsumable: true });
  assert.ok(!consumable.includes('aria-label="Edit Maintenance History"'));
  assert.ok(!consumable.includes('aria-label="Edit Maintenance Notes"'));
  const legacy = render('overview', { ...detail, location: 'Office', box: { ...detail.box, locationId: null, location: '' } });
  assert.ok(legacy.includes('No box location recorded.'));
  assert.ok(!legacy.includes('Legacy item location:'));
  assert.ok(!legacy.includes('Office'));
  assert.ok(!legacy.includes('Recorded location: Office'));
  assert.ok(!render('data', { ...detail, location: 'Office', box: { ...detail.box, locationId: null, location: '' } }).includes('Office'));
});

test('quick editors wait for a ready record, a supported field and an update handler', async () => {
  const { Field, Provider } = await load({ contents: `
    export { default as Field } from './components/Retrieval/RetrievalEditableField.jsx';
    export { default as Provider } from './components/Retrieval/RetrievalItemEditorProvider.jsx';
  ` });
  const render = (status, handler, fieldKey) => renderToStaticMarkup(React.createElement(Provider,
    { item: detail, detailResource: { status }, onItemUpdated: handler },
    React.createElement(Field, { fieldKey }, 'Current value')));
  for (const status of ['loading', 'error']) assert.ok(!render(status, () => {}, 'name').includes('<button'));
  assert.ok(!render('ready', undefined, 'name').includes('<button'));
  assert.ok(!render('ready', () => {}, 'item-id').includes('<button'));
  assert.ok(render('ready', () => {}, 'name').includes('aria-haspopup="dialog"'));
  const action = renderToStaticMarkup(React.createElement(Provider,
    { item: detail, detailResource: { status: 'ready' }, onItemUpdated: () => {} },
    React.createElement(Field, { fieldKey: 'notes', variant: 'action' })));
  assert.ok(action.includes('aria-label="Edit Notes"'));
  assert.ok(action.includes('>Edit</button>'));
  assert.ok(!action.includes('<svg'));
});

test('attribute popups remain inside their parent panel, including a narrow keyboard viewport', async () => {
  const { getRetrievalFieldPopoverBounds: bounds } = await load('components/Retrieval/retrievalFieldPopoverGeometry.js');
  const panel = { left: 264, right: 984, top: 97, bottom: 857 };
  const desktop = bounds({ panel, viewport: { left: 0, right: 1248, top: 0, bottom: 954 },
    anchor: { left: 900, top: 720, bottom: 764 }, height: 300 });
  assert.ok(desktop.left >= panel.left && desktop.left + desktop.width <= panel.right);
  assert.ok(desktop.top >= panel.top && desktop.top + 300 <= panel.bottom);
  const phone = bounds({ panel: { left: 0, right: 320, top: 115, bottom: 852 },
    viewport: { left: 0, right: 320, top: 0, bottom: 480 }, anchor: { left: 12, top: 600, bottom: 644 }, height: 520 });
  assert.equal(phone.width, 296);
  assert.ok(phone.top >= 115 && phone.top + phone.maxHeight <= 480);
});

test('metadata editing waits for the fetched record and offers a retry on failure', async () => {
  const { default: Metadata } = await load('components/Retrieval/RetrievalMetadata.jsx');
  const render = (status) => renderToStaticMarkup(React.createElement(Metadata,
    { item: detail, pages: model.getRetrievalItemControlModel(summary, detail).dataPages,
      detailResource: { status, error: 'Could not fetch item', retry: () => {} }, onItemUpdated: () => {} }));
  assert.ok(!render('loading').includes('aria-label="Edit Name"'));
  assert.ok(render('error').includes('Retry item details'));
  assert.ok(!render('error').includes('aria-label="Edit Name"'));
});

test('full metadata preserves a recorded zero value, missing prices and the complete structured location', () => {
  const { dataPages } = model.getRetrievalItemControlModel(summary, { ...detail, valueCents: 0, purchasePriceCents: null });
  const rows = dataPages.flatMap((page) => page.rows);
  assert.equal(rows.find((row) => row.label === 'Estimated Value').value, '$0.00');
  assert.equal(rows.find((row) => row.label === 'Purchase Price').value, '—');
  assert.equal(rows.find((row) => row.label === 'Location').value, 'Garage · Work bench · Upper shelf · Left edge');
});

test('Commands deck action uses fetched readiness and blocks unavailable or departed records', async () => {
  const { default: Button } = await load('components/Retrieval/RetrievalDeclutterButton.jsx');
  const render = (status, data) => renderToStaticMarkup(React.createElement(Button, {
    item: summary, detailResource: { status, data }, onItemUpdated: () => {},
  }));
  assert.match(render('ready', detail), /aria-label="Add to Declutter Deck"/);
  assert.match(render('ready', detail), /aria-pressed="false"/);
  assert.match(render('ready', { ...detail, declutterReadiness: 'in_deck' }), /aria-pressed="true"/);
  assert.match(render('loading', null), /disabled=""/);
  assert.match(render('error', null), /disabled=""/);
  assert.match(render('ready', { ...detail, item_status: 'gone' }), /disabled=""/);
});

test('active Retrieval choice fields render an open inline combobox without a field dialog', async () => {
  const { default: InlineField } = await load({ contents: `
    import React from 'react';
    import Field from './components/Retrieval/RetrievalEditableField';
    import { RetrievalItemEditingContext } from './components/Retrieval/RetrievalItemEditingContext';
    import { getItemFieldDescriptor } from './components/ItemFieldEditor/itemFieldRegistry';
    export default function Fixture({ fieldKey, item }) {
      const descriptor = getItemFieldDescriptor(fieldKey, item);
      const editing = { item, fieldKey, descriptor, draft: descriptor.getDraft(item),
        canEdit: () => true, setDraft: () => {}, save: () => {}, requestClose: () => {} };
      return <RetrievalItemEditingContext.Provider value={editing}><Field fieldKey={fieldKey}>Value</Field></RetrievalItemEditingContext.Provider>;
    }` });
  for (const fieldKey of ['category', 'keep-priority', 'condition', 'acquisition-type', 'primary-owner']) {
    const html = renderToStaticMarkup(React.createElement(InlineField, { fieldKey, item: detail }));
    assert.match(html, /role="combobox"/);
    assert.match(html, /aria-expanded="true"/);
    assert.ok(!html.includes('role="dialog"'));
  }
});
