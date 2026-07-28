import * as S from './Retrieval.styles';
import FilterCombobox from './FilterCombobox';

function getSortBaseKey(value) {
  return String(value || '').replace(/_desc$/, '');
}

function isDescendingSort(value) {
  return String(value || '').endsWith('_desc');
}

function getDirectionLabel(options, baseKey, descending) {
  const targetKey = `${baseKey}${descending ? '_desc' : ''}`;
  const option = options.find((entry) => String(entry?.key || '') === targetKey);
  const direction = String(option?.label || '').match(/\(([^)]+)\)\s*$/)?.[1];
  return direction || (descending ? 'Z → A' : 'A → Z');
}

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
  const selectedSortKey = String(selectedSort || '');
  const selectedBaseKey = getSortBaseKey(selectedSortKey);
  const descending = isDescendingSort(selectedSortKey);
  const primarySortOptions = (() => {
    const seen = new Set();

    return safeSortOptions.reduce((options, option) => {
      const key = getSortBaseKey(option?.key);
      if (!key || seen.has(key)) return options;

      seen.add(key);
      const label = String(option?.label || key).replace(/\s*\([^)]+\)\s*$/, '');
      options.push({ key, label });
      return options;
    }, []);
  })();

  const hasDirectionVariant = safeSortOptions.some(
    (option) => String(option?.key || '') === `${selectedBaseKey}_desc`,
  );

  const handlePrimarySortChange = (nextBaseKey) => {
    const nextKey = `${nextBaseKey}${descending ? '_desc' : ''}`;
    const resolvedKey = safeSortOptions.some(
      (option) => String(option?.key || '') === nextKey,
    )
      ? nextKey
      : nextBaseKey;
    onSortChange?.(resolvedKey);
  };

  const handleDirectionToggle = () => {
    if (!selectedBaseKey || !hasDirectionVariant) return;
    onSortChange?.(`${selectedBaseKey}${descending ? '' : '_desc'}`);
  };

  return (
    <S.FilterGrid>
      <S.FilterControl>
        <S.FilterLabel>Sort</S.FilterLabel>
        <S.FilterRow>
          <FilterCombobox
            id="retrieval-filter-sort-primary"
            name="retrieval_filter_sort_primary"
            ariaLabel="Primary retrieval sort"
            variant="sort"
            options={primarySortOptions}
            selectedKey={selectedBaseKey}
            onSelectedKeyChange={handlePrimarySortChange}
            emptyMessage="No sort options match"
            clearSelectedOnInput={false}
          />
          <S.SortDirectionToggle
            type="button"
            onClick={handleDirectionToggle}
            disabled={!hasDirectionVariant}
            aria-label={`Sort direction: ${descending ? 'descending' : 'ascending'}. Activate to switch direction.`}
            title="Switch sort direction"
          >
            {getDirectionLabel(safeSortOptions, selectedBaseKey, descending)}
          </S.SortDirectionToggle>
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
