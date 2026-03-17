const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const {
  MEDIA_ROOT,
  ALLOWED_IMAGE_MIME_TO_EXT,
  UPLOAD_LIMITS,
} = require('../config/media');

function createSingleImageUpload({ destinationSubdir }) {
  const destination = path.join(MEDIA_ROOT, destinationSubdir);
  const maxFileSizeBytes = UPLOAD_LIMITS.maxFileSizeBytes;

  function fileFilter(_req, file, cb) {
    if (!ALLOWED_IMAGE_MIME_TO_EXT[file.mimetype]) {
      cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF.'));
      return;
    }
    cb(null, true);
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      const ext =
        ALLOWED_IMAGE_MIME_TO_EXT[file.mimetype] ||
        path.extname(file.originalname) ||
        '';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSizeBytes, files: 1 },
  });

  function middleware(req, res, next) {
    upload.single('image')(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          ok: false,
          error: `Image too large. Max ${maxFileSizeBytes} bytes.`,
        });
      }
      return res
        .status(400)
        .json({ ok: false, error: err.message || 'Upload failed' });
    });
  }

  return { middleware, maxFileSizeBytes };
}

module.exports = {
  createSingleImageUpload,
};
