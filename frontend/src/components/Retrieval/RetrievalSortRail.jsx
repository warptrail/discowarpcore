import { useMemo } from 'react';
import SortFieldPanel from './SortFieldPanel';
import SortDirectionToggle from '../InventoryFilters/SortDirectionToggle';
import SortSymbol from '../InventoryFilters/SortSymbol';
import { sortAfterFieldClick } from './retrievalBrowseSort';
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
  sortOptions = [],
  selectedSort = '',
  onSortChange,
  secondary = false,
  backdropLabel = null,
}) {
  const selectedBaseKey = getSortBaseKey(selectedSort);
  const descending = isDescendingSort(selectedSort);
  const baseOptions = useMemo(
    () => getBaseSortOptions(sortOptions)
      .filter(({ key }) => key !== 'random')
      .filter(({ key }) => secondary !== ['location', 'box', 'name', 'tag'].includes(key))
      .map((option) => ({ ...option, icon: <SortSymbol field={option.key} /> })),
    [sortOptions, secondary],
  );
  const hasDescendingVariant = sortOptions.some(
    (option) => String(option?.key || '') === `${selectedBaseKey}_desc`,
  );

  const selectBaseSort = (nextBaseKey) => {
    const directionKey = sortAfterFieldClick(selectedSort, nextBaseKey);
    if (directionKey === 'random') {
      onSortChange?.('random');
      return;
    }
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

  if (!baseOptions.length) return null;
  return (
    <S.InlineSortRail role="group" aria-label="Sort retrieval results">
      <SortFieldPanel options={baseOptions} value={selectedBaseKey} onChange={selectBaseSort} iconOnly backdropLabel={backdropLabel}
        endControl={secondary ? null : <SortDirectionToggle descending={descending}
          disabled={!hasDescendingVariant} onClick={toggleDirection} />} />
    </S.InlineSortRail>
  );
}
