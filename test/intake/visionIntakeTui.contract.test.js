const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const {
  createBatchWorkspace,
  createVisionBatchId,
  readBatchState,
  updateBatchState,
} = require('../../scripts/vision-intake-tui/batchState');
const {
  buildPreprocessCommand,
  buildVisionCommand,
} = require('../../scripts/vision-intake-tui/commandRunner');
const {
  ensureIntakeDirs,
  getIntakePaths,
  listImageFiles,
} = require('../../scripts/vision-intake-tui/intakePaths');
const {
  archiveFailedBatch,
  buildPromptPullCommand,
  copyToClipboard,
  copyToRemoteMacClipboard,
  copyToTerminalClipboard,
  isSshSession,
  resolveDefaultObjectGlowRepo,
  scpPromptIfConfigured,
} = require('../../scripts/vision-intake-tui/intakePipeline');
const {
  ensureDestinationBox,
  normalizeTuiBoxNumber,
} = require('../../scripts/vision-intake-tui/boxProvisioning');
const {
  checkApiHealth,
  DEFAULT_API_BASE,
  isLocalhostApiBase,
  normalizeApiBase,
  printApiConfig,
  resolveApiConfig,
} = require('../../scripts/vision-intake-tui/apiConfig');
const {
  askText,
} = require('../../scripts/vision-intake-tui/tuiPrompts');
const {
  validateArtifacts,
} = require('../../scripts/build_vision_intake_batch');

async function makeTempRoot(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-vision-tui-'));
  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });
  return root;
}

test('createVisionBatchId creates timestamped slug ids', () => {
  const id = createVisionBatchId('Garage Shelf!', new Date(2026, 4, 20, 12, 34, 56));
  assert.equal(id, 'batch_20260520123456_garage_shelf');
});

test('ensureIntakeDirs creates durable intake folder model', async (t) => {
  const root = await makeTempRoot(t);
  const paths = await ensureIntakeDirs(root);

  for (const key of ['inbox', 'processing', 'completed', 'failed', 'exports']) {
    const stats = await fs.stat(paths[key]);
    assert.equal(stats.isDirectory(), true);
  }
});

test('createBatchWorkspace moves inbox images and writes resumable batch state', async (t) => {
  const root = await makeTempRoot(t);
  const paths = await ensureIntakeDirs(root);
  await fs.writeFile(path.join(paths.inbox, 'IMG_1.png'), 'image', 'utf8');
  await fs.writeFile(path.join(paths.inbox, 'notes.txt'), 'ignore', 'utf8');

  const images = await listImageFiles(paths.inbox);
  const { batch } = await createBatchWorkspace({
    intakePaths: paths,
    batchName: 'Garage Shelf',
    destination: { location: 'garage', box: '701' },
    importMode: 'export',
    inboxImages: images,
  });

  const saved = await readBatchState(batch.paths.root);
  assert.equal(saved.batchName, 'Garage Shelf');
  assert.equal(saved.destination.location, 'garage');
  assert.equal(saved.destination.box, '701');
  assert.equal(saved.counts.rawImages, 1);
  assert.equal((await listImageFiles(paths.inbox)).length, 0);
  assert.equal((await listImageFiles(saved.paths.raw)).length, 1);

  const updated = await updateBatchState(saved.paths.root, {
    status: 'awaiting_annotation',
    counts: { jsonArtifacts: 1 },
  });
  assert.equal(updated.status, 'awaiting_annotation');
  assert.equal(updated.counts.rawImages, 1);
  assert.equal(updated.counts.jsonArtifacts, 1);
});

test('normalizeTuiBoxNumber accepts only optional exact 3-digit box numbers', () => {
  assert.equal(normalizeTuiBoxNumber('701'), '701');
  assert.equal(normalizeTuiBoxNumber(' 001 '), '001');
  assert.equal(normalizeTuiBoxNumber(''), '');
  assert.throws(() => normalizeTuiBoxNumber('71'), /exactly 3 digits/);
  assert.throws(() => normalizeTuiBoxNumber('box 701'), /exactly 3 digits/);
});

