import test from 'node:test';
import assert from 'node:assert/strict';

const {
  getQuickPeekDismissHistorySteps,
} = await import('../frontend/src/components/OperationsQuickPeek/OperationsQuickPeek.history.js');

test('a downward Quick Peek dismissal skips the item and box history entries', () => {
  assert.equal(getQuickPeekDismissHistorySteps({
    operationsQuickPeekEntry: true,
    operationsQuickPeekItemEntry: true,
  }), 2);
});

test('a downward Quick Peek dismissal skips only its box history entry', () => {
  assert.equal(getQuickPeekDismissHistorySteps({
    operationsQuickPeekEntry: true,
  }), 1);
  assert.equal(getQuickPeekDismissHistorySteps({}), 0);
});
