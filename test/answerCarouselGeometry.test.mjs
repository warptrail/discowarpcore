import test from 'node:test';
import assert from 'node:assert/strict';
import { getCarouselTarget, getLoopedNavigationTarget, wrapCarouselOffset } from '../frontend/src/components/Carousel/carouselGeometry.js';

test('cards center in the viewport while room choices retain start alignment', () => {
  const geometry = { start: 1000, offset: 350, itemWidth: 340, viewportWidth: 430 };
  assert.equal(getCarouselTarget(geometry), 1350);
  assert.equal(getCarouselTarget({ ...geometry, centered: true }), 1305);
});

test('half-card seam buffer preserves fractional first-card snap points in both directions', () => {
  const period = 3132;
  const start = 3092 - 172;
  const wrap = (offset) => wrapCarouselOffset(offset - start + period, period) - period + start;
  assert.equal(wrap(3091), 3091);
  assert.equal(wrap(3094), 3094);
  assert.equal(wrap(3094 + period), 3094);
  assert.equal(wrap(3094 - period), 3094);
});

test('arrow controls cross either seam by one card, not a full-list reverse animation', () => {
  const geometry = { period: 900, step: 300 };
  assert.equal(getLoopedNavigationTarget({ ...geometry, target: 900, currentTarget: 1500, scrollOffset: 1500, direction: 1 }), 1800);
  assert.equal(getLoopedNavigationTarget({ ...geometry, target: 1500, currentTarget: 900, scrollOffset: 900, direction: -1 }), 600);
  assert.equal(getLoopedNavigationTarget({ ...geometry, target: 1200, currentTarget: 900, scrollOffset: 1800, direction: 1 }), 2100);
  assert.equal(getLoopedNavigationTarget({ ...geometry, target: 1200, currentTarget: 900, scrollOffset: 900, direction: 1, period: 0 }), 1200);
});
