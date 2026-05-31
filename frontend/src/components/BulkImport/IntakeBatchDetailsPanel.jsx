import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';
import IntakeBatchImportedItemsPanel from './IntakeBatchImportedItemsPanel';

const Panel = styled.section`
  border: 1px solid rgba(96, 152, 189, 0.36);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(12, 20, 29, 0.95) 0%, rgba(8, 14, 22, 0.98) 100%);
  padding: 0.82rem;
  display: grid;
  gap: 0.78rem;
  align-content: start;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.68rem;
    gap: 0.64rem;
  }
`;

const Header = styled.div`
  display: grid;
  gap: 0.22rem;
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
  color: #9fb8cf;
  font-size: 0.78rem;
  line-height: 1.42;
  min-width: 0;
`;

const Empty = styled.div`
  border-radius: 10px;
  border: 1px dashed rgba(104, 155, 191, 0.46);
  background: rgba(8, 15, 23, 0.78);
  color: #9fb8cf;
  font-size: 0.8rem;
  padding: 0.8rem;
  min-width: 0;
`;

const SummaryCard = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(88, 143, 184, 0.42);
  background: rgba(12, 23, 34, 0.84);
  padding: 0.72rem;
  display: grid;
  gap: 0.56rem;
  min-width: 0;
`;

const SummaryTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: flex-start;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-direction: column;
  }
`;

const BatchTitleArea = styled.div`
  display: grid;
  gap: 0.28rem;
  min-width: 0;
`;

const BatchNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  flex-wrap: wrap;
  min-width: 0;
`;

const BatchName = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: #e9f5ff;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const InlineButton = styled.button`
  min-height: 1.72rem;
  border-radius: 8px;
  border: 1px solid rgba(102, 167, 212, 0.58);
  background: rgba(18, 39, 57, 0.82);
  color: #cfe8fb;
  padding: 0 0.54rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
`;

const RenameForm = styled.form`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
  min-width: 0;
`;

const SummaryMeta = styled.div`
  font-size: 0.74rem;
  color: #9fb8cf;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
  min-width: 0;
`;

const Chip = styled.div`
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(104, 177, 141, 0.54)'
        : $tone === 'error'
          ? 'rgba(206, 114, 114, 0.54)'
          : 'rgba(88, 143, 184, 0.42)'};
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'rgba(16, 40, 31, 0.85)'
      : $tone === 'error'
        ? 'rgba(56, 18, 20, 0.85)'
        : 'rgba(14, 24, 35, 0.85)'};
  color: ${({ $tone }) =>
    $tone === 'success' ? '#c9f1dd' : $tone === 'error' ? '#f2c8c8' : '#c2d8ec'};
  padding: 0.18rem 0.44rem;
  font-size: 0.69rem;
  letter-spacing: 0.04em;
  max-width: 100%;
  overflow-wrap: anywhere;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.48rem 0.72rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const SequenceRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.48rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const SequenceCard = styled.div`
  border-radius: 12px;
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
      : 'rgba(10, 18, 28, 0.84)'};
  padding: 0.6rem;
  display: grid;
  gap: 0.18rem;
  min-width: 0;
`;

const SequenceStep = styled.div`
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $active, $tone }) =>
    $active
      ? $tone === 'stage'
        ? '#9bc7f0'
        : $tone === 'validate'
          ? '#efd2a5'
          : '#c9f1dd'
      : '#7994aa'};
`;

const SequenceValue = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: #e9f5ff;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const SequenceMeta = styled.div`
  font-size: 0.73rem;
  color: #a7bed3;
  line-height: 1.35;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const SummaryLine = styled.div`
  font-size: 0.77rem;
  color: #bdd2e8;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const SummaryLabel = styled.span`
  color: #90abc3;
`;

const Block = styled.div`
  display: grid;
  gap: 0.46rem;
  min-width: 0;
`;

const AccordionBlock = styled(Block)`
  border-radius: 12px;
  border: 1px solid rgba(88, 143, 184, 0.22);
  background: rgba(8, 14, 22, 0.56);
  padding: 0.68rem;
`;

const BlockHeader = styled.div`
  display: grid;
  gap: 0.16rem;
`;

const BlockTitle = styled.h4`
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d8e9fa;
`;

const BlockText = styled.p`
  margin: 0;
  color: #8faac1;
  font-size: 0.74rem;
  line-height: 1.35;
`;

const AccordionToggle = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(96, 152, 189, 0.28);
  background: rgba(11, 20, 31, 0.88);
  color: #d8e9fa;
  padding: 0.62rem 0.72rem;
  cursor: pointer;
  text-align: left;
`;

const AccordionMeta = styled.span`
  font-size: 0.72rem;
  color: #8faac1;
`;

const StatusLine = styled.div`
  min-height: 1rem;
  font-size: 0.76rem;
  color: ${({ $tone }) =>
    $tone === 'success'
      ? '#9bd6b3'
      : $tone === 'error'
        ? '#f2bebe'
        : '#9fb2c4'};
`;

const GuidanceCard = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(104, 177, 141, 0.38);
  background: rgba(16, 40, 31, 0.72);
  padding: 0.72rem;
  display: grid;
  gap: 0.34rem;
