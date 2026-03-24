const Box = require('../models/Box');
const Item = require('../models/Item');
const { withNormalizedItemCategory } = require('../utils/itemCategory');

const ACTIVE_ITEM_FILTER = { item_status: { $ne: 'gone' } };
const EXPORT_FORMAT = 'discowarpcore.box-export.v1';
const DEFAULT_BOX_LABEL = 'Box';
const DEFAULT_SHORT_ID = '000';
const DEFAULT_FRONTEND_BASE_ORIGIN = '';
const BOX_EXPORT_CSV_COLUMNS = [
  'box_id',
  'box_label',
  'item_id',
  'item_name',
  'quantity',
  'category',
  'tags',
  'status',
  'disposition',
  'description',
  'notes',
];
const EXPORT_HTML_TITLE_PREFIX = 'Disco Warp Core Box Export';
const LABEL_EXPORT_HTML_TITLE_PREFIX = 'Disco Warp Core Box Label';
const PDF_ENGINE_MISSING_CODE = 'PDF_ENGINE_MISSING';
const QR_ENGINE_MISSING_CODE = 'QR_ENGINE_MISSING';
const DEFAULT_LABEL_WIDTH_MM = 50;
const DEFAULT_LABEL_HEIGHT_MM = 30;
const DEFAULT_LABEL_MARGIN_MM = 1.2;
const DEFAULT_LABEL_GAP_MM = 1.6;
const DEFAULT_LABEL_QR_SIZE_MM = 20.5;

function loadPuppeteer() {
  try {
    // Lazy-load so other export formats work even if PDF dependency is absent.
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    return require('puppeteer');
  } catch (error) {
    if (error?.code === 'MODULE_NOT_FOUND') {
      const err = new Error(
        'PDF export requires the "puppeteer" dependency. Run `npm install` to enable PDF export.',
      );
      err.code = PDF_ENGINE_MISSING_CODE;
      err.status = 500;
      throw err;
    }
    throw error;
  }
}

function loadQrCodeEngine() {
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    return require('qrcode');
  } catch (error) {
    if (error?.code === 'MODULE_NOT_FOUND') {
      const err = new Error(
        'QR export requires the "qrcode" dependency. Run `npm install` to enable QR export.',
      );
      err.code = QR_ENGINE_MISSING_CODE;
      err.status = 500;
      throw err;
    }
    throw error;
  }
}

function normalizeBoxLabel(box) {
  const label = String(box?.label ?? box?.name ?? '').trim();
  return label || DEFAULT_BOX_LABEL;
}

function normalizeShortId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return DEFAULT_SHORT_ID;
  if (/^\d+$/.test(raw)) return raw.padStart(3, '0');
  return raw;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag ?? '').trim())
    .filter(Boolean);
}

function resolveLocationName(box) {
  if (box?.locationId && typeof box.locationId === 'object' && box.locationId.name) {
    return String(box.locationId.name).trim();
  }
  return String(box?.location ?? '').trim();
}

