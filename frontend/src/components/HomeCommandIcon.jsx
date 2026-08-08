import { useEffect, useState } from 'react';
import styled from 'styled-components';
import houseCommandIcon from '../assets/house-command-icon.webp';

const HOME_ICON_HUES = [0, 34, 78, 126, 176, 224, 278, 324];

const Icon = styled.img`
  display: block;
  width: var(--home-icon-size, clamp(1.55rem, 5vw, 2.15rem));
  height: var(--home-icon-size, clamp(1.55rem, 5vw, 2.15rem));
  object-fit: contain;
  filter: hue-rotate(var(--home-icon-hue, 0deg)) saturate(1.16) brightness(1.08);
  transition: filter var(--home-icon-transition, 340ms)
    cubic-bezier(0.22, 1, 0.36, 1);
  will-change: filter;

  @media (prefers-reduced-motion: reduce) {
    filter: none;
    transition: none;
  }
`;

function getNextSignal(currentHue) {
  const alternatives = HOME_ICON_HUES.filter((hue) => hue !== currentHue);
  const hue = alternatives[Math.floor(Math.random() * alternatives.length)] || 0;

  return {
    hue,
    transitionMs: 220 + Math.floor(Math.random() * 281),
  };
}

export default function HomeCommandIcon({ size, ...props }) {
  const [signal, setSignal] = useState({ hue: 0, transitionMs: 340 });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return undefined;

    let timeoutId;
    let cancelled = false;
    const schedule = () => {
      const waitMs = 500 + Math.floor(Math.random() * 1501);
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        setSignal((current) => getNextSignal(current.hue));
        schedule();
      }, waitMs);
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Icon
      src={houseCommandIcon}
      {...props}
      style={{
        ...(props.style || {}),
        '--home-icon-hue': `${signal.hue}deg`,
        '--home-icon-transition': `${signal.transitionMs}ms`,
        ...(size ? { '--home-icon-size': size } : {}),
      }}
    />
  );
}
