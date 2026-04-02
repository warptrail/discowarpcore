const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const {
  CsvValidationError,
  parseImageOrderCsv,
} = require('../../scripts/stage_imagekey_files');

async function withTempCsv(t, fileName, contents) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-intake-csv-'));
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const csvPath = path.join(tempDir, fileName);
  await fs.writeFile(csvPath, contents, 'utf8');
  return csvPath;
}

test('parseImageOrderCsv accepts raw order CSV with usable file_name values', async (t) => {
  const csvPath = await withTempCsv(
    t,
    'image_order.csv',
    [
      'index,file_path,file_name',
      '0,/tmp/IMG_1001.jpg,IMG_1001.jpg',
      '1,/tmp/IMG_1002.png,IMG_1002.png',
      '',
    ].join('\n')
  );

  const result = await parseImageOrderCsv(csvPath);
  assert.deepEqual(result, ['IMG_1001.jpg', 'IMG_1002.png']);
});

test('parseImageOrderCsv rejects generated mapping CSV input clearly', async (t) => {
  const csvPath = await withTempCsv(
    t,
    'imagekey_mapping.csv',
    [
      'imageKey,sourceFile,stagedFile,status',
      'coffee-beans,index,,unsupported_extension',
      '',
    ].join('\n')
  );

  await assert.rejects(
    () => parseImageOrderCsv(csvPath),
    (error) => {
      assert.equal(error instanceof CsvValidationError, true);
      assert.match(error.message, /generated mapping CSV/i);
      assert.match(error.message, /index,file_path,file_name/i);
      return true;
    }
  );
});

test('parseImageOrderCsv rejects non-image source values clearly', async (t) => {
  const csvPath = await withTempCsv(
    t,
    'image_order.csv',
    [
      'index,file_name',
      '1,index',
      '2,2',
      '',
    ].join('\n')
  );

  await assert.rejects(
    () => parseImageOrderCsv(csvPath),
    (error) => {
      assert.equal(error instanceof CsvValidationError, true);
      assert.match(error.message, /non-image source value/i);
      assert.match(error.message, /index,file_path,file_name/i);
      return true;
    }
  );
});
