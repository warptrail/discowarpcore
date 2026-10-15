import useTagReturnSnapshot from '../../hooks/useTagReturnSnapshot';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { getQuickPeekExitDuration } from './OperationsQuickPeek.motion';
import useIsMobile from '../../hooks/useIsMobile';
import {
  QUICK_PEEK_ITEM_PARAM,
} from './useOperationsQuickPeekItemSelection';
import {
  getQuickPeekDismissState,
  PEEK_HISTORY_STATE,
  QUICK_PEEK_ITEM_HISTORY_STATE,
} from './OperationsQuickPeek.history';

const PEEK_PARAM = 'peek';
const MOBILE_PEEK_TOP_RATIO = 0.46;
const PEEK_LABEL_GAP_PX = 8;
const DESKTOP_PEEK_HEADER_GAP_PX = 10;
const PEEK_ANCHOR_SETTLE_MS = 760;

function normalizeBoxId(value) {
  if (value === 'adrift') return 'adrift';
  return String(value || '').replace(/\D/g, '').trim();
}

export function getOperationsBoxAnchorId(boxId) {
  const normalizedId = normalizeBoxId(boxId);
  return normalizedId ? `operations-box-${normalizedId}` : '';
}

export default function useOperationsQuickPeek(boxes = [], { ready = true } = {}) {
  const mobile = useIsMobile(767);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const source = useTagReturnSnapshot();
  const [expanded, setExpanded] = useState(() => source?.peekExpanded || false);
  const [closing, setClosing] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(0);
  const closeTimerRef = useRef(0);
  const triggerRef = useRef(null);
  const previousSelectedIdRef = useRef('');

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

    const nextState = getQuickPeekDismissState(location.state);
    // Panel dismissal clears the current selection; browsing history is not
    // a reliable representation of the panel's local state.
    writePeekParam('', { replace: true, state: nextState });
  }, [location.state, writePeekParam]);

  const commitDismiss = commitClose;

  const close = useCallback(() => {
    if (!selectedBox || closing) return;

    const exitDuration = typeof window === 'undefined' ? 0 : getQuickPeekExitDuration(window);

    if (!exitDuration) {
      commitClose();
      return;
    }

    setClosing(true);
    setTransitionDirection(0);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(
      commitClose,
      exitDuration,
    );
  }, [closing, commitClose, selectedBox]);

  const dismiss = useCallback(() => {
    if (!selectedBox || closing) return;

    const exitDuration = typeof window === 'undefined' ? 0 : getQuickPeekExitDuration(window);

    if (!exitDuration) {
      commitDismiss();
      return;
    }

    setClosing(true);
    setTransitionDirection(0);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(
      commitDismiss,
      exitDuration,
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
    if (!selectedBoxId || selectedBoxId === 'adrift') return;
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
    const mobileViewport = mobile;
    if (source || (mobileViewport && expanded)) return undefined;

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
      if (window.innerWidth >= 1100 && anchorRect.top >= appHeaderBottom && anchorRect.bottom <= window.innerHeight) return;
      const scrollDelta = mobileViewport
        ? anchorRect.bottom - Math.max(
            appHeaderBottom + anchorRect.height + PEEK_LABEL_GAP_PX,
            window.innerHeight * MOBILE_PEEK_TOP_RATIO - PEEK_LABEL_GAP_PX,
          )
        : anchorRect.top - (appHeaderBottom + DESKTOP_PEEK_HEADER_GAP_PX);

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
  }, [expanded, mobile, selectedBoxId, selectedBoxReady, source]);

  useEffect(() => {
    if (!selectedBox || expanded || typeof window === 'undefined') {
      return undefined;
    }
    if (!mobile) return undefined;

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
  }, [expanded, mobile, selectedBox]);

  useEffect(() => {
    const previousId = previousSelectedIdRef.current;
    previousSelectedIdRef.current = selectedBoxId;

    if (!previousId || selectedBoxId || !triggerRef.current) return;
    triggerRef.current.focus?.({ preventScroll: true });
  }, [selectedBoxId]);

  useEffect(() => {
    if (!selectedBox) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        event.preventDefault();
        if (window.innerWidth >= 1100) dismiss();
        else close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close, dismiss, selectedBox]);

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
