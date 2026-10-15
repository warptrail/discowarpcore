import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY_LOCATION } from '../../util/locationStructure';
import { getLocationMapScope, LOCATION_MAP_TIERS } from './locationHierarchy';

export default function useLocationMapScope(locations) {
  const atlasRef = useRef(null);
  const focusFrame = useRef(0);
  const [requested, setRequested] = useState(EMPTY_LOCATION);
  const result = useMemo(() => getLocationMapScope(locations, requested), [locations, requested]);
  const focusMap = useCallback(() => {
    cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      const atlas = atlasRef.current;
      if (!atlas) return;
      const viewport = atlas.querySelector('[aria-label="House location branches"]');
      if (viewport) viewport.scrollTop = 0;
      const headerBottom = document.querySelector('#root header')?.getBoundingClientRect().bottom || 0;
      window.scrollTo({ top: Math.max(0, atlas.getBoundingClientRect().top + window.scrollY - headerBottom - 8),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }, []);
  useEffect(() => () => cancelAnimationFrame(focusFrame.current), []);
  const choose = useCallback((location, focus = true) => {
    setRequested(Object.fromEntries(LOCATION_MAP_TIERS.map(tier => [tier.key, location[tier.key] || ''])));
    if (focus) focusMap();
  }, [focusMap]);
  const change = (level, value, focus = false) => {
    const next = { ...result.scope, [level]: value };
    const index = LOCATION_MAP_TIERS.findIndex(tier => tier.key === level);
    for (const tier of LOCATION_MAP_TIERS.slice(index + 1)) next[tier.key] = '';
    choose(next, focus);
  };
  return { ...result, atlasRef, focusMap, choose, change, reset: (focus = true) => choose(EMPTY_LOCATION, focus) };
}
