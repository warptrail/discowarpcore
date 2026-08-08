const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildBoxLabelHtmlFromPayload,
  buildCanonicalFrontendBoxUrl,
  resolveLabelPrintConfig,
} = require('../backend/services/boxExportService');

test('laser sticker label is a 58 x 30 mm QR label with only box identity', () => {
  const labelConfig = resolveLabelPrintConfig({
    labelWidthMm: 58,
    labelHeightMm: 30,
  });
  const html = buildBoxLabelHtmlFromPayload(
    {
      box: {
        boxId: '002',
        label: 'Other Drawers',
      },
    },
    {
      qrPngDataUrl: 'data:image/png;base64,AA==',
      labelConfig,
    },
  );

  assert.equal(labelConfig.widthMm, 58);
  assert.equal(labelConfig.heightMm, 30);
  assert.match(html, /@page\s*\{\s*size: 58mm 30mm;/);
  assert.match(html, />#002<\/h1>/);
  assert.match(html, />Other Drawers<\/p>/);
  assert.doesNotMatch(html, /Direct Items|Location|Description|Notes/);
});

test('canonical label URLs retain the current browser origin', () => {
  assert.equal(
    buildCanonicalFrontendBoxUrl('002', {
      frontendBaseOrigin: 'http://neonazoth.local:5002/',
    }),
    'http://neonazoth.local:5002/boxes/002',
  );
});
