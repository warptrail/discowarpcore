import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { getBoxColorTones } from '../Retrieval/boxColors';
import { hexToRgbString } from '../../util/inventoryColorTheme';
import IntakeActivityFiltersSheet from './IntakeActivityFiltersSheet';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';

const BATCH_ACCENTS = [
  '#67D9D3',
  '#E8B15C',
  '#A7B6FF',
  '#F08A7B',
  '#9BE564',
  '#7FD7FF',
  '#E056FD',
  '#4D96FF',
];

const activitySelectionPulse = keyframes`
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 0.9;
  }
`;

function getBatchAccentRgb(index) {
  return hexToRgbString(BATCH_ACCENTS[index % BATCH_ACCENTS.length]);
}

const Panel = styled.section`
  border: 1px solid rgba(93, 131, 162, 0.45);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(13, 19, 29, 0.93) 0%, rgba(10, 15, 22, 0.96) 100%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.52rem 0.66rem;
  border-bottom: 1px solid rgba(76, 106, 132, 0.4);
  background: linear-gradient(90deg, rgba(96, 139, 180, 0.2) 0%, rgba(96, 139, 180, 0) 55%);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d8e6f4;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const Counter = styled.span`
  color: #9db2c7;
  font-size: 0.73rem;
`;

const FilterLauncher = styled.div`
  min-height: 48px;
  padding: 0.36rem 0.5rem;
  border-bottom: 1px solid rgba(76, 106, 132, 0.32);
  background: rgba(10, 16, 24, 0.72);
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: stretch;
  min-height: 40px;
  border: 1px solid rgba(86, 142, 157, 0.4);
  border-radius: 5px;
  background: rgba(9, 15, 23, 0.46);
  overflow: hidden;
`;

const FilterButton = styled.button`
  flex: 1;
  min-width: 0;
  min-height: 40px;
  padding: 0.38rem 0.5rem;
  border: 0;
  background: transparent;
  color: #d8e6f4;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.34rem;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #a78bfa;
    outline-offset: 2px;
  }
`;

const SearchButton = styled.button`
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  min-height: 40px;
  place-items: center;
  border: 0;
  border-left: 1px solid rgba(86, 142, 157, 0.38);
  background: transparent;
  color: #8adfd7;
  cursor: pointer;
  font: inherit;
  font-size: 1.2rem;
  line-height: 1;

  &:hover {
    color: #d8fffa;
    background: rgba(81, 186, 173, 0.1);
  }

  &:focus-visible {
    outline: 2px solid #a78bfa;
    outline-offset: -2px;
  }
`;

const SearchField = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  align-items: center;
  width: 100%;
  min-height: 40px;
`;

const SearchInput = styled.input`
  min-width: 0;
  height: 38px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #e7faf7;
  font: inherit;
  font-size: 0.82rem;

  &::placeholder {
    color: #74908f;
  }
`;

const SearchCloseButton = styled.button`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-left: 1px solid rgba(86, 142, 157, 0.38);
  background: transparent;
  color: #86a8aa;
  cursor: pointer;
  font: inherit;
  font-size: 1rem;

  &:hover { color: #d8fffa; }
  &:focus-visible { outline: 2px solid #a78bfa; outline-offset: -2px; }
`;

const FilterSummary = styled.span`
  min-width: 0;
  color: ${({ $active }) => ($active ? '#d6fffa' : '#91a9be')};
  font-size: 0.7rem;
  overflow: hidden;
  font-weight: ${({ $active }) => ($active ? 760 : 680)};
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FilterChevron = styled.span`
  color: #83d8d0;
  font-size: 0.9rem;
  line-height: 1;
`;

const Body = styled.div`
  padding: 0.5rem;
  display: grid;
  gap: 0.34rem;
  max-height: min(48vh, 360px);
  overflow: auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: none;
    overflow: visible;
  }