`;

const FooterResetRow = styled.div`
  border-top: 1px solid rgba(88, 143, 184, 0.22);
  padding-top: 0.72rem;
  display: grid;
  gap: 0.44rem;
`;

const ProcessingEntryCard = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(88, 143, 184, 0.34);
  background: rgba(9, 17, 25, 0.86);
  padding: 0.72rem;
  display: grid;
  gap: 0.56rem;
`;

const ActionCluster = styled.div`
  display: grid;
  gap: 0.52rem;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.52rem;
`;

const DestinationPanel = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(207, 170, 101, 0.46);
  background: rgba(45, 32, 16, 0.72);
  padding: 0.72rem;
  display: grid;
  gap: 0.62rem;
`;

const DestinationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.56rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 0.28rem;
`;

const FieldLabel = styled.span`
  color: #d9c79c;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const TextInput = styled.input`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 10px;
  border: 1px solid rgba(207, 170, 101, 0.44);
  background: rgba(8, 14, 22, 0.86);
  color: #f5ead0;
  padding: 0 0.68rem;
  font-size: 0.8rem;
  outline: none;

  &:focus {
    border-color: rgba(238, 202, 135, 0.82);
    box-shadow: 0 0 0 2px rgba(238, 202, 135, 0.12);
  }
`;

const RenameInput = styled(TextInput)`
  min-height: 2rem;
  min-width: min(100%, 18rem);
  color: #e9f5ff;
`;

const Button = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  min-width: 10.5rem;
  border-radius: 10px;
  border: 1px solid
    ${({ $tone, $active }) =>
      $tone === 'danger'
        ? 'rgba(210, 104, 104, 0.82)'
        : $tone === 'primary'
          ? 'rgba(100, 188, 151, 0.82)'
          : $active
            ? 'rgba(129, 209, 170, 0.92)'
          : 'rgba(102, 167, 212, 0.75)'};
  background: ${({ $tone, $active }) =>
    $tone === 'danger'
      ? 'linear-gradient(180deg, rgba(85, 26, 30, 0.96) 0%, rgba(62, 18, 20, 0.96) 100%)'
      : $tone === 'primary'
        ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
        : $active
          ? 'linear-gradient(180deg, rgba(25, 86, 62, 0.96) 0%, rgba(18, 61, 44, 0.96) 100%)'
        : 'linear-gradient(180deg, rgba(26, 60, 83, 0.96) 0%, rgba(17, 43, 62, 0.96) 100%)'};
  color: #e8fff5;
  font-size: 0.79rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 0.8rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
    min-width: 100%;
  }
`;

const SecondaryDangerButton = styled(Button)`
  min-width: 9rem;
  border-color: rgba(210, 104, 104, 0.52);
  background: linear-gradient(180deg, rgba(48, 18, 22, 0.9) 0%, rgba(34, 14, 17, 0.94) 100%);
  color: #f0caca;
`;

const ValidationCard = styled.div`
  border-radius: 12px;
  border: 1px solid
    ${({ $ok }) => ($ok ? 'rgba(104, 177, 141, 0.6)' : 'rgba(206, 114, 114, 0.62)')};
  background: ${({ $ok }) => ($ok ? 'rgba(16, 40, 31, 0.85)' : 'rgba(56, 18, 20, 0.85)')};
  color: ${({ $ok }) => ($ok ? '#d8f4e6' : '#f2d5d5')};
  padding: 0.7rem;
  display: grid;
  gap: 0.44rem;
`;

const ValidationTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: center;
`;

const ValidationTitle = styled.div`
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const ValidationText = styled.div`
  font-size: 0.76rem;
  line-height: 1.42;
`;

const IssueList = styled.ul`
  margin: 0;
  padding: 0 0 0 1rem;
  display: grid;
  gap: 0.2rem;
`;

const Issue = styled.li`
  font-size: 0.74rem;
`;

const FactList = styled.div`
  display: grid;
  gap: 0.34rem;
`;

const FactLine = styled.div`
  font-size: 0.77rem;
  color: #bdd2e8;
  line-height: 1.4;
`;

const FactValue = styled.span`
  color: #e2effc;
`;

const FactNote = styled.span`
  color: #8faac1;
`;

const FilenameList = styled.ul`
  margin: 0;
  padding: 0 0 0 1rem;
  display: grid;
  gap: 0.18rem;
`;

const Filename = styled.li`
  font-size: 0.74rem;
  color: #b8cee2;
`;

const FilenameCount = styled.div`
  font-size: 0.74rem;
  color: #8faac1;
`;

const ImportedItemsAnchor = styled.div`
  scroll-margin-top: 8.5rem;
`;

function toDisplayDate(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
}

function getRecordedAssetStatus({ active, filename, required, optionalLabel, archivedLabel }) {
  if (active) {
    return {
      tone: 'success',
      label: 'Active attachment present',
      detail: filename || null,
    };
  }
  if (filename) {
    return {
      tone: required ? 'default' : 'default',
      label: archivedLabel || 'Archived provenance recorded',
      detail: filename,
    };
  }
  return {
    tone: required ? 'default' : 'default',
    label: optionalLabel || 'Not included',
    detail: null,
  };
}

function getAccordionMeta({ completed = false, collapsed = false, idleLabel = 'Open' } = {}) {
  if (completed && collapsed) return 'Completed · hidden';
  if (completed) return 'Completed · expanded';
  return idleLabel;
}

