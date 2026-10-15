import test from 'node:test';
import assert from 'node:assert/strict';
import { getFinderItemNavigation, getFinderCloseNavigation, FINDER_FOCUS_HISTORY } from '../frontend/src/util/finderItemNavigation.js';

test('pinned finder opens item-only focus, preserving search and filters but removing normal Quick Peek', () => {
  const destination = getFinderItemNavigation({ search: '?q=fish&category=toys&peek=102&item=old', state: { retained: true }, itemId: 'fish' });
  const params = new URLSearchParams(destination.to.split('?')[1]);
  assert.equal(params.get('q'), 'fish');
  assert.equal(params.get('category'), 'toys');
  assert.equal(params.get('findItem'), 'fish');
  assert.equal(params.has('peek'), false);
  assert.equal(params.has('item'), false);
  assert.equal(destination.state.retained, true);
  assert.equal(destination.state[FINDER_FOCUS_HISTORY], '/operations?q=fish&category=toys&peek=102&item=old');
});
test('cycling finder matches preserves the original close history entry', () => {
  const first = getFinderItemNavigation({ search: '?q=fish', itemId: 'one' });
  const second = getFinderItemNavigation({ search: first.to.split('/operations')[1], state: first.state, itemId: 'two' });
  assert.equal(second.state[FINDER_FOCUS_HISTORY], '/operations?q=fish');
  assert.equal(second.to, '/operations?q=fish&findItem=two');
});
test('closing an incoming finder deep link only removes focus and keeps other route state', () => {
  assert.deepEqual(getFinderCloseNavigation('?q=fish&findItem=one', { retained: true, [FINDER_FOCUS_HISTORY]: '/operations?q=fish' }), { to: '/operations?q=fish', state: { retained: true } });
  assert.equal(getFinderCloseNavigation('?findItem=one').to, '/operations');
});
