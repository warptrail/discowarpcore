import { useLayoutEffect, useState } from 'react';
import { getSelectMenuBounds } from '../util/selectMenuGeometry';

const THEME_VARIABLES = [
  '--box-primary', '--box-primary-rgb', '--box-secondary', '--box-secondary-rgb',
  '--item-accent', '--item-accent-rgb', '--domain-rgb',
];

export default function useFloatingSelectMenu(anchorRef, open) {
  const [style, setStyle] = useState(null);
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;
    const anchor = anchorRef.current;
    let frame = 0;
    const update = () => {
      const visual = window.visualViewport;
      const viewport = {
        left: visual?.offsetLeft || 0,
        top: visual?.offsetTop || 0,
        width: visual?.width || window.innerWidth,
        height: visual?.height || window.innerHeight,
      };
      const computed = getComputedStyle(anchor);
      const theme = Object.fromEntries(THEME_VARIABLES
        .map((key) => [key, computed.getPropertyValue(key).trim()])
        .filter(([, value]) => value));
      const next = { ...theme, ...getSelectMenuBounds(anchor.getBoundingClientRect(), viewport, window.innerHeight) };
      setStyle((current) => current && Object.keys(next).every((key) => current[key] === next[key]) ? current : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(anchor);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
    };
  }, [anchorRef, open]);
  return open ? style : null;
}
