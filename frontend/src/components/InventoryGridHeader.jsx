import React, { useState } from 'react';
import * as S from '../styles/InventoryGridHeader.styles';
import { ITEM_CATEGORIES, formatItemCategory } from '../util/itemCategories';
import BoxCreate from './BoxCreate';
import IntakeQuickItemMaker from './Intake/IntakeQuickItemMaker';

const SORT_OPTIONS = [
  { value: 'boxId', label: 'Box ID' },
  { value: 'name', label: 'Name' },
  { value: 'location', label: 'Location' },
  { value: 'itemCount', label: 'Item Count' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Boxes' },
  { value: 'withItems', label: 'Boxes With Items' },
  { value: 'empty', label: 'Empty Boxes' },
];

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

export default function InventoryGridHeader({
  totalBoxes = 0,
  totalItems = 0,
  orphanedCount = 0,
  searchQuery = '',
  onSearchChange,
  sortBy = 'boxId',
  onSortChange,
  filterBy = 'all',
  onFilterChange,
  categoryFilter = 'all',
  onCategoryFilterChange,
  locationFilter = 'all',
  onLocationFilterChange,
  locations = [],
  ownerFilter = 'all',
  onOwnerFilterChange,
  owners = [],
  onQuickBoxCreated,
  onQuickOrphanCreated,
}) {
  const [quickPanel, setQuickPanel] = useState('');

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

      <S.SearchSortRow>
        <S.ControlGroup $tone="#7FD7FF">
          <S.ControlLabel>Search</S.ControlLabel>
          <S.SearchInput
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search inventory..."
            aria-label="Search inventory"
          />
        </S.ControlGroup>

        <S.ControlGroup $tone="#E8B15C">
          <S.ControlLabel>Sort</S.ControlLabel>
          <S.Select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            aria-label="Sort boxes"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </S.Select>
        </S.ControlGroup>
      </S.SearchSortRow>

      <S.FilterRow>
        <S.ControlGroup $tone="#A7B6FF">
          <S.ControlLabel>Filter</S.ControlLabel>
          <S.Select
            value={filterBy}
            onChange={(e) => onFilterChange?.(e.target.value)}
            aria-label="Filter boxes"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </S.Select>
        </S.ControlGroup>

        <S.ControlGroup $tone="#5BC0EB">
          <S.ControlLabel>Category</S.ControlLabel>
          <S.Select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange?.(e.target.value)}
            aria-label="Filter by item category"
          >
            <option value="all">All Categories</option>
            {ITEM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatItemCategory(category)}
              </option>
            ))}
          </S.Select>
        </S.ControlGroup>

        <S.ControlGroup $tone="#4CC6C1">
          <S.ControlLabel>Location</S.ControlLabel>
          <S.Select
            value={locationFilter}
            onChange={(e) => onLocationFilterChange?.(e.target.value)}
            aria-label="Filter by location"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </S.Select>
        </S.ControlGroup>

        <S.ControlGroup $tone="#8ED0A8">
          <S.ControlLabel>Owner</S.ControlLabel>
          <S.Select
            value={ownerFilter}
            onChange={(e) => onOwnerFilterChange?.(e.target.value)}
            aria-label="Filter by owner"
          >
            <option value="all">All Owners</option>
            {owners.map((owner) => (
              <option key={owner.value} value={owner.value}>
                {owner.label}
              </option>
            ))}
          </S.Select>
        </S.ControlGroup>
      </S.FilterRow>

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
    </S.HeaderShell>
  );
}
