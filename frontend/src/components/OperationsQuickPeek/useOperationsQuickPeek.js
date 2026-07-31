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

const PEEK_PARAM = 'peek';
const PEEK_HISTORY_STATE = 'operationsQuickPeekEntry';

function normalizeBoxId(value) {
  return String(value || '').replace(/\D/g, '').trim();
}

export default function useOperationsQuickPeek(boxes = [], { ready = true } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(0);
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

  const writePeekParam = useCallback(
    (boxId, { replace = false, state = location.state } = {}) => {
      const next = new URLSearchParams(searchParams);
      const normalizedId = normalizeBoxId(boxId);

      if (normalizedId) {
        next.set(PEEK_PARAM, normalizedId);
      } else {
        next.delete(PEEK_PARAM);
      }

      setSearchParams(next, { replace, state });
    },
    [location.state, searchParams, setSearchParams],
  );

  const openBox = useCallback(
    (box, triggerElement = null) => {
      const nextId = normalizeBoxId(box?.box_id);
      if (!nextId) return;

      if (triggerElement instanceof HTMLElement) {
        triggerRef.current = triggerElement;
      }
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
    [location.state, selectedBoxId, writePeekParam],
  );

  const close = useCallback(() => {
    setExpanded(false);
    setTransitionDirection(0);

    if (location.state?.[PEEK_HISTORY_STATE]) {
      navigate(-1);
      return;
    }

    const nextState = { ...(location.state || {}) };
    delete nextState[PEEK_HISTORY_STATE];
    writePeekParam('', { replace: true, state: nextState });
  }, [location.state, navigate, writePeekParam]);

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
    if (!ready || !rawPeek || selectedBox) return;

    const next = new URLSearchParams(searchParams);
    next.delete(PEEK_PARAM);
    setSearchParams(next, { replace: true, state: location.state });
  }, [
    location.state,
    ready,
    searchParams,
    selectedBox,
    setSearchParams,
  ]);

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
    transitionDirection,
    canSelectPrevious: selectedIndex > 0,
    canSelectNext:
      selectedIndex >= 0 && selectedIndex < previewBoxes.length - 1,
    openBox,
    close,
    openFullBox,
    selectPrevious: () => selectOffset(-1),
    selectNext: () => selectOffset(1),
    setExpanded,
  };
}