`;

const Row = styled.div`
  position: relative;
  --activity-accent-rgb: ${({ $accentRgb }) => $accentRgb || '119, 213, 255'};
  border: 1px solid rgba(79, 105, 136, 0.46);
  border-radius: 9px;
  padding: 0.32rem 0.38rem;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: start;
  gap: 0.42rem;
  background: rgba(13, 20, 31, 0.87);
  background:
    linear-gradient(90deg, rgba(var(--activity-accent-rgb), 0.2) 0%, rgba(13, 20, 31, 0.87) 38%),
    rgba(13, 20, 31, 0.87);
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  border-color: ${({ $active, $accentRgb, $clickable }) =>
    $active
      ? `rgba(${$accentRgb || '119, 213, 255'}, 0.88)`
      : $accentRgb
        ? `rgba(${$accentRgb}, 0.58)`
        : $clickable
          ? 'rgba(94, 126, 158, 0.5)'
          : 'rgba(79, 105, 136, 0.4)'};
  box-shadow: ${({ $active, $accentRgb }) =>
    $active
      ? `inset 4px 0 0 rgb(${$accentRgb || '119, 213, 255'}), 0 0 0 1px rgba(${$accentRgb || '119, 213, 255'}, 0.22)`
      : $accentRgb
        ? `inset 3px 0 0 rgb(${$accentRgb})`
        : 'none'};
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;

  &::after {
    content: '';
    position: absolute;
    z-index: 0;
    inset: -1px;
    border: 1px solid rgba(var(--activity-accent-rgb), 0.9);
    border-radius: 9px;
    box-shadow: 0 0 13px rgba(var(--activity-accent-rgb), 0.36);
    opacity: 0;
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  ${({ $active }) =>
    $active &&
    css`
      &::after {
        animation: ${activitySelectionPulse} 2.8s ease-in-out infinite;
      }
    `}

  &:hover {
    ${({ $clickable }) => ($clickable ? 'filter: brightness(1.07);' : '')}
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::after {
      animation: none;
      opacity: ${({ $active }) => ($active ? 0.56 : 0)};
    }
  }
`;

const Thumb = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 7px;
  border: 1px solid rgba(88, 129, 173, 0.5);
  overflow: hidden;
  background: ${({ $missing }) =>
    $missing
      ? `
        linear-gradient(
          135deg,
          transparent 46%,
          rgba(128, 205, 218, 0.34) 47%,
          rgba(128, 205, 218, 0.34) 53%,
          transparent 54%
        ),
        rgba(12, 19, 30, 0.94)
      `
      : 'rgba(12, 19, 30, 0.94)'};
  display: grid;
  place-items: center;
`;

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RowBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.12rem;
`;

const Primary = styled.div`
  min-width: 0;
  font-size: 0.8rem;
  line-height: 1.24;
  font-weight: 600;
  overflow-wrap: anywhere;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const PrimaryItem = styled.span`
  min-width: 0;
  color: #f0f8ff;
  font-weight: 600;
  overflow-wrap: anywhere;
`;

const PrimaryDestination = styled.span`
  min-width: 0;
  color: ${({ $accentRgb }) => `rgb(${$accentRgb || '197, 217, 238'})`};
  margin-left: 0.24rem;
  overflow-wrap: anywhere;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.08rem 0.28rem;
`;

const MetaToken = styled.span`
  display: inline-block;
  min-width: 0;
  color: #8ea6be;
  font-size: 0.64rem;
  line-height: 1.2;
  white-space: nowrap;

  & + &::before {
    content: '·';
    color: #6f89a3;
    margin-right: 0.28rem;
  }
`;

const ExactTimeToken = styled(MetaToken)`
  color: #94adc7;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.61rem;
`;

const QuantityToken = styled(MetaToken)`
  color: #adc3d9;
  font-weight: 700;
`;

const LocatorToken = styled(MetaToken)`
  color: ${({ $boxNeonRgb }) => `rgba(${$boxNeonRgb || '119, 213, 255'}, 1)`};
  text-shadow: ${({ $boxNeonRgb }) => `0 0 6px rgba(${$boxNeonRgb || '119, 213, 255'}, 0.34)`};
  font-size: 0.69rem;
  line-height: 1;
  font-weight: 820;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

const BatchToken = styled(MetaToken)`
  color: ${({ $accentRgb }) => ($accentRgb ? `rgb(${$accentRgb})` : '#9db2c7')};
  font-size: 0.62rem;
  line-height: 1.2;
  font-weight: 780;
  max-width: 100%;
  overflow-wrap: break-word;
  white-space: normal;
`;

const Arrow = styled.span`
  color: #7f98b0;
  font-weight: 500;
  margin-right: 0.18rem;
`;

const StateText = styled.div`
  color: ${({ $error }) => ($error ? '#efc2c2' : '#95acc3')};
  font-size: 0.78rem;
  padding: 0.12rem 0.08rem;
`;

function getItemTimestamp(item) {
  const createdAt = Date.parse(item?.createdAt || item?.created_at || '');
  if (Number.isFinite(createdAt)) return createdAt;

  const id = String(item?._id || '');
  if (id.length >= 8) {
    const seconds = Number.parseInt(id.slice(0, 8), 16);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }

  return 0;
}

function formatCompactTimestamp(timestamp) {
  if (!timestamp) return 'time unknown';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'time unknown';

  const pad = (value) => String(value).padStart(2, '0');
  return [
    `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${String(date.getFullYear()).slice(-2)}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'unknown';

  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return 'now';
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return `${Math.floor(days / 7)}w`;
}

