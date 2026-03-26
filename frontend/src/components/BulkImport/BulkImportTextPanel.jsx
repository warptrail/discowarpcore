import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  bulkCreateItems,
  resolveBoxByShortId,
} from '../../api/bulkImport';
import {
  BULK_IMPORT_ITEM_NAME_MAX_LENGTH,
  parseBulkImportText,
} from './bulkImportParser';
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

const BoxIdInput = styled.input`
  width: 9.2rem;
  max-width: 100%;
  border-radius: 9px;
  border: 1px solid
    ${({ $state }) =>
      $state === 'valid'
        ? 'rgba(84, 188, 130, 0.72)'
        : $state === 'invalid'
          ? 'rgba(205, 111, 111, 0.72)'
          : 'rgba(108, 152, 188, 0.5)'};
  background: ${({ $state }) =>
    $state === 'valid'
      ? 'rgba(13, 43, 31, 0.9)'
      : $state === 'invalid'
        ? 'rgba(53, 18, 20, 0.9)'
        : 'rgba(7, 11, 18, 0.9)'};
  color: #eaf2ff;
  font-size: 0.98rem;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    'Courier New',
    monospace;
  letter-spacing: 0.14em;
  text-align: center;
  min-height: 40px;
  padding: 0 0.62rem;

  &:focus {
    outline: none;
    border-color: rgba(145, 187, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(91, 141, 236, 0.24);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
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
        : $tone === 'muted'
          ? '#9fb2c4'
          : '#b8d5ee'};
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

const ParseSummary = styled.div`
  border-radius: 10px;
  border: 1px solid rgba(88, 143, 184, 0.42);
  background: rgba(12, 23, 34, 0.84);
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
  border-radius: 10px;
  border: 1px solid rgba(100, 188, 151, 0.82);
  background: linear-gradient(180deg, rgba(23, 75, 60, 0.96) 0%, rgba(16, 51, 42, 0.96) 100%);
  color: #e8fff5;
  font-size: 0.84rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }
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

function normalizeBoxInput(rawValue) {
  return String(rawValue || '')
    .replace(/\D+/g, '')
    .slice(0, 3);
}

function isPlainTextFile(file) {
  const mime = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '');

  if (mime === 'text/plain' || mime.startsWith('text/')) return true;
  if (/\.txt$/i.test(name)) return true;
  return false;
}

function defaultParseResult() {
  return {
    items: [],
    totalLines: 0,
    ignoredBlankLines: 0,
    truncatedLines: 0,
    maxLength: BULK_IMPORT_ITEM_NAME_MAX_LENGTH,
  };
}

function formatBoxLabel(box) {
  if (!box) return '';
  const base = `#${box.box_id} — ${box.label || 'Box'}`;
  const location = String(box.location || '').trim();
  return location ? `${base} (${location})` : base;
}

