import { quietSectionStyles, consoleControlStyles, consoleFieldStyles } from './IntakeConsole.styles';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ToastContext } from '../Toast';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import { getBoxThumbnailUrl } from '../../util/itemImage';

const Panel = styled.section`
  ${quietSectionStyles}
  display: grid;
  gap: 12px;
  padding-top: 12px;
  min-width: 0;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 26px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: #c8b8ff;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const CloseButton = styled.button`
  ${consoleControlStyles}
  font-size: .75rem;
`;

const OrphanedDestinationButton = styled.button`
  ${consoleControlStyles}
  width: 100%;
  justify-content: space-between;
  text-align: left;
  border-bottom: 1px solid var(--dw-border);
  padding-inline: 12px;
  ${({ $active }) => $active && 'color: var(--dw-violet); box-shadow: inset 0 -1px var(--dw-violet);'}
`;

const OrphanedDestinationLabel = styled.span`
  font-size: .8rem;
  font-weight: 500;
`;

const OrphanedDestinationHint = styled.span`
  color: #b9a7e8;
  font-size: 0.75rem;
  text-align: right;
`;

const SelectionCard = styled.div`
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 44px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--box-primary);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
`;

const SelectionName = styled.strong`
  overflow: hidden;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SelectionBadge = styled.span`
  color: var(--box-neon);
  font: 800 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: ${({ $showFacets }) =>
    $showFacets ? 'minmax(0, 1.5fr) repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)'};
  gap: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 0.26rem;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: #9fc1cd;
`;

const Input = styled.input`
  ${consoleFieldStyles}
  min-width: 0;
`;

const Select = styled.select`
  ${consoleFieldStyles}
  min-width: 0;
`;

const Results = styled.div`
  display: grid;
  gap: 0.28rem;
  max-height: min(560px, 66vh);
  overflow-y: auto;
  padding: 0.08rem 0.18rem 0.08rem 0;
  overscroll-behavior: contain;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: min(560px, 66vh);
  }
`;

const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.48rem;
  padding: 0.08rem 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const PageSummary = styled.div`
  color: #a7c6d1;
  font-size: 0.72rem;
  line-height: 1.35;
`;

const PageActions = styled.div`
  display: flex;
  gap: 0.34rem;
`;

const PageButton = styled.button`
  ${consoleControlStyles}
  font-size: .75rem;
  flex: 1;
`;

const ResultButton = styled.button`
  ${consoleControlStyles}
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 20px;
  width: 100%;
  min-height: 56px;
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid var(--dw-border-soft);
  border-radius: 0;
  ${({ $active }) => $active && 'background: rgba(var(--box-primary-rgb), .08); box-shadow: inset 0 -1px var(--box-primary);'}
`;

const Thumb = styled.div`
  width: 34px;
  height: 34px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  overflow: hidden;
  background: var(--dw-surface);
  display: grid;
  place-items: center;
  color: var(--box-neon);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
  text-transform: none;
  align-self: start;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ThumbPlaceholder = styled.svg`
  width: 23px;
  height: 23px;
  color: var(--box-neon);
`;

const ResultChevron = styled.span`
  color: var(--box-neon);
  font-size: 1.45rem;
  line-height: 1;
  text-align: center;
`;

const Identity = styled.div`
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 0.16rem;
`;

const Name = styled.div`
  font-size: .85rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--dw-text);
  overflow-wrap: anywhere;
`;

const ShortId = styled.div`
  color: var(--box-primary);
  font: 500 .75rem/1.3 var(--dw-font-data);
`;

const EmptyState = styled.div`
  padding: 0.68rem 0.12rem;
  color: #9fc2ce;
  font-size: 0.75rem;
