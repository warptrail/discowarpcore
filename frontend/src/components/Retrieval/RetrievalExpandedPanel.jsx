import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as S from './Retrieval.styles';
import useIsMobile from '../../hooks/useIsMobile';
import { getImportBatchHref } from '../../api/intakeBatches';
import { formatItemCategory, normalizeItemCategory } from '../../util/itemCategories';
import {
  formatKeepPriorityLabel,
  normalizeKeepPriority,
} from '../../util/keepPriority';
import { getItemOwnershipContext } from '../../util/itemOwnership';
import { getRetrievalTagHref } from './retrievalModel';
import NoteReaderModal from '../NoteReaderModal/NoteReaderModal';
import { getItemPreviewImageUrl } from '../../util/itemImage';

const DECK_SECTION_DEFINITIONS = {
  overview: { code: '01', label: 'Overview' },
  notes: { code: '02', label: 'Notes' },
  log: { code: '03', label: 'Log' },
  data: { code: '04', label: 'Data' },
  commands: { code: '05', label: 'Commands' },
};
const DECK_SECTIONS = Object.keys(DECK_SECTION_DEFINITIONS);

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function toText(value) {
  return String(value ?? '').trim();
}

function firstText(...values) {
  for (const value of values) {
    const text = toText(value);
    if (text) return text;
  }
  return '';
}

function humanize(value) {
  const text = toText(value).replace(/[_-]+/g, ' ');
  if (!text) return '—';
  return text.replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function latestDate(primaryValue, history) {
  if (primaryValue) return primaryValue;
  if (!Array.isArray(history) || !history.length) return null;
  return history[history.length - 1];
}

function normalizeEventDates(history, fallbackValue) {
  const values = Array.isArray(history) ? [...history] : [];
  if (fallbackValue) values.push(fallbackValue);

  const seen = new Set();
  return values.reduce((dates, value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return dates;
    const iso = date.toISOString();
    if (seen.has(iso)) return dates;
    seen.add(iso);
    dates.push({ date, iso, timestamp: date.getTime() });
    return dates;
  }, []);
}

function normalizeLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => ({
      label: toText(link?.label),
      url: toText(link?.url),
    }))
    .filter((link) => link.label && link.url);
}

function formatSourceBatch(sourceBatch, sourceBatchId) {
  const batch = sourceBatch && typeof sourceBatch === 'object' ? sourceBatch : null;
  const id = firstText(batch?.batchId, batch?.id, sourceBatchId);
  const label = firstText(batch?.batchName, batch?.label, id);
  return {
    id,
    label,
    href: id ? getImportBatchHref(id) : '',
  };
}

function EmptyTelemetry({ children }) {
  return <S.ExpandedEmptyTelemetry>{children}</S.ExpandedEmptyTelemetry>;
}

function OverviewContent({
  item,
  description,
  tags,
  imageUrl,
  useAmbientMediaBackdrop,
  onMediaLoad,
  onPreviewImage,
}) {
  const hasImage = Boolean(imageUrl);

  return (
    <S.ExpandedItemBody>
      <S.ExpandedMediaColumn>
        {hasImage ? (
          <S.ExpandedMediaButton
            type="button"
            onClick={() => onPreviewImage?.({ src: imageUrl, name: item.name })}
            aria-label={`Preview image for ${item.name}`}
          >
            <S.ExpandedMediaFrame $hasImage $ambient={useAmbientMediaBackdrop}>
              <S.ExpandedMediaBackdrop
                src={imageUrl}
                alt=""
                aria-hidden="true"
                $ambient={useAmbientMediaBackdrop}
              />
              <S.ExpandedMediaImage
                src={imageUrl}
                alt={`${item.name} preview`}
                $ambient={useAmbientMediaBackdrop}
                onLoad={onMediaLoad}
              />
            </S.ExpandedMediaFrame>
          </S.ExpandedMediaButton>
        ) : (
          <S.ExpandedMediaFrame>
            <S.ExpandedMediaPlaceholder>No image on file</S.ExpandedMediaPlaceholder>
          </S.ExpandedMediaFrame>
        )}
      </S.ExpandedMediaColumn>

      <S.ExpandedTextColumn>
        <S.ExpandedDescriptionBlock title={description || undefined}>
          <S.ExpandedDetailLabel>Description</S.ExpandedDetailLabel>
          {description ? (
            <S.ExpandedDescriptionText>{description}</S.ExpandedDescriptionText>
          ) : (
            <EmptyTelemetry>No description recorded.</EmptyTelemetry>
          )}
        </S.ExpandedDescriptionBlock>

        <S.ExpandedDetailBlock>
          <S.ExpandedDetailLabel>Tags</S.ExpandedDetailLabel>
          {tags.length ? (
            <S.ExpandedTagGrid>
              {tags.map((tag) => (
                <S.ExpandedTagLink
                  key={tag}
                  to={getRetrievalTagHref(tag)}
                  aria-label={`View all items tagged ${tag}`}
                >
                  {tag}
                </S.ExpandedTagLink>
              ))}
            </S.ExpandedTagGrid>
          ) : (
            <EmptyTelemetry>No tags assigned.</EmptyTelemetry>
          )}
        </S.ExpandedDetailBlock>
      </S.ExpandedTextColumn>
    </S.ExpandedItemBody>
  );
}

