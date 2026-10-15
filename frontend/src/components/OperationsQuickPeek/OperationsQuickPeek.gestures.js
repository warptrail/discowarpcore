// Capture on the original button so taps retain their normal click/focus behavior.
// Identity buttons may start a drag; editor/search/action controls must not.
export function getQuickPeekGestureCaptureTarget({ target, currentTarget, button }) {
  if (button !== 0) return null;
  const interactive = target.closest(
    'button, a, input, textarea, select, [role="button"], [role="combobox"], [contenteditable="true"]',
  );
  if (!interactive) return currentTarget;
  if (interactive.hasAttribute('data-quick-peek-drag-handle')) return interactive;
  if (interactive.tagName === 'BUTTON' && target.closest('[data-quick-peek-header-drag-surface]')) {
    return interactive;
  }
  return null;
}

// Called only after the existing vertical swipe threshold is reached.
export function applyQuickPeekVerticalSwipe({ deltaY, expanded, onSetExpanded, onDismiss }) {
  if (deltaY < 0) {
    onSetExpanded?.(true);
  } else if (deltaY > 0) {
    if (expanded) onSetExpanded?.(false);
    else onDismiss?.();
  }
}
