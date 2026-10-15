export const FINDER_INVITATION_IDLE_MS = 60_000;

export function hasRetrievalFinderFilters({ q = '', boxIdPrefix = '', ...facets } = {}) {
  return Boolean(String(q).trim() || String(boxIdPrefix).trim()) ||
    ['categories', 'tags', 'locations', 'rooms', 'owners', 'keepPriorities']
      .some((key) => Array.isArray(facets[key]) && facets[key].length > 0);
}

export function getRetrievalFinderCue({ minimized, filtersActive, inviting }) {
  if (minimized && filtersActive) return 'filtered';
  return inviting ? 'invite' : 'quiet';
}

// One inactivity timer, owned by the mounted Retrieval button. No polling.
export function startFinderInvitation({ onChange, windowTarget, documentTarget, idleMs = FINDER_INVITATION_IDLE_MS }) {
  let timer;
  const clearTimer = () => windowTarget.clearTimeout(timer);
  const armTimer = () => {
    clearTimer();
    if (!documentTarget.hidden) timer = windowTarget.setTimeout(() => onChange(true), idleMs);
  };
  const activity = () => { onChange(false); armTimer(); };
  const visibility = () => {
    onChange(!documentTarget.hidden);
    armTimer();
  };
  // Restoring layout/scroll position on arrival is not user activity. Touch pan
  // starts with pointerdown; wheel and keyboard cover the other scroll inputs.
  const events = ['pointerdown', 'click', 'keydown', 'input', 'wheel'];
  const options = { capture: true, passive: true };
  onChange(!documentTarget.hidden);
  armTimer();
  events.forEach((event) => windowTarget.addEventListener(event, activity, options));
  documentTarget.addEventListener('visibilitychange', visibility);
  return () => {
    clearTimer();
    events.forEach((event) => windowTarget.removeEventListener(event, activity, options));
    documentTarget.removeEventListener('visibilitychange', visibility);
  };
}
