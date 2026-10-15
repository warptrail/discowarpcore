const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));
const esbuild = frontendRequire('esbuild');

// Shallow hook harness: execute the real event handlers without a browser or inventory server.
async function load(file, dependencies, globals = {}) {
  const { outputFiles } = await esbuild.build({ entryPoints: [path.join(frontend, 'src/components', file)], bundle: true, packages: 'external', write: false, format: 'cjs', platform: 'node', jsx: 'automatic', plugins: [{ name: 'shallow', setup(build) { build.onResolve({ filter: /^\./ }, args => args.importer ? { path: args.path, external: true } : null); } }], logLevel: 'silent' });
  const module = { exports: {} };
  let stateIndex = 0;
  const react = { useState: (value) => [dependencies.initialStates?.[stateIndex++] ?? value, (next) => dependencies.onState?.(next)], useRef: (value) => ({ current: value }), useContext: () => dependencies.context, useCallback: (fn) => fn, useEffect: () => {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(outputFiles[0].text, { module, exports: module.exports, require: (id) => id === 'react' ? react : id === 'react/jsx-runtime' ? { jsx, jsxs: jsx } : dependencies[id] || {}, ...globals });
  return module.exports;
}
function find(node, type) {
  if (!node) return undefined;
  if (node.type === type) return node;
  return [node.props?.children].flat(Infinity).map(child => find(child, type)).find(Boolean);
}
async function runMove(box, item = { _id: 'synthetic-item', name: 'Synthetic item' }, destination = { destBoxId: 'synthetic-destination', destLabel: 'Destination' }) {
  const requests = [], toasts = []; let refreshed = 0;
  const styles = new Proxy({}, { get: (_, key) => key });
  const placement = await load('OperationsQuickPeek/quickPeekPlacement.js', {
    '../../api/API_BASE': { API_BASE: '' },
  }, { fetch: async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return { ok: true }; } });
  const { default: Actions } = await load('OperationsQuickPeek/QuickPeekPlacementActions.jsx', {
    initialStates: [true, false, ''],
    context: { showToast: (config) => toasts.push(config) },
    '../MoveItemToOtherBox': 'Picker',
    './OperationsQuickPeek.styles': styles,
    '../../api/API_BASE': { API_BASE: '' },
    './quickPeekPlacement': placement,
  }, { fetch: async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return { ok: true }; } });
  const element = Actions({ box, item, pickerOnly: true, pickerControl: 'CloseControl', onMoved: () => refreshed++ });
  const picker = find(element, 'Picker');
  assert.equal(picker.props.showOrphanOption, box.systemType !== 'orphaned');
  assert.equal(picker.props.orphanOptionLabel, 'No box · Items Adrift');
  assert.equal(picker.props.compact, true);
  assert.equal(picker.props.filterTrailingControl, 'CloseControl');
  assert.equal(find(element, 'ActionGroupLabel'), undefined, 'compact picker has no filler heading or helper text');
  assert.equal(find(element, 'ItemCarouselActionButton'), undefined, 'single picker has no duplicate Move/Unbox buttons');
  const move = picker.props.onBoxSelected;
  await Promise.all([move(destination), move(destination)]);
  assert.equal(requests.length, 1, 'duplicate move is locked');
  assert.equal(refreshed, 1);
  assert.equal(toasts[0].actions[0].label, 'Undo');
  return { requests, toasts, refreshCount: () => refreshed };
}
test('Adrift move publishes persistent Undo; the actual ToastProvider schedules no dismissal', async () => {
  const { requests, toasts, refreshCount } = await runMove({ systemType: 'orphaned' });
  const scheduled = [], states = [];
  const { ToastProvider } = await load('Toast/ToastProvider.jsx', {
    onState: state => states.push(state),
    'react-router-dom': { useLocation: () => ({ pathname: '/' }) },
    './ToastContext': { ToastContext: { Provider: 'Provider' } },
  }, { setTimeout: (callback, delay) => { scheduled.push(delay); return 1; }, clearTimeout: () => {} });
  const provider = ToastProvider({ children: null });
  provider.props.value.showToast(toasts[0]);
  assert.equal(states.at(-1).sticky, true);
  assert.equal(scheduled.length, 0, 'Undo must not disappear on a zero-delay timer');
  const undo = toasts[0].actions[0].onClick;
  await Promise.all([undo(), undo()]);
  assert.equal(requests.length, 2, 'duplicate Undo is locked');
  assert.equal(requests[1].url, '/api/boxed-items/synthetic-destination/removeItem');
  assert.equal(requests[1].body.itemId, 'synthetic-item');
  assert.equal(refreshCount(), 2);
  assert.equal(toasts.at(-1).title, 'MOVE UNDONE');
});
test('No box uses the existing unbox endpoint and Undo restores the source compartment', async () => {
  const { requests, toasts } = await runMove(
    { _id: 'synthetic-source', box_id: '100', isComplexBox: true },
    { _id: 'synthetic-item', name: 'Synthetic item', compartmentKey: 'B' },
    { destBoxId: null, destLabel: 'Items Adrift' },
  );
  assert.equal(requests[0].url, '/api/boxed-items/synthetic-source/removeItem');
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0].body)), { itemId: 'synthetic-item' });
  assert.equal(toasts[0].title, 'ITEM UNBOXED');
  await toasts[0].actions[0].onClick();
  assert.equal(requests[1].url, '/api/boxed-items/moveItem');
  assert.equal(requests[1].body.sourceBoxId, null);
  assert.equal(requests[1].body.destBoxId, 'synthetic-source');
  assert.equal(requests[1].body.compartmentKey, 'B');
});
test('boxed item Undo restores the original box and compartment', async () => {
  const { requests, toasts } = await runMove({ _id: 'synthetic-source', box_id: '200', isComplexBox: true }, { _id: 'synthetic-item', name: 'Synthetic item', compartmentKey: 'B' });
  await toasts[0].actions[0].onClick();
  assert.equal(requests[1].url, '/api/boxed-items/moveItem');
  assert.equal(requests[1].body.destBoxId, 'synthetic-source');
  assert.equal(requests[1].body.sourceBoxId, 'synthetic-destination');
  assert.equal(requests[1].body.compartmentKey, 'B');
});

