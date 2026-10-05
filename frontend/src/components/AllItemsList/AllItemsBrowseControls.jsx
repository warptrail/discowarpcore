import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { controlStyles, inputStyles } from '../../styles/primitives';
import AllItemsQuickSort from './AllItemsQuickSort';
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
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  column-gap: 0.8rem;
  row-gap: 0.48rem;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.55rem;
  }
`;

const SearchField = styled.label`
  display: grid;
  min-width: 0;
`;

const Label = styled.span`
  color: rgba(230, 237, 243, 0.66);
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: normal;
  text-transform: none;
`;

const SearchLabel = styled(Label)`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const SearchInput = styled.input`
  ${inputStyles}
  width: 100%;
  min-height: 44px;
  padding: 0.56rem 0.72rem;
  border: 1px solid rgba(230, 237, 243, 0.16);
  border-radius: 8px;
  outline: 2px solid transparent;
  background: var(--dw-surface-raised);
  color: #e6edf3;
  font-family: inherit;
  font-size: 0.92rem;
  line-height: 1.25;

  &::placeholder {
    color: rgba(230, 237, 243, 0.4);
  }

  &:focus {
    border-color: rgba(127, 215, 255, 0.72);
    box-shadow: none;
  }
`;

const ModeRail = styled.div`
  display: grid;
  grid-template-columns: repeat(3, max-content);
  gap: 0.16rem;
  padding: 0.14rem;
  border: 1px solid rgba(230, 237, 243, 0.12);
  border-radius: 5px;
  background: var(--dw-surface-raised);

  @media (max-width: 520px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const ModeButton = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  padding: 0.4rem 0.72rem;
  border: 0;
  border-radius: 3px;
  background: ${({ $active }) =>
    $active ? 'rgba(76, 198, 193, 0.13)' : 'transparent'};
  box-shadow: none;
  border-left: 3px solid ${({ $active }) => $active ? 'var(--dw-cyan)' : 'transparent'};
  color: ${({ $active }) =>
    $active ? '#d9f3ef' : 'rgba(230, 237, 243, 0.68)'};
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 650;
  line-height: 1.1;
  text-transform: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: rgba(76, 198, 193, 0.1);
    color: #e6f8f5;
    outline: 2px solid var(--dw-cyan);
  }
`;

const QuickButton = styled(ModeButton)`
  flex: 0 0 auto;
  min-height: var(--dw-control-height);
  padding-inline: 0.58rem;
  font-size: 0.75rem;
`;

const RefineToggle = styled.button`
  ${controlStyles}
  display: flex;
  align-items: center;
  gap: 0.44rem;
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.16rem 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(230, 237, 243, 0.74);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.1;
  text-transform: none;
  cursor: pointer;

  > span:last-child {
    color: var(--dw-violet);
    font-size: 0.75rem;
  }

  &:hover,
  &:focus-visible {
    color: #c9efff;
    outline: 2px solid var(--dw-cyan);
  }
`;

const RefinePanel = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;
  grid-column: 1 / -1;
  padding: 0.7rem 0 0.18rem;
  border: 0;
  border-top: 1px solid rgba(230, 237, 243, 0.1);
  border-radius: 0;
  background: transparent;

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
  border-color: ${({ $active, $tone }) =>
    $active ? `${$tone}d9` : `${$tone}55`};
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'rgba(9, 16, 22, 0.84)'};
`;

const InventorySummary = styled.details`
  grid-column: 1 / -1;
  padding-top: 0.18rem;
  border-top: 1px solid rgba(230, 237, 243, 0.1);

  > summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    color: rgba(230, 237, 243, 0.74);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }

  > summary::-webkit-details-marker {
    display: none;
  }

  > summary::after {
    content: '+';
    color: #7fd7d3;
    font-size: 1rem;
  }

  &[open] > summary::after {
    content: '−';
  }
`;

const InventorySummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.18rem 0 0.42rem;

  @media (max-width: 620px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const InventorySummaryValue = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.32rem;
  min-width: 0;
  color: rgba(230, 237, 243, 0.68);
  font-size: 0.76rem;

  strong {
    color: #e6edf3;
    font-size: 0.9rem;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
`;

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
  onRandomize,
  onSearchChange,
  categoryOptions = [],
  batchOptions = [],
  visibleCount = 0,
  totalCount = 0,
  activeCount = 0,
  goneCount = 0,
  orphanedCount = 0,
}) {
  const [refineOpen, setRefineOpen] = useState(false);
  const filterOptions = useMemo(
    () =>
      toComboboxOptions([
        ...BASE_FILTER_OPTIONS,
        ...categoryOptions,
        ...batchOptions,
      ]),
    [batchOptions, categoryOptions],
  );
  const activeRefinements = [
    filter !== 'all',
    statusFilter !== 'active',
    colorBy !== 'none',
  ].filter(Boolean).length;

  return (
    <Shell>
      <SearchField>
        <SearchLabel>Find anything</SearchLabel>
        <SearchInput
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search items, boxes, tags…"
          aria-label="Search all items"
          autoComplete="off"
        />
      </SearchField>

      <AllItemsQuickSort
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        onSortDirectionChange={onSortDirectionChange}
        onRandomize={onRandomize}
      >
        <RefineToggle
          type="button"
          aria-expanded={refineOpen}
          aria-controls="all-items-browse-refine"
          onClick={() => setRefineOpen((current) => !current)}
        >
          <span>Filters</span>
          <span>
            {activeRefinements
              ? `${activeRefinements} active`
              : refineOpen
                ? '−'
                : '+'}
          </span>
        </RefineToggle>
      </AllItemsQuickSort>

      {refineOpen ? (
        <RefinePanel id="all-items-browse-refine">
          <ColorField>
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
          </ColorField>
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
                  onSortDirectionChange?.(
                    sortDirection === 'desc' ? 'asc' : 'desc',
                  )
                }
                aria-label={`Sort direction: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}`}
                title={`Sort direction: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}`}
                $descending={sortDirection === 'desc'}
              >
                <span aria-hidden="true">
                  {sortDirection === 'desc' ? '⬇' : '⬆'}
                </span>
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
          <InventorySummary>
            <summary>Inventory summary</summary>
            <InventorySummaryGrid>
              <InventorySummaryValue>
                <strong>{Number(visibleCount || 0).toLocaleString()}</strong>{' '}
                shown
              </InventorySummaryValue>
              <InventorySummaryValue>
                <strong>{Number(totalCount || 0).toLocaleString()}</strong>{' '}
                total history
              </InventorySummaryValue>
              <InventorySummaryValue>
                <strong>{Number(activeCount || 0).toLocaleString()}</strong>{' '}
                active
              </InventorySummaryValue>
              <InventorySummaryValue>
                <strong>{Number(goneCount || 0).toLocaleString()}</strong> gone
              </InventorySummaryValue>
              <InventorySummaryValue>
                <strong>{Number(orphanedCount || 0).toLocaleString()}</strong>{' '}
                adrift
              </InventorySummaryValue>
            </InventorySummaryGrid>
          </InventorySummary>
        </RefinePanel>
      ) : null}
    </Shell>
  );
}
