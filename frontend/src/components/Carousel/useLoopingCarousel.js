import { useLayoutEffect, useRef, useState } from 'react';
import { getCarouselTarget, getLoopedNavigationTarget, wrapCarouselOffset } from './carouselGeometry';

function offsetWithinMain(item, main) {
  let offset = 0;
  for (let node = item; node && node !== main; node = node.offsetParent) offset += node.offsetLeft;
  return offset;
}

export default function useLoopingCarousel(viewRef, mainRef, signature, { itemSelector = 'button', centered = false, gap = 4, alwaysLoop = false, activeIndex } = {}) {
  const [looping, setLooping] = useState(false);
  const geometry = useRef({ period: 0, start: 0 });
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  useLayoutEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const main = mainRef.current;
    if (!view || !main) return undefined;
    let timer;
    const measure = () => {
      if (!view.clientWidth) return;
      const needed = alwaysLoop || main.offsetWidth > view.clientWidth - 10;
      if (needed !== looping) { setLooping(needed); return; }
      const period = looping ? main.offsetWidth + gap : 0;
      if (geometry.current.period !== period) {
        const first = main.querySelector(itemSelector);
        const start = getCarouselTarget({ start: main.offsetLeft, offset: 0, itemWidth: first?.offsetWidth || 0, viewportWidth: view.clientWidth, centered });
        // Normalize around half a card, not its exact snap point: fractional
        // pixels/perspective must not bounce a settled first card across the seam.
        geometry.current = { period, start: start - ((first?.offsetWidth || 0) + gap) / 2 };
        const selected = activeIndexRef.current == null ? first : main.querySelectorAll(itemSelector)[activeIndexRef.current] || first;
        view.scrollLeft = selected ? getCarouselTarget({ start: main.offsetLeft, offset: offsetWithinMain(selected, main), itemWidth: selected.offsetWidth, viewportWidth: view.clientWidth, centered }) : start;
      }
    };
    const settle = () => {
      if (!drag.current && geometry.current.period) {
        const { period, start } = geometry.current;
        const next = wrapCarouselOffset(view.scrollLeft - start + period, period) - period + start;
        if (Math.abs(next - view.scrollLeft) > 1) view.scrollLeft = next;
      }
      view.dataset.carouselSettled = 'true';
    };
    const scroll = () => { view.dataset.carouselSettled = 'false'; window.clearTimeout(timer); timer = window.setTimeout(settle, 160); };
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    observer.observe(main);
    view.addEventListener('scroll', scroll, { passive: true });
    view.addEventListener('scrollend', settle);
    measure();
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      view.removeEventListener('scroll', scroll);
      view.removeEventListener('scrollend', settle);
    };
  }, [viewRef, mainRef, signature, looping, itemSelector, centered, gap, alwaysLoop]);

  const motion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  const goToIndex = (next, { fromIndex = next, direction = 0, focus = false, behavior } = {}) => {
    const view = viewRef.current;
    const items = [...mainRef.current.querySelectorAll(itemSelector)];
    if (!view || !items[next]) return;
    const targetFor = (item) => getCarouselTarget({ start: mainRef.current.offsetLeft, offset: offsetWithinMain(item, mainRef.current), itemWidth: item.offsetWidth, viewportWidth: view.clientWidth, centered });
    const target = getLoopedNavigationTarget({ target: targetFor(items[next]), currentTarget: targetFor(items[fromIndex] || items[next]), scrollOffset: view.scrollLeft,
      period: geometry.current.period, step: items[next].offsetWidth + gap, direction });
    if (focus) items[next].focus({ preventScroll: true });
    view.dataset.carouselSettled = 'false';
    view.scrollTo({ left: target, behavior: behavior || motion() });
  };
  return {
    looping,
    goToIndex,
    onKeyDown(event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const buttons = [...mainRef.current.querySelectorAll(itemSelector)];
      const index = buttons.indexOf(event.target.closest(itemSelector));
      if (index < 0 || !buttons.length) return;
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + direction + buttons.length) % buttons.length;
      goToIndex(next, { fromIndex: index, direction: event.key === 'Home' || event.key === 'End' ? 0 : direction, focus: true });
    },
    onPointerDown(event) {
      suppressClick.current = false;
      // Touch uses the browser's native pan/inertia, including vertical page scrolling.
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      drag.current = { x: event.clientX, y: event.clientY, offset: viewRef.current.scrollLeft, moved: false };
    },
    onPointerMove(event) {
      const start = drag.current;
      if (!start) return;
      const dx = event.clientX - start.x;
      if (!start.moved && Math.abs(dx) < 6) return;
      if (!start.moved && Math.abs(event.clientY - start.y) > Math.abs(dx)) { drag.current = null; return; }
      start.moved = true;
      suppressClick.current = true;
      viewRef.current.style.scrollSnapType = 'none';
      event.currentTarget.setPointerCapture(event.pointerId);
      viewRef.current.scrollLeft = start.offset - dx;
    },
    onPointerUp(event) {
      const moved = drag.current?.moved;
      drag.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (moved) {
        viewRef.current.style.scrollSnapType = '';
        const first = mainRef.current.querySelector(itemSelector);
        const step = (first?.offsetWidth || 72) + gap;
        const start = getCarouselTarget({ start: mainRef.current.offsetLeft, offset: 0, itemWidth: first?.offsetWidth || 72, viewportWidth: viewRef.current.clientWidth, centered });
        viewRef.current.scrollTo({ left: start + Math.round((viewRef.current.scrollLeft - start) / step) * step, behavior: motion() });
      }
    },
    onPointerCancel() { drag.current = null; suppressClick.current = true; viewRef.current.style.scrollSnapType = ''; },
    onClickCapture(event) {
      if (!suppressClick.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    },
  };
}
