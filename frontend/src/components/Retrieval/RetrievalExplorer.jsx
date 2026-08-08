import { useMemo, useRef, useState } from 'react';
import * as S from './Retrieval.styles';
import ActiveFilterChips from './ActiveFilterChips';

const FACETS = [
  { key: 'locations', label: 'Location', shortLabel: 'LOC', optionKey: 'locations' },
  { key: 'categories', label: 'Category', shortLabel: 'CAT', optionKey: 'categories' },
  { key: 'tags', label: 'Tag', shortLabel: 'TAG', optionKey: 'tags' },
  { key: 'owners', label: 'Owner', shortLabel: 'OWNER', optionKey: 'owners' },
  { key: 'keepPriorities', label: 'Keep priority', shortLabel: 'KEEP', optionKey: 'keepPriorities' },
];

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

function getOrderLabel(options, selectedSort) {
  const selected = (Array.isArray(options) ? options : []).find(
    (option) => String(option?.key || '') === String(selectedSort || ''),
  );
  return String(selected?.label || 'Location').replace(/\s*\([^)]+\)\s*$/, '');
}

function matchesOption(option, query) {
  if (!query) return true;
  return String(option?.label || '').toLowerCase().includes(query.toLowerCase());
}

export default function RetrievalExplorer({
  countLabel,
  activeFilters,
  filterOptions,
  activeChips,
  tagScope,
  sortOptions,
  selectedSort,
  presentation = 'cards',
  tagOperator = 'or',
  onToggleFilter,
  onRemoveChip,
  onClearAll,
  onSortChange,
  onPresentationChange,
  onTagOperatorChange,
}) {
  const [activeTray, setActiveTray] = useState('');
  const [optionQuery, setOptionQuery] = useState('');
  const [tooltip, setTooltip] = useState('');
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const selectedBaseSort = getSortBaseKey(selectedSort);
  const descending = isDescendingSort(selectedSort);
  const baseSortOptions = useMemo(() => getBaseSortOptions(sortOptions), [sortOptions]);
  const visibleFacets = FACETS.filter((facet) => !(tagScope && facet.key === 'tags'));
  const activeFacet = FACETS.find((facet) => facet.key === activeTray) || null;
  const activeFacetOptions = Array.isArray(filterOptions?.[activeFacet?.optionKey])
    ? filterOptions[activeFacet.optionKey]
    : [];
  const matchingOptions = activeFacetOptions.filter((option) => matchesOption(option, optionQuery));

  const changeTray = (nextTray) => {
    setActiveTray((current) => (current === nextTray ? '' : nextTray));
    setOptionQuery('');
    setTooltip('');
  };

  const startLongPress = (tooltipKey, event) => {
    if (event.pointerType !== 'touch') return;
    longPressTriggeredRef.current = false;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setTooltip(tooltipKey);
      window.setTimeout(() => setTooltip(''), 1800);
    }, 480);
  };

  const clearLongPress = () => {
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const selectSort = (baseKey) => {
    const preferred = `${baseKey}${descending ? '_desc' : ''}`;
    const hasPreferred = sortOptions.some((option) => String(option?.key || '') === preferred);
    onSortChange?.(hasPreferred ? preferred : baseKey);
  };

  return (
    <S.ExplorerShell>
      <S.ResultsHeaderTop>
        <S.ResultsCount>{countLabel}</S.ResultsCount>
        <S.ResultsHeaderActions>
          <S.ExplorerViewTrigger
            type="button"
            aria-pressed={presentation === 'ascii'}
            $active={presentation === 'ascii'}
            onClick={() => onPresentationChange?.(presentation === 'ascii' ? 'cards' : 'ascii')}
          >
            <span>VIEW</span>
            <strong>{presentation === 'ascii' ? 'ASCII' : 'CARDS'}</strong>
          </S.ExplorerViewTrigger>
          <S.ExplorerOrderTrigger
            type="button"
            aria-expanded={activeTray === 'order'}
            aria-controls="retrieval-explorer-tray"
            onClick={() => changeTray('order')}
            $active={activeTray === 'order'}
          >
            <span>ORDER</span>
            <strong>{selectedBaseSort.slice(0, 3).toUpperCase()} {descending ? '↓' : '↑'}</strong>
          </S.ExplorerOrderTrigger>
        </S.ResultsHeaderActions>
      </S.ResultsHeaderTop>

      <S.ExplorerFacetRail aria-label="Filter retrieval results">
        {visibleFacets.map((facet) => {
          const selectedCount = Array.isArray(activeFilters?.[facet.key])
            ? activeFilters[facet.key].length
            : 0;
          const active = activeTray === facet.key;

          return (
            <S.ExplorerFacetButton
              key={facet.key}
              type="button"
              aria-pressed={active}
              aria-expanded={active}
              aria-controls="retrieval-explorer-tray"
              onClick={() => changeTray(facet.key)}
              $active={active}
              $selected={selectedCount > 0}
            >
              <span>{facet.shortLabel}</span>
              {selectedCount ? <b>{selectedCount}</b> : null}
            </S.ExplorerFacetButton>
          );
        })}
      </S.ExplorerFacetRail>

      {activeTray ? (
        <S.ExplorerTray id="retrieval-explorer-tray">
          <S.ExplorerTrayHeader>
            <S.ExplorerTrayTitle>
              {activeTray === 'order' ? `Order by ${getOrderLabel(sortOptions, selectedSort)}` : activeFacet?.label}
            </S.ExplorerTrayTitle>
            {activeTray === 'tags' ? (
              <S.TagOperatorToggle
                type="button"
                aria-label={`Tag matching: ${tagOperator === 'and' ? 'all selected tags' : 'any selected tag'}`}
                onClick={() => onTagOperatorChange?.(tagOperator === 'and' ? 'or' : 'and')}
                $and={tagOperator === 'and'}
              >
                <span>Match</span>
                <strong>{tagOperator.toUpperCase()}</strong>
              </S.TagOperatorToggle>
            ) : null}
            <S.ExplorerTrayClose type="button" onClick={() => changeTray(activeTray)} aria-label="Close retrieval controls">×</S.ExplorerTrayClose>
          </S.ExplorerTrayHeader>

          {activeTray === 'order' ? (
            <S.ExplorerSortGrid>
              {baseSortOptions.map((option) => {
                const active = option.key === selectedBaseSort;
                const tooltipId = `retrieval-order-tooltip-${option.key}`;
                return (
                  <S.ExplorerSortButtonWrap key={option.key}>
                    <S.ExplorerSortButton
                      type="button"
                      $active={active}
                      aria-pressed={active}
                      aria-describedby={tooltip === option.key ? tooltipId : undefined}
                      title={`Order by ${option.label}`}
                      onClick={() => {
                        if (longPressTriggeredRef.current) {
                          longPressTriggeredRef.current = false;
                          return;
                        }
                        selectSort(option.key);
                      }}
                      onFocus={() => setTooltip(option.key)}
                      onBlur={() => setTooltip('')}
                      onMouseEnter={() => setTooltip(option.key)}
                      onMouseLeave={() => setTooltip('')}
                      onPointerDown={(event) => startLongPress(option.key, event)}
                      onPointerUp={clearLongPress}
                      onPointerCancel={clearLongPress}
                    >
                      {option.label}
                    </S.ExplorerSortButton>
                    {tooltip === option.key ? <S.ExplorerTooltip id={tooltipId} role="tooltip">Order by {option.label}</S.ExplorerTooltip> : null}
                  </S.ExplorerSortButtonWrap>
                );
              })}
              <S.ExplorerSortButton
                type="button"
                $active
                onClick={() => onSortChange?.(`${selectedBaseSort}${descending ? '' : '_desc'}`)}
              >
                {descending ? 'Descending ↓' : 'Ascending ↑'}
              </S.ExplorerSortButton>
            </S.ExplorerSortGrid>
          ) : (
            <>
              <S.ExplorerOptionSearch
                type="search"
                value={optionQuery}
                onChange={(event) => setOptionQuery(event.target.value)}
                placeholder={`Search ${String(activeFacet?.label || '').toLowerCase()} values`}
                aria-label={`Search ${String(activeFacet?.label || '').toLowerCase()} options`}
              />
              <S.ExplorerOptionList aria-label={`${activeFacet?.label} options`}>
                {matchingOptions.length ? matchingOptions.map((option) => {
                  const key = String(option?.key || '');
                  const selected = Array.isArray(activeFilters?.[activeFacet?.key])
                    && activeFilters[activeFacet.key].includes(key);
                  return (
                    <S.ExplorerOptionButton
                      key={key}
                      type="button"
                      aria-pressed={selected}
                      $selected={selected}
                      onClick={() => onToggleFilter?.(activeFacet.key, key)}
                    >
                      {option?.label || key}
                    </S.ExplorerOptionButton>
                  );
                }) : <S.ExplorerEmptyState>No matching values.</S.ExplorerEmptyState>}
              </S.ExplorerOptionList>
            </>
          )}
        </S.ExplorerTray>
      ) : null}

      <ActiveFilterChips chips={activeChips} onRemove={onRemoveChip} onClearAll={onClearAll} />
    </S.ExplorerShell>
  );
}
