import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  importAiJsonItems,
  validateAiJsonImport,
} from '../../api/bulkImport';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../../styles/tokens';

const Panel = styled.section`
  border: 1px solid rgba(96, 152, 189, 0.36);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(12, 20, 29, 0.94) 0%, rgba(8, 14, 22, 0.98) 100%);
  padding: 0.8rem;
  display: grid;
  gap: 0.72rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.64rem;
    gap: 0.6rem;
  }
`;

const Section = styled.div`
  display: grid;
  gap: 0.36rem;
`;

const Label = styled.label`
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9dbbd4;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 14rem;
  border-radius: 10px;
  border: 1px solid rgba(108, 152, 188, 0.5);
  background: rgba(7, 11, 18, 0.9);
  color: #d7e9fc;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    'Courier New',
    monospace;
  font-size: 0.82rem;
  line-height: 1.42;
  padding: 0.56rem 0.62rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(145, 187, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(91, 141, 236, 0.24);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 12rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

const FileInput = styled.input`
  display: block;
  width: 100%;
  border-radius: 9px;
  border: 1px solid rgba(108, 152, 188, 0.5);
  background: rgba(7, 11, 18, 0.9);
  color: #d7e9fc;
  padding: 0.48rem 0.56rem;
  min-height: 40px;

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
  font-size: 0.77rem;
  color: ${({ $tone }) =>
    $tone === 'valid'
      ? '#9bd6b3'
      : $tone === 'error'
        ? '#f2bebe'
        : $tone === 'warning'
          ? '#f3d7a8'
          : '#9fb2c4'};
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.52rem;
`;

const ActionButton = styled.button`
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
  border-radius: 10px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'import'
        ? 'rgba(100, 188, 151, 0.82)'
        : 'rgba(102, 167, 212, 0.75)'};
  background: ${({ $variant }) =>
    $variant === 'import'
      ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%)'
      : 'linear-gradient(180deg, rgba(26, 60, 83, 0.96) 0%, rgba(17, 43, 62, 0.96) 100%)'};
  color: ${({ $variant }) => ($variant === 'import' ? '#e8fff5' : '#e6f4ff')};
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

const ResultCard = styled.div`
  border-radius: 10px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'valid'
        ? 'rgba(104, 177, 141, 0.6)'
        : $tone === 'error'
          ? 'rgba(206, 114, 114, 0.62)'
          : $tone === 'warning'
            ? 'rgba(201, 163, 97, 0.64)'
            : 'rgba(105, 153, 196, 0.45)'};
  background: ${({ $tone }) =>
    $tone === 'valid'
      ? 'rgba(16, 40, 31, 0.85)'
      : $tone === 'error'
        ? 'rgba(56, 18, 20, 0.85)'
        : $tone === 'warning'
          ? 'rgba(51, 35, 16, 0.85)'
          : 'rgba(14, 24, 35, 0.85)'};
  color: #d4e6f7;
  padding: 0.56rem 0.62rem;
  display: grid;
  gap: 0.44rem;
`;

const ResultHeading = styled.div`
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #d8e9fa;
`;

const ResultLine = styled.div`
  font-size: 0.77rem;
  color: #bdd2e8;
`;

const IssueList = styled.ul`
  margin: 0;
  padding: 0 0 0 1rem;
  display: grid;
  gap: 0.2rem;
`;

const Issue = styled.li`
  font-size: 0.75rem;
  color: ${({ $tone }) => ($tone === 'warning' ? '#efd2a5' : '#f2c3c3')};
`;

