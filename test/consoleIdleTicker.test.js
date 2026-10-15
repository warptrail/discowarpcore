const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));

// Execute the real React handlers with shallow hooks, without an inventory server.
async function mount({ paused = false, hidden = false, reducedMotion = false } = {}) {
  const model = await import(pathToFileURL(path.join(frontend, 'src/components/OperationsFilters/consoleTips.js')));
  const { outputFiles } = await frontendRequire('esbuild').build({
    entryPoints: [path.join(frontend, 'src/components/OperationsFilters/OperationsConsoleIdleTicker.jsx')],
    bundle: true, packages: 'external', write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
    plugins: [{ name: 'shallow', setup(build) { build.onResolve({ filter: /^\./ }, (args) => args.importer ? { path: args.path, external: true } : null); } }],
    logLevel: 'silent',
  });
  const states = [0, paused, { hidden, reducedMotion }, { distance: 0, durationMs: 14000 }];
  const changes = [], effects = [], listeners = new Map();
  const document = { hidden, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  const media = { matches: reducedMotion, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  let index = 0;
  const react = {
    useState: () => { const slot = index++; return [states[slot], (value) => changes.push({ slot, value })]; },
    useRef: () => ({ current: null }), useEffect: (effect) => effects.push(effect), useLayoutEffect: () => {},
  };
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  const styles = { Row: 'Row', Window: 'Window', Copy: 'Copy', Button: 'Button', Kind: 'Kind' };
  vm.runInNewContext(outputFiles[0].text, {
    module, exports: module.exports, document, window: { matchMedia: () => media },
    require: (id) => id === 'react' ? react : id === 'react/jsx-runtime' ? { jsx, jsxs: jsx }
      : id === './consoleTips' ? model : id === './OperationsConsoleIdleTicker.styles' ? styles : { default: 'House' },
  });
  return { element: module.exports.default(), changes, effects, listeners, document, media };
}
function children(element) { return [element.props.children].flat(); }
const completion = { target: 'copy', currentTarget: 'copy' };

test('only the completed text animation advances a playing tip; pause and next are independent', async () => {
  const { element, changes } = await mount();
  const nodes = children(element);
  const copy = nodes.find((node) => node.type === 'Window').props.children;
  copy.props.onAnimationEnd({ ...completion, target: 'child' });
  assert.equal(changes.length, 0);
  copy.props.onAnimationEnd(completion);
  assert.equal(changes[0].value(0), 1);
  const pause = nodes.find((node) => node.props?.['aria-label'] === 'Pause console tips');
  pause.props.onClick();
  assert.equal(changes[1].value(false), true);
  const next = nodes.find((node) => node.props?.['aria-label'] === 'Next console tip');
  next.props.onClick();
  assert.equal(changes[2].value(0), 1);
});

test('paused, hidden and reduced-motion tips do not automatically cycle', async () => {
  for (const state of [{ paused: true }, { hidden: true }, { reducedMotion: true }]) {
    const { element, changes } = await mount(state);
    const copy = children(element).find((node) => node.type === 'Window').props.children;
    assert.equal(copy.props.$paused, true);
    copy.props.onAnimationEnd(completion);
    assert.equal(changes.length, 0);
  }
});

test('visibility and motion-preference changes stop playback and clean up their listeners', async () => {
  const fixture = await mount();
  const cleanup = fixture.effects[0]();
  fixture.document.hidden = true;
  fixture.listeners.get('visibilitychange')();
  assert.equal(fixture.changes.at(-1).value.hidden, true);
  fixture.media.matches = true;
  fixture.listeners.get('change')();
  assert.equal(fixture.changes.at(-1).value.reducedMotion, true);
  cleanup();
  assert.equal(fixture.listeners.size, 0);
});
