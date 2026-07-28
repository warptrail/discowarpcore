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

export function getItemThumbnailUrl(item) {
  const variants = [item?.image?.thumb, item?.image?.display, item?.image?.original];

  for (const variant of variants) {
    const url = normalizeMediaUrl(variant?.url || variant?.storagePath);
    if (url) return url;
  }

  return normalizeMediaUrl(item?.imagePath);
}
