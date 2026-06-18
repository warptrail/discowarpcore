const DEFAULT_API_BASE = 'http://127.0.0.1:5002';

function normalizeApiBase(apiBase = process.env.DWC_API_BASE || DEFAULT_API_BASE) {
  return String(apiBase || DEFAULT_API_BASE).replace(/\/+$/, '');
}

function normalizeTuiBoxNumber(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (/^\d{3}$/.test(normalized)) return normalized;
  throw new Error('Box numbers must be exactly 3 digits, like "001" or "701".');
}

async function readJsonResponse(response) {
  return response.json().catch(() => ({}));
}

function responseMessage(payload, fallback) {
  return payload?.error || payload?.message || fallback;
}

async function resolveDestinationBox(boxNumber, { apiBase = undefined, fetchImpl = fetch } = {}) {
  const normalizedBox = normalizeTuiBoxNumber(boxNumber);
  if (!normalizedBox) return null;

  const response = await fetchImpl(
    `${normalizeApiBase(apiBase)}/api/boxes/resolve-short-id/${encodeURIComponent(normalizedBox)}`,
    { headers: { Accept: 'application/json' } }
  );
  const payload = await readJsonResponse(response);

  if (response.status === 404) {
    return { exists: false, box: null, boxNumber: normalizedBox };
  }

  if (!response.ok) {
    throw new Error(responseMessage(payload, `Failed to resolve box ${normalizedBox}.`));
  }

  return {
    exists: true,
    box: payload?.box || payload?.data || payload,
    boxNumber: normalizedBox,
  };
}

async function createDestinationBox(
  boxNumber,
  { location = '', apiBase = undefined, fetchImpl = fetch } = {}
) {
  const normalizedBox = normalizeTuiBoxNumber(boxNumber);
  const body = {
    box_id: normalizedBox,
    label: `Box ${normalizedBox}`,
  };
  const normalizedLocation = String(location || '').trim();
  if (normalizedLocation) {
    body.location = normalizedLocation;
  }

  const response = await fetchImpl(`${normalizeApiBase(apiBase)}/api/boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(responseMessage(payload, `Failed to create box ${normalizedBox}.`));
  }

  return payload?.box || payload?.data || payload;
}

async function ensureDestinationBox({
  box,
  location = '',
  apiBase = undefined,
  fetchImpl = fetch,
} = {}) {
  const normalizedBox = normalizeTuiBoxNumber(box);
  if (!normalizedBox) return { boxNumber: '', exists: false, created: false, box: null };

  const resolved = await resolveDestinationBox(normalizedBox, { apiBase, fetchImpl });
  if (resolved?.exists) {
    return { ...resolved, created: false };
  }

  try {
    const createdBox = await createDestinationBox(normalizedBox, {
      location,
      apiBase,
      fetchImpl,
    });
    return {
      exists: true,
      created: true,
      box: createdBox,
      boxNumber: normalizedBox,
    };
  } catch (error) {
    if (/already in use/i.test(error?.message || '')) {
      const racedResolution = await resolveDestinationBox(normalizedBox, {
        apiBase,
        fetchImpl,
      });
      if (racedResolution?.exists) {
        return { ...racedResolution, created: false };
      }
    }
    throw error;
  }
}

module.exports = {
  createDestinationBox,
  ensureDestinationBox,
  normalizeApiBase,
  normalizeTuiBoxNumber,
  resolveDestinationBox,
};
