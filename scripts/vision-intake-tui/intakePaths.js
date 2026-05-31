const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const INTAKE_DIR_NAMES = Object.freeze({
  inbox: 'inbox',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
  exports: 'exports',
});

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

function getIntakeRoot() {
  return path.resolve(process.env.DISCO_WARP_INTAKE_ROOT || path.join(os.homedir(), 'Intake'));
}

function getIntakePaths(root = getIntakeRoot()) {
  const intakeRoot = path.resolve(root);
  return {
    root: intakeRoot,
    inbox: path.join(intakeRoot, INTAKE_DIR_NAMES.inbox),
    processing: path.join(intakeRoot, INTAKE_DIR_NAMES.processing),
    completed: path.join(intakeRoot, INTAKE_DIR_NAMES.completed),
    failed: path.join(intakeRoot, INTAKE_DIR_NAMES.failed),
    exports: path.join(intakeRoot, INTAKE_DIR_NAMES.exports),
  };
}

async function ensureIntakeDirs(root = getIntakeRoot()) {
  const paths = getIntakePaths(root);
  await Promise.all(
    Object.values(paths).map((dirPath) => fs.mkdir(dirPath, { recursive: true }))
  );
  return paths;
}

function isSupportedImageName(fileName) {
  return SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(String(fileName || '')).toLowerCase());
}

async function listImageFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) => isSupportedImageName(entry.name))
    .map((entry) => ({
      fileName: entry.name,
      absolutePath: path.join(dirPath, entry.name),
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

async function openFolder(dirPath) {
  const { spawn } = require('child_process');
  const child = spawn('open', [dirPath], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

module.exports = {
  INTAKE_DIR_NAMES,
  SUPPORTED_IMAGE_EXTENSIONS,
  ensureIntakeDirs,
  getIntakePaths,
  getIntakeRoot,
  isSupportedImageName,
  listImageFiles,
  openFolder,
};
