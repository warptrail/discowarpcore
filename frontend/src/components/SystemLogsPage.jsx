import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../api/API_BASE';
import { DEFAULT_LOGS_LIMIT, fetchLogsPage } from '../api/logs';
import * as S from './SystemLogs.styles';

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function normalizeLogEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw._id || '').trim();
  const summary = String(raw.summary || '').trim();
  if (!id || !summary) return null;

  return {
    id,
    summary,
    created_at: raw.created_at || null,
    event_type: String(raw.event_type || '').trim(),
    entity_type: String(raw.entity_type || '').trim(),
    entity_id: String(raw.entity_id || '').trim(),
    entity_label: String(raw.entity_label || '').trim(),
    details:
      raw.details && typeof raw.details === 'object' && !Array.isArray(raw.details)
        ? raw.details
        : {},
  };
}

function formatTimestamp(value) {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return TIMESTAMP_FORMATTER.format(date);
}

function toEventBadgeLabel(eventType) {
  const normalized = String(eventType || '').trim();
  if (!normalized) return 'event';
  return normalized.replace(/_/g, ' ');
}

function toEntityBadgeLabel(entityType) {
  const normalized = String(entityType || '').trim().toLowerCase();
  if (normalized === 'item') return 'item';
  if (normalized === 'box') return 'box';
  return 'entity';
}

function isBulkImportedItemCreated(entry) {
  if (!entry || entry.event_type !== 'item_created') return false;
  const details = entry.details || {};
  const importEventType = String(details.import_event_type || '').trim();
  const sourceFileName = String(details.source_file_name || '').trim();
  return importEventType === 'items_bulk_imported' || Boolean(sourceFileName);
}

function buildInferredBulkImportMap(entries = []) {
  const inferred = new Map();
  const pendingImports = [];

  for (const entry of entries) {
    if (entry?.event_type === 'item_created' && pendingImports.length) {
      const active = pendingImports[0];
      inferred.set(entry.id, { sourceFileName: active.sourceFileName });
      active.remaining -= 1;
      if (active.remaining <= 0) {
        pendingImports.shift();
      }
    }

    if (entry?.event_type !== 'items_bulk_imported') continue;
    const count = Number(entry?.details?.count);
    if (!Number.isFinite(count) || count <= 0) continue;
    pendingImports.push({
      remaining: count,
      sourceFileName: String(entry?.details?.source_file_name || '').trim(),
    });
  }

  return inferred;
}

function getBulkImportedItemContext(entry, inferredMap) {
  if (!entry || entry.event_type !== 'item_created') {
    return { isImported: false, sourceFileName: '' };
  }

  if (isBulkImportedItemCreated(entry)) {
    return {
      isImported: true,
      sourceFileName: String(entry.details?.source_file_name || '').trim(),
    };
  }

  const inferred = inferredMap.get(entry.id);
  if (inferred) {
    return {
      isImported: true,
      sourceFileName: String(inferred.sourceFileName || '').trim(),
    };
  }

  return { isImported: false, sourceFileName: '' };
}

function buildMetaChips(entry, importedContext) {
  if (importedContext.isImported) {
    const chips = [{ tone: 'import', label: 'item bulk imported' }];
    const sourceFileName = String(importedContext.sourceFileName || '').trim();
    if (sourceFileName) {
      chips.push({ tone: 'file', label: sourceFileName });
    }
    chips.push({ tone: 'entity', label: toEntityBadgeLabel(entry.entity_type) });
    return chips;
  }

  return [
    { tone: 'event', label: toEventBadgeLabel(entry.event_type) },
    { tone: 'entity', label: toEntityBadgeLabel(entry.entity_type) },
  ];
}

function buildPrimaryParts(entry, importedContext) {
  const label = String(entry?.entity_label || '').trim();

  if (entry?.event_type === 'item_created') {
    if (importedContext.isImported) {
      return {
        prefix: '',
        chipLabel: label,
        chipTone: 'itemName',
      };
    }
    return {
      prefix: 'Created item:',
      chipLabel: label,
      chipTone: 'itemName',
    };
  }

  if (entry?.event_type === 'box_created') {
    return {
      prefix: 'Created box:',
      chipLabel: label,
      chipTone: 'boxName',
    };
  }

  return null;
}

function summaryIncludesText(summary, value) {
  const s = String(summary || '').toLowerCase();
  const v = String(value || '').toLowerCase();
  if (!s || !v) return false;
  return s.includes(v);
}

