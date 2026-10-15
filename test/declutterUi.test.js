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
test('review shows recorded submitter separately from item ownership', async () => {
  const Review = await loadComponent('DeclutterReviewCard.jsx');
  const sessionItem = { nominatedBy: 'laserfox', item: { name: 'QA synthetic item', primaryOwner: 'discofish' } };
  const markup = renderToStaticMarkup(React.createElement(Review, { sessionItem }));
  assert.ok(markup.includes('Added by Laserfox'));
  const legacy = renderToStaticMarkup(React.createElement(Review, { sessionItem: { ...sessionItem, nominatedBy: '' } }));
  assert.ok(!legacy.includes('Added by'));
});

test('exit controls expose labelled route choices and preserve the split-routing lock', async () => {
  const Controls = await loadComponent('DeclutterExitControls.jsx');
  const props = { candidate:{id:'synthetic'},itemName:'Synthetic item',currentRoute:'needs_routing',player:'discofish' };
  const markup = renderToStaticMarkup(React.createElement(Controls, props));
  for (const route of ['Trash','Donate','Sell','Gift']) assert.ok(markup.includes(`Plan ${route} for Synthetic item`));
  assert.ok(!markup.includes('combobox'));
  assert.ok(markup.includes('Laserfox chooses the exit route'));
  assert.equal((markup.match(/<button[^>]*disabled=""/g)||[]).length,6);
  const unlocked = renderToStaticMarkup(React.createElement(Controls,{...props,player:'laserfox'}));
  assert.ok(unlocked.includes('Apply plan'));
  assert.ok(!unlocked.includes('Laserfox chooses the exit route'));
});

test('discussion preserves original release preference, context links and private/shared notes', async () => {
  const Lane = await loadComponent('DeclutterDiscussionLane.jsx');
  const candidate = {id:'discuss',item:{id:'synthetic item',name:'Synthetic long item name',box:{box_id:'120',label:'Gear'}},
    notes:'Private context',sharedNotes:'Shared context',votes:{discofish:{decision:'release',exitPreference:'sell'},laserfox:{decision:'keep'}}};
  const markup = renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Lane,{candidates:[candidate],busyCandidateId:'discuss'})));
  assert.ok(markup.includes('Sell')); assert.ok(markup.includes('Keep'));
  assert.ok(markup.includes('href="/items/synthetic%20item"')); assert.ok(markup.includes('href="/boxes/120"'));
  assert.ok(markup.includes('Your private note: Private context')); assert.ok(markup.includes('Shared note: Shared context'));
  assert.ok(markup.includes('Original individual votes')); assert.ok(markup.includes('Saving final call…'));
  assert.equal((markup.match(/<button[^>]*disabled=""/g)||[]).length,1);
});
