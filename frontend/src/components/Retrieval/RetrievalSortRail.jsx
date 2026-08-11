import { useMemo } from 'react';
import FilterCombobox from './FilterCombobox';
import * as S from './Retrieval.styles';

function getSortBaseKey(value) {
  return String(value || '').replace(/_desc$/, '');
}

function isDescendingSort(value) {
  return String(value || '').endsWith('_desc');
}

function getBaseSortOptions(options) {
  const seen = new Set();

  return (Array.isArray(options) ? options : []).reduce((result, option) => {
    const key = getSortBaseKey(option?.key);
    if (!key || seen.has(key)) return result;

    seen.add(key);
    result.push({
      key,
      label: String(option?.label || key).replace(/\s*\([^)]+\)\s*$/, ''),
    });
    return result;
  }, []);
}

export default function RetrievalSortRail({
  id = 'retrieval-sort',
  sortOptions = [],
  selectedSort = '',
  onSortChange,
}) {
  const selectedBaseKey = getSortBaseKey(selectedSort);
  const descending = isDescendingSort(selectedSort);
  const baseOptions = useMemo(
    () => getBaseSortOptions(sortOptions),
    [sortOptions],
  );
  const hasDescendingVariant = sortOptions.some(
    (option) => String(option?.key || '') === `${selectedBaseKey}_desc`,
  );

  const selectBaseSort = (nextBaseKey) => {
    const directionKey = `${nextBaseKey}${descending ? '_desc' : ''}`;
    const nextKey = sortOptions.some(
      (option) => String(option?.key || '') === directionKey,
    )
      ? directionKey
      : nextBaseKey;
    onSortChange?.(nextKey);
  };

  const toggleDirection = () => {
    if (!selectedBaseKey || !hasDescendingVariant) return;
    onSortChange?.(`${selectedBaseKey}${descending ? '' : '_desc'}`);
  };

  return (
    <S.InlineSortRail role="group" aria-label="Sort retrieval results">
      <S.InlineSortSelect>
        <FilterCombobox
          id={id}
          name={id.replace(/-/g, '_')}
          ariaLabel="Sort field"
          placeholder="Sort by"
          options={baseOptions}
          selectedKey={selectedBaseKey}
          onSelectedKeyChange={selectBaseSort}
          emptyMessage="No sort fields match"
          readOnlySelect
          variant="sort"
        />
      </S.InlineSortSelect>

      <S.InlineSortDirectionButton
        type="button"
        onClick={toggleDirection}
        disabled={!hasDescendingVariant}
        aria-pressed={descending}
        aria-label={`Sort ${descending ? 'descending' : 'ascending'}. Activate to reverse direction.`}
        title={`Sort ${descending ? 'descending' : 'ascending'} — reverse direction`}
        $descending={descending}
      >
        <span aria-hidden="true">↑</span>
        <span aria-hidden="true">↓</span>
      </S.InlineSortDirectionButton>
    </S.InlineSortRail>
  );
}
