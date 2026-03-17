const DEFAULT_MAX_DIMENSION = 1200;
const DEFAULT_JPEG_QUALITY = 0.9;

const OUTPUT_EXT_BY_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function resolveOutputType(inputType, preferredType) {
  if (preferredType && OUTPUT_EXT_BY_TYPE[preferredType]) return preferredType;
  if (inputType === 'image/png') return 'image/png';
  if (inputType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function buildOutputName(originalName = 'image', outputType) {
  const ext = OUTPUT_EXT_BY_TYPE[outputType] || '.jpg';
  const base = String(originalName || 'image').replace(/\.[^/.]+$/, '') || 'image';
  return `${base}-square${ext}`;
}

function loadImageFromObjectUrl(objectUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode selected image.'));
    img.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export processed image.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function cropImageToSquare(file, options = {}) {
  if (!file) throw new Error('No image file selected.');
  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  const maxDimension = Number.isFinite(options.maxDimension)
    ? Math.max(1, Math.floor(options.maxDimension))
    : DEFAULT_MAX_DIMENSION;
  const outputType = resolveOutputType(file.type, options.outputType);
  const jpegQuality = Number.isFinite(options.jpegQuality)
    ? options.jpegQuality
    : DEFAULT_JPEG_QUALITY;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const width = image.naturalWidth || image.width || 0;
    const height = image.naturalHeight || image.height || 0;
    if (!width || !height) {
      throw new Error('Image has invalid dimensions.');
    }

    const squareSize = Math.min(width, height);
    if (squareSize < 1) {
      throw new Error('Image is too small to crop.');
    }

    const cropX = Math.floor((width - squareSize) / 2);
    const cropY = Math.floor((height - squareSize) / 2);
    const targetSize = Math.min(squareSize, maxDimension);

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas is unavailable for image processing.');
    }

    ctx.drawImage(
      image,
      cropX,
      cropY,
      squareSize,
      squareSize,
      0,
      0,
      targetSize,
      targetSize,
    );

    const blob = await canvasToBlob(
      canvas,
      outputType,
      outputType === 'image/jpeg' ? jpegQuality : undefined,
    );

    return new File([blob], buildOutputName(file.name, outputType), {
      type: outputType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default cropImageToSquare;
