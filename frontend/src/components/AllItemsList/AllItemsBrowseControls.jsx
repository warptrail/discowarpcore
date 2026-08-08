import { useMemo, useState } from 'react';
import styled from 'styled-components';
import FilterCombobox from '../Retrieval/FilterCombobox';
import * as GridStyles from '../../styles/InventoryGridHeader.styles';
import {
  BASE_FILTER_OPTIONS,
  COLOR_BY_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './allItemsList.utils';

const Shell = styled.div`
  display: grid;
  gap: 0.48rem;
`;

const SearchField = styled.label`
  display: grid;
  gap: 0.22rem;
  padding: 0.48rem;
  border: 1px solid rgba(76, 198, 193, 0.36);
  border-radius: 7px;
  background:
    linear-gradient(105deg, rgba(76, 198, 193, 0.13), transparent 46%),
    rgba(7, 13, 18, 0.88);
`;

const Label = styled.span`
  color: rgba(230, 237, 243, 0.66);
  font: 800 0.58rem/1.2 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const SearchInput = styled.input`
  width: 100%;
  min-height: 38px;
  padding: 0.46rem 0.56rem;
  border: 1px solid rgba(127, 215, 255, 0.42);
  border-radius: 5px;
  outline: none;
  background: rgba(6, 11, 16, 0.94);
  color: #e6edf3;
  font: 0.86rem/1.2 "SFMono-Regular", Consolas, monospace;

  &::placeholder {
    color: rgba(230, 237, 243, 0.4);
  }

  &:focus {
    border-color: rgba(127, 215, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(127, 215, 255, 0.13);
  }
`;

const ModeRail = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.3rem;

  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ModeButton = styled.button`
  min-height: 34px;
  padding: 0.34rem 0.44rem;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(127, 215, 255, 0.82)' : 'rgba(127, 215, 255, 0.24)')};
  border-radius: 5px;
  background:
    ${({ $active }) =>
      $active
        ? 'linear-gradient(180deg, rgba(45, 139, 181, 0.34), rgba(16, 42, 56, 0.88))'
        : 'rgba(9, 16, 22, 0.84)'};
  color: ${({ $active }) => ($active ? '#bfeeff' : 'rgba(230, 237, 243, 0.7)')};
  font: 800 0.64rem/1.1 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(127, 215, 255, 0.72);
    color: #e6f8ff;
  }
`;

const QuickRow = styled.div`
  display: flex;
  gap: 0.3rem;
  overflow-x: auto;
  padding-bottom: 0.08rem;
  scrollbar-width: thin;
`;

const QuickButton = styled(ModeButton)`
  flex: 0 0 auto;
  min-height: 29px;
  padding-inline: 0.58rem;
  font-size: 0.59rem;
`;

const RefineToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 32px;
  padding: 0.36rem 0.52rem;
  border: 1px solid rgba(76, 198, 193, 0.34);
  border-radius: 5px;
  background: rgba(9, 23, 28, 0.82);
  color: #7fd7d3;
  font: 800 0.62rem/1.1 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
`;

const RefinePanel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.8fr);
  gap: 0.42rem;
  padding: 0.46rem;
  border: 1px solid rgba(127, 215, 255, 0.2);
  border-radius: 7px;
  background: rgba(5, 11, 16, 0.74);

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const RefineField = styled.div`
  display: grid;
  gap: 0.22rem;
  min-width: 0;
`;

const ColorField = styled(RefineField)`
  grid-column: 1 / -1;
`;

const ColorRail = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
`;

const ColorButton = styled(QuickButton)`
  border-color:
    ${({ $active, $tone }) =>
      $active ? `${$tone}d9` : `${$tone}55`};
  background:
    ${({ $active, $tone }) =>
      $active
        ? `linear-gradient(180deg, ${$tone}42, ${$tone}1f)`
        : 'rgba(9, 16, 22, 0.84)'};
