import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSOLE_TIPS, getConsoleTipMotion, nextConsoleTipIndex } from '../frontend/src/components/OperationsFilters/consoleTips.js';

test('local console scripts cover purpose, useful workflows, decluttering, encouragement and fun', () => {
  assert.equal(new Set(CONSOLE_TIPS.map((tip) => tip.id)).size, CONSOLE_TIPS.length);
  for (const id of ['welcome', 'search', 'location', 'placement', 'adrift', 'deck', 'declutter', 'motivation', 'teleport']) {
    const tip = CONSOLE_TIPS.find((entry) => entry.id === id);
    assert.ok(tip?.text && tip?.kind);
  }
  assert.match(CONSOLE_TIPS[0].text, /confirmations and Undo/);
});

test('tip progression loops without skipping the first script', () => {
  assert.equal(nextConsoleTipIndex(0), 1);
  assert.equal(nextConsoleTipIndex(CONSOLE_TIPS.length - 1), 0);
});

test('marquee only moves the overflowing portion and allows time to read', () => {
  assert.deepEqual(getConsoleTipMotion(200, 400), { distance: 0, durationMs: 14000 });
  assert.deepEqual(getConsoleTipMotion(500, 200), { distance: 300, durationMs: 24667 });
  assert.ok(getConsoleTipMotion(800, 200).durationMs > getConsoleTipMotion(500, 200).durationMs);
});
