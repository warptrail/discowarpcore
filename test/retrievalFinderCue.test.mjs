import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRetrievalFinderFilters, getRetrievalFinderCue, startFinderInvitation, FINDER_INVITATION_IDLE_MS }
  from '../frontend/src/components/Retrieval/retrievalFinderCue.js';

test('finder cues count search, prefix and every filtering facet, not sort or view', () => {
  assert.equal(hasRetrievalFinderFilters(), false);
  assert.equal(hasRetrievalFinderFilters({ q: '  ', boxIdPrefix: '', sort: 'tags', presentation: 'ascii' }), false);
  for (const key of ['q', 'boxIdPrefix']) assert.equal(hasRetrievalFinderFilters({ [key]: 'fixture' }), true, key);
  for (const key of ['categories', 'tags', 'locations', 'rooms', 'owners', 'keepPriorities']) {
    assert.equal(hasRetrievalFinderFilters({ [key]: ['fixture'] }), true, key);
    assert.equal(hasRetrievalFinderFilters({ [key]: [] }), false, key);
  }
});

test('closed filtered finder pulses ahead of invitations; opening stops the filter pulse', () => {
  assert.equal(getRetrievalFinderCue({ minimized: true, filtersActive: true, inviting: true }), 'filtered');
  assert.equal(getRetrievalFinderCue({ minimized: true, filtersActive: true, inviting: false }), 'filtered');
  assert.equal(getRetrievalFinderCue({ minimized: false, filtersActive: true, inviting: false }), 'quiet');
  assert.equal(getRetrievalFinderCue({ minimized: false, filtersActive: false, inviting: true }), 'invite');
  assert.equal(getRetrievalFinderCue({ minimized: true, filtersActive: false, inviting: false }), 'quiet');
});

function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type, callback) { if (listeners.get(type) === callback) listeners.delete(type); },
    emit(type) { listeners.get(type)?.(); },
  };
}

test('arrival invites, interaction quiets, inactivity re-invites, and cleanup removes all work', () => {
  const windowTarget = eventTarget();
  const documentTarget = Object.assign(eventTarget(), { hidden: false });
  const timers = new Map();
  let nextId = 0;
  windowTarget.setTimeout = (callback, delay) => { const id = ++nextId; timers.set(id, { callback, delay }); return id; };
  windowTarget.clearTimeout = (id) => timers.delete(id);
  const changes = [];
  const stop = startFinderInvitation({ onChange: (value) => changes.push(value), windowTarget, documentTarget });
  assert.deepEqual(changes, [true]);
  assert.equal(timers.size, 1);
  assert.equal([...timers.values()][0].delay, FINDER_INVITATION_IDLE_MS);
  assert.equal(FINDER_INVITATION_IDLE_MS, 60_000);
  windowTarget.emit('scroll');
  assert.equal(changes.at(-1), true, 'Initial layout/scroll restoration does not cancel the invitation');
  for (const event of ['pointerdown', 'click', 'keydown', 'input', 'wheel']) {
    windowTarget.emit(event);
    assert.equal(changes.at(-1), false);
    assert.equal(timers.size, 1, 'Activity re-arms, not stacks, timers');
  }
  [...timers.values()][0].callback();
  assert.equal(changes.at(-1), true);
  documentTarget.hidden = true;
  documentTarget.emit('visibilitychange');
  assert.equal(changes.at(-1), false);
  assert.equal(timers.size, 0);
  documentTarget.hidden = false;
  documentTarget.emit('visibilitychange');
  assert.equal(changes.at(-1), true);
  assert.equal(timers.size, 1);
  stop();
  assert.equal(timers.size, 0);
  assert.equal(windowTarget.listeners.size + documentTarget.listeners.size, 0);
});
