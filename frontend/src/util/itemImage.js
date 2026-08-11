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

function uniqueMediaUrls(values) {
  return [...new Set(values.map((value) => {
    const raw = String(value || '').trim();
    return raw.startsWith('/api/') ? raw : normalizeMediaUrl(raw);
  }).filter(Boolean))];
}

function getEntityImageSources(entity) {
  return {
    tiny: entity?.image?.tiny?.url || entity?.image?.tiny?.storagePath,
    thumb: entity?.image?.thumb?.url || entity?.image?.thumb?.storagePath,
    display: entity?.image?.display?.url || entity?.image?.display?.storagePath,
    processed: entity?.image?.processed?.url || entity?.image?.processed?.storagePath,
    original: entity?.image?.original?.url || entity?.image?.original?.storagePath,
    legacy: entity?.image?.url || entity?.imagePath,
  };
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
  return getEntityThumbnailCandidates(entity)[0] || '';
}

export function getEntityPreviewImageUrl(entity) {
  return getEntityPreviewImageCandidates(entity)[0] || '';
}

export function getEntityThumbnailCandidates(entity) {
  const sources = getEntityImageSources(entity);
  const derivativeSource =
    sources.original || sources.processed || sources.display || sources.legacy;

  return uniqueMediaUrls([
    sources.thumb,
    getOnDemandImageDerivativeUrl(derivativeSource, 'thumb'),
    sources.display,
    sources.processed,
    sources.original,
    sources.legacy,
  ]);
}

export function getEntityPreviewImageCandidates(entity) {
  const sources = getEntityImageSources(entity);
  const derivativeSource =
    sources.original || sources.processed || sources.display || sources.legacy;

  return uniqueMediaUrls([
    sources.display,
    getOnDemandImageDerivativeUrl(derivativeSource, 'display'),
    sources.thumb,
    sources.processed,
    sources.original,
    sources.legacy,
  ]);
}

export function getItemThumbnailUrl(item) {
  return getEntityThumbnailUrl(item);
}

export function getItemPreviewImageUrl(item) {
  return getEntityPreviewImageUrl(item);
}

export function getItemThumbnailCandidates(item) {
  return getEntityThumbnailCandidates(item);
}

export function getItemPreviewImageCandidates(item) {
  return getEntityPreviewImageCandidates(item);
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

export function getItemMicroThumbnailCandidates(item) {
  return uniqueMediaUrls([
    getItemTinyThumbnailUrl(item),
    ...getItemThumbnailCandidates(item),
  ]);
}
