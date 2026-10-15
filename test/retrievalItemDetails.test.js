const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');

const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
const same = (left, right) => left?.length === right?.length && left.every((value, index) => Object.is(value, right[index]));
const settle = () => new Promise((resolve) => setImmediate(resolve));

function hookRuntime() {
  const slots = [];
  let cursor = 0;
  let pending = [];
  const hooks = {
    useState: (initial) => {
      const index = cursor++;
      if (!slots[index]) {
        const slot = { value: typeof initial === 'function' ? initial() : initial };
        slot.set = (next) => { slot.value = typeof next === 'function' ? next(slot.value) : next; };
        slots[index] = slot;
      }
      return [slots[index].value, slots[index].set];
    },
    useRef: (initial) => {
      const index = cursor++;
      slots[index] ||= { current: initial };
      return slots[index];
    },
    useMemo: (factory, dependencies) => {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].dependencies, dependencies)) {
        slots[index] = { dependencies, value: factory() };
      }
      return slots[index].value;
    },
    useCallback: (callback, dependencies) => hooks.useMemo(() => callback, dependencies),
    useEffect: (effect, dependencies) => {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !same(previous.dependencies, dependencies)) {
        pending.push(() => {
          previous?.cleanup?.();
          slots[index] = { kind: 'effect', dependencies, effect, cleanup: effect() };
        });
      }
    },
  };
  return {
    hooks,
    render: (hook, id) => {
      cursor = 0;
      hook(id);
      const effects = pending; pending = [];
      effects.forEach((effect) => effect());
      cursor = 0;
      return hook(id);
    },
    replayEffects: () => {
      const effects = slots.filter((slot) => slot?.kind === 'effect');
      effects.forEach((slot) => slot.cleanup?.());
      effects.forEach((slot) => { slot.cleanup = slot.effect(); });
    },
  };
}

async function fixture() {
  const runtime = hookRuntime();
  const { outputFiles } = await requireFrontend('esbuild').build({
    entryPoints: [path.join(frontend, 'src/components/Retrieval/useRetrievalItemDetails.js')],
    bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'], logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)(
    (id) => id === 'react' ? runtime.hooks : requireFrontend(id), module, module.exports,
  );
  const requests = [];
  const fetch = (_url, { signal }) => new Promise((resolve, reject) => {
    requests.push({ signal, resolve: (data) => resolve({ ok: true, json: async () => ({ data }) }) });
    signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })), { once: true });
  });
  return { runtime, requests, fetch, render: (id) => runtime.render(module.exports.default, id) };
}

test('effect cleanup and replay replace an aborted request instead of leaving item details loading', async () => {
  const { runtime, requests, fetch, render } = await fixture();
  const originalFetch = global.fetch;
  global.fetch = fetch;
  try {
    assert.equal(render('item-one').detailResource.status, 'loading');
    runtime.replayEffects();
    assert.equal(requests[0].signal.aborted, true);
    assert.equal(requests.length, 2);
    requests[1].resolve({ _id: 'item-one', name: 'Ready item' });
    await settle();
    assert.equal(render('item-one').detailResource.status, 'ready');
    assert.equal(render('item-one').detailResource.data.name, 'Ready item');
  } finally { global.fetch = originalFetch; }
});

test('reopening a fetched item reuses its ready details without another request', async () => {
  const { requests, fetch, render } = await fixture();
  const originalFetch = global.fetch;
  global.fetch = fetch;
  try {
    render('item-one');
    requests[0].resolve({ _id: 'item-one', name: 'Cached item' });
    await settle();
    render('');
    assert.equal(render('item-one').detailResource.status, 'ready');
    assert.equal(requests.length, 1);
  } finally { global.fetch = originalFetch; }
});

test('box placement refresh reloads the current item and invalidates other cached placement without losing item edits', async () => {
  const { requests, fetch, render } = await fixture();
  const originalFetch = global.fetch;
  global.fetch = fetch;
  try {
    render('item-one');
    requests[0].resolve({ _id: 'item-one', box: { _id: 'box', location: 'Old' } });
    await settle();
    const oldRefresh = render('item-one').refreshPlacement;
    render('item-two');
    requests[1].resolve({ _id: 'item-two', name: 'Original', box: { _id: 'box', location: 'Old' } });
    await settle();
    render('item-two').merge('item-two', { name: 'Edited', box: { _id: 'box', location: 'Old' } });
    oldRefresh(); // Undo may retain a callback created for a previous selection.
    assert.equal(requests.length, 3);
    requests[2].resolve({ _id: 'item-two', name: 'Original', box: { _id: 'box', location: 'New' } });
    await settle();
    const next = render('item-two').detailResource.data;
    assert.equal(next.box.location, 'New');
    assert.equal(next.name, 'Edited');
    render('item-one');
    assert.equal(requests.length, 4);
    requests[3].resolve({ _id: 'item-one', box: { _id: 'box', location: 'New' } });
    await settle();
  } finally { global.fetch = originalFetch; }
});
