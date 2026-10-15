import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyQuickPeekVerticalSwipe, getQuickPeekGestureCaptureTarget } from '../frontend/src/components/OperationsQuickPeek/OperationsQuickPeek.gestures.js';

test('the whole header identity, including its buttons, can start a primary-pointer drag', () => {
  const header = { tagName: 'HEADER' };
  const button = { tagName: 'BUTTON', hasAttribute: () => false };
  const surface = {};
  const target = { closest: (selector) => selector.includes('header-drag-surface') ? surface : button };
  assert.equal(getQuickPeekGestureCaptureTarget({ target, currentTarget: header, button: 0 }), button);
  assert.equal(getQuickPeekGestureCaptureTarget({ target, currentTarget: header, button: 2 }), null);
  assert.equal(getQuickPeekGestureCaptureTarget({ target: { closest: () => null }, currentTarget: header, button: 0 }), header);
});

test('search, editor and action controls remain independent, while Resize still accepts drags', () => {
  const header = {};
  const action = { tagName: 'BUTTON', hasAttribute: () => false };
  const target = { closest: (selector) => selector.includes('header-drag-surface') ? null : action };
  assert.equal(getQuickPeekGestureCaptureTarget({ target, currentTarget: header, button: 0 }), null);
  const input = { tagName: 'INPUT', hasAttribute: () => false };
  assert.equal(getQuickPeekGestureCaptureTarget({ target: { closest: (selector) => selector.includes('header-drag-surface') ? {} : input }, currentTarget: header, button: 0 }), null);
  const resize = { tagName: 'BUTTON', hasAttribute: (attribute) => attribute === 'data-quick-peek-drag-handle' };
  assert.equal(getQuickPeekGestureCaptureTarget({ target: { closest: () => resize }, currentTarget: resize, button: 0 }), resize);
});

test('header swipes suppress only their follow-up pointer click and retain normal/keyboard clicks', () => {
  const source = readFileSync(new URL('../frontend/src/components/OperationsQuickPeek/OperationsBoxQuickPeek.jsx', import.meta.url), 'utf8');
  const header = readFileSync(new URL('../frontend/src/components/OperationsQuickPeek/QuickPeekBoxHeader.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('suppressHeaderClickRef.current = gesture.fromHeader'));
  assert.ok(source.includes('if (event.detail === 0) return;'));
  assert.ok(header.includes('data-quick-peek-header-drag-surface'));
  assert.ok(header.includes('onPointerDownCapture={onGestureStartCapture}'));
  assert.ok(header.includes('onClickCapture={onGestureClickCapture}'));
  const back = header.slice(header.indexOf('<S.CapReturnToItemsButton'), header.indexOf('<S.CapNavigation>'));
  assert.ok(!back.includes('onPointerDown=') && !back.includes('onPointerUp='));
});

test('up, down, down expands, collapses, then dismisses Quick Peek', () => {
  let expanded = false;
  const events = [];
  const swipe = (deltaY) => applyQuickPeekVerticalSwipe({
    deltaY, expanded,
    onSetExpanded: (next) => { expanded = next; events.push(next ? 'expanded' : 'collapsed'); },
    onDismiss: () => events.push('dismissed'),
  });
  swipe(-80);
  assert.equal(expanded, true);
  swipe(80);
  assert.equal(expanded, false);
  assert.deepEqual(events, ['expanded', 'collapsed']);
  swipe(80);
  assert.deepEqual(events, ['expanded', 'collapsed', 'dismissed']);
});

test('a downward swipe from short view still closes immediately', () => {
  const events = [];
  applyQuickPeekVerticalSwipe({ deltaY: 80, expanded: false,
    onSetExpanded: () => events.push('resized'), onDismiss: () => events.push('dismissed') });
  assert.deepEqual(events, ['dismissed']);
});

test('an upward swipe in tall view keeps it tall, and zero movement does nothing', () => {
  const events = [];
  const handlers = { expanded: true, onSetExpanded: (next) => events.push(next), onDismiss: () => events.push('dismissed') };
  applyQuickPeekVerticalSwipe({ ...handlers, deltaY: -80 });
  applyQuickPeekVerticalSwipe({ ...handlers, deltaY: 0 });
  assert.deepEqual(events, [true]);
});

test('swipes use the detent helper while explicit Close keeps whole-panel dismissal', () => {
  const source = readFileSync(new URL('../frontend/src/components/OperationsQuickPeek/OperationsBoxQuickPeek.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('applyQuickPeekVerticalSwipe({ deltaY, expanded, onSetExpanded, onDismiss })'));
  assert.ok(source.includes('onClose={onDismiss || onClose}'));
  assert.ok(source.includes('Math.abs(deltaY) >= VERTICAL_DETENT_THRESHOLD'));
});
