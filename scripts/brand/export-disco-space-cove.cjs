// Raster export only: preserves the approved source and imagegen extraction.
// Requires sharp. Run with NODE_PATH pointing to a local installation if needed.
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'docs/brand/disco-space-cove/source');
const out = path.join(root, 'frontend/public/brand/disco-space-cove');
const navy = '#080e17';
const png = (input) => sharp(input).png({ compressionLevel: 9 });
async function main() {
  await fs.mkdir(out, { recursive: true });
  const extracted = path.join(source, 'transparent-extraction.png');
  const approved = path.join(source, 'approved-master.png');
  const lockup = await png(extracted).extract({ left: 68, top: 180, width: 1870, height: 450 }).toBuffer();
  const emblem = await png(extracted).extract({ left: 70, top: 180, width: 500, height: 450 }).toBuffer();
  const star = await png(path.join(source, 'star-extraction.png')).trim().toBuffer();
  await png(lockup).toFile(path.join(out, 'lockup-transparent.png'));
  await png(extracted).extract({ left: 575, top: 315, width: 1355, height: 200 }).toFile(path.join(out, 'wordmark-transparent.png'));
  await png(approved).extract({ left: 130, top: 180, width: 1750, height: 430 }).toFile(path.join(out, 'lockup-approved-navy.png'));
  for (const width of [480, 960]) await png(lockup).resize({ width }).toFile(path.join(out, `lockup-transparent-${width}.png`));
  await png(emblem).resize(512, 512, { fit: 'contain', background: '#00000000' }).toFile(path.join(out, 'emblem-transparent-512.png'));
  await png(star).resize(256, 256, { fit: 'contain', background: '#00000000' }).toFile(path.join(out, 'star-transparent-256.png'));
  async function icon(size, fraction, input, name) {
    const edge = Math.round(size * fraction);
    const mark = await png(input).resize(edge, edge, { fit: 'contain', background: '#00000000' }).toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: navy } })
      .composite([{ input: mark, gravity: 'centre' }]).removeAlpha().png().toFile(path.join(out, name));
  }
  for (const size of [16, 32, 48]) await icon(size, .82, star, `favicon-${size}.png`);
  for (const size of [64, 128, 180, 192, 256, 512, 1024]) await icon(size, .84, emblem, size === 180 ? 'apple-touch-icon-180.png' : `icon-${size}.png`);
  for (const size of [192, 512]) await icon(size, .56, emblem, `icon-maskable-${size}.png`);
  // ICO with PNG payloads; supported by current browsers and Windows.
  const buffers = await Promise.all([16, 32, 48].map(n => fs.readFile(path.join(out, `favicon-${n}.png`))));
  const header = Buffer.alloc(6 + 16 * buffers.length);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(buffers.length, 4);
  let offset = header.length;
  buffers.forEach((b, i) => { const p = 6 + 16 * i; header[p] = [16, 32, 48][i]; header[p + 1] = header[p]; header.writeUInt16LE(1, p + 4); header.writeUInt16LE(32, p + 6); header.writeUInt32LE(b.length, p + 8); header.writeUInt32LE(offset, p + 12); offset += b.length; });
  await fs.writeFile(path.join(out, 'favicon.ico'), Buffer.concat([header, ...buffers]));
  const files = [];
  for (const name of (await fs.readdir(out)).filter(n => n.endsWith('.png')).sort()) {
    const file = path.join(out, name); const bytes = await fs.readFile(file); const m = await sharp(bytes).metadata();
    files.push({ file: name, width: m.width, height: m.height, alpha: m.hasAlpha, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  }
  await fs.writeFile(path.join(out, 'asset-inventory.json'), JSON.stringify({ version: 1, householdIdentity: 'Disco Space Cove', productNameUnchanged: true, files }, null, 2) + '\n');
  console.log(`Exported ${files.length} PNG assets and favicon.ico`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
