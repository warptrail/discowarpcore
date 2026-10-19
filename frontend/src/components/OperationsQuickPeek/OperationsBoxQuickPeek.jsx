import CabinetShelfPicker from '../BoxForms/CabinetShelfPicker';
import useTagReturnSnapshot from '../../hooks/useTagReturnSnapshot';
import QuickPeekBoxEditor from './QuickPeekBoxEditor';
import useOperationsDockGeometry from '../OperationsInventory/useOperationsDockGeometry';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useIsMobile from '../../hooks/useIsMobile';
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
import QuickPeekControlCenter from './QuickPeekControlCenter';
import QuickPeekHeaderControls from './QuickPeekHeaderControls';
import QuickPeekAddItems from './QuickPeekAddItems';
import useOperationsQuickPeekItemSelection from './useOperationsQuickPeekItemSelection';
import useItemDeclutterDeck from '../../hooks/useItemDeclutterDeck';
import { ToastContext } from '../Toast';
import {
  OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT,
  OPERATIONS_QUICK_PEEK_SEARCH_TOGGLE_EVENT,
} from '../../constants/inventoryFinderEvents';
import * as S from './OperationsQuickPeek.styles';
import { applyQuickPeekVerticalSwipe, getQuickPeekGestureCaptureTarget } from './OperationsQuickPeek.gestures';
import {
  getBoxPreviewImageUrl,
  getBoxThumbnailUrl,
} from '../../util/itemImage';

const HORIZONTAL_SWIPE_THRESHOLD = 54;
const VERTICAL_DETENT_THRESHOLD = 42;

