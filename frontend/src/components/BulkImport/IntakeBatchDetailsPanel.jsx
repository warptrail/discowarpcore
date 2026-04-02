import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';

const Panel = styled.section`
  border: 1px solid rgba(96, 152, 189, 0.36);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(12, 20, 29, 0.95) 0%, rgba(8, 14, 22, 0.98) 100%);
  padding: 0.82rem;
  display: grid;
  gap: 0.78rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.68rem;
    gap: 0.64rem;
  }
`;

const Header = styled.div`
  display: grid;
  gap: 0.22rem;
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
`;

const Empty = styled.div`
  border-radius: 10px;
  border: 1px dashed rgba(104, 155, 191, 0.46);
  background: rgba(8, 15, 23, 0.78);
  color: #9fb8cf;
  font-size: 0.8rem;
  padding: 0.8rem;
`;

const SummaryCard = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(88, 143, 184, 0.42);
  background: rgba(12, 23, 34, 0.84);
  padding: 0.72rem;
  display: grid;
  gap: 0.56rem;
`;

const SummaryTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: flex-start;
`;

const BatchName = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: #e9f5ff;
`;

const SummaryMeta = styled.div`
  font-size: 0.74rem;
  color: #9fb8cf;
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
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.48rem 0.72rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const SummaryLine = styled.div`
  font-size: 0.77rem;
  color: #bdd2e8;
`;

const SummaryLabel = styled.span`
  color: #90abc3;
`;

const Block = styled.div`
  display: grid;
  gap: 0.46rem;
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

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.62rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 0.32rem;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9dbbd4;
`;

const FileInput = styled.input`
  display: block;
  width: 100%;
  min-height: 40px;
  border-radius: 9px;
  border: 1px solid rgba(108, 152, 188, 0.5);
  background: rgba(7, 11, 18, 0.9);
  color: #d7e9fc;
  padding: 0.48rem 0.56rem;

  &::file-selector-button {
    border: 1px solid rgba(99, 167, 145, 0.64);
    border-radius: 8px;
    background: rgba(18, 49, 38, 0.94);
    color: #dcfaec;
    font-size: 0.74rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 700;
    padding: 0.35rem 0.6rem;
    margin-right: 0.55rem;
    cursor: pointer;
  }
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

const ActionCluster = styled.div`
  display: grid;
  gap: 0.52rem;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.52rem;
