import { useLayoutEffect, useState } from 'react';
import { placeCarouselLabel } from './locationCarouselGeometry';

export default function useCarouselWallLabel(viewRef, labelRef, signature, looping) {
  const [position, setPosition] = useState({ x: 4, y: 1 });
  useLayoutEffect(() => {
    const view = viewRef.current;
    const label = labelRef.current;
    if (!view || !label) return undefined;
    let timer;
    let frame;
    const measure = () => {
      const bounds = view.getBoundingClientRect();
      if (!bounds.width) return;
      const obstacles = [...view.querySelectorAll('[data-choice-key] > svg, [data-choice-key] > span')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height, weight: element.tagName.toLowerCase() === 'span' ? 5 : 1 };
      }).filter((rect) => rect.x + rect.width > 0 && rect.x < bounds.width);
      setPosition((previous) => {
        const next = placeCarouselLabel({ width: bounds.width, height: bounds.height,
          labelWidth: label.scrollWidth, labelHeight: label.offsetHeight, obstacles, previous });
        return next.x === previous.x && next.y === previous.y && next.width === previous.width && next.height === previous.height ? previous : next;
      });
    };
    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(measure, 190); };
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); });
    observer.observe(view);
    observer.observe(label);
    view.addEventListener('scroll', schedule, { passive: true });
    frame = requestAnimationFrame(measure);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      view.removeEventListener('scroll', schedule);
    };
  }, [viewRef, labelRef, signature, looping]);
  return position;
}
