const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const {
  MEDIA_ROOT,
  ITEM_MEDIA_SUBDIRS,
  ALLOWED_IMAGE_MIME_TO_EXT,
  UPLOAD_LIMITS,
} = require('../config/media');

const ITEM_ORIGINAL_DIR = path.join(MEDIA_ROOT, ITEM_MEDIA_SUBDIRS.original);
const MAX_FILE_SIZE_BYTES = UPLOAD_LIMITS.maxFileSizeBytes;

function fileFilter(_req, file, cb) {
  if (!ALLOWED_IMAGE_MIME_TO_EXT[file.mimetype]) {
    cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF.'));
    return;
  }
  cb(null, true);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ITEM_ORIGINAL_DIR),
  filename: (_req, file, cb) => {
    const ext =
      ALLOWED_IMAGE_MIME_TO_EXT[file.mimetype] ||
      path.extname(file.originalname) ||
      '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const uploadItemImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

function uploadSingleItemImage(req, res, next) {
  uploadItemImage.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        ok: false,
        error: `Image too large. Max ${MAX_FILE_SIZE_BYTES} bytes.`,
      });
    }
    return res.status(400).json({ ok: false, error: err.message || 'Upload failed' });
  });
}

module.exports = {
  uploadSingleItemImage,
  MAX_FILE_SIZE_BYTES,
};
