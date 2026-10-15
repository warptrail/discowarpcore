const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
const React = requireFrontend('react');
const { renderToStaticMarkup } = requireFrontend('react-dom/server');

let useSheetHeaderSwipe;
test.before(async () => {
  const { outputFiles } = await requireFrontend('esbuild').build({
    entryPoints: [path.join(frontend, 'src/components/Sheets/useSheetHeaderSwipe.js')],
    bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'], logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)(requireFrontend, module, module.exports);
  useSheetHeaderSwipe = module.exports.default;
});

function withGesture(onDismiss, verify) {
  const previousWindow = global.window;
  const frames = new Map();
  const styles = new Map();
  const attributes = new Map();
  let nextFrame = 0;
  global.window = {
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
    getComputedStyle: () => ({ top: '113px' }),
  };
  const sheet = {
    getBoundingClientRect: () => ({ top: 113 }),
    style: { setProperty: (key, value) => styles.set(key, value) },
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: (key) => attributes.delete(key),
  };
  let handlers;
  function Probe() {
    handlers = useSheetHeaderSwipe({ enabled: true, closing: false, sheetRef: { current: sheet }, onDismiss });
    return null;
  }
  const pointer = (y) => ({ pointerId: 7, button: 0, isPrimary: true, clientX: 180, clientY: 140 + y,
    target: { closest: () => null }, currentTarget: { setPointerCapture: () => {} }, preventDefault: () => {} });
  try {
    renderToStaticMarkup(React.createElement(Probe));
    verify({ handlers, pointer, styles, attributes, frames, flush: () => {
      const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback());
    } });
  } finally { global.window = previousWindow; }
}

test('live pointer movement translates the mounted sheet, and a short release resets it for snap-back', () => {
  withGesture(() => assert.fail('short pull must stay open'), ({ handlers, pointer, styles, attributes, flush }) => {
    handlers.onPointerDown(pointer(0));
    handlers.onPointerMove(pointer(35));
    flush();
    assert.equal(styles.get('--prism-sheet-pull-y'), '35px');
    assert.equal(attributes.get('data-prism-sheet-pulling'), 'true');
    handlers.onPointerUp(pointer(35));
    assert.equal(styles.get('--prism-sheet-pull-y'), '0px');
    assert.equal(attributes.has('data-prism-sheet-pulling'), false);
  });
});

test('cancelling a queued pull clears it, and the next gesture still tracks normally', () => {
  withGesture(() => assert.fail('cancelled pull must stay open'), ({ handlers, pointer, styles, frames, flush }) => {
    handlers.onPointerDown(pointer(0));
    handlers.onPointerMove(pointer(100));
    handlers.onPointerCancel(pointer(100));
    assert.equal(frames.size, 0);
    assert.equal(styles.get('--prism-sheet-pull-y'), '0px');
    handlers.onPointerDown(pointer(0));
    handlers.onPointerMove(pointer(25));
    flush();
    assert.equal(styles.get('--prism-sheet-pull-y'), '25px');
    handlers.onPointerUp(pointer(25));
    assert.equal(styles.get('--prism-sheet-pull-y'), '0px');
  });
});

test('accepted dismissal retains the release offset through lost capture; a guarded close snaps back', () => {
  for (const allowed of [true, false]) {
    let attempts = 0;
    withGesture(() => { attempts += 1; return allowed; }, ({ handlers, pointer, styles }) => {
      handlers.onPointerDown(pointer(0));
      handlers.onPointerUp(pointer(90));
      handlers.onLostPointerCapture(pointer(90));
      assert.equal(attempts, 1);
      assert.equal(styles.get('--prism-sheet-pull-y'), allowed ? '90px' : '0px');
    });
  }
});
