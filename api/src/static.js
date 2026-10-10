import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, extname, sep} from 'node:path';

const defaultRoot = fileURLToPath(new URL('../public/', import.meta.url));
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8'};

/** Lambda proxy response: base64 preserves binary assets through HTTP API v2. */
export async function serveStatic(rawPath, root = defaultRoot) {
  let pathname;
  try {pathname = decodeURIComponent(rawPath);} catch {return {statusCode: 400, body: 'Invalid path.'};}
  if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').includes('..')) return {statusCode: 400, body: 'Invalid path.'};
  const rootPath = resolve(root);
  const candidate = resolve(rootPath, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!candidate.startsWith(rootPath + sep)) return {statusCode: 400, body: 'Invalid path.'};
  let path = candidate;
  let data;
  try {data = await readFile(path);} catch (error) {
    if (!['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) throw error;
    if (extname(pathname) || pathname.startsWith('/assets/')) return {statusCode: 404, body: 'Asset not found.'};
    path = resolve(rootPath, 'index.html');
    try {data = await readFile(path);} catch {return {statusCode: 404, body: 'Frontend has not been packaged. Run npm run prepare:web before sam build.'};}
  }
  return {statusCode: 200, headers: {'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache', 'X-Content-Type-Options': 'nosniff'}, isBase64Encoded: true, body: data.toString('base64')};
}
