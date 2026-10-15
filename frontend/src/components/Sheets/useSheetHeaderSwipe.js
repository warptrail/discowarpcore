import { useEffect, useRef } from 'react';
import { getSheetHeaderPullOffset, getSheetHeaderSwipeStart, isSheetHeaderDismissSwipe } from './sheetHeaderSwipe';

export default function useSheetHeaderSwipe({ enabled, closing, sheetRef, onDismiss }) {
  const gestureRef = useRef(null);
  const frameRef = useRef(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (enabled && !closing) return;
    gestureRef.current = null;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    sheetRef.current?.removeAttribute('data-prism-sheet-pulling');
    if (!closing) sheetRef.current?.style.setProperty('--prism-sheet-pull-y', '0px');
  }, [closing, enabled, sheetRef]);
  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);

  const writeOffset = (offset) => {
    offsetRef.current = offset;
    sheetRef.current?.style.setProperty('--prism-sheet-pull-y', `${offset}px`);
  };
  const snapBack = () => {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    sheetRef.current?.removeAttribute('data-prism-sheet-pulling');
    writeOffset(0);
  };

  const onPointerDown = (event) => {
    if (!enabled || closing || gestureRef.current || !sheetRef.current) return;
    const start = getSheetHeaderSwipeStart(event);
    if (!start) return;
    const sheet = sheetRef.current;
    // Pick up at the current visual position, even during entry or snap-back.
    start.offset = Math.max(0, sheet.getBoundingClientRect().top - parseFloat(window.getComputedStyle(sheet).top));
    gestureRef.current = start;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    sheet.setAttribute('data-prism-sheet-interacted', 'true');
    sheet.setAttribute('data-prism-sheet-pulling', 'true');
    writeOffset(start.offset);
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    const offset = getSheetHeaderPullOffset(gestureRef.current, event);
    if (offset == null) return;
    offsetRef.current = offset;
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      writeOffset(offsetRef.current);
    });
  };
  const onPointerUp = (event) => {
    const start = gestureRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    writeOffset(getSheetHeaderPullOffset(start, event));
    gestureRef.current = null;
    sheetRef.current?.removeAttribute('data-prism-sheet-pulling');
    // Leave the sheet at the release position so its exit continues from there.
    if (enabled && !closing && isSheetHeaderDismissSwipe(start, event) && onDismiss() !== false) return;
    snapBack();
  };
  const cancelGesture = (event) => {
    if (gestureRef.current?.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    snapBack();
  };

  return enabled && !closing ? {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: cancelGesture,
    onLostPointerCapture: cancelGesture,
  } : {};
}
