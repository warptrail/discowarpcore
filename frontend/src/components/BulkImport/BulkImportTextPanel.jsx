import { panelStyles, inputStyles, controlStyles } from '../../styles/primitives';
import styled from 'styled-components';
import { MOBILE_BREAKPOINT, MOBILE_CONTROL_MIN_HEIGHT, MOBILE_FONT_SM } from '../../styles/tokens';
import useBulkImportText from './useBulkImportText';

const Panel = styled.section`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  padding: 0.8rem;
  display: grid;
  gap: 0.72rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.64rem;
    gap: 0.6rem;
  }

  ${panelStyles}
  border-left: 3px solid var(--dw-amber);
`;

const Section = styled.div`
  display: grid;
  gap: 0.36rem;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.01em;
  text-transform: none;
  color: var(--dw-text-secondary);
`;

const BoxIdInput = styled.input`
  width: 9.2rem;
  max-width: 100%;
  border-radius: var(--dw-radius-sm);
  border: 1px solid
    ${({ $state }) =>
      $state === 'valid'
        ? 'rgba(84, 188, 130, 0.72)'
        : $state === 'invalid'
          ? 'rgba(205, 111, 111, 0.72)'
          : 'var(--dw-border)'};
  background: ${({ $state }) =>
    $state === 'valid'
      ? 'rgba(13, 43, 31, 0.9)'
      : $state === 'invalid'
        ? 'rgba(53, 18, 20, 0.9)'
        : 'rgba(7, 11, 18, 0.9)'};
  color: var(--dw-text);
  font-size: 0.98rem;
  font-family: var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-align: center;
  min-height: 40px;
  padding: 0 0.62rem;

  &:focus {
    outline: none;
    border-color: rgba(145, 187, 255, 0.9);
    box-shadow: none;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }

  ${inputStyles}
  font-family: var(--dw-font-data);

  border-color: ${({ $state }) => $state === 'invalid' ? 'var(--dw-coral)' : $state === 'valid' ? 'var(--dw-teal)' : 'var(--dw-border)'};
`;

const StatusLine = styled.div`
  min-height: 1rem;
  font-size: 0.77rem;
  color: ${({ $tone }) =>
    $tone === 'valid'
      ? '#9bd6b3'
      : $tone === 'error'
        ? '#f2bebe'
        : $tone === 'muted'
          ? '#9fb2c4'
          : '#b8d5ee'};
`;

const FileInput = styled.input`
  display: block;
  width: 100%;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface);
  color: var(--dw-text);
  padding: 0.48rem 0.56rem;
  min-height: 40px;

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

const ParseSummary = styled.div`
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface-raised);
  padding: 0.5rem 0.58rem;
  display: grid;
  gap: 0.2rem;
`;

const SummaryLine = styled.div`
  margin: 0;
  font-size: 0.77rem;
  color: ${({ $tone }) =>
    $tone === 'error'
      ? '#f0c0c0'
      : $tone === 'success'
        ? '#a8dfbe'
        : '#b8cde3'};
`;

const ImportButton = styled.button`
  min-height: 42px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid var(--dw-border);
  background: var(--dw-surface);
  color: #e8fff5;
  font-size: 0.84rem;
  font-weight: 800;
  text-transform: none;
  letter-spacing: 0.01em;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  ${controlStyles}
  color: var(--dw-cyan);
  border-color: var(--dw-cyan);
`;

const Feedback = styled.div`
  border-radius: var(--dw-radius-sm);
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(104, 177, 141, 0.6)'
        : $tone === 'error'
          ? 'rgba(206, 114, 114, 0.62)'
          : 'rgba(105, 153, 196, 0.45)'};
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'rgba(16, 40, 31, 0.85)'
      : $tone === 'error'
        ? 'rgba(56, 18, 20, 0.85)'
        : 'rgba(14, 24, 35, 0.85)'};
  color: ${({ $tone }) =>
    $tone === 'success' ? '#c9f1dd' : $tone === 'error' ? '#f2c8c8' : '#bad2e8'};
  padding: 0.56rem 0.62rem;
  font-size: 0.8rem;
`;

export function BulkImportTextWorkspace({ controller }) {
  const { fileInputRef, boxShortId, boxState, fileName, parseResult, submitBusy,
    feedback, canImport, blockReason, statusTone, handleBoxInputChange, handleFileChange, handleImport } = controller;
  return (
    <Panel>
      <Section>
        <Label htmlFor="bulk-import-box-id">Destination Box ID (Optional)</Label>
        <BoxIdInput
          id="bulk-import-box-id"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="101"
          value={boxShortId}
          onChange={handleBoxInputChange}
          $state={boxState.status}
          aria-describedby="bulk-import-box-status"
        />
        <StatusLine id="bulk-import-box-status" $tone={statusTone}>
          {boxState.message}
        </StatusLine>
      </Section>

      <Section>
        <Label htmlFor="bulk-import-file">Text File</Label>
        <FileInput
          id="bulk-import-file"
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileChange}
        />
        <StatusLine $tone="muted">One item per line. CSV and rich formats are not supported.</StatusLine>
      </Section>

      <ParseSummary>
        <SummaryLine>{fileName ? `Loaded: ${fileName}` : 'No file selected.'}</SummaryLine>
        <SummaryLine>
          Ready: {parseResult.items.length} item{parseResult.items.length === 1 ? '' : 's'} from{' '}
          {parseResult.totalLines} line{parseResult.totalLines === 1 ? '' : 's'}.
        </SummaryLine>
        <SummaryLine>
          Ignored blank lines: {parseResult.ignoredBlankLines}.
        </SummaryLine>
        <SummaryLine $tone={parseResult.truncatedLines > 0 ? 'success' : undefined}>
          Truncated lines: {parseResult.truncatedLines} (max {parseResult.maxLength} chars).
        </SummaryLine>
      </ParseSummary>

      <ImportButton type="button" onClick={handleImport} disabled={!canImport}>
        {submitBusy ? 'Importing…' : 'Import Items'}
      </ImportButton>

      {!canImport && blockReason ? <StatusLine $tone="muted">{blockReason}</StatusLine> : null}

      {feedback.message ? <Feedback $tone={feedback.tone}>{feedback.message}</Feedback> : null}
    </Panel>
  );
}

export default function BulkImportTextPanel() {
  const controller = useBulkImportText();
  return <BulkImportTextWorkspace controller={controller} />;
}