const Feedback = styled.div`
  border-radius: 10px;
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

function isJsonFile(file) {
  const mime = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '');

  if (mime === 'application/json' || mime === 'text/json') return true;
  if (/\.json$/i.test(name)) return true;
  return false;
}

function toIssueLabel(entry = {}) {
  const hasIndex = Number.isInteger(entry?.index) && entry.index >= 0;
  const prefix = hasIndex ? `Item ${entry.index + 1}: ` : '';
  const message = String(entry?.message || '').trim() || 'Invalid value.';
  return `${prefix}${message}`;
}

function normalizeValidationResult(raw = {}) {
  return {
    valid: Boolean(raw?.valid),
    isImportable: Boolean(raw?.isImportable),
    source: String(raw?.source || '').trim(),
    receivedCount: Number(raw?.receivedCount) || 0,
    validCount: Number(raw?.validCount) || 0,
    failedCount: Number(raw?.failedCount) || 0,
    warnings: Array.isArray(raw?.warnings) ? raw.warnings : [],
    validationErrors: Array.isArray(raw?.validationErrors) ? raw.validationErrors : [],
  };
}

function normalizeImportResult(raw = {}) {
  return {
    status: String(raw?.status || '').trim() || 'failed',
    source: String(raw?.source || '').trim(),
    receivedCount: Number(raw?.receivedCount) || 0,
    validCount: Number(raw?.validCount) || 0,
    createdCount: Number(raw?.createdCount) || 0,
    failedCount: Number(raw?.failedCount) || 0,
    createdItemIds: Array.isArray(raw?.createdItemIds) ? raw.createdItemIds : [],
    warnings: Array.isArray(raw?.warnings) ? raw.warnings : [],
    validationErrors: Array.isArray(raw?.validationErrors) ? raw.validationErrors : [],
  };
}

export default function BulkImportAiJsonPanel() {
  const jsonFileInputRef = useRef(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonFileName, setJsonFileName] = useState('');
  const [validationBusy, setValidationBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [hasValidatedCurrentText, setHasValidatedCurrentText] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [feedback, setFeedback] = useState({ tone: 'info', message: '' });

  const canValidate = !validationBusy && !importBusy && Boolean(String(jsonText || '').trim());

  const canImport =
    !importBusy &&
    !validationBusy &&
    hasValidatedCurrentText &&
    Boolean(validationResult?.isImportable);

  const validationTone = useMemo(() => {
    if (!validationResult) return 'info';
    if (validationResult.valid) return 'valid';
    if (validationResult.isImportable) return 'warning';
    return 'error';
  }, [validationResult]);

  const handleJsonTextChange = (event) => {
    setJsonText(event.target.value);
    setHasValidatedCurrentText(false);
    setValidationResult(null);
    setImportResult(null);
    setFeedback({ tone: 'info', message: '' });
  };

  const handleJsonFileChange = async (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFeedback({ tone: 'info', message: '' });

    if (!nextFile) {
      setJsonFileName('');
      return;
    }

    if (!isJsonFile(nextFile)) {
      setJsonFileName('');
      setFeedback({ tone: 'error', message: 'Please upload a .json file.' });
      event.target.value = '';
      return;
    }

    try {
      const nextText = await nextFile.text();
      setJsonText(nextText);
      setJsonFileName(nextFile.name || 'import.json');
      setHasValidatedCurrentText(false);
      setValidationResult(null);
      setImportResult(null);
    } catch (err) {
      setJsonFileName('');
      setFeedback({ tone: 'error', message: err?.message || 'Failed to read JSON file.' });
      event.target.value = '';
    }
  };

  const handleValidate = async () => {
    if (!canValidate) return;

    setValidationBusy(true);
    setFeedback({ tone: 'info', message: '' });

    try {
      const result = await validateAiJsonImport({ jsonText });
      const normalized = normalizeValidationResult(result);
      setValidationResult(normalized);
      setHasValidatedCurrentText(true);
      setFeedback({
        tone: normalized.valid ? 'success' : normalized.isImportable ? 'info' : 'error',
        message: normalized.valid
          ? 'Validation passed. Import is ready.'
          : normalized.isImportable
            ? 'Validation found item-level issues. Import can continue with partial success.'
            : 'Validation failed. Fix issues before importing.',
      });
    } catch (err) {
      const body = err?.responseBody || {};
      const normalized = normalizeValidationResult({
        valid: false,
        isImportable: Boolean(body?.isImportable),
        source: body?.source,
        receivedCount: body?.receivedCount,
        validCount: body?.validCount,
        failedCount: body?.failedCount,
        warnings: body?.warnings,
        validationErrors: body?.validationErrors,
      });
      setValidationResult(normalized);
      setHasValidatedCurrentText(true);
      setFeedback({
        tone: normalized.isImportable ? 'info' : 'error',
        message: normalized.isImportable
          ? 'Validation found item-level issues. Import can continue with partial success.'
          : err?.message || 'Validation failed.',
      });
    } finally {
      setValidationBusy(false);
    }
  };

  const handleImport = async () => {
    if (!canImport) return;

    setImportBusy(true);
    setFeedback({ tone: 'info', message: '' });

    try {
      const result = normalizeImportResult(await importAiJsonItems({ jsonText }));
      setImportResult(result);
      setFeedback({
        tone: result.status === 'failed' ? 'error' : 'success',
        message:
          result.status === 'success'
            ? `Imported ${result.createdCount} items successfully.`
            : result.status === 'partial_success'
              ? `Imported ${result.createdCount} items with ${result.failedCount} issue${result.failedCount === 1 ? '' : 's'}.`
              : 'Import failed. No items were created.',
      });
    } catch (err) {
      const body = err?.responseBody || {};
      setImportResult(
        normalizeImportResult({
          status: 'failed',
          receivedCount: body?.receivedCount,
          validCount: body?.validCount,
          createdCount: body?.createdCount,
          failedCount: body?.failedCount,
          warnings: body?.warnings,
          validationErrors: body?.validationErrors,
        })
      );
      setFeedback({
        tone: 'error',
        message: err?.message || 'Import failed.',
      });
    } finally {
      setImportBusy(false);
    }
  };

  const currentWarnings = validationResult?.warnings || [];
  const currentErrors = validationResult?.validationErrors || [];

  return (
    <Panel>
      <Section>
        <Label htmlFor="bulk-import-ai-json-file">JSON File (Optional)</Label>
        <FileInput
          id="bulk-import-ai-json-file"
          ref={jsonFileInputRef}
          type="file"
          accept=".json,application/json,text/json"
          onChange={handleJsonFileChange}
        />
        <StatusLine>
          {jsonFileName
            ? `Loaded ${jsonFileName}.`
            : 'Paste JSON directly or load a .json file into the editor.'}
        </StatusLine>
      </Section>

      <Section>
        <Label htmlFor="bulk-import-ai-json-text">AI JSON Payload</Label>
        <TextArea
          id="bulk-import-ai-json-text"
          value={jsonText}
          onChange={handleJsonTextChange}
          placeholder='{"batchContext":{"source":"ai_json_import"},"items":[{"name":"Example Item","description":"","category":"miscellaneous","tags":[],"quantity":1,"location":null,"box":null}]}'
        />
      </Section>

      <ButtonRow>
        <ActionButton type="button" onClick={handleValidate} disabled={!canValidate}>
          {validationBusy ? 'Validating…' : 'Validate'}
        </ActionButton>
        <ActionButton
          type="button"
          $variant="import"
          onClick={handleImport}
          disabled={!canImport}
        >
          {importBusy ? 'Importing…' : 'Import JSON'}
        </ActionButton>
      </ButtonRow>

      <StatusLine $tone={canImport ? 'valid' : hasValidatedCurrentText ? 'warning' : 'muted'}>
        {canImport
          ? 'Validation complete. Import can proceed.'
          : hasValidatedCurrentText
            ? 'Revalidate after edits, or resolve validation issues before import.'
            : 'Validate this payload before importing.'}
      </StatusLine>

      {validationResult ? (
        <ResultCard $tone={validationTone}>
          <ResultHeading>
            Validation {validationResult.valid ? 'Valid' : validationResult.isImportable ? 'Valid with Issues' : 'Invalid'}
          </ResultHeading>
          <ResultLine>
            Parsed: {validationResult.receivedCount} • Normalized: {validationResult.validCount} • Issues: {validationResult.failedCount}
          </ResultLine>
          {validationResult.source ? <ResultLine>Source: {validationResult.source}</ResultLine> : null}

          {currentWarnings.length ? (
            <>
              <ResultLine>Warnings:</ResultLine>
              <IssueList>
                {currentWarnings.slice(0, 8).map((entry, index) => (
                  <Issue key={`warn-${index}`} $tone="warning">{String(entry || '').trim()}</Issue>
                ))}
              </IssueList>
            </>
          ) : null}

          {currentErrors.length ? (
            <>
              <ResultLine>Validation Errors:</ResultLine>
              <IssueList>
                {currentErrors.slice(0, 10).map((entry, index) => (
                  <Issue key={`err-${index}`}>{toIssueLabel(entry)}</Issue>
                ))}
              </IssueList>
            </>
          ) : null}
        </ResultCard>
      ) : null}

      {importResult ? (
        <ResultCard $tone={importResult.status === 'failed' ? 'error' : importResult.status === 'partial_success' ? 'warning' : 'valid'}>
          <ResultHeading>Import {importResult.status.replace(/_/g, ' ')}</ResultHeading>
          <ResultLine>
            Received: {importResult.receivedCount} • Validated: {importResult.validCount} • Created: {importResult.createdCount} • Failed: {importResult.failedCount}
          </ResultLine>
          {importResult.createdItemIds.length ? (
            <ResultLine>Created IDs: {importResult.createdItemIds.slice(0, 10).join(', ')}</ResultLine>
          ) : null}

          {importResult.warnings.length ? (
            <>
              <ResultLine>Warnings:</ResultLine>
              <IssueList>
                {importResult.warnings.slice(0, 8).map((entry, index) => (
                  <Issue key={`import-warn-${index}`} $tone="warning">{String(entry || '').trim()}</Issue>
                ))}
              </IssueList>
            </>
          ) : null}

          {importResult.validationErrors.length ? (
            <>
              <ResultLine>Errors:</ResultLine>
              <IssueList>
                {importResult.validationErrors.slice(0, 10).map((entry, index) => (
                  <Issue key={`import-err-${index}`}>{toIssueLabel(entry)}</Issue>
                ))}
              </IssueList>
            </>
          ) : null}
        </ResultCard>
      ) : null}

      {feedback.message ? <Feedback $tone={feedback.tone}>{feedback.message}</Feedback> : null}
    </Panel>
  );
}
