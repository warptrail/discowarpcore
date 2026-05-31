import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const BATCHES_PER_PAGE = 50;

const Panel = styled.section`
  border: 1px solid rgba(96, 152, 189, 0.36);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(12, 20, 29, 0.95) 0%, rgba(8, 14, 22, 0.98) 100%);
  padding: 0.82rem;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0.64rem;
  max-height: min(72vh, 820px);
  min-height: 0;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: min(68vh, 680px);
    padding: 0.68rem;
    gap: 0.6rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
  min-width: 0;
`;

const HeaderText = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.88rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e2effc;
`;

const Text = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: #90aac1;
  line-height: 1.4;
`;

const CountChip = styled.div`
  border-radius: 999px;
  border: 1px solid rgba(88, 143, 184, 0.36);
  background: rgba(10, 22, 33, 0.92);
  color: #bfdaee;
  padding: 0.22rem 0.5rem;
  font-size: 0.68rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  flex: 0 0 auto;
`;

const List = styled.div`
  display: grid;
  gap: 0.34rem;
  align-content: start;
  min-width: 0;
`;

const Section = styled.div`
  display: grid;
  gap: 0.34rem;
  min-height: 0;
  min-width: 0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.48rem;
  min-width: 0;
`;

const SectionTitle = styled.div`
  font-size: 0.67rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8eb1cc;
`;

const QueueRow = styled.button`
  text-align: left;
  width: 100%;
  min-width: 0;
  border-radius: 10px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'rgba(125, 193, 239, 0.78)' : 'rgba(87, 128, 160, 0.28)'};
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(180deg, rgba(24, 58, 81, 0.98) 0%, rgba(17, 38, 55, 0.98) 100%)'
      : 'linear-gradient(180deg, rgba(11, 21, 31, 0.96) 0%, rgba(8, 16, 24, 0.98) 100%)'};
  box-shadow: ${({ $selected }) =>
    $selected ? '0 0 0 1px rgba(118, 184, 228, 0.16)' : 'none'};
  color: #d9ebfb;
  padding: 0.62rem 0.68rem 0.62rem 0.82rem;
  display: grid;
  gap: 0.3rem;
  cursor: pointer;
  position: relative;
  transition:
    border-color 140ms ease,
    background 140ms ease,
    transform 140ms ease,
    box-shadow 140ms ease;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $selected }) => ($selected ? '6px' : '3px')};
    border-radius: 10px 0 0 10px;
    background: ${({ $selected, $accentTone }) => {
      if ($accentTone === 'archived') {
        return $selected
          ? 'linear-gradient(180deg, #df7b7b 0%, #b34d4d 100%)'
          : 'rgba(179, 77, 77, 0.6)';
      }
      if ($accentTone === 'imported') {
        return $selected
          ? 'linear-gradient(180deg, #8fe1b8 0%, #5dbd89 100%)'
          : 'rgba(93, 189, 137, 0.58)';
      }
      if ($accentTone === 'validated') {
        return $selected
          ? 'linear-gradient(180deg, #f1c676 0%, #d39a38 100%)'
          : 'rgba(211, 154, 56, 0.58)';
      }
      if ($accentTone === 'failed') {
        return $selected
          ? 'linear-gradient(180deg, #ea908f 0%, #ce6563 100%)'
          : 'rgba(206, 101, 99, 0.58)';
      }
      return $selected
        ? 'linear-gradient(180deg, #8ec3f3 0%, #5d97d4 100%)'
        : 'rgba(81, 121, 151, 0.44)';
    }};
  }

  &:hover {
    border-color: ${({ $selected }) =>
      $selected ? 'rgba(125, 193, 239, 0.84)' : 'rgba(102, 167, 212, 0.48)'};
    background: ${({ $selected }) =>
      $selected
        ? 'linear-gradient(180deg, rgba(27, 64, 89, 0.98) 0%, rgba(19, 42, 60, 0.98) 100%)'
        : 'linear-gradient(180deg, rgba(13, 25, 37, 0.98) 0%, rgba(10, 19, 29, 0.98) 100%)'};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(145, 187, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(91, 141, 236, 0.22);
  }
`;

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
`;

const BatchName = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: #e9f5ff;
  line-height: 1.2;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const StatePill = styled.div`
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(104, 177, 141, 0.5)'
        : $tone === 'warning'
          ? 'rgba(201, 163, 97, 0.5)'
          : $tone === 'error'
            ? 'rgba(206, 114, 114, 0.5)'
            : 'rgba(88, 143, 184, 0.36)'};
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
  padding: 0.14rem 0.42rem;
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  flex: 0 0 auto;
  white-space: nowrap;
