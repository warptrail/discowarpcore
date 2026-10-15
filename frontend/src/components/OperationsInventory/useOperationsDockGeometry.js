import { useLayoutEffect, useState } from 'react';

// Both the resting panel and Quick Peek anchor to the reserved right column.
// Fixed positioning keeps long inventory pages from pushing them under Header.
export default function useOperationsDockGeometry(target, enabled = true) {
  const [geometry, setGeometry] = useState({ left: 0, top: 180 });
  useLayoutEffect(() => {
    if (!target || !enabled) return undefined;
    let frame = 0;
    const header = document.querySelector('[data-app-header]');
    const update = () => {
      const rect = target.getBoundingClientRect();
      if (!rect.width) return;
      const left = Math.round(rect.left);
      const top = Math.max(Math.ceil((header?.getBoundingClientRect().bottom || 0) + 16), Math.round(rect.top));
      setGeometry(current => current.left === left && current.top === top ? current : { left, top });
    };
    const measure = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    if (header) observer.observe(header);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [target, enabled]);
  return geometry;
}
