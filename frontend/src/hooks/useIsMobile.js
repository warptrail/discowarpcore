import { useEffect, useMemo, useState } from 'react';

export default function useIsMobile(maxWidth = 768) {
  const mediaQuery = useMemo(() => `(max-width: ${maxWidth}px)`, [maxWidth]);

  const getMatches = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(mediaQuery).matches;
  };

  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaList = window.matchMedia(mediaQuery);
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaList.matches);

    if (typeof mediaList.addEventListener === 'function') {
      mediaList.addEventListener('change', handleChange);
      return () => mediaList.removeEventListener('change', handleChange);
    }

    mediaList.addListener(handleChange);
    return () => mediaList.removeListener(handleChange);
  }, [mediaQuery]);

  return isMobile;
}
