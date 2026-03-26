import { API_BASE } from './API_BASE';

function getDownloadFilenameFromContentDisposition(headerValue) {
  if (!headerValue) return null;

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]).trim();
  }

  const quotedMatch = headerValue.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim();
  }

  const basicMatch = headerValue.match(/filename=([^;]+)/i);
  if (basicMatch?.[1]) {
    return basicMatch[1].trim();
  }

  return null;
}

function triggerFileDownload(blob, filename) {
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 0);
}

async function downloadBoxExportFile(
  boxMongoId,
  extension,
  {
    signal,
    defaultErrorMessage = 'Failed to download box export',
    fallbackFilename = 'discowarpcore-box-export.dat',
  } = {},
) {
  if (!boxMongoId) throw new Error('boxMongoId is required');

  const res = await fetch(
    `${API_BASE}/api/boxes/${encodeURIComponent(boxMongoId)}/export.${extension}`,
    {
      method: 'GET',
      signal,
    },
  );

  if (!res.ok) {
    let errorMessage = defaultErrorMessage;
    try {
      const json = await res.json();
      errorMessage = json?.error || json?.message || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const blob = await res.blob();
  const filename =
    getDownloadFilenameFromContentDisposition(res.headers.get('content-disposition')) ||
    fallbackFilename;
  triggerFileDownload(blob, filename);

  return { filename };
}

// frontend/src/api/boxes.js
export async function fetchBoxTreeByShortId(shortId, { signal } = {}) {
  if (!shortId) throw new Error('shortId is required');

  console.log('fetchBoxTreeByShortId called with:', shortId);
  const query = new URLSearchParams({ ancestors: '1' });

  const res = await fetch(
    `${API_BASE}/api/boxes/by-short-id/${encodeURIComponent(shortId)}?${query}`,
    { signal },
  );

  console.log('Response status:', res.status);

  const json = await res.json();
  console.log('Raw JSON from API:', json);

  return json.box ?? json.data ?? json;
}

export async function listBoxGroups({ signal } = {}) {
  const params = new URLSearchParams({
    page: '1',
    limit: '1',
  });

  const res = await fetch(`${API_BASE}/api/boxes/tree?${params.toString()}`, {
    signal,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to load box groups');
  }

  const rawGroups = Array.isArray(data?.filters?.groups) ? data.filters.groups : [];
  const byKey = new Map();

  for (const entry of rawGroups) {
    const label = String(
      typeof entry === 'string'
        ? entry
        : entry?.label || entry?.value || '',
    ).trim();
    if (!label) continue;

    const key = label.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, label);
    }
  }

  return [...byKey.values()].sort((left, right) =>
    String(left).localeCompare(String(right), undefined, {
      sensitivity: 'base',
      numeric: true,
    }),
  );
}

export async function releaseChildrenToFloor(boxMongoId, opts = {}) {
  const res = await fetch(
    `${API_BASE}/api/boxes/${boxMongoId}/release-children`,
    {
      method: 'POST',
      signal: opts.signal,
    },
  );

  if (!res.ok) {
    let errorMessage = `Failed to release children for box ${boxMongoId}`;
    try {
      const json = await res.json();
      errorMessage = json.error || json.message || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function updateBoxById(boxMongoId, patch, opts = {}) {
  const res = await fetch(`${API_BASE}/api/boxes/${boxMongoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
    signal: opts.signal,
  });

  if (!res.ok) {
    let errorMessage = `Failed to update box ${boxMongoId}`;
    try {
      const json = await res.json();
      errorMessage = json.error || json.message || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const json = await res.json();
  return json.box ?? json.data ?? json;
}

//? Destroy a box by mongo id
export async function destroyBoxById(boxMongoId, opts = {}) {
  const res = await fetch(`${API_BASE}/api/boxes/${boxMongoId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal, // optional AbortController
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to delete box ${boxMongoId}`);
  }

  // Some APIs return JSON, some don’t — handle both
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function checkBoxIdAvailability(shortId, opts = {}) {
  if (!/^\d{3}$/.test(shortId || '')) return false;

  const res = await fetch(
    `${API_BASE}/api/boxes/check-id/${encodeURIComponent(shortId)}`,
    { signal: opts.signal },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to check availability');
  }
  return !!data?.available;
}

export async function updateBoxDetails(boxMongoId, payload, opts = {}) {
  const res = await fetch(`${API_BASE}/api/boxes/${boxMongoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to update box');
  }
  return data?.box || data?.data || data;
}

export async function createBox(payload, opts = {}) {
  const res = await fetch(`${API_BASE}/api/boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Unknown error');
  }
  return data?.box || data?.data || data;
}

export async function uploadBoxImage(boxMongoId, file, opts = {}) {
  if (!boxMongoId) throw new Error('boxMongoId is required');
  if (!file) throw new Error('file is required');

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/api/boxes/${boxMongoId}/image`, {
    method: 'POST',
    body: formData,
    signal: opts.signal,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to upload box image');
  }
  return data;
}

export async function removeBoxImage(boxMongoId, opts = {}) {
  if (!boxMongoId) throw new Error('boxMongoId is required');

  const res = await fetch(`${API_BASE}/api/boxes/${boxMongoId}/image`, {
    method: 'DELETE',
    signal: opts.signal,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to remove box image');
  }
  return data;
}

export async function downloadBoxJsonExport(boxMongoId, opts = {}) {
  return downloadBoxExportFile(boxMongoId, 'json', {
    signal: opts.signal,
    defaultErrorMessage: 'Failed to export box as JSON',
    fallbackFilename: 'discowarpcore-box-export.json',
  });
}

export async function downloadBoxCsvExport(boxMongoId, opts = {}) {
  return downloadBoxExportFile(boxMongoId, 'csv', {
    signal: opts.signal,
    defaultErrorMessage: 'Failed to export box as CSV',
    fallbackFilename: 'discowarpcore-box-export.csv',
  });
}

export async function downloadBoxHtmlExport(boxMongoId, opts = {}) {
  return downloadBoxExportFile(boxMongoId, 'html', {
    signal: opts.signal,
    defaultErrorMessage: 'Failed to export box as HTML',
    fallbackFilename: 'discowarpcore-box-export.html',
  });
}

export async function downloadBoxPdfExport(boxMongoId, opts = {}) {
  return downloadBoxExportFile(boxMongoId, 'pdf', {
    signal: opts.signal,
    defaultErrorMessage: 'Failed to export box as PDF',
    fallbackFilename: 'discowarpcore-box-export.pdf',
  });
}

export async function downloadBoxQrExport(
  boxMongoId,
  { signal, fallbackFilename = 'discowarpcore-box-export-qr.png' } = {},
) {
  if (!boxMongoId) throw new Error('boxMongoId is required');

  const res = await fetch(`${API_BASE}/api/boxes/${encodeURIComponent(boxMongoId)}/qrcode`, {
    method: 'GET',
    signal,
  });

  if (!res.ok) {
    let errorMessage = 'Failed to export box QR code';
    try {
      const json = await res.json();
      errorMessage = json?.error || json?.message || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const blob = await res.blob();
  const filename =
    getDownloadFilenameFromContentDisposition(res.headers.get('content-disposition')) ||
    fallbackFilename;
  triggerFileDownload(blob, filename);

  return { filename };
}

export async function downloadBoxLabelHtmlExport(
  boxMongoId,
  { signal, fallbackFilename = 'discowarpcore-box-export-label.html' } = {},
) {
  if (!boxMongoId) throw new Error('boxMongoId is required');

  const res = await fetch(
    `${API_BASE}/api/boxes/${encodeURIComponent(boxMongoId)}/export-label.html`,
    {
      method: 'GET',
      signal,
    },
  );

  if (!res.ok) {
    let errorMessage = 'Failed to export printable box label';
    try {
      const json = await res.json();
      errorMessage = json?.error || json?.message || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const blob = await res.blob();
  const filename =
    getDownloadFilenameFromContentDisposition(res.headers.get('content-disposition')) ||
    fallbackFilename;
  triggerFileDownload(blob, filename);

  return { filename };
}
