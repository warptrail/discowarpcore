import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuickCaptureDraft, readQuickCaptureDraft } from '../frontend/src/components/Intake/quickCaptureDraft.js';

test('full Intake receives every quick metadata field, including the pending tag', () => {
  const input = { name: 'Travel mug', description: 'Blue lid', notes: 'Hand wash\nSpare seal',
    tags: [' travel ', 'kitchen'], tagDraft: 'travel', category: 'kitchen', quantity: 1 };
  assert.deepEqual(buildQuickCaptureDraft(input), { version: 1, name: 'Travel mug', description: 'Blue lid',
    notes: 'Hand wash\nSpare seal', tags: ['travel', 'kitchen'], category: 'kitchen', quantity: 1,
    mode: 'orphan', targetBoxId: '' });
  assert.deepEqual(input.tags, [' travel ', 'kitchen']);
});

test('draft normalization keeps capture defaults and rejects unrelated navigation state', () => {
  assert.equal(readQuickCaptureDraft(null), null);
  assert.equal(readQuickCaptureDraft({ version: 2 }), null);
  const draft = readQuickCaptureDraft({ version: 1, category: 'not a category', quantity: -4, tags: 'not an array' });
  assert.equal(draft.quantity, 1);
  assert.equal(draft.category, 'miscellaneous');
  assert.deepEqual(draft.tags, []);
});

test('handoff preserves an explicit boxed destination, while adrift drafts never inherit it', () => {
  const draft = buildQuickCaptureDraft({ mode: 'inBox', targetBoxId: 'box-123', quantity: 3 });
  assert.equal(readQuickCaptureDraft(draft).targetBoxId, 'box-123');
  assert.equal(draft.quantity, 3);
  assert.equal(buildQuickCaptureDraft({ mode: 'orphan', targetBoxId: 'box-123' }).targetBoxId, '');
});