`;

const BOXES_PER_PAGE = 50;

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getSearchTerms(value) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function getBoxSearchText(box) {
  const tags = Array.isArray(box?.tags) ? box.tags : [];
  return [
    box?.label,
    box?.description,
    box?.notes,
    box?.locationName,
    box?.location,
    ...tags,
  ]
    .map(normalize)
    .filter(Boolean)
    .join(' ');
}

function getBoxImageUrl(box) {
  return getBoxThumbnailUrl(box);
}

function getUniqueValues(list, mapValue) {
  const values = new Set();
  for (const entry of list) {
    const next = mapValue(entry);
    if (!next) continue;
    values.add(String(next).trim());
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export default function IntakeBoxSelectorPanel({
  boxes = [],
  selectedBoxId = '',
  onSelectBox,
  onClose,
  title = 'Select Intake Box',
  showClose = true,
  showFacets = true,
  showResultCountInToast = false,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const resultsRef = useRef(null);

  const locationOptions = useMemo(
    () => getUniqueValues(boxes, (box) => box?.location),
    [boxes],
  );

  const tagOptions = useMemo(() => {
    const values = new Set();
    for (const box of boxes) {
      const tags = Array.isArray(box?.tags) ? box.tags : [];
      for (const tag of tags) {
        const normalized = String(tag || '').trim();
        if (normalized) values.add(normalized);
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [boxes]);

  const filteredBoxes = useMemo(() => {
    const search = normalize(searchTerm);
    const searchTerms = getSearchTerms(search);
    const location = normalize(locationFilter);
    const tag = normalize(tagFilter);
    const numericPrefix = /^\d{1,3}/.exec(search)?.[0] || '';
    const prioritizesBoxId = numericPrefix.length > 0;

    return boxes
      .map((box, index) => {
      const boxId = normalize(box?.box_id);
      const boxLocation = normalize(
        box?.locationName || box?.location,
      );
      const tags = Array.isArray(box?.tags) ? box.tags.map(normalize) : [];
      const searchableText = getBoxSearchText(box);
      const matchesShortId = prioritizesBoxId && boxId.startsWith(numericPrefix);
      const matchesFuzzySearch =
        !searchTerms.length ||
        searchTerms.every((term) => searchableText.includes(term));

      if (search && !matchesShortId && !matchesFuzzySearch) return null;

      if (location && boxLocation !== location) return null;
      if (tag && !tags.includes(tag)) return null;

      return {
        box,
        index,
        rank: matchesShortId ? 0 : 1,
      };
    })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map(({ box }) => box);
  }, [boxes, locationFilter, searchTerm, tagFilter]);

  useEffect(() => {
    setPageIndex(0);
  }, [locationFilter, searchTerm, tagFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredBoxes.length / BOXES_PER_PAGE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageStart = safePageIndex * BOXES_PER_PAGE;
  const pageEnd = Math.min(pageStart + BOXES_PER_PAGE, filteredBoxes.length);
  const pagedBoxes = filteredBoxes.slice(pageStart, pageEnd);
  const selectedBox = boxes.find((box) => String(box?._id || '') === String(selectedBoxId || ''));

  useEffect(() => {
    if (!showResultCountInToast) return undefined;
    const summary = filteredBoxes.length
      ? `Showing ${pageStart + 1}-${pageEnd} of ${filteredBoxes.length} boxes${pageCount > 1 ? ` · page ${safePageIndex + 1} of ${pageCount}` : ''}`
      : 'No boxes match your search.';
    showToast?.({
      id: 'intake-box-selector-count',
      title: 'Choose a box',
      message: summary,
      variant: 'info',
      sticky: true,
      dismissible: false,
    });
    return () => hideToast?.('intake-box-selector-count');
  }, [showResultCountInToast, filteredBoxes.length, pageStart, pageEnd, pageCount, safePageIndex, showToast, hideToast]);

  useEffect(() => {
    if (pageIndex === safePageIndex) return;
    setPageIndex(safePageIndex);
  }, [pageIndex, safePageIndex]);

  useEffect(() => {
    resultsRef.current?.scrollTo({ top: 0 });
  }, [safePageIndex, searchTerm, locationFilter, tagFilter]);

  return (
    <Panel>
      <Header>
        <Title>{title}</Title>
        {showClose ? (
          <CloseButton type="button" onClick={onClose}>
            Close
          </CloseButton>
        ) : null}
      </Header>

      {selectedBox ? (
        <SelectionCard style={getBoxThemeCssVars(getBoxTheme(selectedBox.box_id))}>
          <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M16 3 27 9v14l-11 6L5 23V9L16 3Z" />
            <path d="m5 9 11 6 11-6M16 15v14" />
          </svg>
          <SelectionName>{selectedBox.label || 'Unnamed box'} · #{selectedBox.box_id || '---'}</SelectionName>
          <SelectionBadge>Current</SelectionBadge>
        </SelectionCard>
      ) : null}

      <OrphanedDestinationButton
        style={getBoxThemeCssVars(getBoxTheme(null, { kind: 'orphaned' }))}
        type="button"
        $active={!selectedBoxId}
        aria-pressed={!selectedBoxId}
        onClick={() => onSelectBox?.('')}
      >
        <OrphanedDestinationLabel $active={!selectedBoxId}>
          ◇ {selectedBoxId ? 'Items Adrift · no box' : 'Items Adrift'}
        </OrphanedDestinationLabel>
        <OrphanedDestinationHint>
          {selectedBoxId ? 'Choose this instead' : 'Current'}
        </OrphanedDestinationHint>
      </OrphanedDestinationButton>

      <FilterGrid $showFacets={showFacets}>
        <Field>
          <Input
            id="intake-box-search"
            aria-label="Search boxes"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search boxes…"
          />
        </Field>

        {showFacets ? (
          <>
            <Field>
              <Label htmlFor="intake-box-location-filter">Location</Label>
              <Select
                id="intake-box-location-filter"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
              >
                <option value="">All locations</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Label htmlFor="intake-box-tag-filter">Tag</Label>
              <Select
                id="intake-box-tag-filter"
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
              >
                <option value="">All tags</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        ) : null}
      </FilterGrid>

      {filteredBoxes.length > 0 ? (
        <PaginationBar>
          {!showResultCountInToast ? <PageSummary>
            Showing {pageStart + 1}-{pageEnd} of {filteredBoxes.length} boxes
            {pageCount > 1 ? ` · page ${safePageIndex + 1} of ${pageCount}` : ''}
          </PageSummary> : null}
          {pageCount > 1 ? (
            <PageActions>
              <PageButton
                type="button"
                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                disabled={safePageIndex === 0}
              >
                Prev
              </PageButton>
              <PageButton
                type="button"
                onClick={() =>
                  setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))
                }
                disabled={safePageIndex >= pageCount - 1}
              >
                Next
              </PageButton>
            </PageActions>
          ) : null}
        </PaginationBar>
      ) : null}

      <Results ref={resultsRef}>
        {filteredBoxes.length === 0 ? (
          <EmptyState>No boxes match your filters.</EmptyState>
        ) : (
          pagedBoxes.map((box) => {
            const key = String(box?._id || '');
            const imageUrl = getBoxImageUrl(box);
            const boxTheme = getBoxTheme(box?.box_id);

            return (
              <ResultButton
                key={key || `${box?.box_id || 'box'}-${box?.label || 'unnamed'}`}
                type="button"
                $active={key === String(selectedBoxId || '')}
                style={getBoxThemeCssVars(boxTheme)}
                onClick={() => onSelectBox?.(key)}
              >
                <Thumb>
                  {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : (
                    <ThumbPlaceholder viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path d="M3 3h18v18H3zM3 11h18M8 7h8M8 15h8" />
                    </ThumbPlaceholder>
                  )}
                </Thumb>

                <Identity>
                  <Name>{box?.label || 'Unnamed Box'}</Name>
                  <ShortId>#{box?.box_id || '---'}</ShortId>
                </Identity>
                <ResultChevron aria-hidden="true">›</ResultChevron>
              </ResultButton>
            );
          })
        )}
      </Results>
    </Panel>
  );
}
