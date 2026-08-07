import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import BoxIdPrefixInput from './BoxIdPrefixInput';
import { fetchItemMoveLogs } from '../api/logs';
import {
  MOBILE_BREAKPOINT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_NARROW_BREAKPOINT,
} from '../styles/tokens';
import {
  compareNumericBoxIds,
  matchesBoxIdPrefix,
  normalizeBoxId,
} from '../util/boxLocator';
import { DECLUTTER_BOX_PURPOSE_LABELS } from '../util/declutterBoxPurpose';

const MAX_PREFIX_LENGTH = 6;
const RECENT_DEST_LIMIT = 5;

const Container = styled.div`
  padding: 0.35rem 0 0;
  min-width: 0;
`;

const FilterPanel = styled.div`
  display: grid;
  gap: 0.24rem;
  margin: 0 0 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 0.68rem;
  font-weight: 780;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #95d8ff;
`;

const FilterInput = styled.input`
  width: 100%;
  border: 1px solid rgba(93, 165, 212, 0.62);
  border-radius: 9px;
  background: linear-gradient(
    180deg,
    rgba(5, 13, 21, 0.98),
    rgba(8, 16, 26, 0.98)
  );
  color: #e6f2ff;
  min-height: 36px;
  padding: 0.46rem 0.62rem;
  font-size: 0.86rem;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(125, 185, 220, 0.08);
  transition:
    border-color 130ms ease,
    box-shadow 130ms ease,
    background 130ms ease;

  &:focus {
    border-color: rgba(122, 208, 255, 0.9);
    box-shadow:
      0 0 0 2px rgba(122, 208, 255, 0.22),
      0 0 14px rgba(122, 208, 255, 0.24);
    background: rgba(16, 28, 42, 0.96);
  }
`;

const SectionHeading = styled.h4`
  margin: 0.58rem 0 0.32rem;
  padding-left: 0.08rem;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9ec8f7;
`;

const BoxList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.36rem;
`;

const BoxItem = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.52rem;
  align-items: center;
  min-height: 40px;
  padding: 0.38rem 0.62rem;
  border: 1px solid #2f3a32;
  border-radius: 8px;
  background: linear-gradient(90deg, #23252a 0%, #1d1f23 62%);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    background: linear-gradient(90deg, #274233 0%, #1f2d26 62%);
    border-color: #4ec77b;
    box-shadow: 0 0 0 1px rgba(78, 199, 123, 0.2);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.36rem;
    min-height: 0;
    padding: 0.34rem 0.46rem;
  }
`;

const OrphanItem = styled(BoxItem)`
  border-color: rgba(225, 160, 100, 0.66);
  background: linear-gradient(
    90deg,
    rgba(62, 50, 33, 0.92) 0%,
    rgba(42, 35, 24, 0.94) 62%
  );

  &:hover {
    background: linear-gradient(
      90deg,
      rgba(82, 61, 34, 0.94) 0%,
      rgba(58, 43, 24, 0.96) 62%
    );
    border-color: rgba(235, 185, 120, 0.84);
    box-shadow: 0 0 0 1px rgba(235, 185, 120, 0.24);
  }
`;

const BoxIdentityLane = styled.span`
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding-left: ${({ $depth = 0 }) =>
    `${Math.min(Math.max($depth, 0), 6) * 0.42}rem`};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding-left: ${({ $depth = 0 }) =>
      `${Math.min(Math.max($depth, 0), 6) * 0.32}rem`};
    gap: 0.32rem;
  }
`;

const BoxIdChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(116, 212, 255, 0.6);
  background: linear-gradient(
    180deg,
    rgba(116, 212, 255, 0.2) 0%,
    rgba(116, 212, 255, 0.1) 100%
  );
  color: #8ce2ff;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

const OrphanIdChip = styled(BoxIdChip)`
  border-color: rgba(238, 184, 120, 0.65);
  background: linear-gradient(
    180deg,
    rgba(238, 184, 120, 0.26) 0%,
    rgba(238, 184, 120, 0.12) 100%
  );
  color: #ffd8a5;
`;

const BoxName = styled.span`
  min-width: 0;
  flex: 1;
  font-size: 0.92rem;
  line-height: 1.2;
  color: #e8edf2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const MetaLane = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    justify-content: flex-start;
    gap: 0.24rem;
  }
`;

const MetaPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 0.44rem;
  border-radius: 999px;
  border: 1px solid #394646;
  background: #1a2122;
  color: #d8e7e7;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  white-space: nowrap;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 20px;
    font-size: ${MOBILE_FONT_XS};
    padding: 0 0.3rem;
  }