function NotesContent({ item, notes, onOpen }) {
  return (
    <S.ExpandedNotesPage>
      <S.ExpandedNotesPageHeader>
        <S.ExpandedDetailLabel>Personal Notes</S.ExpandedDetailLabel>
        <span>{notes ? 'Reader available' : 'Blank record'}</span>
      </S.ExpandedNotesPageHeader>

      {notes ? (
        <S.ExpandedNotePreviewButton
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={`Read full notes for ${item.name}`}
        >
          <S.ExpandedNotePreviewText>{notes}</S.ExpandedNotePreviewText>
          <S.ExpandedNotePreviewAction>Open reader ↗</S.ExpandedNotePreviewAction>
        </S.ExpandedNotePreviewButton>
      ) : (
        <S.ExpandedNoteBlank role="status">
          <span>No notes on file</span>
          <small>This page is reserved for the item’s long-form record.</small>
        </S.ExpandedNoteBlank>
      )}
    </S.ExpandedNotesPage>
  );
}

function LogContent({
  maintenanceNotes,
  events,
  provenance,
  externalLinks,
  detailStatus,
}) {
  const hasHistory = events.length > 0;
  const idleCanResolve = detailStatus !== 'loading' && detailStatus !== 'error';
  const idleIsFull = !maintenanceNotes && !provenance.length && !externalLinks.length;

  return (
    <S.ExpandedLogStack>
      {maintenanceNotes ? (
        <S.ExpandedNotesBlock>
          <S.ExpandedDetailLabel>Maintenance Notes</S.ExpandedDetailLabel>
          <S.ExpandedNotesText>{maintenanceNotes}</S.ExpandedNotesText>
        </S.ExpandedNotesBlock>
      ) : null}

      {provenance.length ? (
        <S.ExpandedLogSection>
          <S.ExpandedLogSectionHeader>
            <S.ExpandedDetailLabel>Provenance</S.ExpandedDetailLabel>
            <span>{provenance.length} signals</span>
          </S.ExpandedLogSectionHeader>
          <S.ExpandedLogProvenanceGrid>
            {provenance.map((entry) => (
              <S.ExpandedLogProvenanceCell key={entry.label}>
                <span>{entry.label}</span>
                {entry.href ? (
                  <S.ExpandedLogProvenanceLink to={entry.href}>
                    {entry.value}
                  </S.ExpandedLogProvenanceLink>
                ) : (
                  <strong>{entry.value}</strong>
                )}
              </S.ExpandedLogProvenanceCell>
            ))}
          </S.ExpandedLogProvenanceGrid>
        </S.ExpandedLogSection>
      ) : null}

      <S.ExpandedLogHistoryRegion>
        <S.ExpandedLogSectionHeader>
          <S.ExpandedDetailLabel>Activity History</S.ExpandedDetailLabel>
          <span>{hasHistory ? `${events.length} entries` : '0 entries'}</span>
        </S.ExpandedLogSectionHeader>

        {hasHistory ? (
          <S.ExpandedLogTimeline aria-label="Item activity history">
            {events.map((event) => (
              <S.ExpandedLogEvent key={event.key} $tone={event.tone}>
                <span aria-hidden="true" />
                <div>
                  <strong>{event.label}</strong>
                  <time dateTime={event.iso}>{dateFormatter.format(event.date)}</time>
                </div>
              </S.ExpandedLogEvent>
            ))}
          </S.ExpandedLogTimeline>
        ) : idleCanResolve ? (
          <S.ExpandedLogIdle $full={idleIsFull} role="status">
            <S.ExpandedLogIdleContent>
              <S.ExpandedLogIdleSignal aria-hidden="true"><span /></S.ExpandedLogIdleSignal>
              <strong>No item history present</strong>
              <p>Used, checked, maintained, and acquisition events will appear here.</p>
              <span>LOG CHANNEL // STANDBY</span>
            </S.ExpandedLogIdleContent>
          </S.ExpandedLogIdle>
        ) : (
          <S.ExpandedDetailSignal role={detailStatus === 'error' ? 'alert' : 'status'}>
            {detailStatus === 'error'
              ? 'Extended activity history unavailable.'
              : 'Loading activity history…'}
          </S.ExpandedDetailSignal>
        )}
      </S.ExpandedLogHistoryRegion>

      {externalLinks.length ? (
        <S.ExpandedDetailBlock>
          <S.ExpandedDetailLabel>External References</S.ExpandedDetailLabel>
          <S.ExpandedExternalLinks>
            {externalLinks.map((link) => (
              <S.ExpandedExternalLink
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>REF //</span>
                {link.label}
              </S.ExpandedExternalLink>
            ))}
          </S.ExpandedExternalLinks>
        </S.ExpandedDetailBlock>
      ) : null}

    </S.ExpandedLogStack>
  );
}

