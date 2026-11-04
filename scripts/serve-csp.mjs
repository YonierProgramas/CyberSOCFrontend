// Servidor estático SOLO de pruebas locales con Node ya autorizado.
// No emula Cloudflare: F debe comprobar sus cabeceras HTTP reales.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..', 'dist');
const headerFile = await readFile(path.join(root, '_headers'), 'utf8');
const headers = Object.fromEntries(
  headerFile
    .split(/\r?\n/)
    .filter((line) => /^\s+\S+:/.test(line))
    .map((line) => {
      const colon = line.indexOf(':');
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    }),
);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1:4173').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) {
      response.writeHead(400).end();
      return;
    }
    if (pathname === '/_headers' || pathname === '/_redirects') {
      response.writeHead(404).end();
      return;
    }
    try {
      if (!(await stat(file)).isFile()) file = path.join(root, 'index.html');
    } catch {
      file = path.join(root, 'index.html');
    }
    const content = await readFile(file);
    response.writeHead(200, {
      ...headers,
      'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(400).end();
  }
}).listen(4173, '127.0.0.1', () => console.log('Prueba estática con CSP en http://127.0.0.1:4173'));
