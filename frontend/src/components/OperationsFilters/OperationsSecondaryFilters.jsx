import styled from 'styled-components';
import * as S from '../../styles/InventoryGridHeader.styles';
import CustomSelect from '../CustomSelect';
import OwnerFilterBar from './OwnerFilterBar';
import Disclosure from '../InventoryFilters/MoreFilters';
import { ITEM_CATEGORIES, formatItemCategory } from '../../util/itemCategories';
import { KEEP_PRIORITY_SCALE_OPTIONS } from '../../util/keepPriority';

const Clear = styled.button`
  min-height: 40px;
  margin-top: .3rem;
  padding: .35rem .6rem;
  border: 1px solid var(--dw-border-soft);
  border-radius: var(--dw-radius-sm);
  background: transparent;
  color: var(--dw-text-secondary);
  font: inherit;
  cursor: pointer;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  @media (pointer: coarse) { min-height: 44px; }
`;
const PRIORITIES = [{ value: 'all', label: 'All priorities' }, ...KEEP_PRIORITY_SCALE_OPTIONS, { value: 'gone', label: 'No longer have' }];
const Fields = styled(S.FilterRow)`
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

export function OperationsFilterFields({ categoryFilter, onCategoryFilterChange, ownerFilter, onOwnerFilterChange, keepPriorityFilter, onKeepPriorityFilterChange }) {
  return <Fields>
      <S.ControlGroup $tone="#5BC0EB">
        <S.ControlLabel>Category</S.ControlLabel>
        <CustomSelect value={categoryFilter} options={[{ value: 'all', label: 'All Categories' }, ...ITEM_CATEGORIES.map((category) => ({ value: category, label: formatItemCategory(category) }))]}
          onChange={onCategoryFilterChange} ariaLabel="Filter by item category" tone="#5BC0EB" hideScrollbar />
      </S.ControlGroup>
      <S.ControlGroup $tone="#F08A7B" $active={keepPriorityFilter !== 'all'}>
        <S.ControlLabel>Keep priority</S.ControlLabel>
        <CustomSelect value={keepPriorityFilter} options={PRIORITIES} onChange={onKeepPriorityFilterChange}
          ariaLabel="Filter by keep priority or no longer have status" tone="#F08A7B" />
      </S.ControlGroup>
      <OwnerFilterBar value={ownerFilter} onChange={onOwnerFilterChange} />
    </Fields>;
}

export default function OperationsSecondaryFilters(props) {
  const { categoryFilter, ownerFilter, keepPriorityFilter, onCategoryFilterChange, onOwnerFilterChange, onKeepPriorityFilterChange } = props;
  const hasActiveFilters = categoryFilter !== 'all' || ownerFilter !== 'all' || keepPriorityFilter !== 'all';
  return <Disclosure>
    <summary>More filters</summary>
    <OperationsFilterFields {...props} />
    {hasActiveFilters && <Clear type="button" onClick={() => {
      onCategoryFilterChange?.('all'); onOwnerFilterChange?.('all'); onKeepPriorityFilterChange?.('all');
    }}>Clear extra filters</Clear>}
  </Disclosure>;
}
