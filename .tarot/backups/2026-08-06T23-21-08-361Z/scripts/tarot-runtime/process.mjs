import { createHash } from 'node:crypto';

export function commandFingerprint(command) {
  return createHash('sha256').update(JSON.stringify({ command: command.command, args: command.args, cwd: command.cwd })).digest('hex');
}

export function signalProcessGroup(child, signal = 'SIGTERM') {
  if (!child?.pid) return false;
  try {
    process.kill(-child.pid, signal);
    return true;
  } catch {
    try { return child.kill(signal); } catch { return false; }
  }
}
