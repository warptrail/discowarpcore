const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const frontend = path.resolve(__dirname, '../frontend');
const requireFrontend = createRequire(path.join(frontend, 'package.json'));
let hookSource;

test.before(async () => {
  const { outputFiles } = await requireFrontend('esbuild').build({
    entryPoints: [path.join(frontend, 'src/components/Retrieval/useRetrievalBrowseSort.js')],
    bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'], logLevel: 'silent',
  });
  hookSource = outputFiles[0].text;
});

// Run the real hook with the Crypto API shape exposed by each browser context.
function mount(crypto) {
  const states = [];
  let nextSlot = 0;
  const react = {
    useState(initial) {
      const slot = nextSlot++;
      if (!(slot in states)) states[slot] = typeof initial === 'function' ? initial() : initial;
      return [states[slot], (next) => {
        states[slot] = typeof next === 'function' ? next(states[slot]) : next;
      }];
    },
    useCallback: (callback) => callback,
  };
  const module = { exports: {} };
  vm.runInNewContext(hookSource, {
    module, exports: module.exports, crypto,
    require: (id) => {
      assert.equal(id, 'react');
      return react;
    },
  });
  return (filters = {}, defaultSort = 'name') => {
    nextSlot = 0;
    return module.exports.default(filters, defaultSort);
  };
}

function verifyStableBrowse(render) {
  const first = render();
  assert.equal(first.selectedSort, 'random');
  assert.equal(typeof first.shuffleSeed, 'string');
  assert.ok(first.shuffleSeed.length > 0 && first.shuffleSeed.length <= 96);
  // Opening or closing finder controls rerenders without changing the seed.
  assert.equal(render().shuffleSeed, first.shuffleSeed);
  const filtered = render({ q: 'spain' });
  assert.equal(filtered.selectedSort, 'name');
  assert.equal(filtered.shuffleSeed, first.shuffleSeed);
  filtered.reshuffle();
  const shuffled = render({ q: 'spain' });
  assert.equal(shuffled.selectedSort, 'random');
  assert.notEqual(shuffled.shuffleSeed, first.shuffleSeed);
  assert.equal(render({ q: 'spain' }).shuffleSeed, shuffled.shuffleSeed);
  return first;
}

test('secure browsers retain native UUID seeds across finder rerenders', () => {
  let calls = 0;
  const crypto = {
    randomUUID() {
      assert.equal(this, crypto);
      return `native-visit-${++calls}`;
    },
  };
  assert.equal(verifyStableBrowse(mount(crypto)).shuffleSeed, 'native-visit-1');
  assert.equal(calls, 2, 'Only arrival and explicit Shuffle generate seeds');
});

test('HTTP LAN browsers without randomUUID can arrive, toggle controls, and reshuffle', () => {
  let calls = 0;
  const crypto = {
    getRandomValues(values) {
      assert.equal(this, crypto);
      values.fill(++calls);
      return values;
    },
  };
  verifyStableBrowse(mount(crypto));
  assert.equal(calls, 2);
});

test('browsers without Web Crypto still browse and reshuffle safely', () => {
  verifyStableBrowse(mount(undefined));
});
