import test from 'node:test';
import assert from 'node:assert/strict';
import { getSheetHeaderPullOffset, getSheetHeaderSwipeStart, isSheetHeaderDismissSwipe } from '../frontend/src/components/Sheets/sheetHeaderSwipe.js';

const startEvent = { button: 0, isPrimary: true, pointerId: 7, clientX: 180, clientY: 140,
  target: { closest: () => null } };
const start = getSheetHeaderSwipeStart(startEvent);
const swipe = (x, y, pointerId = 7) => isSheetHeaderDismissSwipe(start, { pointerId, clientX: 180 + x, clientY: 140 + y });

test('a deliberate downward header swipe dismisses while a tap or short pull stays open', () => {
  assert.equal(swipe(0, 0), false);
  assert.equal(swipe(3, 30), false);
  assert.equal(swipe(4, 63), false);
  assert.equal(swipe(4, 64), true);
  assert.equal(swipe(-12, 100), true);
});

test('upward, sideways and mostly diagonal swipes keep the item panel open', () => {
  assert.equal(swipe(0, -100), false);
  assert.equal(swipe(100, 5), false);
  assert.equal(swipe(100, 100), false);
  assert.equal(swipe(-100, 100), false);
});

test('a release from another pointer cannot dismiss an active header gesture', () => {
  assert.equal(swipe(0, 100, 8), false);
  assert.equal(isSheetHeaderDismissSwipe(null, { pointerId: 7, clientX: 180, clientY: 240 }), false);
});

test('the sheet tracks the downward pointer distance and returns toward its resting edge when pulled back', () => {
  const point = (y) => ({ pointerId: 7, clientY: 140 + y, clientX: 180 });
  assert.equal(getSheetHeaderPullOffset(start, point(24)), 24);
  assert.equal(getSheetHeaderPullOffset(start, point(90)), 90);
  assert.equal(getSheetHeaderPullOffset(start, point(35)), 35);
  assert.equal(isSheetHeaderDismissSwipe(start, point(35)), false);
  assert.equal(getSheetHeaderPullOffset(start, point(-20)), 0);
});

test('a second grab continues from the current visual offset without jumping', () => {
  const grabbed = { ...start, offset: 18 };
  assert.equal(getSheetHeaderPullOffset(grabbed, { pointerId: 7, clientY: 140 }), 18);
  assert.equal(getSheetHeaderPullOffset(grabbed, { pointerId: 7, clientY: 150 }), 28);
  assert.equal(getSheetHeaderPullOffset(grabbed, { pointerId: 7, clientY: 100 }), 0);
  assert.equal(getSheetHeaderPullOffset(grabbed, { pointerId: 8, clientY: 200 }), null);
  assert.equal(getSheetHeaderPullOffset(null, { pointerId: 7, clientY: 200 }), null);
});

test('Close and other interactive header controls retain their normal pointer behavior', () => {
  assert.equal(getSheetHeaderSwipeStart({ ...startEvent, target: { closest: () => ({ tagName: 'BUTTON' }) } }), null);
  assert.equal(getSheetHeaderSwipeStart({ ...startEvent, button: 2 }), null);
  assert.equal(getSheetHeaderSwipeStart({ ...startEvent, isPrimary: false }), null);
  assert.deepEqual(start, { pointerId: 7, x: 180, y: 140 });
});
