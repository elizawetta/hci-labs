import './build.mjs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = '/hci-labs/';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.md': 'text/markdown; charset=utf-8' };
const server = createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  if (pathname === '/' || pathname === '/hci-labs') {
    response.writeHead(302, { Location: base }).end();
    return;
  }
  if (!pathname.startsWith(base)) {
    response.writeHead(404).end('Not found');
    return;
  }
  const relative = pathname.slice(base.length);
  if (relative.split('/').some(part => part.startsWith('.')) || !/^(?:$|index\.html$|(?:lab-1|lab-2|essay)(?:\/|$)|assets\/|reports\/)/.test(relative)) {
    response.writeHead(404).end('Not found');
    return;
  }
  let target = path.resolve(root, relative);
  if (target !== path.resolve(root) && !target.startsWith(root)) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    if ((await stat(target)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        response.writeHead(302, { Location: pathname + '/' }).end();
        return;
      }
      target = path.join(target, 'index.html');
    }
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
});
server.listen(4317, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4317/hci-labs/'));
