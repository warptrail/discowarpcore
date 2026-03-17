const { MEDIA_URL_BASE } = require('../config/media');

function buildEmptyImageMetadata() {
  return {
    originalName: '',
    uploadedAt: null,
    original: {
      storagePath: '',
      url: '',
      mimeType: '',
      width: null,
      height: null,
      sizeBytes: null,
    },
    display: {
      storagePath: '',
      url: '',
      mimeType: '',
      width: null,
      height: null,
      sizeBytes: null,
    },
    thumb: {
      storagePath: '',
      url: '',
      mimeType: '',
      width: null,
      height: null,
      sizeBytes: null,
    },
  };
}

function storagePathFromMediaUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  const marker = `${MEDIA_URL_BASE}/`;
  const index = url.indexOf(marker);
  if (index === -1) return '';
  return url.slice(index + marker.length);
}

function collectImageStoragePaths(entity) {
  const paths = new Set();
  const image = entity?.image || {};

  const push = (value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim().replace(/^\/+/, '');
    if (!trimmed) return;
    paths.add(trimmed);
  };

  push(image?.original?.storagePath);
  push(image?.display?.storagePath);
  push(image?.thumb?.storagePath);

  // Legacy single-image shape fallback.
  push(image?.storagePath);
  push(storagePathFromMediaUrl(image?.url));
  push(storagePathFromMediaUrl(entity?.imagePath));

  return [...paths];
}

module.exports = {
  buildEmptyImageMetadata,
  storagePathFromMediaUrl,
  collectImageStoragePaths,
};
