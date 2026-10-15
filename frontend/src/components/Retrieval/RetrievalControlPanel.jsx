import styled from 'styled-components';
import FinderPanel from '../InventoryFilters/FinderPanel';
import RetrievalShuffleButton from './RetrievalShuffleButton';
import OwnerFilterBar from '../InventoryFilters/OwnerFilterBar';
import RetrievalSortRail from './RetrievalSortRail';
import RetrievalLocationFilter from './RetrievalLocationFilter';
import RetrievalTagNebula from './RetrievalTagNebula';
import FilterCombobox from './FilterCombobox';
import ActiveFilterChips from './ActiveFilterChips';
import { buildControlPanelChips, hasSecondaryRetrievalFilters, ownerFacetKeys } from './retrievalControlModel';
import { normalizePrimaryOwner } from '../../util/itemOwners';
const Field = styled.div`display: grid; gap: .2rem; min-width: 0;`;
const Label = styled.span`color: var(--dw-cyan); font: 650 .75rem/1.3 var(--dw-font-ui);`;
const CurrentSort = styled(Label)`color: var(--dw-text-muted); font-weight: 450;`;
const Extras = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .35rem;
  min-width: 0;
  > [data-wide] { grid-column: 1 / -1; }
`;

function Facet({ id, label, options, onChange }) {
  return <Field><Label>{label}</Label>
    <FilterCombobox id={id} name={id.replace(/-/g, '_')} ariaLabel={`${label} filter options`}
      placeholder={`Any ${label.toLowerCase()}`} options={options} onSelectedKeyChange={onChange}
      emptyMessage={`No ${label.toLowerCase()} values match`} clearInputOnSelect variant="facet" />
  </Field>;
}

export default function RetrievalControlPanel({ isBoxMode, hasTagScope, filterOptions = {}, activeChips = [],
  onCategoryChange, onTagChange, onTagRemove, onLocationSelectionChange, onOwnerChange, onKeepPriorityChange,
  onRemoveChip, onClearAll, tagOperator, onTagOperatorChange, sortOptions, selectedSort, onSortChange,
  selectedBoxRooms = [], selectedBoxLocations = [], selectedBoxTags = [], onBoxRoomsChange, onBoxLocationsChange, onBoxTagAdd, onBoxTagRemove,
  hasSearchFilters = false, onResetSearch, onReshuffle, shuffled = false, loading = false }) {
  const keys = (type) => activeChips.filter((chip) => chip.type === type).map((chip) => chip.key);
  const ownerKeys = keys('owners');
  const sortBase = String(selectedSort || '').replace(/_desc$/, '');
  const extraSort = !['location', 'box', 'name', 'tag', 'random'].includes(sortBase)
    ? sortOptions?.find((option) => option.key === selectedSort)?.label.replace(/\s*\([^)]+\)\s*$/, '') : '';
  const chooseOwner = (id) => {
    if (id === 'all') { ownerKeys.forEach((key) => onRemoveChip('owners', key)); return; }
    const matching = ownerFacetKeys(filterOptions.owners || [], id);
    const selected = matching.some((key) => ownerKeys.includes(key));
    matching.forEach((key) => selected ? onRemoveChip('owners', key) : onOwnerChange(key));
  };
  const chips = isBoxMode ? (selectedBoxTags || []).map((key) => ({ type: 'tags', key,
    label: `Tag: ${filterOptions.tags?.find((option) => option.key === key)?.label || key}` })) : buildControlPanelChips(activeChips).filter((chip) => chip.type !== 'locations');
  const clearFilters = () => {
    if (!isBoxMode) { onClearAll?.(); return; }
    onBoxRoomsChange?.([]);
    onBoxLocationsChange?.([]);
    selectedBoxTags?.forEach((key) => onBoxTagRemove?.(key));
  };
  const secondaryActive = hasSecondaryRetrievalFilters({ isBoxMode, hasTagScope, activeChips, selectedBoxTags });
  const filtersActive = hasSearchFilters || (isBoxMode
    ? selectedBoxRooms.length + selectedBoxLocations.length + selectedBoxTags.length > 0
    : activeChips.length > 0);
  const resetFilters = () => {
    clearFilters();
    onResetSearch?.();
  };
  const secondaryFilters = <Extras>
    {!isBoxMode && <>
      <Facet id="retrieval-item-category" label="Category" options={filterOptions.categories} onChange={onCategoryChange} />
      <Facet id="retrieval-item-priority" label="Keep priority" options={filterOptions.keepPriorities} onChange={onKeepPriorityChange} />
      <OwnerFilterBar values={ownerKeys} onChange={chooseOwner} />
      <Field data-wide><Label>Additional sorting</Label><RetrievalSortRail secondary sortOptions={sortOptions} selectedSort={selectedSort} onSortChange={onSortChange} /></Field>
    </>}
    {!hasTagScope && <Field data-wide><Label>Tags</Label>
      <RetrievalTagNebula id={`retrieval-${isBoxMode ? 'box' : 'item'}-tags`} options={filterOptions.tags}
        selectedKeys={isBoxMode ? selectedBoxTags : keys('tags')}
        onAdd={isBoxMode ? onBoxTagAdd : onTagChange} onRemove={isBoxMode ? onBoxTagRemove : onTagRemove}
        operator={tagOperator} onOperatorChange={onTagOperatorChange} />
    </Field>}
  </Extras>;
  return <FinderPanel secondaryFilters={secondaryFilters} secondaryActive={secondaryActive}
    filtersActive={filtersActive} onReset={resetFilters} shuffled={shuffled} actionsLabel="Retrieval finder actions"
    leadingAction={<RetrievalShuffleButton mode={isBoxMode ? 'boxes' : 'items'} shuffled={shuffled} loading={loading} onReshuffle={onReshuffle} />}>
    <Field>
      <RetrievalSortRail sortOptions={sortOptions} selectedSort={selectedSort} onSortChange={onSortChange} backdropLabel="Sort" />
      {extraSort && <CurrentSort>{extraSort}</CurrentSort>}
    </Field>
    <RetrievalLocationFilter options={filterOptions.locations} rooms={isBoxMode ? filterOptions.rooms : []}
      selectedKeys={isBoxMode ? selectedBoxLocations : keys('locations')}
      selectedRooms={isBoxMode ? selectedBoxRooms : undefined}
      onChange={isBoxMode ? onBoxLocationsChange : onLocationSelectionChange}
      onRoomsChange={isBoxMode ? onBoxRoomsChange : undefined} />
    <ActiveFilterChips chips={chips}
      onRemove={(type, key) => isBoxMode ? onBoxTagRemove?.(key) : type === 'owners'
        ? ownerKeys.filter((rawKey) => normalizePrimaryOwner(rawKey) === key).forEach((rawKey) => onRemoveChip(type, rawKey))
        : onRemoveChip(type, key)} showClearAll={false} />
  </FinderPanel>;
}