test('compact incoming move fixes the destination, carries compartments, and locks duplicate writes', async () => {
  const item = { _id: 'synthetic-item', name: 'Synthetic item', compartmentKey: 'B', box: { _id: 'synthetic-old-box', box_id: '200', label: 'Old box' } };
  const requests = [], moved = [], busy = [], states = [];
  let fail = false;
  const styles = new Proxy(() => {}, { get: (_, key) => () => key });
  const { default: Move } = await load('Intake/IntakeMoveExistingTab.jsx', {
    initialStates: ['B', [item]],
    onState: value => states.push(value),
    'styled-components': styles,
    '../../styles/primitives': {},
    '../../styles/tokens': {},
    '../../api/API_BASE': { API_BASE: '' },
    '../../util/itemCategories': { formatItemCategory: value => value, ITEM_CATEGORIES: [] },
    '../../util/itemImage': { getItemThumbnailUrl: () => '' },
    '../BoxForms/BoxCompartmentSelect': 'CompartmentPicker',
  }, { fetch: async (url, options) => { requests.push({ url, body: JSON.parse(options.body) }); return { ok: !fail, json: async () => ({ message: 'Synthetic move rejected' }) }; } });
  const view = Move({ compact: true, currentBox: { _id: 'synthetic-target', box_id: '091', isComplexBox: true }, onItemMoved: value => moved.push(value), onBusyChange: value => busy.push(value) });
  assert.equal(find(view, 'CompartmentPicker').props.value, 'B');
  const move = find(view, 'button').props.onClick;
  await Promise.all([move(), move()]);
  assert.equal(requests.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0].body)), { itemId: 'synthetic-item', destBoxId: 'synthetic-target', compartmentKey: 'B' });
  assert.equal(moved[0].sourceBoxId, 'synthetic-old-box');
  assert.equal(moved[0].sourceCompartmentKey, 'B');
  assert.deepEqual(busy, [true, false]);
  fail = true;
  await move();
  assert.equal(moved.length, 1, 'failed writes do not report a moved item');
  assert.ok(states.includes('Synthetic move rejected'));
  fail = false;
  await move();
  assert.equal(moved.length, 2, 'failed writes release the lock for a retry');
  assert.deepEqual(busy, [true, false, true, false, true, false]);
});
