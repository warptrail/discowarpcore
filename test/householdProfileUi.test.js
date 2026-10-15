const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));
const React = frontendRequire('react');
const { renderToStaticMarkup } = frontendRequire('react-dom/server');
const { ServerStyleSheet } = frontendRequire('styled-components');

async function load() {
  const { outputFiles } = await frontendRequire('esbuild').build({
    stdin: { contents: `export { default as Switcher } from './components/HouseholdProfile/HouseholdProfileSwitcher'; export { HouseholdProfileContext } from './components/HouseholdProfile/HouseholdProfileContext';`, resolveDir: path.join(frontend, 'src'), loader: 'jsx' },
    bundle: true, write: false, format: 'cjs', platform: 'node', mainFields: ['module', 'main'],
    external: ['react', 'react-dom', 'styled-components'], jsx: 'automatic', logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)((id) => id === 'styled-components'
    ? Object.assign(frontendRequire(id).default, frontendRequire(id)) : frontendRequire(id), module, module.exports);
  return module.exports;
}
test('device selector has labelled 44px vector choices and never claims authenticated access', async () => {
  const { Switcher, HouseholdProfileContext } = await load();
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToStaticMarkup(sheet.collectStyles(React.createElement(HouseholdProfileContext.Provider, {
      value: { profileId: 'laserfox', profile: { label: 'Laserfox' }, persistenceAvailable: true },
    }, React.createElement(Switcher))));
    assert.ok(html.includes('Using Laserfox') && !html.includes('Not a secure login'));
    assert.match(html, /aria-label="Use Laserfox on this device" aria-pressed="true"/);
    assert.match(html, /aria-label="Use Discofish on this device" aria-pressed="false"/);
    assert.equal((html.match(/<svg /g) || []).length, 2);
    assert.ok(!html.includes('aria-label="Clear device profile"'));
    assert.ok(html.includes('Sign out of Laserfox'));
    assert.ok(sheet.getStyleTags().includes('min-height:44px'));
    assert.match(sheet.getStyleTags(), /min-width:\s*1100px/);
    const guest = renderToStaticMarkup(React.createElement(Switcher));
    assert.ok(guest.includes('Choose your profile') && !guest.includes('aria-pressed="true"'));
    const blocked = renderToStaticMarkup(React.createElement(HouseholdProfileContext.Provider, {
      value: { profileId: 'discofish', profile: { label: 'Discofish' }, persistenceAvailable: false },
    }, React.createElement(Switcher)));
    assert.ok(!blocked.includes('For this visit only'));
  } finally { sheet.seal(); }
});
test('compact selector keeps 44px icon controls and accessible profile/storage information', async () => {
  const { Switcher, HouseholdProfileContext } = await load();
  const sheet = new ServerStyleSheet();
  try {
    const render = (persistenceAvailable) => renderToStaticMarkup(sheet.collectStyles(
      React.createElement(HouseholdProfileContext.Provider, {
        value: { profileId: 'laserfox', profile: { label: 'Laserfox' }, persistenceAvailable },
      }, React.createElement(Switcher, { compact: true })),
    ));
    const html = render(true);
    assert.match(html, /aria-description="Using Laserfox"/);
    assert.match(html, /aria-label="Use Laserfox on this device" aria-pressed="true"/);
    assert.ok(!html.includes('aria-label="Clear device profile"'));
    assert.ok(html.includes('Sign out of Laserfox'));
    assert.equal((html.match(/<svg /g) || []).length, 2);
    assert.ok(!html.includes('>Laserfox<') && !html.includes('>Discofish<'));
    assert.ok(!html.includes('>Using Laserfox<') && !html.includes('>Saved on this device'));
    assert.match(sheet.getStyleTags(), /flex:0 0 44px;width:44px;padding:0;border:0;background:transparent/);
    assert.ok(sheet.getStyleTags().includes('min-height:44px'));
    assert.ok(!render(false).includes('Device storage unavailable'));
  } finally { sheet.seal(); }
});
test('one app provider feeds the open mobile title row and a dedicated desktop slot', () => {
  const header = fs.readFileSync(path.join(frontend, 'src/components/Header.jsx'), 'utf8');
  const topRow = header.slice(header.indexOf('<TopRowControls>'), header.indexOf('</TopRowControls>'));
  assert.ok(topRow.includes('isMobile && (isDeclutterPage || isMobileMenuOpen) ? <HouseholdProfileSwitcher compact /> : null'));
  assert.ok(topRow.includes('id="mobile-telemetry-mount"'));
  assert.ok(topRow.includes('$hidden={isMobile && isMobileMenuOpen}'));
  const menu = header.slice(header.indexOf('<MobileNavPanel'), header.indexOf('</MobileNavPanel>'));
  assert.ok(menu.includes('!isMobile ? <HouseholdProfileSwitcher /> : null'));
  assert.ok(menu.includes('inert={isMobile && !isMobileMenuOpen'));
  const desktop = fs.readFileSync(path.join(frontend, 'src/components/DesktopWorkspace/DesktopNavigation.jsx'), 'utf8');
  assert.ok(desktop.includes('<ProfileSlot><HouseholdProfileSwitcher /></ProfileSlot>'));
  const main = fs.readFileSync(path.join(frontend, 'src/main.jsx'), 'utf8');
  assert.equal((main.match(/<HouseholdProfileProvider>/g) || []).length, 1);
  const picker = fs.readFileSync(path.join(frontend, 'src/components/Declutter/DeclutterPlayerPicker.jsx'), 'utf8');
  assert.ok(picker.includes('useHouseholdProfile()') && !picker.includes('useState'));
});
test('provider shares current identity, synchronizes tabs and removes global listeners on unmount', async () => {
  const model = await import('../frontend/src/util/householdProfile.js');
  const { outputFiles } = await frontendRequire('esbuild').build({
    entryPoints: [path.join(frontend, 'src/components/HouseholdProfile/HouseholdProfileProvider.jsx')],
    bundle: true, packages: 'external', write: false, format: 'cjs', platform: 'node', jsx: 'automatic', logLevel: 'silent',
    plugins: [{ name: 'shallow', setup(build) { build.onResolve({ filter: /^\./ }, (args) => args.importer ? { path: args.path, external: true } : null); } }],
  });
  const listeners = new Map(), effects = [], changes = [];
  const device = new Map([[model.HOUSEHOLD_PROFILE_STORAGE_KEY, 'discofish']]);
  const storage = { getItem: (key) => device.get(key), setItem: (key, value) => device.set(key, value), removeItem: (key) => device.delete(key) };
  const react = {
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, (value) => changes.push(value)],
    useRef: (value) => ({ current: value }), useCallback: (fn) => fn, useMemo: (fn) => fn(), useEffect: (fn) => effects.push(fn),
  };
  const module = { exports: {} };
  const window = { addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: (key) => listeners.delete(key), dispatchEvent: (event) => listeners.get(event.type)?.(event) };
  vm.runInNewContext(outputFiles[0].text, {
    module, exports: module.exports, window, CustomEvent: class { constructor(type, value) { this.type = type; this.detail = value.detail; } },
    require: (id) => id === 'react' ? react : id === 'react/jsx-runtime' ? { jsx: (type, props) => ({ type, props }) }
      : id.includes('Context') ? { HouseholdProfileContext: { Provider: 'provider' } }
        : id.includes('itemOwners') ? { ITEM_OWNERS: [{ id: 'discofish' }, { id: 'laserfox' }] }
          : { ...model, readHouseholdProfile: () => model.readHouseholdProfile(storage), writeHouseholdProfile: (value) => model.writeHouseholdProfile(value, storage) },
  });
  const context = module.exports.default({}).props.value;
  const cleanup = effects[0]();
  assert.equal(context.getProfileId(), 'discofish');
  context.selectProfile('laserfox');
  assert.equal(context.getProfileId(), 'laserfox');
  assert.equal(device.get(model.HOUSEHOLD_PROFILE_STORAGE_KEY), 'laserfox');
  device.set(model.HOUSEHOLD_PROFILE_STORAGE_KEY, 'discofish');
  listeners.get('storage')({ key: model.HOUSEHOLD_PROFILE_STORAGE_KEY });
  assert.equal(context.getProfileId(), 'discofish');
  context.selectProfile('');
  assert.equal(context.getProfileId(), '');
  cleanup(); assert.equal(listeners.size, 0);
});
