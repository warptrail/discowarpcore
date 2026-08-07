import React from 'react';

import { ITEM_CATEGORIES, formatItemCategory } from '../util/itemCategories';
import CustomSelect from './CustomSelect';
import * as S from './MiniOrphanedList.styles';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All' },
  ...ITEM_CATEGORIES.map((category) => ({
    value: category,
    label: formatItemCategory(category),
  })),
];

const SORT_OPTIONS = [
  { value: 'orphaned', label: 'Set adrift' },
  { value: 'name', label: 'Name' },
];

export default function MiniOrphanedListFilters({
  searchInput,
  setSearchInput,
  categoryFilter,
  setCategoryFilter,
  locationInput,
  setLocationInput,
  sortField,
  setSortField,
  sortDirection,
  toggleSortDirection,
  resetFilters,
  hasActiveFilters,
  searchPlaceholder,
}) {
  const directionLabel = sortField === 'name'
    ? (sortDirection === 'asc' ? 'A to Z' : 'Z to A')
    : (sortDirection === 'asc' ? 'Oldest first' : 'Newest first');

  return (
    <S.Controls aria-label="Filter and sort Items Adrift">
      <S.Field $search>
        <S.ControlLabel>Search</S.ControlLabel>
        <S.SearchInput
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search Items Adrift"
        />
      </S.Field>

      <S.Field>
        <S.ControlLabel>Category</S.ControlLabel>
        <S.CustomSelectShell>
          <CustomSelect
            value={categoryFilter}
            options={CATEGORY_OPTIONS}
            onChange={setCategoryFilter}
            ariaLabel="Filter Items Adrift by category"
            tone="#72d9d0"
          />
        </S.CustomSelectShell>
      </S.Field>

      <S.Field>
        <S.ControlLabel>Location</S.ControlLabel>
        <S.FilterInput
          type="search"
          value={locationInput}
          onChange={(event) => setLocationInput(event.target.value)}
          placeholder="Any"
          aria-label="Filter Items Adrift by location"
        />
      </S.Field>

      <S.Field $sort>
        <S.ControlLabel>Sort</S.ControlLabel>
        <S.SortControl>
          <S.CustomSelectShell>
            <CustomSelect
              value={sortField}
              options={SORT_OPTIONS}
              onChange={setSortField}
              ariaLabel="Sort Items Adrift by"
              tone="#72d9d0"
            />
          </S.CustomSelectShell>
          <S.DirectionButton
            type="button"
            onClick={toggleSortDirection}
            aria-label={`Reverse sort direction. Current: ${directionLabel}`}
            title={directionLabel}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </S.DirectionButton>
        </S.SortControl>
      </S.Field>

      {hasActiveFilters ? (
        <S.ResetButton type="button" onClick={resetFilters}>
          Reset
        </S.ResetButton>
      ) : null}
    </S.Controls>
  );
}
