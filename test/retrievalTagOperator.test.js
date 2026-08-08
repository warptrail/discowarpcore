const test = require('node:test');
const assert = require('node:assert/strict');

const { matchesTagFilters } = require('../backend/services/retrievalService');

test('OR tag matching accepts any selected tag', () => {
  assert.equal(matchesTagFilters(['clothing'], ['clothing', 'black'], 'or'), true);
  assert.equal(matchesTagFilters(['decor'], ['clothing', 'black'], 'or'), false);
});

test('AND tag matching requires every selected tag', () => {
  assert.equal(matchesTagFilters(['clothing'], ['clothing', 'black'], 'and'), false);
  assert.equal(matchesTagFilters(['clothing', 'black'], ['clothing', 'black'], 'and'), true);
});

test('empty tag selection does not filter items', () => {
  assert.equal(matchesTagFilters(['clothing'], [], 'and'), true);
});
