import net from 'node:net';
import { randomUUID } from 'node:crypto';

export const MAX_IPC_BYTES = 1024 * 1024;

export function requestJsonLine(socketPath, message, timeoutMs = 5000) {
  const requestId = message.requestId || randomUUID();
  return new Promise((resolve, reject) => {
    const client = net.createConnection(socketPath);
    let body = '';
    const timer = setTimeout(() => client.destroy(new Error('Tarot agent request timed out.')), timeoutMs);
    const finish = (error, value) => {
      clearTimeout(timer);
      if (error) reject(error); else resolve(value);
    };
    client.once('error', (error) => finish(error));
    client.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_IPC_BYTES) client.destroy(new Error('Tarot agent response exceeded 1 MB.'));
    });
    client.once('end', () => {
      try { finish(null, JSON.parse(body.trim())); } catch { finish(new Error('Tarot agent returned invalid JSON.')); }
    });
    client.once('connect', () => client.write(`${JSON.stringify({ ...message, requestId })}\n`));
  });
}

export function attachJsonLineHandler(connection, handler) {
  let body = '';
  connection.on('data', async (chunk) => {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_IPC_BYTES) {
      connection.end(`${JSON.stringify({ ok: false, error: 'Tarot request exceeded 1 MB.' })}\n`);
      return;
    }
    const newline = body.indexOf('\n');
    if (newline < 0) return;
    const line = body.slice(0, newline);
    body = '';
    try {
      const request = JSON.parse(line);
      const response = await handler(request);
      connection.end(`${JSON.stringify({ requestId: request.requestId || null, ...response })}\n`);
    } catch (error) {
      connection.end(`${JSON.stringify({ ok: false, error: error.message })}\n`);
    }
  });
}
