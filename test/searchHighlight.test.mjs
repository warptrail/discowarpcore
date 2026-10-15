import test from 'node:test';
import assert from 'node:assert/strict';
import { getSearchTerms, splitSearchHighlights, getSearchExcerpt } from '../frontend/src/util/searchHighlight.js';
import { getAnswerMatchFields } from '../frontend/src/components/InventoryQuickAnswer/answerMatchFields.js';

test('literal keyword highlights are case-insensitive, repeated and HTML-safe', () => {
  assert.deepEqual(getSearchTerms(' Fish  fish  [toy] '), ['fish', '[toy]']);
  const parts = splitSearchHighlights('<Fish> fishing [toy] fish', ['fish', '[toy]']);
  assert.deepEqual(parts.filter((part) => part.match).map((part) => part.text), ['Fish', 'fish', '[toy]', 'fish']);
  assert.equal(parts.map((part) => part.text).join(''), '<Fish> fishing [toy] fish');
});

test('empty and overlapping terms never loop or duplicate the text', () => {
  assert.deepEqual(splitSearchHighlights('fishing', ['', 'fish', 'fishing']), [{ text: 'fishing', match: true }]);
  assert.deepEqual(splitSearchHighlights('plain text', []), [{ text: 'plain text', match: false }]);
  assert.deepEqual(splitSearchHighlights('', ['fish']), []);
});

test('compact excerpts retain the matching keyword, including at the end of long metadata', () => {
  const excerpt = getSearchExcerpt(`${'x'.repeat(100)} fish toy`, ['fish'], { length: 30, context: 5 });
  assert.ok(excerpt.startsWith('…'));
  assert.ok(excerpt.includes('fish'));
  assert.equal(getSearchExcerpt('nothing here', []), 'nothing here');
});

test('hidden item and box fields provide labelled real match clues', () => {
  const answer = { name: 'Cup', path: ['Office'], item: { tags: ['fish'], description: 'koi fish design', notes: 'fish gift', category: 'fishware', primaryOwnerName: 'Discofish' }, box: { tags: ['fishing'], description: 'Fish collection' } };
  const fields = getAnswerMatchFields(answer, 'fish');
  assert.deepEqual(fields.map(({ label }) => label), ['Tags', 'Description', 'Notes', 'Category', 'Owner', 'Box tags', 'Box description']);
  assert.equal(fields[0].value, 'fish');
  assert.deepEqual(getAnswerMatchFields(answer, ''), []);
  assert.deepEqual(getAnswerMatchFields({ name: 'Fish', path: [], item: {} }, 'fish'), []);
});
