import { useMemo } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';

const Section = styled.div`
  display: grid;
  gap: 0.58rem;
`;

const Header = styled.div`
  display: grid;
  gap: 0.18rem;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d8e9fa;
`;

const Text = styled.p`
  margin: 0;
  color: #8faac1;
  font-size: 0.74rem;
  line-height: 1.35;
`;

const SummaryCard = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(88, 143, 184, 0.42);
  background: rgba(12, 23, 34, 0.84);
  padding: 0.72rem;
  display: grid;
  gap: 0.56rem;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
`;

const Chip = styled.div`
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(104, 177, 141, 0.54)'
        : $tone === 'warning'
          ? 'rgba(201, 163, 97, 0.5)'
          : $tone === 'error'
            ? 'rgba(206, 114, 114, 0.54)'
            : 'rgba(88, 143, 184, 0.42)'};
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'rgba(16, 40, 31, 0.85)'
      : $tone === 'warning'
        ? 'rgba(51, 35, 16, 0.85)'
        : $tone === 'error'
          ? 'rgba(56, 18, 20, 0.85)'
          : 'rgba(14, 24, 35, 0.85)'};
  color: ${({ $tone }) =>
    $tone === 'success'
      ? '#c9f1dd'
      : $tone === 'warning'
        ? '#efd2a5'
        : $tone === 'error'
          ? '#f2c8c8'
          : '#c2d8ec'};
  padding: 0.18rem 0.44rem;
  font-size: 0.69rem;
  letter-spacing: 0.04em;
`;

const ControlCard = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(88, 143, 184, 0.34);
  background: rgba(9, 17, 25, 0.86);
  padding: 0.72rem;
  display: grid;
  gap: 0.56rem;
`;

const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
`;

const ToggleButton = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 10px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(100, 188, 151, 0.82)' : 'rgba(102, 167, 212, 0.75)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
      : 'linear-gradient(180deg, rgba(26, 60, 83, 0.96) 0%, rgba(17, 43, 62, 0.96) 100%)'};
  color: #e8fff5;
  font-size: 0.79rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 0.8rem;
  cursor: pointer;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Select = styled.select`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 10px;
  border: 1px solid rgba(108, 152, 188, 0.5);
  background: rgba(7, 11, 18, 0.9);
  color: #d7e9fc;
  padding: 0 0.62rem;
  font-size: 0.76rem;
`;

const Ledger = styled.div`
  display: grid;
  gap: 0.46rem;
`;

const ItemCard = styled.label`
  border-radius: 12px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'rgba(122, 194, 149, 0.6)' : 'rgba(88, 143, 184, 0.32)'};
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(180deg, rgba(17, 43, 34, 0.9) 0%, rgba(11, 28, 23, 0.94) 100%)'
      : 'linear-gradient(180deg, rgba(10, 19, 29, 0.92) 0%, rgba(8, 15, 23, 0.96) 100%)'};
  padding: 0.72rem;
  display: grid;
  gap: 0.44rem;
  cursor: ${({ $selectable }) => ($selectable ? 'pointer' : 'default')};
`;

const ItemTop = styled.div`
  display: flex;
  gap: 0.68rem;
  align-items: flex-start;
`;

const Checkbox = styled.input`
  margin-top: 0.08rem;
  width: 1rem;
  height: 1rem;
  accent-color: #69c39f;
`;

const ItemBody = styled.div`
  flex: 1 1 auto;
  display: grid;
  gap: 0.32rem;
`;

const ItemName = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: #e7f4ff;
`;

const MetaLine = styled.div`
  font-size: 0.72rem;
  color: #a7c0d7;
  line-height: 1.35;
`;

const Empty = styled.div`
  border-radius: 10px;
  border: 1px dashed rgba(104, 155, 191, 0.46);
  background: rgba(8, 15, 23, 0.78);
  color: #9fb8cf;
  font-size: 0.8rem;
  padding: 0.8rem;
`;