`;

const Button = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 10px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'danger'
        ? 'rgba(210, 104, 104, 0.82)'
        : $tone === 'primary'
          ? 'rgba(100, 188, 151, 0.82)'
          : 'rgba(102, 167, 212, 0.75)'};
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'linear-gradient(180deg, rgba(85, 26, 30, 0.96) 0%, rgba(62, 18, 20, 0.96) 100%)'
      : $tone === 'primary'
        ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
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
  }
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

function toDisplayDate(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
}

export default function IntakeBatchDetailsPanel({
  selectedBatch,
  selectedBatchValidationOk,
  selectedBatchHasImageLinkedJson,
  updateImagesRef,
  updateImages,
  updateJsonFile,
  updateCsvFile,
  updateCollageFile,
  summarizeAssetSelection,
  onUpdateImagesChange,
  onUpdateJsonChange,
  onUpdateCsvChange,
  onUpdateCollageChange,
  onUpdateAssets,
  onValidate,
  onStage,
  onImport,
  onDelete,
  busyAction,
}) {
  if (!selectedBatch) {
    return (
      <Panel>
        <Header>
          <Title>Selected Batch</Title>
          <Text>Choose a batch from the list to manage files, validation, staging, and import.</Text>
        </Header>
        <Empty>No batch selected.</Empty>
      </Panel>
    );
  }

  const validation = selectedBatch.validation || null;

  return (
    <Panel>
      <Header>
        <Title>Selected Batch</Title>
        <Text>Work from this panel: update assets, validate, stage, import, or clear the cache entry.</Text>
      </Header>

      <SummaryCard>
        <SummaryTop>
          <div>
            <BatchName>{selectedBatch.name}</BatchName>
            <SummaryMeta>{selectedBatch.id}</SummaryMeta>
          </div>
          <ChipRow>
            <Chip $tone={selectedBatchValidationOk ? 'success' : 'error'}>
              {selectedBatchValidationOk ? 'validated' : 'needs validation'}
            </Chip>
            <Chip>{String(selectedBatch.importStatus || 'not_imported').replace(/_/g, ' ')}</Chip>
          </ChipRow>
        </SummaryTop>

        <ChipRow>
          <Chip $tone={selectedBatch.hasJsonFile ? 'success' : 'error'}>
            JSON {selectedBatch.hasJsonFile ? 'present' : 'missing'}
          </Chip>
          <Chip $tone={selectedBatch.hasCsvFile ? 'success' : 'error'}>
            CSV {selectedBatch.hasCsvFile ? 'present' : 'missing'}
          </Chip>
          <Chip $tone={selectedBatch.hasCollageFile ? 'success' : 'default'}>
            Collage {selectedBatch.hasCollageFile ? 'present' : 'missing'}
          </Chip>
          <Chip $tone={selectedBatch.hasMappingCsv ? 'success' : 'default'}>
            Mapping {selectedBatch.hasMappingCsv ? 'present' : 'pending'}
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
            {selectedBatch.importedAt ? toDisplayDate(selectedBatch.importedAt) : 'Not yet'}
          </SummaryLine>
          <SummaryLine>
            <SummaryLabel>Images:</SummaryLabel> {selectedBatch.originalImagesCount} original •{' '}
            {selectedBatch.stagedImagesCount} staged
          </SummaryLine>
        </SummaryGrid>
      </SummaryCard>

      <Block>
        <BlockHeader>
          <BlockTitle>Asset Updates</BlockTitle>
          <BlockText>Replace only the files you need to change.</BlockText>
        </BlockHeader>

        <AssetGrid>
          <Field>
            <Label htmlFor="intake-update-images">Image Folder</Label>
            <FileInput
              id="intake-update-images"
              ref={updateImagesRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.heic,image/jpeg,image/png,image/webp,image/heic"
              onChange={onUpdateImagesChange}
            />
            <StatusLine>{summarizeAssetSelection(updateImages)}</StatusLine>
          </Field>

          <Field>
            <Label htmlFor="intake-update-json">AI JSON</Label>
            <FileInput
              id="intake-update-json"
              type="file"
              accept=".json,application/json,text/json"
              onChange={onUpdateJsonChange}
            />
            <StatusLine>{updateJsonFile?.name || 'Keep current JSON.'}</StatusLine>
          </Field>

          <Field>
            <Label htmlFor="intake-update-csv">Image-Order CSV</Label>
            <FileInput
              id="intake-update-csv"
              type="file"
              accept=".csv,text/csv"
              onChange={onUpdateCsvChange}
            />
            <StatusLine>{updateCsvFile?.name || 'Keep current CSV.'}</StatusLine>
          </Field>

          <Field>
            <Label htmlFor="intake-update-collage">Collage / Reference</Label>
            <FileInput
              id="intake-update-collage"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.heic,image/jpeg,image/png,image/webp,image/heic"
              onChange={onUpdateCollageChange}
            />
            <StatusLine>{updateCollageFile?.name || 'Keep current collage.'}</StatusLine>
          </Field>
        </AssetGrid>
      </Block>

      <ActionCluster>
        <BlockHeader>
          <BlockTitle>Actions</BlockTitle>
          <BlockText>
            Validate before import. Batches with `imageKey` values will rebuild staged matches from the CSV during import.
          </BlockText>
        </BlockHeader>

        <ButtonRow>
          <Button
            type="button"
            onClick={onUpdateAssets}
            disabled={busyAction === 'update-assets'}
          >
            {busyAction === 'update-assets' ? 'Saving…' : 'Save Assets'}
          </Button>
          <Button type="button" onClick={onValidate} disabled={busyAction === 'validate'}>
            {busyAction === 'validate' ? 'Validating…' : 'Validate Batch'}
          </Button>
          <Button type="button" onClick={onStage} disabled={busyAction === 'stage'}>
            {busyAction === 'stage' ? 'Staging…' : 'Stage Images'}
          </Button>
          <Button
            type="button"
            $tone="primary"
            onClick={onImport}
            disabled={busyAction === 'import' || !selectedBatchValidationOk}
          >
            {busyAction === 'import' ? 'Importing…' : 'Import Validated Batch'}
          </Button>
        </ButtonRow>

        <ButtonRow>
          <Button type="button" $tone="danger" onClick={onDelete} disabled={busyAction === 'delete'}>
            {busyAction === 'delete' ? 'Deleting…' : 'Delete Batch'}
          </Button>
        </ButtonRow>
      </ActionCluster>

      <Block>
        <BlockHeader>
          <BlockTitle>Validation</BlockTitle>
          <BlockText>
            {selectedBatchValidationOk
              ? selectedBatchHasImageLinkedJson
                ? 'Ready. Import will restage from the validated CSV.'
                : 'Ready. This batch can be imported.'
              : 'Run validation before import.'}
          </BlockText>
        </BlockHeader>

        {validation ? (
          <ValidationCard $ok={validation.ok}>
            <ValidationTop>
              <ValidationTitle>{validation.ok ? 'Validation passed' : 'Validation failed'}</ValidationTitle>
              <ValidationText>
                {validation.validatedAt ? toDisplayDate(validation.validatedAt) : 'No timestamp'}
              </ValidationText>
            </ValidationTop>

            <ValidationText>
              {validation.totalItems} items • {validation.itemsWithImageKeysCount} with imageKey •{' '}
              {validation.csvSourceFilesCount} CSV rows • {validation.originalImageFilesCount} original images
            </ValidationText>

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
      </Block>
    </Panel>
  );
}
