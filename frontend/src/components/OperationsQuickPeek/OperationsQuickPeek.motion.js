export const QUICK_PEEK_EXIT_DURATION_MS = 620;

export const QUICK_PEEK_DESKTOP_EXIT_DURATION_MS = 260;
export const QUICK_PEEK_DESKTOP_ENTER_DURATION_MS = 300;

export function getQuickPeekExitDuration(viewport) {
  if (viewport.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  if (viewport.matchMedia('(max-width: 767px)').matches) return QUICK_PEEK_EXIT_DURATION_MS;
  if (viewport.matchMedia('(min-width: 1100px)').matches) return QUICK_PEEK_DESKTOP_EXIT_DURATION_MS;
  return 0;
}
