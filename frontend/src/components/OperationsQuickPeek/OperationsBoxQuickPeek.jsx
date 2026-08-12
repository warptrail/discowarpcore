import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getBoxTheme,
  getBoxThemeCssVars,
} from '../../util/inventoryColorTheme';
import QuickPeekBoxHeader from './QuickPeekBoxHeader';
import QuickPeekBoxPhotoView from './QuickPeekBoxPhotoView';
import QuickPeekItemCarousel from './QuickPeekItemCarousel';
import QuickPeekItemActionPanel from './QuickPeekItemActionPanel';
import QuickPeekItemNoteModal from './QuickPeekItemNoteModal';
import QuickPeekItemList from './QuickPeekItemList';
import QuickPeekNoteModal from './QuickPeekNoteModal';
import useOperationsQuickPeekItemSelection from './useOperationsQuickPeekItemSelection';
import useItemDeclutterDeck from '../../hooks/useItemDeclutterDeck';
import { ToastContext } from '../Toast';
import {
  OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT,
  OPERATIONS_QUICK_PEEK_SEARCH_TOGGLE_EVENT,
} from '../../constants/inventoryFinderEvents';
import * as S from './OperationsQuickPeek.styles';
import {
  getBoxPreviewImageUrl,
  getBoxThumbnailUrl,
} from '../../util/itemImage';

const HORIZONTAL_SWIPE_THRESHOLD = 54;
const VERTICAL_DETENT_THRESHOLD = 42;

function normalizeItemSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getBoxImageUrl(box) {
  return getBoxThumbnailUrl(box);
}

function getBoxDisplayImageUrl(box) {
  return getBoxPreviewImageUrl(box);
}

