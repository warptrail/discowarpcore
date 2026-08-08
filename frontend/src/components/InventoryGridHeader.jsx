import React, { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as S from '../styles/InventoryGridHeader.styles';
import { ITEM_CATEGORIES, formatItemCategory } from '../util/itemCategories';
import {
  KEEP_PRIORITY_SCALE_OPTIONS,
} from '../util/keepPriority';
import OperationsQuickBoxCreate from './OperationsQuickBoxCreate/OperationsQuickBoxCreate';
import IntakeQuickItemMaker from './Intake/IntakeQuickItemMaker';
import BoxLocatorControl from './BoxLocatorControl';
import CustomSelect from './CustomSelect';
import { ToastContext } from './Toast';
import {
  INVENTORY_FINDER_CLOSE_EVENT,
  INVENTORY_FINDER_OPEN_EVENT,
  INVENTORY_FINDER_COMMIT_EVENT,
  INVENTORY_FINDER_STATE_EVENT,
} from '../constants/inventoryFinderEvents';

const SORT_OPTIONS = [
  { value: 'boxId', label: 'Box ID' },
  { value: 'name', label: 'Name' },
  { value: 'group', label: 'Group' },
  { value: 'location', label: 'Location' },
  { value: 'itemCount', label: 'Item Count' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Boxes' },
  { value: 'withItems', label: 'Boxes With Items' },
  { value: 'empty', label: 'Empty Boxes' },
  { value: 'inGroups', label: 'Boxes In Groups' },
];

const KEEP_PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  ...KEEP_PRIORITY_SCALE_OPTIONS,
  { value: 'gone', label: 'No longer have' },
];

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

const SORT_DIRECTION_LABELS = {
  asc: 'Ascending',
  desc: 'Descending',
};

function LcarsActionButton({ label, ...props }) {
  return (
    <S.QuickCreateLaunchButton {...props}>
      {label}
    </S.QuickCreateLaunchButton>
  );
}

export default function InventoryGridHeader({
  totalBoxes = 0,
  totalItems = 0,
  orphanedCount = 0,
  searchQuery = '',
  onSearchChange,
  searchScope = 'all',
  onSearchScopeChange,
  boxLocatorQuery = '',
  onBoxLocatorQueryChange,
  boxLocatorMatchingRootCount = 0,
  boxLocatorVisibleBoxCount = 0,
  boxLocatorExactMatch = null,
  onBoxLocatorActivateExact,
  sortBy = 'boxId',
  onSortChange,
  sortDirection = 'asc',
  onSortDirectionChange,
  filterBy = 'all',
  onFilterChange,
  categoryFilter = 'all',
  onCategoryFilterChange,
  locationFilter = 'all',
  onLocationFilterChange,
  locations = [],
  groupFilter = 'all',
  onGroupFilterChange,
  groups = [],
  ownerFilter = 'all',
  onOwnerFilterChange,
  owners = [],
  keepPriorityFilter = 'all',
  onKeepPriorityFilterChange,
  viewMode = 'cards',
  onViewModeChange,
  onQuickBoxCreated,
  onQuickOrphanCreated,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const [quickPanel, setQuickPanel] = useState('');
  const [finderMinimized, setFinderMinimized] = useState(true);
  const [finderCollapsing, setFinderCollapsing] = useState(false);
  const [consoleFinderMount, setConsoleFinderMount] = useState(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const mobileActionsButtonRef = useRef(null);
  const mobileActionsMenuRef = useRef(null);
  const filtersActive = Boolean(
    String(searchQuery || '').trim() ||
      String(boxLocatorQuery || '').trim() ||
      filterBy !== 'all' ||
      categoryFilter !== 'all' ||
      locationFilter !== 'all' ||
      groupFilter !== 'all' ||
      ownerFilter !== 'all' ||
      keepPriorityFilter !== 'all',
  );

  useEffect(() => {
    const syncMount = () => {
      setConsoleFinderMount(
        document.getElementById('operations-console-finder-mount'),
      );
    };

    syncMount();
    const observer = new MutationObserver(syncMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFinderOpen = () => {
      setFinderCollapsing(false);
      setFinderMinimized(false);
    };
    const handleFinderClose = () => {
      setFinderCollapsing(false);
      setFinderMinimized(true);
    };

    window.addEventListener(INVENTORY_FINDER_OPEN_EVENT, handleFinderOpen);
    window.addEventListener(INVENTORY_FINDER_CLOSE_EVENT, handleFinderClose);
    return () => {
      window.removeEventListener(INVENTORY_FINDER_OPEN_EVENT, handleFinderOpen);
      window.removeEventListener(INVENTORY_FINDER_CLOSE_EVENT, handleFinderClose);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(INVENTORY_FINDER_STATE_EVENT, {
        detail: { minimized: finderMinimized, filtersActive },
      }),
    );
  }, [filtersActive, finderMinimized]);

  useEffect(() => {
    if (searchScope !== 'all') onSearchScopeChange?.('all');
  }, [onSearchScopeChange, searchScope]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 660px)');
    const handleBreakpointChange = (event) => {
      if (event.matches) setMobileActionsOpen(false);
    };

    media.addEventListener?.('change', handleBreakpointChange);
    return () => media.removeEventListener?.('change', handleBreakpointChange);
  }, []);

  useEffect(() => {
    if (!mobileActionsOpen) return undefined;

    const closeAndRestoreFocus = () => {
      setMobileActionsOpen(false);
      window.requestAnimationFrame(() => mobileActionsButtonRef.current?.focus());
    };

    const handlePointerDown = (event) => {
      if (
        mobileActionsMenuRef.current?.contains(event.target) ||
        mobileActionsButtonRef.current?.contains(event.target)
      ) {
        return;
      }
      closeAndRestoreFocus();
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeAndRestoreFocus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileActionsOpen]);

  const toggleQuickPanel = (panel) => {
    setQuickPanel((prev) => (prev === panel ? '' : panel));
  };

  const toggleQuickBoxPanel = () => {
    const opening = quickPanel !== 'box';
    setQuickPanel(opening ? 'box' : '');
    if (opening) {
      setFinderCollapsing(false);
      setFinderMinimized(false);
    }
  };

  const runRailAction = (action) => {
    const wasMobileMenuOpen = mobileActionsOpen;
    setMobileActionsOpen(false);
    action?.();
    if (wasMobileMenuOpen) {
      window.requestAnimationFrame(() => mobileActionsButtonRef.current?.focus());
    }
  };

  const handleQuickBoxCreated = async (created) => {
    await Promise.resolve(onQuickBoxCreated?.(created));
    setQuickPanel('');
  };

  const handleQuickOrphanCreated = async (payload) => {
    await Promise.resolve(onQuickOrphanCreated?.(payload));
    showToast?.({
      variant: 'success',
      title: 'Item set adrift',
      message: payload?.message || `Added "${payload?.item?.name || 'item'}" to Items Adrift.`,
      timeoutMs: 3600,
    });
    setQuickPanel('');
  };

  const handleQuickOrphanError = (error) => {
    showToast?.({
      variant: 'danger',
      title: 'Quick capture failed',
      message: error?.message || 'Could not add this item to Items Adrift.',
      timeoutMs: 4600,
    });
  };

  const commitSearchToConsole = () => {
    const query = searchQuery.trim();
    if (!query || finderCollapsing) return;

    setFinderCollapsing(true);
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(INVENTORY_FINDER_COMMIT_EVENT, {
          detail: { query, scope: 'all' },
        }),
      );
      setFinderMinimized(true);
      setFinderCollapsing(false);
    }, 180);
  };

  const secondaryFinderControls = quickPanel === 'box' ? (
    <OperationsQuickBoxCreate
      onCreated={handleQuickBoxCreated}
      onCancel={() => setQuickPanel('')}
    />
  ) : !finderMinimized ? (
    <S.AdvancedFilters id="inventory-grid-advanced-filters">
      <S.FilterRow>
        <S.ControlGroup $tone="#E8B15C">
          <S.ControlLabel>Sort</S.ControlLabel>
          <S.SortControlRow>
            <CustomSelect
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={onSortChange}
              ariaLabel="Sort boxes"
              tone="#E8B15C"
            />
            <S.SortDirectionButton
              type="button"
              onClick={() =>
                onSortDirectionChange?.(
                  sortDirection === 'desc' ? 'asc' : 'desc',
                )
              }
              aria-label={`Sort direction: ${SORT_DIRECTION_LABELS[sortDirection] || 'Ascending'}`}
              title={`Sort direction: ${SORT_DIRECTION_LABELS[sortDirection] || 'Ascending'}`}
              $descending={sortDirection === 'desc'}
            >
              <span aria-hidden="true">
                {sortDirection === 'desc' ? '⬇' : '⬆'}
              </span>
            </S.SortDirectionButton>
          </S.SortControlRow>
        </S.ControlGroup>

        <S.ControlGroup $tone="#A7B6FF">
          <S.ControlLabel>Contents</S.ControlLabel>
          <CustomSelect
            value={filterBy}
            options={FILTER_OPTIONS}
            onChange={onFilterChange}
            ariaLabel="Filter boxes"
            tone="#A7B6FF"
          />
        </S.ControlGroup>

        <S.ControlGroup $tone="#5BC0EB">
          <S.ControlLabel>Category</S.ControlLabel>
          <CustomSelect
            value={categoryFilter}
            options={[
              { value: 'all', label: 'All Categories' },
              ...ITEM_CATEGORIES.map((category) => ({
                value: category,
                label: formatItemCategory(category),
              })),
            ]}
            onChange={onCategoryFilterChange}
            ariaLabel="Filter by item category"
            tone="#5BC0EB"
          />
        </S.ControlGroup>

        <S.ControlGroup $tone="#4CC6C1">
          <S.ControlLabel>Location</S.ControlLabel>
          <CustomSelect
            value={locationFilter}
            options={[
              { value: 'all', label: 'All Locations' },
              ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
            ]}
            onChange={onLocationFilterChange}
            ariaLabel="Filter by location"
            tone="#4CC6C1"
          />
        </S.ControlGroup>

        <S.ControlGroup $tone="#E58FBB">
          <S.ControlLabel>Group</S.ControlLabel>
          <CustomSelect
            value={groupFilter}
            options={[{ value: 'all', label: 'All Groups' }, ...groups]}
            onChange={onGroupFilterChange}
            ariaLabel="Filter by group"
            tone="#E58FBB"
          />
        </S.ControlGroup>

        <S.ControlGroup $tone="#8ED0A8">
          <S.ControlLabel>Owner</S.ControlLabel>
          <CustomSelect
            value={ownerFilter}
            options={[{ value: 'all', label: 'All Owners' }, ...owners]}
            onChange={onOwnerFilterChange}
            ariaLabel="Filter by owner"
            tone="#8ED0A8"
          />
        </S.ControlGroup>

        <S.ControlGroup $tone="#F08A7B" $active={keepPriorityFilter !== 'all'}>
          <S.ControlLabel>Keep priority</S.ControlLabel>
          <CustomSelect
            value={keepPriorityFilter}
            options={KEEP_PRIORITY_FILTER_OPTIONS}
            onChange={onKeepPriorityFilterChange}
            ariaLabel="Filter by keep priority or no longer have status"
            tone="#F08A7B"
          />
        </S.ControlGroup>
      </S.FilterRow>

    </S.AdvancedFilters>
  ) : null;

  const primaryFinderControls = (
    <S.UnifiedFinderWorkspace>
    <S.PrimaryFinderRow>
      <S.PrimarySearchGroup>
        <S.SearchInput
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitSearchToConsole();
          }}
          placeholder="search"
          aria-label="Search inventory"
        />
      </S.PrimarySearchGroup>

      <BoxLocatorControl
        compact
        query={boxLocatorQuery}
        onQueryChange={onBoxLocatorQueryChange}
        matchingRootCount={boxLocatorMatchingRootCount}
        visibleBoxCount={boxLocatorVisibleBoxCount}
        exactMatch={boxLocatorExactMatch}
        onActivateExact={onBoxLocatorActivateExact}
      />

    </S.PrimaryFinderRow>

    {!finderMinimized && secondaryFinderControls ? (
      <S.FilterPanel
        id="inventory-grid-filters"
        aria-label="Find and filter inventory"
        $scrollable={quickPanel === 'box' || quickPanel === 'orphan'}
      >
        {secondaryFinderControls}
      </S.FilterPanel>
    ) : null}
    </S.UnifiedFinderWorkspace>
  );

  return (
    <S.HeaderShell>
      <S.ControlConsole role="group" aria-label="Operations control console">
        <S.MapStatus aria-label="Map unavailable">MAP // PENDING</S.MapStatus>
        <S.UtilityRow>
          <S.ViewModeToggle
            role="group"
            aria-label="Box list view mode"
            $mode={viewMode}
          >
            <S.ViewModeButton
              type="button"
              $active={viewMode === 'cards'}
              aria-pressed={viewMode === 'cards'}
              onClick={() => onViewModeChange?.('cards')}
            >
              Cards
            </S.ViewModeButton>
            <S.ViewModeButton
              type="button"
              $active={viewMode === 'terminal'}
              aria-pressed={viewMode === 'terminal'}
              onClick={() => onViewModeChange?.('terminal')}
            >
              Terminal
            </S.ViewModeButton>
          </S.ViewModeToggle>

          <S.MobileActionsButton
            ref={mobileActionsButtonRef}
            type="button"
            $active={mobileActionsOpen || Boolean(quickPanel)}
            aria-expanded={mobileActionsOpen}
            aria-controls="operations-mobile-actions"
            onClick={() => setMobileActionsOpen((open) => !open)}
          >
            Actions
            <span aria-hidden="true">{mobileActionsOpen ? '−' : '+'}</span>
          </S.MobileActionsButton>

          <S.TitleActions
            ref={mobileActionsMenuRef}
            id="operations-mobile-actions"
            role="group"
            aria-label="Inventory actions"
            $mobileOpen={mobileActionsOpen}
          >
            <LcarsActionButton
              type="button"
              $tone="amber"
              $symbol={quickPanel === 'box' ? '×' : '+'}
              $active={quickPanel === 'box'}
              aria-label={quickPanel === 'box' ? 'Close new box form' : 'Create a new box'}
              aria-expanded={quickPanel === 'box'}
              aria-controls="inventory-grid-filters"
              title={quickPanel === 'box' ? 'Close new box form' : 'New box'}
              onClick={() => runRailAction(toggleQuickBoxPanel)}
              label={quickPanel === 'box' ? 'Close' : 'New box'}
            />
            <S.TitleOrphanActions>
              <LcarsActionButton
                type="button"
                $tone="teal"
                $symbol="+"
                $active={quickPanel === 'orphan'}
                aria-label={quickPanel === 'orphan' ? 'Close new item form' : 'Create a new item'}
                aria-expanded={quickPanel === 'orphan'}
                onClick={() => runRailAction(() => toggleQuickPanel('orphan'))}
                label={quickPanel === 'orphan' ? 'Close' : 'New item'}
              />
            </S.TitleOrphanActions>
          </S.TitleActions>
        </S.UtilityRow>

        <S.TelemetryRow aria-live="polite">
          <S.TelemetryLine>
            <S.TelemetryValue $tone="boxes">
              {plural(totalBoxes, 'box', 'boxes')}
            </S.TelemetryValue>
            <S.Sep>//</S.Sep>
            <S.TelemetryValue $tone="items">
              {plural(totalItems, 'item', 'items')}
            </S.TelemetryValue>
          </S.TelemetryLine>
          <S.Sep aria-hidden="true">//</S.Sep>
          <S.TelemetryLine>
            <S.TelemetryValue $tone="orphaned">
              {plural(orphanedCount, 'item adrift', 'items adrift')}
            </S.TelemetryValue>
          </S.TelemetryLine>
        </S.TelemetryRow>

        {quickPanel === 'orphan' ? (
          <S.QuickOrphanInlinePanel>
            <IntakeQuickItemMaker
              compact
              title="Quick adrift-item capture"
              onItemCreated={handleQuickOrphanCreated}
              onItemError={handleQuickOrphanError}
              onCancel={() => setQuickPanel('')}
            />
          </S.QuickOrphanInlinePanel>
        ) : null}
      </S.ControlConsole>

      {consoleFinderMount
        ? createPortal(primaryFinderControls, consoleFinderMount)
        : null}
    </S.HeaderShell>
  );
}
