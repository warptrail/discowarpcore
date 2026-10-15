import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuickPeekDismissState } from '../frontend/src/components/OperationsQuickPeek/OperationsQuickPeek.history.js';

test('dismissal clears box and item history markers without mutating unrelated route state', () => {
  const original = { operationsQuickPeekEntry: true, operationsQuickPeekItemEntry: true, finder: 'camping' };
  assert.deepEqual(getQuickPeekDismissState(original), { finder: 'camping' });
  assert.equal(original.operationsQuickPeekItemEntry, true);
});

test('direct links and box-only views also reset without needing history entries', () => {
  assert.deepEqual(getQuickPeekDismissState(null), {});
  assert.deepEqual(getQuickPeekDismissState({ operationsQuickPeekEntry: true }), {});
});
