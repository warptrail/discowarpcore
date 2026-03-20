#!/usr/bin/env node
// Seed a contiguous range of box IDs through the existing Boxes API.
//
// Default behavior:
// - start: 700
// - count: 75 (creates 700..774)
// - baseUrl: http://localhost:${PORT || 5050}
//
// Usage examples:
//   node backend/scripts/seed_boxes_range.js
//   node backend/scripts/seed_boxes_range.js --start=700 --count=75
//   node backend/scripts/seed_boxes_range.js --base-url=http://localhost:5050
//   node backend/scripts/seed_boxes_range.js --dry-run

require('dotenv').config({ path: './backend/.env' });

const DEFAULT_START = 700;
const DEFAULT_COUNT = 75;
const DEFAULT_LABEL_PREFIX = 'Seed Box';
const DEFAULT_TIMEOUT_MS = 10000;

function parseArgs(argv) {
  const out = {
    start: DEFAULT_START,
    count: DEFAULT_COUNT,
    labelPrefix: DEFAULT_LABEL_PREFIX,
    baseUrl: process.env.SEED_API_BASE_URL || null,
    dryRun: false,
  };

  for (const raw of argv) {
    if (raw === '--dry-run') {
      out.dryRun = true;
      continue;
    }

    const [k, v] = raw.split('=');
    if (!k || v === undefined) continue;

    if (k === '--start') out.start = Number(v);
    if (k === '--count') out.count = Number(v);
    if (k === '--label-prefix') out.labelPrefix = String(v || '').trim() || DEFAULT_LABEL_PREFIX;
    if (k === '--base-url') out.baseUrl = String(v || '').trim();
  }

  return out;
}

function toBoxId(n) {
  return String(n).padStart(3, '0');
}

function getDefaultBaseUrl() {
  const port = Number(process.env.PORT) || 5050;
  return `http://localhost:${port}`;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const body = await res.json().catch(async () => {
      const text = await res.text().catch(() => '');
      return { raw: text };
    });
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

async function isAvailable(baseUrl, boxId) {
  const url = `${baseUrl}/api/boxes/check-id/${encodeURIComponent(boxId)}`;
  const res = await fetchJson(url);
  if (!res.ok) {
    throw new Error(`check-id failed for #${boxId} (HTTP ${res.status})`);
  }
  return !!res.body?.available;
}

async function createBox(baseUrl, { boxId, label }) {
  const url = `${baseUrl}/api/boxes`;
  const payload = {
    box_id: boxId,
    label,
    tags: ['seed'],
  };

  const res = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) return { created: true, body: res.body };

  const errMsg =
    res.body?.error ||
    res.body?.message ||
    `create failed for #${boxId} (HTTP ${res.status})`;

  if (/already in use/i.test(String(errMsg))) {
    return { created: false, skipped: true, reason: 'already exists' };
  }

  throw new Error(errMsg);
}

function buildBoxIds(start, count) {
  const ids = [];
  for (let i = 0; i < count; i += 1) {
    ids.push(toBoxId(start + i));
  }
  return ids;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baseUrl = options.baseUrl || getDefaultBaseUrl();
  const start = Number(options.start);
  const count = Number(options.count);
  const labelPrefix = options.labelPrefix;

  if (!Number.isInteger(start) || start < 0) {
    throw new Error(`Invalid --start value: ${options.start}`);
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`Invalid --count value: ${options.count}`);
  }

  const ids = buildBoxIds(start, count);
  console.log(`🌱 Seed target: ${ids[0]}..${ids[ids.length - 1]} (${ids.length} boxes)`);
  console.log(`🔌 API: ${baseUrl}`);

  if (options.dryRun) {
    console.log('🧪 Dry run IDs:', ids.join(', '));
    return;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const boxId of ids) {
    const label = `${labelPrefix} ${boxId}`;

    try {
      const available = await isAvailable(baseUrl, boxId);
      if (!available) {
        skipped += 1;
        console.log(`↷ #${boxId} skipped (already exists)`);
        continue;
      }

      const result = await createBox(baseUrl, { boxId, label });
      if (result.created) {
        created += 1;
        console.log(`+ #${boxId} created`);
      } else {
        skipped += 1;
        console.log(`↷ #${boxId} skipped (${result.reason || 'already exists'})`);
      }
    } catch (err) {
      failed += 1;
      console.error(`✗ #${boxId} failed:`, err.message || err);
    }
  }

  console.log('\nSeed summary');
  console.log(`created: ${created}`);
  console.log(`skipped: ${skipped}`);
  console.log(`failed : ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('❌ Seed script failed:', err.message || err);
  process.exitCode = 1;
});
