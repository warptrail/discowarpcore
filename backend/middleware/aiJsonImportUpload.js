const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { MEDIA_ROOT, IMPORT_MEDIA_SUBDIRS } = require('../config/media');

const IMPORT_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(MEDIA_ROOT, IMPORT_MEDIA_SUBDIRS.staging));
    },
    filename: (_req, file, cb) => {
      const rawExt = path.extname(String(file.originalname || ''));
      const ext = IMPORT_IMAGE_EXTENSIONS.has(rawExt.toLowerCase())
        ? rawExt.toLowerCase()
        : '';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(String(file.originalname || '')).toLowerCase();
    if (!IMPORT_IMAGE_EXTENSIONS.has(ext)) {
      cb(new Error('Unsupported import image type. Allowed: JPG, JPEG, PNG, WEBP, HEIC.'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 500,
  },
});

function uploadAiJsonImportImages(req, res, next) {
  if (!req.is('multipart/form-data')) {
    return next();
  }

  return upload.array('importImages')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        ok: false,
        code: 'AI_IMPORT_IMAGE_TOO_LARGE',
        error: 'Import image too large. Max 10485760 bytes per file.',
      });
    }
    return res.status(400).json({
      ok: false,
      code: 'AI_IMPORT_IMAGE_UPLOAD_FAILED',
      error: err?.message || 'Failed to upload import images.',
    });
  });
}

module.exports = {
  IMPORT_IMAGE_EXTENSIONS,
  uploadAiJsonImportImages,
};
