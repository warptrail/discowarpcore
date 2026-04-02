const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const { INTAKE_ROOT } = require('../../scripts/intakeWorkspace');

const uploadRoot = path.join(INTAKE_ROOT, '_uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(String(file.originalname || ''));
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 1000,
    fileSize: 20 * 1024 * 1024,
  },
});

function uploadIntakeBatchAssets(req, res, next) {
  return upload.fields([
    { name: 'images', maxCount: 1000 },
    { name: 'jsonFile', maxCount: 1 },
    { name: 'csvFile', maxCount: 1 },
    { name: 'collageFile', maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({
      ok: false,
      error: error?.message || 'Failed to upload intake batch assets.',
    });
  });
}

module.exports = {
  uploadIntakeBatchAssets,
};