function buildProvenanceClipboardText({
  selectedBatch,
  packageSummaryLines,
  aiJsonStatus,
  imagesStatus,
  archiveStatus,
  receiptStatus,
  packageStructureSummary,
  sourceImageNames,
  hasLegacyReferenceAsset,
  legacyReferenceStatus,
}) {
  const lines = [
    `Batch: ${selectedBatch?.name || selectedBatch?.batchId || 'Unknown batch'}`,
    `Batch Record ID: ${selectedBatch?.id || 'n/a'}`,
    `Batch Label: ${selectedBatch?.batchId || selectedBatch?.name || 'n/a'}`,
  ];

  if (packageSummaryLines.length) {
    lines.push(`Package: ${packageSummaryLines.join(' · ')}`);
  }

  lines.push(`AI Intake JSON: ${aiJsonStatus.label}${aiJsonStatus.detail ? ` · ${aiJsonStatus.detail}` : ''}`);
  lines.push(`Images: ${imagesStatus.label}${imagesStatus.detail ? ` · ${imagesStatus.detail}` : ''}`);
  lines.push(`Archive State: ${archiveStatus.label}${archiveStatus.detail ? ` · ${archiveStatus.detail}` : ''}`);
  lines.push(`Local Receipt: ${receiptStatus.label}${receiptStatus.detail ? ` · ${receiptStatus.detail}` : ''}`);

  if (packageStructureSummary) {
    lines.push(
      `Observed Package Structure: ${[
        packageStructureSummary.hasBatchManifest ? 'batch manifest present' : 'batch manifest missing',
        packageStructureSummary.imagesIncluded
          ? `${packageStructureSummary.imageCount || 0} image file(s)`
          : 'no images included',
      ].join(' · ')}`,
    );
  }

  if (hasLegacyReferenceAsset) {
    lines.push(
      `Legacy Reference Asset: ${legacyReferenceStatus.label}${legacyReferenceStatus.detail ? ` · ${legacyReferenceStatus.detail}` : ''}`,
    );
  }

  if (sourceImageNames.length) {
    lines.push('Original image filenames:');
    sourceImageNames.forEach((name) => {
      lines.push(`- ${name}`);
    });
  }

  return lines.join('\n');
}

