import { panelStyles, controlStyles } from '../../styles/primitives';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { getBoxColorTones } from '../Retrieval/boxColors';
import { hexToRgbString } from '../../util/inventoryColorTheme';
import IntakeActivityFiltersSheet from './IntakeActivityFiltersSheet';
import IntakeRoutingControls from './IntakeRoutingControls';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';
import { getItemThumbnailUrl } from '../../util/itemImage';

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
  min-width: 0;
  background: var(--dw-surface);
  overflow: visible;

  ${panelStyles}
  border-left: 3px solid var(--dw-amber);
`;

const Body = styled.div`
  padding: 0.5rem 0.25rem;
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
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0.32rem 0.38rem;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 72px;
  align-items: center;
  column-gap: 0.55rem;
  min-height: 68px;
  background: var(--dw-surface-raised);
  background:
    var(--dw-surface);
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
    border: 1px solid var(--dw-border);
    border-radius: var(--dw-radius-sm);
    box-shadow: none;
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
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
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
  gap: 0.22rem;
`;

const Primary = styled.div`
  min-width: 0;
  font-size: 0.8rem;
  line-height: 1.24;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const PrimaryItem = styled.span`
  min-width: 0;
  color: #f0f8ff;
  font-weight: 600;
`;

const PrimaryDestination = styled.div`
  min-width: 0;
  color: ${({ $accentRgb }) => `rgb(${$accentRgb || '197, 217, 238'})`};
  font-size: 0.76rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 0.08rem 0.28rem;
  min-width: 0;
  overflow: hidden;
`;

const MetaToken = styled.span`
  display: inline-block;
  min-width: 0;
  color: #8ea6be;
  font-size: 0.75rem;
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
  font-family: var(--dw-font-ui);
  font-size: 0.75rem;
`;

const QuantityToken = styled(MetaToken)`
  color: #adc3d9;
  font-weight: 700;
`;

const LocatorToken = styled.div`
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.26rem;
  align-self: stretch;
  border-left: 1px solid var(--dw-border);
  color: ${({ $boxNeonRgb }) => `rgba(${$boxNeonRgb || '119, 213, 255'}, 1)`};
  text-shadow: ${({ $boxNeonRgb }) => `0 0 6px rgba(${$boxNeonRgb || '119, 213, 255'}, 0.34)`};
  font-family: var(--dw-font-ui);
  font-size: 1.05rem;
  line-height: 1;
  font-weight: 820;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

const LocatorLabel = styled.span`
  color: #8ea6be;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
  text-shadow: none;
`;

const BatchToken = styled(MetaToken)`
  color: ${({ $accentRgb }) => ($accentRgb ? `rgb(${$accentRgb})` : '#9db2c7')};
  font-size: 0.75rem;
  line-height: 1.2;
  font-weight: 780;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

