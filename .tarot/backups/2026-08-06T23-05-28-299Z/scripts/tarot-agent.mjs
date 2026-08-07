#!/usr/bin/env node

// The agent is deliberately tiny: the portable Dock remains the single
// lifecycle implementation, while this stable entrypoint makes that
// implementation available without an interactive terminal.
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dock = resolve(root, 'scripts/tarot-dock.mjs');
const child = spawn(process.execPath, [dock, 'agent', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
});

child.once('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
