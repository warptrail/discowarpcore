const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));
const React = frontendRequire('react');
const { renderToStaticMarkup } = frontendRequire('react-dom/server');
const { MemoryRouter } = frontendRequire('react-router-dom');
const esbuild = frontendRequire('esbuild');

async function loadComponent(filename) {
  const { outputFiles } = await esbuild.build({ entryPoints: [path.join(frontend, 'src/components/Declutter', filename)], bundle: true, write: false, format: 'cjs', platform: 'node', mainFields: ['module', 'main'], external: ['react', 'react-dom', 'react-router-dom'], jsx: 'automatic', logLevel: 'silent' });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputFiles[0].text)(frontendRequire, module, module.exports);
  return module.exports.default;
}

test('actual action markup uses truthful completion labels for every route', async () => {
  const Panel = await loadComponent('DeclutterActionsPanel.jsx');
  for (const [route, label] of Object.entries({ discard: 'Mark trashed', donate: 'Mark donated', sell: 'Mark sold', gift: 'Mark gifted', needs_routing: 'Choose a route' })) {
    const candidate = { id: 'candidate', stagingRoute: route, item: { id: 'synthetic', name: 'QA synthetic item' } };
    const markup = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Panel, { candidates: [candidate], player: 'laserfox' })));
    assert(markup.includes(label), route); assert(!markup.includes('Mark destroyed')); assert(markup.includes('Approved to Leave'));
  }
});

test('system collection includes all approved departures without calling them destruction', async () => {
  const Card = await loadComponent('DeclutterSystemCollectionCard.jsx');
  const markup = renderToStaticMarkup(React.createElement(Card, { candidates: [{ stagingRoute: 'donate' }, { stagingRoute: 'gift' }] }));
  assert(markup.includes('Approved to Leave')); assert(markup.includes('Donate')); assert(markup.includes('Gift')); assert(!markup.includes('Destruction'));
});