function getBulkSecondaryText(entry) {
  if (entry.event_type !== 'items_bulk_imported') return '';

  const details = entry.details || {};
  const segments = [];

  const count = Number(details.count);
  if (Number.isFinite(count) && count > 0) {
    segments.push(`${count} item${count === 1 ? '' : 's'}`);
  }

  const destinationType = String(details?.destination?.type || '').trim().toLowerCase();
  if (destinationType === 'box') {
    segments.push('box destination');
  } else if (destinationType === 'orphaned') {
    segments.push('orphaned destination');
  }

  const sourceFileName = String(details.source_file_name || '').trim();
  if (sourceFileName && !summaryIncludesText(entry.summary, sourceFileName)) {
    segments.push(sourceFileName);
  }

  return segments.join(' • ');
}

function mergeLogEntries(current = [], incoming = []) {
  if (!incoming.length) return current;
  const seen = new Set(current.map((entry) => entry.id));
  const merged = [...current];

  for (const entry of incoming) {
    if (!entry?.id || seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
  }

  return merged;
}

function buildBoxShortIdMap(rawBoxes) {
  const map = new Map();
  const list = Array.isArray(rawBoxes) ? rawBoxes : [];

  for (const box of list) {
    const shortId = String(box?.box_id || '').trim();
    if (!shortId) continue;

    map.set(shortId, shortId);

    const mongoId = String(box?._id || '').trim();
    if (mongoId) map.set(mongoId, shortId);
  }

  return map;
}

function resolveBoxShortId(rawId, boxShortIdMap) {
  const value = String(rawId || '').trim();
  if (!value) return '';
  if (/^\d{3}$/.test(value)) return value;
  return boxShortIdMap.get(value) || '';
}

function resolveEntryHref(entry, boxShortIdMap) {
  if (!entry) return '';

  if (entry.event_type === 'items_bulk_imported') {
    const destination = entry.details?.destination;
    if (String(destination?.type || '').trim().toLowerCase() !== 'box') return '';
    const destinationShortId = resolveBoxShortId(destination?.box_id, boxShortIdMap);
    if (!destinationShortId) return '';
    return `/boxes/${encodeURIComponent(destinationShortId)}`;
  }

  if (entry.entity_type === 'item') {
    if (!entry.entity_id) return '';
    return `/items/${encodeURIComponent(entry.entity_id)}`;
  }

  if (entry.entity_type === 'box') {
    const shortId =
      resolveBoxShortId(entry.entity_id, boxShortIdMap) ||
      resolveBoxShortId(entry.details?.box_id, boxShortIdMap);
    if (!shortId) return '';
    return `/boxes/${encodeURIComponent(shortId)}`;
  }

  return '';
}

export default function LogsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [boxShortIdMap, setBoxShortIdMap] = useState(() => new Map());

  const initialRequestRef = useRef(null);
  const loadMoreRequestRef = useRef(null);
  const pendingOffsetsRef = useRef(new Set());

  const fetchPage = useCallback(async ({ offset, append }) => {
    const safeOffset = Math.max(0, Number(offset) || 0);
    if (pendingOffsetsRef.current.has(safeOffset)) return;

    pendingOffsetsRef.current.add(safeOffset);
    setError('');

    const controller = new AbortController();
    if (append) {
      if (loadMoreRequestRef.current) {
        loadMoreRequestRef.current.abort();
      }
      loadMoreRequestRef.current = controller;
      setLoadingMore(true);
    } else {
      if (initialRequestRef.current) {
        initialRequestRef.current.abort();
      }
      initialRequestRef.current = controller;
      setLoading(true);
    }

    try {
      const payload = await fetchLogsPage(
        {
          limit: DEFAULT_LOGS_LIMIT,
          offset: safeOffset,
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      const pageEntries = Array.isArray(payload?.entries)
        ? payload.entries.map(normalizeLogEntry).filter(Boolean)
        : [];
      const totalFromPayload = Number(payload?.total) || 0;
      const hasMoreFromPayload = Boolean(payload?.hasMore);
      const consumed = pageEntries.length;
      const computedNextOffset = safeOffset + consumed;

      if (append) {
        setEntries((current) => mergeLogEntries(current, pageEntries));
      } else {
        setEntries(pageEntries);
      }

      setTotal(totalFromPayload);
      setHasMore(hasMoreFromPayload);
      setNextOffset(computedNextOffset);
    } catch (loadError) {
      if (loadError?.name === 'AbortError') return;
      setError(loadError?.message || 'Failed to load logs');
      if (!append) {
        setEntries([]);
        setHasMore(false);
        setTotal(0);
        setNextOffset(0);
      }
    } finally {
      pendingOffsetsRef.current.delete(safeOffset);

      if (append) {
        if (loadMoreRequestRef.current === controller) {
          loadMoreRequestRef.current = null;
        }
        if (!controller.signal.aborted) {
          setLoadingMore(false);
        }
      } else {
        if (initialRequestRef.current === controller) {
          initialRequestRef.current = null;
        }
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
  }, []);

  const fetchBoxMap = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/boxes`);
      if (!response.ok) return;

      const body = await response.json().catch(() => []);
      const boxes = Array.isArray(body) ? body : Array.isArray(body?.boxes) ? body.boxes : [];
      setBoxShortIdMap(buildBoxShortIdMap(boxes));
    } catch {
      // Linking is best-effort; page still works if this fails.
    }
  }, []);

  useEffect(() => {
    fetchPage({ offset: 0, append: false });
    fetchBoxMap();

    return () => {
      if (initialRequestRef.current) initialRequestRef.current.abort();
      if (loadMoreRequestRef.current) loadMoreRequestRef.current.abort();
      pendingOffsetsRef.current.clear();
    };
  }, [fetchPage, fetchBoxMap]);

  const handleRetry = useCallback(() => {
    if (loading || loadingMore) return;
    fetchPage({ offset: 0, append: false });
  }, [fetchPage, loading, loadingMore]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage({ offset: nextOffset, append: true });
  }, [fetchPage, hasMore, loading, loadingMore, nextOffset]);

  const renderedEntries = useMemo(
    () => {
      const inferredImportMap = buildInferredBulkImportMap(entries);
      return entries.map((entry) => {
        const href = resolveEntryHref(entry, boxShortIdMap);
        const bulkSecondary = getBulkSecondaryText(entry);
        const importedContext = getBulkImportedItemContext(entry, inferredImportMap);
        const chips = buildMetaChips(entry, importedContext);
        const primaryParts = buildPrimaryParts(entry, importedContext);

        return (
          <S.EntryRow key={entry.id}>
            <S.EntryPrimary>
              {primaryParts ? (
                <S.EntryPrimaryStructured>
                  {primaryParts.prefix ? <S.EntryPrefix>{primaryParts.prefix}</S.EntryPrefix> : null}
                  {href ? (
                    <S.NameChipLink to={href} $tone={primaryParts.chipTone}>
                      {primaryParts.chipLabel}
                    </S.NameChipLink>
                  ) : (
                    <S.NameChip $tone={primaryParts.chipTone}>
                      {primaryParts.chipLabel}
                    </S.NameChip>
                  )}
                </S.EntryPrimaryStructured>
              ) : (
                <>
                  {href ? (
                    <S.EntrySummaryLink to={href}>{entry.summary}</S.EntrySummaryLink>
                  ) : (
                    <S.EntrySummaryText>{entry.summary}</S.EntrySummaryText>
                  )}
                </>
              )}
            </S.EntryPrimary>

            <S.EntryMeta>
              <S.Timestamp>{formatTimestamp(entry.created_at)}</S.Timestamp>
              {chips.map((chip) => (
                <S.Badge key={`${entry.id}-${chip.tone}-${chip.label}`} $tone={chip.tone}>
                  {chip.label}
                </S.Badge>
              ))}
            </S.EntryMeta>

            {bulkSecondary ? <S.BulkDetails>{bulkSecondary}</S.BulkDetails> : null}
          </S.EntryRow>
        );
      });
    },
    [boxShortIdMap, entries]
  );

  return (
    <S.PageShell>
      <S.IntroPanel>
        <S.HeadingRow>
          <S.HeadingGroup>
            <S.TitleRow>
              <S.TitlePip aria-hidden="true" />
              <S.Title>System Logs</S.Title>
            </S.TitleRow>
            <S.Subtitle>Newest first • append-only activity console</S.Subtitle>
          </S.HeadingGroup>
          <S.CountPill>{total}</S.CountPill>
        </S.HeadingRow>
      </S.IntroPanel>

      {loading ? <S.StatePanel>Loading activity…</S.StatePanel> : null}

      {!loading && error && !entries.length ? (
        <S.StatePanel $tone="error" role="alert">
          <span>{error}</span>
          <S.RetryButton type="button" onClick={handleRetry}>
            Retry
          </S.RetryButton>
        </S.StatePanel>
      ) : null}

      {!loading && !error && !entries.length ? (
        <S.StatePanel $tone="muted">No activity logged yet</S.StatePanel>
      ) : null}

      {!loading && entries.length ? (
        <>
          {error ? (
            <S.StatePanel $tone="error" role="alert">
              <span>{error}</span>
              <S.RetryButton type="button" onClick={hasMore ? handleLoadMore : handleRetry}>
                Retry
              </S.RetryButton>
            </S.StatePanel>
          ) : null}

          <S.FeedPanel>
            <S.FeedList>{renderedEntries}</S.FeedList>

            <S.FeedFooter>
              {hasMore ? (
                <S.LoadMoreButton
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </S.LoadMoreButton>
              ) : (
                <S.EndState>No more activity</S.EndState>
              )}
            </S.FeedFooter>
          </S.FeedPanel>
        </>
      ) : null}
    </S.PageShell>
  );
}
