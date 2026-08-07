import { useState } from 'react';
import styled from 'styled-components';
import RetrievalModeToggle from './RetrievalModeToggle';
import RetrievalSearchBar from './RetrievalSearchBar';
import FilterCombobox from './FilterCombobox';
import * as S from './Retrieval.styles';

const Surface = styled.div`
  width: 100%;
  display: grid;
  gap: 0.42rem;

  @media (min-width: 900px) {
    grid-template-columns: minmax(150px, auto) minmax(0, 1fr);
    align-items: center;

    > :nth-child(1) {
      grid-column: 1;
      grid-row: 1;
    }

    > :nth-child(2) {
      grid-column: 2;
      grid-row: 1;
    }

    > :nth-child(n + 3) {
      grid-column: 1 / -1;
    }
  }
`;

const ScopePlaque = styled.div`
  min-height: 38px;
  display: inline-grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.52rem;
  border: 1px solid rgba(167, 182, 255, 0.38);
  border-left: 5px solid rgba(167, 182, 255, 0.82);
  border-radius: 2px 7px 2px 2px;
  background:
    linear-gradient(90deg, rgba(167, 182, 255, 0.18), transparent 68%),
    rgba(7, 13, 21, 0.92);
  padding: 0.28rem 0.62rem 0.28rem 0.52rem;
  min-width: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);

  @media (max-width: 700px) {
    min-height: 44px;
  }
`;

const ScopeCode = styled.span`
  color: #a7b6ff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.64rem;
  font-weight: 860;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const ScopeIdentity = styled.span`
  min-width: 0;
  overflow: hidden;
  color: #edf0ff;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;

  &::after {
    content: ' · VIRTUAL BOX';
    color: rgba(205, 214, 255, 0.5);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.6rem;
    letter-spacing: 0.08em;
  }
`;

export default function RetrievalConsoleControls({
  mode = 'items',
  onModeChange,
  searchValue = '',
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  searchHint,
  boxGroupOptions = [],
  selectedBoxGroup = '',
  boxLocationOptions = [],
  selectedBoxLocation = '',
  onBoxGroupChange,
  onBoxLocationChange,
  onClearBoxGroup,
  onClearBoxLocation,
  scope = null,
}) {
  const isBoxMode = mode === 'boxes';
  const hasTagScope = scope?.kind === 'tag' && Boolean(scope?.key);
  const [showAdvancedBoxFilters, setShowAdvancedBoxFilters] = useState(false);
  const advancedBoxFiltersOpen = showAdvancedBoxFilters || Boolean(selectedBoxGroup);

  return (
    <Surface>
      {hasTagScope ? (
        <ScopePlaque aria-label={`Tag ${scope.label}, virtual box`}>
          <ScopeCode>Tag //</ScopeCode>
          <ScopeIdentity>{scope.label}</ScopeIdentity>
        </ScopePlaque>
      ) : (
        <RetrievalModeToggle mode={mode} onChange={onModeChange} />
      )}

      <RetrievalSearchBar
        id="retrieval-console-search"
        value={searchValue}
        onChange={onSearchChange}
        label={searchLabel}
        placeholder={searchPlaceholder}
        hint={searchHint}
      />

      {isBoxMode ? (
        <>
          <S.FilterControl>
            <S.FilterLabel>Location</S.FilterLabel>
            <S.FilterRow>
              <FilterCombobox
                id="retrieval-console-box-location"
                name="retrieval_console_box_location"
                ariaLabel="Box location filter options"
                placeholder="Filter by location..."
                options={boxLocationOptions}
                selectedKey={selectedBoxLocation}
                onSelectedKeyChange={onBoxLocationChange}
                emptyMessage="No locations match"
              />
              <S.AddFilterButton
                type="button"
                onClick={onClearBoxLocation}
                disabled={!selectedBoxLocation}
              >
                Clear
              </S.AddFilterButton>
              </S.FilterRow>
            </S.FilterControl>

          <S.RefineHeaderRow>
            <S.RefineToggle
              type="button"
              onClick={() => setShowAdvancedBoxFilters((current) => !current)}
              aria-expanded={advancedBoxFiltersOpen}
              aria-controls="retrieval-console-box-advanced-filters"
            >
              {advancedBoxFiltersOpen ? 'Hide more filters' : 'More filters'}
            </S.RefineToggle>
            {selectedBoxGroup ? <S.RefineCount>1 active filter</S.RefineCount> : null}
          </S.RefineHeaderRow>

          {advancedBoxFiltersOpen ? (
            <S.RefinePanel id="retrieval-console-box-advanced-filters">
              <S.FilterControl>
                <S.FilterLabel>Group</S.FilterLabel>
                <S.FilterRow>
                  <FilterCombobox
                    id="retrieval-console-box-group"
                    name="retrieval_console_box_group"
                    ariaLabel="Box group filter options"
                    placeholder="All Groups"
                    options={boxGroupOptions}
                    selectedKey={selectedBoxGroup}
                    onSelectedKeyChange={onBoxGroupChange}
                    emptyMessage="No groups match"
                  />
                  <S.AddFilterButton
                    type="button"
                    onClick={onClearBoxGroup}
                    disabled={!selectedBoxGroup}
                  >
                    Clear
                  </S.AddFilterButton>
                </S.FilterRow>
              </S.FilterControl>
            </S.RefinePanel>
          ) : null}
        </>
      ) : null}
    </Surface>
  );
}
