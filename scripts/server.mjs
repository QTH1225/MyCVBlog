import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pdf': 'application/pdf' };

function build() {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/build.mjs')], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Build failed. Check the content file.');
}
build();
let timer;
const scheduleBuild = () => {
  clearTimeout(timer);
  timer = setTimeout(() => { try { build(); } catch (error) { console.error(error.message); } }, 150);
};
const watchers = ['src', 'notes', 'assets', 'assets/images'].map(directory => watch(path.join(root, directory), scheduleBuild));

const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let filename = path.resolve(directory, '.' + pathname);
    if (filename !== directory && !filename.startsWith(directory + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
    if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    const body = await readFile(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': body.length });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const status = error instanceof URIError ? 400 : 404;
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(status === 400 ? 'Invalid URL' : 'Page not found');
  }
});
server.on('error', (error) => { console.error(error.message); watchers.forEach(watcher => watcher.close()); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}\nEdit src/, notes/*.md, or assets/images/, then refresh your browser.`));
function close() { watchers.forEach(watcher => watcher.close()); clearTimeout(timer); server.close(); }
process.on('SIGINT', close);
process.on('SIGTERM', close);