function getItemDestination(item, boxLookup) {
  const directLabel = String(item?.box?.label || '').trim();
  const directBoxId = String(item?.box?.box_id || '').trim();
  if (directLabel || directBoxId) {
    return {
      label: directLabel || `#${directBoxId}`,
      boxId: directBoxId,
    };
  }

  const mongoRef = String(item?.box?._id || item?.boxId || '').trim();
  if (mongoRef && boxLookup instanceof Map) {
    const box = boxLookup.get(mongoRef);
    const fallbackLabel = String(box?.label || '').trim();
    const fallbackBoxId = String(box?.box_id || '').trim();
    if (fallbackLabel || fallbackBoxId) {
      return {
        label: fallbackLabel || `#${fallbackBoxId}`,
        boxId: fallbackBoxId,
      };
    }
  }

  const breadcrumb = Array.isArray(item?.breadcrumb) ? item.breadcrumb : [];
  const leaf = breadcrumb.length ? breadcrumb[breadcrumb.length - 1] : null;
  const crumbLabel = String(leaf?.label || '').trim();
  const crumbBoxId = String(leaf?.box_id || '').trim();
  if (crumbLabel || crumbBoxId) {
    return {
      label: crumbLabel || `#${crumbBoxId}`,
      boxId: crumbBoxId,
    };
  }

  return {
    label: 'orphaned pool',
    boxId: '',
  };
}

function getItemBatchId(item) {
  return String(item?.sourceBatchId || item?.sourceBatch?.id || '').trim();
}

function getItemBatchLabel(item) {
  const sourceBatch = item?.sourceBatch && typeof item.sourceBatch === 'object'
    ? item.sourceBatch
    : null;
  return (
    String(sourceBatch?.label || '').trim() ||
    String(sourceBatch?.batchName || '').trim() ||
    String(sourceBatch?.batchId || '').trim() ||
    getItemBatchId(item)
  );
}

function getItemImageUrl(item) {
  return (
    item?.image?.thumb?.url ||
    item?.image?.display?.url ||
    ''
  );
}

function matchesActivitySearch(item, query) {
  const terms = String(query || '')
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return true;

  const destination = item?.box && typeof item.box === 'object' ? item.box : {};
  const searchableText = [
    item?.name,
    item?.category,
    item?.description,
    item?.notes,
    item?.boxId,
    destination?.box_id,
    destination?.label,
    ...(Array.isArray(item?.tags) ? item.tags : []),
  ]
    .map((value) => String(value || '').toLocaleLowerCase())
    .join(' ');

  return terms.every((term) => searchableText.includes(term));
}

