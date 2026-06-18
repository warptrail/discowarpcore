const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const { INTAKE_ROOT } = require('../../scripts/intakeWorkspace');

const uploadRoot = path.join(INTAKE_ROOT, '_uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(uploadRoot, { recursive: true });
      cb(null, uploadRoot);
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(String(file.originalname || ''));
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const assetUpload = multer({
  storage,
  limits: {
    files: 1000,
    fileSize: 20 * 1024 * 1024,
  },
});

const packageUpload = multer({
  storage,
  limits: {
    files: 1,
    fileSize: 500 * 1024 * 1024,
  },
});

const simpleJsonUpload = multer({
  storage,
  limits: {
    files: 1,
    fileSize: 2 * 1024 * 1024,
  },
});

function uploadIntakeBatchAssets(req, res, next) {
  return assetUpload.fields([
    { name: 'images', maxCount: 1000 },
    { name: 'jsonFile', maxCount: 1 },
    { name: 'csvFile', maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({
      ok: false,
      error: error?.message || 'Failed to upload intake batch assets.',
    });
  });
}

function uploadIntakeBatchPackage(req, res, next) {
  return packageUpload.single('packageFile')(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({
      ok: false,
      error: error?.message || 'Failed to upload intake batch package.',
    });
  });
}

function uploadSimpleIntakeBatchJson(req, res, next) {
  return simpleJsonUpload.single('jsonFile')(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({
      ok: false,
      error: error?.message || 'Failed to upload simple intake JSON.',
    });
  });
}

module.exports = {
  uploadIntakeBatchAssets,
  uploadIntakeBatchPackage,
  uploadSimpleIntakeBatchJson,
};
