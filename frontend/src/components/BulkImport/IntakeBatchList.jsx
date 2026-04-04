import styled from 'styled-components';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const Panel = styled.section`
  border: 1px solid rgba(96, 152, 189, 0.36);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(12, 20, 29, 0.95) 0%, rgba(8, 14, 22, 0.98) 100%);
  padding: 0.82rem;
  display: grid;
  gap: 0.64rem;
  align-content: start;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.68rem;
    gap: 0.6rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
`;

const HeaderText = styled.div`
  display: grid;
  gap: 0.2rem;
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
`;

const List = styled.div`
  display: grid;
  gap: 0.34rem;
  align-content: start;
`;

const Section = styled.div`
  display: grid;
  gap: 0.34rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.48rem;
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
`;

const BatchName = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: #e9f5ff;
  line-height: 1.2;
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
`;

const SubduedLine = styled.div`
  font-size: 0.68rem;
  color: #819cb4;
`;

const StageRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
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
  const mappingLine = batch.mappingRequired
    ? `Mapping CSV ${batch.mappingCsvPresent ? 'present' : 'missing'}`
    : `Mapping CSV ${batch.mappingCsvPresent ? 'present' : 'optional'}`;
  return `AI JSON ${batch.aiJsonPresent ? 'present' : 'missing'} · ${mappingLine}`;
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
  const safeBatches = Array.isArray(batches) ? batches : [];
  const activeBatches = safeBatches.filter((batch) => !batch?.isArchived);
  const archivedBatches = safeBatches.filter((batch) => batch?.isArchived);

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

      <Section>
        <SectionHeader>
          <SectionTitle>Active Batches</SectionTitle>
          <CountChip>{activeBatches.length}</CountChip>
        </SectionHeader>
        {renderBatchList(activeBatches, {
          emptyMessage: 'No active staged packages yet. Upload a Disco Warp Core batch zip to begin.',
          selectedLabel: 'Selected active batch',
        })}
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Archived Provenance</SectionTitle>
          <CountChip>{archivedBatches.length}</CountChip>
        </SectionHeader>
        {renderBatchList(archivedBatches, {
          emptyMessage: 'No archived batches yet.',
          selectedLabel: 'Selected archived batch',
        })}
      </Section>
    </Panel>
  );
}