export default function IntakeRecentActivity({
  items = [],
  boxLookup,
  loading = false,
  error = '',
  onMoveItem,
  selectedItemId = '',
  batchOptions = [],
  selectedBatchIds = [],
  onlyOrphanedItems = false,
  onToggleBatch,
  onToggleOnlyOrphaned,
  onClearFilters,
}) {
  const selectedBatchSet = new Set(
    (Array.isArray(selectedBatchIds) ? selectedBatchIds : [])
      .map((batchId) => String(batchId || '').trim())
      .filter(Boolean),
  );
  const batchToneMap = new Map(
    (Array.isArray(batchOptions) ? batchOptions : []).map((batch, index) => {
      return [String(batch?.id || '').trim(), getBatchAccentRgb(index)];
    }),
  );
  const filtersActive = selectedBatchSet.size > 0 || onlyOrphanedItems;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterTriggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const filterSummary = [
    onlyOrphanedItems ? 'Orphaned' : '',
    selectedBatchSet.size
      ? `${selectedBatchSet.size} batch${selectedBatchSet.size === 1 ? '' : 'es'}`
      : '',
  ].filter(Boolean).join(' · ') || 'All activity';

  const closeFilters = useCallback(() => {
    setFiltersOpen(false);
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => filterTriggerRef.current?.focus());
  }, []);

  const matchingItems = useMemo(
    () => (Array.isArray(items) ? items.filter((item) => matchesActivitySearch(item, searchQuery)) : []),
    [items, searchQuery],
  );

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => filterTriggerRef.current?.focus());
  }, []);

  return (
    <>
      <Panel>
        <Header>
          <Title>Recent Intake Activity</Title>
          <Counter aria-live="polite">{matchingItems.length}</Counter>
        </Header>

        <FilterLauncher>
          <ControlGroup>
            {searchOpen ? (
              <SearchField>
                <SearchInput
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') closeSearch();
                  }}
                  placeholder="Search activity"
                  aria-label="Search intake activity"
                />
                <SearchCloseButton type="button" onClick={closeSearch} aria-label="Close activity search">
                  ×
                </SearchCloseButton>
              </SearchField>
            ) : (
              <>
              <FilterButton
                ref={filterTriggerRef}
                type="button"
                aria-controls="intake-activity-filters"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen(true)}
              >
                <FilterSummary $active={filtersActive}>{filterSummary}</FilterSummary>
                <FilterChevron aria-hidden="true">⌃</FilterChevron>
              </FilterButton>
              <SearchButton type="button" onClick={() => setSearchOpen(true)} aria-label="Search intake activity">
                <span aria-hidden="true">⌕</span>
              </SearchButton>
              </>
            )}
          </ControlGroup>
        </FilterLauncher>

        <Body>
        {loading ? <StateText>Loading recent activity…</StateText> : null}
        {!loading && error ? <StateText $error>{error}</StateText> : null}

        {!loading && !error && matchingItems.length === 0 ? (
          <StateText>
            {searchQuery.trim()
              ? 'No intake activity matches this search.'
              : filtersActive
                ? 'No intake activity matches the active filters.'
                : 'No recent intake activity yet.'}
          </StateText>
        ) : null}

        {!loading &&
          !error &&
          matchingItems.map((item) => {
            const timestamp = getItemTimestamp(item);
            const destination = getItemDestination(item, boxLookup);
            const itemName = item?.name || 'Unnamed item';
            const quantity = item?.quantity ?? 1;
            const itemId = String(item?._id || '');
            const clickable = !!itemId;
            const isActive = itemId && itemId === String(selectedItemId || '');
            const imageUrl = getItemImageUrl(item);
            const boxIdLabel = String(destination?.boxId || '').trim();
            const boxToken = boxIdLabel ? `#${boxIdLabel}` : '';
            const boxTones = getBoxColorTones(boxIdLabel || 0);
            const batchId = getItemBatchId(item);
            const batchLabel = getItemBatchLabel(item);
            const batchRgb = batchId ? batchToneMap.get(batchId) || '' : '';
            const activityAccentRgb = boxTones.primaryRgb || batchRgb;

            return (
              <Row
                key={item?._id || `${item?.name || 'item'}-${timestamp}`}
                $clickable={clickable}
                $active={isActive}
                $accentRgb={activityAccentRgb}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={() => {
                  if (!clickable) return;
                  onMoveItem?.(itemId);
                }}
                onKeyDown={(event) => {
                  if (!clickable) return;
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  onMoveItem?.(itemId);
                }}
              >
                <Thumb $missing={!imageUrl} aria-hidden={!imageUrl}>
                  {imageUrl ? <ThumbImage src={imageUrl} alt="" /> : null}
                </Thumb>

                <RowBody>
                  <Primary>
                    <PrimaryItem>{itemName}</PrimaryItem>
                    <PrimaryDestination $accentRgb={activityAccentRgb}>
                      <Arrow>→</Arrow>
                      <span>{destination.label}</span>
                    </PrimaryDestination>
                  </Primary>
                  <Meta>
                    <MetaToken>{formatRelativeTime(timestamp)}</MetaToken>
                    <ExactTimeToken>{formatCompactTimestamp(timestamp)}</ExactTimeToken>
                    <QuantityToken>×{quantity}</QuantityToken>
                    {boxToken ? (
                      <LocatorToken $boxNeonRgb={boxTones.neonRgb}>
                        {boxToken}
                      </LocatorToken>
                    ) : null}
                    {batchLabel ? (
                      <BatchToken $accentRgb={activityAccentRgb}>
                        {batchLabel}
                      </BatchToken>
                    ) : null}
                  </Meta>
                </RowBody>
              </Row>
            );
          })}
        </Body>
      </Panel>

      <IntakeActivityFiltersSheet
        open={filtersOpen}
        batchOptions={batchOptions}
        batchToneMap={batchToneMap}
        selectedBatchIds={selectedBatchIds}
        onlyOrphanedItems={onlyOrphanedItems}
        onToggleBatch={onToggleBatch}
        onToggleOnlyOrphaned={onToggleOnlyOrphaned}
        onClearFilters={onClearFilters}
        onClose={closeFilters}
      />
    </>
  );
}