const LoadMoreButton = styled.button`
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: #8adfd7;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 760;
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;

  &:hover { color: #d8fffa; border-color: rgba(138, 223, 215, 0.7); }
  &:focus-visible { outline: 2px solid #a78bfa; outline-offset: 2px; }

  ${controlStyles}
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
  return getItemThumbnailUrl(item);
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

const ATTRIBUTE_OPTIONS = [
  ['all', 'Any attribute'],
  ['name', 'Name'],
  ['category', 'Category'],
  ['tags', 'Tag'],
  ['description', 'Description'],
  ['notes', 'Notes'],
  ['box', 'Current box'],
  ['location', 'Location'],
  ['owner', 'Owner'],
  ['batch', 'Source batch'],
  ['quantity', 'Quantity'],
];

const TEXT_OPERATORS = [
  ['contains', 'contains'],
  ['is', 'is exactly'],
  ['not', 'is not'],
  ['starts', 'starts with'],
];

const NUMBER_OPERATORS = [
  ['is', 'equals'],
  ['at_least', 'at least'],
  ['at_most', 'at most'],
];

function stringifyAttributeValue(value) {
  if (Array.isArray(value)) return value.map(stringifyAttributeValue).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value).map(stringifyAttributeValue).filter(Boolean).join(' ');
  }
  return String(value ?? '').trim();
}

function getAttributeValue(item, attribute) {
  if (attribute === 'name') return item?.name;
  if (attribute === 'category') return item?.category;
  if (attribute === 'tags') return item?.tags;
  if (attribute === 'description') return item?.description;
  if (attribute === 'notes') return item?.notes;
  if (attribute === 'location') return item?.location;
  if (attribute === 'owner') return item?.primaryOwnerName || item?.owner || item?.owners;
  if (attribute === 'batch') return getItemBatchLabel(item);
  if (attribute === 'quantity') return item?.quantity ?? 1;
  if (attribute === 'box') {
    const box = item?.box && typeof item.box === 'object' ? item.box : {};
    return [box?.box_id, box?.label, item?.boxId];
  }

  return [
    item?.name,
    item?.category,
    item?.tags,
    item?.description,
    item?.notes,
    item?.location,
    item?.primaryOwnerName,
    item?.owner,
    item?.box,
    item?.sourceBatch,
    item?.sourceBatchId,
    item?.quantity,
  ];
}

function matchesAttributeFilter(item, attribute, operator, rawValue) {
  const query = String(rawValue || '').trim().toLocaleLowerCase();
  if (!query) return true;

  if (attribute === 'quantity') {
    const itemNumber = Number(getAttributeValue(item, attribute));
    const queryNumber = Number(rawValue);
    if (!Number.isFinite(itemNumber) || !Number.isFinite(queryNumber)) return false;
    if (operator === 'at_least') return itemNumber >= queryNumber;
    if (operator === 'at_most') return itemNumber <= queryNumber;
    return itemNumber === queryNumber;
  }

  const value = stringifyAttributeValue(getAttributeValue(item, attribute)).toLocaleLowerCase();
  if (operator === 'is') return value === query;
  if (operator === 'not') return value !== query;
  if (operator === 'starts') return value.startsWith(query);
  return value.includes(query);
}

function sortInventoryItems(items, sortMode) {
  return [...items].sort((a, b) => {
    if (sortMode === 'created_asc') return getItemTimestamp(a) - getItemTimestamp(b);
    if (sortMode === 'name_asc') return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' });
    if (sortMode === 'name_desc') return String(b?.name || '').localeCompare(String(a?.name || ''), undefined, { sensitivity: 'base' });
    if (sortMode === 'quantity_desc') return Number(b?.quantity || 1) - Number(a?.quantity || 1);
    return getItemTimestamp(b) - getItemTimestamp(a);
  });
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
  const [attribute, setAttribute] = useState('all');
  const [operator, setOperator] = useState('contains');
  const [attributeValue, setAttributeValue] = useState('');
  const [sortMode, setSortMode] = useState('created_desc');
  const [visibleLimit, setVisibleLimit] = useState(50);
  const filterTriggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const filterSummary = [
    onlyOrphanedItems ? 'Orphaned' : '',
    selectedBatchSet.size
      ? `${selectedBatchSet.size} batch${selectedBatchSet.size === 1 ? '' : 'es'}`
      : '',
  ].filter(Boolean).join(' · ') || 'All inventory';

  const closeFilters = useCallback(() => {
    setFiltersOpen(false);
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => filterTriggerRef.current?.focus());
  }, []);

  const operatorOptions = attribute === 'quantity' ? NUMBER_OPERATORS : TEXT_OPERATORS;
  const attributeSuggestions = useMemo(() => {
    if (attribute === 'all' || attribute === 'quantity') return [];
    return Array.from(new Set(
      (Array.isArray(items) ? items : [])
        .flatMap((item) => {
          const value = getAttributeValue(item, attribute);
          return Array.isArray(value) ? value : [value];
        })
        .map(stringifyAttributeValue)
        .filter(Boolean),
    )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).slice(0, 250);
  }, [attribute, items]);

  const matchingItems = useMemo(() => sortInventoryItems(
    (Array.isArray(items) ? items : []).filter(
      (item) => matchesActivitySearch(item, searchQuery) && matchesAttributeFilter(item, attribute, operator, attributeValue),
    ),
    sortMode,
  ), [attribute, attributeValue, items, operator, searchQuery, sortMode]);
  const visibleItems = matchingItems.slice(0, visibleLimit);

  useEffect(() => {
    setVisibleLimit(50);
  }, [attribute, attributeValue, operator, searchQuery, sortMode]);

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
        <IntakeRoutingControls
          count={matchingItems.length}
          searchOpen={searchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSearchOpen={setSearchOpen}
          closeSearch={closeSearch}
          searchInputRef={searchInputRef}
          filterTriggerRef={filterTriggerRef}
          filtersOpen={filtersOpen}
          openFilters={() => setFiltersOpen(true)}
          filterSummary={filterSummary}
          attribute={attribute}
          attributeOptions={ATTRIBUTE_OPTIONS}
          onAttributeChange={(nextAttribute) => {
            setAttribute(nextAttribute);
            setOperator(nextAttribute === 'quantity' ? 'is' : 'contains');
            setAttributeValue('');
          }}
          operator={operator}
          operatorOptions={operatorOptions}
          setOperator={setOperator}
          attributeValue={attributeValue}
          setAttributeValue={setAttributeValue}
          attributeSuggestions={attributeSuggestions}
          sortMode={sortMode}
          setSortMode={setSortMode}
          onReset={() => {
            setAttribute('all');
            setOperator('contains');
            setAttributeValue('');
            setSearchQuery('');
            setSortMode('created_desc');
          }}
        />

        <Body>
        {loading ? <StateText>Loading inventory…</StateText> : null}
        {!loading && error ? <StateText $error>{error}</StateText> : null}

        {!loading && !error && matchingItems.length === 0 ? (
          <StateText>
            {searchQuery.trim()
              ? 'No inventory items match this search.'
              : attributeValue.trim()
                ? 'No inventory items match this attribute filter.'
              : filtersActive
                ? 'No inventory items match the active scope.'
                : 'No active inventory items found.'}
          </StateText>
        ) : null}

        {!loading &&
          !error &&
          visibleItems.map((item) => {
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
                  <Primary title={itemName}>
                    <PrimaryItem>{itemName}</PrimaryItem>
                  </Primary>
                  <PrimaryDestination $accentRgb={activityAccentRgb} title={destination.label}>
                    <Arrow aria-hidden="true">→</Arrow>
                    <span>{destination.label}</span>
                  </PrimaryDestination>
                  <Meta>
                    <MetaToken>{formatRelativeTime(timestamp)}</MetaToken>
                    <ExactTimeToken>{formatCompactTimestamp(timestamp)}</ExactTimeToken>
                    <QuantityToken>×{quantity}</QuantityToken>
                    {batchLabel ? (
                      <BatchToken $accentRgb={activityAccentRgb} title={batchLabel}>
                        {batchLabel}
                      </BatchToken>
                    ) : null}
                  </Meta>
                </RowBody>
                <LocatorToken $boxNeonRgb={boxTones.neonRgb}>
                  <LocatorLabel>{boxToken ? 'Box' : 'Unboxed'}</LocatorLabel>
                  <span>{boxToken || '—'}</span>
                </LocatorToken>
              </Row>
            );
          })}
        {!loading && !error && visibleItems.length < matchingItems.length ? (
          <LoadMoreButton type="button" onClick={() => setVisibleLimit((current) => current + 50)}>
            Load 50 more // {matchingItems.length - visibleItems.length} remaining
          </LoadMoreButton>
        ) : null}
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
