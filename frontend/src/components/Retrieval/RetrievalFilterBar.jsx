import * as S from './Retrieval.styles';
import FilterCombobox from './FilterCombobox';

export default function RetrievalFilterBar({
  sortOptions = [],
  selectedSort = '',
  categoryOptions = [],
  tagOptions = [],
  locationOptions = [],
  ownerOptions = [],
  keepPriorityOptions = [],
  onCategoryChange,
  onSortChange,
  onTagChange,
  onLocationChange,
  onOwnerChange,
  onKeepPriorityChange,
}) {
  const safeSortOptions = Array.isArray(sortOptions) ? sortOptions : [];

  return (
    <S.FilterGrid>
      <S.FilterControl>
        <S.FilterLabel>Sort</S.FilterLabel>
        <S.FilterRow>
          <FilterCombobox
            id="retrieval-filter-sort"
            name="retrieval_filter_sort"
            ariaLabel="Retrieval sort order"
            variant="sort"
            options={safeSortOptions}
            selectedKey={selectedSort}
            onSelectedKeyChange={onSortChange}
            emptyMessage="No sort options match"
            clearSelectedOnInput={false}
          />
        </S.FilterRow>
      </S.FilterControl>

      <S.FilterControl>
        <S.FilterLabel>Category</S.FilterLabel>
        <S.FilterRow>
          <FilterCombobox
            id="retrieval-filter-category"
            name="retrieval_filter_category"
            ariaLabel="Category filter options"
            placeholder="Select category..."
            options={categoryOptions}
            onSelectedKeyChange={onCategoryChange}
            emptyMessage="No categories match"
            clearInputOnSelect
          />
        </S.FilterRow>
      </S.FilterControl>

      <S.FilterControl>
        <S.FilterLabel>Tag</S.FilterLabel>
        <S.FilterRow>
          <FilterCombobox
            id="retrieval-filter-tag"
            name="retrieval_filter_tag"
            ariaLabel="Tag filter options"
            placeholder="Select tag..."
            options={tagOptions}
            onSelectedKeyChange={onTagChange}
            emptyMessage="No tags match"
            clearInputOnSelect
          />
        </S.FilterRow>
      </S.FilterControl>

      <S.FilterControl>
        <S.FilterLabel>Location</S.FilterLabel>
        <S.FilterRow>
          <FilterCombobox
            id="retrieval-filter-location"
            name="retrieval_filter_location"
            ariaLabel="Location filter options"
            placeholder="Select location..."
            options={locationOptions}
            onSelectedKeyChange={onLocationChange}
            emptyMessage="No locations match"
            clearInputOnSelect
          />
        </S.FilterRow>
      </S.FilterControl>

      <S.FilterControl>
        <S.FilterLabel>Primary Owner</S.FilterLabel>
        <S.FilterRow>
          <FilterCombobox
            id="retrieval-filter-owner"
            name="retrieval_filter_owner"
            ariaLabel="Primary owner filter options"
            placeholder="Select owner..."
            options={ownerOptions}
            onSelectedKeyChange={onOwnerChange}
            emptyMessage="No owners match"
            clearInputOnSelect
          />
        </S.FilterRow>
      </S.FilterControl>

      <S.FilterControl>
        <S.FilterLabel>Keep Priority</S.FilterLabel>
        <S.FilterRow>
          <FilterCombobox
            id="retrieval-filter-keep-priority"
            name="retrieval_filter_keep_priority"
            ariaLabel="Keep priority filter options"
            placeholder="Select keep priority..."
            options={keepPriorityOptions}
            onSelectedKeyChange={onKeepPriorityChange}
            emptyMessage="No keep priorities match"
            clearInputOnSelect
          />
        </S.FilterRow>
      </S.FilterControl>
    </S.FilterGrid>
  );
}
