import { useEffect, useRef } from 'react';

const openDialogs = [];
let savedBodyOverflow = '';

// A shared stack keeps nested sheets from closing together or unlocking the page.
export default function useDialogFocus(dialogRef, onClose, enabled = true) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!enabled || !dialog) return undefined;
    const previousFocus = document.activeElement;
    if (!openDialogs.length) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openDialogs.push(dialog);
    const focusFrame = window.requestAnimationFrame(() => dialog.focus({ preventScroll: true }));

    const handleKeyDown = (event) => {
      if (openDialogs.at(-1) !== dialog || event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.tabIndex >= 0 && !element.closest('[hidden], [inert], [aria-hidden="true"]') && element.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (!dialog.contains(document.activeElement) || document.activeElement === dialog) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      const wasTop = openDialogs.at(-1) === dialog;
      const index = openDialogs.indexOf(dialog);
      if (index >= 0) openDialogs.splice(index, 1);
      if (!openDialogs.length) document.body.style.overflow = savedBodyOverflow;
      if (wasTop && previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [dialogRef, enabled]);
}
