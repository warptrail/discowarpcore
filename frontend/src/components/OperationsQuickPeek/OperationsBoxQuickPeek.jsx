import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../../util/inventoryColorTheme';
import QuickPeekBoxHeader from './QuickPeekBoxHeader';
import QuickPeekItemCarousel from './QuickPeekItemCarousel';
import QuickPeekItemList from './QuickPeekItemList';
import useOperationsQuickPeekItemSelection from './useOperationsQuickPeekItemSelection';
import {
  OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT,
  OPERATIONS_QUICK_PEEK_SEARCH_TOGGLE_EVENT,
} from '../../constants/inventoryFinderEvents';
import * as S from './OperationsQuickPeek.styles';

const HORIZONTAL_SWIPE_THRESHOLD = 54;
const VERTICAL_DETENT_THRESHOLD = 42;

function getBoxImageUrl(box) {
  return (
    box?.image?.thumb?.url ||
    box?.image?.display?.url ||
    box?.image?.original?.url ||
    box?.image?.url ||
    box?.imagePath ||
    ''
  );
}

function getTags(box) {
  if (Array.isArray(box?.tags)) return box.tags.filter(Boolean);
  return String(box?.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function OperationsBoxQuickPeek({
  box,
  position,
  total,
  expanded,
  closing,
  transitionDirection,
  canSelectPrevious,
  canSelectNext,
  onPrevious,
  onNext,
  onToggleExpanded,
  onSetExpanded,
  onClose,
  onOpenFullBox,
}) {
  const gestureRef = useRef(null);
  const suppressDetentClickRef = useRef(false);
  const suppressDetentResetTimerRef = useRef(0);
  const sheetRef = useRef(null);
  const [headerBottom, setHeaderBottom] = useState(140);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const boxId = box?.box_id;
  const boxThemeStyle = getBoxThemeCssVars(getBoxTheme(boxId));
  const title = String(box?.label || box?.name || 'Untitled box').trim();
  const imageUrl = getBoxImageUrl(box);
  const description = String(box?.description || '').trim();
  const notes = String(box?.notes || '').trim();
  const tags = getTags(box);
  const childBoxes = Array.isArray(box?.childBoxes) ? box.childBoxes : [];
  const items = useMemo(
    () => (Array.isArray(box?.items) ? box.items : []),
    [box?.items],
  );
  const itemSelection = useOperationsQuickPeekItemSelection(items, {
    boxId,
  });
  const selectedQuickPeekItem = itemSelection.selectedItem;
  const backToItemList = itemSelection.backToItems;
  const normalizedItemQuery = itemQuery.trim().toLowerCase();
  const visibleItems = useMemo(() => {
    if (!normalizedItemQuery) return items;

    return items.filter((item) => {
      const tags = Array.isArray(item?.tags) ? item.tags : [item?.tags];
      return [
        item?.name,
        item?.label,
        item?.category,
        item?.description,
        item?.notes,
        ...tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedItemQuery);
    });
  }, [items, normalizedItemQuery]);

  const closeQuickSearch = useCallback(() => {
    setQuickSearchOpen(false);
    setItemQuery('');
  }, []);

  useEffect(() => {
    const handleQuickSearchToggle = () => {
      setQuickSearchOpen((current) => {
        if (current) setItemQuery('');
        return !current;
      });
    };

    window.addEventListener(
      OPERATIONS_QUICK_PEEK_SEARCH_TOGGLE_EVENT,
      handleQuickSearchToggle,
    );
    return () =>
      window.removeEventListener(
        OPERATIONS_QUICK_PEEK_SEARCH_TOGGLE_EVENT,
        handleQuickSearchToggle,
      );
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT, {
        detail: { open: quickSearchOpen, boxId },
      }),
    );
  }, [boxId, quickSearchOpen]);

  useEffect(
    () => () => {
      window.dispatchEvent(
        new CustomEvent(OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT, {
          detail: { open: false, boxId },
        }),
      );
    },
    [boxId],
  );

  useEffect(() => {
    setItemQuery('');
  }, [boxId]);

  useEffect(() => {
    if (!quickSearchOpen || !selectedQuickPeekItem) return;
    backToItemList();
  }, [backToItemList, quickSearchOpen, selectedQuickPeekItem]);

  useEffect(() => {
    if (!boxId) return;
    sheetRef.current?.focus({ preventScroll: true });
  }, [boxId]);

  useEffect(() => {
    if (!box) return undefined;

    const handleOutsideClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (sheetRef.current?.contains(target)) return;
      if (target.closest('[data-operations-box-preview-trigger]')) return;
      if (target.closest('header')) return;
      onClose?.();
    };

    document.addEventListener('click', handleOutsideClick, true);
    return () =>
      document.removeEventListener('click', handleOutsideClick, true);
  }, [box, onClose]);

  useEffect(() => {
    if (!box) return undefined;

    const appHeader = document.querySelector('#root header');
    let frameId = 0;

    const measureHeader = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const bottom = appHeader?.getBoundingClientRect().bottom;
        if (!Number.isFinite(bottom)) return;
        setHeaderBottom(Math.max(8, Math.round(bottom) + 8));
      });
    };

    const resizeObserver =
      appHeader && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measureHeader)
        : null;

    resizeObserver?.observe(appHeader);
    window.addEventListener('resize', measureHeader);
    window.addEventListener('scroll', measureHeader, { passive: true });
    measureHeader();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureHeader);
      window.removeEventListener('scroll', measureHeader);
    };
  }, [box]);

  useEffect(
    () => () => window.clearTimeout(suppressDetentResetTimerRef.current),
    [],
  );

  if (!box || typeof document === 'undefined') return null;

  const handlePointerDown = (event) => {
    const interactiveTarget = event.target.closest('button, a');
    const isDragHandle = interactiveTarget?.hasAttribute(
      'data-quick-peek-drag-handle',
    );
    if (event.button !== 0 || (interactiveTarget && !isDragHandle)) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const finishGesture = (event) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    const vertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.2;

    if (horizontal && Math.abs(deltaX) >= HORIZONTAL_SWIPE_THRESHOLD) {
      suppressDetentClickRef.current = true;
      window.clearTimeout(suppressDetentResetTimerRef.current);
      suppressDetentResetTimerRef.current = window.setTimeout(() => {
        suppressDetentClickRef.current = false;
      }, 0);
      if (deltaX < 0) onNext?.();
      else onPrevious?.();
      return;
    }

    if (vertical && Math.abs(deltaY) >= VERTICAL_DETENT_THRESHOLD) {
      suppressDetentClickRef.current = true;
      window.clearTimeout(suppressDetentResetTimerRef.current);
      suppressDetentResetTimerRef.current = window.setTimeout(() => {
        suppressDetentClickRef.current = false;
      }, 0);
      if (deltaY < 0) onSetExpanded?.(true);
      else onClose?.();
    }
  };

  const cancelGesture = () => {
    gestureRef.current = null;
  };

  const handleDetentClick = () => {
    if (suppressDetentClickRef.current) {
      window.clearTimeout(suppressDetentResetTimerRef.current);
      suppressDetentClickRef.current = false;
      return;
    }
    onToggleExpanded?.();
  };

  return createPortal(
    <S.Deck
      ref={sheetRef}
      id="operations-box-quick-peek"
      role="complementary"
      aria-label={`Quick peek at box ${title}`}
      tabIndex={-1}
      $expanded={expanded}
      $closing={closing}
      style={{
        ...boxThemeStyle,
        '--operations-quick-peek-top': `${headerBottom}px`,
      }}
    >
      <QuickPeekBoxHeader
        box={box}
        imageUrl={imageUrl}
        position={position}
        total={total}
        expanded={expanded}
        canSelectPrevious={canSelectPrevious}
        canSelectNext={canSelectNext}
        onPrevious={onPrevious}
        onNext={onNext}
        onToggleExpanded={handleDetentClick}
        onPointerDown={handlePointerDown}
        onPointerUp={finishGesture}
        onPointerCancel={cancelGesture}
        searchOpen={quickSearchOpen}
        searchQuery={itemQuery}
        onSearchChange={setItemQuery}
        onSearchClose={closeQuickSearch}
      />

      <S.DeckContent
        key={box.box_id}
        $direction={itemSelection.selectedItem ? 0 : transitionDirection}
        data-quick-peek-scroll-region
      >
        {itemSelection.selectedItem ? (
          <QuickPeekItemCarousel
            key={String(itemSelection.selectedItem?._id || itemSelection.selectedItem?.id || '')}
            item={itemSelection.selectedItem}
            position={itemSelection.selectedIndex + 1}
            total={itemSelection.totalItems}
            transitionDirection={itemSelection.transitionDirection}
            canSelectPrevious={itemSelection.canSelectPrevious}
            canSelectNext={itemSelection.canSelectNext}
            onPrevious={itemSelection.selectPrevious}
            onNext={itemSelection.selectNext}
            onBack={itemSelection.backToItems}
          />
        ) : (
          <>
            {description || notes || tags.length > 0 ? (
              <S.BoxSnapshot>
                <S.BoxSnapshotText>
                  {description ? (
                    <S.BoxDescription>{description}</S.BoxDescription>
                  ) : null}
                  {notes ? (
                    <S.BoxNotes>
                      <S.MetaLabel>Notes</S.MetaLabel>
                      {notes}
                    </S.BoxNotes>
                  ) : null}
                  {tags.length > 0 ? (
                    <S.TagLine aria-label="Box tags">
                      {tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </S.TagLine>
                  ) : null}
                </S.BoxSnapshotText>
              </S.BoxSnapshot>
            ) : null}

            <S.ItemsHeader>
              <span>Direct items</span>
              <S.ItemsCount>
                {visibleItems.length}{' '}
                {normalizedItemQuery
                  ? visibleItems.length === 1
                    ? 'match'
                    : 'matches'
                  : visibleItems.length === 1
                    ? 'item'
                    : 'items'}
              </S.ItemsCount>
            </S.ItemsHeader>

            <QuickPeekItemList
              items={visibleItems}
              emptyMessage={
                normalizedItemQuery
                  ? 'No direct items match that signal.'
                  : undefined
              }
              onSelectItem={(item) => {
                closeQuickSearch();
                itemSelection.openItem(item);
              }}
            />

            {childBoxes.length > 0 ? (
              <S.NestedBoxes>
                <summary>
                  Nested boxes
                  <span>{childBoxes.length}</span>
                </summary>
                <S.NestedBoxList>
                  {childBoxes.map((child) => (
                    <li key={child?._id || child?.box_id}>
                      <code>#{child?.box_id}</code>
                      {child?.label || child?.name || 'Untitled box'}
                    </li>
                  ))}
                </S.NestedBoxList>
              </S.NestedBoxes>
            ) : null}
          </>
        )}
      </S.DeckContent>

      <S.OpenFullBoxButton
        type="button"
        $expanded={expanded}
        onClick={
          itemSelection.selectedItem
            ? itemSelection.openFullItem
            : onOpenFullBox
        }
      >
        {itemSelection.selectedItem ? 'Open full item' : 'Open full box'}
        <S.OpenFullBoxIcon
          aria-hidden="true"
          viewBox="0 0 20 20"
          focusable="false"
        >
          <path d="M6 14 14 6" />
          <path d="M8 6h6v6" />
        </S.OpenFullBoxIcon>
      </S.OpenFullBoxButton>
    </S.Deck>,
    document.body,
  );
}
