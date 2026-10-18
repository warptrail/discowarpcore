import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import RetrievalSearchBar from './RetrievalSearchBar';
import RetrievalBoxIdPrefixField from './RetrievalBoxIdPrefixField';
import RetrievalControlPanel from './RetrievalControlPanel';
import RetrievalFinderPresence from './RetrievalFinderPresence';
import useRetrievalFinderDock from './useRetrievalFinderDock';
import { RETRIEVAL_MODE_COLORS } from '../../styles/tokens';

const Form = styled.section`
  --retrieval-mode-accent: ${({ $mode }) => RETRIEVAL_MODE_COLORS[$mode] || RETRIEVAL_MODE_COLORS.items};
  display: grid;
  gap: 0.42rem;
  padding: 0.48rem;
  border: 1px solid rgba(127, 215, 255, 0.3);
  border-left: 5px solid rgba(76, 198, 193, 0.78);
  border-radius: var(--dw-radius-sm);
  background:
    var(--dw-surface);

  ${({ $console }) => $console && css`
    gap: 0.3rem;
    padding: 0.24rem;
    border: 0;
    border-radius: 0;
    background: transparent;
  `}
  border-left-color: var(--retrieval-mode-accent);
  min-width: 0;
`;

const InlineFormSlot = styled.div`
  display: ${({ $console }) => $console ? 'none' : 'block'};
  min-width: 0;
`;

const InlineFormMeasure = styled.div`
  min-width: 0;
`;

const PrimaryRow = styled.div`
  --retrieval-mode-accent: ${({ $mode }) => RETRIEVAL_MODE_COLORS[$mode] || RETRIEVAL_MODE_COLORS.items};
  display: grid;
  grid-template-columns: ${({ $boxMode }) => (
    $boxMode
      ? 'minmax(0, 1fr) 7rem'
      : 'minmax(0, 1fr)'
  )};
  gap: 0.36rem;
  align-items: end;
  min-width: 0;

  @media (max-width: 640px) {
    grid-template-columns: ${({ $boxMode }) => (
      $boxMode ? 'minmax(0, 1fr) 7rem' : '1fr'
    )};

  }
`;

export default function RetrievalSearchForm({
  mode = 'items', scope, searchValue, onSearchChange, searchLabel, searchPlaceholder,
  boxIdPrefix, onBoxIdPrefixChange, onBoxAddressActivate, filterOptions, activeChips, onCategoryChange,
  onTagChange, onTagRemove, onLocationSelectionChange, onOwnerChange, onKeepPriorityChange,
  onRemoveChip, onClearAll, tagOperator, onTagOperatorChange, sortOptions, selectedSort,
  onSortChange, selectedBoxRooms, selectedBoxLocations, selectedBoxTags, onBoxRoomsChange,
  onBoxLocationsChange, onBoxTagAdd, onBoxTagRemove, onReshuffle, shuffled, loading,
  finderMinimized, onFinderDetachedChange, desktop,
}) {
  const isBoxMode = mode === 'boxes';
  const hasTagScope = scope?.kind === 'tag' && Boolean(scope?.key);
  const { portalTarget, inlineMeasureRef, formIsInConsole, searchPortalTarget, searchInlineRef, searchIsInConsole } =
    useRetrievalFinderDock({ onFinderDetachedChange, desktop });

  const search = <RetrievalFinderPresence id="retrieval-search-panel" visible={!searchIsInConsole || !finderMinimized}>
    <PrimaryRow $boxMode={true} $mode={mode}>
      <RetrievalSearchBar id="retrieval-main-search" value={searchValue} onChange={onSearchChange}
        label={searchLabel} placeholder={searchPlaceholder} hint="" />
      <RetrievalBoxIdPrefixField value={boxIdPrefix} onChange={onBoxIdPrefixChange} onActivate={onBoxAddressActivate} />
    </PrimaryRow>
  </RetrievalFinderPresence>;

  const form = (
    <Form
      aria-label={`${isBoxMode ? 'Box' : 'Item'} retrieval controls`}
      $console={formIsInConsole}
      $mode={mode}
    >
      <InlineFormSlot $console={searchIsInConsole}>
        <InlineFormMeasure ref={searchInlineRef}>{!searchPortalTarget ? search : null}</InlineFormMeasure>
      </InlineFormSlot>

      <RetrievalControlPanel
        isBoxMode={isBoxMode} hasTagScope={hasTagScope} filterOptions={filterOptions} activeChips={activeChips}
        onCategoryChange={onCategoryChange} onTagChange={onTagChange} onTagRemove={onTagRemove}
        onLocationSelectionChange={onLocationSelectionChange} onOwnerChange={onOwnerChange}
        onKeepPriorityChange={onKeepPriorityChange} onRemoveChip={onRemoveChip} onClearAll={onClearAll}
        tagOperator={tagOperator} onTagOperatorChange={onTagOperatorChange}
        sortOptions={sortOptions} selectedSort={selectedSort} onSortChange={onSortChange}
        selectedBoxRooms={selectedBoxRooms} selectedBoxLocations={selectedBoxLocations} selectedBoxTags={selectedBoxTags}
        onBoxRoomsChange={onBoxRoomsChange} onBoxLocationsChange={onBoxLocationsChange}
        onBoxTagAdd={onBoxTagAdd} onBoxTagRemove={onBoxTagRemove}
        hasSearchFilters={Boolean(searchValue || boxIdPrefix)}
        onReshuffle={onReshuffle} shuffled={shuffled} loading={loading}
        onResetSearch={() => {
          onSearchChange?.('');
          onBoxIdPrefixChange?.('');
        }}
      />
    </Form>
  );
  const panel = <RetrievalFinderPresence visible={!finderMinimized}>{form}</RetrievalFinderPresence>;

  return (
    <>
      <InlineFormSlot
        data-retrieval-form-slot="true"
        $console={formIsInConsole}
      >
        <InlineFormMeasure ref={inlineMeasureRef}>
          {!portalTarget ? panel : null}
        </InlineFormMeasure>
      </InlineFormSlot>
      {portalTarget ? createPortal(panel, portalTarget) : null}
      {searchPortalTarget ? createPortal(search, searchPortalTarget) : null}
    </>
  );
}