export default function OperationsBoxQuickPeek({
  box,
  position,
  total,
  expanded,
  closing,
  transitionDirection,
  surface = 'items',
  canSelectPrevious,
  canSelectNext,
  onPrevious,
  onNext,
  onToggleExpanded,
  onSetExpanded,
  onShowItems,
  onClose,
  onDismiss,
  onOpenFullBox,
}) {
  const gestureRef = useRef(null);
  const suppressDetentClickRef = useRef(false);
  const suppressDetentResetTimerRef = useRef(0);
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const notePreviewButtonRef = useRef(null);
  const [headerBottom, setHeaderBottom] = useState(140);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const [noteReaderOpen, setNoteReaderOpen] = useState(false);
  const [itemNoteReaderOpen, setItemNoteReaderOpen] = useState(false);
  const [declutterDeckOverrides, setDeclutterDeckOverrides] = useState({});
  const [itemOverrides, setItemOverrides] = useState({});
  const { showToast, hideToast } = useContext(ToastContext) || {};
  const boxId = box?.box_id;
  const boxThemeStyle = getBoxThemeCssVars(getBoxTheme(boxId));
  const title = String(box?.label || box?.name || 'Untitled box').trim();
  const imageUrl = getBoxImageUrl(box);
  const displayImageUrl = getBoxDisplayImageUrl(box);
  const photoFocused = surface === 'photo' && Boolean(displayImageUrl);
  const description = String(box?.description || '').trim();
  const notes = String(box?.notes || '').trim();
  const childBoxes = Array.isArray(box?.childBoxes) ? box.childBoxes : [];
  const items = useMemo(
    () => (Array.isArray(box?.items) ? box.items : []),
    [box?.items],
  );
  const itemSelection = useOperationsQuickPeekItemSelection(items, {
    boxId,
  });
  const selectedQuickPeekItem = itemSelection.selectedItem;
  const selectedQuickPeekItemId = String(
    selectedQuickPeekItem?._id || selectedQuickPeekItem?.id || '',
  );
  useEffect(() => {
    setItemNoteReaderOpen(false);
  }, [selectedQuickPeekItemId]);
  const selectedQuickPeekItemWithDeckState = useMemo(() => {
    if (!selectedQuickPeekItem) {
      return selectedQuickPeekItem;
    }
    return {
      ...selectedQuickPeekItem,
      ...(itemOverrides[selectedQuickPeekItemId] || {}),
      ...(selectedQuickPeekItemId in declutterDeckOverrides ? {
        declutterReadiness: declutterDeckOverrides[selectedQuickPeekItemId]
          ? 'in_deck'
          : 'not_considered',
      } : {}),
    };
  }, [declutterDeckOverrides, itemOverrides, selectedQuickPeekItem, selectedQuickPeekItemId]);
  const handleDeclutterStateChange = useCallback((inDeck) => {
    if (!selectedQuickPeekItemId) return;
    setDeclutterDeckOverrides((current) => ({
      ...current,
      [selectedQuickPeekItemId]: inDeck,
    }));
  }, [selectedQuickPeekItemId]);
  const {
    declutterPending,
    inDeclutterDeck,
    toggleDeclutterDeck,
  } = useItemDeclutterDeck({
    item: selectedQuickPeekItemWithDeckState,
    showToast,
    hideToast,
    onStateChange: handleDeclutterStateChange,
  });
  const backToItemList = itemSelection.backToItems;
  const itemQueryTerms = useMemo(
    () => [
      ...new Set(
        normalizeItemSearchText(itemQuery).split(/\s+/).filter(Boolean),
      ),
    ],
    [itemQuery],
  );
  const hasItemQuery = itemQueryTerms.length > 0;
  const visibleItems = useMemo(() => {
    if (!hasItemQuery) return items;

    return items.filter((item) => {
      const tags = Array.isArray(item?.tags) ? item.tags : [item?.tags];
      const searchableText = normalizeItemSearchText(
        [
          item?.name,
          item?.label,
          item?.category,
          item?.description,
          item?.notes,
          ...tags,
        ]
          .filter(Boolean)
          .join(' '),
      );

      return itemQueryTerms.every((term) => searchableText.includes(term));
    });
  }, [hasItemQuery, itemQueryTerms, items]);

  const scrollQuickPeekContent = useCallback((deltaY) => {
    const scrollRegion = contentRef.current;
    if (!scrollRegion || !Number.isFinite(deltaY)) return;

    const maximumScrollTop = Math.max(
      0,
      scrollRegion.scrollHeight - scrollRegion.clientHeight,
    );
    scrollRegion.scrollTop = Math.min(
      maximumScrollTop,
      Math.max(0, scrollRegion.scrollTop + deltaY),
    );
  }, []);

  const closeQuickSearch = useCallback(() => {
    setQuickSearchOpen(false);
    setItemQuery('');
  }, []);

  const closeNoteReader = useCallback(() => {
    setNoteReaderOpen(false);
    window.requestAnimationFrame(() => {
      notePreviewButtonRef.current?.focus({ preventScroll: true });
    });
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
    setNoteReaderOpen(false);
    setDeclutterDeckOverrides({});
  }, [boxId]);

  useEffect(() => {
    if (!quickSearchOpen || !selectedQuickPeekItem) return;
    backToItemList();
  }, [backToItemList, quickSearchOpen, selectedQuickPeekItem]);

  useEffect(() => {
    if (
      !quickSearchOpen ||
      !expanded ||
      typeof window === 'undefined' ||
      !window.matchMedia('(max-width: 767px)').matches
    ) {
      return;
    }
    onSetExpanded?.(false);
  }, [expanded, onSetExpanded, quickSearchOpen]);

  useEffect(() => {
    if (!photoFocused) return;
    if (selectedQuickPeekItem) backToItemList();
    if (quickSearchOpen) onShowItems?.();
  }, [backToItemList, onShowItems, photoFocused, quickSearchOpen, selectedQuickPeekItem]);

  useEffect(() => {
    if (!boxId) return;
    sheetRef.current?.focus({ preventScroll: true });
  }, [boxId]);

  useEffect(() => {
    if (
      !boxId ||
      !expanded ||
      typeof document === 'undefined' ||
      !window.matchMedia('(max-width: 767px)').matches
    ) {
      return undefined;
    }

    const scrollY = window.scrollY;
    const body = document.body;
    const root = document.documentElement;
    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      right: body.style.right,
      left: body.style.left,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const previousRootOverscroll = root.style.overscrollBehavior;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.right = '0';
    body.style.left = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';

    return () => {
      Object.assign(body.style, previousBodyStyles);
      root.style.overscrollBehavior = previousRootOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [boxId, expanded]);

  useEffect(() => {
    if (!box) return undefined;

    const handleOutsideClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (sheetRef.current?.contains(target)) return;
      if (target.closest('[role="dialog"][aria-modal="true"]')) return;
      if (target.closest('[data-quick-peek-note-reader]')) return;
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
        // Keep every detent below the live global header. This also lets short
        // or zoomed-in viewports reduce the expansion travel instead of pushing
        // the sheet beyond the available screen space.
        const nextHeaderBottom = Math.max(8, Math.round(bottom) + 8);
        setHeaderBottom((currentHeaderBottom) =>
          currentHeaderBottom === nextHeaderBottom
            ? currentHeaderBottom
            : nextHeaderBottom,
        );
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
    if (
      quickSearchOpen &&
      window.matchMedia('(max-width: 767px)').matches
    ) {
      return;
    }
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
      if (deltaY < 0) {
        if (
          quickSearchOpen &&
          window.matchMedia('(max-width: 767px)').matches
        ) {
          return;
        }
        onSetExpanded?.(true);
      }
      else onDismiss?.();
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
    if (
      quickSearchOpen &&
      window.matchMedia('(max-width: 767px)').matches
    ) {
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
      $itemFocused={Boolean(selectedQuickPeekItem)}
      $photoFocused={photoFocused}
      style={{
        ...boxThemeStyle,
        '--operations-quick-peek-top': `${headerBottom}px`,
      }}
    >
      <QuickPeekBoxHeader
        box={box}
        imageUrl={imageUrl}
        description={description}
        notePanel={noteReaderOpen ? (
          <QuickPeekNoteModal
            box={box}
            notes={notes}
            onClose={closeNoteReader}
          />
        ) : null}
        itemActionPanel={selectedQuickPeekItem ? (
          <QuickPeekItemActionPanel
            item={selectedQuickPeekItemWithDeckState}
            position={itemSelection.selectedIndex + 1}
            total={itemSelection.totalItems}
            onBack={backToItemList}
            onItemUpdated={(updatedItem) => {
              const updatedItemId = String(updatedItem?._id || updatedItem?.id || selectedQuickPeekItemId);
              if (!updatedItemId) return;
              setItemOverrides((current) => ({
                ...current,
                [updatedItemId]: updatedItem,
              }));
            }}
            declutterPending={declutterPending}
            inDeclutterDeck={inDeclutterDeck}
            onToggleDeclutterDeck={toggleDeclutterDeck}
            onOpenFullItem={itemSelection.openFullItem}
            notePanel={itemNoteReaderOpen ? (
              <QuickPeekItemNoteModal
                item={selectedQuickPeekItemWithDeckState}
                notes={String(selectedQuickPeekItemWithDeckState?.notes || '').trim()}
                onClose={() => setItemNoteReaderOpen(false)}
              />
            ) : null}
            includeDeck={false}
          />
        ) : null}
        position={position}
        total={total}
        expanded={expanded}
        canSelectPrevious={canSelectPrevious}
        canSelectNext={canSelectNext}
        onPrevious={onPrevious}
        onNext={onNext}
        onClose={onClose}
        itemFocused={Boolean(selectedQuickPeekItem)}
        onReturnToItems={backToItemList}
        onToggleExpanded={handleDetentClick}
        onPointerDown={handlePointerDown}
        onPointerUp={finishGesture}
        onPointerCancel={cancelGesture}
        searchOpen={quickSearchOpen}
        searchQuery={itemQuery}
        onSearchChange={setItemQuery}
        onSearchClose={closeQuickSearch}
        onSearchScroll={scrollQuickPeekContent}
      />

      <S.DeckContent
        ref={contentRef}
        key={box.box_id}
        $expanded={expanded}
        $itemFocused={Boolean(selectedQuickPeekItem)}
        $photoFocused={photoFocused}
        $direction={itemSelection.selectedItem ? 0 : transitionDirection}
        data-quick-peek-scroll-region
      >
        {photoFocused ? (
          <QuickPeekBoxPhotoView
            box={box}
            imageUrl={displayImageUrl}
            fallbackUrl={imageUrl}
            onShowItems={onShowItems}
          />
        ) : itemSelection.selectedItem ? (
          <QuickPeekItemCarousel
            key={String(itemSelection.selectedItem?._id || itemSelection.selectedItem?.id || '')}
            item={selectedQuickPeekItemWithDeckState}
            position={itemSelection.selectedIndex + 1}
            total={itemSelection.totalItems}
            transitionDirection={itemSelection.transitionDirection}
            canSelectPrevious={itemSelection.canSelectPrevious}
            canSelectNext={itemSelection.canSelectNext}
            onPrevious={itemSelection.selectPrevious}
            onNext={itemSelection.selectNext}
            inDeclutterDeck={inDeclutterDeck}
            declutterPending={declutterPending}
            onToggleDeclutterDeck={toggleDeclutterDeck}
            onOpenNotes={() => setItemNoteReaderOpen(true)}
          />
        ) : (
          <>
            <S.ItemsHeader>
              <span>Direct items</span>
              <S.ItemsCount>
                {visibleItems.length}{' '}
                {hasItemQuery
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
                hasItemQuery
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

      {!itemSelection.selectedItem ? (
        <S.BoxFooterActions $expanded={expanded} $withNotes={Boolean(notes)}>
          <S.OpenFullBoxButton type="button" onClick={onOpenFullBox}>
            Open full box
            <S.OpenFullBoxIcon
              aria-hidden="true"
              viewBox="0 0 20 20"
              focusable="false"
            >
              <path d="M6 14 14 6" />
              <path d="M8 6h6v6" />
            </S.OpenFullBoxIcon>
          </S.OpenFullBoxButton>
          {notes ? (
            <S.BoxNotesFooterButton
              ref={notePreviewButtonRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={noteReaderOpen}
              aria-label="Open box notes"
              title="Box notes"
              onClick={() => setNoteReaderOpen(true)}
            >
              N
            </S.BoxNotesFooterButton>
          ) : null}
        </S.BoxFooterActions>
      ) : null}
    </S.Deck>,
    document.body,
  );
}
