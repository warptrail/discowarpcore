import styled from 'styled-components';
import RetrievalModeToggle from './RetrievalModeToggle';
import RetrievalSearchBar from './RetrievalSearchBar';
import RetrievalFilterBar from './RetrievalFilterBar';
import ActiveFilterChips from './ActiveFilterChips';
import FilterCombobox from './FilterCombobox';
import * as S from './Retrieval.styles';

const Surface = styled.div`
  width: 100%;
  display: grid;
  gap: 0.56rem;
`;

export default function RetrievalConsoleControls({
  mode = 'items',
  onModeChange,
  searchValue = '',
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  searchHint,
  showRefine = false,
  onToggleRefine,
  chips = [],
  sortOptions = [],
  selectedSort = '',
  categoryOptions = [],
  tagOptions = [],
  locationOptions = [],
  ownerOptions = [],
  keepPriorityOptions = [],
  onSortChange,
  onCategoryChange,
  onTagChange,
  onLocationChange,
  onOwnerChange,
  onKeepPriorityChange,
  onRemoveChip,
  onClearAllChips,
  boxGroupOptions = [],
  selectedBoxGroup = '',
  boxLocationOptions = [],
  selectedBoxLocation = '',
  onBoxGroupChange,
  onBoxLocationChange,
  onClearBoxGroup,
  onClearBoxLocation,
}) {
  const safeChips = Array.isArray(chips) ? chips : [];
  const isBoxMode = mode === 'boxes';

  return (
    <Surface>
      <RetrievalModeToggle mode={mode} onChange={onModeChange} />

      <RetrievalSearchBar
        id="retrieval-console-search"
        value={searchValue}
        onChange={onSearchChange}
        label={searchLabel}
        placeholder={searchPlaceholder}
        hint={searchHint}
      />

      {isBoxMode ? (
        <S.BoxFilterGrid>
          <S.FilterControl>
            <S.FilterLabel>Group</S.FilterLabel>
            <S.FilterRow>
              <FilterCombobox
                id="retrieval-console-box-group"
                name="retrieval_console_box_group"
                ariaLabel="Box group filter options"
                placeholder="All Groups"
                options={boxGroupOptions}
                selectedKey={selectedBoxGroup}
                onSelectedKeyChange={onBoxGroupChange}
                emptyMessage="No groups match"
              />
              <S.AddFilterButton
                type="button"
                onClick={onClearBoxGroup}
                disabled={!selectedBoxGroup}
              >
                Clear
              </S.AddFilterButton>
            </S.FilterRow>
          </S.FilterControl>

          <S.FilterControl>
            <S.FilterLabel>Location</S.FilterLabel>
            <S.FilterRow>
              <FilterCombobox
                id="retrieval-console-box-location"
                name="retrieval_console_box_location"
                ariaLabel="Box location filter options"
                placeholder="Filter by location..."
                options={boxLocationOptions}
                selectedKey={selectedBoxLocation}
                onSelectedKeyChange={onBoxLocationChange}
                emptyMessage="No locations match"
              />
              <S.AddFilterButton
                type="button"
                onClick={onClearBoxLocation}
                disabled={!selectedBoxLocation}
              >
                Clear
              </S.AddFilterButton>
            </S.FilterRow>
          </S.FilterControl>
        </S.BoxFilterGrid>
      ) : (
        <>
          <S.RefineHeaderRow>
            <S.RefineToggle
              type="button"
              onClick={onToggleRefine}
              aria-expanded={showRefine}
              aria-controls="retrieval-console-refine-panel"
            >
              {showRefine ? 'Hide Refine' : 'Refine'}
            </S.RefineToggle>
            {safeChips.length ? (
              <S.RefineCount>{safeChips.length} active filters</S.RefineCount>
            ) : null}
          </S.RefineHeaderRow>

          {showRefine ? (
            <S.RefinePanel id="retrieval-console-refine-panel">
              <RetrievalFilterBar
                sortOptions={sortOptions}
                selectedSort={selectedSort}
                categoryOptions={categoryOptions}
                tagOptions={tagOptions}
                locationOptions={locationOptions}
                ownerOptions={ownerOptions}
                keepPriorityOptions={keepPriorityOptions}
                onSortChange={onSortChange}
                onCategoryChange={onCategoryChange}
                onTagChange={onTagChange}
                onLocationChange={onLocationChange}
                onOwnerChange={onOwnerChange}
                onKeepPriorityChange={onKeepPriorityChange}
              />

              <ActiveFilterChips
                chips={safeChips}
                onRemove={onRemoveChip}
                onClearAll={onClearAllChips}
              />
            </S.RefinePanel>
          ) : null}
        </>
      )}
    </Surface>
  );
}
