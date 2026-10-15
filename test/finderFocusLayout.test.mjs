import test from 'node:test';
import assert from 'node:assert/strict';
import { getFinderFocusBounds } from '../frontend/src/components/InventoryQuickAnswer/finderFocusLayout.js';
import { getFinderCarouselIndex } from '../frontend/src/components/InventoryQuickAnswer/finderSelection.js';

test('expanded finder starts at its existing top and stays bounded across responsive layouts', () => {
  for (const [width, height, anchorWidth] of [[320, 568, 304], [430, 932, 414], [678, 759, 662], [1280, 900, 860]]) {
    const bounds = getFinderFocusBounds({ anchorRect: { left: 8, top: 140, width: anchorWidth }, width, height });
    assert.equal(bounds.top, 140);
    assert.equal(bounds.left, 8);
    assert.equal(bounds.width, anchorWidth);
    assert.ok(bounds.top + bounds.height <= height - 8);
    assert.ok(bounds.height <= 640);
  }
  const wide = getFinderFocusBounds({ anchorRect: { left: 40, top: 180, width: 1500 }, width: 1920, height: 1080 });
  assert.equal(wide.width, 960);
  assert.equal(wide.left, 310);
});

test('finder bounds tolerate missing, offscreen and near-bottom anchors without clipping controls', () => {
  const missing = getFinderFocusBounds({ width: 430, height: 932, headerBottom: 102 });
  assert.deepEqual(missing, { left: 8, top: 108, width: 414, height: 640, maxHeight: 816 });
  for (const anchor of [{ left: -80, top: -30, width: 800 }, { left: 500, top: 530, width: 414 }]) {
    const bounds = getFinderFocusBounds({ anchorRect: anchor, width: 430, height: 568 });
    assert.ok(bounds.left >= 8 && bounds.top >= 8);
    assert.ok(bounds.left + bounds.width <= 422);
    assert.ok(bounds.top + bounds.height <= 560);
    assert.ok(bounds.height >= 208);
  }
});

test('URL selection wins while expanded and remembered selection survives collapse in the same query', () => {
  const answers = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
  const selection = { query: 'fish', id: 'two' };
  assert.equal(getFinderCarouselIndex(answers, 'fish', selection, 'three'), 2);
  assert.equal(getFinderCarouselIndex(answers, 'fish', selection, null), 1);
  assert.equal(getFinderCarouselIndex(answers, 'other query', selection, null), 0);
  assert.equal(getFinderCarouselIndex(answers, 'fish', selection, 'missing'), 1);
  assert.equal(getFinderCarouselIndex(answers, 'fish', { query: 'fish', id: 'missing' }), 0);
  assert.equal(getFinderCarouselIndex([], 'fish', selection, 'two'), 0);
});