test('vision TUI API config defaults to localhost development target', () => {
  const config = resolveApiConfig({});
  assert.equal(config.apiBase, DEFAULT_API_BASE);
  assert.equal(config.source, 'development default');
  assert.equal(config.productionMode, false);
  assert.equal(config.warnings.some((warning) => /localhost/i.test(warning)), true);
});

test('vision TUI API config normalizes DISCO_API_BASE and detects localhost', () => {
  const config = resolveApiConfig({
    DISCO_API_BASE: ' http://living-room-server.local:5002/ ',
  });

  assert.equal(config.apiBase, 'http://living-room-server.local:5002');
  assert.equal(config.source, 'DISCO_API_BASE');
  assert.equal(config.warnings.some((warning) => /localhost/i.test(warning)), false);
  assert.equal(isLocalhostApiBase('http://localhost:5002'), true);
  assert.equal(isLocalhostApiBase('http://127.0.0.1:5002'), true);
  assert.equal(isLocalhostApiBase('http://living-room-server.local:5002'), false);
  assert.equal(normalizeApiBase('http://dwc.local:5002///'), 'http://dwc.local:5002');
});

test('vision TUI API config fails fast when production target is missing', () => {
  assert.throws(
    () => resolveApiConfig({ DISCO_ENV: 'production' }),
    /DISCO_API_BASE/
  );
});

test('vision TUI API config supports legacy DWC_API_BASE with warning outside production', () => {
  const config = resolveApiConfig({
    DWC_API_BASE: 'http://legacy.local:5002/',
  });

  assert.equal(config.apiBase, 'http://legacy.local:5002');
  assert.equal(config.source, 'DWC_API_BASE');
  assert.equal(config.warnings.some((warning) => /deprecated/i.test(warning)), true);
});

test('printApiConfig emits current target and warnings', () => {
  const lines = [];
  const warnings = [];
  printApiConfig(
    {
      apiBase: 'http://localhost:5002',
      source: 'DISCO_API_BASE',
      warnings: ['API target is localhost.'],
    },
    {
      log(message) {
        lines.push(message);
      },
      warn(message) {
        warnings.push(message);
      },
    }
  );

  assert.deepEqual(lines, ['API target: http://localhost:5002 (DISCO_API_BASE)']);
  assert.deepEqual(warnings, ['Warning: API target is localhost.']);
});

test('checkApiHealth requests backend health endpoint', async () => {
  const calls = [];
  const result = await checkApiHealth('http://dwc.local:5002/', {
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        async json() {
          return { ok: true };
        },
      };
    },
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://dwc.local:5002/api/health');
  assert.deepEqual(calls[0].options, { headers: { Accept: 'application/json' } });
});

test('askText reprompts until destination box id validation passes', async () => {
  const answers = ['71', 'box 701', '701'];
  const originalLog = console.log;
  const rl = {
    async question() {
      return answers.shift();
    },
  };

  let value = '';
  try {
    console.log = () => {};
    value = await askText(rl, 'Destination box id (optional)', {
      optional: true,
      validate: normalizeTuiBoxNumber,
    });
  } finally {
    console.log = originalLog;
  }

  assert.equal(value, '701');
  assert.equal(answers.length, 0);
});

test('ensureDestinationBox creates a missing destination box through existing box API', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (calls.length === 1) {
      return {
        ok: false,
        status: 404,
        async json() {
          return { ok: false, error: 'Box not found' };
        },
      };
    }
    return {
      ok: true,
      status: 201,
      async json() {
        return { _id: 'mongo-777', box_id: '777', label: 'Box 777' };
      },
    };
  };

  const result = await ensureDestinationBox({
    box: '777',
    location: 'garage',
    apiBase: 'http://dwc.local/',
    fetchImpl,
  });

  assert.equal(result.created, true);
  assert.equal(result.boxNumber, '777');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'http://dwc.local/api/boxes/resolve-short-id/777');
  assert.equal(calls[1].url, 'http://dwc.local/api/boxes');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    box_id: '777',
    label: 'Box 777',
    location: 'garage',
  });
});