const ITEM_SORT_OPTIONS = [
  { value: 'name', label: 'Name', symbol: 'A↕' },
  { value: 'boxAdded', label: 'Added to box', symbol: '▣↕' },
  { value: 'inventoryAdded', label: 'Added to inventory', symbol: '◈↕' },
  { value: 'tags', label: 'Tags', symbol: '#↕' },
];

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
  locations,
  presentation = 'sheet',
  portalTarget = null,
  matchingItems = [],
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
  onShelfChange,
  onOpenFullBox,
  onItemSaved,
  boxFieldEdit, onCloseBoxField, onBoxSaved,
}) {
  const source = useTagReturnSnapshot();
  const restoredScrollRef = useRef(source?.scrollY);
  const mobile = useIsMobile(767);
  const desktop = !useIsMobile(1099);
  const docked = desktop && presentation === 'dock';
  const { top: dockTop, left: dockLeft } = useOperationsDockGeometry(portalTarget, docked);
  const gestureRef = useRef(null);
  const suppressHeaderClickRef = useRef(false);
  const suppressDetentClickRef = useRef(false);
  const suppressDetentResetTimerRef = useRef(0);
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const [headerBottom, setHeaderBottom] = useState(140);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const [itemSortMode, setItemSortMode] = useState('inventoryAdded');
  const [noteReaderOpen, setNoteReaderOpen] = useState(false);
  const [itemNoteReaderOpen, setItemNoteReaderOpen] = useState(false);
  const [declutterDeckOverrides, setDeclutterDeckOverrides] = useState({});
  const [itemOverrides, setItemOverrides] = useState({});
  const { showToast, hideToast } = useContext(ToastContext) || {};
  const boxId = box?.box_id;
  const isAdrift = box?.systemType === 'orphaned';
  const boxThemeStyle = getBoxThemeCssVars(getBoxTheme(boxId, { kind: isAdrift ? 'orphaned' : undefined }));
  const title = String(box?.label || box?.name || 'Untitled box').trim();
  const imageUrl = getBoxImageUrl(box);
  const displayImageUrl = getBoxDisplayImageUrl(box);
  const photoFocused = surface === 'photo' && Boolean(displayImageUrl);
  const description = String(box?.description || '').trim();
  const notes = String(box?.notes || '').trim();
  const childBoxes = Array.isArray(box?.childBoxes) ? box.childBoxes : [];
  const sectionIsLeaf = box.kind === 'cabinet' && (!box.shelves?.length || Boolean(box.compartmentKey?.slice(1)));
  const addTarget = sectionIsLeaf ? { ...box.ownerBox, compartmentKey: box.compartmentKey } : box;
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
    setItemSortMode('inventoryAdded');
    setNoteReaderOpen(false);
    setDeclutterDeckOverrides({});
  }, [boxId]);

  useEffect(() => {
    if (quickSearchOpen) setNoteReaderOpen(false);
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
      !mobile
    ) {
      return undefined;
    }

    const scrollY = restoredScrollRef.current ?? window.scrollY;
    restoredScrollRef.current = undefined;
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
  }, [boxId, expanded, mobile]);

  useEffect(() => {
    if (!box || docked) return undefined;

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
  }, [box, docked, onClose]);

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
    const captureTarget = getQuickPeekGestureCaptureTarget(event);
    if (!captureTarget) return;
    suppressHeaderClickRef.current = false;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      fromHeader: event.currentTarget.tagName === 'HEADER',
    };
    captureTarget.setPointerCapture?.(event.pointerId);
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
      suppressHeaderClickRef.current = gesture.fromHeader;
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
      suppressHeaderClickRef.current = gesture.fromHeader;
      suppressDetentClickRef.current = true;
      window.clearTimeout(suppressDetentResetTimerRef.current);
      suppressDetentResetTimerRef.current = window.setTimeout(() => {
        suppressDetentClickRef.current = false;
      }, 0);
      if (
        deltaY < 0 &&
        quickSearchOpen &&
        window.matchMedia('(max-width: 767px)').matches
      ) {
        return;
      }
      applyQuickPeekVerticalSwipe({ deltaY, expanded, onSetExpanded, onDismiss });
    }
  };

  const cancelGesture = () => {
    gestureRef.current = null;
  };

  const handleHeaderClickCapture = (event) => {
    if (!suppressHeaderClickRef.current) return;
    suppressHeaderClickRef.current = false;
    // Keyboard activation is still a normal click, even after a pointer drag.
    if (event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
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
    <>
    <S.PageBlur aria-hidden="true" />
    <S.Deck
      data-peek-expanded={expanded}
      ref={sheetRef}
      id="operations-box-quick-peek"
      role="complementary"
      aria-label={isAdrift ? 'Quick peek at Items Adrift' : `Quick peek at box ${title}`}
      tabIndex={-1}
      $presentation={presentation}
      $expanded={expanded}
      $closing={closing}
      $itemFocused={Boolean(selectedQuickPeekItem)}
      $photoFocused={photoFocused}
      style={{
        ...boxThemeStyle,
        '--operations-quick-peek-top': `${headerBottom}px`,
        '--operations-dock-top': `${dockTop}px`,
        '--operations-dock-left': `${dockLeft}px`,
      }}
    >
      <S.DeckHeading>
      <QuickPeekBoxHeader
        docked={docked}
        box={box}
        locations={locations}
        imageUrl={imageUrl}
        description={description}
        itemActionPanel={selectedQuickPeekItem ? (
          <QuickPeekItemActionPanel
            embedded
            key={selectedQuickPeekItemId}
            box={selectedQuickPeekItemWithDeckState?.ownerBoxMongoId ? { _id: selectedQuickPeekItemWithDeckState.ownerBoxMongoId, box_id: selectedQuickPeekItemWithDeckState.ownerBoxId } : box}
            onMoved={() => { backToItemList(); onItemSaved?.(); }}
            item={selectedQuickPeekItemWithDeckState}
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
            onOpenNotes={() => setItemNoteReaderOpen((current) => !current)}
            notesOpen={itemNoteReaderOpen}
          />
        ) : null}
        itemPosition={itemSelection.selectedIndex + 1}
        itemTotal={itemSelection.totalItems}
        expanded={expanded}
        canSelectPrevious={canSelectPrevious}
        canSelectNext={canSelectNext}
        onPrevious={onPrevious}
        onNext={onNext}
        onClose={onDismiss || onClose}
        itemFocused={Boolean(selectedQuickPeekItem)}
        onReturnToItems={backToItemList}
        onToggleExpanded={handleDetentClick}
        onPointerDown={handlePointerDown}
        onPointerUp={finishGesture}
        onPointerCancel={cancelGesture}
        onGestureStartCapture={() => { suppressHeaderClickRef.current = false; }}
        onGestureClickCapture={handleHeaderClickCapture}
        searchOpen={quickSearchOpen}
        searchQuery={itemQuery}
        onSearchChange={setItemQuery}
        onSearchClose={closeQuickSearch}
      />

      {box.kind === "cabinet" && !itemSelection.selectedItem ? <CabinetShelfPicker boxId={box.box_id} cabinetKey={box.compartmentKey[0]} parentLabel={box.label} ownerBox={box.ownerBox} shelves={box.shelves} selectedKeys={box.selectedShelfKeys} onChange={onShelfChange} /> : null}
      </S.DeckHeading>
      <S.DeckContent
        ref={contentRef}
        id="quick-peek-view"
        key={box.box_id}
        $expanded={expanded}
        $itemFocused={Boolean(selectedQuickPeekItem)}
        $photoFocused={photoFocused && !noteReaderOpen}
        $direction={itemSelection.selectedItem ? 0 : transitionDirection}
        data-tag-scroll-key="operations-peek-content"
        data-quick-peek-scroll-region
      >
        {noteReaderOpen && !selectedQuickPeekItem ? (
          <S.ControlCenterNotes aria-label="Box notes">
            <S.NotesEyebrow>Notes · {isAdrift ? 'Items Adrift' : `#${boxId}`}</S.NotesEyebrow>
            <S.NotesTitle>{title}</S.NotesTitle>
            <S.NotesText>{notes || 'No notes for this box yet.'}</S.NotesText>
          </S.ControlCenterNotes>
        ) : photoFocused ? (
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
            onItemUpdated={(updated) => {
              setItemOverrides((current) => ({ ...current, [String(updated._id || updated.id)]: updated }));
              onItemSaved?.();
            }}
            notePanel={itemNoteReaderOpen ? (
              <QuickPeekItemNoteModal
                item={selectedQuickPeekItemWithDeckState}
                notes={String(selectedQuickPeekItemWithDeckState?.notes || '').trim()}
                onSaved={(updated) => {
                  setItemOverrides((current) => ({ ...current, [String(updated._id || updated.id)]: updated }));
                  onItemSaved?.();
                }}
                onClose={() => setItemNoteReaderOpen(false)}
              />
            ) : null}
            position={itemSelection.selectedIndex + 1}
            total={itemSelection.totalItems}
            transitionDirection={itemSelection.transitionDirection}
            canSelectPrevious={itemSelection.canSelectPrevious}
            canSelectNext={itemSelection.canSelectNext}
            onPrevious={itemSelection.selectPrevious}
            onNext={itemSelection.selectNext}
          />
        ) : (
          <>
            <S.ItemsHeader>
              <span>{isAdrift ? 'Unboxed items' : box.kind === 'cabinet' ? 'Contents' : 'Direct items'}</span>
              <S.ItemsHeaderMeta>
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

              </S.ItemsHeaderMeta>
            </S.ItemsHeader>

            <QuickPeekItemList
              items={visibleItems}
              matchingItems={hasItemQuery ? visibleItems : matchingItems}
              sortMode={itemSortMode}
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
      {box.kind !== "cabinet" && boxFieldEdit && boxFieldEdit.boxMongoId === String(box._id) ? (
        <QuickPeekBoxEditor key={`${box._id}-${boxFieldEdit.field}`} box={box}
          field={boxFieldEdit.field} onClose={onCloseBoxField} onSaved={onBoxSaved} />
      ) : null}

      {!itemSelection.selectedItem ? (
        <QuickPeekControlCenter
          addItemsControl={box.kind === "cabinet" && !sectionIsLeaf ? null : <QuickPeekAddItems key={box.address || boxId} box={addTarget} expanded={expanded} onItemsChanged={onItemSaved} />}
          navigationControls={
            <QuickPeekHeaderControls embedded expanded={expanded} docked={docked}
              onToggleExpanded={handleDetentClick}
              onPointerDown={handlePointerDown} onPointerUp={finishGesture} onPointerCancel={cancelGesture} />
          }
          notesOpen={noteReaderOpen}
          count={visibleItems.length}
          isAdrift={isAdrift}
          onViewChange={(showNotes) => {
            setNoteReaderOpen(showNotes);
            closeQuickSearch();
            if (!showNotes && photoFocused) onShowItems?.();
            contentRef.current?.scrollTo({ top: 0 });
          }}
          sortLabel={ITEM_SORT_OPTIONS.find((option) => option.value === itemSortMode)?.label}
          sortSymbol={ITEM_SORT_OPTIONS.find((option) => option.value === itemSortMode)?.symbol}
          onSort={() => {
            const index = ITEM_SORT_OPTIONS.findIndex((option) => option.value === itemSortMode);
            setItemSortMode(ITEM_SORT_OPTIONS[(index + 1) % ITEM_SORT_OPTIONS.length].value);
          }}
          onOpenFullBox={onOpenFullBox}
        />
      ) : null}
    </S.Deck>
    </>,
    portalTarget || document.body,
  );
}
