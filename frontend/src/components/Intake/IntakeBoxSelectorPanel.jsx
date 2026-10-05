import { panelStyles, controlStyles, inputStyles } from '../../styles/primitives';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ToastContext } from '../Toast';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import { getBoxThumbnailUrl } from '../../util/itemImage';

const Panel = styled.section`
  border-top: 1px solid var(--dw-border);
  background: var(--dw-surface);
  padding-top: 0.3rem;
  display: grid;
  gap: 0.4rem;

  ${panelStyles}
  border-left: 3px solid var(--dw-amber);
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
  min-height: 40px;
  border-radius: 4px;
  border: 0;
  background: transparent;
  color: #cdbdff;
  font-size: 0.72rem;
  text-transform: none;
  letter-spacing: 0.01em;
  padding: 0 0.6rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  ${controlStyles}
`;

const OrphanedDestinationButton = styled.button`
  width: 100%;
  min-height: 38px;
  border: 1px solid ${({ $active }) => $active ? 'rgba(159, 132, 255, 0.72)' : 'rgba(122, 153, 193, 0.34)'};
  border-left: 4px solid ${({ $active }) => $active ? '#a977ff' : 'rgba(122, 153, 193, 0.55)'};
  border-radius: var(--dw-radius-sm);
  background:
    linear-gradient(
      90deg,
      rgba(112, 75, 209, ${({ $active }) => ($active ? '0.2' : '0.06')}) 0%,
      rgba(9, 17, 23, 0) 70%
    ),
    rgba(9, 17, 30, 0.78);
  color: #d5e8ef;
  padding: 0.28rem 0.55rem;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  box-shadow: ${({ $active }) => $active ? '0 0 0 1px rgba(159, 132, 255, 0.1)' : 'none'};

  &:hover {
    border-color: rgba(177, 157, 255, 0.78);
    background:
      var(--dw-surface);
  }

  &:focus-visible {
    outline: 2px solid var(--box-neon);
    outline-offset: 2px;
  }

  ${controlStyles}
  border-left-color: var(--box-primary, #8A8175);
  border-left-width: 3px;
`;

const OrphanedDestinationLabel = styled.span`
  color: ${({ $active }) => ($active ? '#e1d5ff' : '#bfd2db')};
  font-size: 0.8rem;
  font-weight: 760;
  letter-spacing: 0.01em;
  text-transform: none;
`;

const OrphanedDestinationHint = styled.span`
  color: #b9a7e8;
  font-size: 0.75rem;
  text-align: right;
`;

const SelectionCard = styled.div`
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
  min-height: 38px;
  padding: 0.28rem 0.55rem;
  border: 1px solid var(--dw-border);
  border-left: 4px solid var(--box-primary);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: var(--box-neon);
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
  width: 100%;
  min-height: 44px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  border-left: 3px solid #5ad7f5;
  background: var(--dw-surface);
  color: #e8f1f6;
  font-size: 0.9rem;
  padding: 0 0.7rem;

  &:focus {
    outline: none;
    border-color: rgba(131, 208, 235, 0.92);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
    font-size: ${MOBILE_FONT_SM};
  }

  ${inputStyles}
`;

const Select = styled.select`
  width: 100%;
  min-height: 44px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface);
  color: #e8f1f6;
  font-size: 0.9rem;
  padding: 0 0.7rem;

  &:focus {
    outline: none;
    border-color: rgba(131, 208, 185, 0.92);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
    font-size: ${MOBILE_FONT_SM};
  }

  ${inputStyles}
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
  min-height: 40px;
  border-radius: 4px;
  border: 1px solid var(--dw-border);
  background: transparent;
  color: #d3e8f1;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  padding: 0 0.55rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
    flex: 1;
  }

  ${controlStyles}
`;

const ResultButton = styled.button`
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--dw-border);
  border-left: 4px solid var(--box-primary);
  border-radius: var(--dw-radius-sm);
  background:
    linear-gradient(
      90deg,
      rgba(var(--box-primary-rgb), ${({ $active }) => ($active ? '0.2' : '0.1')}) 0%,
      rgba(9, 17, 23, 0.9) 65%
    );
  color: #e5f2f6;
  padding: 0.24rem 0.45rem;
  text-align: left;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 1rem;
  gap: 0.5rem;
  align-items: center;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? 'inset 0 0 0 1px rgba(var(--box-neon-rgb), 0.42)' : '0 4px 12px rgba(0, 0, 0, 0.12)'};

  &:hover {
    background:
      var(--dw-surface);
  }

  &:focus-visible {
    outline: 2px solid var(--box-neon);
    outline-offset: -2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 48px;
  }

  ${controlStyles}
  border-left-color: var(--box-primary, #8A8175);
  border-left-width: 3px;
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
  font-size: 0.9rem;
  color: #e7ecff;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow-wrap: anywhere;
`;

const ShortId = styled.div`
  color: var(--box-neon);
  font-family: var(--dw-font-ui);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  line-height: 1.15;
  text-shadow: none;
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
