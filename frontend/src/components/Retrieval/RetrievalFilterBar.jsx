import * as S from './Retrieval.styles';
import FilterCombobox from './FilterCombobox';

export default function RetrievalFilterBar({
  categoryOptions = [],
  tagOptions = [],
  locationOptions = [],
  ownerOptions = [],
  keepPriorityOptions = [],
  selectedCategory = '',
  selectedTag = '',
  selectedLocation = '',
  selectedOwner = '',
  selectedKeepPriority = '',
  onCategoryChange,
  onTagChange,
  onLocationChange,
  onOwnerChange,
  onKeepPriorityChange,
  onAddCategory,
  onAddTag,
  onAddLocation,
  onAddOwner,
  onAddKeepPriority,
}) {
  return (
    <S.FilterGrid>
      <S.FilterControl>
        <S.FilterLabel>Category</S.FilterLabel>
        <S.FilterRow>
          <FilterCombobox
            id="retrieval-filter-category"
            name="retrieval_filter_category"
            ariaLabel="Category filter options"
            placeholder="Select category..."
            options={categoryOptions}
            selectedKey={selectedCategory}
            onSelectedKeyChange={onCategoryChange}
            emptyMessage="No categories match"
          />
          <S.AddFilterButton
            type="button"
            onClick={onAddCategory}
            disabled={!selectedCategory}
          >
            Add
          </S.AddFilterButton>
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
            selectedKey={selectedTag}
            onSelectedKeyChange={onTagChange}
            emptyMessage="No tags match"
          />
          <S.AddFilterButton
            type="button"
            onClick={onAddTag}
            disabled={!selectedTag}
          >
            Add
          </S.AddFilterButton>
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
            selectedKey={selectedLocation}
            onSelectedKeyChange={onLocationChange}
            emptyMessage="No locations match"
          />
          <S.AddFilterButton
            type="button"
            onClick={onAddLocation}
            disabled={!selectedLocation}
          >
            Add
          </S.AddFilterButton>
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
            selectedKey={selectedOwner}
            onSelectedKeyChange={onOwnerChange}
            emptyMessage="No owners match"
          />
          <S.AddFilterButton
            type="button"
            onClick={onAddOwner}
            disabled={!selectedOwner}
          >
            Add
          </S.AddFilterButton>
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
            selectedKey={selectedKeepPriority}
            onSelectedKeyChange={onKeepPriorityChange}
            emptyMessage="No keep priorities match"
          />
          <S.AddFilterButton
            type="button"
            onClick={onAddKeepPriority}
            disabled={!selectedKeepPriority}
          >
            Add
          </S.AddFilterButton>
        </S.FilterRow>
      </S.FilterControl>
    </S.FilterGrid>
  );
}
