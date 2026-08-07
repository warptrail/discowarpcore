import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { getItemHomeHref } from '../../api/itemDetails';

export const QUICK_PEEK_ITEM_PARAM = 'item';
export const QUICK_PEEK_ITEM_HISTORY_STATE =
  'operationsQuickPeekItemEntry';

function getItemId(item) {
  return String(item?._id || item?.id || '').trim();
}

export default function useOperationsQuickPeekItemSelection(
  items = [],
  { boxId = '' } = {},
) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [transitionDirection, setTransitionDirection] = useState(0);

  const selectableItems = useMemo(
    () =>
      (Array.isArray(items) ? items : []).filter((item) => getItemId(item)),
    [items],
  );
  const selectedItemId = String(
    searchParams.get(QUICK_PEEK_ITEM_PARAM) || '',
  ).trim();
  const selectedIndex = selectableItems.findIndex(
    (item) => getItemId(item) === selectedItemId,
  );
  const selectedItem =
    selectedIndex >= 0 ? selectableItems[selectedIndex] : null;

  const writeItemParam = useCallback(
    (itemId, { replace = false, state = location.state } = {}) => {
      const next = new URLSearchParams(searchParams);
      const normalizedId = String(itemId || '').trim();
      const nextState = { ...(state || {}) };

      if (normalizedId) {
        next.set(QUICK_PEEK_ITEM_PARAM, normalizedId);
      } else {
        next.delete(QUICK_PEEK_ITEM_PARAM);
        delete nextState[QUICK_PEEK_ITEM_HISTORY_STATE];
      }

      const search = next.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
          hash: location.hash,
        },
        { replace, state: nextState },
      );
    },
    [location.hash, location.pathname, location.state, navigate, searchParams],
  );

  const openItem = useCallback(
    (item) => {
      const itemId = getItemId(item);
      if (!boxId || !itemId) return;

      setTransitionDirection(0);
      writeItemParam(itemId, {
        replace: false,
        state: {
          ...(location.state || {}),
          [QUICK_PEEK_ITEM_HISTORY_STATE]: true,
        },
      });
    },
    [boxId, location.state, writeItemParam],
  );

  const selectOffset = useCallback(
    (offset) => {
      if (!selectedItem || selectableItems.length < 2) return;

      const nextIndex = selectedIndex + offset;
      if (nextIndex < 0 || nextIndex >= selectableItems.length) return;

      setTransitionDirection(offset > 0 ? 1 : -1);
      writeItemParam(getItemId(selectableItems[nextIndex]), {
        replace: true,
      });
    },
    [selectableItems, selectedIndex, selectedItem, writeItemParam],
  );

  const backToItems = useCallback(() => {
    setTransitionDirection(0);

    if (location.state?.[QUICK_PEEK_ITEM_HISTORY_STATE]) {
      navigate(-1);
      return;
    }

    writeItemParam('', { replace: true });
  }, [location.state, navigate, writeItemParam]);

  const openFullItem = useCallback(() => {
    if (!selectedItemId) return;
    navigate(getItemHomeHref(selectedItemId));
  }, [navigate, selectedItemId]);

  useEffect(() => {
    if (!selectedItemId || !boxId || selectedItem) return;
    writeItemParam('', { replace: true });
  }, [boxId, selectedItem, selectedItemId, writeItemParam]);

  useEffect(() => {
    if (!selectedItem) return undefined;

    const handleKeyDown = (event) => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      const target = event.target;
      const isTypingTarget = target instanceof Element && Boolean(
        target.closest('input, textarea, select, [contenteditable="true"]'),
      );

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        backToItems();
        return;
      }

      if (isTypingTarget) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      event.preventDefault();
      if (event.key === 'ArrowLeft') selectOffset(-1);
      else selectOffset(1);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [backToItems, selectOffset, selectedItem]);

  return {
    selectedItem,
    selectedItemId,
    selectedIndex,
    totalItems: selectableItems.length,
    transitionDirection,
    canSelectPrevious: selectedIndex > 0,
    canSelectNext:
      selectedIndex >= 0 && selectedIndex < selectableItems.length - 1,
    openItem,
    backToItems,
    openFullItem,
    selectPrevious: () => selectOffset(-1),
    selectNext: () => selectOffset(1),
  };
}
