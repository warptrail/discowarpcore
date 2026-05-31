import styled from 'styled-components';
import IntakeBatchManager from './IntakeBatchManager';
import BulkImportTextPanel from './BulkImportTextPanel';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';

const IntroPanel = styled.section`
  border: 1px solid rgba(96, 152, 189, 0.36);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(12, 20, 29, 0.94) 0%, rgba(8, 14, 22, 0.98) 100%);
  padding: 0.8rem;
  display: grid;
  gap: 0.36rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.64rem;
  }
`;

const IntroTitle = styled.h2`
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e2effc;
`;

const IntroText = styled.p`
  margin: 0;
  color: #a8c0d8;
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
        <IntroTitle>AI-Assisted JSON Intake</IntroTitle>
        <IntroText>
          Upload a generated Disco Warp Core batch package, validate its manifest against the
          current item-import schema, then import the validated items.
        </IntroText>
      </IntroPanel>

      <IntakeBatchManager
        selectedBatchIdOverride={selectedBatchIdOverride}
        onSelectedBatchIdChange={onSelectedBatchIdChange}
        onSelectedBatchIdInvalid={onSelectedBatchIdInvalid}
      />

      <SecondarySection aria-labelledby="simple-text-upload-title">
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
