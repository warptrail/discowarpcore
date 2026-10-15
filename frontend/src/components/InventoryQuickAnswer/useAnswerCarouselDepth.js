import { useLayoutEffect, useRef } from 'react';

// Keep per-frame perspective out of React state; publish selection only after a swipe settles.
export default function useAnswerCarouselDepth(viewRef, signature, looping, onSelect) {
  const selectRef = useRef(onSelect);
  useLayoutEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return undefined;
    let frame;
    let timer;
    let nearest;
    let selected;
    const paint = () => {
      frame = null;
      const bounds = view.getBoundingClientRect();
      let distance = Infinity;
      const cards = [...view.querySelectorAll('[data-answer-visual]')];
      // Read geometry before writing any styles.
      const positions = cards.map((card) => ({ card, offset: card.offsetLeft + card.parentElement.offsetLeft + card.offsetWidth / 2 - view.scrollLeft - bounds.width / 2 }));
      for (const { card, offset } of positions) {
        const ratio = Math.max(-1, Math.min(1, offset / bounds.width));
        card.style.setProperty('--answer-angle', `${ratio * -18}deg`);
        card.style.setProperty('--answer-scale', String(1 - Math.abs(ratio) * .07));
        card.style.setProperty('--answer-opacity', String(1 - Math.abs(ratio) * .24));
        if (Math.abs(offset) < distance) { distance = Math.abs(offset); nearest = Number(card.dataset.answerIndex); }
        card.dataset.centered = Math.abs(offset) < 12 ? 'true' : 'false';
      }
      // Avoid publishing a zero-width/hidden slot while a primary Toast takes precedence.
      if (!bounds.width) nearest = undefined;
    };
    const settle = () => {
      paint();
      if (nearest !== undefined && nearest !== selected) {
        selected = nearest;
        selectRef.current(nearest);
      }
    };
    const scroll = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 190);
    };
    const observer = new ResizeObserver(scroll);
    observer.observe(view);
    view.addEventListener('scroll', scroll, { passive: true });
    view.addEventListener('scrollend', settle);
    scroll();
    return () => {
      observer.disconnect(); window.cancelAnimationFrame(frame); window.clearTimeout(timer);
      view.removeEventListener('scroll', scroll); view.removeEventListener('scrollend', settle);
    };
  }, [viewRef, signature, looping]);
}