export default function BulkImportTextPanel() {
  const fileInputRef = useRef(null);
  const [boxShortId, setBoxShortId] = useState('');
  const [boxState, setBoxState] = useState({
    status: 'orphaned',
    message: 'Leave blank to import as orphaned.',
    box: null,
  });
  const [fileName, setFileName] = useState('');
  const [parseResult, setParseResult] = useState(defaultParseResult);
  const [fileBusy, setFileBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [feedback, setFeedback] = useState({ tone: 'info', message: '' });

  useEffect(() => {
    const normalized = String(boxShortId || '').trim();

    if (!normalized) {
      setBoxState({
        status: 'orphaned',
        message: 'Leave blank to import as orphaned.',
        box: null,
      });
      return;
    }

    if (normalized.length < 3) {
      setBoxState({
        status: 'incomplete',
        message: 'Enter all 3 digits to validate.',
        box: null,
      });
      return;
    }

    let alive = true;
    const controller = new AbortController();

    setBoxState((previous) => ({
      status: 'checking',
      message: 'Validating box ID…',
      box: previous?.box || null,
    }));

    resolveBoxByShortId(normalized, { signal: controller.signal })
      .then((box) => {
        if (!alive) return;

        if (!box) {
          setBoxState({
            status: 'invalid',
            message: `Box #${normalized} was not found.`,
            box: null,
          });
          return;
        }

        setBoxState({
          status: 'valid',
          message: formatBoxLabel(box),
          box,
        });
      })
      .catch((err) => {
        if (!alive || err?.name === 'AbortError') return;
        setBoxState({
          status: 'invalid',
          message: err?.message || 'Could not validate box ID.',
          box: null,
        });
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [boxShortId]);

  const hasParsedItems = parseResult.items.length > 0;

  const blockReason = useMemo(() => {
    if (!fileName) return 'Select a plain text file to begin.';
    if (!hasParsedItems) return 'No valid non-empty lines were found.';
    if (boxShortId && boxState.status !== 'valid') {
      return 'Enter a valid 3-digit box ID, or clear the field for orphaned import.';
    }
    return '';
  }, [boxShortId, boxState.status, fileName, hasParsedItems]);

  const canImport =
    !submitBusy &&
    !fileBusy &&
    !!fileName &&
    hasParsedItems &&
    (!boxShortId || boxState.status === 'valid');

  const handleBoxInputChange = (event) => {
    setBoxShortId(normalizeBoxInput(event.target.value));
    setFeedback({ tone: 'info', message: '' });
  };

  const handleFileChange = async (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFeedback({ tone: 'info', message: '' });

    if (!nextFile) {
      setFileName('');
      setParseResult(defaultParseResult());
      return;
    }

    if (!isPlainTextFile(nextFile)) {
      setFileName('');
      setParseResult(defaultParseResult());
      setFeedback({
        tone: 'error',
        message: 'Please upload a plain text file (.txt).',
      });
      event.target.value = '';
      return;
    }

    setFileBusy(true);

    try {
      const text = await nextFile.text();
      const parsed = parseBulkImportText(text, BULK_IMPORT_ITEM_NAME_MAX_LENGTH);
      setFileName(nextFile.name || 'import.txt');
      setParseResult(parsed);

      if (parsed.items.length === 0) {
        setFeedback({
          tone: 'error',
          message: 'No non-empty lines were found in the uploaded file.',
        });
      }
    } catch (err) {
      setFileName('');
      setParseResult(defaultParseResult());
      setFeedback({
        tone: 'error',
        message: err?.message || 'Failed to read file contents.',
      });
      event.target.value = '';
    } finally {
      setFileBusy(false);
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    if (!canImport) return;

    setSubmitBusy(true);
    setFeedback({ tone: 'info', message: '' });

    try {
      const payload = {
        itemNames: parseResult.items,
        boxShortId: boxState.status === 'valid' ? boxShortId : '',
        sourceFileName: fileName,
      };

      const result = await bulkCreateItems(payload);
      const createdCount = Number(result?.createdCount || 0);
      const truncatedCount = Number(result?.truncatedCount || 0);
      const maxNameLength = Number(result?.maxNameLength || BULK_IMPORT_ITEM_NAME_MAX_LENGTH);

      const destination = result?.destination || null;
      const successMessage = destination
        ? `Imported ${createdCount} items into #${destination.box_id} — ${destination.label || 'Box'}.`
        : `Imported ${createdCount} orphaned items.`;

      const truncationSuffix =
        truncatedCount > 0
          ? ` ${truncatedCount} line${truncatedCount === 1 ? ' was' : 's were'} truncated to ${maxNameLength} characters.`
          : '';

      setFeedback({
        tone: 'success',
        message: `${successMessage}${truncationSuffix}`,
      });

      setFileName('');
      setParseResult(defaultParseResult());
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: err?.message || 'Import failed.',
      });
    } finally {
      setSubmitBusy(false);
    }
  };

  const statusTone =
    boxState.status === 'valid'
      ? 'valid'
      : boxState.status === 'invalid'
        ? 'error'
        : boxState.status === 'incomplete'
          ? 'muted'
          : 'default';

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
