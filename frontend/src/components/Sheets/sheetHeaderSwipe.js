const MIN_DOWNWARD_DISTANCE = 64;
const VERTICAL_DOMINANCE = 1.2;
const INTERACTIVE_TARGETS = 'button, a, input, textarea, select, [role="button"], [role="combobox"], [contenteditable="true"]';

export function getSheetHeaderSwipeStart(event) {
  if (event.button !== 0 || event.isPrimary === false || event.target.closest(INTERACTIVE_TARGETS)) return null;
  return { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
}

export function getSheetHeaderPullOffset(start, event) {
  if (!start || start.pointerId !== event.pointerId) return null;
  return Math.max(0, (start.offset || 0) + event.clientY - start.y);
}

export function isSheetHeaderDismissSwipe(start, event) {
  if (!start || start.pointerId !== event.pointerId) return false;
  const deltaX = event.clientX - start.x;
  const deltaY = event.clientY - start.y;
  return deltaY >= MIN_DOWNWARD_DISTANCE && deltaY > Math.abs(deltaX) * VERTICAL_DOMINANCE;
}
