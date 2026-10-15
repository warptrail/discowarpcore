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
  return { hooks, firstRender: (hook, props) => { cursor = 0; return hook(props); }, flush: () => { const pending = effects; effects = []; pending.forEach((effect) => effect()); }, render: (hook, props) => {
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


test('item page editor exposes correctly typed drafts before effects on field switches', async () => {
  const runtime = hookRuntime([]);
  const hook = await load('components/ItemFieldEditor/useItemFieldEditor.js', runtime.hooks);
  const item = { _id: 'item', name: 'Mask', tags: ['covid'], notes: 'Drawer 5', quantity: 3 };
  let state = runtime.firstRender(hook, { item, fieldKey: 'name' });
  assert.equal(state.draft, 'Mask');
  assert.equal(state.isDirty, false);
  runtime.flush();
  state = runtime.firstRender(hook, { item, fieldKey: 'tags' });
  assert.ok(Array.isArray(state.draft));
  assert.equal(state.draft[0].value, 'covid');
  assert.equal(state.isDirty, false);
  runtime.flush();
  state = runtime.firstRender(hook, { item, fieldKey: 'notes' });
  assert.equal(state.draft, 'Drawer 5');
  runtime.flush();
  state = runtime.firstRender(hook, { item, fieldKey: 'usage-history' });
  assert.ok(Array.isArray(state.draft));
  assert.equal(state.isDirty, false);
});

test('handled child keys cannot submit the surrounding editor', async () => {
  const runtime = hookRuntime([]);
  const Editor = await load('components/ItemFieldEditor/ItemFieldEditor.jsx', runtime.hooks);
  let saves = 0;
  let closes = 0;
  const view = runtime.render(Editor, { descriptor: { key: 'tags', label: 'Tags', editor: 'tags' },
    draft: [], autoFocus: false, onSave: () => saves++, onRequestDiscard: () => closes++ });
  view.props.onKeyDown({ defaultPrevented: true, key: 'Enter' });
  view.props.onKeyDown({ defaultPrevented: true, key: 'Escape' });
  assert.equal(saves, 0);
  assert.equal(closes, 0);
});

test('persistent quantity stages changes inside the stepper and saves only quantity on leaving the row', async () => {
  const runtime = hookRuntime([]);
  const Control = await load('components/ItemFieldEditor/ItemQuantityRowControl.jsx', runtime.hooks);
  const originalFetch = global.fetch;
  const calls = [];
  const saved = [];
  const item = { _id: 'item', quantity: 3 };
  global.fetch = async (url, options) => {
    calls.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ ...item, quantity: 4 }) };
  };
  try {
    const render = () => runtime.render(Control, { item, onSaved: (patch) => saved.push(patch) });
    let row = render().props.children[0];
    row.props.children[0].props.onChange(4);
    row = render().props.children[0];
    row.props.onBlur({ currentTarget: { contains: () => true }, relatedTarget: {} });
    assert.equal(calls.length, 0);
    row.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: {} });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(calls, [{ quantity: 4 }]);
    assert.equal(saved[0].stayInRow, true);
    item.quantity = 4;
    assert.equal(render().props.children[0].props.children[0].props.value, 4);
    item.quantity = 3; // External Undo must also refresh the always-visible value.
    assert.equal(render().props.children[0].props.children[0].props.value, 3);
  } finally { global.fetch = originalFetch; }
});

test('quantity steps save immediately, disable while pending, and show Saved only after success', async () => {
  const runtime = hookRuntime([]);
  const Control = await load('components/ItemFieldEditor/ItemQuantityRowControl.jsx', runtime.hooks);
  const originalFetch = global.fetch;
  const calls = [];
  let finish;
  let fail = false;
  const item = { _id: 'item', quantity: 3 };
  global.fetch = async (url, options) => {
    const payload = JSON.parse(options.body);
    calls.push(payload);
    await new Promise((resolve) => { finish = resolve; });
    return fail ? { ok: false, status: 500, text: async () => 'Unavailable' }
      : { ok: true, json: async () => ({ ...item, ...payload }) };
  };
  try {
    const render = () => runtime.render(Control, { item, onSaved: ({ updated }) => { item.quantity = updated.quantity; } });
    let row = render().props.children[0];
    const saving = row.props.children[0].props.onStep(4);
    assert.deepEqual(calls, [{ quantity: 4 }]);
    row = render().props.children[0];
    assert.equal(row.props.children[0].props.disabled, true);
    assert.equal(row.props.children[1].props['aria-label'], 'Saving quantity');
    finish(); await saving;
    row = render().props.children[0];
    assert.equal(row.props.children[0].props.value, 4);
    assert.equal(row.props.children[1].props['aria-label'], 'Quantity saved');
    fail = true;
    const failure = row.props.children[0].props.onStep(3);
    finish(); await failure;
    const failedView = render();
    assert.notEqual(failedView.props.children[0].props.children[1].props['aria-label'], 'Quantity saved');
    assert.match(failedView.props.children[1].props.children, /Failed to update/);
    assert.equal(item.quantity, 4);
  } finally { global.fetch = originalFetch; }
});

