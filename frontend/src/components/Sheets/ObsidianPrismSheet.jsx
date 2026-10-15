import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import useDialogFocus from '../../hooks/useDialogFocus';
import useSheetHeaderSwipe from './useSheetHeaderSwipe';

import * as S from './ObsidianPrismSheet.styles';

const EXIT_DURATION_MS = 220;

export default function ObsidianPrismSheet({
  eyebrow,
  title,
  titleLabel,
  context,
  onBack,
  onClose,
  backLabel = 'Back',
  closeLabel = 'Close',
  compact = false,
  headerVariant = 'default',
  fillBody = false,
  footer,
  layer = 0,
  topOffset,
  beforeClose,
  initialFocusSelector,
  returnFocusSelector,
  className,
  style,
  keepHeaderVisible = false,
  slideFromBottom = false,
  openingDurationMs = 260,
  swipeToClose = false,
  centered = false,
  children,
}) {
  const sheetRef = useRef(null);
  const titleId = useId();
  const closeTimerRef = useRef(0);
  const [closing, setClosing] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(0);
  const resolvedHeaderVariant = compact && (headerVariant === 'mini' || (headerVariant === 'handle' && !onBack))
    ? headerVariant : 'default';
  const collapsedHeader = resolvedHeaderVariant === 'handle';

  const dismiss = useCallback((handler) => {
    if (closing || beforeClose?.() === false) return false;
    setClosing(true);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : EXIT_DURATION_MS;
    closeTimerRef.current = window.setTimeout(() => handler?.(), duration);
    return true;
  }, [beforeClose, closing]);

  const headerSwipeHandlers = useSheetHeaderSwipe({
    enabled: swipeToClose,
    closing,
    sheetRef,
    onDismiss: () => dismiss(onClose),
  });

  useDialogFocus(sheetRef, () => dismiss(onClose), true, returnFocusSelector);
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);
  useEffect(() => {
    if (!initialFocusSelector) return undefined;
    const frame = requestAnimationFrame(() => sheetRef.current?.querySelector(initialFocusSelector)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [initialFocusSelector]);

  useLayoutEffect(() => {
    if (topOffset != null) return undefined;
    const header = document.querySelector('#root header');
    if (!header) return undefined;

    const updateHeaderBottom = () => {
      const bottom = Math.max(0, Math.ceil(header.getBoundingClientRect().bottom));
      setHeaderBottom(keepHeaderVisible ? bottom : Math.min(window.innerHeight * 0.4, bottom));
    };
    updateHeaderBottom();

    const observer = new ResizeObserver(updateHeaderBottom);
    observer.observe(header);
    window.addEventListener('resize', updateHeaderBottom);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeaderBottom);
    };
  }, [keepHeaderVisible, topOffset]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <S.Backdrop $closing={closing} $layer={layer} onMouseDown={() => dismiss(onClose)}
        style={keepHeaderVisible ? { background: `linear-gradient(to bottom, transparent 0 ${headerBottom}px, rgba(3, 6, 10, 0.56) ${headerBottom}px 100%)`, backdropFilter: 'none' } : undefined} />
      <S.Sheet
        className={className}
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={collapsedHeader ? undefined : titleId}
        aria-label={collapsedHeader ? titleLabel : undefined}
        data-prism-header-variant={resolvedHeaderVariant}
        tabIndex={-1}
        $closing={closing}
        $layer={layer}
        $footer={Boolean(footer)}
        $slideFromBottom={slideFromBottom}
        $openingDurationMs={openingDurationMs}
        $swipeToClose={swipeToClose}
        $centered={centered}
        style={{ ...style, '--prism-sheet-top': `${topOffset ?? headerBottom}px` }}
      >
        <S.Header data-prism-sheet-header $compact={compact} $hasBack={!compact || Boolean(onBack)}
          $headerVariant={resolvedHeaderVariant}
          $swipeToClose={swipeToClose} {...headerSwipeHandlers}>
          {!compact || onBack ? <S.BackButton
            type="button"
            aria-label={backLabel}
            onClick={() => dismiss(onBack || onClose)}
          >
            ‹
          </S.BackButton> : null}
          {!collapsedHeader ? <S.Heading>
            {eyebrow || !compact ? <S.Eyebrow>{eyebrow}</S.Eyebrow> : null}
            <S.Title id={titleId} aria-label={titleLabel}>{title}</S.Title>
            {context ? <S.Context>{context}</S.Context> : null}
          </S.Heading> : null}
          <S.CloseButton
            type="button"
            aria-label={closeLabel}
            onClick={() => dismiss(onClose)}
          >
            ×
          </S.CloseButton>
        </S.Header>
        <S.Body $fill={fillBody} data-prism-sheet-body>{children}</S.Body>
        {footer}
      </S.Sheet>
    </>,
    document.body,
  );
}
