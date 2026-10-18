const sharp = require('sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const assets = path.join(root, 'frontend/public/brand/disco-space-cove');
const output = path.join(root, 'docs/brand/disco-space-cove/preview.png');
(async () => {
  const labels = `<svg width="1600" height="1460" xmlns="http://www.w3.org/2000/svg"><rect width="1600" height="1460" fill="#080e17"/><style>text{font-family:Arial,sans-serif;fill:#edf4ff}.small{font-size:19px;fill:#a9bace}.label{font-size:20px;fill:#56d9f4}</style><text x="64" y="65" font-size="34" font-weight="bold">Disco Space Cove</text><text x="64" y="101" class="small">HOUSE IDENTITY · ASSET KIT · 18 OCT 2026</text><path d="M64 128H1536" stroke="#294055"/><text x="64" y="170" class="label">01 / APPROVED ARTWORK — EXACT SOURCE CROP</text><text x="64" y="491" class="label">02 / TRANSPARENT LOCKUP — ON PRISM NAVY</text><text x="64" y="788" class="label">03 / EMBLEM — DARK + LIGHT EDGE CHECK</text><rect x="320" y="820" width="248" height="248" rx="12" fill="#ffffff"/><text x="620" y="788" class="label">04 / APP ICONS</text><text x="640" y="1097" class="small">Standard</text><text x="920" y="1097" class="small">Maskable safe area</text><text x="64" y="1150" class="label">05 / SMALL SIZES — ACTUAL PIXELS</text><text x="64" y="1224" class="small">16</text><text x="140" y="1224" class="small">32</text><text x="224" y="1224" class="small">48</text><text x="326" y="1224" class="small">64</text><text x="620" y="1150" class="label">06 / LIGHT SURFACE — NAVY BACKING REQUIRED</text><rect x="620" y="1170" width="916" height="145" rx="12" fill="#f4f6fa"/><rect x="644" y="1190" width="868" height="105" rx="8" fill="#080e17"/><path d="M64 1345H1536" stroke="#294055"/><text x="64" y="1385" class="small">Wave + Disco the fish + four-point star · Cyan / blue facets · Violet highlights</text><text x="64" y="1420" class="small">Raster kit. White lettering needs a dark surface. Product name and live app remain unchanged.</text></svg>`;
  const layers = [{ input: Buffer.from(labels), left: 0, top: 0 }];
  async function add(file, width, height, left, top) { layers.push({ input: await sharp(path.join(assets, file)).resize(width, height, { fit: 'contain', background: '#00000000' }).png().toBuffer(), left, top }); }
  await add('lockup-approved-navy.png', 1472, 270, 64, 190);
  await add('lockup-transparent.png', 1472, 250, 64, 515);
  await add('emblem-transparent-512.png', 230, 230, 64, 829);
  await add('emblem-transparent-512.png', 230, 230, 329, 829);
  await add('icon-256.png', 240, 240, 620, 820);
  await add('icon-maskable-512.png', 240, 240, 900, 820);
  for (const [size, left] of [[16,64],[32,140],[48,224]]) await add(`favicon-${size}.png`, size, size, left, 1165);
  await add('icon-64.png', 64, 64, 326, 1160);
  await add('lockup-transparent-960.png', 800, 92, 678, 1196);
  await sharp({ create: { width: 1600, height: 1460, channels: 4, background: '#080e17' } }).composite(layers).png().toFile(output);
  console.log(output);
})();
