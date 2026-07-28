import React, { useEffect, useState } from 'react';
import * as S from '../styles/InventoryGridHeader.styles';
import { ITEM_CATEGORIES, formatItemCategory } from '../util/itemCategories';
import BoxCreate from './BoxCreate';
import IntakeQuickItemMaker from './Intake/IntakeQuickItemMaker';
import BoxLocatorControl from './BoxLocatorControl';
import CustomSelect from './CustomSelect';
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

const BOX_PREFIX_OPTIONS = [
  { value: 'all', label: 'All Boxes' },
  ...Array.from({ length: 10 }, (_, index) => ({
    value: String(index),
    label: `${index}xx`,
  })),
];

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

const SORT_DIRECTION_LABELS = {
  asc: 'Ascending',
  desc: 'Descending',
};

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
  boxLocatorMatches = [],
  onBoxLocatorSelect,
  sortBy = 'boxId',
  onSortChange,
  sortDirection = 'asc',
  onSortDirectionChange,
  filterBy = 'all',
  onFilterChange,
  boxPrefix = 'all',
  onBoxPrefixChange,
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
  showOrphanedVirtual = false,
  onToggleOrphanedVirtual,
  viewMode = 'cards',
  onViewModeChange,
  onQuickBoxCreated,
  onQuickOrphanCreated,
}) {
  const [quickPanel, setQuickPanel] = useState('');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [finderMinimized, setFinderMinimized] = useState(true);
  const [finderCollapsing, setFinderCollapsing] = useState(false);
  const [hasOpenedFinder, setHasOpenedFinder] = useState(false);

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
        detail: { minimized: finderMinimized },
      }),
    );
  }, [finderMinimized]);

  useEffect(() => {
    if (!finderMinimized) {
      setHasOpenedFinder(true);
    }
  }, [finderMinimized]);

  const activeFilterCount = [
    searchQuery,
    boxLocatorQuery,
    boxPrefix !== 'all',
    sortBy !== 'boxId',
    filterBy !== 'all',
    categoryFilter !== 'all',
    locationFilter !== 'all',
    groupFilter !== 'all',
    ownerFilter !== 'all',
    showOrphanedVirtual,
  ].filter(Boolean).length;

  const toggleQuickPanel = (panel) => {
    setQuickPanel((prev) => (prev === panel ? '' : panel));
  };

  const handleQuickBoxCreated = async (created) => {
    await Promise.resolve(onQuickBoxCreated?.(created));
    setQuickPanel('');
  };

  const handleQuickOrphanCreated = async (payload) => {
    await Promise.resolve(onQuickOrphanCreated?.(payload));
    setQuickPanel('');
  };

  const commitSearchToConsole = () => {
    const query = searchQuery.trim();
    if (!query || finderCollapsing) return;

    setFinderCollapsing(true);
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(INVENTORY_FINDER_COMMIT_EVENT, {
          detail: { query, scope: searchScope },
        }),
      );
      setFinderMinimized(true);
      setFinderCollapsing(false);
    }, 180);
  };

  return (
    <S.HeaderShell>
      <S.TitleRow>
        <S.TitlePip aria-hidden="true" />
        <S.Title>INVENTORY GRID</S.Title>
      </S.TitleRow>

      <S.TelemetryRow aria-live="polite">
        <S.TelemetryValue $tone="boxes">
          {plural(totalBoxes, 'box', 'boxes')}
        </S.TelemetryValue>
        <S.Sep>//</S.Sep>
        <S.TelemetryValue $tone="items">
          {plural(totalItems, 'item', 'items')}
        </S.TelemetryValue>
        <S.Sep>//</S.Sep>
        <S.TelemetryValue $tone="orphaned">
          {plural(orphanedCount, 'orphaned', 'orphaned')}
        </S.TelemetryValue>
      </S.TelemetryRow>

      <S.UtilityRow>
        <S.ViewModeToggle role="group" aria-label="Box list view mode">
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

      </S.UtilityRow>

      {hasOpenedFinder ? (
        <S.FloatingFinder $collapsing={finderCollapsing}>
          <S.FilterPanel
            id="inventory-grid-filters"
            aria-label="Find and filter inventory"
            aria-hidden={finderMinimized}
            inert={finderMinimized ? true : undefined}
            $hidden={finderMinimized}
          >
          <S.FinderModeRow role="group" aria-label="Search inventory by">
            {[
              ['all', 'Everything'],
              ['items', 'Items'],
              ['boxes', 'Boxes'],
            ].map(([value, label]) => (
              <S.FinderModeButton
                key={value}
                type="button"
                $active={searchScope === value}
                aria-pressed={searchScope === value}
                onClick={() => onSearchScopeChange?.(value)}
              >
                {label}
              </S.FinderModeButton>
            ))}
          </S.FinderModeRow>
          <S.SearchSortRow>
            <S.ControlGroup $tone="#7FD7FF">
              <S.ControlLabel>Search</S.ControlLabel>
              <S.SearchInput
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitSearchToConsole();
                }}
                placeholder="Search labels, groups, notes, tags..."
                aria-label="Search inventory"
              />
            </S.ControlGroup>

            <BoxLocatorControl
              query={boxLocatorQuery}
              onQueryChange={onBoxLocatorQueryChange}
              matches={boxLocatorMatches}
              onSelect={onBoxLocatorSelect}
            />

          </S.SearchSortRow>

          <S.AdvancedFiltersToggle
            type="button"
            $active={advancedFiltersOpen || activeFilterCount > 2}
            aria-expanded={advancedFiltersOpen}
            aria-controls="inventory-grid-advanced-filters"
            onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
          >
            <span>{advancedFiltersOpen ? 'Hide advanced filters' : 'More ways to narrow it down'}</span>
            <S.AdvancedFiltersIcon aria-hidden="true">{advancedFiltersOpen ? '−' : '+'}</S.AdvancedFiltersIcon>
          </S.AdvancedFiltersToggle>

          {advancedFiltersOpen ? (
            <S.AdvancedFilters id="inventory-grid-advanced-filters">
              <S.SearchSortRow>
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
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    </S.SortDirectionButton>
                  </S.SortControlRow>
                </S.ControlGroup>
              </S.SearchSortRow>

              <S.FilterRow>
            <S.ControlGroup $tone="#A7B6FF">
              <S.ControlLabel>Filter</S.ControlLabel>
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

            <S.ControlGroup $tone="#9BE564" $active={boxPrefix !== 'all'}>
              <S.ControlLabel>Box Group</S.ControlLabel>
              <CustomSelect
                value={boxPrefix}
                options={BOX_PREFIX_OPTIONS}
                onChange={onBoxPrefixChange}
                ariaLabel="Filter by box group"
                tone="#9BE564"
              />
            </S.ControlGroup>
              </S.FilterRow>

              <S.OrphanToggleButton
                type="button"
                $active={showOrphanedVirtual}
                aria-pressed={showOrphanedVirtual}
                onClick={() => onToggleOrphanedVirtual?.()}
              >
                {showOrphanedVirtual ? 'Hide Orphaned' : 'Show Orphaned'}
              </S.OrphanToggleButton>

              <S.QuickActionsRow>
            <S.QuickActionButton
              type="button"
              $active={quickPanel === 'box'}
              onClick={() => toggleQuickPanel('box')}
            >
              Quick Create Box
            </S.QuickActionButton>
            <S.QuickActionButton
              type="button"
              $active={quickPanel === 'orphan'}
              onClick={() => toggleQuickPanel('orphan')}
            >
              Quick Create Orphan Item
            </S.QuickActionButton>
              </S.QuickActionsRow>

              {quickPanel === 'box' ? (
                <S.QuickActionPanel>
                  <BoxCreate
                    embedded
                    autoNavigate={false}
                    title="Quick Create Box"
                    onCreated={handleQuickBoxCreated}
                    onCancel={() => setQuickPanel('')}
                  />
                </S.QuickActionPanel>
              ) : null}

              {quickPanel === 'orphan' ? (
                <S.QuickActionPanel>
                  <IntakeQuickItemMaker onItemCreated={handleQuickOrphanCreated} />
                </S.QuickActionPanel>
              ) : null}
            </S.AdvancedFilters>
          ) : null}
          </S.FilterPanel>
        </S.FloatingFinder>
      ) : null}
    </S.HeaderShell>
  );
}