`;

const SelectedLine = styled.div`
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7fd3c6;
`;

const SecondaryLine = styled.div`
  font-size: 0.73rem;
  color: #b3cade;
  line-height: 1.35;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const SubduedLine = styled.div`
  font-size: 0.68rem;
  color: #819cb4;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const StageRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
  min-width: 0;
`;

const StageChip = styled.div`
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'stage'
        ? 'rgba(111, 171, 224, 0.44)'
        : $tone === 'validate'
          ? 'rgba(207, 170, 101, 0.44)'
          : 'rgba(104, 177, 141, 0.44)'};
  background: ${({ $active, $tone }) =>
    $active
      ? $tone === 'stage'
        ? 'rgba(16, 34, 49, 0.92)'
        : $tone === 'validate'
          ? 'rgba(49, 35, 16, 0.92)'
          : 'rgba(16, 40, 31, 0.92)'
      : 'rgba(13, 22, 33, 0.82)'};
  color: ${({ $active, $tone }) =>
    $active
      ? $tone === 'stage'
        ? '#9bc7f0'
        : $tone === 'validate'
          ? '#efd2a5'
          : '#c9f1dd'
      : '#85a3bc'};
  padding: 0.14rem 0.38rem;
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Empty = styled.div`
  border-radius: 10px;
  border: 1px dashed rgba(104, 155, 191, 0.46);
  background: rgba(8, 15, 23, 0.78);
  color: #9fb8cf;
  font-size: 0.8rem;
  padding: 0.78rem;
  min-width: 0;
`;

const ScrollArea = styled.div`
  display: grid;
  gap: 0.64rem;
  align-content: start;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.18rem;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.56rem;
  min-width: 0;
  border-top: 1px solid rgba(88, 143, 184, 0.22);
  padding-top: 0.56rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const PageMeta = styled.div`
  color: #9fb8cf;
  font-size: 0.72rem;
  line-height: 1.35;
  min-width: 0;
`;

const PageActions = styled.div`
  display: flex;
  gap: 0.4rem;
  flex: 0 0 auto;
`;

const PageButton = styled.button`
  min-height: 2rem;
  border-radius: 8px;
  border: 1px solid rgba(102, 167, 212, 0.58);
  background: rgba(18, 39, 57, 0.82);
  color: #cfe8fb;
  padding: 0 0.62rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1 1 0;
  }
`;

function toDisplayDate(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
}

function toValidationState(batch) {
  if (batch.validationStatus === 'passed') return { label: 'validation passed', tone: 'success' };
  if (batch.validationStatus === 'failed') return { label: 'validation failed', tone: 'error' };
  return { label: 'not validated', tone: 'default' };
}

function toImportState(batch) {
  if (batch.importLifecycleStatus === 'success') return { label: 'import success', tone: 'success' };
  if (batch.importLifecycleStatus === 'failed') return { label: 'import failed', tone: 'error' };
  return { label: 'not imported', tone: 'default' };
}

function toSourceLine(batch) {
  const hasBatchManifest = Boolean(batch.packageSnapshot?.structureSummary?.hasBatchManifest);
  const manifestLine = hasBatchManifest ? 'Batch manifest accepted' : 'Batch manifest not recorded';
  const payloadLine = batch.aiJsonPresent ? 'schema payload ready' : 'schema payload missing';
  return `${manifestLine} · ${payloadLine}`;
}

