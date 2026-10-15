import FinderPanel from '../InventoryFilters/FinderPanel';
import LocationBranchFilter from '../InventoryFilters/LocationBranchFilter';
import OperationsSortRail from './OperationsSortRail';
import { OperationsFilterFields } from './OperationsSecondaryFilters';

export default function OperationsControlPanel({ sortBy, onSortChange, sortDirection, onSortDirectionChange,
  locations, locationFilter, onLocationFilterChange, categoryFilter, onCategoryFilterChange,
  ownerFilter, onOwnerFilterChange, keepPriorityFilter, onKeepPriorityFilterChange,
  filtersActive, onReset, actionsTarget, actionsVisible = true }) {
  const secondaryActive = categoryFilter !== 'all' || ownerFilter !== 'all' || keepPriorityFilter !== 'all';
  return <FinderPanel filtersActive={filtersActive} onReset={onReset} secondaryActive={secondaryActive}
    actionsLabel="Operations finder actions"
    compactActions actionsTarget={actionsTarget} actionsVisible={actionsVisible}
    secondaryFilters={<OperationsFilterFields categoryFilter={categoryFilter} onCategoryFilterChange={onCategoryFilterChange}
      ownerFilter={ownerFilter} onOwnerFilterChange={onOwnerFilterChange}
      keepPriorityFilter={keepPriorityFilter} onKeepPriorityFilterChange={onKeepPriorityFilterChange} />}>
    <OperationsSortRail sortBy={sortBy} onSortChange={onSortChange}
      sortDirection={sortDirection} onSortDirectionChange={onSortDirectionChange} />
    <LocationBranchFilter locations={locations} value={locationFilter} onChange={onLocationFilterChange} dense stacked />
  </FinderPanel>;
}
