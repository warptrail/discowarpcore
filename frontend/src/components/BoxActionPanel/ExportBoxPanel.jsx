import React, { useState } from 'react';
import {
  downloadBoxCsvExport,
  downloadBoxHtmlExport,
  downloadBoxJsonExport,
  downloadBoxLabelHtmlExport,
  downloadBoxPdfExport,
  downloadBoxQrExport,
} from '../../api/boxes';
import {
  ExportDownloadButton,
  ExportPanelActions,
  ExportPanelBody,
  ExportPanelClose,
  ExportPanelContainer,
  ExportPanelError,
  ExportPanelHeader,
  ExportPanelTitle,
} from './BoxActionPanel.styles';

export default function ExportBoxPanel({ boxShortId, boxMongoId, onClose }) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const isDownloading = downloadingFormat !== null;

  const handleDownload = async (format) => {
    if (isDownloading || !boxMongoId) return;
    setDownloadingFormat(format);
    setErrorMessage('');

    try {
      if (format === 'csv') {
        await downloadBoxCsvExport(boxMongoId);
      } else if (format === 'html') {
        await downloadBoxHtmlExport(boxMongoId);
      } else if (format === 'pdf') {
        await downloadBoxPdfExport(boxMongoId);
      } else if (format === 'qr') {
        await downloadBoxQrExport(boxMongoId);
      } else if (format === 'label') {
        await downloadBoxLabelHtmlExport(boxMongoId);
      } else {
        await downloadBoxJsonExport(boxMongoId);
      }
    } catch (error) {
      setErrorMessage(error?.message || `Failed to download ${format?.toUpperCase() || 'export'}.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <ExportPanelContainer>
      <ExportPanelHeader>
        <ExportPanelTitle>Export Box #{boxShortId}</ExportPanelTitle>
        <ExportPanelClose type="button" onClick={onClose}>
          Close
        </ExportPanelClose>
      </ExportPanelHeader>

      <ExportPanelBody>
        Download backend-generated JSON, CSV, HTML, PDF, QR, or printable label exports for this box.
      </ExportPanelBody>

      <ExportPanelActions>
        <ExportDownloadButton
          type="button"
          onClick={() => handleDownload('json')}
          disabled={isDownloading || !boxMongoId}
        >
          {downloadingFormat === 'json' ? 'Downloading JSON...' : 'Download JSON'}
        </ExportDownloadButton>

        <ExportDownloadButton
          type="button"
          onClick={() => handleDownload('csv')}
          disabled={isDownloading || !boxMongoId}
        >
          {downloadingFormat === 'csv' ? 'Downloading CSV...' : 'Download CSV'}
        </ExportDownloadButton>

        <ExportDownloadButton
          type="button"
          onClick={() => handleDownload('html')}
          disabled={isDownloading || !boxMongoId}
        >
          {downloadingFormat === 'html' ? 'Downloading HTML...' : 'Download HTML'}
        </ExportDownloadButton>

        <ExportDownloadButton
          type="button"
          onClick={() => handleDownload('pdf')}
          disabled={isDownloading || !boxMongoId}
        >
          {downloadingFormat === 'pdf' ? 'Downloading PDF...' : 'Download PDF'}
        </ExportDownloadButton>

        <ExportDownloadButton
          type="button"
          onClick={() => handleDownload('qr')}
          disabled={isDownloading || !boxMongoId}
        >
          {downloadingFormat === 'qr' ? 'Downloading QR...' : 'Download QR'}
        </ExportDownloadButton>

        <ExportDownloadButton
          type="button"
          onClick={() => handleDownload('label')}
          disabled={isDownloading || !boxMongoId}
        >
          {downloadingFormat === 'label' ? 'Downloading Label...' : 'Download Label'}
        </ExportDownloadButton>
      </ExportPanelActions>

      {errorMessage ? <ExportPanelError>{errorMessage}</ExportPanelError> : null}
    </ExportPanelContainer>
  );
}
