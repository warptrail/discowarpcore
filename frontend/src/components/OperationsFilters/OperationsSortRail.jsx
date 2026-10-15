import styled from 'styled-components';
import SortFieldPanel from '../Retrieval/SortFieldPanel';
import SortDirectionToggle from '../InventoryFilters/SortDirectionToggle';
import SortSymbol from '../InventoryFilters/SortSymbol';

const Rail = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const OPTIONS = [
  { key: 'boxId', label: 'Box ID' },
  { key: 'name', label: 'Name' },
  { key: 'location', label: 'Location' },
  { key: 'itemCount', label: 'Item Count' },
].map((option) => ({ ...option, icon: <SortSymbol field={option.key} /> }));

export default function OperationsSortRail({ sortBy, onSortChange, sortDirection, onSortDirectionChange }) {
  const descending = sortDirection === 'desc';
  const directionControl = (
    <SortDirectionToggle
      descending={descending}
      onClick={() => onSortDirectionChange?.(descending ? 'asc' : 'desc')}
    />
  );

  return (
    <Rail role="group" aria-label="Sort boxes">
      <SortFieldPanel
        options={OPTIONS}
        value={sortBy}
        onChange={onSortChange}
        iconOnly
        backdropLabel="Sort"
        endControl={directionControl}
      />
    </Rail>
  );
}
