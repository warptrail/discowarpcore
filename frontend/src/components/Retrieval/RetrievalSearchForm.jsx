import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import RetrievalModeToggle from './RetrievalModeToggle';
import RetrievalSearchBar from './RetrievalSearchBar';
import RetrievalBoxIdPrefixField from './RetrievalBoxIdPrefixField';
import FilterCombobox from './FilterCombobox';
import ActiveFilterChips from './ActiveFilterChips';
import RetrievalSortRail from './RetrievalSortRail';
import RetrievalTagNebula from './RetrievalTagNebula';

const Form = styled.section`
  display: grid;
  gap: 0.42rem;
  padding: 0.48rem;
  border: 1px solid rgba(127, 215, 255, 0.3);
  border-left: 5px solid rgba(76, 198, 193, 0.78);
  border-radius: 2px 8px 2px 2px;
  background:
    linear-gradient(90deg, rgba(76, 198, 193, 0.08), transparent 34%),
    rgba(7, 13, 20, 0.88);

  ${({ $console }) => $console && css`
    gap: 0.3rem;
    padding: 0.24rem;
    border: 0;
    border-radius: 0;
    background: transparent;
  `}
`;

const InlineFormSlot = styled.div`
  min-width: 0;
  min-height: ${({ $reservedHeight }) => `${$reservedHeight || 0}px`};
`;

const InlineFormMeasure = styled.div`
  min-width: 0;
`;

const PrimaryRow = styled.div`
  display: grid;
  grid-template-columns: ${({ $boxMode }) => (
    $boxMode
      ? 'minmax(9rem, auto) 7rem minmax(13rem, 1fr)'
      : 'minmax(9rem, auto) minmax(13rem, 1fr)'
  )};
  gap: 0.36rem;
  align-items: end;
  min-width: 0;

  @media (max-width: 640px) {
    grid-template-columns: ${({ $boxMode }) => (
      $boxMode ? 'minmax(0, 1fr) 7rem' : '1fr'
    )};

    > :last-child {
      grid-column: 1 / -1;
    }
  }
`;

const FacetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count || 4}, minmax(0, 1fr));
  gap: 0.36rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(${({ $boxMode }) => ($boxMode ? 2 : 3)}, minmax(0, 1fr));

    ${({ $boxMode }) => $boxMode && `
      > :nth-child(3),
      > :nth-child(4) {
        grid-column: 1 / -1;
      }
    `}
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Facet = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

const FacetLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 0.78rem;
  gap: 0.25rem;
`;

const FacetLabel = styled.span`
  color: rgba(204, 220, 230, 0.58);
  font: 780 0.57rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const ScopePlaque = styled.div`
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 0.3rem 0.56rem;
  border: 1px solid rgba(167, 182, 255, 0.38);
  border-left: 4px solid rgba(167, 182, 255, 0.82);
  border-radius: 2px 6px 2px 2px;
  color: #dce3ff;
  background: rgba(18, 18, 34, 0.72);
  font: 820 0.64rem/1.1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    monospace;
  letter-spacing: 0.07em;
  text-transform: uppercase;

  @media (max-width: 640px) {
    min-height: 44px;
  }
`;

function SelectField({
  id,
  label,
  placeholder,
  options,
  selectedKey,
  onChange,
  clearInputOnSelect = false,
  variant = 'facet',
  labelAction = null,
}) {
  return (
    <Facet>
      <FacetLabelRow>
        <FacetLabel>{label}</FacetLabel>
        {labelAction}
      </FacetLabelRow>
      <FilterCombobox
        id={id}
        name={id.replace(/-/g, '_')}
        ariaLabel={`${label} filter options`}
        placeholder={placeholder}
        options={options}
        selectedKey={selectedKey}
        onSelectedKeyChange={onChange}
        emptyMessage={`No ${label.toLowerCase()} values match`}
        clearInputOnSelect={clearInputOnSelect}
        variant={variant}
      />
    </Facet>
  );
}