export default function IntakeBatchDetailsPanel({
  selectedBatch,
  selectedBatchValidationOk,
  importedItemsPageState,
  processingModeEnabled = false,
  selectedItemIds = [],
  liveBatchJobSummary = null,
  liveJobProgressByMediaId = null,
  detailLoading = false,
  onValidate,
  onImport,
  onRenameBatch,
  onApplyDestination,
  onToggleProcessingMode,
  onSelectedItemIdsChange,
  onImportedItemsSortChange,
  onRecreateLocalFolder,
  onDeletePermanently,
  onDelete,
  busyAction,
}) {
  const importedItemsAnchorRef = useRef(null);
  const previousProcessingModeRef = useRef(Boolean(processingModeEnabled));
  const [packageSectionOpen, setPackageSectionOpen] = useState(false);
  const [validationSectionOpen, setValidationSectionOpen] = useState(true);
  const [importSectionOpen, setImportSectionOpen] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [destinationBox, setDestinationBox] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    const wasEnabled = previousProcessingModeRef.current;
    previousProcessingModeRef.current = Boolean(processingModeEnabled);

    if (processingModeEnabled && !wasEnabled) {
      importedItemsAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [processingModeEnabled, selectedBatch?.id]);

  useEffect(() => {
    setPackageSectionOpen(false);
    setValidationSectionOpen(selectedBatch?.validationStatus !== 'passed');
    setImportSectionOpen(selectedBatch?.importLifecycleStatus !== 'success');
    setRenameOpen(false);
    setRenameValue(selectedBatch?.name || '');
  }, [selectedBatch?.id, selectedBatch?.name, selectedBatch?.validationStatus, selectedBatch?.importLifecycleStatus]);

  useEffect(() => {
    setDestinationLocation(selectedBatch?.destinationDefaults?.location || '');
    setDestinationBox(selectedBatch?.destinationDefaults?.box || '');
  }, [
    selectedBatch?.id,
    selectedBatch?.destinationDefaults?.location,
    selectedBatch?.destinationDefaults?.box,
  ]);

  if (!selectedBatch) {
    return (
      <Panel>
        <Header>
          <Title>Selected Batch</Title>
          <Text>Choose a batch from the list to review source assets, validation, and import state.</Text>
        </Header>
        <Empty>No batch selected.</Empty>
      </Panel>
    );
  }

  const validation = selectedBatch.validation || null;
  const validationSnapshot = selectedBatch.validationSnapshot || null;
  const importSnapshot = selectedBatch.importSnapshot || null;
  const sourceManifest = selectedBatch.sourceManifest || null;
  const archiveState = selectedBatch.archiveState || null;
  const isArchived = Boolean(selectedBatch.isArchived);
  const localFolderMissing = Boolean(selectedBatch.localFolderMissing);
  const hasLegacyReferenceAsset = Boolean(sourceManifest?.collageOriginalFilename);
  const legacyReferenceStatus = getRecordedAssetStatus({
    active: hasLegacyReferenceAsset,
    filename: sourceManifest?.collageOriginalFilename,
    required: false,
    archivedLabel: 'Archived provenance recorded',
    optionalLabel: 'Not recorded',
  });
  const validationTone =
    selectedBatch.validationStatus === 'passed'
      ? 'success'
      : selectedBatch.validationStatus === 'failed'
        ? 'error'
        : 'default';
  const importTone =
    selectedBatch.importLifecycleStatus === 'success'
      ? 'success'
      : selectedBatch.importLifecycleStatus === 'failed'
        ? 'error'
        : 'default';
  const canArchiveBatch = selectedBatch.importLifecycleStatus === 'success' && !isArchived;
  const validationCompleted = selectedBatch.validationStatus === 'passed';
  const importCompleted = selectedBatch.importLifecycleStatus === 'success';
  const destinationDefaults = selectedBatch.destinationDefaults || null;
  const destinationReviewRequired = Boolean(destinationDefaults?.reviewRequired) && !importCompleted;
  const sourceImageNames = Array.isArray(sourceManifest?.imageOriginalFilenames)
    ? sourceManifest.imageOriginalFilenames
    : [];
  const packageSnapshot = selectedBatch.packageSnapshot || null;
  const packageStructureSummary = packageSnapshot?.structureSummary || null;
  const packageManifest = packageSnapshot?.manifest || null;
  const packageSummaryLines = [];
  if (packageSnapshot?.originalPackageFilename) {
    packageSummaryLines.push(`Uploaded package ${packageSnapshot.originalPackageFilename}`);
  }
  if (packageSnapshot?.ingestedAt) {
    packageSummaryLines.push(`Staged ${toDisplayDate(packageSnapshot.ingestedAt)}`);
  }
  if (packageManifest?.packageVersion != null) {
    packageSummaryLines.push(`manifest v${packageManifest.packageVersion}`);
  }
  const aiJsonStatus = getRecordedAssetStatus({
    active: selectedBatch.aiJsonPresent,
    filename: sourceManifest?.aiJsonOriginalFilename,
    required: true,
    archivedLabel: 'Archived provenance recorded',
    optionalLabel: 'No active attachment recorded',
  });
  const receiptStatus = selectedBatch.localReceipt
    ? {
        label: selectedBatch.localReceipt.safeToDelete
          ? 'Safe to delete local folder'
          : String(selectedBatch.localReceipt.status || 'receipt present').replace(/_/g, ' '),
        detail: selectedBatch.localReceipt.updatedAt
          ? `Receipt updated ${toDisplayDate(selectedBatch.localReceipt.updatedAt)}`
          : 'Receipt present',
      }
    : {
        label: 'No local receipt yet',
        detail: 'Validate or import to write a staging receipt into the folder.',
      };
  const imagesStatus = selectedBatch.imagesIncluded
    ? {
        label: 'Images included',
        detail: `${sourceManifest?.imageCount || packageStructureSummary?.imageCount || 0} file(s) recorded`,
      }
    : sourceManifest?.imageCount
      ? {
          label: 'Archived provenance recorded',
          detail: `${sourceManifest.imageCount} image file(s) recorded`,
        }
      : {
          label: 'No images included',
          detail: 'Optional for intake/import.',
        };
  const archiveStatus = isArchived
    ? {
        label: 'Archived provenance record',
        detail: archiveState?.archivedAt
          ? `Archived ${toDisplayDate(archiveState.archivedAt)}`
          : 'Archived',
      }
    : localFolderMissing
      ? {
          label: 'Legacy local staging folder missing',
          detail: 'Durable Mongo provenance remains, but the older local staging workspace was deleted.',
        }
    : {
        label: 'Active staged package',
        detail: 'Package provenance is recorded and ready for validation/import review.',
      };
  const provenanceClipboardText = buildProvenanceClipboardText({
    selectedBatch,
    packageSummaryLines,
    aiJsonStatus,
    imagesStatus,
    archiveStatus,
    receiptStatus,
    packageStructureSummary,
    sourceImageNames,
    hasLegacyReferenceAsset,
    legacyReferenceStatus,
  });

  const handleCopyProvenance = async () => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable in this browser.');
      }
      await navigator.clipboard.writeText(provenanceClipboardText);
      setCopyFeedback('Package provenance copied to clipboard.');
    } catch (error) {
      setCopyFeedback(error?.message || 'Failed to copy package provenance.');
    }
  };

  const handleStartRename = () => {
    setRenameValue(selectedBatch?.name || '');
    setRenameOpen(true);
  };

  const handleCancelRename = () => {
    setRenameValue(selectedBatch?.name || '');
    setRenameOpen(false);
  };

  const handleSubmitRename = async (event) => {
    event.preventDefault();
    const nextName = String(renameValue || '').trim();
    if (!nextName || nextName === selectedBatch.name) {
      setRenameValue(selectedBatch.name);
      setRenameOpen(false);
      return;
    }

    try {
      await onRenameBatch?.(nextName);
      setRenameOpen(false);
    } catch {
      // The manager owns user-facing error feedback; keep the form open for correction/retry.
    }
  };

  return (
    <Panel>
      <Header>
        <Title>Selected Batch</Title>
        <Text>
          Review the staged AI intake package, validate the manifest-derived item payload, then
          import it into inventory.
        </Text>
      </Header>

      <SummaryCard>
        <SummaryTop>
          <BatchTitleArea>
            {renameOpen ? (
              <RenameForm onSubmit={handleSubmitRename}>
                <RenameInput
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  autoFocus
                  aria-label="Batch name"
                  disabled={busyAction === 'rename'}
                />
                <InlineButton
                  type="submit"
                  disabled={busyAction === 'rename' || !String(renameValue || '').trim()}
                >
                  {busyAction === 'rename' ? 'Saving...' : 'Save'}
                </InlineButton>
                <InlineButton
                  type="button"
                  onClick={handleCancelRename}
                  disabled={busyAction === 'rename'}
                >
                  Cancel
                </InlineButton>
              </RenameForm>
            ) : (
              <BatchNameRow>
                <BatchName>{selectedBatch.name}</BatchName>
                <InlineButton
                  type="button"
                  onClick={handleStartRename}
                  disabled={busyAction === 'rename'}
                >
                  Rename
                </InlineButton>
              </BatchNameRow>
            )}
            <SummaryMeta>{selectedBatch.id}</SummaryMeta>
          </BatchTitleArea>
          <ChipRow>
            <Chip $tone={validationTone}>
              {String(selectedBatch.validationStatus || 'not_validated').replace(/_/g, ' ')}
            </Chip>
            <Chip $tone={importTone}>
              {String(selectedBatch.importLifecycleStatus || 'not_imported').replace(/_/g, ' ')}
            </Chip>
            <Chip $tone={isArchived || localFolderMissing ? 'error' : 'default'}>
              {isArchived ? 'archived' : localFolderMissing ? 'folder missing' : 'active'}
            </Chip>
            <Chip $tone={selectedBatch.imagesIncluded ? 'success' : 'default'}>
              {selectedBatch.imagesIncluded ? 'images included' : 'images optional'}
            </Chip>
          </ChipRow>
        </SummaryTop>

        <ChipRow>
          <Chip $tone={selectedBatch.aiJsonPresent ? 'success' : 'error'}>
            Schema Payload {selectedBatch.aiJsonPresent ? 'ready' : 'missing'}
          </Chip>
          <Chip $tone={selectedBatch.imagesIncluded ? 'success' : 'default'}>
            Images {selectedBatch.imagesIncluded ? 'included' : 'not included'}
          </Chip>
          <Chip $tone={destinationReviewRequired ? 'error' : 'success'}>
            Destination {destinationReviewRequired ? 'needs review' : 'reviewed'}
          </Chip>
          <Chip $tone={isArchived ? 'error' : 'default'}>
            {archiveStatus.label}
          </Chip>
        </ChipRow>

        <SummaryGrid>
          <SummaryLine>
            <SummaryLabel>Created:</SummaryLabel> {toDisplayDate(selectedBatch.createdAt)}
          </SummaryLine>
          <SummaryLine>
            <SummaryLabel>Updated:</SummaryLabel> {toDisplayDate(selectedBatch.updatedAt)}
          </SummaryLine>
          <SummaryLine>
            <SummaryLabel>Imported:</SummaryLabel>{' '}
            {importSnapshot?.importedAt ? toDisplayDate(importSnapshot.importedAt) : 'Not yet'}
          </SummaryLine>
          <SummaryLine>
            <SummaryLabel>Mapped Images:</SummaryLabel> {validationSnapshot?.rowCount || 0}
          </SummaryLine>
          <SummaryLine>
            <SummaryLabel>Destination:</SummaryLabel>{' '}
            {destinationReviewRequired
              ? 'Needs review'
              : [
                  destinationDefaults?.location || 'Unknown location',
                  destinationDefaults?.box ? `Box ${destinationDefaults.box}` : 'Orphaned',
                ].join(' · ')}
          </SummaryLine>
          <SummaryLine>
            <SummaryLabel>Archive State:</SummaryLabel> {archiveStatus.detail}
          </SummaryLine>
          <SummaryLine>
            <SummaryLabel>Local Folder:</SummaryLabel> {selectedBatch.localFolderName || selectedBatch.batchId}
          </SummaryLine>
        </SummaryGrid>

        <SequenceRow>
          <SequenceCard $tone="stage" $active>
            <SequenceStep $tone="stage" $active>Step 1</SequenceStep>
            <SequenceValue>Zip Staged</SequenceValue>
            <SequenceMeta>
              {packageSnapshot?.originalPackageFilename
                ? packageSnapshot.originalPackageFilename
                : 'Package record present'}
            </SequenceMeta>
          </SequenceCard>
          <SequenceCard $tone="validate" $active={selectedBatch.validationStatus === 'passed'}>
            <SequenceStep $tone="validate" $active={selectedBatch.validationStatus === 'passed'}>Step 2</SequenceStep>
            <SequenceValue>Batch Validation</SequenceValue>
            <SequenceMeta>
              {selectedBatch.validationStatus === 'passed'
                ? `Passed ${toDisplayDate(validationSnapshot?.validatedAt)}`
                : selectedBatch.validationStatus === 'failed'
                  ? 'Validation failed'
                  : destinationReviewRequired
                    ? 'Destination review required'
                  : 'Pending validation'}
            </SequenceMeta>
          </SequenceCard>
          <SequenceCard $tone="import" $active={selectedBatch.importLifecycleStatus === 'success'}>
            <SequenceStep $tone="import" $active={selectedBatch.importLifecycleStatus === 'success'}>Step 3</SequenceStep>
            <SequenceValue>Item Import</SequenceValue>
            <SequenceMeta>
              {selectedBatch.importLifecycleStatus === 'success'
                ? `Imported ${toDisplayDate(importSnapshot?.importedAt)}`
                : selectedBatch.importLifecycleStatus === 'failed'
                  ? 'Import failed'
                  : 'Pending import'}
            </SequenceMeta>
          </SequenceCard>
        </SequenceRow>
      </SummaryCard>

      <AccordionBlock>
        <AccordionToggle
          type="button"
          onClick={() => setPackageSectionOpen((current) => !current)}
        >
          <BlockHeader>
            <BlockTitle>Package Provenance</BlockTitle>
            <BlockText>
              Staged package details, recorded asset structure, and receipt metadata.
            </BlockText>
          </BlockHeader>
          <AccordionMeta>{packageSectionOpen ? 'Hide' : 'Show'}</AccordionMeta>
        </AccordionToggle>

        {packageSectionOpen ? (
          <>
        <ButtonRow>
          <Button type="button" onClick={handleCopyProvenance}>
            Copy Provenance
          </Button>
        </ButtonRow>
        {copyFeedback ? <StatusLine>{copyFeedback}</StatusLine> : null}
        <FactList>
          {packageSummaryLines.length ? (
            <FactLine>
              <SummaryLabel>Package:</SummaryLabel> <FactValue>{packageSummaryLines.join(' · ')}</FactValue>
            </FactLine>
          ) : null}
          <FactLine>
            <SummaryLabel>Schema Payload:</SummaryLabel> <FactValue>{aiJsonStatus.label}</FactValue>
            {aiJsonStatus.detail ? <FactNote>{` · ${aiJsonStatus.detail}`}</FactNote> : null}
          </FactLine>
          <FactLine>
            <SummaryLabel>Images:</SummaryLabel> <FactValue>{imagesStatus.label}</FactValue>
            {imagesStatus.detail ? <FactNote>{` · ${imagesStatus.detail}`}</FactNote> : null}
          </FactLine>
          <FactLine>
            <SummaryLabel>Archive State:</SummaryLabel> <FactValue>{archiveStatus.label}</FactValue>
            {archiveStatus.detail ? <FactNote>{` · ${archiveStatus.detail}`}</FactNote> : null}
          </FactLine>
          <FactLine>
            <SummaryLabel>Local Receipt:</SummaryLabel> <FactValue>{receiptStatus.label}</FactValue>
            {receiptStatus.detail ? <FactNote>{` · ${receiptStatus.detail}`}</FactNote> : null}
          </FactLine>
          {packageStructureSummary ? (
            <FactLine>
              <SummaryLabel>Observed Package Structure:</SummaryLabel>{' '}
              <FactValue>
                {[
                  packageStructureSummary.hasBatchManifest ? 'batch manifest present' : 'batch manifest missing',
                  packageStructureSummary.imagesIncluded
                    ? `${packageStructureSummary.imageCount || 0} image file(s)`
                    : 'no images included',
                ].join(' · ')}
              </FactValue>
            </FactLine>
          ) : null}
          {hasLegacyReferenceAsset ? (
            <FactLine>
              <SummaryLabel>Legacy Reference Asset:</SummaryLabel> <FactValue>{legacyReferenceStatus.label}</FactValue>
              {legacyReferenceStatus.detail ? <FactNote>{` · ${legacyReferenceStatus.detail}`}</FactNote> : null}
            </FactLine>
          ) : null}
        </FactList>

        {sourceImageNames.length ? (
          <Block>
            <BlockText>Original image filenames</BlockText>
            <FilenameCount>{sourceImageNames.length} recorded file(s)</FilenameCount>
            <FilenameList>
              {sourceImageNames.map((name) => (
                <Filename key={`${selectedBatch.id}-${name}`}>{name}</Filename>
              ))}
            </FilenameList>
          </Block>
        ) : null}
          </>
        ) : null}

        <ButtonRow>
          {!isArchived && localFolderMissing ? (
            <Button
              type="button"
              onClick={onRecreateLocalFolder}
              disabled={busyAction === 'recreate-local-folder'}
            >
              {busyAction === 'recreate-local-folder' ? 'Recreating…' : 'Recreate Local Folder'}
            </Button>
          ) : null}
          {!isArchived && canArchiveBatch ? (
            <Button
              type="button"
              $tone="primary"
              onClick={onDelete}
              disabled={busyAction === 'archive' || !canArchiveBatch}
              aria-disabled={busyAction === 'archive' || !canArchiveBatch}
            >
              {busyAction === 'archive' ? 'Archiving…' : 'Archive Batch'}
            </Button>
          ) : null}
          {!isArchived ? (
            <SecondaryDangerButton
              type="button"
              onClick={onDeletePermanently}
              disabled={busyAction === 'delete-permanent' || busyAction === 'archive'}
              aria-disabled={busyAction === 'delete-permanent' || busyAction === 'archive'}
            >
              {busyAction === 'delete-permanent' ? 'Deleting…' : 'Delete Batch'}
            </SecondaryDangerButton>
          ) : null}
        </ButtonRow>

        {canArchiveBatch && !isArchived ? (
          <GuidanceCard>
            <StatusLine $tone="success">
              Import completed successfully. Archive is the normal completion path for this batch.
            </StatusLine>
            <StatusLine>
              Delete is only for corrective cleanup when you need to remove imported items and associated media.
            </StatusLine>
          </GuidanceCard>
        ) : null}

        {isArchived ? (
          <StatusLine>
            This batch is now an archived provenance record. Source assets remain recorded here even though the active workspace files are gone.
          </StatusLine>
        ) : localFolderMissing ? (
          <StatusLine>
            The legacy local staging folder is missing. This batch still exists as durable provenance in Mongo. Package provenance, validation history, and import history remain readable.
          </StatusLine>
        ) : !canArchiveBatch ? (
          <StatusLine>
            Archive remains disabled until this staged batch has been imported successfully.
          </StatusLine>
        ) : null}
      </AccordionBlock>

      {destinationReviewRequired ? (
        <DestinationPanel>
          <BlockHeader>
            <BlockTitle>Destination Review</BlockTitle>
            <BlockText>
              This package did not include a batch location or box. Set either value now, or confirm unknown location and orphaned items.
            </BlockText>
          </BlockHeader>
          <DestinationGrid>
            <Field>
              <FieldLabel>Location</FieldLabel>
              <TextInput
                type="text"
                value={destinationLocation}
                onChange={(event) => setDestinationLocation(event.target.value)}
                placeholder="Unknown location"
                disabled={busyAction === 'destination' || isArchived}
              />
            </Field>
            <Field>
              <FieldLabel>Box</FieldLabel>
              <TextInput
                type="text"
                value={destinationBox}
                onChange={(event) => setDestinationBox(event.target.value)}
                placeholder="No box; import as orphaned"
                disabled={busyAction === 'destination' || isArchived}
              />
            </Field>
          </DestinationGrid>
          <ButtonRow>
            <Button
              type="button"
              $tone="primary"
              onClick={() => onApplyDestination?.({
                location: destinationLocation,
                box: destinationBox,
              })}
              disabled={busyAction === 'destination' || isArchived}
            >
              {busyAction === 'destination' ? 'Saving…' : 'Confirm Destination'}
            </Button>
          </ButtonRow>
          <StatusLine>
            Empty location imports as unknown. Empty box imports these items without a box.
          </StatusLine>
        </DestinationPanel>
      ) : null}

      <AccordionBlock>
        <AccordionToggle
          type="button"
          onClick={() => setValidationSectionOpen((current) => !current)}
        >
          <BlockHeader>
            <BlockTitle>Validation</BlockTitle>
            <BlockText>
              Validate intake data before import. Images remain optional.
            </BlockText>
          </BlockHeader>
          <AccordionMeta>
            {getAccordionMeta({
              completed: validationCompleted,
              collapsed: !validationSectionOpen,
              idleLabel: 'Pending',
            })}
          </AccordionMeta>
        </AccordionToggle>

        {validationSectionOpen ? (
          <>

        <ChipRow>
          <Chip $tone={validationTone}>
            {String(selectedBatch.validationStatus || 'not_validated').replace(/_/g, ' ')}
          </Chip>
          <Chip>
            {validationSnapshot?.validatedAt
              ? `Validated ${toDisplayDate(validationSnapshot.validatedAt)}`
              : 'Not yet validated'}
          </Chip>
        </ChipRow>

        <ValidationText>
          {validationSnapshot?.rowCount || 0} rows • {validationSnapshot?.readyCount || 0} ready •{' '}
          {validationSnapshot?.missingCount || 0} missing • {validationSnapshot?.ambiguousCount || 0} ambiguous •{' '}
          {validationSnapshot?.warningCount || 0} warnings • {validationSnapshot?.errorCount || 0} errors
        </ValidationText>

        {!validationCompleted ? (
          <ButtonRow>
            <Button
              type="button"
              onClick={onValidate}
              disabled={busyAction === 'validate' || isArchived || destinationReviewRequired}
            >
              {busyAction === 'validate' ? 'Validating…' : 'Validate Batch'}
            </Button>
          </ButtonRow>
        ) : null}

        {destinationReviewRequired ? (
          <StatusLine>
            Validation is paused until the batch destination has been reviewed.
          </StatusLine>
        ) : null}

        {validation ? (
          <ValidationCard $ok={selectedBatch.validationStatus === 'passed'}>
            <ValidationTop>
              <ValidationTitle>
                {selectedBatch.validationStatus === 'passed'
                  ? 'Validation passed'
                  : selectedBatch.validationStatus === 'failed'
                    ? 'Validation failed'
                    : 'Validation not run'}
              </ValidationTitle>
              <ValidationText>
                {validationSnapshot?.validatedAt ? toDisplayDate(validationSnapshot.validatedAt) : 'No timestamp'}
              </ValidationText>
            </ValidationTop>

            <ValidationText>
              {validationSnapshot?.totalItems || 0} items • {validationSnapshot?.itemsWithImageKeysCount || 0} with imageKey •{' '}
              {validationSnapshot?.csvSourceFilesCount || 0} CSV rows • {validationSnapshot?.originalImageFilesCount || 0} source images found
            </ValidationText>

            {validation.validationWarnings?.length ? (
              <IssueList>
                {validation.validationWarnings.map((warning, index) => (
                  <Issue key={`${selectedBatch.id}-validation-warning-${index}`} $tone="warning">{warning}</Issue>
                ))}
              </IssueList>
            ) : null}

            {validation.errors.length ? (
              <IssueList>
                {validation.errors.map((error, index) => (
                  <Issue key={`${selectedBatch.id}-validation-error-${index}`}>{error}</Issue>
                ))}
              </IssueList>
            ) : null}
          </ValidationCard>
        ) : (
          <StatusLine>Validation has not run yet.</StatusLine>
        )}
          </>
        ) : null}
      </AccordionBlock>

      <AccordionBlock>
        <AccordionToggle
          type="button"
          onClick={() => setImportSectionOpen((current) => !current)}
        >
          <BlockHeader>
            <BlockTitle>Import</BlockTitle>
            <BlockText>Import creates or updates items from validated intake data. Processing remains optional later.</BlockText>
          </BlockHeader>
          <AccordionMeta>
            {getAccordionMeta({
              completed: importCompleted,
              collapsed: !importSectionOpen,
              idleLabel: validationCompleted ? 'Ready' : 'Waiting on validation',
            })}
          </AccordionMeta>
        </AccordionToggle>

        {importSectionOpen ? (
          <>

        <ChipRow>
          <Chip $tone={importTone}>
            {String(selectedBatch.importLifecycleStatus || 'not_imported').replace(/_/g, ' ')}
          </Chip>
          <Chip>
            {importSnapshot?.importedAt
              ? `Imported ${toDisplayDate(importSnapshot.importedAt)}`
              : 'Not yet imported'}
          </Chip>
          <Chip>Processing optional</Chip>
        </ChipRow>

        <ValidationText>
          {importSnapshot?.createdItemCount || 0} created • {importSnapshot?.updatedItemCount || 0} updated •{' '}
          {importSnapshot?.skippedItemCount || 0} skipped • {importSnapshot?.failedItemCount || 0} failed
        </ValidationText>

        {importSnapshot?.importErrorSummary ? (
          <StatusLine $tone="error">{importSnapshot.importErrorSummary}</StatusLine>
        ) : null}

        {!importCompleted ? (
          <ButtonRow>
            <Button
              type="button"
              $tone="primary"
              onClick={onImport}
              disabled={busyAction === 'import' || !selectedBatchValidationOk || isArchived || destinationReviewRequired}
            >
              {busyAction === 'import' ? 'Importing…' : 'Import Validated Batch'}
            </Button>
          </ButtonRow>
        ) : null}

        {isArchived ? (
          <StatusLine>
            Archived batches stay readable for provenance and import history, but validation and import actions are disabled.
          </StatusLine>
        ) : null}
          </>
        ) : null}
      </AccordionBlock>

      {(validationCompleted || importCompleted) && !isArchived ? (
        <FooterResetRow>
          <BlockText>
            Completed steps are collapsed to keep this view smaller. Use the reset actions below only if you need to run validation or import again.
          </BlockText>
          <ButtonRow>
            {validationCompleted ? (
              <Button
                type="button"
                onClick={onValidate}
                disabled={busyAction === 'validate' || destinationReviewRequired}
              >
                {busyAction === 'validate' ? 'Revalidating…' : 'Re-run Validation'}
              </Button>
            ) : null}
            {importCompleted ? (
              <Button
                type="button"
                $tone="primary"
                onClick={onImport}
                disabled={busyAction === 'import' || destinationReviewRequired}
              >
                {busyAction === 'import' ? 'Re-importing…' : 'Re-import Batch'}
              </Button>
            ) : null}
          </ButtonRow>
        </FooterResetRow>
      ) : null}

      <ProcessingEntryCard>
        <BlockHeader>
          <BlockTitle>Processing</BlockTitle>
          <BlockText>
            Processing stays optional and operator-driven. Turn on Processing Mode to pin the console above and reveal the imported-item selection ledger below.
          </BlockText>
        </BlockHeader>
        <ButtonRow>
          <Button
            type="button"
            $active={processingModeEnabled}
            onClick={onToggleProcessingMode}
          >
            {processingModeEnabled ? 'Disable Processing Mode' : 'Enable Processing Mode'}
          </Button>
        </ButtonRow>
      </ProcessingEntryCard>

      {processingModeEnabled ? (
        <ImportedItemsAnchor ref={importedItemsAnchorRef}>
          <IntakeBatchImportedItemsPanel
            importedItemsPage={selectedBatch.importedItemsPage || null}
            pageState={importedItemsPageState}
            processingModeEnabled={processingModeEnabled}
            selectedItemIds={selectedItemIds}
            processingSummary={selectedBatch.processingSummary || null}
            liveBatchJobSummary={liveBatchJobSummary}
            liveJobProgressByMediaId={liveJobProgressByMediaId}
            isArchived={isArchived}
            detailLoading={detailLoading}
            onToggleProcessingMode={onToggleProcessingMode}
            onSelectedItemIdsChange={onSelectedItemIdsChange}
            onSortChange={onImportedItemsSortChange}
          />
        </ImportedItemsAnchor>
      ) : null}
    </Panel>
  );
}
