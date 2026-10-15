import { useLayoutEffect, useState } from 'react';
import { getFinderFocusBounds } from './finderFocusLayout';

// The focus surface hangs from the actual finder, not a guessed header height.
export default function useFinderFocusPosition(resultCount) {
  const [position, setPosition] = useState(null);
  useLayoutEffect(() => {
    const header = document.querySelector('header');
    const measure = () => {
      // A deep link can arrive before search results mount the compact finder.
      const anchor = document.getElementById('operations-match-carousel')?.closest('section');
      if (anchor) observer.observe(anchor);
      const viewport = window.visualViewport;
      const height = viewport?.height || window.innerHeight;
      const width = viewport?.width || window.innerWidth;
      setPosition(getFinderFocusBounds({ anchorRect: anchor?.getBoundingClientRect(), headerBottom: header?.getBoundingClientRect().bottom, width, height }));
    };
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    measure();
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  // Re-anchor an incoming deep link when async results create the finder shelf.
  }, [resultCount]);
  return position;
}
