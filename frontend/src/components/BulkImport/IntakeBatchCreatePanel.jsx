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

const Section = styled.div`
  display: grid;
  gap: 0.34rem;
`;

const SequenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.52rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const SequenceCard = styled.div`
  border-radius: 12px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'stage'
        ? 'rgba(111, 171, 224, 0.54)'
        : $tone === 'validate'
          ? 'rgba(207, 170, 101, 0.54)'
          : 'rgba(104, 177, 141, 0.54)'};
  background: ${({ $tone }) =>
    $tone === 'stage'
      ? 'rgba(16, 34, 49, 0.88)'
      : $tone === 'validate'
        ? 'rgba(49, 35, 16, 0.88)'
        : 'rgba(16, 40, 31, 0.88)'};
  padding: 0.62rem;
  display: grid;
  gap: 0.22rem;
`;

const SequenceStep = styled.div`
  font-size: 0.67rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $tone }) =>
    $tone === 'stage'
      ? '#9bc7f0'
      : $tone === 'validate'
        ? '#efd2a5'
        : '#c9f1dd'};
`;

const SequenceTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: #e7f4ff;
`;

const SequenceText = styled.div`
  font-size: 0.75rem;
  line-height: 1.38;
  color: #abc4da;
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
  color: #9fb2c4;
`;

const FactList = styled.div`
  display: grid;
  gap: 0.24rem;
`;

const Fact = styled.div`
  font-size: 0.76rem;
  color: #bdd2e8;
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
  packageFile,
  packageInputRef,
  onPackageFileChange,
  onUploadPackage,
  onRefresh,
  busyAction,
  loading,
}) {
  return (
    <Panel>
      <Header>
        <HeaderText>
          <Title>Batch Package Intake</Title>
          <Text>
            Upload one Disco Warp Core batch package zip. The package should already contain
            `manifest.json`, `ai_intake.json`, an optional `image_mapping.csv`, and optional
            `images/`.
          </Text>
        </HeaderText>

        <InlineActions>
          <Button
            type="button"
            $tone="primary"
            onClick={onUploadPackage}
            disabled={busyAction === 'upload-package' || !packageFile}
          >
            {busyAction === 'upload-package' ? 'Staging…' : 'Stage Package'}
          </Button>
          <Button type="button" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </InlineActions>
      </Header>

      <Section>
        <Label htmlFor="intake-package-file">Batch Package Zip</Label>
        <FileInput
          id="intake-package-file"
          ref={packageInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={onPackageFileChange}
        />
        <StatusLine>
          {packageFile?.name || 'Select one .zip package generated by the local batch-prep tool.'}
        </StatusLine>
      </Section>

      <SequenceGrid>
        <SequenceCard $tone="stage">
          <SequenceStep $tone="stage">Step 1</SequenceStep>
          <SequenceTitle>Upload Zip</SequenceTitle>
          <SequenceText>Choose one validated Disco Warp Core batch package zip and stage it to the backend.</SequenceText>
        </SequenceCard>
        <SequenceCard $tone="validate">
          <SequenceStep $tone="validate">Step 2</SequenceStep>
          <SequenceTitle>Validate Batch</SequenceTitle>
          <SequenceText>Review the staged package and run validation before any item import happens.</SequenceText>
        </SequenceCard>
        <SequenceCard $tone="import">
          <SequenceStep $tone="import">Step 3</SequenceStep>
          <SequenceTitle>Import Items</SequenceTitle>
          <SequenceText>Import validated intake data into durable item records. Processing remains optional later.</SequenceText>
        </SequenceCard>
      </SequenceGrid>

      <FactList>
        <Fact>Zip upload only. The old individual JSON, CSV, and image upload path is no longer the primary intake workflow.</Fact>
        <Fact>Required inside the package: `manifest.json`, `ai_intake.json`.</Fact>
        <Fact>`image_mapping.csv` is required only when `images/` is included.</Fact>
      </FactList>
    </Panel>
  );
}
