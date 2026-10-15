import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import OperationsConsoleIcon from './OperationsConsoleIcon';
import { CONSOLE_TIPS, getConsoleTipMotion, nextConsoleTipIndex } from './consoleTips';
import * as S from './OperationsConsoleIdleTicker.styles';

export default function OperationsConsoleIdleTicker() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [environment, setEnvironment] = useState({ hidden: false, reducedMotion: false });
  const [motion, setMotion] = useState({ distance: 0, durationMs: 14000 });
  const windowRef = useRef(null);
  const copyRef = useRef(null);
  const tip = CONSOLE_TIPS[index];
  const stopped = paused || environment.hidden || environment.reducedMotion;
  const next = () => setIndex(nextConsoleTipIndex);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnvironment({ hidden: document.hidden, reducedMotion: media.matches });
    update();
    document.addEventListener('visibilitychange', update);
    media.addEventListener('change', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      media.removeEventListener('change', update);
    };
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      if (!windowRef.current || !copyRef.current) return;
      const measured = getConsoleTipMotion(copyRef.current.offsetWidth, windowRef.current.clientWidth);
      setMotion((previous) => previous.distance === measured.distance && previous.durationMs === measured.durationMs ? previous : measured);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(windowRef.current);
    observer.observe(copyRef.current);
    return () => observer.disconnect();
  }, [index]);

  return <S.Row role="group" aria-label="Console tips" aria-live="off">
    <OperationsConsoleIcon idle paused={stopped} />
    <S.Window ref={windowRef} title={`${tip.kind}: ${tip.text}`}
      tabIndex={environment.reducedMotion ? 0 : undefined}
      role={environment.reducedMotion ? 'region' : undefined} aria-label={environment.reducedMotion ? 'Read console tip' : undefined}>
      <S.Copy key={tip.id} ref={copyRef} data-console-scroll $paused={stopped}
        style={{ '--tip-distance': `${motion.distance}px`, '--tip-duration': `${motion.durationMs}ms` }}
        onAnimationEnd={(event) => { if (event.target === event.currentTarget && !stopped) next(); }}>
        <S.Kind>{tip.kind} · </S.Kind>{tip.text}
      </S.Copy>
    </S.Window>
    <S.Button type="button" data-tip-pause aria-label={paused ? 'Resume console tips' : 'Pause console tips'}
      aria-pressed={paused} title={paused ? 'Resume console tips' : 'Pause console tips'} onClick={() => setPaused((current) => !current)}>
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">{paused ? <path d="m5 3 7 5-7 5Z" /> : <path d="M5 3v10M11 3v10" />}</svg>
    </S.Button>
    <S.Button type="button" aria-label="Next console tip" title="Next console tip" onClick={next}>
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m5 3 5 5-5 5" /></svg>
    </S.Button>
  </S.Row>;
}