function DataTable({ title, rows }) {
  return (
    <S.ExpandedDataTable>
      <caption>{title} metadata telemetry</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            <td>{row.value || '—'}</td>
          </tr>
        ))}
      </tbody>
    </S.ExpandedDataTable>
  );
}

function DataContent({ pages, detailResource, itemId }) {
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [itemId]);

  const safePages = Array.isArray(pages) && pages.length
    ? pages
    : [{ key: 'metadata', label: 'Metadata', rows: [] }];
  const activeIndex = Math.min(pageIndex, safePages.length - 1);
  const activePage = safePages[activeIndex];
  const movePage = (direction) => {
    setPageIndex((current) => (
      (current + direction + safePages.length) % safePages.length
    ));
  };
  const handlePageKeyDown = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
      return;
    }
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? safePages.length - 1
        : (activeIndex + (event.key === 'ArrowRight' ? 1 : -1) + safePages.length) % safePages.length;
    const tablist = event.currentTarget;
    setPageIndex(nextIndex);
    window.requestAnimationFrame(() => {
      tablist.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
    });
  };

  return (
    <S.ExpandedDataStack>
      {detailResource?.status === 'loading' ? (
        <S.ExpandedDetailSignal role="status">Hydrating full item record…</S.ExpandedDetailSignal>
      ) : null}

      {detailResource?.status === 'error' ? (
        <S.ExpandedDetailError role="alert">
          <span>{detailResource.error || 'Full item record unavailable.'}</span>
          <S.ExpandedDetailRetry
            type="button"
            onClick={detailResource.retry}
          >
            Retry data link
          </S.ExpandedDetailRetry>
        </S.ExpandedDetailError>
      ) : null}

      <S.ExpandedDataPager aria-label="Data field pages">
        <S.ExpandedDataPagerHeader>
          <S.ExpandedDetailLabel>Field bank</S.ExpandedDetailLabel>
          <S.ExpandedDataPagerPosition aria-live="polite">
            {String(activeIndex + 1).padStart(2, '0')} / {String(safePages.length).padStart(2, '0')}
          </S.ExpandedDataPagerPosition>
        </S.ExpandedDataPagerHeader>
        <S.ExpandedDataPagerTabs
          role="tablist"
          aria-label="Item data domains"
          onKeyDown={handlePageKeyDown}
        >
          {safePages.map((page, index) => (
            <S.ExpandedDataPagerTab
              key={page.key}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              tabIndex={index === activeIndex ? 0 : -1}
              $active={index === activeIndex}
              onClick={() => setPageIndex(index)}
            >
              {page.label}
            </S.ExpandedDataPagerTab>
          ))}
        </S.ExpandedDataPagerTabs>
        <S.ExpandedDataPagerBody>
          <S.ExpandedDataPagerArrow
            type="button"
            aria-label="Previous data field page"
            onClick={() => movePage(-1)}
          >
            ←
          </S.ExpandedDataPagerArrow>
          <DataTable title={activePage.label} rows={activePage.rows} />
          <S.ExpandedDataPagerArrow
            type="button"
            aria-label="Next data field page"
            onClick={() => movePage(1)}
          >
            →
          </S.ExpandedDataPagerArrow>
        </S.ExpandedDataPagerBody>
      </S.ExpandedDataPager>
    </S.ExpandedDataStack>
  );
}

