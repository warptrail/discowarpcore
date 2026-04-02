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
  padding: 0.9rem;
  display: grid;
  gap: 0.78rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.68rem;
    gap: 0.64rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.72rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderText = styled.div`
  display: grid;
  gap: 0.22rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 0.92rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e2effc;
`;

const Text = styled.p`
  margin: 0;
  color: #a8c0d8;
  font-size: 0.8rem;
  line-height: 1.42;
`;

const InlineActions = styled.div`
  display: flex;
  gap: 0.48rem;
  flex-wrap: wrap;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.68rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const Section = styled.div`
  display: grid;
  gap: 0.34rem;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9dbbd4;
`;

const Input = styled.input`
  width: 100%;
  min-height: 40px;
  border-radius: 9px;
  border: 1px solid rgba(108, 152, 188, 0.5);
  background: rgba(7, 11, 18, 0.9);
  color: #d7e9fc;
  padding: 0.54rem 0.62rem;
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
  color: #9fb2c4;
`;

const Button = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 10px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'primary'
        ? 'rgba(100, 188, 151, 0.82)'
        : 'rgba(102, 167, 212, 0.75)'};
  background: ${({ $tone }) =>
    $tone === 'primary'
      ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
      : 'linear-gradient(180deg, rgba(26, 60, 83, 0.96) 0%, rgba(17, 43, 62, 0.96) 100%)'};
  color: #e8fff5;
  font-size: 0.79rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 0.82rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }
`;

export default function IntakeBatchCreatePanel({
  createName,
  setCreateName,
  createImagesRef,
  createImages,
  createJsonFile,
  createCsvFile,
  createCollageFile,
  summarizeAssetSelection,
  onCreateImagesChange,
  onCreateJsonChange,
  onCreateCsvChange,
  onCreateCollageChange,
  onCreateBatch,
  onRefresh,
  busyAction,
  loading,
}) {
  return (
    <Panel>
      <Header>
        <HeaderText>
          <Title>Batch Workflow</Title>
          <Text>Create a repo-local intake batch, then validate and import from one place.</Text>
        </HeaderText>

        <InlineActions>
          <Button
            type="button"
            $tone="primary"
            onClick={onCreateBatch}
            disabled={busyAction === 'create'}
          >
            {busyAction === 'create' ? 'Creating…' : 'Create Batch'}
          </Button>
          <Button type="button" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </InlineActions>
      </Header>

      <Grid>
        <FullWidth>
          <Section>
            <Label htmlFor="intake-batch-name">Batch Name</Label>
            <Input
              id="intake-batch-name"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="garage-items"
            />
          </Section>
        </FullWidth>

        <Section>
          <Label htmlFor="intake-create-images">Image Folder</Label>
          <FileInput
            id="intake-create-images"
            ref={createImagesRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.heic,image/jpeg,image/png,image/webp,image/heic"
            onChange={onCreateImagesChange}
          />
          <StatusLine>{summarizeAssetSelection(createImages)}</StatusLine>
        </Section>

        <Section>
          <Label htmlFor="intake-create-json">AI JSON</Label>
          <FileInput
            id="intake-create-json"
            type="file"
            accept=".json,application/json,text/json"
            onChange={onCreateJsonChange}
          />
          <StatusLine>{createJsonFile?.name || 'Optional on create.'}</StatusLine>
        </Section>

        <Section>
          <Label htmlFor="intake-create-csv">Image-Order CSV</Label>
          <FileInput
            id="intake-create-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={onCreateCsvChange}
          />
          <StatusLine>{createCsvFile?.name || 'Optional on create.'}</StatusLine>
        </Section>

        <Section>
          <Label htmlFor="intake-create-collage">Collage / Reference</Label>
          <FileInput
            id="intake-create-collage"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,image/jpeg,image/png,image/webp,image/heic"
            onChange={onCreateCollageChange}
          />
          <StatusLine>{createCollageFile?.name || 'Optional.'}</StatusLine>
        </Section>
      </Grid>
    </Panel>
  );
}
