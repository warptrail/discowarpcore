import { useLayoutEffect, useState } from 'react';

export function getQuickPeekPopoverBounds(rect, viewportTop, viewportBottom) {
  const below = Math.max(0, viewportBottom - rect.bottom - 14);
  const above = Math.max(0, rect.top - viewportTop - 14);
  const openAbove = below < 180 && above > below;
  return {
    maxHeight: Math.min(440, openAbove ? above : below),
    ...(openAbove ? { top: 'auto', bottom: 'calc(100% + 6px)' } : {}),
  };
}

export default function useQuickPeekPopoverBounds(anchorRef, open, fillSheet = false, matchControlRail = false) {
  const [bounds, setBounds] = useState({ maxHeight: '40dvh' });
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;
    const update = () => {
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0;
      const next = getQuickPeekPopoverBounds(anchorRef.current.getBoundingClientRect(), top, top + (viewport?.height || window.innerHeight));
      if (matchControlRail) {
        const anchor = anchorRef.current;
        const rail = anchor.closest('[aria-label="Quick Peek controls"]') || anchor;
        const anchorRect = anchor.getBoundingClientRect();
        const railRect = rail.getBoundingClientRect();
        Object.assign(next, {
          width: railRect.width,
          left: railRect.left - anchorRect.left - anchor.clientLeft,
          transform: 'none',
        });
      }
      if (fillSheet) {
        const sheet = anchorRef.current.closest('aside');
        if (sheet) {
          const sheetRect = sheet.getBoundingClientRect();
          const anchorRect = anchorRef.current.getBoundingClientRect();
          const height = Math.max(44, Math.min(sheetRect.bottom, top + (viewport?.height || window.innerHeight)) - anchorRect.bottom - 14);
          Object.assign(next, { height, maxHeight: height, width: Math.max(0, sheetRect.width - 16), left: sheetRect.left + sheetRect.width / 2 - anchorRect.left, top: 'calc(100% + 6px)', bottom: 'auto' });
        }
      }
      setBounds((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchorRef.current);
    const rail = anchorRef.current.closest('[aria-label="Quick Peek controls"]');
    if (matchControlRail && rail) observer.observe(rail);
    const sheet = anchorRef.current.closest('aside');
    if (sheet) observer.observe(sheet);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    // The sheet translates as its collapsed height changes; size alone does not track that anchor movement.
    document.addEventListener('transitionend', update, true);
    document.addEventListener('animationend', update, true);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      document.removeEventListener('transitionend', update, true);
      document.removeEventListener('animationend', update, true);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [anchorRef, open, fillSheet, matchControlRail]);
  return bounds;
}
