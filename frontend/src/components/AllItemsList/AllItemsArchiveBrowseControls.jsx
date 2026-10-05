import styled from 'styled-components';
import { controlStyles, inputStyles } from '../../styles/primitives';
import FilterCombobox from '../Retrieval/FilterCombobox';
import * as GridStyles from '../../styles/InventoryGridHeader.styles';
import { ARCHIVE_SORT_OPTIONS } from './allItemsList.utils';

const Shell = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.42rem;
  align-items: end;
  padding: 0.48rem;
  border: 1px solid rgba(240, 138, 123, 0.34);
  border-radius: 7px;
  background: var(--dw-surface);

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const SearchField = styled.label`
  display: grid;
  gap: 0.22rem;
  min-width: 0;
`;

const Label = styled.span`
  color: rgba(240, 180, 168, 0.76);
  font: 800 0.75rem/1.2 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
`;

const SearchInput = styled.input`
  ${inputStyles}
  width: 100%;
  min-height: var(--dw-control-height);
  padding: 0.46rem 0.56rem;
  border: 1px solid rgba(240, 138, 123, 0.42);
  border-radius: 5px;
  outline: 2px solid transparent;
  background: var(--dw-surface-raised);
  color: #f1e8e6;
  font: 0.86rem/1.2 var(--dw-font-ui);

  &::placeholder {
    color: rgba(230, 237, 243, 0.4);
  }

  &:focus {
    border-color: rgba(240, 160, 145, 0.92);
    box-shadow: none;
  }
`;

const SortField = styled.div`
  display: grid;
  gap: 0.22rem;
  min-width: min(15rem, 100%);
`;

const StatusRail = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem;
`;

const StatusButton = styled.button`
  ${controlStyles}
  min-height: var(--dw-control-height);
  padding: 0.34rem 0.44rem;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(240, 160, 145, 0.86)' : 'rgba(240, 138, 123, 0.26)')};
  border-radius: 5px;
  background: ${({ $active }) =>
    $active
      ? 'var(--dw-surface-raised)'
      : 'rgba(9, 16, 22, 0.84)'};
  color: ${({ $active }) => ($active ? '#ffd5cd' : 'rgba(230, 237, 243, 0.72)')};
  font: 800 0.75rem/1.1 var(--dw-font-ui);
  letter-spacing: normal;
  text-transform: none;
  cursor: pointer;
`;

export default function AllItemsArchiveBrowseControls({
  searchQuery = '',
  sortBy = 'dispositionAt',
  sortDirection = 'desc',
  onSearchChange,
  onStatusChange,
  onSortChange,
  onSortDirectionChange,
}) {
  return (
    <Shell aria-label="No Longer Have archive search">
      <StatusRail role="group" aria-label="Inventory status view">
        <StatusButton type="button" onClick={() => onStatusChange?.('active')}>
          Active Inventory
        </StatusButton>
        <StatusButton type="button" $active aria-pressed="true">
          No Longer Have
        </StatusButton>
      </StatusRail>

      <SearchField>
        <Label>Search former items</Label>
        <SearchInput
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Name, tag, note, category, disposition..."
          aria-label="Search No Longer Have items"
          autoComplete="off"
        />
      </SearchField>

      <SortField>
        <Label>Archive order</Label>
        <GridStyles.SortControlRow>
          <FilterCombobox
            id="all-items-archive-sort"
            name="all_items_archive_sort"
            ariaLabel="Sort No Longer Have items"
            variant="sort"
            options={ARCHIVE_SORT_OPTIONS}
            selectedKey={sortBy}
            onSelectedKeyChange={onSortChange}
            clearSelectedOnInput={false}
            emptyMessage="No archive sorts match"
          />
          <GridStyles.SortDirectionButton
            type="button"
            onClick={() =>
              onSortDirectionChange?.(sortDirection === 'desc' ? 'asc' : 'desc')
            }
            aria-label={`Archive sort direction: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}`}
            title={`Archive sort direction: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}`}
            $descending={sortDirection === 'desc'}
          >
            <span aria-hidden="true">{sortDirection === 'desc' ? '⬇' : '⬆'}</span>
          </GridStyles.SortDirectionButton>
        </GridStyles.SortControlRow>
      </SortField>
    </Shell>
  );
}