function toCountsLine(batch) {
  const rowCount = Number(batch.validationSnapshot?.rowCount) || 0;
  const imageCount =
    Number(batch.sourceManifest?.imageCount)
    || Number(batch.packageSnapshot?.structureSummary?.imageCount)
    || Number(batch.originalImagesCount)
    || 0;
  const imageText = batch.imagesIncluded
    ? `${imageCount} image${imageCount === 1 ? '' : 's'} included`
    : 'no images included';
  return `${rowCount} row${rowCount === 1 ? '' : 's'} · ${imageText}`;
}

function toReceiptState(batch) {
  const receipt = batch?.localReceipt;
  if (!receipt) return { label: 'no receipt', tone: 'default' };
  if (receipt.safeToDelete) return { label: 'safe to delete', tone: 'success' };
  if (receipt.status === 'validation_failed' || receipt.status === 'import_failed') {
    return { label: receipt.status.replace(/_/g, ' '), tone: 'error' };
  }
  return { label: receipt.status.replace(/_/g, ' ') || 'receipt present', tone: 'warning' };
}

function toWorkspaceState(batch) {
  if (batch?.localFolderMissing) {
    return { label: 'legacy folder missing', tone: 'error' };
  }
  if (batch?.isArchived) {
    return { label: 'archived provenance', tone: 'warning' };
  }
  return { label: 'staged package ready', tone: 'success' };
}

function toBatchAccentTone(batch) {
  if (batch?.isArchived) return 'archived';
  if (batch?.importLifecycleStatus === 'failed') return 'failed';
  if (batch?.importLifecycleStatus === 'success') return 'imported';
  if (batch?.validationStatus === 'failed') return 'failed';
  if (batch?.validationStatus === 'passed') return 'validated';
  return 'staged';
}

