import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';

const Panel = styled.section`
  border-top: 1px solid rgba(105, 179, 174, 0.34);
  background: transparent;
  padding-top: 0.7rem;
  display: grid;
  gap: 0.54rem;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 40px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a6c4cf;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const CloseButton = styled.button`
  min-height: 40px;
  border-radius: 4px;
  border: 0;
  background: transparent;
  color: #d3e8f1;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.6rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }
`;

const OrphanedDestinationButton = styled.button`
  width: 100%;
  min-height: 44px;
  border: 1px solid rgba(var(--box-primary-rgb), ${({ $active }) => ($active ? '0.72' : '0.34')});
  border-radius: 5px;
  background:
    linear-gradient(
      90deg,
      rgba(var(--box-primary-rgb), ${({ $active }) => ($active ? '0.18' : '0.07')}) 0%,
      rgba(9, 17, 23, 0) 54%
    ),
    rgba(9, 17, 23, 0.62);
  color: #d5e8ef;
  padding: 0.42rem 0.62rem;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? 'inset 3px 0 0 rgba(var(--box-neon-rgb), 0.8)' : 'none'};

  &:hover {
    border-color: rgba(var(--box-neon-rgb), 0.72);
    background:
      linear-gradient(90deg, rgba(var(--box-primary-rgb), 0.2) 0%, rgba(9, 17, 23, 0) 58%),
      rgba(9, 17, 23, 0.72);
  }

  &:focus-visible {
    outline: 2px solid var(--box-neon);
    outline-offset: 2px;
  }
`;

const OrphanedDestinationLabel = styled.span`
  color: ${({ $active }) => ($active ? 'var(--box-neon)' : '#bfd2db')};
  font-size: 0.74rem;
  font-weight: 760;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const OrphanedDestinationHint = styled.span`
  color: rgba(var(--box-secondary-rgb), 0.76);
  font-size: 0.72rem;
  text-align: right;
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
  font-size: 0.68rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9fc1cd;
`;

const Input = styled.input`
  width: 100%;
  min-height: 44px;
  border-radius: 5px;
  border: 1px solid rgba(90, 138, 152, 0.5);
  background: rgba(9, 17, 22, 0.95);
  color: #e8f1f6;
  font-size: 0.9rem;
  padding: 0 0.7rem;

  &:focus {
    outline: none;
    border-color: rgba(131, 208, 185, 0.92);
    box-shadow: 0 0 0 2px rgba(82, 196, 159, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Select = styled.select`
  width: 100%;
  min-height: 44px;
  border-radius: 5px;
  border: 1px solid rgba(90, 138, 152, 0.5);
  background: rgba(9, 17, 22, 0.95);
  color: #e8f1f6;
  font-size: 0.9rem;
  padding: 0 0.7rem;

  &:focus {
    outline: none;
    border-color: rgba(131, 208, 185, 0.92);
    box-shadow: 0 0 0 2px rgba(82, 196, 159, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 40px;
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Results = styled.div`
  display: grid;
  gap: 0;
  max-height: min(360px, 44vh);
  border-top: 1px solid rgba(76, 128, 143, 0.32);
  border-bottom: 1px solid rgba(76, 128, 143, 0.32);
  overflow-y: auto;
  padding-right: 0.18rem;
  overscroll-behavior: contain;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: min(380px, 46vh);
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
  border: 1px solid rgba(123, 162, 177, 0.42);
  background: transparent;
  color: #d3e8f1;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
`;

const ResultButton = styled.button`
  width: 100%;
  min-height: 62px;
  border: 0;
  border-bottom: 1px solid rgba(var(--box-primary-rgb), 0.24);
  border-left: 3px solid rgba(var(--box-primary-rgb), 0.78);
  background:
    linear-gradient(
      90deg,
      rgba(var(--box-primary-rgb), ${({ $active }) => ($active ? '0.18' : '0.07')}) 0%,
      rgba(9, 17, 23, 0) 42%
    );
  color: #e5f2f6;
  padding: 0.42rem 0.18rem;
  text-align: left;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 0.5rem;
  align-items: start;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? 'inset 0 0 0 1px rgba(var(--box-neon-rgb), 0.56)' : 'none'};

  &:hover {
    background:
      linear-gradient(
        90deg,
        rgba(var(--box-primary-rgb), 0.18) 0%,
        rgba(9, 17, 23, 0) 48%
      );
  }

  &:focus-visible {
    outline: 2px solid var(--box-neon);
    outline-offset: -2px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 64px;
  }
`;

const Thumb = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 5px;
  border: 1px solid rgba(var(--box-primary-rgb), 0.62);
  overflow: hidden;
  background: rgba(9, 17, 23, 0.95);
  display: grid;
  place-items: center;
  color: var(--box-muted);
  font-size: 0.66rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  align-self: start;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const Identity = styled.div`
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 0.16rem;
`;

const Name = styled.div`
  font-size: 0.9rem;
  color: #edf8ff;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow-wrap: anywhere;
`;

const ShortId = styled.div`
  color: var(--box-neon);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.15;
  text-shadow: 0 0 8px rgba(var(--box-neon-rgb), 0.22);
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
    box?.group,
    box?.location?.name,
    box?.locationName,
    box?.location,
    ...tags,
  ]
    .map(normalize)
    .filter(Boolean)
    .join(' ');
}

function getBoxImageUrl(box) {
  return (
    box?.image?.thumb?.url ||
    box?.image?.display?.url ||
    box?.image?.original?.url ||
    box?.image?.url ||
    box?.imagePath ||
    ''
  );
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
}) {
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
        box?.location?.name || box?.locationName || box?.location,
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

      <OrphanedDestinationButton
        type="button"
        $active={!selectedBoxId}
        aria-pressed={!selectedBoxId}
        onClick={() => onSelectBox?.('')}
      >
        <OrphanedDestinationLabel $active={!selectedBoxId}>
          No box · orphaned
        </OrphanedDestinationLabel>
        <OrphanedDestinationHint>
          {selectedBoxId ? 'Clear current target' : 'Current destination'}
        </OrphanedDestinationHint>
      </OrphanedDestinationButton>

      <FilterGrid $showFacets={showFacets}>
        <Field>
          <Label htmlFor="intake-box-search">Search</Label>
          <Input
            id="intake-box-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Name, box #, group, location, tag"
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
          <PageSummary>
            Showing {pageStart + 1}-{pageEnd} of {filteredBoxes.length} boxes
            {pageCount > 1 ? ` · page ${safePageIndex + 1} of ${pageCount}` : ''}
          </PageSummary>
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
                  {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : 'No Img'}
                </Thumb>

                <Identity>
                  <Name>{box?.label || 'Unnamed Box'}</Name>
                  <ShortId>#{box?.box_id || '---'}</ShortId>
                </Identity>
              </ResultButton>
            );
          })
        )}
      </Results>
    </Panel>
  );
}