function CommandsContent({
  item,
  telemetry,
  pendingAction,
  canRunActions,
  actionBusy,
  maintenanceActionType,
  maintenanceActionLabel,
  editHref,
  itemNavigationState,
  onRunAction,
}) {
  return (
    <S.ExpandedCommandStack>
      <S.ExpandedLifecycleGrid aria-label="Item lifecycle telemetry">
        {telemetry.map((entry) => (
          <S.ExpandedLifecycleCell key={entry.label}>
            <span>{entry.label}</span>
            <strong>{entry.value}</strong>
          </S.ExpandedLifecycleCell>
        ))}
      </S.ExpandedLifecycleGrid>

      <S.ExpandedActionRow role="group" aria-label={`Quick actions for ${item.name}`}>
        <S.ExpandedActionButton
          type="button"
          onClick={() => onRunAction('used')}
          disabled={!canRunActions || actionBusy}
          $tone="used"
          aria-label="Used"
        >
          <S.ExpandedActionCode>01 // Log</S.ExpandedActionCode>
          <S.ExpandedActionLabel>
            {pendingAction === 'used' ? 'Saving…' : 'Used'}
          </S.ExpandedActionLabel>
        </S.ExpandedActionButton>
        <S.ExpandedActionButton
          type="button"
          onClick={() => onRunAction('checked')}
          disabled={!canRunActions || actionBusy}
          $tone="checked"
          aria-label="Checked"
        >
          <S.ExpandedActionCode>02 // Scan</S.ExpandedActionCode>
          <S.ExpandedActionLabel>
            {pendingAction === 'checked' ? 'Saving…' : 'Checked'}
          </S.ExpandedActionLabel>
        </S.ExpandedActionButton>
        <S.ExpandedActionButton
          type="button"
          onClick={() => onRunAction(maintenanceActionType)}
          disabled={!canRunActions || actionBusy}
          $tone={maintenanceActionType}
          aria-label={maintenanceActionLabel}
        >
          <S.ExpandedActionCode>
            03 // {maintenanceActionType === 'consumed' ? 'Cycle' : 'Service'}
          </S.ExpandedActionCode>
          <S.ExpandedActionLabel>
            {pendingAction === maintenanceActionType ? 'Saving…' : maintenanceActionLabel}
          </S.ExpandedActionLabel>
        </S.ExpandedActionButton>
        {editHref ? (
          <S.ExpandedActionLink
            to={editHref}
            state={itemNavigationState}
            aria-label="Edit"
          >
            <S.ExpandedActionCode>04 // File</S.ExpandedActionCode>
            <S.ExpandedActionLabel>Edit</S.ExpandedActionLabel>
          </S.ExpandedActionLink>
        ) : null}
      </S.ExpandedActionRow>
    </S.ExpandedCommandStack>
  );
}