function buildCanonicalBoxPath(boxShortId) {
  return `/boxes/${encodeURIComponent(boxShortId)}`;
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function normalizeBaseOrigin(value) {
  const trimmed = trimTrailingSlash(String(value || '').trim());
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

function resolveFrontendBaseOrigin({ frontendBaseOrigin } = {}) {
  const candidate =
    String(frontendBaseOrigin || '').trim() ||
    String(process.env.FRONTEND_BASE_URL || '').trim() ||
    DEFAULT_FRONTEND_BASE_ORIGIN;
  return normalizeBaseOrigin(candidate);
}

function buildCanonicalFrontendBoxUrl(boxShortId, { frontendBaseOrigin } = {}) {
  const resolvedBaseOrigin = resolveFrontendBaseOrigin({ frontendBaseOrigin });
  const canonicalPath = buildCanonicalBoxPath(normalizeShortId(boxShortId));
  return `${resolvedBaseOrigin}${canonicalPath}`;
}

function buildBoxQrFileName(boxShortId) {
  return `discowarpcore-box-${normalizeShortId(boxShortId)}-qr.png`;
}

function buildBoxLabelHtmlFileName(boxShortId) {
  return `discowarpcore-box-${normalizeShortId(boxShortId)}-label.html`;
}

function parseFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function estimateAdaptiveFontSizePt(
  value,
  { maxPt, minPt, softLimit, hardLimit },
) {
  const textLength = String(value || '').trim().length;
  if (textLength <= softLimit) return maxPt;
  if (textLength >= hardLimit) return minPt;

  const ratio = (textLength - softLimit) / (hardLimit - softLimit);
  const size = maxPt - (maxPt - minPt) * ratio;
  return Number(size.toFixed(2));
}

function resolveLabelPrintConfig({
  labelWidthMm,
  labelHeightMm,
  labelMarginMm,
  labelGapMm,
  qrSizeMm,
} = {}) {
  const widthMm = clampNumber(
    parseFiniteNumber(labelWidthMm ?? process.env.BOX_LABEL_WIDTH_MM) ??
      DEFAULT_LABEL_WIDTH_MM,
    35,
    120,
  );
  const heightMm = clampNumber(
    parseFiniteNumber(labelHeightMm ?? process.env.BOX_LABEL_HEIGHT_MM) ??
      DEFAULT_LABEL_HEIGHT_MM,
    20,
    100,
  );
  const marginMm = clampNumber(
    parseFiniteNumber(labelMarginMm ?? process.env.BOX_LABEL_MARGIN_MM) ??
      DEFAULT_LABEL_MARGIN_MM,
    0,
    5,
  );
  const gapMm = clampNumber(
    parseFiniteNumber(labelGapMm ?? process.env.BOX_LABEL_GAP_MM) ??
      DEFAULT_LABEL_GAP_MM,
    0.8,
    6,
  );
  const qrMax = Math.max(14, widthMm - marginMm * 2 - 12);
  const qrMin = Math.min(14, qrMax);
  const qrSize = clampNumber(
    parseFiniteNumber(qrSizeMm ?? process.env.BOX_LABEL_QR_SIZE_MM) ??
      DEFAULT_LABEL_QR_SIZE_MM,
    qrMin,
    qrMax,
  );

  return {
    widthMm,
    heightMm,
    marginMm,
    gapMm,
    qrSizeMm: qrSize,
  };
}

function normalizeQuantity(quantity) {
  const numeric = Number(quantity);
  if (Number.isFinite(numeric)) return numeric;
  return 1;
}

function formatExportChildBox(box) {
  const shortId = normalizeShortId(box?.box_id);
  return {
    mongoId: String(box?._id || ''),
    boxId: shortId,
    label: normalizeBoxLabel(box),
    location: resolveLocationName(box),
    tags: normalizeTags(box?.tags),
  };
}

function formatExportItem(item) {
  const normalizedItem = withNormalizedItemCategory(item);
  const quantity = normalizeQuantity(normalizedItem?.quantity);

  return {
    mongoId: String(normalizedItem?._id || ''),
    name: String(normalizedItem?.name || '').trim() || '(Unnamed Item)',
    quantity,
    category: normalizedItem?.category || null,
    tags: normalizeTags(normalizedItem?.tags),
    status: normalizedItem?.item_status || '',
    disposition: normalizedItem?.disposition || '',
    description: normalizedItem?.description || '',
    notes: normalizedItem?.notes || '',
  };
}

async function buildBreadcrumbPath(rootBox) {
  const chain = [];
  const seen = new Set();
  let current = rootBox;

  while (current) {
    const currentId = String(current._id);
    if (!currentId || seen.has(currentId)) break;
    seen.add(currentId);

    chain.unshift({
      mongoId: currentId,
      boxId: normalizeShortId(current.box_id),
      label: normalizeBoxLabel(current),
    });

    if (!current.parentBox) break;
    current = await Box.findById(current.parentBox)
      .select('_id box_id label name parentBox')
      .lean();
  }

  return chain;
}

function buildExportFileName(boxShortId, extension = 'json') {
  const safeExtension = String(extension || 'json').replace(/^\./, '') || 'json';
  const normalizedShortId = normalizeShortId(boxShortId);
  return `discowarpcore-box-${normalizedShortId}.${safeExtension}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatGeneratedAtForDisplay(isoValue) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return String(isoValue || '');

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour24 = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = String((hour24 % 12) || 12).padStart(2, '0');

  return `${year}-${month}-${day} ${hour12}:${minute} ${meridiem}`;
}

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/["\n\r,]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function serializeRowsToCsv(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((row) =>
    columns
      .map((column) => toCsvValue(row[column]))
      .join(','));
  return `${[header, ...lines].join('\n')}\n`;
}

function buildBoxCsvRowsFromPayload(payload) {
  const boxId = String(payload?.box?.boxId || '');
  const boxLabel = String(payload?.box?.label || '');
  const directItems = Array.isArray(payload?.directContents?.items)
    ? payload.directContents.items
    : [];

  return directItems.map((item) => ({
    box_id: boxId,
    box_label: boxLabel,
    item_id: String(item?.mongoId || ''),
    item_name: String(item?.name || ''),
    quantity: item?.quantity ?? '',
    category: String(item?.category || ''),
    tags: Array.isArray(item?.tags) ? item.tags.join(',') : '',
    status: String(item?.status || ''),
    disposition: String(item?.disposition || ''),
    description: String(item?.description || ''),
    notes: String(item?.notes || ''),
  }));
}

function buildBoxCsvFromPayload(payload) {
  const rows = buildBoxCsvRowsFromPayload(payload);
  return serializeRowsToCsv(rows, BOX_EXPORT_CSV_COLUMNS);
}

function renderChildBoxesSection(childBoxes) {
  if (!childBoxes.length) {
    return '<p class="empty-row">No direct child boxes.</p>';
  }

  const rows = childBoxes
    .map((child) => {
      const tags = Array.isArray(child?.tags) ? child.tags.join(', ') : '';
      return `
        <tr>
          <td class="nowrap">${escapeHtml(child?.boxId || '')}</td>
          <td>${escapeHtml(child?.label || '')}</td>
          <td>${escapeHtml(child?.location || '')}</td>
          <td>${escapeHtml(tags)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="data-table compact-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Label</th>
          <th>Location</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderItemsSection(items) {
  if (!items.length) {
    return '<p class="empty-row">No direct items in this box.</p>';
  }

  const rows = items
    .map((item) => {
      const tags = Array.isArray(item?.tags) ? item.tags.join(', ') : '';
      return `
        <tr>
          <td class="item-main">
            <div class="item-name">${escapeHtml(item?.name || '')}</div>
          </td>
          <td class="num-cell">${escapeHtml(item?.quantity ?? '')}</td>
          <td>${escapeHtml(item?.category || '')}</td>
          <td>${escapeHtml(tags)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="data-table items-table">
      <colgroup>
        <col class="col-item-name" />
        <col class="col-qty" />
        <col class="col-category" />
        <col class="col-tags" />
      </colgroup>
      <thead>
        <tr>
          <th>Item</th>
          <th class="qty-col">Qty</th>
          <th>Category</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildBoxHtmlFromPayload(payload, { qrPngDataUrl = '' } = {}) {
  const boxId = String(payload?.box?.boxId || '');
  const boxLabel = String(payload?.box?.label || '');
  const generatedAtDisplay = formatGeneratedAtForDisplay(payload?.generatedAt || '');
  const breadcrumb = Array.isArray(payload?.context?.breadcrumb)
    ? payload.context.breadcrumb
    : [];
  const breadcrumbText = breadcrumb
    .map((node) => {
      const label = String(node?.label || '').trim();
      const nodeId = String(node?.boxId || '').trim();
      if (label && nodeId) return `${label} (${nodeId})`;
      return label || nodeId;
    })
    .filter(Boolean)
    .join(' / ');
  const location = String(payload?.context?.location || '');
  const tags = Array.isArray(payload?.context?.tags) ? payload.context.tags.join(', ') : '';
  const canonicalUrl = String(payload?.box?.canonicalUrl || '');
  const directChildBoxes = Array.isArray(payload?.directContents?.childBoxes)
    ? payload.directContents.childBoxes
    : [];
  const directItems = Array.isArray(payload?.directContents?.items)
    ? payload.directContents.items
    : [];
  const summary = payload?.summary || {};

  const childBoxesMarkup = renderChildBoxesSection(directChildBoxes);
  const itemsMarkup = renderItemsSection(directItems);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(EXPORT_HTML_TITLE_PREFIX)} - Box ${escapeHtml(boxId)}</title>
    <style>
      @page {
        margin: 0.46in 0.35in 0.35in 0.35in;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.25;
        color: #111111;
        background: #ffffff;
      }

      .page {
        width: 100%;
        max-width: 7.8in;
        margin: 0 auto;
        padding-top: calc(0.05in + 15px);
      }

      .header-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 1.28in;
        gap: 0.14in;
        align-items: stretch;
      }

      .doc-title {
        margin: 0;
        font-size: 1.38em;
        line-height: 1.1;
        letter-spacing: 0.01em;
      }

      .doc-subtitle {
        margin: 0.04in 0 0.08in;
        font-size: 0.95em;
        color: #333;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.06in 0.12in;
      }

      .meta-item {
        min-width: 0;
      }

      .meta-label {
        display: block;
        font-size: 0.78em;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: #555;
        margin-bottom: 0.01in;
      }

      .meta-value {
        display: block;
        font-size: 0.9em;
        color: #141414;
        word-break: break-word;
      }

      .qr-placeholder {
        width: 1.2in;
        height: 1.2in;
        border: 1.4px solid #222;
        display: grid;
        place-items: center;
        font-size: 0.78em;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #444;
        align-self: center;
        justify-self: center;
      }

      .qr-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        image-rendering: crisp-edges;
      }

      .section {
        margin-top: 0.12in;
        break-inside: avoid-page;
        page-break-inside: avoid;
      }

      .section-title {
        margin: 0 0 0.04in;
        font-size: 0.93em;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.08in;
      }

      .summary-chip {
        border: 1px solid #b9b9b9;
        padding: 0.05in 0.07in;
      }

      .summary-label {
        margin: 0;
        font-size: 0.75em;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #666;
      }

      .summary-value {
        margin: 0.02in 0 0;
        font-size: 1.02em;
        font-weight: 700;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      .data-table th,
      .data-table td {
        border: 1px solid #c8c8c8;
        padding: 0.03in 0.05in;
        vertical-align: top;
        font-size: 0.84em;
      }

      .data-table th {
        background: #f1f1f1;
        text-align: left;
        font-weight: 700;
      }

      .compact-table th,
      .compact-table td {
        font-size: 0.8em;
      }

      .item-main {
        min-width: 0;
      }

      .items-table .col-item-name {
        width: 48%;
      }

      .items-table .col-qty {
        width: 4.4ch;
      }

      .items-table .col-category {
        width: 18%;
      }

      .items-table .qty-col,
      .items-table .num-cell {
        text-align: center;
      }

      .item-name {
        font-weight: 600;
        line-height: 1.22;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .num-cell,
      .nowrap {
        white-space: nowrap;
      }

      .empty-row {
        margin: 0;
        border: 1px solid #c8c8c8;
        padding: 0.05in;
        font-size: 0.84em;
        color: #444;
      }

      @media print {
        a {
          color: inherit;
          text-decoration: none;
        }

        tr, td, th {
          break-inside: avoid-page;
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header-grid">
        <section>
          <h1 class="doc-title">${escapeHtml(boxLabel)}</h1>
          <p class="doc-subtitle">Box ID: ${escapeHtml(boxId)}</p>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Generated</span>
              <span class="meta-value">${escapeHtml(generatedAtDisplay)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Location</span>
              <span class="meta-value">${escapeHtml(location)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Path</span>
              <span class="meta-value">${escapeHtml(breadcrumbText)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Tags</span>
              <span class="meta-value">${escapeHtml(tags)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">URL</span>
              <span class="meta-value">${escapeHtml(canonicalUrl)}</span>
            </div>
          </div>
        </section>

        <aside class="qr-placeholder">
          ${qrPngDataUrl
    ? `<img class="qr-image" src="${escapeHtml(qrPngDataUrl)}" alt="QR code linking to box ${escapeHtml(boxId)}" />`
    : 'QR Placeholder'}
        </aside>
      </header>

      <section class="section">
        <h2 class="section-title">Summary</h2>
        <div class="summary-grid">
          <article class="summary-chip">
            <p class="summary-label">Direct Items</p>
            <p class="summary-value">${escapeHtml(summary?.directItemCount ?? 0)}</p>
          </article>
          <article class="summary-chip">
            <p class="summary-label">Direct Quantity</p>
            <p class="summary-value">${escapeHtml(summary?.directQuantityTotal ?? 0)}</p>
          </article>
          <article class="summary-chip">
            <p class="summary-label">Direct Child Boxes</p>
            <p class="summary-value">${escapeHtml(summary?.directChildBoxCount ?? 0)}</p>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">Direct Child Boxes</h2>
        ${childBoxesMarkup}
      </section>

      <section class="section">
        <h2 class="section-title">Direct Items</h2>
        ${itemsMarkup}
      </section>
    </main>
  </body>
</html>
`;
}

function buildBoxLabelHtmlFromPayload(payload, { qrPngDataUrl = '', labelConfig = {} } = {}) {
  const boxId = String(payload?.box?.boxId || '');
  const boxLabel = String(payload?.box?.label || '');
  const widthMm = Number(labelConfig?.widthMm || DEFAULT_LABEL_WIDTH_MM);
  const heightMm = Number(labelConfig?.heightMm || DEFAULT_LABEL_HEIGHT_MM);
  const marginMm = Number(labelConfig?.marginMm || DEFAULT_LABEL_MARGIN_MM);
  const gapMm = Number(labelConfig?.gapMm || DEFAULT_LABEL_GAP_MM);
  const qrSizeMm = Number(labelConfig?.qrSizeMm || DEFAULT_LABEL_QR_SIZE_MM);
  const idInitialFontPt = estimateAdaptiveFontSizePt(boxId, {
    maxPt: 20,
    minPt: 8.2,
    softLimit: 3,
    hardLimit: 22,
  });
  const labelInitialFontPt = estimateAdaptiveFontSizePt(boxLabel, {
    maxPt: 9.1,
    minPt: 5.7,
    softLimit: 20,
    hardLimit: 140,
  });
  const title = `${LABEL_EXPORT_HTML_TITLE_PREFIX} - Box ${boxId}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page {
        size: ${widthMm}mm ${heightMm}mm;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      :root {
        --box-id-font-pt: ${idInitialFontPt}pt;
        --box-label-font-pt: ${labelInitialFontPt}pt;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        width: ${widthMm}mm;
        min-height: ${heightMm}mm;
        background: #ffffff;
        color: #000000;
      }

      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      }

      .label-shell {
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        padding: ${marginMm}mm;
      }

      .label {
        width: 100%;
        height: calc(${heightMm}mm - ${marginMm * 2}mm);
        border: 0.25mm solid #000;
        display: grid;
        grid-template-columns: ${qrSizeMm}mm minmax(0, 1fr);
        gap: ${gapMm}mm;
        align-items: center;
        padding: 1mm;
        overflow: hidden;
      }

      .qr-wrap {
        margin: 0;
        width: ${qrSizeMm}mm;
        height: ${qrSizeMm}mm;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qr-code {
        width: 100%;
        height: 100%;
        object-fit: contain;
        image-rendering: crisp-edges;
      }

      .meta {
        min-width: 0;
        height: 100%;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.6mm;
        align-content: center;
        overflow: hidden;
      }

      .box-id {
        margin: 0;
        font-family: "SFMono-Regular", "Consolas", "Liberation Mono", "Courier New", monospace;
        font-size: var(--box-id-font-pt);
        line-height: 0.95;
        letter-spacing: 0.02em;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-align: right;
      }

      .box-label {
        margin: 0;
        font-size: var(--box-label-font-pt);
        line-height: 1.1;
        font-weight: 600;
        letter-spacing: 0.01em;
        overflow-wrap: anywhere;
        word-break: break-word;
        overflow: hidden;
      }

      @media print {
        html,
        body {
          width: ${widthMm}mm !important;
          height: ${heightMm}mm !important;
        }
      }
    </style>
  </head>
  <body>
    <main class="label-shell">
      <section class="label">
        <figure class="qr-wrap">
          <img class="qr-code" src="${escapeHtml(qrPngDataUrl)}" alt="QR code linking to box ${escapeHtml(boxId)}" />
        </figure>

        <section class="meta">
          <h1 class="box-id" data-fit="box-id" data-min-font-pt="8.2" data-max-font-pt="${idInitialFontPt}">${escapeHtml(boxId)}</h1>
          <p class="box-label" data-fit="box-label" data-min-font-pt="5.7" data-max-font-pt="${labelInitialFontPt}">${escapeHtml(boxLabel)}</p>
        </section>
      </section>
    </main>
    <script>
      (function fitLabelText() {
        const STEP_PT = 0.25;

        function doesOverflow(element) {
          return (
            element.scrollWidth - element.clientWidth > 0.5 ||
            element.scrollHeight - element.clientHeight > 0.5
          );
        }

        function fitElementText(element) {
          if (!element) return;

          const min = Number(element.dataset.minFontPt || 6);
          const max = Number(element.dataset.maxFontPt || 12);
          let size = max;

          element.style.fontSize = size + 'pt';
          while (size > min && doesOverflow(element)) {
            size = Math.max(min, size - STEP_PT);
            element.style.fontSize = size + 'pt';
          }
        }

        function runFit() {
          fitElementText(document.querySelector('[data-fit="box-id"]'));
          fitElementText(document.querySelector('[data-fit="box-label"]'));
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runFit, { once: true });
        } else {
          runFit();
        }
      })();
    </script>
  </body>
</html>
`;
}

async function buildBoxJsonExport(
  boxMongoId,
  { frontendBaseOrigin = '' } = {},
) {
  if (!Box.isValidId(boxMongoId)) {
    const err = new Error('Invalid box id');
    err.status = 400;
    err.code = 'INVALID_OBJECT_ID';
    throw err;
  }

  const root = await Box.findById(boxMongoId)
    .populate('locationId', 'name')
    .select('_id box_id label name location locationId tags parentBox items')
    .lean();

  if (!root) {
    return null;
  }

  const directChildBoxesDocs = await Box.find({ parentBox: root._id })
    .populate('locationId', 'name')
    .select('_id box_id label name location locationId tags')
    .sort({ box_id: 1, _id: 1 })
    .lean();

  const directItemIds = Array.isArray(root.items)
    ? root.items.map((entry) => String(entry)).filter(Boolean)
    : [];

  const directItemDocs = directItemIds.length
    ? await Item.find({
      ...ACTIVE_ITEM_FILTER,
      _id: { $in: directItemIds },
    })
      .select('_id name quantity category tags notes item_status disposition description')
      .lean()
    : [];

  const itemMap = new Map(directItemDocs.map((item) => [String(item._id), item]));
  const directItems = directItemIds
    .map((id) => itemMap.get(id))
    .filter(Boolean)
    .map(formatExportItem);

  const directChildBoxes = directChildBoxesDocs.map(formatExportChildBox);
  const breadcrumb = await buildBreadcrumbPath(root);
  const generatedAt = new Date().toISOString();
  const shortId = normalizeShortId(root.box_id);
  const canonicalPath = buildCanonicalBoxPath(shortId);
  const resolvedFrontendBaseOrigin = resolveFrontendBaseOrigin({
    frontendBaseOrigin,
  });
  const canonicalUrl = buildCanonicalFrontendBoxUrl(shortId, {
    frontendBaseOrigin: resolvedFrontendBaseOrigin,
  });
  const filename = buildExportFileName(shortId, 'json');
  const directQuantityTotal = directItems.reduce(
    (total, item) => total + normalizeQuantity(item.quantity),
    0,
  );

  const payload = {
    exportFormat: EXPORT_FORMAT,
    generatedAt,
    box: {
      mongoId: String(root._id),
      boxId: shortId,
      label: normalizeBoxLabel(root),
      generatedAt,
      canonicalPath,
      canonicalUrl,
      frontendBaseOrigin: resolvedFrontendBaseOrigin,
    },
    context: {
      breadcrumb,
      location: resolveLocationName(root),
      tags: normalizeTags(root.tags),
    },
    directContents: {
      childBoxes: directChildBoxes,
      items: directItems,
    },
    summary: {
      directChildBoxCount: directChildBoxes.length,
      directItemCount: directItems.length,
      directQuantityTotal,
    },
  };

  return { payload, filename };
}

async function buildBoxCsvExport(boxMongoId, options = {}) {
  const jsonExport = await buildBoxJsonExport(boxMongoId, options);
  if (!jsonExport) return null;

  const csv = buildBoxCsvFromPayload(jsonExport.payload);
  const filename = buildExportFileName(jsonExport.payload?.box?.boxId, 'csv');

  return {
    csv,
    filename,
    payload: jsonExport.payload,
  };
}

async function buildBoxHtmlExport(boxMongoId, options = {}) {
  const qrExport = await buildBoxQrCodeExport(boxMongoId, options);
  if (!qrExport) return null;

  const qrPngDataUrl = `data:image/png;base64,${qrExport.png.toString('base64')}`;
  const html = buildBoxHtmlFromPayload(qrExport.payload, { qrPngDataUrl });
  const filename = buildExportFileName(qrExport.payload?.box?.boxId, 'html');

  return {
    html,
    filename,
    payload: qrExport.payload,
    targetUrl: qrExport.targetUrl,
  };
}

async function renderPdfFromHtml(html) {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

async function buildBoxPdfExport(boxMongoId, options = {}) {
  const htmlExport = await buildBoxHtmlExport(boxMongoId, options);
  if (!htmlExport) return null;

  const pdf = await renderPdfFromHtml(htmlExport.html);
  const filename = buildExportFileName(htmlExport.payload?.box?.boxId, 'pdf');

  return {
    pdf,
    filename,
    payload: htmlExport.payload,
    html: htmlExport.html,
  };
}

async function buildBoxQrCodeExport(boxMongoId, options = {}) {
  const jsonExport = await buildBoxJsonExport(boxMongoId, options);
  if (!jsonExport) return null;

  const shortId = jsonExport?.payload?.box?.boxId || DEFAULT_SHORT_ID;
  const qrTargetUrl = String(jsonExport?.payload?.box?.canonicalUrl || '').trim();
  if (!qrTargetUrl) {
    const err = new Error('Could not resolve canonical box URL for QR export.');
    err.code = 'QR_URL_MISSING';
    err.status = 500;
    throw err;
  }

  const qrCode = loadQrCodeEngine();
  const png = await qrCode.toBuffer(qrTargetUrl, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
    color: {
      dark: '#111111',
      light: '#FFFFFF',
    },
  });
  const filename = buildBoxQrFileName(shortId);

  return {
    png,
    filename,
    targetUrl: qrTargetUrl,
    payload: jsonExport.payload,
  };
}

async function buildBoxLabelHtmlExport(boxMongoId, options = {}) {
  const qrExport = await buildBoxQrCodeExport(boxMongoId, options);
  if (!qrExport) return null;

  const labelConfig = resolveLabelPrintConfig(options);
  const qrPngDataUrl = `data:image/png;base64,${qrExport.png.toString('base64')}`;
  const html = buildBoxLabelHtmlFromPayload(qrExport.payload, {
    qrPngDataUrl,
    labelConfig,
  });
  const filename = buildBoxLabelHtmlFileName(qrExport.payload?.box?.boxId);

  return {
    html,
    filename,
    payload: qrExport.payload,
    targetUrl: qrExport.targetUrl,
    labelConfig,
  };
}

module.exports = {
  buildBoxJsonExport,
  buildBoxCsvExport,
  buildBoxHtmlExport,
  buildBoxPdfExport,
  buildBoxQrCodeExport,
  buildBoxLabelHtmlExport,
  buildBoxCsvFromPayload,
  buildBoxHtmlFromPayload,
  buildBoxLabelHtmlFromPayload,
  buildExportFileName,
  buildCanonicalFrontendBoxUrl,
  resolveFrontendBaseOrigin,
  resolveLabelPrintConfig,
  BOX_EXPORT_CSV_COLUMNS,
  PDF_ENGINE_MISSING_CODE,
  QR_ENGINE_MISSING_CODE,
};
