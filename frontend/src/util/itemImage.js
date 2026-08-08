function normalizeMediaUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }

  const normalized = raw.replace(/\\/g, '/');
  if (normalized.startsWith('/media/')) return normalized;
  if (normalized.startsWith('media/')) return `/${normalized}`;

  const backendMarker = '/backend/media/';
  const backendIndex = normalized.toLowerCase().indexOf(backendMarker);
  if (backendIndex !== -1) {
    return `/media/${normalized.slice(backendIndex + backendMarker.length).replace(/^\/+/, '')}`;
  }

  const mediaMarkerIndex = normalized.toLowerCase().indexOf('/media/');
  if (mediaMarkerIndex !== -1) return normalized.slice(mediaMarkerIndex);

  return `/media/${normalized.replace(/^\/+/, '')}`;
}

export function getOnDemandImageDerivativeUrl(sourceUrl, variant) {
  const normalizedSourceUrl = normalizeMediaUrl(sourceUrl);
  const normalizedVariant = String(variant || '').trim().toLowerCase();
  if (!normalizedSourceUrl || !['thumb', 'display'].includes(normalizedVariant)) {
    return '';
  }
  if (normalizedSourceUrl.startsWith('data:') || normalizedSourceUrl.startsWith('blob:')) {
    return normalizedSourceUrl;
  }

  const sourcePath = normalizedSourceUrl.split(/[?#]/, 1)[0];
  return `/api/media/image-derivative?variant=${encodeURIComponent(normalizedVariant)}&source=${encodeURIComponent(sourcePath)}`;
}

export function getEntityThumbnailUrl(entity) {
  const thumbUrl = normalizeMediaUrl(
    entity?.image?.thumb?.url || entity?.image?.thumb?.storagePath,
  );
  if (thumbUrl) return thumbUrl;

  const sourceUrl = normalizeMediaUrl(
    entity?.image?.display?.url ||
      entity?.image?.display?.storagePath ||
      entity?.image?.original?.url ||
      entity?.image?.original?.storagePath ||
      entity?.image?.url ||
      entity?.imagePath,
  );
  return getOnDemandImageDerivativeUrl(sourceUrl, 'thumb');
}

export function getEntityPreviewImageUrl(entity) {
  const displayUrl = normalizeMediaUrl(
    entity?.image?.display?.url || entity?.image?.display?.storagePath,
  );
  if (displayUrl) return displayUrl;

  const sourceUrl = normalizeMediaUrl(
    entity?.image?.original?.url ||
      entity?.image?.original?.storagePath ||
      entity?.image?.thumb?.url ||
      entity?.image?.thumb?.storagePath ||
      entity?.image?.url ||
      entity?.imagePath,
  );
  return getOnDemandImageDerivativeUrl(sourceUrl, 'display');
}

export function getItemThumbnailUrl(item) {
  return getEntityThumbnailUrl(item);
}

export function getItemPreviewImageUrl(item) {
  return getEntityPreviewImageUrl(item);
}

export function getBoxThumbnailUrl(box) {
  return getEntityThumbnailUrl(box);
}

export function getBoxPreviewImageUrl(box) {
  return getEntityPreviewImageUrl(box);
}

export function getItemOriginalImageUrl(item) {
  const variants = [item?.image?.original, item?.image?.display, item?.image?.thumb];

  for (const variant of variants) {
    const url = normalizeMediaUrl(variant?.url || variant?.storagePath);
    if (url) return url;
  }

  return normalizeMediaUrl(item?.imagePath);
}

export function getItemTinyThumbnailUrl(item) {
  return normalizeMediaUrl(item?.image?.tiny?.url || item?.image?.tiny?.storagePath);
}

export function getItemMicroThumbnailUrl(item) {
  return getItemTinyThumbnailUrl(item) || getItemThumbnailUrl(item);
}