`;

const StatusHint = styled(MetaPill)`
  margin-top: 0.44rem;
  width: fit-content;
  border-radius: 2px;
`;

const LevelPill = styled(MetaPill)`
  border-color: #405270;
  background: #182030;
  color: #cfdbf9;

  @media (max-width: ${MOBILE_NARROW_BREAKPOINT}) {
    display: none;
  }
`;

const OrphanPill = styled(MetaPill)`
  border-color: rgba(238, 184, 120, 0.52);
  background: rgba(65, 48, 30, 0.82);
  color: #ffd8a5;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const RecentPill = styled(MetaPill)`
  border-color: rgba(170, 136, 255, 0.62);
  background: rgba(42, 36, 70, 0.86);
  color: #d9ceff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const SuggestedPill = styled(MetaPill)`
  border-radius: 2px;
  border-color: rgba(255, 184, 84, 0.62);
  background: rgba(255, 160, 42, 0.11);
  color: #ffd493;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export default function MoveItemToOtherBox({
  itemId,
  itemIds,
  currentBoxId, // owning/source box id
  onBoxSelected, // ({ destBoxId, destLabel, destShortId, isOrphanedDestination, toState }) => void
  showOrphanOption = true,
  showRecentDestinations = true,
  suggestedPurpose = '',
  suggestedOnly = false,
  disabled = false,
}) {
  const [otherBoxes, setOtherBoxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [boxIdPrefix, setBoxIdPrefix] = useState('');
  const [recentDestinations, setRecentDestinations] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const filterInputIdRef = useRef(
    `move-item-box-filter-${Math.random().toString(36).slice(2, 10)}`,
  );
  const normalizedItemIds = useMemo(
    () =>
      (Array.isArray(itemIds) ? itemIds : [itemId])
        .map((entry) => String(entry || '').trim())
        .filter(Boolean),
    [itemId, itemIds],
  );
  const shouldLoadRecentDestinations =
    showRecentDestinations && normalizedItemIds.length === 1;

  useEffect(() => {
    let isAlive = true; // if component unmounts or id changes, ignore late responses

    (async () => {
      try {
        setLoading(true);

        const url = currentBoxId
          ? `/api/boxes/exclude/${encodeURIComponent(String(currentBoxId))}`
          : '/api/boxes';
        const res = await fetch(url);

        const contentType = res.headers.get('content-type') || '';
        const bodyText = await res.text(); // read once

        if (!res.ok) {
          console.warn(
            'box list fetch failed',
            res.status,
            bodyText.slice(0, 160),
          );
          if (isAlive) setOtherBoxes([]);
          return;
        }

        // Parse JSON safely (some servers forget proper headers)
        let data = [];
        if (
          contentType.includes('application/json') ||
          // eslint-disable-next-line no-useless-escape
          /^[\[{]/.test(bodyText.trim())
        ) {
          try {
            data = JSON.parse(bodyText);
          } catch {
            console.warn(
              'box list: JSON parse failed. Preview:',
              bodyText.slice(0, 120),
            );
            data = [];
          }
        } else {
          console.warn(
            'box list: non-JSON response. CT:',
            contentType,
            'Preview:',
            bodyText.slice(0, 120),
          );
          data = [];
        }

        if (isAlive) setOtherBoxes(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isAlive) {
          console.error('❌ Failed to fetch boxes:', err);
          setOtherBoxes([]);
        }
      } finally {
        if (isAlive) setLoading(false);
      }
    })();

    return () => {
      isAlive = false;
    };
  }, [currentBoxId]);

  useEffect(() => {
    const id = normalizedItemIds[0] || '';
    if (!id || !shouldLoadRecentDestinations) {
      setRecentDestinations([]);
      setRecentLoading(false);
      return;
    }

    const sourceBoxId = String(currentBoxId || '').trim();
    const controller = new AbortController();
    let isAlive = true;

    (async () => {
      try {
        setRecentLoading(true);
        const payload = await fetchItemMoveLogs(
          { itemId: id, limit: 100 },
          { signal: controller.signal },
        );
        if (!isAlive) return;

        const entries = Array.isArray(payload?.entries) ? payload.entries : [];
        const next = [];
        const seen = new Set();

        for (const entry of entries) {
          const toBoxId = String(entry?.details?.to_box_id || '').trim();
          if (!toBoxId || seen.has(toBoxId)) continue;
          if (sourceBoxId && toBoxId === sourceBoxId) continue;

          seen.add(toBoxId);
          next.push({
            boxMongoId: toBoxId,
            boxLabel: String(entry?.details?.to_box_label || '').trim(),
          });
          if (next.length >= RECENT_DEST_LIMIT) break;
        }

        setRecentDestinations(next);
      } catch (err) {
        if (controller.signal.aborted || !isAlive) return;
        console.warn(
          '[MoveItemToOtherBox] failed to load recent destinations',
          err,
        );
        setRecentDestinations([]);
      } finally {
        if (isAlive) {
          setRecentLoading(false);
        }
      }
    })();

    return () => {
      isAlive = false;
      controller.abort();
    };
  }, [currentBoxId, normalizedItemIds, shouldLoadRecentDestinations]);

  const handleSelect = (box) => {
    onBoxSelected?.({
      destBoxId: box._id,
      destLabel: box.label,
      destShortId: box.box_id,
      isOrphanedDestination: false,
      toState: 'boxed',
    });
  };

  const handleSelectOrphaned = () => {
    onBoxSelected?.({
      destBoxId: null,
      destLabel: 'Items Adrift',
      destShortId: null,
      isOrphanedDestination: true,
      toState: 'orphaned',
    });
  };

  const normalizedBoxes = useMemo(() => {
    const list = Array.isArray(otherBoxes) ? otherBoxes : [];
    const byId = new Map(
      list.filter((box) => box?._id).map((box) => [String(box._id), box]),
    );

    const getParentId = (box) => {
      const parent = box?.parentBox;
      if (!parent) return null;
      if (typeof parent === 'string') return parent;
      if (typeof parent === 'object') return parent?._id || parent?.id || null;
      return null;
    };

    const getDepth = (box) => {
      let depth = 0;
      let cursorId = getParentId(box);
      let guard = 0;

      while (cursorId && guard < 64) {
        depth += 1;
        const parent = byId.get(String(cursorId));
        if (!parent) break;
        cursorId = getParentId(parent);
        guard += 1;
      }

      return depth;
    };

    return list
      .map((box) => ({
        ...box,
        _itemCount: Array.isArray(box?.items) ? box.items.length : 0,
        _depth: getDepth(box),
      }))
      .sort((a, b) => {
        const numericDiff = compareNumericBoxIds(a?.box_id, b?.box_id);
        if (numericDiff !== 0) return numericDiff;
        return String(a?.label || '').localeCompare(String(b?.label || ''));
      });
  }, [otherBoxes]);

  const filteredBoxes = useMemo(() => {
    return normalizedBoxes.filter((box) =>
      matchesBoxIdPrefix(box?.box_id, boxIdPrefix),
    );
  }, [boxIdPrefix, normalizedBoxes]);

  const suggestedBoxes = useMemo(() => {
    if (!suggestedPurpose) return [];
    return filteredBoxes
      .filter((box) => box?.declutterPurpose === suggestedPurpose)
      .sort((left, right) => Number(Boolean(right?.declutterIsDefault)) - Number(Boolean(left?.declutterIsDefault)));
  }, [filteredBoxes, suggestedPurpose]);

  const recentBoxes = useMemo(() => {
    if (!recentDestinations.length || !filteredBoxes.length) return [];
    const byMongoId = new Map(
      filteredBoxes
        .filter((box) => box?._id)
        .map((box) => [String(box._id), box]),
    );

    const suggestedIds = new Set(
      suggestedBoxes.map((box) => String(box?._id || '')).filter(Boolean),
    );
    return recentDestinations
      .map((entry) => byMongoId.get(String(entry.boxMongoId || '')))
      .filter((box) => box && !suggestedIds.has(String(box._id || '')))
      .slice(0, RECENT_DEST_LIMIT);
  }, [filteredBoxes, recentDestinations, suggestedBoxes]);

  const remainingBoxes = useMemo(() => {
    if (suggestedOnly) return [];
    const promotedIds = new Set(
      [...suggestedBoxes, ...recentBoxes]
        .map((box) => String(box?._id || '').trim())
        .filter(Boolean),
    );
    return filteredBoxes.filter((box) => {
      const id = String(box?._id || '').trim();
      if (!id) return true;
      return !promotedIds.has(id);
    });
  }, [filteredBoxes, recentBoxes, suggestedBoxes, suggestedOnly]);

  const hasFilter = normalizeBoxId(boxIdPrefix).length > 0;
  const hasAnyMatches = suggestedBoxes.length > 0
    || recentBoxes.length > 0
    || remainingBoxes.length > 0;

  const renderBoxItem = (box, { isRecent = false, isSuggested = false } = {}) => (
    <BoxItem
      key={box._id || `${box.box_id}-${box.label}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) handleSelect(box);
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        handleSelect(box);
      }}
    >
      <BoxIdentityLane $depth={box._depth}>
        <BoxIdChip>#{box.box_id ?? '---'}</BoxIdChip>
        <BoxName>{box.label || '(Untitled Box)'}</BoxName>
      </BoxIdentityLane>
      <MetaLane>
        {isSuggested ? <SuggestedPill>{box.declutterIsDefault ? 'Best match' : 'Suggested'}</SuggestedPill> : null}
        {isRecent ? <RecentPill>Recent</RecentPill> : null}
        <MetaPill>
          {box._itemCount} {box._itemCount === 1 ? 'item' : 'items'}
        </MetaPill>
        <LevelPill>L{box._depth}</LevelPill>
      </MetaLane>
    </BoxItem>
  );

  const handleFilterChange = (event) => {
    const next = normalizeBoxId(event.target.value).slice(0, MAX_PREFIX_LENGTH);
    setBoxIdPrefix(next);
  };

  return (
    <Container>
      {!suggestedOnly ? (
        <FilterPanel>
          <FilterLabel htmlFor={filterInputIdRef.current}>
            Destination Box ID
          </FilterLabel>
          <BoxIdPrefixInput
            inputAs={FilterInput}
            id={filterInputIdRef.current}
            namePrefix="move_box_locator"
            maxLength={MAX_PREFIX_LENGTH}
            value={boxIdPrefix}
            onChange={handleFilterChange}
            placeholder="Type box ID prefix (e.g. 107)"
            ariaLabel="Destination box ID prefix search"
          />
        </FilterPanel>
      ) : null}

      {suggestedBoxes.length > 0 ? (
        <>
          <SectionHeading>
            Suggested // {DECLUTTER_BOX_PURPOSE_LABELS[suggestedPurpose] || 'Departure staging'}
          </SectionHeading>
          <BoxList>
            {suggestedBoxes.map((box) => renderBoxItem(box, { isSuggested: true }))}
          </BoxList>
        </>
      ) : null}
      {!loading && suggestedPurpose && suggestedBoxes.length === 0 ? (
        <StatusHint>
          No {DECLUTTER_BOX_PURPOSE_LABELS[suggestedPurpose]?.toLowerCase() || 'matching staging'} box is configured yet.
        </StatusHint>
      ) : null}

      {showOrphanOption ? (
        <BoxList>
          <OrphanItem
            key="__orphan-option__"
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            onClick={() => {
              if (!disabled) handleSelectOrphaned();
            }}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              handleSelectOrphaned();
            }}
          >
            <BoxIdentityLane $depth={0}>
              <OrphanIdChip>—</OrphanIdChip>
              <BoxName>Items Adrift</BoxName>
            </BoxIdentityLane>
            <MetaLane>
              <OrphanPill>ADRIFT</OrphanPill>
            </MetaLane>
          </OrphanItem>
        </BoxList>
      ) : null}

      {recentLoading && !recentBoxes.length ? (
        <StatusHint>Loading recent destinations…</StatusHint>
      ) : null}

      {recentBoxes.length > 0 ? (
        <>
          <SectionHeading>Recent Destinations</SectionHeading>
          <BoxList>
            {recentBoxes.map((box) => renderBoxItem(box, { isRecent: true }))}
          </BoxList>
        </>
      ) : null}

      {!suggestedOnly ? (
        <>
          <SectionHeading>
            {hasFilter ? 'Matching Boxes' : 'All Boxes'}
          </SectionHeading>
          {remainingBoxes.length > 0 ? (
            <BoxList>{remainingBoxes.map((box) => renderBoxItem(box))}</BoxList>
          ) : null}
        </>
      ) : null}

      {loading && normalizedBoxes.length === 0 ? (
        <StatusHint>Loading boxes…</StatusHint>
      ) : null}
      {!loading && !normalizedBoxes.length ? (
        <StatusHint>No other boxes available.</StatusHint>
      ) : null}
      {!loading && normalizedBoxes.length > 0 && hasFilter && !hasAnyMatches ? (
        <StatusHint>No matching box IDs.</StatusHint>
      ) : null}
    </Container>
  );
}
