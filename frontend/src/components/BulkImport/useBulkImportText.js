import { useEffect, useMemo, useRef, useState } from 'react';
import { bulkCreateItems, resolveBoxByShortId } from '../../api/bulkImport';
import { BULK_IMPORT_ITEM_NAME_MAX_LENGTH, parseBulkImportText } from './bulkImportParser';

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

export default function useBulkImportText() {
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

  return { fileInputRef, boxShortId, boxState, fileName, parseResult, submitBusy,
    feedback, canImport, blockReason, statusTone, handleBoxInputChange, handleFileChange, handleImport };
}
