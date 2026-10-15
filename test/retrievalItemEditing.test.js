const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
const React = requireFrontend('react');

// Exercise the real field controller and API serializer without a browser or inventory writes.
function hookRuntime(toasts) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const hooks = {
    ...React,
    useContext: () => ({ showToast: (toast) => toasts.push(toast) }),
    useMemo: (factory) => factory(),
    useCallback: (callback) => callback,
    useRef: (value) => {
      const index = cursor++;
      slots[index] ||= { current: value };
      return slots[index];
    },
    useState: (value) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useEffect: (effect, dependencies) => {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        effects.push(() => { previous?.cleanup?.(); slots[index] = { dependencies, cleanup: effect() }; });
      }
    },
  };
  return { hooks, render: (hook, props) => {
    cursor = 0;
    hook(props);
    const pending = effects; effects = []; pending.forEach((effect) => effect());
    cursor = 0;
    return hook(props);
  } };
}

async function load(file, hooks) {
  const { outputFiles } = await requireFrontend('esbuild').build({
    entryPoints: [path.join(frontend, 'src', file)], bundle: true, write: false, format: 'cjs', platform: 'node',
    mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react-router-dom', 'styled-components'], jsx: 'automatic', logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)(
    (id) => id === 'react' ? hooks : id === 'styled-components'
      ? Object.assign(requireFrontend(id).default, requireFrontend(id)) : requireFrontend(id), module, module.exports,
  );
  return module.exports.default;
}

async function fixture() {
  const toasts = [];
  const updates = [];
  const runtime = hookRuntime(toasts);
  const hook = await load('components/Retrieval/useRetrievalItemFieldEditor.js', runtime.hooks);
  const item = { _id: 'test-item', name: 'Graphic T-shirt', category: 'clothing', box: 'physical-box', quantity: 1 };
  const render = () => runtime.render(hook, { item, detailResource: { status: 'ready' }, onItemUpdated: (value) => updates.push(value) });
  const open = (key) => { render().open(key, { key }); return render(); };
  return { render, open, toasts, updates, item };
}

test('box location popup retains dirty drafts, blocks dismissal during save, and offers box-only Undo', async () => {
  const originalFetch = global.fetch;
  const toasts = [];
  const updates = [];
  const calls = [];
  let finish;
  const item = { _id: 'item', name: 'Toy', box: { _id: 'box', box_id: '001', locationId: null } };
  global.fetch = async (url, options = {}) => {
    if (!options.method) return { ok: true, json: async () => ({ locations: [{ _id: 'path', room: 'Office' }] }) };
    calls.push({ url, payload: JSON.parse(options.body) });
    if (calls.length === 1) await new Promise((resolve) => { finish = resolve; });
    return { ok: true, json: async () => ({ box: { ...item.box, locationId: JSON.parse(options.body).locationId } }) };
  };
  try {
    const runtime = hookRuntime(toasts);
    const hook = await load('components/Retrieval/useRetrievalBoxLocationEditor.js', runtime.hooks);
    const render = () => runtime.render(hook, { item, detailResource: { status: 'ready' }, onBoxUpdated: (value) => updates.push(value) });
    render(); await new Promise((resolve) => setImmediate(resolve));
    render().open('box-location', {});
    render().setDraft({ room: 'Office' });
    render().requestClose();
    assert.equal(render().discardRequested, true);
    render().keepEditing();
    assert.equal(render().draft.room, 'Office');
    const save = render().save();
    await new Promise((resolve) => setImmediate(resolve));
    render().requestClose();
    assert.equal(render().isActive, true);
    assert.equal(render().discardRequested, false);
    finish(); await save;
    assert.equal(render().isActive, false);
    assert.deepEqual(calls[0].payload, { locationId: 'path' });
    assert.match(calls[0].url, /\/api\/boxes\/box$/);
    assert.equal(updates[0].locationId, 'path');
    assert.equal(toasts[0].sticky, true);
    await toasts[0].actions[0].onClick();
    assert.deepEqual(calls[1].payload, { locationId: null });
    assert.equal(updates[1].locationId, null);
  } finally { global.fetch = originalFetch; }
});

test('a field save patches only that attribute, updates the panel, and retains header Toast Undo', async () => {
  const { open, render, toasts, updates, item } = await fixture();
  const originalFetch = global.fetch;
  const payloads = [];
  global.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body); payloads.push(payload);
    return { ok: true, json: async () => ({ data: { ...item, ...payload } }) };
  };
  try {
    open('name').setDraft('Updated shirt');
    await render().save();
    assert.deepEqual(payloads, [{ name: 'Updated shirt' }]);
    assert.equal(updates[0].name, 'Updated shirt');
    assert.equal(render().isActive, false);
    assert.equal(toasts[0].sticky, true);
    await toasts[0].actions[0].onClick();
    assert.deepEqual(payloads[1], { name: 'Graphic T-shirt' });
    assert.equal(updates[1].name, 'Graphic T-shirt');
    assert.equal(toasts.at(-1).title, 'Name restored');
  } finally { global.fetch = originalFetch; }
});

