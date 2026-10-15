import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { readTagSource } from '../util/tagReturnNavigation';

export default function useTagSourceRestoration() {
  const location = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    const source = type === 'POP' ? readTagSource(location.key) : location.state?.tagRestore;
    if (!source || source.url !== `${location.pathname}${location.search}${location.hash}`) return;
    const previousAnchor = document.documentElement.style.overflowAnchor;
    const previousBodyAnchor = document.body.style.overflowAnchor;
    document.documentElement.style.overflowAnchor = 'none';
    document.body.style.overflowAnchor = 'none';
    let frame = 0;
    const restore = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => window.scrollTo({ top: source.scrollY || 0, behavior: 'instant' }));
    };
    const observer = new ResizeObserver(restore);
    observer.observe(document.getElementById('route-content') || document.body);
    restore();
    const stop = () => { observer.disconnect(); cancelAnimationFrame(frame); document.documentElement.style.overflowAnchor = previousAnchor; document.body.style.overflowAnchor = previousBodyAnchor; };
    const timeout = window.setTimeout(stop, 2500);
    window.addEventListener('pointerdown', stop, { once: true });
    window.addEventListener('wheel', stop, { once: true });
    return () => { stop(); window.clearTimeout(timeout); window.removeEventListener('pointerdown', stop); window.removeEventListener('wheel', stop); };
  }, [location.key, location.pathname, location.search, location.hash, location.state, type]);
}
