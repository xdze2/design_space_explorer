import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('.');
const port = Number(process.argv[2] ?? process.env.PORT ?? 8080);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = normalize(decodeURIComponent(url.pathname));
  if (path === '/') path = '/viewer/index.html';
  if (path.endsWith('/')) path += 'index.html';
  const file = join(root, path);
  if (!file.startsWith(root) || /^\/topics\/[^/]+\/raw(\/|$)/.test(path) || file.startsWith(join(root, 'node_modules'))) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(data);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`viewer: http://localhost:${port}/viewer/`));
