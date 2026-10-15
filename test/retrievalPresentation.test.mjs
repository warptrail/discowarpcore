import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeRetrievalPresentation, getVisibleRetrievalPresentation } from '../frontend/src/components/Retrieval/retrievalPresentation.js';

test('Retrieval defaults to large cards while retaining its existing and new saved choices', () => {
  for (const value of [undefined, null, '', 'invalid', 'cards']) assert.equal(sanitizeRetrievalPresentation(value), 'cards');
  assert.equal(sanitizeRetrievalPresentation('ascii'), 'ascii');
  assert.equal(sanitizeRetrievalPresentation('compact'), 'compact');
});

test('desktop Items and Boxes expose all three presentations', () => {
  for (const mode of ['items', 'boxes']) {
    for (const presentation of ['cards', 'compact', 'ascii']) {
      assert.equal(getVisibleRetrievalPresentation(presentation, { desktop: true, mode }), presentation);
    }
  }
});

test('mobile keeps one card layout and Terminal for both Items and Boxes', () => {
  assert.equal(getVisibleRetrievalPresentation('compact', { mode: 'items' }), 'cards');
  assert.equal(getVisibleRetrievalPresentation('compact', { mode: 'boxes' }), 'cards');
  assert.equal(getVisibleRetrievalPresentation('ascii', { mode: 'items' }), 'ascii');
  assert.equal(getVisibleRetrievalPresentation('ascii', { mode: 'boxes' }), 'ascii');
  assert.equal(getVisibleRetrievalPresentation('compact', { desktop: true }), 'compact');
});