export default function IntakeBatchList({ batches, selectedBatchId, onSelect }) {
  const safeBatches = useMemo(() => (Array.isArray(batches) ? batches : []), [batches]);
  const { activeBatches, archivedBatches, orderedBatches } = useMemo(() => {
    const nextActiveBatches = safeBatches.filter((batch) => !batch?.isArchived);
    const nextArchivedBatches = safeBatches.filter((batch) => batch?.isArchived);
    return {
      activeBatches: nextActiveBatches,
      archivedBatches: nextArchivedBatches,
      orderedBatches: [...nextActiveBatches, ...nextArchivedBatches],
    };
  }, [safeBatches]);
  const totalPages = Math.max(1, Math.ceil(orderedBatches.length / BATCHES_PER_PAGE));
  const [pageIndex, setPageIndex] = useState(0);
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const pageStart = currentPage * BATCHES_PER_PAGE;
  const pageEnd = Math.min(pageStart + BATCHES_PER_PAGE, orderedBatches.length);
  const currentPageBatches = orderedBatches.slice(pageStart, pageEnd);
  const currentPageBatchIds = new Set(currentPageBatches.map((batch) => batch.id));
  const visibleActiveBatches = activeBatches.filter((batch) => currentPageBatchIds.has(batch.id));
  const visibleArchivedBatches = archivedBatches.filter((batch) => currentPageBatchIds.has(batch.id));
  const hasPagination = orderedBatches.length > BATCHES_PER_PAGE;

  useEffect(() => {
    setPageIndex((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    if (!selectedBatchId || !orderedBatches.length) return;
    const selectedIndex = orderedBatches.findIndex((batch) => batch.id === selectedBatchId);
    if (selectedIndex === -1) return;
    const selectedPage = Math.floor(selectedIndex / BATCHES_PER_PAGE);
    setPageIndex((current) => (current === selectedPage ? current : selectedPage));
  }, [orderedBatches, selectedBatchId]);

  function renderBatchList(rows, { emptyMessage, selectedLabel }) {
    if (!rows.length) {
      return <Empty>{emptyMessage}</Empty>;
    }

    return (
      <List role="listbox" aria-label="Intake batches">
        {rows.map((batch) => {
          const selected = batch.id === selectedBatchId;
          const validationState = toValidationState(batch);
          const importState = toImportState(batch);
          const receiptState = toReceiptState(batch);
          const workspaceState = toWorkspaceState(batch);
          const accentTone = toBatchAccentTone(batch);
          return (
            <QueueRow
              key={batch.id}
              type="button"
              role="option"
              aria-selected={selected}
              $selected={selected}
              $accentTone={accentTone}
              onClick={() => onSelect(batch.id)}
            >
              <RowTop>
                <BatchName>{batch.name}</BatchName>
                <StatePill $tone={batch.isArchived ? 'warning' : validationState.tone}>
                  {batch.isArchived ? 'archived' : validationState.label}
                </StatePill>
              </RowTop>

              <SecondaryLine>{toSourceLine(batch)}</SecondaryLine>
              <SecondaryLine>{toCountsLine(batch)}</SecondaryLine>
              <StageRow>
                <StageChip $tone="stage" $active>
                  staged
                </StageChip>
                <StageChip $tone="validate" $active={batch.validationStatus === 'passed'}>
                  validated
                </StageChip>
                <StageChip $tone="import" $active={batch.importLifecycleStatus === 'success'}>
                  imported
                </StageChip>
              </StageRow>
              <SubduedLine>{importState.label}</SubduedLine>
              <SubduedLine>{workspaceState.label}</SubduedLine>
              <SubduedLine>{receiptState.label}</SubduedLine>
              <SubduedLine>
                {batch.packageSnapshot?.originalPackageFilename
                  ? `Package ${batch.packageSnapshot.originalPackageFilename}`
                  : `Batch ${batch.localFolderName || batch.batchId}`}
                {batch.localReceipt?.updatedAt ? ` · receipt ${toDisplayDate(batch.localReceipt.updatedAt)}` : ''}
              </SubduedLine>
              {batch.isArchived && batch.archiveState?.archivedAt ? (
                <SubduedLine>Archived {toDisplayDate(batch.archiveState.archivedAt)}</SubduedLine>
              ) : null}
              <SubduedLine>Updated {toDisplayDate(batch.updatedAt || batch.createdAt)}</SubduedLine>
              {selected ? <SelectedLine>{selectedLabel}</SelectedLine> : null}
            </QueueRow>
          );
        })}
      </List>
    );
  }

  return (
    <Panel>
      <Header>
        <HeaderText>
          <Title>Existing Batches</Title>
          <Text>Select a staged package batch to review provenance, receipt status, archive state, and import history.</Text>
        </HeaderText>
        <CountChip>{safeBatches.length} batch{safeBatches.length === 1 ? '' : 'es'}</CountChip>
      </Header>

      <ScrollArea>
        <Section>
          <SectionHeader>
            <SectionTitle>Active Batches</SectionTitle>
            <CountChip>
              {visibleActiveBatches.length} of {activeBatches.length}
            </CountChip>
          </SectionHeader>
          {renderBatchList(visibleActiveBatches, {
            emptyMessage: hasPagination
              ? 'No active batches on this page.'
              : 'No active staged packages yet. Upload a Disco Warp Core batch zip to begin.',
            selectedLabel: 'Selected active batch',
          })}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Archived Provenance</SectionTitle>
            <CountChip>
              {visibleArchivedBatches.length} of {archivedBatches.length}
            </CountChip>
          </SectionHeader>
          {renderBatchList(visibleArchivedBatches, {
            emptyMessage: hasPagination ? 'No archived batches on this page.' : 'No archived batches yet.',
            selectedLabel: 'Selected archived batch',
          })}
        </Section>
      </ScrollArea>

      <Pagination aria-label="Batch selector pagination">
        <PageMeta>
          {orderedBatches.length
            ? `Showing ${pageStart + 1}-${pageEnd} of ${orderedBatches.length} batches · Page ${currentPage + 1} of ${totalPages}`
            : 'No batches to paginate'}
        </PageMeta>
        {hasPagination ? (
          <PageActions>
            <PageButton
              type="button"
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              disabled={currentPage <= 0}
              aria-label="Show previous batch page"
            >
              Previous
            </PageButton>
            <PageButton
              type="button"
              onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="Show next batch page"
            >
              Next
            </PageButton>
          </PageActions>
        ) : null}
      </Pagination>
    </Panel>
  );
}
