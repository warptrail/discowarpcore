import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { dirname, resolve } from 'node:path';

export function atomicWriteFile(path, value, options = {}) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temporary, value, typeof options === 'number' ? { mode: options } : options);
  renameSync(temporary, path);
}

export function atomicWriteJson(path, value) {
  atomicWriteFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function safeReadJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

export function stripAnsi(value) {
  return String(value ?? '').replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
}

const SECRET_KEY = /(token|secret|password|passwd|authorization|cookie|api[-_]?key|private[-_]?key)/i;

function redactString(value, context = {}) {
  let output = String(value);
  const projectRoot = context.projectRoot ? resolve(context.projectRoot) : '';
  const home = os.homedir();
  if (projectRoot) output = output.split(projectRoot).join('$PROJECT_ROOT');
  if (home) output = output.split(home).join('$HOME');
  output = output.replace(/\/Volumes\/[^/\s]+/g, '$VOLUME');
  output = output.replace(/([?&](?:token|key|secret|password|auth)=)[^&\s]+/gi, '$1[REDACTED]');
  output = output.replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+/gi, '$1[REDACTED]');
  output = output.replace(/(mongodb(?:\+srv)?:\/\/[^:\s/]+:)[^@\s/]+@/gi, '$1[REDACTED]@');
  return output;
}

export function redactValue(value, context = {}, key = '') {
  if (SECRET_KEY.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((item) => redactValue(item, context));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      entryKey === 'env' && entryValue && typeof entryValue === 'object'
        ? Object.fromEntries(Object.keys(entryValue).map((envKey) => [envKey, '[VALUE REDACTED]']))
        : redactValue(entryValue, context, entryKey),
    ]));
  }
  return typeof value === 'string' ? redactString(value, context) : value;
}