test('keep priority menu uses five plain labels and departed priority is not editable', async () => {
  const { outputFiles } = await requireFrontend('esbuild').build({entryPoints:[path.join(frontend,'src/util/keepPriority.js')],bundle:true,write:false,format:'cjs',platform:'node'});
  const module={exports:{}}; new Function('module','exports',outputFiles[0].text)(module,module.exports);
  const {getKeepPriorityOptions,getItemKeepPriority}=module.exports;
  assert.deepEqual(getKeepPriorityOptions({item_status:'active'}).map(o=>o.label), ['Unspecified','Low','Medium','High','Essential']);
  assert.deepEqual(getKeepPriorityOptions({item_status:'gone'}), [{value:'decommissioned',label:'Removal/decommissioned'}]);
  assert.equal(getItemKeepPriority({item_status:'gone',keepPriority:'high'}), 'decommissioned');
  const runtime=hookRuntime([]);
  const hook=await load('components/ItemFieldEditor/useItemFieldEditor.js',runtime.hooks);
  assert.equal(runtime.render(hook,{item:{_id:'gone',item_status:'gone'},fieldKey:'keep-priority'}).isActive,false);
});

test('all dropdown editors commit the selected value immediately and request a quiet row cue', async () => {
  const {outputFiles}=await requireFrontend('esbuild').build({entryPoints:[path.join(frontend,'src/util/itemFieldSelection.js')],bundle:true,write:false,format:'cjs',platform:'node'});
  const module={exports:{}};new Function('module','exports',outputFiles[0].text)(module,module.exports);
  const {commitItemFieldSelection}=module.exports;
  const originalFetch=global.fetch;
  const calls=[];
  global.fetch=async(url,options)=>{const patch=JSON.parse(options.body);calls.push(patch);return {ok:true,json:async()=>({_id:'item',...patch})};};
  try {
    for(const [key,value,payload] of [
      ['category','tools',{category:'tools'}],
      ['keep-priority','high',{keepPriority:'high'}],
      ['condition','good',{condition:'good'}],
      ['acquisition-type','gift',{acquisitionType:'gift'}],
      ['primary-owner','Discofish',{primaryOwnerName:'Discofish'}],
    ]) {
      const runtime=hookRuntime([]);
      const hook=await load('components/ItemFieldEditor/useItemFieldEditor.js',runtime.hooks);
      let saved;
      const editor=runtime.render(hook,{item:{_id:'item'},fieldKey:key,onSaved:(result)=>{saved=result;}});
      await commitItemFieldSelection(editor,value,editor.setDraft,editor.save);
      assert.deepEqual(calls.at(-1),payload);
      assert.equal(saved.quiet,true);
    }
    let changed=false;
    commitItemFieldSelection({saving:true},'high',()=>{changed=true;},()=>{throw Error('must not save');});
    assert.equal(changed,false);
  } finally {global.fetch=originalFetch;}
});

test('persistent dropdown saves selection without entering edit mode and retains a compact Saved cue', async () => {
  const runtime=hookRuntime([]);
  const Control=await load('components/ItemFieldEditor/ItemDropdownRowControl.jsx',runtime.hooks);
  const originalFetch=global.fetch;
  const calls=[];
  const item={_id:'item',keepPriority:'low'};
  const descriptor={key:'keep-priority',label:'Keep priority',editor:'keep-priority',getDraft:item=>item.keepPriority};
  global.fetch=async(url,options)=>{const patch=JSON.parse(options.body);calls.push(patch);return {ok:true,json:async()=>({...item,...patch})};};
  try {
    const render=()=>runtime.render(Control,{item,descriptor,onSaved:({updated,stayInRow})=>{assert.equal(stayInRow,true);item.keepPriority=updated.keepPriority;}});
    const row=render();
    assert.equal(row.props.children[0].props.children.props.selectVariant,'floating');
    await row.props.children[0].props.children.props.onChange('essential');
    assert.deepEqual(calls,[{keepPriority:'essential'}]);
    assert.equal(render().props.children[0].props.children.props.draft,'essential');
    assert.equal(render().props.children[1].props['aria-label'],'Keep priority saved');
    item.keepPriority='medium';
    assert.equal(render().props.children[0].props.children.props.draft,'medium');
  } finally {global.fetch=originalFetch;}
});
