import test from 'node:test';
import assert from 'node:assert/strict';
import { placeCarouselLabel, wrapCarouselOffset } from '../frontend/src/components/InventoryFilters/locationCarouselGeometry.js';

test('loop offsets wrap both directions without changing the visible phase', () => {
  for (const value of [-1420, -76, 0, 608, 684, 1368, 2128, 10000]) {
    const wrapped = wrapCarouselOffset(value, 684);
    assert.ok(wrapped >= 684 && wrapped < 1368);
    assert.equal(((wrapped - value) % 684 + 684) % 684, 0);
  }
  assert.equal(wrapCarouselOffset(47, 0), 47);
});

test('painted label avoids the caption band and moves around visible glyphs', () => {
  const placed = placeCarouselLabel({ width: 400, height: 48, labelWidth: 90, labelHeight: 23,
    obstacles: [{ x: 0, y: 27, width: 400, height: 14, weight: 5 }, { x: 172, y: 7, width: 18, height: 18 }] });
  assert.ok(placed.y + placed.height <= 27);
  assert.ok(placed.x >= 4 && placed.x + placed.width <= 396);
  assert.ok(placed.x !== 155);
});

test('placement stays stable in clear space rather than jittering on small score changes', () => {
  const previous = { x: 153, y: 1 };
  assert.deepEqual(placeCarouselLabel({ width: 400, height: 48, labelWidth: 90, labelHeight: 23, previous }),
    { ...previous, width: 90, height: 23 });
});

test('long tier lettering remains bounded in narrow viewports', () => {
  const placed = placeCarouselLabel({ width: 80, height: 48, labelWidth: 150, labelHeight: 23 });
  assert.equal(placed.width, 72);
  assert.equal(placed.x, 4);
});