function toDisplayDate(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
}

function toProcessingLabel(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'processed') return { label: 'processed', tone: 'success' };
  if (normalized === 'queued') return { label: 'queued', tone: 'warning' };
  if (normalized === 'processing') return { label: 'processing', tone: 'warning' };
  if (normalized === 'failed') return { label: 'failed / retry', tone: 'error' };
  if (normalized === 'unavailable') return { label: 'unavailable', tone: 'error' };
  return { label: 'processing not started', tone: 'default' };
}

function normalizeLiveProcessingStatus(jobStatus, fallbackStatus = '') {
  const normalized = String(jobStatus || '').trim().toLowerCase();
  if (normalized === 'running') return 'processing';
  if (normalized === 'completed') return 'processed';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'queued') return 'queued';
  return String(fallbackStatus || '').trim().toLowerCase();
}

function toStageLabel(stage) {
  return String(stage || '')
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDurationSeconds(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '';
  if (value < 60) return `${Math.round(value)}s`;
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  if (seconds <= 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function summarizeProcessing(importedItems = []) {
  return (Array.isArray(importedItems) ? importedItems : []).reduce((summary, item) => {
    const status = String(item?.processing?.status || '').trim().toLowerCase() || 'not_requested';
    summary.total += 1;
    if (status === 'processed') summary.processed += 1;
    else if (status === 'failed') summary.failed += 1;
    else if (status === 'queued') summary.queued += 1;
    else if (status === 'processing') summary.processing += 1;
    else if (status === 'unavailable') summary.unavailable += 1;
    else summary.notRequested += 1;
    return summary;
  }, {
    total: 0,
    processed: 0,
    failed: 0,
    queued: 0,
    processing: 0,
    unavailable: 0,
    notRequested: 0,
  });
}

function formatProcessingSummaryStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized || normalized === 'not_requested') return 'processing idle';
  if (normalized === 'in_progress') return 'processing in progress';
  if (normalized === 'complete') return 'processing complete';
  return `processing ${normalized.replace(/_/g, ' ')}`;
}

export default function IntakeBatchImportedItemsPanel({
  importedItemsPage = null,
  pageState = null,
  processingModeEnabled = false,
  selectedItemIds = [],
  processingSummary = null,
  liveBatchJobSummary = null,
  liveJobProgressByMediaId = null,
  isArchived = false,
  detailLoading = false,
  onToggleProcessingMode,
  onSelectedItemIdsChange,
  onSortChange,
}) {
  const importedItems = useMemo(
    () => (Array.isArray(importedItemsPage?.items) ? importedItemsPage.items : []),
    [importedItemsPage?.items]
  );
  const sortMode = String(pageState?.itemsSort || importedItemsPage?.sort || 'name').trim() || 'name';
  const totalItems = Number(importedItemsPage?.total) || 0;
  const pageOffset = Number(pageState?.itemsOffset ?? importedItemsPage?.offset) || 0;
  const showingStart = totalItems > 0 ? pageOffset + 1 : 0;
  const showingEnd = totalItems > 0 ? Math.min(pageOffset + importedItems.length, totalItems) : 0;

  const summary = useMemo(
    () => summarizeProcessing(importedItems),
    [importedItems]
  );
  const toggleProcessingMode = () => {
    onToggleProcessingMode?.();
  };

  const toggleItemSelection = (itemId) => {
    const targetItem = importedItems.find((entry) => String(entry?.id || '').trim() === itemId);
    if (!targetItem?.processing?.isProcessable) return;
    const current = Array.isArray(selectedItemIds) ? selectedItemIds : [];
    onSelectedItemIdsChange?.(
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId]
    );
  };

  if (!Array.isArray(importedItems) || importedItems.length === 0) {
    return (
      <Section>
        <Header>
          <Title>Imported Items</Title>
          <Text>Imported items from this archival batch appear here once intake import creates them.</Text>
        </Header>
        {detailLoading ? (
          <Empty>Loading imported item ledger…</Empty>
        ) : (
          <Empty>
            {totalItems > 0
              ? 'No imported items are available on this ledger page.'
              : 'No imported items are recorded for this batch yet.'}
          </Empty>
        )}
      </Section>
    );
  }

  return (
    <Section>
      <Header>
        <Title>Imported Items</Title>
        <Text>
          Batch records stay archival. Processing remains an explicit downstream item action from this view.
        </Text>
      </Header>

      <SummaryCard>
        <ChipRow>
          <Chip>{summary.total} item{summary.total === 1 ? '' : 's'}</Chip>
          <Chip $tone="success">{summary.processed} processed</Chip>
          <Chip $tone="warning">{summary.queued + summary.processing} in flight</Chip>
          <Chip>{summary.notRequested} processing not started</Chip>
          <Chip $tone="error">{summary.failed} failed</Chip>
          <Chip $tone="error">{summary.unavailable} unavailable</Chip>
          {liveBatchJobSummary?.total ? (
            <Chip $tone="warning">
              live jobs {liveBatchJobSummary.queued + liveBatchJobSummary.running} active
            </Chip>
          ) : null}
          <Chip $tone={processingSummary?.status === 'complete' ? 'success' : processingSummary?.status === 'failed' ? 'error' : 'default'}>
            {formatProcessingSummaryStatus(processingSummary?.status || 'not_requested')}
          </Chip>
        </ChipRow>
        <Text>
          Processing Mode: {processingModeEnabled ? 'On' : 'Off'}
          {totalItems > 0 ? ` · showing ${showingStart}-${showingEnd} of ${totalItems}` : ''}
          {processingSummary?.lastRequestedAt
            ? ` · last requested ${toDisplayDate(processingSummary.lastRequestedAt)}`
            : ''}
        </Text>
        {liveBatchJobSummary?.total ? (
          <Text>
            Live queue: {liveBatchJobSummary.queued} queued · {liveBatchJobSummary.running} processing · {liveBatchJobSummary.completed} completed · {liveBatchJobSummary.failed} failed
          </Text>
        ) : null}
        {isArchived ? (
          <Text>
            This batch is archived, but processing stays available here because it acts on linked items, not on the batch workflow itself.
          </Text>
        ) : null}
      </SummaryCard>

      <ControlCard>
        <ControlRow>
          <ToggleButton
            type="button"
            $active={processingModeEnabled}
            onClick={toggleProcessingMode}
          >
            {processingModeEnabled ? 'Disable Processing Mode' : 'Enable Processing Mode'}
          </ToggleButton>
        </ControlRow>

        {processingModeEnabled ? (
          <>
            <Text>
              {selectedItemIds.length} selected. Bulk selection, render options, and Process Selected are available in the pinned console above.
            </Text>
            <Select
              aria-label="Sort imported items"
              value={sortMode}
              onChange={(event) => onSortChange?.(event.target.value)}
            >
              <option value="name">Sort: Name</option>
              <option value="status">Sort: Processing Status</option>
              <option value="created">Sort: Created</option>
            </Select>
            <Text>
              Showing {showingStart}-{showingEnd} of {totalItems || 0}.
            </Text>
          </>
        ) : (
          <Text>Enable Processing Mode to reveal selection controls and pin the processing console above.</Text>
        )}
      </ControlCard>

      <Ledger>
        {importedItems.map((item) => {
          const itemId = String(item?.id || '').trim();
          const mediaId = String(item?.image?.mediaId || '').trim();
          const liveJob = mediaId && liveJobProgressByMediaId
            ? liveJobProgressByMediaId[mediaId] || null
            : null;
          const liveStatus = normalizeLiveProcessingStatus(liveJob?.status, item?.processing?.status);
          const processingTone = toProcessingLabel(liveStatus);
          const liveProgressLabel = liveJob
            ? [
                toStageLabel(liveJob?.currentStage || liveJob?.progress?.stage),
                typeof liveJob?.progressPercent === 'number'
                  ? `${Math.round(liveJob.progressPercent)}%`
                  : typeof liveJob?.progress?.progressPercent === 'number'
                    ? `${Math.round(liveJob.progress.progressPercent)}%`
                    : '',
                (() => {
                  const elapsed = formatDurationSeconds(
                    typeof liveJob?.elapsedSeconds === 'number'
                      ? liveJob.elapsedSeconds
                      : liveJob?.progress?.elapsedSeconds
                  );
                  return elapsed ? `elapsed ${elapsed}` : '';
                })(),
                (() => {
                  const eta = formatDurationSeconds(
                    typeof liveJob?.etaSeconds === 'number'
                      ? liveJob.etaSeconds
                      : liveJob?.progress?.etaSeconds
                  );
                  return eta ? `ETA ${eta}` : '';
                })(),
              ]
                .filter(Boolean)
                .join(' · ')
            : '';
          const liveMessage = String(
            liveJob?.message ||
            liveJob?.progress?.message ||
            ''
          ).trim();
          const currentBoxLabel =
            item?.currentBox?.label ||
            item?.location ||
            (item?.orphanedAt ? 'Orphaned' : '');
          const selectable = Boolean(item?.processing?.isProcessable);
          const selectionTitle = selectable
            ? selectedItemIds.includes(itemId)
              ? `Deselect ${item?.name || itemId}`
              : `Select ${item?.name || itemId}`
            : liveStatus === 'processed'
              ? 'Already processed'
              : liveStatus === 'queued' || liveStatus === 'processing'
                ? 'Already processing'
                : 'Unavailable for processing';
          return (
            <ItemCard
              key={itemId}
              $selected={selectedItemIds.includes(itemId)}
              $selectable={processingModeEnabled && selectable}
            >
              <ItemTop>
                {processingModeEnabled ? (
                  <Checkbox
                    type="checkbox"
                    checked={selectedItemIds.includes(itemId)}
                    disabled={!selectable}
                    title={selectionTitle}
                    aria-label={selectionTitle}
                    onChange={() => toggleItemSelection(itemId)}
                  />
                ) : null}
                <ItemBody>
                  <ItemName>{item?.name || itemId}</ItemName>
                  <ChipRow>
                    <Chip $tone={processingTone.tone}>{processingTone.label}</Chip>
                    {item?.processing?.isProcessable ? <Chip>processable</Chip> : null}
                    {item?.processing?.canRetry ? <Chip $tone="warning">retry available</Chip> : null}
                    {item?.processing?.hasProcessedOutput ? <Chip $tone="success">output present</Chip> : null}
                    {liveProgressLabel ? <Chip $tone="warning">{liveProgressLabel}</Chip> : null}
                  </ChipRow>
                  <MetaLine>
                    Item {itemId}
                    {currentBoxLabel ? ` · ${currentBoxLabel}` : ''}
                    {item?.image?.originalName ? ` · ${item.image.originalName}` : ''}
                  </MetaLine>
                  <MetaLine>
                    Media: {liveStatus === 'processing' ? 'processing' : liveStatus === 'queued' ? 'queued' : item?.processing?.mediaStatus || 'ready_for_processing'}
                    {item?.processing?.processedAt ? ` · completed ${toDisplayDate(item.processing.processedAt)}` : ''}
                  </MetaLine>
                  {liveMessage ? <MetaLine>{liveMessage}</MetaLine> : null}
                  {item?.processing?.processingError?.message ? (
                    <MetaLine>{item.processing.processingError.message}</MetaLine>
                  ) : null}
                  {liveStatus === 'failed' && liveJob?.error?.message ? (
                    <MetaLine>{liveJob.error.message}</MetaLine>
                  ) : null}
                </ItemBody>
              </ItemTop>
            </ItemCard>
          );
        })}
      </Ledger>
    </Section>
  );
}
