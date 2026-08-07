import {
  appendFileSync,
  existsSync,
  readFileSync,
  renameSync,
  statSync,
} from 'node:fs';
import { stripAnsi } from './persistence.mjs';

export const MAX_LOG_BYTES = 5 * 1024 * 1024;
export const RETAINED_LOGS = 3;

export function rotateLog(path, force = false) {
  if (!existsSync(path)) return false;
  if (!force && statSync(path).size < MAX_LOG_BYTES) return false;
  for (let index = RETAINED_LOGS; index >= 1; index -= 1) {
    const source = index === 1 ? path : `${path}.${index - 1}`;
    const destination = `${path}.${index}`;
    if (existsSync(source)) renameSync(source, destination);
  }
  return true;
}

export function appendLogEntries(path, entries) {
  if (!entries.length) return;
  rotateLog(path);
  appendFileSync(path, `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`);
}

export function readLogEntries(path, options = {}) {
  if (!existsSync(path)) return [];
  const limit = Math.max(1, Number(options.limit) || 200);
  const runId = options.runId || '';
  return readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try {
      const entry = JSON.parse(line);
      return !runId || entry.runId === runId ? [entry] : [];
    } catch { return []; }
  }).slice(-limit);
}

export function createLineCollector({ stream, runId, onEntries, nextSequence }) {
  let pending = '';
  const emit = (lines) => {
    const entries = lines.filter((line) => line.length > 0).map((raw) => ({
      message: stripAnsi(raw),
      raw,
      stream,
      runId,
      capturedAt: Date.now(),
      sequence: nextSequence(),
    }));
    if (entries.length) onEntries(entries);
  };
  return {
    write(chunk) {
      pending += chunk.toString();
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || '';
      emit(lines);
    },
    flush() {
      if (pending) emit([pending]);
      pending = '';
    },
  };
}

