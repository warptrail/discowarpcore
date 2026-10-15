import test from 'node:test';
import assert from 'node:assert/strict';
import { getSelectMenuBounds } from '../frontend/src/util/selectMenuGeometry.js';

const viewport = { left: 0, top: 0, width: 1313, height: 1060 };

test('field menu stays below the trigger with matching width and a bounded scrolling height', () => {
  const result = getSelectMenuBounds({ left: 230, top: 475, bottom: 519, width: 424 }, viewport, 1060);
  assert.equal(result.left, 230);
  assert.equal(result.width, 424);
  assert.equal(result.top, 525);
  assert.equal(result.bottom, 'auto');
  assert.equal(result.maxHeight, 280);
});

test('menu opens above a low field and fits inside a narrow visible keyboard viewport', () => {
  const view = { left: 0, top: 90, width: 320, height: 340 };
  const result = getSelectMenuBounds({ left: 242, top: 350, bottom: 394, width: 180 }, view, 759);
  assert.equal(result.left, 132);
  assert.equal(result.width, 180);
  assert.equal(result.top, 'auto');
  assert.equal(result.bottom, 415);
  assert.equal(result.maxHeight, 246);
  assert.equal(759 - result.bottom - result.maxHeight, view.top + 8);
});

test('menu clamps wide and scrolled triggers to the visible viewport without negative dimensions', () => {
  const result = getSelectMenuBounds({ left: -50, top: -70, bottom: -26, width: 700 }, { left: 0, top: 0, width: 320, height: 200 }, 200);
  assert.equal(result.left, 8);
  assert.equal(result.width, 304);
  assert.equal(result.top, 8);
  assert.equal(result.maxHeight, 184);
});
