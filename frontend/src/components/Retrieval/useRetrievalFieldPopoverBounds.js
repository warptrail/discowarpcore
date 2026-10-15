import { useLayoutEffect, useState } from 'react';
import { getRetrievalFieldPopoverBounds } from './retrievalFieldPopoverGeometry';

export default function useRetrievalFieldPopoverBounds(anchor, dialogRef) {
  const [bounds, setBounds] = useState(null);
  useLayoutEffect(() => {
    if (!anchor || !dialogRef.current) return undefined;
    const dialog = dialogRef.current;
    const panel = anchor.closest('[role="dialog"]');
    let frame = 0;
    const update = () => {
      const visual = window.visualViewport;
      const left = visual?.offsetLeft || 0;
      const top = visual?.offsetTop || 0;
      const viewport = { left, top, right: left + (visual?.width || window.innerWidth), bottom: top + (visual?.height || window.innerHeight) };
      const next = getRetrievalFieldPopoverBounds({ anchor: anchor.getBoundingClientRect(),
        panel: panel?.getBoundingClientRect() || viewport, viewport, height: dialog.getBoundingClientRect().height });
      setBounds((current) => current && Object.keys(next).every((key) => current[key] === next[key]) ? current : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(dialog);
    observer.observe(anchor);
    if (panel) observer.observe(panel);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    document.addEventListener('animationend', schedule, true);
    visualListeners('addEventListener');
    function visualListeners(method) {
      window.visualViewport?.[method]('resize', schedule);
      window.visualViewport?.[method]('scroll', schedule);
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      document.removeEventListener('animationend', schedule, true);
      visualListeners('removeEventListener');
    };
  }, [anchor, dialogRef]);
  return bounds;
}
