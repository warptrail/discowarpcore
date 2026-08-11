import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { QUICK_PEEK_EXIT_DURATION_MS } from './OperationsQuickPeek.motion';
import {
  QUICK_PEEK_ITEM_PARAM,
} from './useOperationsQuickPeekItemSelection';
import {
  getQuickPeekDismissHistorySteps,
  PEEK_HISTORY_STATE,
  QUICK_PEEK_ITEM_HISTORY_STATE,
} from './OperationsQuickPeek.history';

const PEEK_PARAM = 'peek';
const MOBILE_PEEK_TOP_RATIO = 0.46;
const PEEK_LABEL_GAP_PX = 8;
const PEEK_ANCHOR_SETTLE_MS = 760;

function normalizeBoxId(value) {
  return String(value || '').replace(/\D/g, '').trim();
}

export function getOperationsBoxAnchorId(boxId) {
  const normalizedId = normalizeBoxId(boxId);
  return normalizedId ? `operations-box-${normalizedId}` : '';
}

export default function useOperationsQuickPeek(boxes = [], { ready = true } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(0);
  const closeTimerRef = useRef(0);
  const triggerRef = useRef(null);
  const previousSelectedIdRef = useRef('');
  const closeViewportRef = useRef(null);

  const previewBoxes = useMemo(
    () =>
      (Array.isArray(boxes) ? boxes : []).filter(
        (box) => normalizeBoxId(box?.box_id) && !box?.isSystemContainer,
      ),
    [boxes],
  );

  const selectedBoxId = normalizeBoxId(searchParams.get(PEEK_PARAM));
  const selectedIndex = previewBoxes.findIndex(
    (box) => normalizeBoxId(box?.box_id) === selectedBoxId,
  );
  const selectedBox = selectedIndex >= 0 ? previewBoxes[selectedIndex] : null;
  const selectedBoxReady = Boolean(selectedBox);

  const writePeekParam = useCallback(
    (boxId, { replace = false, state = location.state } = {}) => {
      const next = new URLSearchParams(searchParams);
      const normalizedId = normalizeBoxId(boxId);
      const currentId = normalizeBoxId(searchParams.get(PEEK_PARAM));
      const nextState = { ...(state || {}) };

      if (normalizedId) {
        next.set(PEEK_PARAM, normalizedId);
      } else {
        next.delete(PEEK_PARAM);
      }

      if (!normalizedId || normalizedId !== currentId) {
        next.delete(QUICK_PEEK_ITEM_PARAM);
        delete nextState[QUICK_PEEK_ITEM_HISTORY_STATE];
      }

      const search = next.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
          hash: normalizedId ? `#${getOperationsBoxAnchorId(normalizedId)}` : '',
        },
        { replace, state: nextState },
      );
    },
    [location.pathname, location.state, navigate, searchParams],
  );

  const commitClose = useCallback(() => {
    setExpanded(false);
    setClosing(false);
    setTransitionDirection(0);

    if (location.state?.[PEEK_HISTORY_STATE]) {
      closeViewportRef.current = {
        left: window.scrollX,
        top: window.scrollY,
        scrollRestoration: window.history.scrollRestoration,
      };
      window.history.scrollRestoration = 'manual';
      navigate(-1);
      return;
    }

    const nextState = { ...(location.state || {}) };
    delete nextState[PEEK_HISTORY_STATE];
    writePeekParam('', { replace: true, state: nextState });
  }, [location.state, navigate, writePeekParam]);

  const commitDismiss = useCallback(() => {
    setExpanded(false);
    setClosing(false);
    setTransitionDirection(0);

    const historySteps = getQuickPeekDismissHistorySteps(location.state);

    if (historySteps) {
      closeViewportRef.current = {
        left: window.scrollX,
        top: window.scrollY,
        scrollRestoration: window.history.scrollRestoration,
      };
      window.history.scrollRestoration = 'manual';
      // Opening a box and then an item creates two intentional history
      // entries. A downward dismissal bypasses both, so it cannot reopen the
      // box list after the item view disappears.
      navigate(-historySteps);
      return;
    }

    const nextState = { ...(location.state || {}) };
    delete nextState[PEEK_HISTORY_STATE];
    delete nextState[QUICK_PEEK_ITEM_HISTORY_STATE];
    writePeekParam('', { replace: true, state: nextState });
  }, [location.state, navigate, writePeekParam]);

  useLayoutEffect(() => {
    const viewport = closeViewportRef.current;
    if (selectedBoxId || !viewport || typeof window === 'undefined') return;

    window.scrollTo({
      left: viewport.left,
      top: viewport.top,
      behavior: 'auto',
    });

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({
        left: viewport.left,
        top: viewport.top,
        behavior: 'auto',
      });
      window.history.scrollRestoration = viewport.scrollRestoration;
      closeViewportRef.current = null;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedBoxId]);

  const close = useCallback(() => {
    if (!selectedBox || closing) return;

    const shouldAnimate =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!shouldAnimate) {
      commitClose();
      return;
    }

    setClosing(true);
    setTransitionDirection(0);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(
      commitClose,
      QUICK_PEEK_EXIT_DURATION_MS,
    );
  }, [closing, commitClose, selectedBox]);

  const dismiss = useCallback(() => {
    if (!selectedBox || closing) return;

    const shouldAnimate =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!shouldAnimate) {
      commitDismiss();
      return;
    }

    setClosing(true);
    setTransitionDirection(0);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(
      commitDismiss,
      QUICK_PEEK_EXIT_DURATION_MS,
    );
  }, [closing, commitDismiss, selectedBox]);

  const openBox = useCallback(
    (box, triggerElement = null, { forceOpen = false } = {}) => {
      const nextId = normalizeBoxId(box?.box_id);
      if (!nextId) return;

      if (triggerElement instanceof HTMLElement) {
        triggerRef.current = triggerElement;
      }

      if (nextId === selectedBoxId && !expanded && !forceOpen) {
        close();
        return;
      }

      if (nextId === selectedBoxId && forceOpen) {
        window.clearTimeout(closeTimerRef.current);
        setClosing(false);
        setTransitionDirection(0);
        return;
      }

      window.clearTimeout(closeTimerRef.current);
      setClosing(false);
      setTransitionDirection(0);
      setExpanded(false);

      if (selectedBoxId) {
        writePeekParam(nextId, { replace: true });
        return;
      }

      writePeekParam(nextId, {
        replace: false,
        state: {
          ...(location.state || {}),
          [PEEK_HISTORY_STATE]: true,
        },
      });
    },
    [
      close,
      expanded,
      location.state,
      selectedBoxId,
      writePeekParam,
    ],
  );

  useEffect(
    () => () => {
      window.clearTimeout(closeTimerRef.current);
      if (closeViewportRef.current) {
        window.history.scrollRestoration =
          closeViewportRef.current.scrollRestoration;
      }
    },
    [],
  );

  const selectOffset = useCallback(
    (offset) => {
      if (!selectedBox || previewBoxes.length < 2) return;

      const nextIndex = selectedIndex + offset;
      if (nextIndex < 0 || nextIndex >= previewBoxes.length) return;

      setTransitionDirection(offset > 0 ? 1 : -1);
      writePeekParam(previewBoxes[nextIndex]?.box_id, { replace: true });
    },
    [
      previewBoxes,
      selectedBox,
      selectedIndex,
      writePeekParam,
    ],
  );

  const openFullBox = useCallback(() => {
    if (!selectedBoxId) return;
    navigate(`/boxes/${selectedBoxId}`);
  }, [navigate, selectedBoxId]);

  useEffect(() => {
    const rawPeek = searchParams.get(PEEK_PARAM);
    const rawItem = searchParams.get(QUICK_PEEK_ITEM_PARAM);
    if (!ready) return;

    if (!rawPeek && rawItem) {
      writePeekParam('', { replace: true, state: location.state });
      return;
    }

    if (!rawPeek || selectedBox) return;

    writePeekParam('', { replace: true, state: location.state });
  }, [
    location.state,
    ready,
    searchParams,
    selectedBox,
    writePeekParam,
  ]);

  useEffect(() => {
    if (!selectedBoxReady || !selectedBoxId || typeof window === 'undefined') {
      return undefined;
    }
    if (!window.matchMedia('(max-width: 767px)').matches) return undefined;
    if (expanded) return undefined;

    let frameId = 0;
    let settleTimerId = 0;

    const alignSelectedRow = (behavior) => {
      const anchor = document.getElementById(
        getOperationsBoxAnchorId(selectedBoxId),
      );
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      const appHeaderBottom =
        document.querySelector('#root header')?.getBoundingClientRect().bottom || 0;
      const peekTop = window.innerHeight * MOBILE_PEEK_TOP_RATIO;
      const targetBottom = Math.max(
        appHeaderBottom + anchorRect.height + PEEK_LABEL_GAP_PX,
        peekTop - PEEK_LABEL_GAP_PX,
      );
      const scrollDelta = anchorRect.bottom - targetBottom;

      if (Math.abs(scrollDelta) < 2) return;
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      window.scrollTo({
        top: Math.max(0, window.scrollY + scrollDelta),
        behavior: reduceMotion ? 'auto' : behavior,
      });
    };

    frameId = window.requestAnimationFrame(() => {
      alignSelectedRow('smooth');
      settleTimerId = window.setTimeout(() => {
        alignSelectedRow('auto');
      }, PEEK_ANCHOR_SETTLE_MS);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(settleTimerId);
    };
  }, [expanded, selectedBoxId, selectedBoxReady]);

  useEffect(() => {
    if (!selectedBox || expanded || typeof window === 'undefined') {
      return undefined;
    }
    if (!window.matchMedia('(max-width: 767px)').matches) return undefined;

    const preventBackgroundScroll = (event) => {
      const target = event.target;
      const scrollRegion =
        target instanceof Element
          ? target.closest('[data-quick-peek-scroll-region]')
          : null;

      if (scrollRegion) {
        const hasScrollableOverflow =
          scrollRegion.scrollHeight > scrollRegion.clientHeight + 1;

        if (event.type === 'wheel' && hasScrollableOverflow) {
          const canScrollUp = event.deltaY < 0 && scrollRegion.scrollTop > 0;
          const canScrollDown =
            event.deltaY > 0 &&
            scrollRegion.scrollTop + scrollRegion.clientHeight <
              scrollRegion.scrollHeight - 1;

          if (canScrollUp || canScrollDown) return;
        } else if (event.type === 'touchmove' && hasScrollableOverflow) {
          return;
        }
      }

      event.preventDefault();
    };

    document.addEventListener('wheel', preventBackgroundScroll, {
      passive: false,
    });
    document.addEventListener('touchmove', preventBackgroundScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener('wheel', preventBackgroundScroll);
      document.removeEventListener('touchmove', preventBackgroundScroll);
    };
  }, [expanded, selectedBox]);

  useEffect(() => {
    const previousId = previousSelectedIdRef.current;
    previousSelectedIdRef.current = selectedBoxId;

    if (!previousId || selectedBoxId || !triggerRef.current) return;
    triggerRef.current.focus?.({ preventScroll: true });
  }, [selectedBoxId]);

  useEffect(() => {
    if (!selectedBox) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        event.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close, selectedBox]);

  return {
    selectedBox,
    selectedBoxId,
    selectedIndex,
    totalBoxes: previewBoxes.length,
    expanded,
    closing,
    transitionDirection,
    canSelectPrevious: selectedIndex > 0,
    canSelectNext:
      selectedIndex >= 0 && selectedIndex < previewBoxes.length - 1,
    openBox,
    close,
    dismiss,
    openFullBox,
    selectPrevious: () => selectOffset(-1),
    selectNext: () => selectOffset(1),
    setExpanded,
  };
}