test('archiveFailedBatch marks and moves a failed processing batch', async (t) => {
  const root = await makeTempRoot(t);
  const paths = await ensureIntakeDirs(root);
  await fs.writeFile(path.join(paths.inbox, 'IMG_1.png'), 'image', 'utf8');
  const images = await listImageFiles(paths.inbox);
  const { batch } = await createBatchWorkspace({
    intakePaths: paths,
    batchName: 'Garage Shelf',
    destination: { location: 'garage', box: '701' },
    importMode: 'direct',
    inboxImages: images,
  });
  const packaged = await updateBatchState(batch.paths.root, {
    archivePath: path.join(batch.paths.package, 'stale.zip'),
  });

  const originalRoot = packaged.paths.root;
  const archived = await archiveFailedBatch(
    packaged,
    paths,
    new Error('Backend import did not complete successfully.'),
    'importing'
  );

  await assert.rejects(fs.stat(originalRoot));
  assert.equal(path.dirname(archived.paths.root), paths.failed);
  const saved = await readBatchState(archived.paths.root);
  assert.equal(saved.status, 'failed');
  assert.equal(saved.pipelineStage, 'importing');
  assert.match(saved.lastError, /Backend import/);
  assert.equal(saved.archivePath, null);
});

test('command builders compose existing script calls with batch paths', () => {
  const preprocess = buildPreprocessCommand({
    rawDir: '/tmp/raw',
    processedDir: '/tmp/processed',
  });
  assert.equal(preprocess.command, process.execPath);
  assert.deepEqual(preprocess.args.slice(0, 5), [
    'scripts/preprocess_vision_images.js',
    '--source-dir',
    '/tmp/raw',
    '--output-dir',
    '/tmp/processed',
  ]);

  const vision = buildVisionCommand({
    mode: 'validate',
    sourceDir: '/tmp/processed',
    artifactsDir: '/tmp/item_artifacts',
    batchName: 'Garage Shelf',
    location: 'garage',
    box: '701',
  });
  assert.equal(vision.command, process.execPath);
  assert.deepEqual(vision.args, [
    'scripts/build_vision_intake_batch.js',
    '--validate',
    '--source-dir',
    '/tmp/processed',
    '--batch-label',
    'Garage Shelf',
    '--artifacts-dir',
    '/tmp/item_artifacts',
    '--location',
    'garage',
    '--box',
    '701',
  ]);
});

test('default ObjectGlow repo resolves to an available known checkout', async () => {
  const repo = await resolveDefaultObjectGlowRepo();
  assert.equal(typeof repo, 'string');
  assert.notEqual(repo.length, 0);
  assert.match(repo, /objectiglow$/);
});

test('terminal clipboard copy emits OSC 52 base64 payload', () => {
  let written = '';
  const stream = {
    isTTY: true,
    write(chunk) {
      written += chunk;
    },
  };

  assert.equal(copyToTerminalClipboard('hello', stream), true);
  assert.equal(written, '\u001b]52;c;aGVsbG8=\u0007\u001b]52;c;aGVsbG8=\u001b\\');
});

test('clipboard copy prefers terminal escape in SSH sessions', async () => {
  let written = '';
  const result = await copyToClipboard('hello', {
    env: { SSH_TTY: '/dev/ttys001' },
    stream: {
      isTTY: true,
      write(chunk) {
        written += chunk;
      },
    },
  });

  assert.equal(isSshSession({ SSH_CONNECTION: 'client server' }), true);
  assert.equal(isSshSession({}), false);
  assert.deepEqual(result, { copied: true, method: 'terminal' });
  assert.equal(written, '\u001b]52;c;aGVsbG8=\u0007\u001b]52;c;aGVsbG8=\u001b\\');
});

test('clipboard copy can pipe prompt to MacBook pbcopy over SSH', async () => {
  const calls = [];
  let piped = '';
  const result = await copyToRemoteMacClipboard('hello', {
    env: {
      DISCO_PROMPT_CLIPBOARD_SSH_TARGET: 'zephyr@macbook.local',
    },
    spawnImpl(command, args, options) {
      calls.push({ command, args, options });
      return {
        stdin: {
          end(value) {
            piped = value;
          },
        },
        stderr: {
          on() {},
        },
        on(event, handler) {
          if (event === 'close') setImmediate(() => handler(0));
        },
        kill() {},
      };
    },
  });

  assert.deepEqual(calls, [{
    command: 'ssh',
    args: ['-o', 'BatchMode=yes', 'zephyr@macbook.local', 'pbcopy'],
    options: { stdio: ['pipe', 'ignore', 'pipe'] },
  }]);
  assert.equal(piped, 'hello');
  assert.deepEqual(result, {
    attempted: true,
    copied: true,
    method: 'ssh-pbcopy',
    target: 'zephyr@macbook.local',
  });
});