`;

const QUICK_FILTERS = BASE_FILTER_OPTIONS.slice(0, 4);
const COLOR_TONES = {
  none: '#7fd7ff',
  batch: '#a7b6ff',
  location: '#4cc6c1',
  box: '#e8b15c',
  status: '#f08a7b',
};

function toComboboxOptions(options) {
  return options.map((option) => ({ key: option.value, label: option.label }));
}

export default function AllItemsBrowseControls({
  statusFilter,
  filter,
  sortBy,
  sortDirection,
  searchQuery,
  colorBy,
  onStatusChange,
  onFilterChange,
  onSortChange,
  onSortDirectionChange,
  onColorByChange,
  onSearchChange,
  categoryOptions = [],
  batchOptions = [],
}) {
  const [refineOpen, setRefineOpen] = useState(false);
  const filterOptions = useMemo(
    () => toComboboxOptions([...BASE_FILTER_OPTIONS, ...categoryOptions, ...batchOptions]),
    [batchOptions, categoryOptions],
  );
  const activeRefinements = [
    filter !== 'all',
    sortBy !== 'alpha',
    colorBy !== 'none',
  ].filter(Boolean).length;

  return (
    <Shell>
      <SearchField>
        <Label>Find anything</Label>
        <SearchInput
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Name, tag, note, category, box, location..."
          aria-label="Search all items"
          autoComplete="off"
        />
      </SearchField>

      <ModeRail role="group" aria-label="Inventory history view">
        {STATUS_FILTER_OPTIONS.map((option) => (
          <ModeButton
            key={option.value}
            type="button"
            $active={statusFilter === option.value}
            aria-pressed={statusFilter === option.value}
            onClick={() => onStatusChange?.(option.value)}
          >
            {option.label}
          </ModeButton>
        ))}
      </ModeRail>

      <QuickRow role="group" aria-label="Quick item filters">
        {QUICK_FILTERS.map((option) => (
          <QuickButton
            key={option.value}
            type="button"
            $active={filter === option.value}
            aria-pressed={filter === option.value}
            onClick={() => onFilterChange?.(option.value)}
          >
            {option.label}
          </QuickButton>
        ))}
      </QuickRow>

      <RefineToggle
        type="button"
        aria-expanded={refineOpen}
        aria-controls="all-items-browse-refine"
        onClick={() => setRefineOpen((current) => !current)}
      >
        <span>{refineOpen ? 'Hide refine' : 'Refine browse'}</span>
        <span>{activeRefinements ? `${activeRefinements} active` : refineOpen ? '−' : '+'}</span>
      </RefineToggle>

      {refineOpen ? (
        <RefinePanel id="all-items-browse-refine">
          <RefineField>
            <Label>Filter inventory</Label>
            <FilterCombobox
              id="all-items-filter"
              name="all_items_filter"
              ariaLabel="Filter all items"
              options={filterOptions}
              selectedKey={filter}
              onSelectedKeyChange={onFilterChange}
              clearSelectedOnInput={false}
              emptyMessage="No filters match"
            />
          </RefineField>

          <RefineField>
            <Label>Sort results</Label>
            <GridStyles.SortControlRow>
              <FilterCombobox
                id="all-items-sort"
                name="all_items_sort"
                ariaLabel="Sort all items"
                variant="sort"
                options={toComboboxOptions(SORT_OPTIONS)}
                selectedKey={sortBy}
                onSelectedKeyChange={onSortChange}
                clearSelectedOnInput={false}
                emptyMessage="No sorts match"
              />
              <GridStyles.SortDirectionButton
                type="button"
                onClick={() =>
                  onSortDirectionChange?.(sortDirection === 'desc' ? 'asc' : 'desc')
                }
                aria-label={`Sort direction: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}`}
                title={`Sort direction: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}`}
                $descending={sortDirection === 'desc'}
              >
                <span aria-hidden="true">{sortDirection === 'desc' ? '⬇' : '⬆'}</span>
              </GridStyles.SortDirectionButton>
            </GridStyles.SortControlRow>
          </RefineField>

          <ColorField>
            <Label>Color signal</Label>
            <ColorRail role="group" aria-label="Color items by">
              {COLOR_BY_OPTIONS.map((option) => (
                <ColorButton
                  key={option.value}
                  type="button"
                  $tone={COLOR_TONES[option.value]}
                  $active={colorBy === option.value}
                  aria-pressed={colorBy === option.value}
                  onClick={() => onColorByChange?.(option.value)}
                >
                  {option.label}
                </ColorButton>
              ))}
            </ColorRail>
          </ColorField>
        </RefinePanel>
      ) : null}
    </Shell>
  );
}
