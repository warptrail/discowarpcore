import React, { useMemo, useState } from 'react';
import { getItemHomeHref } from '../../api/itemDetails';
import * as S from './AllItemsList.styles';

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function getBatchDate(sourceBatch) {
  const rawDate =
    sourceBatch?.importedAt || sourceBatch?.createdAt || sourceBatch?.updatedAt || '';
  const timestamp = Date.parse(rawDate);
  return {
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    label: Number.isFinite(timestamp) ? DATE_FORMATTER.format(timestamp) : 'Date unavailable',
  };
}

function getDestination(item) {
  const meta = item?._allItems || {};
  if (meta.isBoxed && (meta.boxId || meta.boxLabel)) {
    return {
      key: `box:${meta.boxId || meta.boxLabel}`,
      label: [meta.boxId ? `#${meta.boxId}` : '', meta.boxLabel].filter(Boolean).join(' '),
    };
  }
  if (meta.isOrphaned) return { key: 'adrift', label: 'Items Adrift' };
  if (meta.hasHistoricalBox && (meta.boxId || meta.boxLabel)) {
    return {
      key: `former:${meta.boxId || meta.boxLabel}`,
      label: [meta.boxId ? `#${meta.boxId}` : '', meta.boxLabel].filter(Boolean).join(' '),
    };
  }
  return { key: 'unassigned', label: 'Unassigned' };
}

function groupItems(items, batchToneMap) {
  const groupsById = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const meta = item?._allItems || {};
    const batchId = String(meta.sourceBatchId || '').trim();
    if (!batchId) continue;

    if (!groupsById.has(batchId)) {
      const date = getBatchDate(meta.sourceBatch);
      groupsById.set(batchId, {
        key: batchId,
        batchId,
        label: String(meta.sourceBatchLabel || batchId).trim() || batchId,
        archiveStatus: String(meta.sourceBatchArchiveStatus || '').trim().toLowerCase(),
        tone: batchToneMap.get(batchId) || 'root',
        dateLabel: date.label,
        dateTimestamp: date.timestamp,
        reportedCount: Number(meta.sourceBatch?.itemCount || 0),
        items: [],
        destinations: new Map(),
      });
    }

    const group = groupsById.get(batchId);
    group.items.push(item);
    const destination = getDestination(item);
    group.destinations.set(destination.key, destination.label);
  }

  return [...groupsById.values()].sort((left, right) => {
    if (left.dateTimestamp !== right.dateTimestamp) {
      return right.dateTimestamp - left.dateTimestamp;
    }
    return left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: 'base' });
  });
}

function summarizeDestinations(destinations) {
  const labels = [...destinations.values()];
  if (!labels.length) return 'No destination recorded';
  if (labels.length <= 2) return labels.join(' · ');
  return `${labels.slice(0, 2).join(' · ')} +${labels.length - 2}`;
}

function getItemHref(itemId) {
  if (!itemId) return '';
  try {
    return getItemHomeHref(itemId);
  } catch {
    return '';
  }
}

export default function AllItemsBatchIndex({
  items = [],
  batchToneMap = new Map(),
  simpleSelectionModeEnabled = false,
  onSelectBatch,
}) {
  const groups = useMemo(
    () => groupItems(items, batchToneMap),
    [batchToneMap, items],
  );
  const [expandedBatchId, setExpandedBatchId] = useState('');

  if (!groups.length) {
    return (
      <S.BatchIndexEmpty>
        No imported batches match the current search.
      </S.BatchIndexEmpty>
    );
  }

  return (
    <S.BatchIndex aria-label="Source batches">
      {groups.map((group) => {
        const expanded = expandedBatchId === group.batchId;
        const destinationSummary = summarizeDestinations(group.destinations);
        const itemCount = Math.max(group.reportedCount, group.items.length);
        const showItemDestinations = group.destinations.size > 1;
        const panelId = `all-items-batch-${group.batchId}`;

        return (
          <S.BatchIndexGroup key={group.key} $tone={group.tone} $expanded={expanded}>
            <S.BatchIndexHeader>
              <S.BatchIndexToggle
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setExpandedBatchId(expanded ? '' : group.batchId)}
              >
                <S.BatchIndexChevron aria-hidden="true">{expanded ? '▾' : '▸'}</S.BatchIndexChevron>
                <S.BatchIndexIdentity>
                  <S.BatchIndexName>{group.label}</S.BatchIndexName>
                  <S.BatchIndexDestination>{destinationSummary}</S.BatchIndexDestination>
                </S.BatchIndexIdentity>
                <S.BatchIndexFacts>
                  <S.BatchIndexDate>{group.dateLabel}</S.BatchIndexDate>
                  <S.BatchIndexCount>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </S.BatchIndexCount>
                </S.BatchIndexFacts>
              </S.BatchIndexToggle>
              {simpleSelectionModeEnabled ? (
                <S.BatchIndexSelect
                  type="button"
                  onClick={() => onSelectBatch?.(group.batchId)}
                >
                  Select items
                </S.BatchIndexSelect>
              ) : null}
            </S.BatchIndexHeader>

            {expanded ? (
              <S.BatchIndexItems id={panelId} aria-label={`${group.label} items`}>
                {group.items.map((item) => {
                  const itemId = String(item?._id || '').trim();
                  const href = getItemHref(itemId);
                  const destination = getDestination(item);
                  const quantity = Math.max(1, Number(item?.quantity) || 1);
                  return (
                    <S.BatchIndexItem
                      key={itemId || item?.name}
                      $showDestination={showItemDestinations}
                    >
                      <S.BatchIndexItemMarker aria-hidden="true">·</S.BatchIndexItemMarker>
                      {href ? (
                        <S.BatchIndexItemLink to={href}>{item?.name || 'Unnamed item'}</S.BatchIndexItemLink>
                      ) : (
                        <S.BatchIndexItemName>{item?.name || 'Unnamed item'}</S.BatchIndexItemName>
                      )}
                      {showItemDestinations ? (
                        <S.BatchIndexItemBox>{destination.label}</S.BatchIndexItemBox>
                      ) : null}
                      <S.BatchIndexItemQuantity>×{quantity}</S.BatchIndexItemQuantity>
                    </S.BatchIndexItem>
                  );
                })}
              </S.BatchIndexItems>
            ) : null}
          </S.BatchIndexGroup>
        );
      })}
    </S.BatchIndex>
  );
}
