#!/usr/bin/env node

// Tarot's zero-dependency LAN host for a plain index.html project.
// It is deliberately small: a development convenience, not a production server.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  const inline = args.find((argument) => argument.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : fallback;
};

const root = resolve(valueAfter('--root', '.'));
const host = valueAfter('--host', '0.0.0.0');
const port = Number(valueAfter('--port', '8000'));
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Tarot static server needs a valid --port.');
if (!existsSync(resolve(root, 'index.html'))) throw new Error(`Tarot static server needs index.html in ${root}.`);

function candidatePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl || '/', 'http://tarot.local').pathname);
  const relativePath = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^[/\\]+/, '');
  const candidate = resolve(root, relativePath);
  return candidate === root || candidate.startsWith(`${root}${sep}`) ? candidate : null;
}

const server = createServer((request, response) => {
  let filePath;
  try { filePath = candidatePath(request.url); } catch { filePath = null; }
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    const isClientRoute = !extname(String(request.url || '').split('?')[0]);
    if (isClientRoute) {
      const indexPath = resolve(root, 'index.html');
      response.writeHead(200, { 'content-type': mimeTypes['.html'] });
      createReadStream(indexPath).pipe(response);
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream' });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Tarot static site ready at http://${host}:${port}/ (root: ${root})`);
});

const close = () => server.close(() => process.exit(0));
process.once('SIGINT', close);
process.once('SIGTERM', close);
