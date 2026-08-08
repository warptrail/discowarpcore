import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../api/API_BASE';
import { DEFAULT_LOGS_LIMIT, fetchLogsPage } from '../api/logs';
import * as S from './SystemLogs.styles';

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const EXPORT_PAGE_LIMIT = 100;
const LOG_STREAMS = Object.freeze({
  system: {
    label: 'SYS.ACTIVITY',
    title: 'System activity',
    subtitle: 'Newest first // append-only event stream',
    eventType: '',
    exportPrefix: 'system-logs',
  },
  disposition: {
    label: 'ITEMS.JETTISONED',
    title: 'Items jettisoned',
    subtitle: 'Disposition ledger // inventory we no longer have',
    eventType: 'item_marked_gone',
    exportPrefix: 'items-jettisoned',
  },
});

function formatFileTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('') + `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function triggerFileDownload(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sanitizeExportEntry(entry) {
  return {
    id: entry.id,
    created_at: entry.created_at || null,
    event_type: entry.event_type || '',
    entity_type: entry.entity_type || '',
    entity_id: entry.entity_id || '',
    entity_label: entry.entity_label || '',
    summary: entry.summary || '',
    details: entry.details || {},
  };
}

function toMarkdownExport(entries = []) {
  const lines = [];
  lines.push('# System Logs Export');
  lines.push('');
  lines.push(`Exported at: ${new Date().toISOString()}`);
  lines.push(`Total entries: ${entries.length}`);
  lines.push('');

  for (const entry of entries) {
    lines.push(`## ${entry.summary || 'Log Entry'}`);
    lines.push(`- Created at: ${entry.created_at || 'Unknown time'}`);
    lines.push(`- Event type: ${entry.event_type || ''}`);
    lines.push(`- Entity type: ${entry.entity_type || ''}`);
    lines.push(`- Entity id: ${entry.entity_id || ''}`);
    lines.push(`- Entity label: ${entry.entity_label || ''}`);

    const details =
      entry.details && typeof entry.details === 'object' && !Array.isArray(entry.details)
        ? entry.details
        : null;

    if (details && Object.keys(details).length) {
      lines.push('- Details:');
      lines.push('```json');
      lines.push(JSON.stringify(details, null, 2));
      lines.push('```');
    } else {
      lines.push('- Details: {}');
    }

    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

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