export default function RetrievalSearchForm({
  mode = 'items',
  onModeChange,
  scope = null,
  searchValue = '',
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  boxIdPrefix = '',
  onBoxIdPrefixChange,
  filterOptions = {},
  activeChips = [],
  onCategoryChange,
  onTagChange,
  onTagRemove,
  onLocationChange,
  onOwnerChange,
  onKeepPriorityChange,
  onRemoveChip,
  onClearAll,
  tagOperator = 'or',
  onTagOperatorChange,
  sortOptions = [],
  selectedSort = '',
  onSortChange,
  selectedBoxGroup = '',
  selectedBoxLocation = '',
  selectedBoxTags = [],
  onBoxGroupChange,
  onBoxLocationChange,
  onBoxTagAdd,
  onBoxTagRemove,
  finderMinimized = true,
  onFinderDetachedChange,
}) {
  const [consoleMount, setConsoleMount] = useState(null);
  const [useDesktopConsole, setUseDesktopConsole] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(min-width: 980px)').matches
  ));
  const [mobileDetached, setMobileDetached] = useState(false);
  const [inlineHeight, setInlineHeight] = useState(0);
  const inlineSlotRef = useRef(null);
  const inlineMeasureRef = useRef(null);
  const isBoxMode = mode === 'boxes';
  const hasTagScope = scope?.kind === 'tag' && Boolean(scope?.key);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 980px)');
    const sync = () => {
      setUseDesktopConsole(media.matches);
      setConsoleMount(document.getElementById('retrieval-console-finder-mount'));
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    media.addEventListener?.('change', sync);
    return () => {
      observer.disconnect();
      media.removeEventListener?.('change', sync);
    };
  }, []);

  useLayoutEffect(() => {
    const measuredForm = inlineMeasureRef.current;
    if (!measuredForm || useDesktopConsole) return undefined;

    const syncHeight = () => {
      const measuredHeight = Math.ceil(measuredForm.getBoundingClientRect().height);
      if (measuredHeight > 0) setInlineHeight(measuredHeight);
    };
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(measuredForm);
    return () => observer.disconnect();
  }, [isBoxMode, useDesktopConsole]);

  useEffect(() => {
    if (useDesktopConsole) {
      setMobileDetached(false);
      onFinderDetachedChange?.(false);
      return undefined;
    }

    let animationFrame = 0;
    const syncDetachedState = () => {
      animationFrame = 0;
      const slot = inlineSlotRef.current;
      if (!slot) return;

      const appHeader = document.querySelector('[data-app-header="true"]');
      const headerBottom = appHeader?.getBoundingClientRect().bottom || 0;
      const nextDetached = slot.getBoundingClientRect().bottom <= headerBottom + 1;
      setMobileDetached((current) => (
        current === nextDetached ? current : nextDetached
      ));
      onFinderDetachedChange?.(nextDetached);
    };
    const scheduleSync = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(syncDetachedState);
    };

    syncDetachedState();
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
    };
  }, [onFinderDetachedChange, useDesktopConsole]);

  const formIsInConsole = useDesktopConsole || (
    mobileDetached && !finderMinimized && Boolean(consoleMount)
  );

  const form = (
    <Form
      aria-label={`${isBoxMode ? 'Box' : 'Item'} retrieval controls`}
      $console={formIsInConsole}
    >
      <PrimaryRow $boxMode={isBoxMode}>
        {hasTagScope ? (
          <ScopePlaque>Tag // {scope.label}</ScopePlaque>
        ) : (
          <RetrievalModeToggle mode={mode} onChange={onModeChange} />
        )}

        {isBoxMode ? (
          <RetrievalBoxIdPrefixField
            value={boxIdPrefix}
            onChange={onBoxIdPrefixChange}
          />
        ) : null}

        <RetrievalSearchBar
          id="retrieval-main-search"
          value={searchValue}
          onChange={onSearchChange}
          label={searchLabel}
          placeholder={searchPlaceholder}
          hint=""
        />
      </PrimaryRow>

      <FacetGrid $count={isBoxMode ? 4 : 6} $boxMode={isBoxMode}>
        {isBoxMode ? (
          <>
            <SelectField
              id="retrieval-box-location"
              label="Location"
              placeholder="All locations"
              options={filterOptions.locations}
              selectedKey={selectedBoxLocation}
              onChange={onBoxLocationChange}
            />
            <SelectField
              id="retrieval-box-group"
              label="Group"
              placeholder="All groups"
              options={filterOptions.groups}
              selectedKey={selectedBoxGroup}
              onChange={onBoxGroupChange}
            />
            <Facet>
              <FacetLabelRow>
                <FacetLabel>Tags</FacetLabel>
              </FacetLabelRow>
              <RetrievalTagNebula
                id="retrieval-box-tags"
                options={filterOptions.tags}
                selectedKeys={selectedBoxTags}
                onAdd={onBoxTagAdd}
                onRemove={onBoxTagRemove}
                operator={tagOperator}
                onOperatorChange={onTagOperatorChange}
              />
            </Facet>
          </>
        ) : (
          <>
            <SelectField
              id="retrieval-item-category"
              label="Category"
              placeholder="Any category"
              options={filterOptions.categories}
              onChange={onCategoryChange}
              clearInputOnSelect
            />
            {!hasTagScope ? (
              <Facet>
                <FacetLabelRow>
                  <FacetLabel>Tags</FacetLabel>
                </FacetLabelRow>
                <RetrievalTagNebula
                  id="retrieval-item-tags"
                  options={filterOptions.tags}
                  selectedKeys={activeChips
                    .filter((chip) => chip.type === 'tags')
                    .map((chip) => chip.key)}
                  onAdd={onTagChange}
                  onRemove={onTagRemove}
                  operator={tagOperator}
                  onOperatorChange={onTagOperatorChange}
                />
              </Facet>
            ) : null}
            <SelectField
              id="retrieval-item-location"
              label="Location"
              placeholder="Any location"
              options={filterOptions.locations}
              onChange={onLocationChange}
              clearInputOnSelect
            />
            <SelectField
              id="retrieval-item-owner"
              label="Owner"
              placeholder="Any owner"
              options={filterOptions.owners}
              onChange={onOwnerChange}
              clearInputOnSelect
            />
            <SelectField
              id="retrieval-item-priority"
              label="Keep"
              placeholder="Any priority"
              options={filterOptions.keepPriorities}
              onChange={onKeepPriorityChange}
              clearInputOnSelect
            />
          </>
        )}

        <Facet>
          <FacetLabelRow>
            <FacetLabel>Sort</FacetLabel>
          </FacetLabelRow>
          <RetrievalSortRail
            id={`retrieval-${isBoxMode ? 'box' : 'item'}-sort`}
            sortOptions={sortOptions}
            selectedSort={selectedSort}
            onSortChange={onSortChange}
          />
        </Facet>
      </FacetGrid>

      {!isBoxMode ? (
        <ActiveFilterChips
          chips={activeChips.filter((chip) => chip.type !== 'tags')}
          onRemove={onRemoveChip}
          onClearAll={onClearAll}
        />
      ) : null}
    </Form>
  );

  if (useDesktopConsole && consoleMount) {
    return createPortal(form, consoleMount);
  }

  return (
    <>
      <InlineFormSlot
        ref={inlineSlotRef}
        data-retrieval-form-slot="true"
        $reservedHeight={mobileDetached ? inlineHeight : 0}
      >
        {!mobileDetached ? (
          <InlineFormMeasure ref={inlineMeasureRef}>
            {form}
          </InlineFormMeasure>
        ) : null}
      </InlineFormSlot>
      {mobileDetached && !finderMinimized && consoleMount
        ? createPortal(form, consoleMount)
        : null}
    </>
  );
}
