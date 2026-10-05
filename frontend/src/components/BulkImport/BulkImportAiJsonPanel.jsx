import { panelStyles } from '../../styles/primitives';
import styled from 'styled-components';
import IntakeBatchManager from './IntakeBatchManager';
import BulkImportTextPanel from './BulkImportTextPanel';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const IntroPanel = styled.section`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  padding: 0.8rem;
  display: grid;
  gap: 0.36rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.64rem;
  }

  ${panelStyles}
  border-left: 3px solid var(--dw-amber);
`;

const IntroTitle = styled.h2`
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: var(--dw-text);
`;

const IntroText = styled.p`
  margin: 0;
  color: var(--dw-text-secondary);
  font-size: 0.8rem;
  line-height: 1.42;
`;

const SecondarySection = styled.section`
  display: grid;
  gap: 0.56rem;
`;

export default function BulkImportAiJsonPanel({
  selectedBatchIdOverride = '',
  onSelectedBatchIdChange = null,
  onSelectedBatchIdInvalid = null,
}) {
  return (
    <>
      <IntroPanel>
        <IntroTitle>Upload workbench</IntroTitle>
        <IntroText>
          Use this area after you have a ZIP or JSON file. “Stage” stores a reviewable batch; it
          does not create inventory. Select the batch below to see its destination, provenance,
          validation state, and import controls.
        </IntroText>
      </IntroPanel>

      <div id="ai-workbench">
        <IntakeBatchManager
          selectedBatchIdOverride={selectedBatchIdOverride}
          onSelectedBatchIdChange={onSelectedBatchIdChange}
          onSelectedBatchIdInvalid={onSelectedBatchIdInvalid}
        />
      </div>

      <SecondarySection id="simple-text-upload" aria-labelledby="simple-text-upload-title">
        <IntroPanel>
          <IntroTitle id="simple-text-upload-title">Simple Text Upload</IntroTitle>
          <IntroText>
            Upload a plain `.txt` file with one item name per line. This bypasses the AI package
            workflow and creates basic item records only.
          </IntroText>
        </IntroPanel>

        <BulkImportTextPanel />
      </SecondarySection>
    </>
  );
}
