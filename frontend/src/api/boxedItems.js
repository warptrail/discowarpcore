function joinBaseAndPath(baseUrl, path) {
  const base = String(baseUrl || '').trim();
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}${path}`;
}

async function parseMoveBody(response) {
  const raw = await response.text().catch(() => '');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

export async function moveBoxedItem({
  itemId,
  sourceBoxId,
  destBoxId,
  baseUrl = '',
}) {
  const endpoint = joinBaseAndPath(baseUrl, '/api/boxed-items/moveItem');
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, sourceBoxId, destBoxId }),
  });

  const body = await parseMoveBody(response);
  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Move failed (${response.status})`
    );
  }

  return body;
}

export async function orphanBoxedItem({
  itemId,
  sourceBoxId,
  baseUrl = '',
}) {
  const source = String(sourceBoxId || '').trim();
  if (!source) {
    throw new Error('sourceBoxId is required to orphan an item.');
  }

  const endpoint = joinBaseAndPath(
    baseUrl,
    `/api/boxed-items/${encodeURIComponent(source)}/removeItem`
  );
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
  });

  const body = await parseMoveBody(response);
  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Orphan failed (${response.status})`
    );
  }

  return body;
}
