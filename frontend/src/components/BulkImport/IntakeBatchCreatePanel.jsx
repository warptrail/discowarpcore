import { panelStyles, inputStyles, controlStyles } from '../../styles/primitives';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';

const Panel = styled.section`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  padding: 0.9rem;
  display: grid;
  gap: 0.78rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.68rem;
    gap: 0.64rem;
  }

  ${panelStyles}
  border-left: 3px solid var(--dw-amber);
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
  letter-spacing: 0.01em;
  text-transform: none;
  color: var(--dw-text);
`;

const Text = styled.p`
  margin: 0;
  color: var(--dw-text-secondary);
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

const Label = styled.label`
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: var(--dw-text-secondary);
`;

const FileInput = styled.input`
  display: block;
  width: 100%;
  min-height: 40px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface);
  color: var(--dw-text);
  padding: 0.48rem 0.56rem;

  &::file-selector-button {
    border: 1px solid var(--dw-border);
    border-radius: var(--dw-radius-sm);
    background: var(--dw-surface-raised);
    color: #dcfaec;
    font-size: 0.74rem;
    letter-spacing: 0.01em;
    text-transform: none;
    font-weight: 700;
    padding: 0.35rem 0.6rem;
    margin-right: 0.55rem;
    cursor: pointer;
  }

  ${inputStyles}
`;

const StatusLine = styled.div`
  min-height: 1rem;
  font-size: 0.76rem;
  color: var(--dw-text-muted);
`;

const FactList = styled.div`
  display: grid;
  gap: 0.24rem;
`;

const Fact = styled.div`
  font-size: 0.76rem;
  color: var(--dw-text-secondary);
`;

const Button = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: var(--dw-radius-sm);
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'primary'
        ? 'rgba(100, 188, 151, 0.82)'
        : 'rgba(102, 167, 212, 0.75)'};
  background: ${({ $tone }) =>
    $tone === 'primary'
      ? 'var(--dw-surface-raised)'
      : 'var(--dw-surface-raised)'};
  color: #e8fff5;
  font-size: 0.79rem;
  font-weight: 800;
  text-transform: none;
  letter-spacing: 0.01em;
  padding: 0 0.82rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_SM};
  }

  ${controlStyles}

  color: ${({ $tone, $primary, $secondary }) => $tone === 'danger' ? 'var(--dw-coral)' : ($tone === 'primary' || $primary) ? 'var(--dw-cyan)' : $secondary ? 'var(--dw-violet)' : 'var(--dw-text)'};
`;

export default function IntakeBatchCreatePanel({
  mode = 'all',
  packageFile,
  packageInputRef,
  onPackageFileChange,
  onUploadPackage,
  simpleJsonFile,
  simpleJsonInputRef,
  onSimpleJsonFileChange,
  onUploadSimpleJson,
  onRefresh,
  busyAction,
  loading,
}) {
  return (
    <Panel>
      <Header>
        <HeaderText>
          <Title>{mode === 'json' ? 'JSON' : 'AI intake package'}</Title>
          <Text>
            {mode === 'json'
              ? 'Stage a JSON file without images, then review and validate it in Existing batches.'
              : 'Stage a generated ZIP with batch_manifest.json and images, then review and validate it in Existing batches.'}
          </Text>
        </HeaderText>

        <InlineActions>
          {mode !== 'json' && (<Button
            type="button"
            $tone="primary"
            onClick={onUploadPackage}
            disabled={busyAction === 'upload-package' || !packageFile}
          >
            {busyAction === 'upload-package' ? 'Staging…' : 'Stage Package'}
          </Button>)}
          {mode !== 'package' && (<Button
            type="button"
            $tone="primary"
            onClick={onUploadSimpleJson}
            disabled={busyAction === 'upload-simple-json' || !simpleJsonFile}
          >
            {busyAction === 'upload-simple-json' ? 'Staging…' : 'Stage JSON'}
          </Button>)}
          <Button type="button" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </InlineActions>
      </Header>

      {mode !== 'json' && (<Section>
        <Label htmlFor="intake-package-file">Batch Package Zip</Label>
        <FileInput
          id="intake-package-file"
          ref={packageInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={onPackageFileChange}
        />
        <StatusLine>
          {packageFile?.name || 'Select one .zip package from the AI-assisted intake workflow.'}
        </StatusLine>
      </Section>)}

      {mode !== 'package' && (<Section>
        <Label htmlFor="simple-intake-json-file">Simple Item JSON</Label>
        <FileInput
          id="simple-intake-json-file"
          ref={simpleJsonInputRef}
          type="file"
          accept=".json,application/json"
          onChange={onSimpleJsonFileChange}
        />
        <StatusLine>
          {simpleJsonFile?.name || 'Select one unzipped .json file with item fields and no images.'}
        </StatusLine>
      </Section>)}

      <FactList>
        {mode !== 'json' && <Fact>Package ZIPs require batch_manifest.json plus referenced files in images/.</Fact>}
        {mode !== 'package' && <Fact>Simple JSON mode accepts one item object, an item array, or {'{ items: [...] }'} with no images.</Fact>}
        {mode !== 'package' && <Fact>Simple item JSON should include `name`, `description`, `category`, `tags`, `quantity`, and optional `location` or `box`.</Fact>}
      </FactList>
    </Panel>
  );
}
