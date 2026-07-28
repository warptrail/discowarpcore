import { useEffect, useRef, useState } from 'react';

import * as S from './Declutter.styles';

const DEFAULT_HOLD_MS = 1100;

export default function DeclutterHoldButton({
  children,
  disabled = false,
  holdMs = DEFAULT_HOLD_MS,
  onComplete,
}) {
  const timerRef = useRef(null);
  const [holding, setHolding] = useState(false);

  const cancel = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setHolding(false);
  };

  const begin = () => {
    if (disabled || holding || timerRef.current) return;
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setHolding(false);
      onComplete?.();
    }, holdMs);
  };

  useEffect(() => cancel, []);

  return (
    <S.CompactHoldButton
      type="button"
      disabled={disabled}
      $holding={holding}
      $holdMs={holdMs}
      aria-label={`${children}. Press and hold to confirm.`}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.repeat) return;
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          begin();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') cancel();
      }}
    >
      {holding ? 'Keep holding…' : children}
    </S.CompactHoldButton>
  );
}