test('configured MacBook pbcopy over SSH takes priority over terminal escape copy', async () => {
  let wroteTerminalEscape = false;
  const result = await copyToClipboard('hello', {
    env: {
      SSH_TTY: '/dev/ttys001',
      DISCO_PROMPT_CLIPBOARD_SSH_TARGET: 'zephyr@macbook.local',
    },
    stream: {
      write() {
        wroteTerminalEscape = true;
      },
    },
    spawnImpl() {
      return {
        stdin: { end() {} },
        stderr: { on() {} },
        on(event, handler) {
          if (event === 'close') setImmediate(() => handler(0));
        },
        kill() {},
      };
    },
  });

  assert.equal(wroteTerminalEscape, false);
  assert.equal(result.method, 'ssh-pbcopy');
});

test('prompt pull command targets the TUI host with shell-safe path quoting', () => {
  const command = buildPromptPullCommand("/Users/zephyr/Intake/processing/batch O'Hara/CODEX_AGENT_PROMPT.md", {
    env: {
      USER: 'zephyr',
      DISCO_PROMPT_PULL_HOST: 'quantumzephyr.local',
    },
  });

  assert.equal(
    command,
    "scp zephyr@quantumzephyr.local:'/Users/zephyr/Intake/processing/batch O'\\''Hara/CODEX_AGENT_PROMPT.md' ~/Desktop/"
  );
});

test('prompt scp is skipped unless DISCO_PROMPT_SCP_TARGET is configured', async () => {
  const result = await scpPromptIfConfigured('/tmp/CODEX_AGENT_PROMPT.md', {
    env: {},
    spawnImpl() {
      throw new Error('spawn should not be called');
    },
  });

  assert.deepEqual(result, { attempted: false, ok: false, target: '' });
});

test('prompt scp uses configured target before annotation pause', async () => {
  const calls = [];
  const resultPromise = scpPromptIfConfigured('/tmp/CODEX_AGENT_PROMPT.md', {
    env: {
      DISCO_PROMPT_SCP_TARGET: 'zephyr@macbook.local:~/Desktop/',
    },
    spawnImpl(command, args, options) {
      calls.push({ command, args, options });
      return {
        on(event, handler) {
          if (event === 'close') setImmediate(() => handler(0));
        },
        kill() {},
      };
    },
  });
  const result = await resultPromise;

  assert.deepEqual(calls, [{
    command: 'scp',
    args: ['/tmp/CODEX_AGENT_PROMPT.md', 'zephyr@macbook.local:~/Desktop/'],
    options: { stdio: ['inherit', 'inherit', 'inherit'] },
  }]);
  assert.deepEqual(result, {
    attempted: true,
    ok: true,
    target: 'zephyr@macbook.local:~/Desktop/',
  });
});

test('validateArtifacts reports missing names and mismatched image keys', async (t) => {
  const root = await makeTempRoot(t);
  const sourceDir = path.join(root, 'processed');
  const artifactsDir = path.join(root, 'item_artifacts');
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(artifactsDir, { recursive: true });
  await fs.writeFile(path.join(sourceDir, 'IMG_1.png'), 'image', 'utf8');
  await fs.writeFile(
    path.join(artifactsDir, 'IMG_1.json'),
    JSON.stringify({ imageKey: 'WRONG', sourceFile: 'IMG_1.png', name: '' }),
    'utf8'
  );

  const result = await validateArtifacts({
    sourceDir,
    artifactsDir,
    location: '',
    box: '',
  });

  assert.equal(result.ok, false);
  assert.equal(result.totalImages, 1);
  assert.equal(result.totalArtifacts, 1);
  assert.match(result.errors.join('\n'), /mismatch|imageKey/i);
});