test('validation and failed saves retain the field draft and a readable error', async () => {
  const { open, render } = await fixture();
  const originalFetch = global.fetch;
  let requests = 0;
  global.fetch = async () => { requests++; return { ok: false, status: 409, text: async () => '{"message":"Record changed. Try again."}' }; };
  try {
    open('name').setDraft('');
    await render().save();
    assert.equal(requests, 0);
    assert.equal(render().error, 'Name is required.');
    render().setDraft('Unsaved shirt');
    await render().save();
    const editing = render();
    assert.equal(requests, 1);
    assert.equal(editing.draft, 'Unsaved shirt');
    assert.equal(editing.error, 'Record changed. Try again.');
    assert.equal(editing.isActive, true);
  } finally { global.fetch = originalFetch; }
});

test('dirty dismissal offers keep/discard, and a save in progress cannot be dismissed', async () => {
  const { open, render, item } = await fixture();
  open('name').setDraft('Unsaved shirt');
  render().requestClose();
  assert.equal(render().discardRequested, true);
  render().keepEditing();
  assert.equal(render().draft, 'Unsaved shirt');
  assert.equal(render().discardRequested, false);
  render().discard();
  assert.equal(render().isActive, false);
  assert.equal(item.name, 'Graphic T-shirt');

  const originalFetch = global.fetch;
  let resolve;
  global.fetch = () => new Promise((done) => { resolve = done; });
  try {
    open('name').setDraft('Updated shirt');
    const saving = render().save();
    assert.equal(render().saving, true);
    render().requestClose();
    assert.equal(render().isActive, true);
    resolve({ ok: true, json: async () => ({ ...item, name: 'Updated shirt' }) });
    await saving;
    assert.equal(render().isActive, false);
  } finally { global.fetch = originalFetch; }
});

test('the quick editor uses Tab for focus and keeps the existing Enter save shortcut', async () => {
  const runtime = hookRuntime([]);
  const Editor = await load('components/ItemFieldEditor/ItemFieldEditor.jsx', runtime.hooks);
  let saved = 0;
  let prevented = 0;
  const props = { descriptor: { key: 'name', label: 'Name', editor: 'text' }, draft: 'Shirt', isDirty: true,
    commitTextOnTab: false, autoFocus: false, onSave: () => saved++ };
  const tree = runtime.render(Editor, props);
  const event = (key) => ({ key, nativeEvent: {}, target: { tagName: 'INPUT' }, preventDefault: () => prevented++ });
  tree.props.onKeyDown(event('Tab'));
  assert.equal(saved, 0);
  assert.equal(prevented, 0);
  tree.props.onKeyDown(event('Enter'));
  assert.equal(saved, 1);
});