function toEventLabel(eventType) {
  const normalized = String(eventType || '').trim();
  if (!normalized) return 'event';
  return normalized.replace(/_/g, ' ');
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

function getBoxPrimaryParts(entry, boxShortIdMap) {
  const rawLabel = String(entry?.entity_label || '').trim();
  const canonicalBoxId =
    resolveBoxShortId(entry?.entity_id, boxShortIdMap) ||
    resolveBoxShortId(entry?.details?.box_id, boxShortIdMap);

  let boxId = canonicalBoxId;
  let boxLabel = rawLabel;

  const trailingIdMatch = rawLabel.match(/\s+(\d{3,})$/);
  if (trailingIdMatch) {
    const [, parsedId] = trailingIdMatch;
    boxId = boxId || parsedId;
    boxLabel = rawLabel.slice(0, trailingIdMatch.index).trim();
  }

  if (!boxLabel && rawLabel) boxLabel = rawLabel;
  if (!boxLabel && boxId) boxLabel = 'Box';
  if (!boxLabel && !boxId) boxLabel = 'Box';

  return {
    boxId,
    boxLabel,
  };
}

function buildPrimaryParts(entry, importedContext, boxShortIdMap) {
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
    const { boxId, boxLabel } = getBoxPrimaryParts(entry, boxShortIdMap);

    return {
      prefix: 'Created box:',
      value: [boxId, boxLabel].filter(Boolean).join(' // '),
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
  const [activeStream, setActiveStream] = useState('system');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [boxShortIdMap, setBoxShortIdMap] = useState(() => new Map());
  const [exportingFormat, setExportingFormat] = useState('');
  const [exportError, setExportError] = useState('');

  const initialRequestRef = useRef(null);
  const loadMoreRequestRef = useRef(null);
  const pendingOffsetsRef = useRef(new Set());

  const streamConfig = LOG_STREAMS[activeStream];

  const fetchPage = useCallback(async ({ offset, append }) => {
    const safeOffset = Math.max(0, Number(offset) || 0);
    const requestKey = `${activeStream}:${safeOffset}`;
    if (pendingOffsetsRef.current.has(requestKey)) return;

    pendingOffsetsRef.current.add(requestKey);
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
          eventType: LOG_STREAMS[activeStream].eventType,
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
      pendingOffsetsRef.current.delete(requestKey);

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
  }, [activeStream]);

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

  const fetchAllLogsForExport = useCallback(async () => {
    const collected = [];
    const seen = new Set();
    let offset = 0;
    let hasMorePages = true;
    let lastTotal = 0;

    while (hasMorePages) {
      const payload = await fetchLogsPage({
        limit: EXPORT_PAGE_LIMIT,
        offset,
        eventType: streamConfig.eventType,
      });
      const pageEntries = Array.isArray(payload?.entries)
        ? payload.entries.map(normalizeLogEntry).filter(Boolean)
        : [];

      for (const entry of pageEntries) {
        if (!entry?.id || seen.has(entry.id)) continue;
        seen.add(entry.id);
        collected.push(entry);
      }

      lastTotal = Number(payload?.total) || lastTotal;
      hasMorePages = Boolean(payload?.hasMore);

      if (!pageEntries.length) break;
      offset += pageEntries.length;
    }

    return {
      entries: collected,
      total: lastTotal || collected.length,
    };
  }, [streamConfig.eventType]);

  const runExport = useCallback(
    async (format) => {
      if (exportingFormat) return;
      setExportError('');
      setExportingFormat(format);

      try {
        const result = await fetchAllLogsForExport();
        const serialized = result.entries.map(sanitizeExportEntry);
        const timestamp = formatFileTimestamp(new Date());

        if (format === 'json') {
          const payload = {
            exported_at: new Date().toISOString(),
            total: result.total,
            entries: serialized,
          };
          triggerFileDownload(
            `${streamConfig.exportPrefix}-${timestamp}.json`,
            `${JSON.stringify(payload, null, 2)}\n`,
            'application/json'
          );
          return;
        }

        if (format === 'markdown') {
          triggerFileDownload(
            `${streamConfig.exportPrefix}-${timestamp}.md`,
            toMarkdownExport(serialized),
            'text/markdown'
          );
        }
      } catch (err) {
        setExportError(err?.message || 'Failed to export logs');
      } finally {
        setExportingFormat('');
      }
    },
    [exportingFormat, fetchAllLogsForExport, streamConfig.exportPrefix]
  );

  const handleExportJson = useCallback(() => {
    runExport('json');
  }, [runExport]);

  const handleExportMarkdown = useCallback(() => {
    runExport('markdown');
  }, [runExport]);

  const renderedEntries = useMemo(
    () => {
      const inferredImportMap = buildInferredBulkImportMap(entries);
      return entries.map((entry) => {
        const href = resolveEntryHref(entry, boxShortIdMap);
        const bulkSecondary = getBulkSecondaryText(entry);
        const importedContext = getBulkImportedItemContext(entry, inferredImportMap);
        const primaryParts = buildPrimaryParts(entry, importedContext, boxShortIdMap);
        const disposition = String(entry.details?.disposition || '').trim();
        const priorLocation = String(entry.details?.from_box_label || '').trim();
        const dispositionNotes = String(entry.details?.disposition_notes || '').trim();
        const eventLabel = toEventLabel(entry.event_type).toUpperCase();

        return (
          <S.EntryRow key={entry.id}>
            <S.Timestamp>{formatTimestamp(entry.created_at)}</S.Timestamp>
            <S.EventCode>{eventLabel}</S.EventCode>
            <S.EntryPrimary>
              <S.TreeGlyph aria-hidden="true">├─</S.TreeGlyph>
              {href ? (
                <S.EntrySummaryLink to={href}>
                  {activeStream === 'disposition' ? entry.entity_label : primaryParts?.value || primaryParts?.chipLabel || entry.summary}
                </S.EntrySummaryLink>
              ) : (
                <S.EntrySummaryText>{primaryParts?.value || primaryParts?.chipLabel || entry.summary}</S.EntrySummaryText>
              )}
              {activeStream === 'disposition' ? (
                <S.DispositionMeta>
                  <span>OUTCOME={disposition || 'UNKNOWN'}</span>
                  <span>FROM={priorLocation || 'UNKNOWN'}</span>
                  {dispositionNotes ? <span>NOTE={dispositionNotes}</span> : null}
                </S.DispositionMeta>
              ) : (
                <S.SecondaryText>{bulkSecondary || entry.summary}</S.SecondaryText>
              )}
            </S.EntryPrimary>
          </S.EntryRow>
        );
      });
    },
    [activeStream, boxShortIdMap, entries]
  );

  return (
    <S.PageShell>
      <S.IntroPanel>
        <S.HeadingRow>
          <S.HeadingGroup>
            <S.TitleRow>
              <S.TitlePip aria-hidden="true">&gt;_</S.TitlePip>
              <S.Title>{streamConfig.title}</S.Title>
            </S.TitleRow>
            <S.Subtitle>{streamConfig.subtitle}</S.Subtitle>
          </S.HeadingGroup>
          <S.HeaderActions>
            <S.CountReadout>COUNT={String(total).padStart(4, '0')}</S.CountReadout>
            <S.ExportButton
              type="button"
              onClick={handleExportJson}
              disabled={Boolean(exportingFormat)}
            >
              {exportingFormat === 'json' ? 'Exporting JSON…' : 'Export JSON'}
            </S.ExportButton>
            <S.ExportButton
              type="button"
              onClick={handleExportMarkdown}
              disabled={Boolean(exportingFormat)}
            >
              {exportingFormat === 'markdown' ? 'Exporting Markdown…' : 'Export Markdown'}
            </S.ExportButton>
          </S.HeaderActions>
        </S.HeadingRow>
        {exportError ? <S.ExportError role="alert">{exportError}</S.ExportError> : null}
      </S.IntroPanel>

      <S.StreamNav aria-label="Log stream">
        {Object.entries(LOG_STREAMS).map(([key, config]) => (
          <S.StreamButton
            key={key}
            type="button"
            $active={activeStream === key}
            aria-pressed={activeStream === key}
            onClick={() => setActiveStream(key)}
          >
            {activeStream === key ? '[*]' : '[ ]'} {config.label}
          </S.StreamButton>
        ))}
      </S.StreamNav>

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
            <S.TerminalHeader aria-hidden="true">
              <span>TIMESTAMP</span><span>EVENT</span><span>RECORD</span>
            </S.TerminalHeader>
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
