import { uploadBoxImage, removeBoxImage } from '../../api/boxes';
import { API_BASE } from '../../api/API_BASE';
import { cropImageToSquare } from '../../util/cropImageToSquare';

export function pickImageUrl(entity) {
  return (
    entity?.image?.display?.url ||
    entity?.image?.thumb?.url ||
    entity?.image?.original?.url ||
    entity?.image?.url ||
    entity?.imagePath ||
    ''
  );
}

async function parseResponseError(res, fallbackMessage) {
  const raw = await res.text().catch(() => '');
  if (!raw) return fallbackMessage;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.error || parsed?.message || fallbackMessage;
  } catch {
    return raw;
  }
}

export async function uploadCroppedBoxImage(boxMongoId, file) {
  if (!boxMongoId) throw new Error('boxMongoId is required');
  if (!file) throw new Error('file is required');

  const processedFile = await cropImageToSquare(file, { maxDimension: 1200 });
  return uploadBoxImage(boxMongoId, processedFile);
}

export async function removeExistingBoxImage(boxMongoId) {
  if (!boxMongoId) throw new Error('boxMongoId is required');
  return removeBoxImage(boxMongoId);
}

export async function uploadCroppedItemImage(itemId, file) {
  if (!itemId) throw new Error('itemId is required');
  if (!file) throw new Error('file is required');

  const processedFile = await cropImageToSquare(file, { maxDimension: 1200 });
  const body = new FormData();
  body.append('image', processedFile);

  const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(itemId)}/image`, {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    const message = await parseResponseError(res, `Upload failed (${res.status})`);
    throw new Error(message);
  }

  return res.json().catch(() => ({}));
}

export async function removeExistingItemImage(itemId) {
  if (!itemId) throw new Error('itemId is required');

  const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(itemId)}/image`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const message = await parseResponseError(res, `Remove failed (${res.status})`);
    throw new Error(message);
  }

  return res.json().catch(() => ({}));
}