export default function RetrievalExpandedPanel({
  item,
  panelId,
  detailResource,
  themeStyle,
  activeSectionKey: controlledSectionKey,
  onSectionChange,
  onLifecycleAction,
  onPreviewImage,
  itemNavigationState,
}) {
  const resolvedItem = item && typeof item === 'object' ? item : null;
  const fullItem =
    detailResource?.data && typeof detailResource.data === 'object'
      ? detailResource.data
      : null;
  const [pendingAction, setPendingAction] = useState('');
  const [localSectionKey, setLocalSectionKey] = useState('overview');
  const [mediaShape, setMediaShape] = useState('');
  const [noteReaderOpen, setNoteReaderOpen] = useState(false);
  const touchStartRef = useRef(null);
  const isCompactDeck = useIsMobile(899);
  const activeSectionKey = controlledSectionKey || localSectionKey;

  const description = firstText(fullItem?.description, resolvedItem?.description);
  const notes = firstText(fullItem?.notes, resolvedItem?.notes);
  const tags = useMemo(() => (
    Array.isArray(fullItem?.tags)
      ? fullItem.tags.map(toText).filter(Boolean)
      : Array.isArray(resolvedItem?.tags)
        ? resolvedItem.tags.map(toText).filter(Boolean)
        : []
  ), [fullItem, resolvedItem]);
  const boxNumber = firstText(
    fullItem?.box?.box_id,
    fullItem?.box?.boxId,
    resolvedItem?.boxNumber,
  );
  const externalLinks = normalizeLinks(fullItem?.links);
  const sourceBatch = formatSourceBatch(fullItem?.sourceBatch, fullItem?.sourceBatchId);
  const isConsumable =
    fullItem?.isConsumable == null
      ? Boolean(resolvedItem?.isConsumable)
      : Boolean(fullItem.isConsumable);
  const maintenanceActionType = isConsumable ? 'consumed' : 'maintained';
  const maintenanceActionLabel = isConsumable ? 'Consumed' : 'Maintained';
  const imageUrl = firstText(
    resolvedItem?.previewImageUrl,
    getItemPreviewImageUrl(fullItem),
    resolvedItem?.imageUrl,
  );
  const useAmbientMediaBackdrop = mediaShape === 'portrait' || mediaShape === 'square';
  const editHref = useMemo(() => {
    const href = toText(resolvedItem?.itemHref);
    return href;
  }, [resolvedItem?.itemHref]);
  const canRunActions = typeof onLifecycleAction === 'function' && Boolean(resolvedItem?.id);
  const actionBusy = Boolean(pendingAction);

  const lifecycleHistories = useMemo(() => ({
    usage: Array.isArray(fullItem?.usageHistory)
      ? fullItem.usageHistory
      : Array.isArray(resolvedItem?.usageHistory)
        ? resolvedItem.usageHistory
        : [],
    checks: Array.isArray(fullItem?.checkHistory)
      ? fullItem.checkHistory
      : Array.isArray(resolvedItem?.checkHistory)
        ? resolvedItem.checkHistory
        : [],
    maintenance: Array.isArray(fullItem?.maintenanceHistory)
      ? fullItem.maintenanceHistory
      : Array.isArray(resolvedItem?.maintenanceHistory)
        ? resolvedItem.maintenanceHistory
        : [],
  }), [fullItem, resolvedItem]);

  const logProvenance = useMemo(() => {
    const entries = [];
    if (fullItem?.acquisitionType && fullItem.acquisitionType !== 'unknown') {
      entries.push({ label: 'Acquisition', value: humanize(fullItem.acquisitionType) });
    }
    if (toText(fullItem?.source)) {
      entries.push({ label: 'Source', value: humanize(fullItem.source) });
    }
    if (sourceBatch.label) {
      entries.push({
        label: 'Source Batch',
        value: sourceBatch.label,
        href: sourceBatch.href,
      });
    }
    return entries;
  }, [fullItem, sourceBatch.href, sourceBatch.label]);

  const logEvents = useMemo(() => {
    const events = [];
    const appendEvents = (history, fallbackValue, tone, label) => {
      normalizeEventDates(history, fallbackValue).forEach((entry) => {
        events.push({
          ...entry,
          key: `${tone}-${entry.iso}`,
          tone,
          label,
        });
      });
    };

    appendEvents(
      lifecycleHistories.usage,
      firstText(fullItem?.dateLastUsed, resolvedItem?.dateLastUsed),
      'used',
      'Used',
    );
    appendEvents(
      lifecycleHistories.checks,
      firstText(fullItem?.lastCheckedAt, resolvedItem?.lastCheckedAt),
      'checked',
      'Checked',
    );
    appendEvents(
      lifecycleHistories.maintenance,
      firstText(fullItem?.lastMaintainedAt, resolvedItem?.lastMaintainedAt),
      'maintained',
      isConsumable ? 'Consumed / serviced' : 'Maintained',
    );
    appendEvents([], firstText(fullItem?.dateAcquired, resolvedItem?.dateAcquired), 'acquired', 'Acquired');

    return events.sort((left, right) => right.timestamp - left.timestamp);
  }, [fullItem, isConsumable, lifecycleHistories, resolvedItem]);

  const dataPages = useMemo(() => {
    const ownership = getItemOwnershipContext(fullItem || resolvedItem || {});
    const box = ownership.box || fullItem?.box || null;
    const keepPriority = normalizeKeepPriority(
      fullItem?.keepPriority ?? resolvedItem?.keepPriority,
    );
    const keepPriorityLabel = formatKeepPriorityLabel(
      fullItem?.keepPriority ?? resolvedItem?.keepPriorityLabel ?? keepPriority,
    );
    const categoryValue = fullItem?.category ?? resolvedItem?.categoryKey;
    const categoryLabel = categoryValue
      ? formatItemCategory(normalizeItemCategory(categoryValue))
      : firstText(resolvedItem?.categoryLabel);
    const placementState = fullItem?.orphanedAt || (!boxNumber && !fullItem?.box)
      ? 'Orphaned'
      : 'Assigned';
    const usageHistory = lifecycleHistories.usage;
    const checkHistory = lifecycleHistories.checks;
    const maintenanceHistory = lifecycleHistories.maintenance;
    const tagsValue = tags.length ? tags.join(' · ') : '—';
    const linksValue = externalLinks.length
      ? externalLinks.map((link) => link.label).join(' · ')
      : '—';
    const sourceValue = firstText(fullItem?.source, resolvedItem?.source) || '—';
    const boxValue = boxNumber || box?.label
      ? [boxNumber ? `#${boxNumber}` : '', box?.label || resolvedItem?.boxName || '']
        .filter(Boolean)
        .join(' · ')
      : '—';
    const historyValue = (history) => history.length
      ? history.map(formatDate).join(' · ')
      : '—';
    const itemName = firstText(fullItem?.name, resolvedItem?.name) || '—';
    const descriptionValue = firstText(fullItem?.description, resolvedItem?.description) || '—';
    const locationValue = firstText(
      ownership.effectiveLocation,
      fullItem?.location,
      resolvedItem?.locationLabel,
    ) || '—';
    const boxGroupValue = firstText(
      ownership.effectiveBoxGroup,
      fullItem?.boxGroup,
      fullItem?.box?.group,
    ) || '—';
    const valueValue = Number(fullItem?.valueCents) > 0
      ? usdFormatter.format(fullItem.valueCents / 100)
      : Number.isFinite(Number(fullItem?.value))
        ? usdFormatter.format(Number(fullItem.value))
        : '—';
    const purchasePriceValue = Number.isFinite(Number(fullItem?.purchasePriceCents))
      ? usdFormatter.format(Number(fullItem.purchasePriceCents) / 100)
      : '—';
    const dateAcquiredValue = formatDate(fullItem?.dateAcquired || resolvedItem?.dateAcquired);
    const sourceBatchRecord = firstText(fullItem?.sourceBatchId, resolvedItem?.sourceBatchId) || '—';
    const sourceBatchStatus = firstText(fullItem?.sourceBatch?.archiveStatus) || '—';
    const page = (key, label, rows) => ({ key, label, rows });

    return [
      page('identity', 'Identity', [
        { label: 'Name', value: itemName },
        { label: 'Description', value: descriptionValue },
        { label: 'Category', value: categoryLabel || '—' },
        { label: 'Tags', value: tagsValue },
        { label: 'Inventory State', value: humanize(fullItem?.item_status || 'active') },
        { label: 'Placement State', value: placementState },
      ]),
      page('inventory', 'Inventory', [
        { label: 'Quantity', value: Number.isFinite(Number(fullItem?.quantity)) ? String(fullItem.quantity) : '—' },
        { label: 'Estimated Value', value: valueValue },
        { label: 'Purchase Price', value: purchasePriceValue },
        { label: 'Consumable', value: isConsumable ? 'Yes' : 'No' },
        { label: 'Declutter Readiness', value: humanize(fullItem?.declutterReadiness) },
        { label: 'Declutter State', value: humanize(fullItem?.declutterExitState) },
      ]),
      page('placement', 'Placement', [
        { label: 'Assignment', value: placementState },
        { label: 'Box', value: boxValue },
        { label: 'Location', value: locationValue },
        { label: 'Box Group', value: boxGroupValue },
        { label: 'Depth', value: fullItem?.depth ?? '—' },
        { label: 'Top Box', value: fullItem?.topBox?.label || fullItem?.topBox?.box_id || '—' },
        { label: 'Orphaned At', value: formatDate(fullItem?.orphanedAt) },
      ]),
      page('retention', 'Retention', [
        { label: 'Keep Priority', value: keepPriorityLabel || '—' },
        { label: 'Primary Owner', value: firstText(fullItem?.primaryOwnerName, resolvedItem?.primaryOwnerName) || '—' },
        { label: 'Condition', value: humanize(fullItem?.condition) },
        { label: 'Acquisition Type', value: humanize(fullItem?.acquisitionType) },
        { label: 'Date Acquired', value: dateAcquiredValue },
      ]),
      page('activity', 'Activity', [
        { label: 'Last Used', value: formatDate(latestDate(fullItem?.dateLastUsed, usageHistory)) },
        { label: 'Last Checked', value: formatDate(latestDate(fullItem?.lastCheckedAt, checkHistory)) },
        { label: 'Use History', value: historyValue(usageHistory) },
        { label: 'Check History', value: historyValue(checkHistory) },
        { label: 'Average Interval', value: Number.isFinite(fullItem?.avgUseIntervalDays) ? `${fullItem.avgUseIntervalDays} days` : '—' },
        { label: 'Disposition', value: humanize(fullItem?.disposition) },
        { label: 'Disposition At', value: formatDate(fullItem?.disposition_at) },
        { label: 'Disposition Notes', value: firstText(fullItem?.disposition_notes) || '—' },
      ]),
      page('care', 'Care', [
        { label: 'Last Maintained', value: formatDate(latestDate(fullItem?.lastMaintainedAt, maintenanceHistory)) },
        { label: 'Maintenance Interval', value: Number.isFinite(fullItem?.maintenanceIntervalDays) ? `${fullItem.maintenanceIntervalDays} days` : '—' },
        { label: 'Maintenance History', value: historyValue(maintenanceHistory) },
        { label: 'Maintenance Notes', value: firstText(fullItem?.maintenanceNotes) || '—' },
      ]),
      page('provenance', 'Provenance', [
        { label: 'Source', value: sourceValue },
        { label: 'Source Batch', value: sourceBatch.label || '—' },
        { label: 'Source Batch Record', value: sourceBatchRecord },
        { label: 'Batch Status', value: sourceBatchStatus },
        { label: 'Batch Imported', value: formatDate(fullItem?.sourceBatch?.importedAt) },
        { label: 'Batch Archived', value: formatDate(fullItem?.sourceBatch?.archivedAt) },
        { label: 'External Links', value: linksValue },
      ]),
      page('admin', 'Admin', [
        { label: 'Item ID', value: fullItem?._id || resolvedItem?.id || '—' },
        { label: 'Image Path', value: firstText(fullItem?.imagePath) || '—' },
        { label: 'Created', value: formatDate(fullItem?.createdAt || fullItem?.created_at) },
        { label: 'Updated', value: formatDate(fullItem?.updatedAt || fullItem?.updated_at) },
      ]),
    ];
  }, [boxNumber, externalLinks, fullItem, isConsumable, lifecycleHistories, resolvedItem, sourceBatch, tags]);

  const lifecycleTelemetry = useMemo(() => {
    const telemetry = [
      {
        label: 'Latest Used',
        value: formatDate(latestDate(fullItem?.dateLastUsed, lifecycleHistories.usage)),
      },
      { label: 'Use Events', value: String(lifecycleHistories.usage.length) },
      {
        label: 'Latest Checked',
        value: formatDate(latestDate(fullItem?.lastCheckedAt, lifecycleHistories.checks)),
      },
      { label: 'Check Events', value: String(lifecycleHistories.checks.length) },
      {
        label: 'Latest Maintained',
        value: formatDate(latestDate(fullItem?.lastMaintainedAt, lifecycleHistories.maintenance)),
      },
      { label: 'Service Events', value: String(lifecycleHistories.maintenance.length) },
    ];

    if (Number.isFinite(fullItem?.maintenanceIntervalDays)) {
      telemetry.push({
        label: 'Maintenance Interval',
        value: `${fullItem.maintenanceIntervalDays} days`,
      });
    }
    if (Number.isFinite(fullItem?.avgUseIntervalDays)) {
      telemetry.push({
        label: 'Average Use Interval',
        value: `${fullItem.avgUseIntervalDays} days`,
      });
    }
    return telemetry;
  }, [fullItem, lifecycleHistories]);

  const selectSection = useCallback((key) => {
    setLocalSectionKey(key);
    onSectionChange?.(key);
  }, [onSectionChange]);

  const activeSectionIndex = Math.max(DECK_SECTIONS.indexOf(activeSectionKey), 0);

  const setSectionIndex = useCallback((rawIndex) => {
    const nextIndex = (rawIndex + DECK_SECTIONS.length) % DECK_SECTIONS.length;
    selectSection(DECK_SECTIONS[nextIndex]);
  }, [selectSection]);

  const moveSection = useCallback(
    (direction) => setSectionIndex(activeSectionIndex + direction),
    [activeSectionIndex, setSectionIndex],
  );

  useEffect(() => {
    setMediaShape('');
  }, [imageUrl]);

  useEffect(() => {
    setNoteReaderOpen(false);
  }, [resolvedItem?.id]);

  const handleMediaLoad = useCallback((event) => {
    const width = Number(event.currentTarget?.naturalWidth) || 0;
    const height = Number(event.currentTarget?.naturalHeight) || 0;
    if (!width || !height) return;

    const ratio = width / height;
    if (ratio < 0.9) setMediaShape('portrait');
    else if (ratio <= 1.12) setMediaShape('square');
    else setMediaShape('landscape');
  }, []);

  const handleTabKeyDown = useCallback(
    (event) => {
      let nextIndex = null;
      if (event.key === 'ArrowRight') nextIndex = activeSectionIndex + 1;
      if (event.key === 'ArrowLeft') nextIndex = activeSectionIndex - 1;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = DECK_SECTIONS.length - 1;
      if (nextIndex == null) return;

      event.preventDefault();
      const normalizedIndex =
        (nextIndex + DECK_SECTIONS.length) % DECK_SECTIONS.length;
      setSectionIndex(normalizedIndex);
      const tabs = event.currentTarget.querySelectorAll('[role="tab"]');
      window.requestAnimationFrame(() => tabs[normalizedIndex]?.focus());
    },
    [activeSectionIndex, setSectionIndex],
  );

  const handleTouchStart = useCallback(
    (event) => {
      if (!isCompactDeck) return;
      const touch = event.touches?.[0];
      if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [isCompactDeck],
  );

  const handleTouchEnd = useCallback(
    (event) => {
      if (!isCompactDeck || !touchStartRef.current) return;
      const touch = event.changedTouches?.[0];
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
      moveSection(deltaX < 0 ? 1 : -1);
    },
    [isCompactDeck, moveSection],
  );

  const runAction = useCallback(
    async (action) => {
      if (!canRunActions || !action || actionBusy) return;
      try {
        setPendingAction(action);
        await onLifecycleAction(resolvedItem, action);
      } catch {
        // The lifecycle callback reports errors through the header Toast system.
      } finally {
        setPendingAction('');
      }
    },
    [actionBusy, canRunActions, onLifecycleAction, resolvedItem],
  );

  if (!resolvedItem) return null;

  const isSectionActive = (key) => !isCompactDeck || activeSectionKey === key;
  const sectionPanelId = (key) => `${panelId}-${key}`;
  const sectionTabId = (key) => `${panelId}-${key}-tab`;

  return (
    <>
      <S.ExpandedPanel
        id={panelId}
        role="region"
        aria-label={`Retrieval details for ${resolvedItem.name}`}
      >
      <S.ExpandedDeckNav
        role="tablist"
        aria-label={`Information sections for ${resolvedItem.name}`}
        onKeyDown={handleTabKeyDown}
      >
        {DECK_SECTIONS.map((key) => {
          const definition = DECK_SECTION_DEFINITIONS[key];
          const isActive = activeSectionKey === key;
          return (
            <S.ExpandedDeckTab
              key={key}
              id={sectionTabId(key)}
              type="button"
              role="tab"
              aria-controls={sectionPanelId(key)}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              $active={isActive}
              onClick={() => selectSection(key)}
            >
              <span>{definition.code}</span>
              {definition.label}
            </S.ExpandedDeckTab>
          );
        })}
      </S.ExpandedDeckNav>

      <S.ExpandedDeckViewport
        $hasOverview
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <S.ExpandedDeckSection
          id={sectionPanelId('overview')}
          role="tabpanel"
          aria-labelledby={sectionTabId('overview')}
          hidden={isCompactDeck && !isSectionActive('overview')}
          aria-hidden={isCompactDeck && !isSectionActive('overview')}
          $active={isSectionActive('overview')}
          $section="overview"
          $hasOverview
        >
          <S.ExpandedPanelTitle>01 // Overview</S.ExpandedPanelTitle>
          <OverviewContent
            item={resolvedItem}
            description={description}
            tags={tags}
            imageUrl={imageUrl}
            useAmbientMediaBackdrop={useAmbientMediaBackdrop}
            onMediaLoad={handleMediaLoad}
            onPreviewImage={onPreviewImage}
          />
        </S.ExpandedDeckSection>

        <S.ExpandedDeckSection
          id={sectionPanelId('notes')}
          role="tabpanel"
          aria-labelledby={sectionTabId('notes')}
          hidden={isCompactDeck && !isSectionActive('notes')}
          aria-hidden={isCompactDeck && !isSectionActive('notes')}
          $active={isSectionActive('notes')}
          $section="notes"
          $hasOverview
        >
          <S.ExpandedPanelTitle>02 // Notes</S.ExpandedPanelTitle>
          <NotesContent
            item={resolvedItem}
            notes={notes}
            onOpen={() => setNoteReaderOpen(true)}
          />
        </S.ExpandedDeckSection>

        <S.ExpandedDeckSection
          id={sectionPanelId('log')}
          role="tabpanel"
          aria-labelledby={sectionTabId('log')}
          hidden={isCompactDeck && !isSectionActive('log')}
          aria-hidden={isCompactDeck && !isSectionActive('log')}
          $active={isSectionActive('log')}
          $section="log"
          $hasOverview
        >
          <S.ExpandedPanelTitle>03 // Log</S.ExpandedPanelTitle>
          <LogContent
            maintenanceNotes={toText(fullItem?.maintenanceNotes)}
            events={logEvents}
            provenance={logProvenance}
            externalLinks={externalLinks}
            detailStatus={detailResource?.status}
          />
        </S.ExpandedDeckSection>

        <S.ExpandedDeckSection
          id={sectionPanelId('data')}
          role="tabpanel"
          aria-labelledby={sectionTabId('data')}
          hidden={isCompactDeck && !isSectionActive('data')}
          aria-hidden={isCompactDeck && !isSectionActive('data')}
          $active={isSectionActive('data')}
          $section="data"
          $hasOverview
        >
          <S.ExpandedPanelTitle>04 // Data</S.ExpandedPanelTitle>
          <DataContent
            pages={dataPages}
            detailResource={detailResource}
            itemId={resolvedItem.id}
          />
        </S.ExpandedDeckSection>

        <S.ExpandedDeckSection
          id={sectionPanelId('commands')}
          role="tabpanel"
          aria-labelledby={sectionTabId('commands')}
          hidden={isCompactDeck && !isSectionActive('commands')}
          aria-hidden={isCompactDeck && !isSectionActive('commands')}
          $active={isSectionActive('commands')}
          $section="commands"
          $hasOverview
        >
          <S.ExpandedPanelTitle>05 // Commands</S.ExpandedPanelTitle>
          <CommandsContent
            item={resolvedItem}
            telemetry={lifecycleTelemetry}
            pendingAction={pendingAction}
            canRunActions={canRunActions}
            actionBusy={actionBusy}
            maintenanceActionType={maintenanceActionType}
            maintenanceActionLabel={maintenanceActionLabel}
            editHref={editHref}
            itemNavigationState={itemNavigationState}
            onRunAction={runAction}
          />
        </S.ExpandedDeckSection>
      </S.ExpandedDeckViewport>

      <S.ExpandedDeckFooter>
        <S.ExpandedDeckArrow
          type="button"
          onClick={() => moveSection(-1)}
          aria-label="Previous information section"
        >
          ← Prev
        </S.ExpandedDeckArrow>
        <S.ExpandedDeckPosition aria-live="polite">
          {String(activeSectionIndex + 1).padStart(2, '0')} /{' '}
          {String(DECK_SECTIONS.length).padStart(2, '0')}
        </S.ExpandedDeckPosition>
        <S.ExpandedDeckArrow
          type="button"
          onClick={() => moveSection(1)}
          aria-label="Next information section"
        >
          Next →
        </S.ExpandedDeckArrow>
      </S.ExpandedDeckFooter>
      </S.ExpandedPanel>
      {noteReaderOpen && notes ? (
        <NoteReaderModal
          eyebrow="Item notes"
          title={resolvedItem.name}
          titleId={`${panelId}-note-reader-title`}
          notes={notes}
          onClose={() => setNoteReaderOpen(false)}
          themeStyle={themeStyle}
        />
      ) : null}
    </>
  );
}
