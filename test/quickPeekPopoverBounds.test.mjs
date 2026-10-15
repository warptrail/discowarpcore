import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuickPeekPopoverBounds } from '../frontend/src/components/OperationsQuickPeek/useQuickPeekPopoverBounds.js';

test('placement popup uses the space below its toolbar, capped at 440px', () => {
  assert.deepEqual(getQuickPeekPopoverBounds({ top: 460, bottom: 510 }, 0, 932), { maxHeight: 408 });
  assert.deepEqual(getQuickPeekPopoverBounds({ top: 100, bottom: 150 }, 0, 900), { maxHeight: 440 });
});

test('placement popup flips above the toolbar when a keyboard or short viewport leaves too little room', () => {
  assert.deepEqual(getQuickPeekPopoverBounds({ top: 350, bottom: 400 }, 0, 500), {
    maxHeight: 336, top: 'auto', bottom: 'calc(100% + 6px)',
  });
  assert.deepEqual(getQuickPeekPopoverBounds({ top: 350, bottom: 400 }, 200, 450), {
    maxHeight: 136, top: 'auto', bottom: 'calc(100% + 6px)',
  });
});

test('placement popup bounds remain nonnegative with no available space', () => {
  assert.deepEqual(getQuickPeekPopoverBounds({ top: 0, bottom: 50 }, 0, 40), { maxHeight: 0 });
});
